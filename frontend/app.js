// State Management
let gatewayUrl = localStorage.getItem('gatewayUrl') || 'http://localhost:8080';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('gatewayUrl').value = gatewayUrl;
    checkGatewayStatus();
});

// Navigation Logic
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Show selected
    document.getElementById(sectionId).classList.add('active');
    
    // Update nav buttons
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-target="${sectionId}"]`).classList.add('active');
    
    // Update dynamic header title
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
    btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Processing...';
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

        if (!response.ok) throw new Error('Failed to register customer');
        
        const data = await response.json();
        const createdId = data.id || data._id || 'Success';
        
        showToast(`Customer registered! ID: ${createdId}`, 'success');
        event.target.reset();
    } catch (error) {
        console.error('API Error:', error);
        showToast('Error registering customer. Check gateway connection.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 2. Get User Details
async function getUser(event) {
    event.preventDefault();
    const userId = document.getElementById('searchUserId').value;
    const resultBox = document.getElementById('userDetailsResult');
    
    const btn = event.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Searching...';

    try {
        const response = await fetch(`${gatewayUrl}/users/${userId}`);
        
        if (!response.ok) {
            if (response.status === 404) throw new Error('Customer not found');
            throw new Error('Server error');
        }
        
        const data = await response.json();
        
        resultBox.innerHTML = `
            <div class="data-row">
                <span class="data-label">ID:</span>
                <span class="data-value">${data.id || data._id || userId}</span>
            </div>
            <div class="data-row">
                <span class="data-label">Name:</span>
                <span class="data-value">${data.name || 'N/A'}</span>
            </div>
            <div class="data-row">
                <span class="data-label">Email:</span>
                <span class="data-value">${data.email || 'N/A'}</span>
            </div>
        `;
        resultBox.classList.remove('hidden');
        
    } catch (error) {
        showToast(error.message, 'error');
        resultBox.classList.add('hidden');
    } finally {
        btn.innerHTML = originalText;
    }
}

// 3. Create Product
async function createProduct(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Adding...';
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

        if (!response.ok) throw new Error('Failed to add product');
        
        showToast('Product added successfully!', 'success');
        event.target.reset();
    } catch (error) {
        showToast('Error adding product. Check gateway.', 'error');
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
    btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Placing Order...';
    btn.disabled = true;

    const payload = {
        userId: document.getElementById('orderUserId').value,
        productId: document.getElementById('orderProductId').value,
        quantity: parseInt(document.getElementById('orderQuantity').value)
    };

    try {
        const response = await fetch(`${gatewayUrl}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Failed to create order');
        
        showToast('Order successfully placed!', 'success');
        event.target.reset();
    } catch (error) {
        showToast('Error creating order. Do Customer/Product exist?', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 5. Save Settings
function saveSettings(event) {
    event.preventDefault();
    const newUrl = document.getElementById('gatewayUrl').value.replace(/\/$/, '');
    gatewayUrl = newUrl;
    localStorage.setItem('gatewayUrl', gatewayUrl);
    
    showToast('Gateway URL saved locally.', 'success');
    checkGatewayStatus();
}

// Utility: Notifications
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');
    
    // Reset classes
    toast.className = `toast ${type}`;
    
    // Set icon based on type
    if (type === 'success') {
        iconEl.className = 'ri-checkbox-circle-fill';
    } else if (type === 'error') {
        iconEl.className = 'ri-error-warning-fill';
    } else {
        iconEl.className = 'ri-information-fill';
    }
    
    msgEl.innerText = message;
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Hide after 3s
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Utility: Check Gateway Health (Ping root or /actuator/health commonly used)
async function checkGatewayStatus() {
    const statusBadge = document.getElementById('gateway-status');
    statusBadge.innerHTML = '<span class="pulse-dot" style="background:#f59e0b"></span> Checking Gateway...';
    statusBadge.style.color = '#f59e0b';
    statusBadge.style.background = 'rgba(245, 158, 11, 0.1)';
    statusBadge.style.borderColor = 'rgba(245, 158, 11, 0.2)';
    
    try {
        // Just doing a simple fetch to see if it responds or fails CORS
        // Note: The actual health endpoint might differ. Adjust as needed.
        await fetch(`${gatewayUrl}/`, { method: 'HEAD', mode: 'no-cors' });
        
        statusBadge.innerHTML = '<span class="pulse-dot"></span> Gateway Connected';
        statusBadge.style.color = 'var(--secondary-color)';
        statusBadge.style.background = 'rgba(16, 185, 129, 0.1)';
        statusBadge.style.borderColor = 'rgba(16, 185, 129, 0.2)';
    } catch (error) {
        statusBadge.innerHTML = '<span class="pulse-dot" style="background:#ef4444; animation:none;"></span> Gateway Offline';
        statusBadge.style.color = '#ef4444';
        statusBadge.style.background = 'rgba(239, 68, 68, 0.1)';
        statusBadge.style.borderColor = 'rgba(239, 68, 68, 0.2)';
    }
}
