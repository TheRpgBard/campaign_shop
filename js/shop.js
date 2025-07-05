function updateCartSummary() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const cur = currentUser ? currentUser.currency : '$';
  document.getElementById('cart-summary').innerHTML = `Cart: ${count} items - ${cur}${total.toFixed(2)} <button onclick="showSection('checkout')">Checkout</button>`;
}

function addToCart(name, price) {
  const item = cart.find(i => i.name === name);
  if (item) item.quantity++;
  else cart.push({ name, price, quantity: 1 });
  updateCartSummary();
}

function renderCart() {
  const cartSection = document.querySelector('.cart');
  cartSection.innerHTML = '<h2>Your Cart</h2>';
  if (cart.length === 0) return cartSection.innerHTML += '<p>Cart is empty.</p>';
  cart.forEach(item => {
    const div = document.createElement('div');
    div.innerHTML = `${item.name} x ${item.quantity} = ${currentUser.currency}${(item.price * item.quantity).toFixed(2)} <button onclick="removeFromCart('${item.name}')">Remove</button>`;
    cartSection.appendChild(div);
  });
  const total = cart.reduce((sum, i) => sum + i.quantity * i.price, 0);
  cartSection.innerHTML += `<p><strong>Total: ${currentUser.currency}${total.toFixed(2)}</strong></p>`;
}

function removeFromCart(name) {
  cart = cart.filter(i => i.name !== name);
  updateCartSummary();
  renderCart();
}

function renderCheckout() {
  const checkoutSection = document.querySelector('.checkout');
  checkoutSection.innerHTML = '<h2>Checkout</h2>';
  if (!currentUser) return checkoutSection.innerHTML += '<p>Select a user profile first.</p>';
  if (cart.length === 0) return checkoutSection.innerHTML += '<p>Your cart is empty.</p>';
  let total = 0;
  cart.forEach(i => {
    checkoutSection.innerHTML += `<div>${i.name} x ${i.quantity} = ${currentUser.currency}${(i.price * i.quantity).toFixed(2)}</div>`;
    total += i.price * i.quantity;
  });
  checkoutSection.innerHTML += `<p><strong>Total: ${currentUser.currency}${total.toFixed(2)}</strong></p>`;
  if (total > currentUser.balance) {
    checkoutSection.innerHTML += '<p style="color:red">Insufficient funds!</p>';
  } else {
    checkoutSection.innerHTML += '<button onclick="completeCheckout()">Complete Purchase</button>';
  }
}

function completeCheckout() {
  const total = cart.reduce((sum, i) => sum + i.quantity * i.price, 0);
  if (total > currentUser.balance) return alert("Not enough funds");
  currentUser.balance -= total;
  //TODO: Update the User Balance
  updateToDb('users', currentUser.id, currentUser)
  document.getElementById('user-info').innerText = `${currentUser.name} — ${currentUser.currency}${Number(currentUser.balance).toFixed(2)}`;
  //TODO: Update the store quantities
  cart = [];
  updateCartSummary();
  alert("Purchase complete! New balance: " + currentUser.currency + currentUser.balance.toFixed(2));
  //showSection('profile');
  updateUserRow(currentUser.id, currentUser.name, currentUser.balance, currentUser.currency);
}

