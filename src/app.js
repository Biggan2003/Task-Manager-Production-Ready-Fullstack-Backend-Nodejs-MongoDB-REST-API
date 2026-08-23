const express = require("express"); // Express framework import করছি

const authRoutes = require("./routes/authRoutes"); // Authentication routes import করছি

const taskRoutes = require("./routes/taskRoutes"); // Task routes import করছি

const adminRoutes = require("./routes/adminRoutes"); // Admin routes import করছি

const healthRoutes = require("./routes/healthRoutes"); // Health check routes import করছি

const app = express(); // Express application তৈরি করছি

app.use(express.json()); // JSON request body পড়ার জন্য middleware চালু করছি

app.use("/health", healthRoutes); // /health-এর অধীনে health check endpoint যুক্ত করছি

app.use("/api/auth", authRoutes); // /api/auth-এর অধীনে authentication routes যুক্ত করছি

app.use("/api/tasks", taskRoutes); // /api/tasks-এর অধীনে task routes যুক্ত করছি

app.use("/api/admin", adminRoutes); // /api/admin-এর অধীনে admin routes যুক্ত করছি


module.exports = app; // app-টি server.js-এ ব্যবহার করার জন্য export করছি
