// State Management
let gatewayUrl = localStorage.getItem('gatewayUrl') || 'https://api-gateway-5ba1.onrender.com';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('gatewayUrl').value = gatewayUrl;
    checkGatewayStatus();
});

// Navigation Logic
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector(`[data-target="${sectionId}"]`).classList.add('active');

    const titles = {
        'dashboard-section': ['Store Overview', 'Real-time management of your E-commerce platform.'],
        'users-section': ['Customer Management', 'Register and retrieve customer details.'],
        'products-section': ['Inventory Management', 'Manage product catalog.'],
        'orders-section': ['Order Management', 'Process and link customer orders.'],
        'settings-section': ['Gateway Configuration', 'Manage API connections and environment settings.']
    };

    document.getElementById('page-title').innerText = titles[sectionId][0];
    document.getElementById('page-subtitle').innerText = titles[sectionId][1];
}

/* API Interactions */

// 1. Create User
async function createUser(event) {
    event.preventDefault();

    const btn = event.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Processing...';
    btn.disabled = true;

    const payload = {
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value
    };

    try {
        const response = await fetch(`${gatewayUrl}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error();

        showToast('Customer registered!', 'success');
        event.target.reset();
    } catch {
        showToast('Error registering customer', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 2. Get User
async function getUser(event) {
    event.preventDefault();

    const userId = document.getElementById('searchUserId').value;
    const resultBox = document.getElementById('userDetailsResult');

    try {
        const response = await fetch(`${gatewayUrl}/users/${userId}`);
        const data = await response.json();

        resultBox.innerHTML = `
            <p>ID: ${data.id}</p>
            <p>Name: ${data.name}</p>
            <p>Email: ${data.email}</p>
        `;
        resultBox.classList.remove('hidden');
    } catch {
        showToast('User not found', 'error');
    }
}

// 3. Create Product
async function createProduct(event) {
    event.preventDefault();

    const payload = {
        name: document.getElementById('productName').value,
        price: parseFloat(document.getElementById('productPrice').value),
        description: document.getElementById('productDesc').value
    };

    try {
        const response = await fetch(`${gatewayUrl}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error();

        showToast('Product added!', 'success');
        event.target.reset();
    } catch {
        showToast('Error adding product', 'error');
    }
}

// 4. Create Order
async function createOrder(event) {
    event.preventDefault();

    const payload = {
        user_id: document.getElementById('orderUserId').value,
        product_id: document.getElementById('orderProductId').value,
        quantity: parseInt(document.getElementById('orderQuantity').value)
    };

    try {
        const response = await fetch(`${gatewayUrl}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error();

        showToast('Order placed!', 'success');
        event.target.reset();
    } catch {
        showToast('Error creating order', 'error');
    }
}

// Save Gateway URL
function saveSettings(event) {
    event.preventDefault();
    gatewayUrl = document.getElementById('gatewayUrl').value.replace(/\/$/, '');
    localStorage.setItem('gatewayUrl', gatewayUrl);
    showToast('Gateway saved!', 'success');
}

// Toast
function showToast(msg, type) {
    alert(msg); // simple fallback (can keep your fancy UI if needed)
}

// Gateway Check
async function checkGatewayStatus() {
    try {
        await fetch(`${gatewayUrl}/users`);
        console.log("Gateway connected");
    } catch {
        console.log("Gateway error");
    }
}
