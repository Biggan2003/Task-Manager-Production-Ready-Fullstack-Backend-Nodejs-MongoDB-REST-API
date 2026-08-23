const express = require("express"); // Express router ব্যবহার করার জন্য Express import করছি

const authenticateUser = require("../middleware/authMiddleware"); // JWT authentication middleware import করছি

const {
  registerUser, // Register controller import করছি
  loginUser, // Login controller import করছি
  refreshAccessToken, // Refresh token controller import করছি
  logoutUser, // Logout controller import করছি
  getCurrentUser // Current logged-in user controller import করছি
} = require("../controllers/authController"); // Authentication controllers import করছি

const router = express.Router(); // Authentication router তৈরি করছি

router.post(
  "/register", // POST /api/auth/register endpoint
  registerUser // Register controller চালাচ্ছি
);

router.post(
  "/login", // POST /api/auth/login endpoint
  loginUser // Login controller চালাচ্ছি
);

router.post(
  "/refresh", // POST /api/auth/refresh endpoint
  refreshAccessToken // Refresh token verify করে নতুন access token তৈরি করছি
);

router.post(
  "/logout", // POST /api/auth/logout endpoint
  logoutUser // Logout controller চালাচ্ছি
);

router.get(
  "/me", // GET /api/auth/me endpoint
  authenticateUser, // Access token verify করে user identity বের করছি
  getCurrentUser // Current logged-in user's information পাঠাচ্ছি
);

module.exports = router; // Authentication router export করছি
