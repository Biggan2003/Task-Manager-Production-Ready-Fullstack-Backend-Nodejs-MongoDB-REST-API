const authorizeAdmin = (req, res, next) => { // শুধুমাত্র admin user-এর access যাচাই করার middleware
  if (req.user.role !== "admin") { // Logged-in user's role admin কি না check করছি
    return res.status(403).json({
      message: "Admin access required"
    }); // Admin না হলে request reject করছি
  }

  next(); // User admin হলে পরবর্তী middleware/controller-এ পাঠাচ্ছি
};

module.exports = authorizeAdmin; // Admin authorization middleware export করছি

