const mongoose = require("mongoose"); // MongoDB-এর সাথে কাজ করার জন্য Mongoose import করছি

const connectDatabase = async () => { // Database connection-এর জন্য একটি async function তৈরি করছি
  try {
    await mongoose.connect(process.env.MONGO_URI); // .env থেকে MONGO_URI নিয়ে MongoDB Atlas-এ connect করছি

    console.log("MongoDB connected successfully"); // Connection সফল হলে এই message দেখাবে
  } catch (error) {
    console.error("MongoDB connection failed:", error.message); // Connection fail হলে error দেখাবে
    throw error; // Error-টি server.js-এ পাঠিয়ে দিচ্ Error throw করে higher level-এ handle করার জন্য
    
  }
};

module.exports = connectDatabase; // Function-টি অন্য file থেকে ব্যবহার করার জন্য export করছি
