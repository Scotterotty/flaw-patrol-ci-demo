// Decides how this run goes, so the demo behaves like a real team's CI.
// Prints KEY=value lines; the workflow adds them to the job's environment.
//
//   node ci/pick-outcome.js          for the Tests workflow (Jest)
//   node ci/pick-outcome.js browser  for the Browser tests workflow (Playwright)
//
// SIMULATE comes from Run workflow's choice. Hourly scheduled runs use "random":
//   - about 2% of runs: Install fails (the npm registry times out)
//   - Tests only, about 4% each: Build fails (so no tests run), or Package fails after the tests
//   - a "bad change" lands now and then (about 1 in 4 six-hour stretches): 1 or 2 tests
//     start failing and keep failing with the same error for 2 to 5 runs, then it's "fixed"
//   - Tests: about 4% of runs, a bad merge breaks 3 to 5 tests for just that run
//   - Browser tests: about 15% of runs, a bad deploy breaks 1 or 2 tests for just that
//     run, so the browser runs don't sit green for half a day between bad changes
//   - flaky tests fail now and then for no reason (see ci/jest-setup.js and e2e/shop.spec.js)
//
// NOW_MS (a time in milliseconds) can stand in for the clock, to try out the odds.

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const which = process.argv[2] === "browser" ? "browser" : "tests";
const mode = process.env.SIMULATE || "nothing fails (normal run)";
const now = Number(process.env.NOW_MS) || Date.now();
const out = {};

// A steady number from 0 to 1 for the same text, so a bad change fails the same
// tests, the same way, on every run while it lasts.
function hash(text) {
  return crypto.createHash("sha256").update(String(text)).digest().readUInt32BE(0) / 4294967296;
}

// "Describe test" names, the same way Jest's currentTestName writes them.
function jestTestNames() {
  const names = [];
  for (const file of fs.readdirSync(path.join(__dirname, "..", "tests")).sort()) {
    const text = fs.readFileSync(path.join(__dirname, "..", "tests", file), "utf8");
    const group = (text.match(/describe\("([^"]+)"/) || [])[1];
    for (const m of text.matchAll(/\btest\("([^"]+)"/g)) names.push(`${group} ${m[1]}`);
  }
  return names;
}

// Test names from the Playwright spec, the same way test.info().title writes them.
function browserTestNames() {
  const text = fs.readFileSync(path.join(__dirname, "..", "e2e", "shop.spec.js"), "utf8");
  return [...text.matchAll(/\btest\("([^"]+)"/g)].map((m) => m[1]);
}

function pickSome(names, count, seed) {
  return names
    .map((n) => [hash(seed + n), n])
    .sort((a, b) => a[0] - b[0])
    .slice(0, count)
    .map(([, n]) => n);
}

// The bad change hitting this hour, if any. Each 6-hour stretch has about a 1 in 4
// chance of one (never two stretches in a row); it starts at a random hour and lasts
// 2 to 5 hours.
const hasBadChange = (w) => hash(`${which} bad change ${w}`) < 0.25 && !(hash(`${which} bad change ${w - 1}`) < 0.25);

function badChange() {
  const hour = Math.floor(now / 3600000);
  for (let w = Math.floor(hour / 6); w >= Math.floor(hour / 6) - 1; w--) {
    const seed = `${which} bad change ${w}`;
    if (!hasBadChange(w)) continue;
    const start = w * 6 + Math.floor(hash(seed + " start") * 6);
    const length = 2 + Math.floor(hash(seed + " length") * 4);
    if (hour >= start && hour < start + length) return seed;
  }
  return null;
}

if (mode.startsWith("random")) {
  out.SIM_RANDOM = "1";
  out.ALL_PASS = "1"; // the on-purpose failure is off; failures come from the dice instead
  if (Math.random() < 0.02) out.SIM_INSTALL_FAILS = "1";
  const bad = badChange();

  if (which === "tests") {
    if (Math.random() < 0.04) out.SIM_BUILD_FAILS = "1";
    if (Math.random() < 0.04) out.SIM_PACKAGE_FAILS = "1";
    const names = jestTestNames();
    const failing = {};
    if (bad) for (const n of pickSome(names, 1 + Math.floor(hash(bad + " count") * 2), bad)) failing[n] = bad;
    if (Math.random() < 0.04) {
      const seed = String(Math.random());
      for (const n of pickSome(names, 3 + Math.floor(Math.random() * 3), seed)) failing[n] = seed;
    }
    // Test name -> seed that fixes how it fails.
    if (Object.keys(failing).length) out.SIM_FAIL_TESTS = JSON.stringify(failing);
  } else {
    // The shop's known bug (codes only work in capitals) comes back during a bad change.
    if (bad) delete out.ALL_PASS;
    // Now and then the flaky test fails on its retry too, so the run goes red.
    if (Math.random() < 0.06) out.SIM_FLAKY_HARD = "1";
    // A bad deploy breaks 1 or 2 tests for just this run (on both tries, like a real bug).
    if (Math.random() < 0.15) {
      const seed = String(Math.random());
      const failing = {};
      for (const n of pickSome(browserTestNames(), 1 + Math.floor(Math.random() * 2), seed)) failing[n] = seed;
      out.SIM_FAIL_TESTS = JSON.stringify(failing);
    }
  }
} else if (mode === "everything passes") {
  out.ALL_PASS = "1";
} else if (mode === "packaging fails after the tests") {
  out.SIM_PACKAGE_FAILS = "1";
} else if (mode === "build fails before the tests") {
  out.SIM_BUILD_FAILS = "1";
}

for (const [k, v] of Object.entries(out)) console.log(`${k}=${v}`);
console.error(`Outcome for this run (${mode}): ${JSON.stringify(out)}`);
