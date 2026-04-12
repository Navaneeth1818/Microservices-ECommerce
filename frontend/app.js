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

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Failed');

        showToast(`Customer registered! ID: ${data.userId || data.id}`, 'success');
        event.target.reset();
    } catch (err) {
        showToast(`Error registering customer: ${err.message}`, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 2. Get User — fetches all users then finds by ID (service has no GET /users/:id)
async function getUser(event) {
    event.preventDefault();

    const userId = parseInt(document.getElementById('searchUserId').value);
    const resultBox = document.getElementById('userDetailsResult');
    resultBox.innerHTML = 'Searching...';
    resultBox.classList.remove('hidden');

    try {
        const response = await fetch(`${gatewayUrl}/users`);
        if (!response.ok) throw new Error('Could not reach user service');

        const users = await response.json();
        const data = users.find(u => u.id === userId);

        if (!data) {
            resultBox.innerHTML = `<p style="color:red">No user found with ID ${userId}</p>`;
            return;
        }

        resultBox.innerHTML = `
            <p><strong>ID:</strong> ${data.id}</p>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
        `;
    } catch (err) {
        resultBox.innerHTML = `<p style="color:red">${err.message}</p>`;
    }
}

// 3. Create Product
async function createProduct(event) {
    event.preventDefault();

    const btn = event.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Adding...';
    btn.disabled = true;

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

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Failed');

        showToast(`Product added! ID: ${data.productId}`, 'success');
        event.target.reset();
    } catch (err) {
        showToast(`Error adding product: ${err.message}`, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 4. Create Order
async function createOrder(event) {
    event.preventDefault();

    const btn = event.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Placing...';
    btn.disabled = true;

    const payload = {
        user_id: parseInt(document.getElementById('orderUserId').value),
        product_id: parseInt(document.getElementById('orderProductId').value),
        quantity: parseInt(document.getElementById('orderQuantity').value)
    };

    try {
        const response = await fetch(`${gatewayUrl}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Failed');

        showToast(`Order placed! Order ID: ${data.orderId}`, 'success');
        event.target.reset();
    } catch (err) {
        showToast(`Error creating order: ${err.message}`, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Save Gateway URL
function saveSettings(event) {
    event.preventDefault();
    const newUrl = document.getElementById('gatewayUrl').value.trim().replace(/\/$/, '');
    if (!newUrl) {
        showToast('Please enter a valid URL', 'error');
        return;
    }
    gatewayUrl = newUrl;
    localStorage.setItem('gatewayUrl', gatewayUrl);
    showToast('Gateway URL saved!', 'success');
    checkGatewayStatus();
}

// Toast — uses the notification element in your HTML
function showToast(msg, type) {
    const toast = document.getElementById('notification');
    if (!toast) { console.log(msg); return; }

    toast.textContent = msg;
    toast.className = '';
    toast.classList.add('show', type === 'error' ? 'toast-error' : 'toast-success');

    setTimeout(() => {
        toast.classList.remove('show', 'toast-error', 'toast-success');
    }, 3500);
}

// Gateway + Services Status Check
async function checkGatewayStatus() {
    const gatewayEl  = document.getElementById('gateway-status');
    const usersEl    = document.getElementById('users-status');
    const productsEl = document.getElementById('products-status');
    const ordersEl   = document.getElementById('orders-status');

    const setStatus = (el, ok) => {
        if (!el) return;
        el.textContent = ok ? 'Operational' : 'Unreachable';
        el.style.color  = ok ? 'green' : 'red';
    };

    if (gatewayEl) {
        gatewayEl.textContent = 'Checking...';
        gatewayEl.style.color = 'orange';
    }

    // Check gateway root
    try {
        const res = await fetch(`${gatewayUrl}/`, { signal: AbortSignal.timeout(8000) });
        setStatus(gatewayEl, res.ok || res.status < 500);
    } catch {
        setStatus(gatewayEl, false);
    }

    // Check each service via the gateway
    const checks = [
        { url: `${gatewayUrl}/users`,    el: usersEl },
        { url: `${gatewayUrl}/products`, el: productsEl },
        { url: `${gatewayUrl}/orders`,   el: ordersEl },
    ];

    for (const { url, el } of checks) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
            setStatus(el, res.ok);
        } catch {
            setStatus(el, false);
        }
    }
}
