// Only does anything on random (hourly) runs. Wraps each test so it can fail the way
// real tests fail: a regression from a bad change, a bad merge, or a flaky test.

if (process.env.SIM_RANDOM) {
  const FLAKY = ["Discounts takes 10 percent off", "Cart removing one item keeps the others"];
  const FLAKY_CHANCE = 0.12;

  function hash(text) {
    let h = 2166136261;
    for (const c of String(text)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return (h >>> 0) / 4294967296;
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

  const realTest = global.test;
  const wrapped = (name, fn, timeout) =>
    realTest(
      name,
      async () => {
        const full = expect.getState().currentTestName;
        await sleep(20 + Math.random() * Math.random() * 600); // uneven times, like real tests
        await fn();
        const badChange = process.env.SIM_BAD_CHANGE;
        if (badChange && hash(full + "regress" + badChange) < 0.15) fail(full, badChange);
        const badMerge = process.env.SIM_BAD_MERGE;
        if (badMerge && hash(full + "merge" + badMerge) < 0.45) fail(full, badMerge);
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
