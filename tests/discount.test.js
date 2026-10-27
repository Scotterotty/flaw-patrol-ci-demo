const { applyDiscount } = require("../src/cart");

describe("Discounts", () => {
  test("takes 10 percent off", () => {
    expect(applyDiscount(50, 10)).toBe(45);
  });

  test("zero percent changes nothing", () => {
    expect(applyDiscount(19.99, 0)).toBe(19.99);
  });

  // Fails on purpose, so the results show what a failed test looks like in Flaw Patrol.
  test("takes 25 percent off (fails on purpose)", () => {
    expect(applyDiscount(80, 25)).toBe(55);
  });
});
