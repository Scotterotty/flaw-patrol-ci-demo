// Only does anything on random (hourly) runs. Wraps each test so it can fail the way
// real tests fail: a regression from a bad change or a bad merge (both picked by
// ci/pick-outcome.js), or a flaky test.

if (process.env.SIM_RANDOM) {
  const FLAKY = ["Discounts takes 10 percent off", "Cart removing one item keeps the others"];
  const FLAKY_CHANCE = 0.08;

  const crypto = require("crypto");
  function hash(text) {
    return crypto.createHash("sha256").update(String(text)).digest().readUInt32BE(0) / 4294967296;
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // The kind of failure is fixed by the seed, so a regression shows the same error each run.
  function fail(name, seed) {
    try {
      failHow(name, seed);
    } catch (e) {
      e.stack = e.matcherResult ? e.message : `${e.name}: ${e.message}`; // no code frame into this file
      throw e;
    }
  }

  function failHow(name, seed) {
    const pick = hash(name + "kind" + seed);
    if (pick < 0.55) {
      const wanted = Math.round(hash(name + "a" + seed) * 9000) / 100;
      expect(Math.round((wanted + 0.01 + hash(name + "b" + seed) * 5) * 100) / 100).toBe(wanted);
    } else if (pick < 0.85) {
      throw new TypeError("Cannot read properties of undefined (reading 'quantity')");
    } else {
      throw new Error("Expected the cart to be saved, but the save callback was never called.");
    }
  }

  // Picked by ci/pick-outcome.js: test name -> seed for how it fails.
  const failing = JSON.parse(process.env.SIM_FAIL_TESTS || "{}");

  const realTest = global.test;
  const wrapped = (name, fn, timeout) =>
    realTest(
      name,
      async () => {
        const full = expect.getState().currentTestName;
        await sleep(20 + Math.random() * Math.random() * 600); // uneven times, like real tests
        await fn();
        const seed = failing[full];
        if (seed) fail(full, seed);
        if (FLAKY.includes(full) && Math.random() < FLAKY_CHANCE) {
          await sleep(1500);
          const e = new Error("Timed out after 1500 ms waiting for the price service");
          e.stack = `Error: ${e.message}`;
          throw e;
        }
      },
      timeout,
    );
  global.test = global.it = Object.assign(wrapped, realTest);
}
