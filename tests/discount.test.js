const { applyDiscount } = require("../src/cart");

describe("Discounts", () => {
  test("takes 10 percent off", () => {
    expect(applyDiscount(50, 10)).toBe(45);
  });

  test("zero percent changes nothing", () => {
    expect(applyDiscount(19.99, 0)).toBe(19.99);
  });

  test("takes 25 percent off", () => {
    expect(applyDiscount(80, 25)).toBe(60);
  });
});
