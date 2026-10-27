// A small shopping cart, just enough to have something to test.

function createCart() {
  return { items: [] };
}

function addItem(cart, name, price, quantity = 1) {
  if (!name) throw new Error("An item needs a name.");
  if (price < 0) throw new Error("Price can't be negative.");
  if (quantity < 1) throw new Error("Quantity must be at least 1.");
  const existing = cart.items.find((i) => i.name === name);
  if (existing) existing.quantity += quantity;
  else cart.items.push({ name, price, quantity });
  return cart;
}

function removeItem(cart, name) {
  cart.items = cart.items.filter((i) => i.name !== name);
  return cart;
}

function itemCount(cart) {
  return cart.items.reduce((sum, i) => sum + i.quantity, 0);
}

function subtotal(cart) {
  return round(cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0));
}

// percent is a whole number, such as 10 for 10% off.
function applyDiscount(amount, percent) {
  return round(amount * (1 - percent / 100));
}

function round(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { createCart, addItem, removeItem, itemCount, subtotal, applyDiscount };
