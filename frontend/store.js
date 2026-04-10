const gatewayUrl = localStorage.getItem('gatewayUrl') || 'http://localhost:8080';

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
        
        if (!response.ok) throw new Error('Could not fetch products');
        
        const products = await response.json();
        grid.innerHTML = ''; // Clear loading
        
        if (products.length === 0) {
            grid.innerHTML = '<p>No products available yet. Check back later!</p>';
            return;
        }

        products.forEach(product => {
            const id = product.id || product._id;
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-img"><i class="ri-box-3-fill"></i></div>
                <div class="product-info">
                    <h3>${product.name || 'Unknown Product'}</h3>
                    <p>${product.description || 'No description available.'}</p>
                    <p class="product-price">$${product.price?.toFixed(2) || '0.00'}</p>
                    <button class="btn btn-buy" onclick="showOrderModal('${id}', '${product.name}')">Buy Now</button>
                </div>
            `;
            grid.appendChild(card);
        });
        
    } catch (error) {
        grid.innerHTML = `
            <div class="product-card" style="border: 1px solid #ef4444; background: #fef2f2;">
                <div class="product-info">
                    <h3 style="color:#b91c1c;">Backend Connection Pending</h3>
                    <p>Could not load products. Please ensure the API Gateway and Product Service are running.</p>
                </div>
            </div>
        `;
    }
}

// 2. Register Customer (Direct to User Service via Gateway)
async function submitRegistration(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button');
    btn.innerText = 'Registering...';

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

        if (!response.ok) throw new Error('Registration failed');
        
        const data = await response.json();
        const createdId = data.id || data._id || 'Success';
        
        showStoreToast(`Welcome! Your Customer ID is: ${createdId}`);
        closeModal('authModal');
        event.target.reset();
        
        // Auto-fill ID for convenience if they buy something
        document.getElementById('purchaseCustomerId').value = createdId;
    } catch (error) {
        showStoreToast('Failed to register. Check gateway connection.');
    } finally {
        btn.innerText = 'Register';
    }
}

// 3. Complete Purchase (Direct to Order Service via Gateway)
async function submitPurchase(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button');
    btn.innerText = 'Processing...';

    const payload = {
        userId: document.getElementById('purchaseCustomerId').value,
        productId: document.getElementById('purchaseProductId').value,
        quantity: parseInt(document.getElementById('purchaseQuantity').value)
    };

    try {
        const response = await fetch(`${gatewayUrl}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Order processing failed');
        
        showStoreToast('Order placed successfully! Thank you for shopping.');
        closeModal('orderModal');
        event.target.reset();
    } catch (error) {
        showStoreToast('Error placing order. Ensure Customer ID is valid.');
    } finally {
        btn.innerText = 'Confirm Order';
    }
}

function showStoreToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').innerText = message;
    
    toast.classList.remove('hidden');
    
    // Hide after 4 seconds
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}
