// Decides how this run goes, so the demo behaves like a real team's CI.
// Prints KEY=value lines; the workflow adds them to the job's environment.
//
// SIMULATE comes from Run workflow's "Make part of the build fail" choice.
// Hourly scheduled runs use "random":
//   - about 2% of runs: Install fails (the npm registry times out)
//   - about 4%: Build fails, so no tests run
//   - about 4%: Package fails after the tests
//   - a "bad change" lands now and then: 1 or 2 tests start failing and keep
//     failing for a few hours in a row until someone "fixes" it
//   - about 4%: a bad merge breaks several tests for just that run
//   - 2 flaky tests fail now and then for no reason, then pass on the next run
//   - test times vary from run to run

const mode = process.env.SIMULATE || "nothing fails (normal run)";
const out = {};

// Same answer for the same text, so a "bad change" fails the same tests each hour.
function hash(text) {
  let h = 2166136261;
  for (const c of String(text)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967296;
}

if (mode.startsWith("random")) {
  out.SIM_RANDOM = "1";
  out.ALL_PASS = "1"; // the on-purpose failure is off; failures come from the dice instead
  if (Math.random() < 0.02) out.SIM_INSTALL_FAILS = "1";
  else if (Math.random() < 0.04) out.SIM_BUILD_FAILS = "1";
  if (Math.random() < 0.04) out.SIM_PACKAGE_FAILS = "1";

  // A bad change lives in a 6-hour window. About 1 window in 3 has one,
  // and it gets fixed partway through (or not until the window ends).
  const hour = Math.floor(Date.now() / 3600000);
  const window = Math.floor(hour / 6);
  if (hash("bad change " + window) < 0.35) {
    const fixedAt = window * 6 + 1 + Math.floor(hash("fixed " + window) * 8);
    if (hour < fixedAt) out.SIM_BAD_CHANGE = String(window);
  }
  if (Math.random() < 0.04) out.SIM_BAD_MERGE = String(Math.floor(Math.random() * 1e9));
} else if (mode === "everything passes") {
  out.ALL_PASS = "1";
} else if (mode === "packaging fails after the tests") {
  out.SIM_PACKAGE_FAILS = "1";
} else if (mode === "build fails before the tests") {
  out.SIM_BUILD_FAILS = "1";
}

for (const [k, v] of Object.entries(out)) console.log(`${k}=${v}`);
console.error(`Outcome for this run (${mode}): ${JSON.stringify(out)}`);
