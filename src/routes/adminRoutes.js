const express = require("express"); // Express router ব্যবহার করার জন্য Express import করছি

const authenticateUser = require("../middleware/authMiddleware"); // JWT authentication middleware import করছি

const authorizeAdmin = require("../middleware/adminMiddleware"); // Admin authorization middleware import করছি

const {
  getAllUsers, // সব users পাওয়ার controller import করছি
  getAllTasks, // সব tasks পাওয়ার controller import করছি
  getUserTasks, // নির্দিষ্ট user's tasks পাওয়ার controller import করছি
  getUserById, // নির্দিষ্ট user's details পাওয়ার controller import করছ
  updateUserRole, // User role update করার controller import করছ
  deleteUser // User delete করার controller import করছ
} = require("../controllers/adminController");

const router = express.Router(); // Admin-এর জন্য আলাদা router তৈরি করছি

router.get(
  "/users", // GET /api/admin/users endpoint
  authenticateUser, // প্রথমে user-এর JWT verify করছি
  authorizeAdmin, // তারপর user admin কি না check করছি
  getAllUsers // সব users-এর data পাঠাচ্ছি
);

router.get(
  "/tasks", // GET /api/admin/tasks endpoint
  authenticateUser, // প্রথমে JWT verify করছি
  authorizeAdmin, // তারপর নিশ্চিত করছি user admin কি না
  getAllTasks // সব users-এর tasks পাঠাচ্ছি
);


router.get(
  "/users/:userId/tasks", // GET /api/admin/users/:userId/tasks endpoint
  authenticateUser, // প্রথমে JWT verify করছি
  authorizeAdmin, // তারপর নিশ্চিত করছি user admin কি না
  getUserTasks // নির্দিষ্ট user's tasks পাঠাচ্ছি
);


router.get(
  "/users/:id", // GET /api/admin/users/:id endpoint
  authenticateUser, // প্রথমে JWT verify করছি
  authorizeAdmin, // তারপর নিশ্চিত করছি user admin কি না
  getUserById // নির্দিষ্ট user's details পাঠাচ্ছি
);

router.patch(
  "/users/:id/role", // PATCH /api/admin/users/:id/role endpoint
  authenticateUser, // প্রথমে JWT verify করছি
  authorizeAdmin, // তারপর নিশ্চিত করছি request করা user admin কি না
  updateUserRole // User-এর role update করছি
);

router.delete(
  "/users/:id", // DELETE /api/admin/users/:id endpoint
  authenticateUser, // প্রথমে JWT verify করছি
  authorizeAdmin, // তারপর নিশ্চিত করছি request করা user admin কি না
  deleteUser // User এবং তার associated tasks delete করছি
);

module.exports = router; // Admin router export করছি
