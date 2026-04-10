const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();

// Allow frontend to connect
app.use(cors());

// Route: User Service
app.use("/users", createProxyMiddleware({
    target: "http://user-service:3001",
    changeOrigin: true
}));

// Route: Product Service
app.use("/products", createProxyMiddleware({
    target: "http://product-service:3002",
    changeOrigin: true
}));

// Route: Order Service
app.use("/orders", createProxyMiddleware({
    target: "http://order-service:3003",
    changeOrigin: true
}));

// Start Gateway
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));