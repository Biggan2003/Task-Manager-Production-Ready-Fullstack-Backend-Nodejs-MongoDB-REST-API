const mongoose = require("mongoose");

let cachedConnection = null;

const connectDatabase = async () => {
  try {
    if (cachedConnection) {
      return cachedConnection;
    }

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined");
    }

    cachedConnection = await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully");

    return cachedConnection;
  } catch (error) {
    cachedConnection = null;

    console.error("MongoDB connection failed:", error.message);

    throw error;
  }
};

module.exports = connectDatabase;
