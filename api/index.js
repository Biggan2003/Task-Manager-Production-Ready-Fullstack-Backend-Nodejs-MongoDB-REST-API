require("dotenv").config();

const app = require("../src/app");
const connectDatabase = require("../src/config/database");

let isDatabaseConnected = false;

module.exports = async (req, res) => {
    try {
        if (!isDatabaseConnected) {
            await connectDatabase();
            isDatabaseConnected = true;
        }

        return app(req, res);
    } catch (error) {
        console.error("Database connection failed:", error);

        return res.status(503).json({
            status: "error",
            database: "disconnected",
        });
    }
};
