const express = require('express');
const Database = require('better-sqlite3');

const app = express();
app.use(express.json());

// Order service gets its own separate database file
const db = new Database('orders.db');

// Create the orders table
// Notice: user_id and product_id link to the other services
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ============================================
// API 1: Create a new order  →  POST /orders
// ============================================
app.post('/orders', async (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  // Check all required fields are present
  if (!user_id || !product_id) {
    return res.status(400).json({ error: 'user_id and product_id are required' });
  }

  // Optional: verify the product actually exists by calling Product Service
  // This is the "communication between services" part!
  try {
    const productCheck = await fetch(`http://product-service:3002/products`);
    const products = await productCheck.json();
    const productExists = products.find(p => p.id === Number(product_id));

    if (!productExists) {
      return res.status(404).json({ error: `Product with id ${product_id} not found` });
    }

    // Insert the order
    const stmt = db.prepare(
      'INSERT INTO orders (user_id, product_id, quantity) VALUES (?, ?, ?)'
    );
    const result = stmt.run(user_id, product_id, quantity || 1);

    res.status(201).json({
      message: 'Order created!',
      orderId: result.lastInsertRowid,
      product: productExists,
      quantity: quantity || 1
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not connect to Product Service. Is it running?' });
  }
});
app.get('/orders', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders').all();
  res.json(orders);
});

// ============================================
// Start on port 3003
// ============================================
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
