const express = require("express"); // Express framework import করছি

const cors = require("cors"); // Frontend এবং backend-এর cross-origin request control করার জন্য CORS import করছি

const cookieParser = require("cookie-parser"); // HTTP cookies পড়ার জন্য cookie-parser import করছি

const authRoutes = require("./routes/authRoutes"); // Authentication routes import করছি

const taskRoutes = require("./routes/taskRoutes"); // Task routes import করছি

const adminRoutes = require("./routes/adminRoutes"); // Admin routes import করছি

const healthRoutes = require("./routes/healthRoutes"); // Health check routes import করছি

const app = express(); // Express application তৈরি করছি

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173", // কোন frontend origin backend access করতে পারবে তা নির্ধারণ করছি
        credentials: true, // Browser-কে HttpOnly cookies request-এর সাথে পাঠানোর অনুমতি দিচ্ছি
    })
);

app.use(cookieParser()); // Incoming cookies-কে req.cookies-এর মাধ্যমে access করার middleware enable করছি

app.use(express.json()); // JSON request body পড়ার জন্য middleware চালু করছি

app.use("/health", healthRoutes); // /health-এর অধীনে health check endpoint যুক্ত করছি

app.use("/api/auth", authRoutes); // /api/auth-এর অধীনে authentication routes যুক্ত করছি

app.use("/api/tasks", taskRoutes); // /api/tasks-এর অধীনে task routes যুক্ত করছি

app.use("/api/admin", adminRoutes); // /api/admin-এর অধীনে admin routes যুক্ত করছি


module.exports = app; // app-টি server.js-এ ব্যবহার করার জন্য export করছি
