// Load the tools we installed
const express = require('express');
const Database = require('better-sqlite3');

// Create the app (the web server)
const app = express();

// This line tells the server: "understand JSON data in incoming requests"
app.use(express.json());

// Open (or create) the database file
// If products.db doesn't exist yet, this creates it automatically
const db = new Database('products.db');

// Create the products table if it doesn't already exist
// A "table" is like a spreadsheet with columns
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT
  )
`);

// ============================================
// API 1: Add a new product  →  POST /products
// ============================================
// When someone sends a POST request to /products, this runs
app.post('/products', (req, res) => {
  // req.body contains the data the user sent
  const { name, price, description } = req.body;

  // Basic check: name and price are required
  if (!name || !price) {
    return res.status(400).json({ error: 'name and price are required' });
  }

  // Insert the new product into the database
  const stmt = db.prepare('INSERT INTO products (name, price, description) VALUES (?, ?, ?)');
  const result = stmt.run(name, price, description);

  // Send back a success response with the new product's ID
  res.status(201).json({
    message: 'Product created!',
    productId: result.lastInsertRowid
  });
});

// ============================================
// API 2: Get all products  →  GET /products
// ============================================
app.get('/products', (req, res) => {
  // Fetch every row from the products table
  const products = db.prepare('SELECT * FROM products').all();

  // Send the list back as JSON
  res.json(products);
});

// ============================================
// Start the server on port 3002
// ============================================
// Port is like a "door number" on your computer
// Product service uses door 3002
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
