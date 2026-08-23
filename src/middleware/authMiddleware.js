const jwt = require("jsonwebtoken"); // JWT token verify করার জন্য jsonwebtoken import করছি

const authenticateUser = (req, res, next) => { // Protected API request authenticate করার middleware তৈরি করছি

  const authHeader = req.headers.authorization; // Request-এর Authorization header থেকে token নিচ্ছি

  if (!authHeader || !authHeader.startsWith("Bearer ")) { // Authorization header আছে কি না এবং Bearer format ঠিক আছে কি না check করছি
    return res.status(401).json({
      message: "Access token is required"
    });
  }

  const token = authHeader.split(" ")[1]; // "Bearer TOKEN" থেকে শুধু JWT token আলাদা করছি

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    ); // Access token-টি আমাদের secret দিয়ে verify করছি

    req.user = decoded; // Token থেকে পাওয়া user information request-এর মধ্যে সংরক্ষণ করছি

    next(); // Authentication successful হলে পরবর্তী middleware বা controller-এ request পাঠাচ্ছি

  } catch (error) { // Token invalid অথবা expired হলে এখানে আসবে

    return res.status(401).json({
      message: "Invalid or expired access token"
    });
  }
};

module.exports = authenticateUser; // Middleware-টি অন্য route-এ ব্যবহার করার জন্য export করছি
