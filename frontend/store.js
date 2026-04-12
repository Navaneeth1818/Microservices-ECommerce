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
    grid.innerHTML = '<p>Connecting to Gateway...</p>';

    try {
        const response = await fetch(`${gatewayUrl}/products`, {
            signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) throw new Error(`Status ${response.status}`);

        const products = await response.json();
        grid.innerHTML = '';

        if (products.length === 0) {
            grid.innerHTML = '<p>No products available yet.</p>';
            return;
        }

        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <h3>${product.name}</h3>
                <p>${product.description || 'No description'}</p>
                <p>&#8377;${product.price}</p>
                <button onclick="showOrderModal('${product.id}', '${product.name}')">Buy</button>
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        grid.innerHTML = `<p>Failed to load products. Gateway may be waking up — try refreshing in 30 seconds.<br><small>${err.message}</small></p>`;
    }
}

// 2. Register Customer
async function submitRegistration(event) {
    event.preventDefault();

    const btn = event.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Registering...';
    btn.disabled = true;

    const payload = {
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value
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

        // FIX: user service returns { userId: ... } not { id: ... }
        const newId = data.userId || data.id;

        showStoreToast(`Registered! Your Customer ID is: ${newId}`);
        closeModal('authModal');
        event.target.reset();

        // Auto-fill the customer ID in the order modal if it's open
        const purchaseIdField = document.getElementById('purchaseCustomerId');
        if (purchaseIdField) purchaseIdField.value = newId;

    } catch (err) {
        showStoreToast(`Registration failed: ${err.message}`);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 3. Place Order
async function submitPurchase(event) {
    event.preventDefault();

    const btn = event.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Placing order...';
    btn.disabled = true;

    const payload = {
        user_id: parseInt(document.getElementById('purchaseCustomerId').value),
        product_id: parseInt(document.getElementById('purchaseProductId').value),
        quantity: parseInt(document.getElementById('purchaseQuantity').value)
    };

    // Guard: make sure user remembered to enter their ID
    if (!payload.user_id) {
        showStoreToast('Please enter your Customer ID first');
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }

    try {
        const response = await fetch(`${gatewayUrl}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000)
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Order failed');

        showStoreToast(`Order placed! Order ID: ${data.orderId}`);
        closeModal('orderModal');

    } catch (err) {
        showStoreToast(`Order failed: ${err.message}`);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Toast — uses the #message element visible in your store.html
function showStoreToast(message) {
    const toast = document.getElementById('message');
    if (!toast) { console.log(message); return; }

    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.opacity = '1';

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => { toast.style.display = 'none'; }, 400);
    }, 4000);
}
