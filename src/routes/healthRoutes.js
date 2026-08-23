const express = require("express"); // Express router ব্যবহার করার জন্য Express import করছি

const mongoose = require("mongoose"); // MongoDB connection status check করার জন্য Mongoose import করছি

const router = express.Router(); // Health check-এর জন্য আলাদা router তৈরি করছি

router.get("/", (req, res) => { // GET /health endpoint তৈরি করছি

  const isDatabaseConnected =
    mongoose.connection.readyState === 1; // MongoDB বর্তমানে connected কি না check করছি

  if (!isDatabaseConnected) { // Database connected না থাকলে
    return res.status(503).json({
      status: "error", // Server চলছে কিন্তু dependency/database healthy নয়
      database: "disconnected" // MongoDB connection status জানাচ্ছি
    });
  }

  res.status(200).json({ // Server এবং database দুটোই healthy হলে response পাঠাচ্ছি
    status: "ok", // Server successfully running আছে
    database: "connected" // MongoDB successfully connected আছে
  });
});

module.exports = router; // Health router export করছি
