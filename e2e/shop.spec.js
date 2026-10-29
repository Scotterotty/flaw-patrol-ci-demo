// Browser tests for web/shop.html. When one fails, Playwright saves a screenshot, a video
// and a trace (a step-by-step replay) of it, for Flaw Patrol to show next to the result.
const path = require("path");
const { pathToFileURL } = require("url");
const { test, expect } = require("@playwright/test");

// On "everything passes" runs, and random runs with no bad change, the page's known bug
// is fixed.
const shop = pathToFileURL(path.join(__dirname, "..", "web", "shop.html")).href + (process.env.ALL_PASS ? "?fixed" : "");

async function addToCart(page, name) {
  await page.getByRole("listitem").filter({ hasText: name }).getByRole("button", { name: "Add to cart" }).click();
}

test.describe("Shop", () => {
  test.beforeEach(async ({ page }) => {
    await test.step("Open the shop", () => page.goto(shop));
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

  // Fails on purpose: the page only takes codes in capitals (the demo's known bug).
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

  // Flaky on hourly random runs: now and then the first try fails and the retry passes,
// and once in a while (SIM_FLAKY_HARD, from ci/pick-outcome.js) the retry fails too.
  test("updates the total after each item", async ({ page }, testInfo) => {
    await test.step("Add a Tea sampler", () => addToCart(page, "Tea sampler"));
    await test.step("Check the total is $20.00", async () => {
      const flake = process.env.SIM_RANDOM && (process.env.SIM_FLAKY_HARD || (testInfo.retry === 0 && Math.random() < 0.15));
      await expect(page.locator("#total")).toHaveText(flake ? "$20.0" : "$20.00", { timeout: 1000 });
    });
    await test.step("Add a Blue mug", () => addToCart(page, "Blue mug"));
    await test.step("Check the total is $35.00", () => expect(page.locator("#total")).toHaveText("$35.00"));
  });
});
