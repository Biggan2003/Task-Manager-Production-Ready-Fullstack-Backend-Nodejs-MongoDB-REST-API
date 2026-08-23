const mongoose = require("mongoose"); // MongoDB schema তৈরি করার জন্য Mongoose import করছি

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String, // Task-এর title string হিসেবে থাকবে
      required: true, // Title অবশ্যই দিতে হবে
      trim: true // শুরু/শেষের unnecessary spaces remove করবে
    },

    done: {
      type: Boolean, // Task complete হয়েছে কি না সেটা Boolean হবে
      default: false // কিছু না দিলে default false হবে
    },

    user: {
      type: mongoose.Schema.Types.ObjectId, // কোন user task-টি তৈরি করেছে তার MongoDB ID রাখবে
      ref: "User", // User model-এর সাথে relationship তৈরি করবে
      required: true // প্রত্যেক task-এর একজন owner থাকতে হবে
    }
  },

  {
    timestamps: true // createdAt এবং updatedAt automatically তৈরি করবে
  }
);

module.exports = mongoose.model("Task", taskSchema); // Task model তৈরি করে অন্য file-এ ব্যবহার করার জন্য export করছি
