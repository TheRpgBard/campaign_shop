let db, user = null;
let currentUser = null;
let currentStore = null;
let currentCampaign = null;
let cart = [];
let products = [];
let campaigns = [];
let stores = [];
let users = [];

function generateId(length = 4) {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
}
// Update header user info & cart summary
function updateUserInfoDisplay() {
  const info = document.getElementById('user-info');
  if (user) {
    info.textContent = `${user.name} — ${user.currency}${user.balance.toFixed(2)}`;
  } else {
    info.textContent = 'No Profile Selected';
  }
  updateCartSummary();
}
function clearCart() {
  cart = [];
  updateCartSummary();
}
function loadProducts(dbName = 'products', filter = '', value = '') {
  const tx = db.transaction(dbName, 'readonly');
  const store = tx.objectStore(dbName);
  const request = store.getAll();

  request.onsuccess = () => {
    if (currentStore === null) { 
      products = [];
    } else {
      products = request.result || [];
      if (filter && value !== null) {
        products = products.filter(product => product[filter] === value || product[filter] === '');
      }
    }
    //renderProductsTable(); 
    let filterVal = '';
    let valueVal = '';
    if (currentCampaign !== null) { filterVal = 'campaign', valueVal = currentCampaign; }
    loadDbVals('campaigns', filterVal, valueVal.id);
    loadDbVals('stores', filterVal, valueVal.id);
    loadDbVals('users', filterVal, valueVal.id);
    if (currentStore !== null) { filterVal = 'store', valueVal = currentStore; }
    loadDbVals(dbName, filterVal, valueVal.id);
    renderStoreProducts();
  };
}
function showSection(sectionClass) {
  document.querySelectorAll('section').forEach(s => s.style.display = 'none');
  document.querySelector(`.${sectionClass}`).style.display = 'block';
  if (sectionClass === 'shop') renderStoreProducts();
  if (sectionClass === 'cart') renderCart();
  if (sectionClass === 'checkout') renderCheckout();
}

//https://davidshimjs.github.io/qrcodejs/