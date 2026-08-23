const mongoose = require("mongoose"); // MongoDB schema তৈরি করার জন্য Mongoose import করছি

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String, // Username string হিসেবে থাকবে
      required: true, // Username অবশ্যই দিতে হবে
      unique: true, // একই username দিয়ে একাধিক account তৈরি করা যাবে না
      trim: true // অতিরিক্ত space remove করবে
    },

    email: {
      type: String, // Email string হিসেবে থাকবে
      required: true, // Email অবশ্যই দিতে হবে
      unique: true, // একই email দিয়ে একাধিক account তৈরি করা যাবে না
      lowercase: true, // Email automatically lowercase করবে
      trim: true // অতিরিক্ত space remove করবে
    },

    password: {
      type: String, // এখানে hashed password রাখা হবে
      required: true // Password অবশ্যই থাকতে হবে
    },

    role: {
      type: String, // User-এর role string হিসেবে থাকবে
      enum: ["user", "admin"], // শুধু user অথবা admin হতে পারবে
      default: "user" // নতুন account-এর default role user
    }
  },

  {
    timestamps: true // createdAt এবং updatedAt automatically তৈরি করবে
  }
);

module.exports = mongoose.model("User", userSchema); // User model তৈরি করে export করছি
