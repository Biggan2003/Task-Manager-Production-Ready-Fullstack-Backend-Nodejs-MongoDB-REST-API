const jwt = require("jsonwebtoken"); // JWT token তৈরি এবং verify করার জন্য jsonwebtoken import করছি

const crypto = require("crypto"); // Secure random token এবং hashing করার জন্য crypto import করছি

const generateAccessToken = (user) => { // Access token তৈরি করার function
  return jwt.sign(
    {
      userId: user._id, // Token-এর ভিতরে user ID রাখছি
      role: user.role // Authorization-এর জন্য user role রাখছি
    },
    process.env.JWT_ACCESS_SECRET, // .env থেকে access token secret নিচ্ছি
    {
      expiresIn: "1h" // Access token 1 ঘন্টা পর্যন্ত valid থাকবে
    }
  );
};



const generateRefreshToken = () => { // Database-backed refresh token-এর জন্য random token তৈরি করছি
  return crypto.randomBytes(64).toString("hex"); // 64 bytes-এর cryptographically secure random token তৈরি করছি
};

const hashRefreshToken = (token) => { // Refresh token database-এ রাখার আগে hash করার function
  return crypto
    .createHash("sha256") // SHA-256 hashing algorithm ব্যবহার করছি
    .update(token) // Raw refresh token hash করছি
    .digest("hex"); // Hash-টিকে hexadecimal string হিসেবে return করছি
};

module.exports = {
  generateAccessToken, // Access token function export করছি
  generateRefreshToken, // Refresh token function export করছি
  hashRefreshToken // Refresh token hash করার function export করছ
};
