/* ═══════════════════════════════════════════════════════
   NexusCommerce — store.js
   Features: auth, products, orders, address management,
             local persistence layer (IndexedDB via wrapper),
             toast, modals
═══════════════════════════════════════════════════════ */

const gatewayUrl = localStorage.getItem('gatewayUrl') || 'https://api-gateway-5ba1.onrender.com';

// ── Session ──────────────────────────────────────────
let currentUser = null;
try { currentUser = JSON.parse(sessionStorage.getItem('storeUser')); } catch {}

let allProducts = [];

// ── Local Persistence Helpers ────────────────────────
// Addresses are stored per user: localStorage key = `addresses_${userId}`
// Format: array of strings

function getUserAddresses(userId) {
  try { return JSON.parse(localStorage.getItem(`addresses_${userId}`)) || []; } catch { return []; }
}
function saveUserAddresses(userId, arr) {
  localStorage.setItem(`addresses_${userId}`, JSON.stringify(arr));
}
function getImageCache() {
  try { return JSON.parse(localStorage.getItem('productImages') || '{}'); } catch { return {}; }
}

// ── Init ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Nav scroll effect
  window.addEventListener('scroll', () => {
    document.getElementById('mainNav').classList.toggle('scrolled', window.scrollY > 20);
  });

  updateAuthUI();
  fetchProducts();
  if (currentUser) loadMyOrders();
});

// ── Auth UI ───────────────────────────────────────────
function updateAuthUI() {
  const authArea      = document.getElementById('authArea');
  const myOrdersLink  = document.getElementById('myOrdersLink');
  const myOrdersSection = document.getElementById('my-orders');
  const heroRegBtn    = document.getElementById('heroRegBtn');

  if (currentUser) {
    const initial = currentUser.name ? currentUser.name[0].toUpperCase() : '?';
    authArea.innerHTML = `
      <div style="display:flex;align-items:center;gap:.6rem">
        <button class="user-pill" onclick="showProfileModal()">
          <div class="avatar">${initial}</div>
          ${currentUser.name.split(' ')[0]}
        </button>
        <button onclick="logoutUser()" class="btn-ghost">Logout</button>
      </div>`;
    if (myOrdersLink)     myOrdersLink.style.display = 'inline';
    if (myOrdersSection)  myOrdersSection.style.display = 'block';
    if (heroRegBtn)       heroRegBtn.style.display = 'none';

    // Auto-fill & hide customer ID in order modal
    const cidGroup = document.getElementById('customerIdGroup');
    const cidField = document.getElementById('purchaseCustomerId');
    if (cidGroup) cidGroup.style.display = 'none';
    if (cidField) cidField.value = currentUser.id;
  } else {
    authArea.innerHTML = `<a href="javascript:void(0)" onclick="showAuthModal()">Sign In / Register</a>`;
    if (myOrdersLink)    myOrdersLink.style.display = 'none';
    if (myOrdersSection) myOrdersSection.style.display = 'none';
    if (heroRegBtn)      heroRegBtn.style.display = 'inline-flex';
  }
}

function logoutUser() {
  sessionStorage.removeItem('storeUser');
  currentUser = null;
  updateAuthUI();
  showStoreToast('Logged out successfully', 'info');
}

function showMyOrders() {
  const section = document.getElementById('my-orders');
  if (section) { section.style.display = 'block'; section.scrollIntoView({ behavior:'smooth', block:'start' }); }
  loadMyOrders();
}

// ── Auth Tabs ─────────────────────────────────────────
function switchTab(tab) {
  const isReg = tab === 'register';
  document.getElementById('registerTab').style.display = isReg ? 'block' : 'none';
  document.getElementById('loginTab').style.display    = isReg ? 'none'  : 'block';
  document.getElementById('tabRegister').classList.toggle('active', isReg);
  document.getElementById('tabLogin').classList.toggle('active', !isReg);
}

// ── Modals ────────────────────────────────────────────
function showAuthModal() {
  document.getElementById('authModal').classList.remove('hidden');
  switchTab('register');
}
function showOrderModal(productId, productName) {
  document.getElementById('modalProductName').innerText = productName;
  document.getElementById('purchaseProductId').value = productId;
  document.getElementById('orderFormView').style.display = 'block';
  document.getElementById('orderSuccessView').style.display = 'none';

  const cidGroup = document.getElementById('customerIdGroup');
  const cidField = document.getElementById('purchaseCustomerId');
  if (currentUser) {
    cidGroup.style.display = 'none';
    cidField.value = currentUser.id;
    // Populate saved address suggestions
    populateAddressSuggestions();
  } else {
    cidGroup.style.display = 'block';
    cidField.value = '';
  }
  document.getElementById('purchaseQuantity').value = 1;
  document.getElementById('orderAddress').value = '';
  document.getElementById('orderModal').classList.remove('hidden');
}
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// ── Address Suggestions in Order Modal ───────────────
function populateAddressSuggestions() {
  const container = document.getElementById('addrSuggestions');
  if (!currentUser || !container) return;
  const addrs = getUserAddresses(currentUser.id);
  if (!addrs.length) { container.style.display = 'none'; return; }

  container.style.display = 'flex';
  container.innerHTML = '<span style="font-size:.75rem;color:var(--text-muted);width:100%;margin-bottom:.2rem">Saved addresses:</span>' +
    addrs.map((a, i) => `<span class="addr-pill" onclick="selectAddress(${i})">${a.length > 35 ? a.slice(0,33)+'…' : a}</span>`).join('');
}

function selectAddress(idx) {
  if (!currentUser) return;
  const addrs = getUserAddresses(currentUser.id);
  document.getElementById('orderAddress').value = addrs[idx] || '';
}

// ── Profile Modal ─────────────────────────────────────
function showProfileModal() {
  if (!currentUser) return;
  document.getElementById('profileSubtitle').textContent = `Customer #${currentUser.id} · ${currentUser.email}`;
  document.getElementById('profileInfo').innerHTML = `
    <div style="display:flex;align-items:center;gap:.9rem">
      <div class="avatar" style="width:44px;height:44px;font-size:1.1rem">${currentUser.name[0].toUpperCase()}</div>
      <div>
        <div style="font-weight:700;font-size:1rem">${currentUser.name}</div>
        <div style="color:var(--text-muted);font-size:.85rem">${currentUser.email}</div>
        <div style="color:var(--primary);font-size:.8rem;font-weight:600;margin-top:.2rem">Customer ID #${currentUser.id}</div>
      </div>
    </div>`;
  renderSavedAddresses();
  document.getElementById('profileModal').classList.remove('hidden');
}

function renderSavedAddresses() {
  if (!currentUser) return;
  const addrs = getUserAddresses(currentUser.id);
  const list = document.getElementById('savedAddressesList');
  if (!addrs.length) {
    list.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem;margin-bottom:.5rem">No saved addresses yet.</p>';
    return;
  }
  list.innerHTML = addrs.map((a, i) => `
    <div style="display:flex;align-items:flex-start;gap:.6rem;padding:.65rem .85rem;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:.5rem">
      <i class="ri-map-pin-line" style="color:var(--primary);margin-top:.1rem;flex-shrink:0"></i>
      <span style="flex:1;font-size:.85rem;color:var(--text-soft);line-height:1.5">${a}</span>
      <button onclick="deleteAddress(${i})" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1rem;line-height:1;padding:.1rem;transition:color .2s" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='var(--text-muted)'">
        <i class="ri-delete-bin-line"></i>
      </button>
    </div>`).join('');
}

function saveNewAddress() {
  if (!currentUser) return;
  const val = document.getElementById('newAddressInput').value.trim();
  if (!val) { showStoreToast('Please enter an address', 'error'); return; }
  const addrs = getUserAddresses(currentUser.id);
  if (addrs.includes(val)) { showStoreToast('Address already saved', 'info'); return; }
  if (addrs.length >= 5) { showStoreToast('Maximum 5 addresses. Delete one first.', 'error'); return; }
  addrs.push(val);
  saveUserAddresses(currentUser.id, addrs);
  document.getElementById('newAddressInput').value = '';
  renderSavedAddresses();
  showStoreToast('Address saved!', 'success');
}

function deleteAddress(idx) {
  if (!currentUser) return;
  const addrs = getUserAddresses(currentUser.id);
  addrs.splice(idx, 1);
  saveUserAddresses(currentUser.id, addrs);
  renderSavedAddresses();
  showStoreToast('Address removed', 'info');
}

// ── Products ──────────────────────────────────────────
async function fetchProducts() {
  const grid = document.getElementById('productGrid');
  // Show skeletons (already in HTML)

  try {
    const r = await fetch(`${gatewayUrl}/products`, { signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error(`Service error ${r.status}`);
    allProducts = await r.json();
    renderProducts(allProducts);
    const countEl = document.getElementById('productCount');
    if (countEl) countEl.textContent = `${allProducts.length} product${allProducts.length !== 1 ? 's' : ''} available`;
  } catch(err) {
    grid.innerHTML = `
      <div class="empty-state-full">
        <i class="ri-wifi-off-line"></i>
        <p style="margin-bottom:.5rem;font-weight:600">Could not load products</p>
        <p style="font-size:.85rem;margin-bottom:1.25rem">${err.message} — Gateway may be waking up (30s)</p>
        <button onclick="fetchProducts()" class="btn btn-primary" style="width:auto;margin:0 auto">
          <i class="ri-refresh-line"></i> Retry
        </button>
      </div>`;
  }
}

function renderProducts(products) {
  const grid = document.getElementById('productGrid');
  const images = getImageCache();

  if (!products.length) {
    grid.innerHTML = `<div class="empty-state-full"><i class="ri-box-3-line"></i><p>No products available yet.</p></div>`;
    return;
  }

  grid.innerHTML = products.map(p => {
    const safeName = p.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const imgUrl = images[p.id];
    const imgHtml = imgUrl
      ? `<img src="${imgUrl}" alt="${p.name}" loading="lazy" onerror="this.parentElement.innerHTML='<i class=\\'ri-box-3-line\\'></i>'">`
      : `<i class="ri-box-3-line"></i>`;
    return `
      <div class="product-card">
        <div class="product-img">${imgHtml}</div>
        <div class="product-info">
          <h3 title="${p.name}">${p.name}</h3>
          <p>${p.description || 'No description provided.'}</p>
          <p class="product-price">&#8377;${Number(p.price).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
          <button class="btn btn-buy" onclick="showOrderModal(${p.id},'${safeName}')">
            <i class="ri-shopping-cart-line"></i> Buy Now
          </button>
        </div>
      </div>`;
  }).join('');
}

function filterProducts(query) {
  const q = query.toLowerCase().trim();
  const countEl = document.getElementById('productCount');
  if (!q) {
    renderProducts(allProducts);
    if (countEl) countEl.textContent = `${allProducts.length} product${allProducts.length !== 1 ? 's' : ''} available`;
    return;
  }
  const filtered = allProducts.filter(p =>
    p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
  );
  renderProducts(filtered);
  if (countEl) countEl.textContent = `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${query}"`;
}

// ── Register ──────────────────────────────────────────
async function submitRegistration(event) {
  event.preventDefault();
  const btn = document.getElementById('regBtn');
  btn.innerHTML = '<i class="ri-loader-4-line spin"></i> Creating...';
  btn.disabled = true;

  const name  = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();

  try {
    const r = await fetch(`${gatewayUrl}/users`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name, email }),
      signal: AbortSignal.timeout(10000)
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Registration failed');

    const newId = data.userId || data.id;
    currentUser = { id: newId, name, email };
    sessionStorage.setItem('storeUser', JSON.stringify(currentUser));

    closeModal('authModal');
    event.target.reset();
    updateAuthUI();
    loadMyOrders();
    showStoreToast(`Welcome, ${name}! Your Customer ID is #${newId} — save it for next login.`, 'success');
  } catch(e) {
    showStoreToast(`Registration failed: ${e.message}`, 'error');
  } finally {
    btn.innerHTML = '<i class="ri-user-add-line"></i> Create Account';
    btn.disabled = false;
  }
}

// ── Login ─────────────────────────────────────────────
async function submitLogin(event) {
  event.preventDefault();
  const btn = document.getElementById('loginBtn');
  btn.innerHTML = '<i class="ri-loader-4-line spin"></i> Verifying...';
  btn.disabled = true;

  const enteredId    = parseInt(document.getElementById('loginCustomerId').value);
  const enteredEmail = document.getElementById('loginEmail').value.trim().toLowerCase();

  try {
    const r = await fetch(`${gatewayUrl}/users`, { signal: AbortSignal.timeout(10000) });
    const users = await r.json();
    const match = users.find(u => u.id === enteredId && u.email.toLowerCase() === enteredEmail);

    if (!match) {
      showStoreToast('No account found with that ID and email.', 'error');
      return;
    }

    currentUser = { id: match.id, name: match.name, email: match.email };
    sessionStorage.setItem('storeUser', JSON.stringify(currentUser));

    closeModal('authModal');
    document.getElementById('storeLoginForm').reset();
    updateAuthUI();
    loadMyOrders();
    showStoreToast(`Welcome back, ${match.name}!`, 'success');
  } catch(e) {
    showStoreToast(`Login failed: ${e.message}`, 'error');
  } finally {
    btn.innerHTML = '<i class="ri-login-box-line"></i> Login';
    btn.disabled = false;
  }
}

// ── Place Order ───────────────────────────────────────
async function submitPurchase(event) {
  event.preventDefault();
  const btn = document.getElementById('placeOrderBtn');
  btn.innerHTML = '<i class="ri-loader-4-line spin"></i> Placing...';
  btn.disabled = true;

  const userId    = currentUser ? currentUser.id : parseInt(document.getElementById('purchaseCustomerId').value);
  const productId = parseInt(document.getElementById('purchaseProductId').value);
  const quantity  = parseInt(document.getElementById('purchaseQuantity').value);
  const address   = document.getElementById('orderAddress').value.trim();

  if (!userId || isNaN(userId)) {
    showStoreToast('Please enter your Customer ID or log in first.', 'error');
    btn.innerHTML = '<i class="ri-secure-payment-line"></i> Confirm Order';
    btn.disabled = false;
    return;
  }

  // Optionally auto-save the address
  if (address && currentUser) {
    const addrs = getUserAddresses(currentUser.id);
    if (!addrs.includes(address)) {
      if (addrs.length < 5) {
        addrs.push(address);
        saveUserAddresses(currentUser.id, addrs);
      }
    }
  }

  try {
    const r = await fetch(`${gatewayUrl}/orders`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ user_id: userId, product_id: productId, quantity }),
      signal: AbortSignal.timeout(10000)
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Order failed');

    // Show success state
    document.getElementById('orderFormView').style.display = 'none';
    document.getElementById('orderSuccessView').style.display = 'block';
    document.getElementById('orderSuccessMsg').textContent =
      address ? `Delivering to: ${address}` : (currentUser ? 'View it in My Orders below.' : '');
    document.getElementById('orderIdChip').textContent = `Order #${data.orderId}`;

    const viewBtn = document.getElementById('viewOrdersBtn');
    if (currentUser && viewBtn) viewBtn.style.display = 'inline-flex';

    if (currentUser) loadMyOrders();

  } catch(e) {
    showStoreToast(`Order failed: ${e.message}`, 'error');
    btn.innerHTML = '<i class="ri-secure-payment-line"></i> Confirm Order';
    btn.disabled = false;
  }
}

// ── My Orders ─────────────────────────────────────────
async function loadMyOrders() {
  if (!currentUser) return;
  const body  = document.getElementById('myOrdersBody');
  const count = document.getElementById('myOrdersCount');
  body.innerHTML = `<div style="text-align:center;padding:2.5rem;color:var(--text-muted)"><i class="ri-loader-4-line spin" style="font-size:1.5rem;display:block;margin-bottom:.75rem"></i>Loading...</div>`;

  try {
    const [oRes, pRes] = await Promise.all([
      fetch(`${gatewayUrl}/orders`,   { signal: AbortSignal.timeout(10000) }),
      fetch(`${gatewayUrl}/products`, { signal: AbortSignal.timeout(10000) }),
    ]);
    const allOrders = await oRes.json();
    const products  = await pRes.json();
    const pMap      = Object.fromEntries(products.map(p => [p.id, p]));
    const images    = getImageCache();

    const myOrders = allOrders.filter(o => Number(o.user_id) === Number(currentUser.id));
    count.textContent = `${myOrders.length} order${myOrders.length !== 1 ? 's' : ''}`;

    if (!myOrders.length) {
      body.innerHTML = `<div style="text-align:center;padding:3.5rem;color:var(--text-muted)">
        <i class="ri-shopping-cart-line" style="font-size:2.5rem;display:block;margin-bottom:.75rem;opacity:.3"></i>
        <p>You haven't placed any orders yet.</p>
        <button onclick="document.getElementById('products').scrollIntoView({behavior:'smooth'})" class="btn btn-primary" style="width:auto;margin:.75rem auto 0;padding:.6rem 1.5rem">Browse Products</button>
      </div>`;
      return;
    }

    body.innerHTML = `<table class="orders-table">
      <thead><tr>
        <th>Order #</th><th>Product</th><th>Qty</th>
        <th>Amount</th><th>Status</th><th>Date</th>
      </tr></thead>
      <tbody>${myOrders.slice().reverse().map(o => {
        const p     = pMap[o.product_id];
        const total = p ? `₹${(Number(p.price) * Number(o.quantity)).toLocaleString('en-IN',{minimumFractionDigits:2})}` : '—';
        const badge = o.status === 'completed' ? 'badge-completed' : 'badge-pending';
        const date  = o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
        const imgUrl = images[o.product_id];
        const thumb  = imgUrl ? `<img src="${imgUrl}" style="width:30px;height:30px;border-radius:4px;object-fit:cover;margin-right:.5rem;vertical-align:middle;border:1px solid var(--border)">` : '';
        return `<tr>
          <td><span class="badge badge-id">#${o.id}</span></td>
          <td>${thumb}<span style="color:var(--text)">${p ? p.name : `Product #${o.product_id}`}</span></td>
          <td style="text-align:center">${o.quantity}</td>
          <td style="font-weight:700;color:var(--secondary)">${total}</td>
          <td><span class="badge ${badge}">${o.status || 'pending'}</span></td>
          <td style="font-size:.83rem">${date}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
  } catch(e) {
    body.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--error)">${e.message}</div>`;
  }
}

// ── Toast ─────────────────────────────────────────────
function showStoreToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-message');
  const iconEl = document.getElementById('toast-icon');
  if (!toast || !msgEl) { console.log(message); return; }

  msgEl.textContent = message;
  const iconMap = { success:'ri-checkbox-circle-line', error:'ri-error-warning-line', info:'ri-information-line' };
  iconEl.className = iconMap[type] || 'ri-information-line';

  toast.className = `toast ${type} visible`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.classList.remove('visible'); }, 4500);
}
