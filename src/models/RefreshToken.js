const mongoose = require("mongoose"); // MongoDB model তৈরি করার জন্য Mongoose import করছি

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId, // User-এর MongoDB ID store করছি
      ref: "User", // User model-এর সাথে relation তৈরি করছি
      required: true, // User অবশ্যই থাকতে হবে
      index: true // User দিয়ে দ্রুত query করার জন্য index করছি
    },

    tokenHash: {
      type: String, // Hashed refresh token store করছি
      required: true, // Token hash অবশ্যই থাকতে হবে
      unique: true // একই token hash একাধিকবার store হতে দিচ্ছি না
    },

    expiresAt: {
      type: Date, // Refresh token কখন expire হবে সেটা store করছি
      required: true,
      index: true // Expired token দ্রুত খুঁজতে index করছি
    },

    revokedAt: {
      type: Date, // Logout/revoke হওয়ার সময় store করছি
      default: null // শুরুতে token revoked থাকবে না
    },

    lastUsedAt: {
      type: Date, // Refresh token সর্বশেষ কখন ব্যবহার হয়েছে সেটা রাখছি
      default: null
    },

    familyId: {
      type: String, // Refresh token family identify করার জন্য ID রাখছি
      required: true,
      index: true
    }
  },
  {
    timestamps: true // createdAt এবং updatedAt automatically তৈরি করছি
  }
);

const RefreshToken = mongoose.model(
  "RefreshToken", // MongoDB collection-এর model name
  refreshTokenSchema // উপরের schema ব্যবহার করছি
);

module.exports = RefreshToken; // RefreshToken model export করছি
