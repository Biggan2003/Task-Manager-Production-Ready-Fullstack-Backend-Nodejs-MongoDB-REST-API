require("dotenv").config();

const app = require("../src/app");
const connectDatabase = require("../src/config/database");

let isDatabaseConnected = false;

const handler = async (req, res) => {
  try {
    if (!isDatabaseConnected) {
      await connectDatabase();
      isDatabaseConnected = true;
    }

    return app(req, res);
  } catch (error) {
    console.error("Database connection error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = handler;
