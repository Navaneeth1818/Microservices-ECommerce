const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();

// Allow frontend to connect
app.use(cors());

// USER SERVICE
app.use("/users", createProxyMiddleware({
    target: "https://user-services-u4rn.onrender.com",
    changeOrigin: true
}));

// PRODUCT SERVICE
app.use("/products", createProxyMiddleware({
    target: "https://product-service-mw02.onrender.com",
    changeOrigin: true
}));

// ORDER SERVICE
app.use("/orders", createProxyMiddleware({
    target: "https://order-service-119e.onrender.com",
    changeOrigin: true
}));

// Start Gateway
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
