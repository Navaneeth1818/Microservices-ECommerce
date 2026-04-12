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
    try {
        const response = await fetch(`${gatewayUrl}/products`);
        if (!response.ok) throw new Error();

        const products = await response.json();
        grid.innerHTML = '';

        if (products.length === 0) {
            grid.innerHTML = '<p>No products available yet.</p>';
            return;
        }

        products.forEach(product => {
            const id = product.id;
            const card = document.createElement('div');

            card.className = 'product-card';
            card.innerHTML = `
                <h3>${product.name}</h3>
                <p>${product.description || ''}</p>
                <p>₹${product.price}</p>
                <button onclick="showOrderModal('${id}', '${product.name}')">Buy</button>
            `;
            grid.appendChild(card);
        });

    } catch {
        grid.innerHTML = '<p>Failed to load products</p>';
    }
}

// 2. Register Customer
async function submitRegistration(event) {
    event.preventDefault();

    const payload = {
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value
    };

    try {
        const response = await fetch(`${gatewayUrl}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error();

        const data = await response.json();
        const id = data.id;

        showStoreToast(`Registered! ID: ${id}`);
        closeModal('authModal');
        document.getElementById('purchaseCustomerId').value = id;

    } catch {
        showStoreToast('Registration failed');
    }
}

// 3. Place Order
async function submitPurchase(event) {
    event.preventDefault();

    const payload = {
        user_id: document.getElementById('purchaseCustomerId').value,
        product_id: document.getElementById('purchaseProductId').value,
        quantity: parseInt(document.getElementById('purchaseQuantity').value)
    };

    try {
        const response = await fetch(`${gatewayUrl}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error();

        showStoreToast('Order placed successfully!');
        closeModal('orderModal');

    } catch {
        showStoreToast('Order failed');
    }
}

// Toast
function showStoreToast(message) {
    alert(message);
}
