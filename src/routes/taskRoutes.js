const express = require("express"); // Express router ব্যবহার করার জন্য Express import করছি

const authenticateUser = require("../middleware/authMiddleware"); // JWT authentication middleware import করছি

const {
    createTask,
    getMyTasks,
    updateTask,
    deleteTask,
    getTaskById
} = require("../controllers/taskController"); // Create task controller import করছি

const router = express.Router(); // Task-এর জন্য আলাদা router তৈরি করছি

router.post(
  "/",
  authenticateUser,
  createTask
); // POST /api/tasks request আগে authenticate হবে, তারপর task তৈরি করবে

router.get(
    "/",
    authenticateUser,
    getMyTasks
);   // GET /api/tasks → Login করা user শুধু নিজের tasks দেখতে পারব

router.get(
  "/:id", // URL থেকে নির্দিষ্ট task ID নেওয়া হবে
  authenticateUser, // আগে JWT token verify করা হবে
  getTaskById // তারপর নির্দিষ্ট task পাওয়া হবে
);

router.put(
    "/:id",
    authenticateUser,
    updateTask
); // PUT /api/tasks/:id → Login করা user শুধু নিজের task update করতে পারব

router.delete(
  "/:id",
  authenticateUser,
  deleteTask
); // DELETE /api/tasks/:id → Login করা user নিজের task delete করতে পারবে


module.exports = router; // Task router export করছি
