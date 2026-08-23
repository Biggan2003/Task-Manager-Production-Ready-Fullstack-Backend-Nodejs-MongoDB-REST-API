require("dotenv").config(); // .env file থেকে environment variables load করছি

const app = require("./app"); // Express application import করছি

const connectDatabase = require("./config/database"); // MongoDB connection function import করছি

const PORT = process.env.PORT || 3005; // .env থেকে port নিচ্ছি, না থাকলে 3005 ব্যবহার হবে

const startServer = async () => { // Server start করার জন্য async function তৈরি করছি
  try {
    await connectDatabase(); // প্রথমে MongoDB Atlas-এর সাথে connection তৈরি করছি

    app.listen(PORT, () => { // Database connected হলে Express server চালু করছি
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) { // Server startup-এর সময় কোনো error হলে এখানে আসবে
    console.error("Failed to start server:", error.message); // Error console-এ দেখাচ্ছি
    process.exit(1); // Application বন্ধ করছি
  }
};

startServer(); // Server startup process শুরু করছি
