const gatewayUrl = localStorage.getItem('gatewayUrl') || 'https://api-gateway-5ba1.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
});

// Modals
function showAuthModal() {
    document.getElementById('authModal').classList.remove('hidden');
}

function showOrderModal(productId, productName) {
    document.getElementById('modalProductName').innerText = productName;
    document.getElementById('purchaseProductId').value = productId;
    document.getElementById('orderModal').classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// 1. Fetch & Display Products
async function fetchProducts() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = `
        <div class="product-card">
            <div class="product-img placeholder-img"><i class="ri-loader-4-line"></i></div>
            <div class="product-info">
                <h3>Loading Products...</h3>
                <p>Connecting to Gateway — may take 30s on first load</p>
            </div>
        </div>`;

    try {
        const response = await fetch(`${gatewayUrl}/products`, {
            signal: AbortSignal.timeout(30000)
        });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const products = await response.json();
        grid.innerHTML = '';

        if (products.length === 0) {
            grid.innerHTML = '<p style="text-align:center;padding:2rem;color:#6b7280">No products yet. Ask an admin to add some!</p>';
            return;
        }

        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            // Escape quotes in name to avoid breaking onclick attribute
            const safeName = product.name.replace(/'/g, "\\'");
            card.innerHTML = `
                <div class="product-img placeholder-img">
                    <i class="ri-box-3-line" style="font-size:3rem;color:#9ca3af"></i>
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.description || 'No description provided'}</p>
                    <p class="product-price">&#8377;${Number(product.price).toFixed(2)}</p>
                    <button class="btn btn-buy" onclick="showOrderModal(${product.id}, '${safeName}')">Buy Now</button>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        grid.innerHTML = `
            <div style="text-align:center;padding:2rem;color:#6b7280">
                <p>Could not load products.</p>
                <p style="font-size:0.85rem;margin-top:0.5rem">${err.message}</p>
                <button onclick="fetchProducts()" class="btn btn-primary" style="margin-top:1rem">Retry</button>
            </div>`;
    }
}

// 2. Register Customer
async function submitRegistration(event) {
    event.preventDefault();

    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Registering...';
    btn.disabled = true;

    const payload = {
        name: document.getElementById('regName').value.trim(),
        email: document.getElementById('regEmail').value.trim()
    };

    try {
        const response = await fetch(`${gatewayUrl}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Registration failed');

        // FIX: user service returns { userId: N } not { id: N }
        const newId = data.userId || data.id;

        // Close modal and reset form first
        closeModal('authModal');
        event.target.reset();

        // Auto-fill customer ID in order modal for convenience
        const purchaseIdField = document.getElementById('purchaseCustomerId');
        if (purchaseIdField) purchaseIdField.value = newId;

        // Show toast AFTER closing modal so it's visible
        showStoreToast(`Registered! Your Customer ID is ${newId} — write it down!`, 'success');

    } catch (err) {
        showStoreToast(`Registration failed: ${err.message}`, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 3. Place Order
async function submitPurchase(event) {
    event.preventDefault();

    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Placing order...';
    btn.disabled = true;

    const userId = parseInt(document.getElementById('purchaseCustomerId').value);
    const productId = parseInt(document.getElementById('purchaseProductId').value);
    const quantity = parseInt(document.getElementById('purchaseQuantity').value);

    if (!userId || isNaN(userId)) {
        showStoreToast('Please enter your Customer ID first', 'error');
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }

    const payload = { user_id: userId, product_id: productId, quantity };

    try {
        const response = await fetch(`${gatewayUrl}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Order failed');

        closeModal('orderModal');
        showStoreToast(`Order placed! Your Order ID is ${data.orderId}`, 'success');

    } catch (err) {
        showStoreToast(`Order failed: ${err.message}`, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// FIX: toast now correctly targets #toast + #toast-message + #toast-icon (matching store.html)
function showStoreToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');

    if (!toast || !msgEl) { console.log(message); return; }

    msgEl.textContent = message;

    if (iconEl) {
        iconEl.className = type === 'error'
            ? 'ri-error-warning-line'
            : 'ri-checkbox-circle-line';
        iconEl.style.color = type === 'error' ? '#ef4444' : '#10b981';
    }

    toast.classList.remove('hidden');
    // Force reflow so transition replays
    void toast.offsetWidth;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.classList.add('hidden'), 400);
    }, 4000);
}
