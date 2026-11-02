// Browser tests for web/shop.html. When one fails, Playwright saves a screenshot, a video
// and a trace (a step-by-step replay) of it, for Flaw Patrol to show next to the result.
const crypto = require("crypto");
const path = require("path");
const { pathToFileURL } = require("url");
const { test, expect } = require("@playwright/test");

// On "everything passes" runs and random runs the page's known bug (codes only work in
// capitals) is fixed; on push and "nothing fails" runs it isn't.
const shop = pathToFileURL(path.join(__dirname, "..", "web", "shop.html")).href;

// Tests a random run breaks (picked by ci/pick-outcome.js): title -> seed. The seed picks
// one of the bugs that test would really trip over (see ?bug= in web/shop.html), so the
// screenshot and video show what went wrong. The same seed always picks the same bug.
const broken = JSON.parse(process.env.SIM_FAIL_TESTS || "{}");
const BUGS = {
  "adds an item to the cart": ["overlay", "crash", "price", "slow"],
  "adds the same item twice": ["overlay", "crash", "double"],
  "removes an item": ["overlay", "crash", "price", "remove"],
  "applies a discount code": ["overlay", "crash", "price", "capitals"],
  "warns about a code that doesn't exist": ["overlay", "crash", "message"],
  "updates the total after each item": ["overlay", "crash", "price", "slow"],
};

function hash(text) {
  return crypto.createHash("sha256").update(String(text)).digest().readUInt32BE(0) / 4294967296;
}

function shopUrl(title, bug) {
  if (!bug && broken[title]) {
    const choices = BUGS[title] || ["overlay"];
    bug = choices[Math.floor(hash(broken[title] + title) * choices.length)];
  }
  const params = new URLSearchParams();
  if (process.env.ALL_PASS && bug !== "capitals") params.set("fixed", "");
  if (bug && bug !== "capitals") params.set("bug", bug);
  return params.size ? `${shop}?${params}` : shop;
}

async function addToCart(page, name) {
  await page.getByRole("listitem").filter({ hasText: name }).getByRole("button", { name: "Add to cart" }).click();
}

test.describe("Shop", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // The flaky test: on random runs the total is now and then slow to update, so the
    // first try fails and the retry passes (or, with SIM_FLAKY_HARD, fails too).
    const flaky = testInfo.title === "updates the total after each item" && process.env.SIM_RANDOM &&
      (process.env.SIM_FLAKY_HARD || (testInfo.retry === 0 && Math.random() < 0.15));
    await test.step("Open the shop", () => page.goto(shopUrl(testInfo.title, flaky ? "slow" : null)));
  });

  test("adds an item to the cart", async ({ page }) => {
    await test.step("Add a Blue mug", () => addToCart(page, "Blue mug"));
    await test.step("Check the cart and total", async () => {
      await expect(page.getByLabel("Cart")).toContainText("Blue mug ×1");
      await expect(page.locator("#total")).toHaveText("$15.00");
    });
  });

  test("adds the same item twice", async ({ page }) => {
    await test.step("Add a Blue mug twice", async () => {
      await addToCart(page, "Blue mug");
      await addToCart(page, "Blue mug");
    });
    await test.step("Check the cart shows 2 mugs", () => expect(page.getByLabel("Cart")).toContainText("Blue mug ×2"));
  });

  test("removes an item", async ({ page }) => {
    await test.step("Add a Blue mug and a Tea sampler", async () => {
      await addToCart(page, "Blue mug");
      await addToCart(page, "Tea sampler");
    });
    await test.step("Remove the Blue mug", () => page.getByLabel("Cart").getByRole("listitem").filter({ hasText: "Blue mug" }).getByRole("button", { name: "Remove" }).click());
    await test.step("Check only the Tea sampler is left", async () => {
      await expect(page.getByLabel("Cart")).not.toContainText("Blue mug");
      await expect(page.locator("#total")).toHaveText("$20.00");
    });
  });

  // Fails on purpose on push and "nothing fails" runs: the page only takes codes in
  // capitals (the demo's known bug).
  test("applies a discount code", async ({ page }) => {
    await test.step("Add 2 Blue mugs and a Tea sampler", async () => {
      await addToCart(page, "Blue mug");
      await addToCart(page, "Blue mug");
      await addToCart(page, "Tea sampler");
    });
    await test.step("Enter the code save10", async () => {
      await page.getByLabel("Discount code").fill("save10");
      await page.getByRole("button", { name: "Apply" }).click();
    });
    await test.step("Check the total is $45.00", () => expect(page.locator("#total")).toHaveText("$45.00", { timeout: 1500 }));
  });

  test("warns about a code that doesn't exist", async ({ page }) => {
    await test.step("Enter the code FREESTUFF", async () => {
      await page.getByLabel("Discount code").fill("FREESTUFF");
      await page.getByRole("button", { name: "Apply" }).click();
    });
    await test.step("Check the warning shows", () => expect(page.getByRole("status")).toHaveText("That code doesn't exist."));
  });

  // Flaky on hourly random runs (see beforeEach).
  test("updates the total after each item", async ({ page }) => {
    await test.step("Add a Tea sampler", () => addToCart(page, "Tea sampler"));
    await test.step("Check the total is $20.00", () => expect(page.locator("#total")).toHaveText("$20.00", { timeout: 1000 }));
    await test.step("Add a Blue mug", () => addToCart(page, "Blue mug"));
    await test.step("Check the total is $35.00", () => expect(page.locator("#total")).toHaveText("$35.00"));
  });
});
