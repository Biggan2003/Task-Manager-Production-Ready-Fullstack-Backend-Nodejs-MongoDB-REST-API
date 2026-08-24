const jwt = require("jsonwebtoken");
// JWT token verify করার জন্য jsonwebtoken import করছি


const authenticateUser = (req, res, next) => {
  // Protected API request authenticate করার middleware তৈরি করছি


  const token = req.cookies.accessToken;
  // HttpOnly accessToken cookie থেকে JWT token নিচ্ছি


  if (!token) {
    // Access token cookie না থাকলে

    return res.status(401).json({
      message: "Access token is required",
    });
    // Authentication fail করছি
  }


  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    );
    // Cookie থেকে পাওয়া access token আমাদের secret দিয়ে verify করছি


    req.user = decoded;
    // Token থেকে পাওয়া user information request-এর মধ্যে সংরক্ষণ করছি


    next();
    // Authentication successful হলে পরবর্তী middleware/controller-এ request পাঠাচ্ছি


  } catch (error) {
    // Token invalid অথবা expired হলে এখানে আসবে

    return res.status(401).json({
      message: "Invalid or expired access token",
    });
    // Authentication failure response পাঠাচ্ছি
  }
};


module.exports = authenticateUser;
// Middleware-টি অন্য route-এ ব্যবহার করার জন্য export করছি
