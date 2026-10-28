const { createCart, addItem, removeItem, itemCount, subtotal } = require("../src/cart");

describe("Cart", () => {
  test("starts empty", () => {
    expect(itemCount(createCart())).toBe(0);
  });

  test("adds an item", () => {
    const cart = addItem(createCart(), "Notebook", 4.5);
    expect(itemCount(cart)).toBe(1);
  });

  test("adding the same item again raises its quantity", () => {
    const cart = createCart();
    addItem(cart, "Pen", 1.25);
    addItem(cart, "Pen", 1.25, 2);
    expect(cart.items).toHaveLength(1);
    expect(itemCount(cart)).toBe(3);
  });

  test("removes an item", () => {
    const cart = addItem(createCart(), "Notebook", 4.5);
    removeItem(cart, "Notebook");
    expect(itemCount(cart)).toBe(0);
  });

  test("rejects a negative price", () => {
    expect(() => addItem(createCart(), "Pen", -1)).toThrow("negative");
  });

  // Fails on purpose, so the results show what a failed test looks like in Flaw Patrol.
  test("totals the subtotal", () => {
    const cart = createCart();
    addItem(cart, "Notebook", 4.5, 2);
    addItem(cart, "Pen", 1.25);
    expect(subtotal(cart)).toBe(10.5);
  });

  test("removing one item keeps the others", () => {
    const cart = createCart();
    addItem(cart, "Notebook", 4.5);
    addItem(cart, "Pen", 1.25);
    removeItem(cart, "Notebook");
    expect(itemCount(cart)).toBe(1);
  });
});
