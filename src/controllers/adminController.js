const User = require("../models/User"); // MongoDB-এর User model import করছি



const getAllUsers = async (req, res) => { // সব users পাওয়ার controller তৈরি করছি
  try {
    const users = await User.find()
      .select("-password"); // সব users খুঁজছি এবং password বাদ দিচ্ছি

    res.status(200).json({ // Users successfully পাওয়া গেলে response পাঠাচ্ছি
      users
    });

  } catch (error) { // Unexpected error হলে এখানে আসবে
    console.error("Get all users error:", error.message); // Server console-এ error দেখাচ্ছি

    res.status(500).json({
      message: "Internal server error"
    });
  }
};


const Task = require("../models/Task"); // MongoDB-এর Task model import করছি

const getAllTasks = async (req, res) => { // সব users-এর সব tasks পাওয়ার controller তৈরি করছি
  try {
    const tasks = await Task.find()
      .sort({
        createdAt: -1 // নতুন tasks আগে দেখানোর জন্য descending order ব্যবহার করছি
      });

    res.status(200).json({ // Tasks successfully পাওয়া গেলে response পাঠাচ্ছি
      tasks
    });

  } catch (error) { // Unexpected error হলে এখানে আসবে
    console.error("Get all tasks error:", error.message); // Server console-এ error দেখাচ্ছি

    res.status(500).json({
      message: "Internal server error"
    });
  }
};

const getUserTasks = async (req, res) => { // নির্দিষ্ট একজন user's সব tasks পাওয়ার controller তৈরি করছি
  try {
    const { userId } = req.params; // URL থেকে user ID নিচ্ছি

    const user = await User.findById(userId)
      .select("-password"); // User ID দিয়ে user খুঁজছি এবং password বাদ দিচ্ছি

    if (!user) { // User database-এ না থাকলে
      return res.status(404).json({
        message: "User not found"
      });
    }

    const tasks = await Task.find({
      user: userId // শুধুমাত্র নির্দিষ্ট user's tasks খুঁজছি
    }).sort({
      createdAt: -1 // নতুন task আগে দেখানোর জন্য descending order ব্যবহার করছি
    });

    res.status(200).json({ // User এবং তার tasks successfully পাওয়া গেলে response পাঠাচ্ছি
      user: {
        id: user._id, // User ID পাঠাচ্ছি
        username: user.username, // Username পাঠাচ্ছি
        email: user.email, // Email পাঠাচ্ছি
        role: user.role // User role পাঠাচ্ছি
      },
      tasks
    });

  } catch (error) { // Unexpected error হলে এখানে আসবে
    console.error("Get user tasks error:", error.message); // Server console-এ error দেখাচ্ছি

    res.status(500).json({
      message: "Internal server error"
    });
  }
};



const getUserById = async (req, res) => { // নির্দিষ্ট একজন user-এর details পাওয়ার controller তৈরি করছি
  try {
    const { id } = req.params; // URL থেকে user ID নিচ্ছি

    const user = await User.findById(id)
      .select("-password"); // User ID দিয়ে user খুঁজছি এবং password বাদ দিচ্ছি

    if (!user) { // User database-এ না থাকলে
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json({ // User successfully পাওয়া গেলে response পাঠাচ্ছি
      user: {
        id: user._id, // MongoDB user ID পাঠাচ্ছি
        username: user.username, // Username পাঠাচ্ছি
        email: user.email, // Email পাঠাচ্ছি
        role: user.role, // User role পাঠাচ্ছি
        createdAt: user.createdAt, // Account creation time পাঠাচ্ছি
        updatedAt: user.updatedAt // Last update time পাঠাচ্ছি
      }
    });

  } catch (error) { // Unexpected error হলে এখানে আসবে
    console.error("Get user by ID error:", error.message); // Server console-এ error দেখাচ্ছি

    res.status(500).json({
      message: "Internal server error"
    });
  }
};



const updateUserRole = async (req, res) => { // নির্দিষ্ট user's role পরিবর্তন করার controller তৈরি করছি
  try {
    const { id } = req.params; // URL থেকে user ID নিচ্ছি

    const { role } = req.body; // Request body থেকে নতুন role নিচ্ছি

    if (!["user", "admin"].includes(role)) { // Role শুধুমাত্র user অথবা admin কি না check করছি
      return res.status(400).json({
        message: "Role must be either user or admin"
      });
    }

    if (id === req.user.userId) { // Admin নিজের role পরিবর্তন করতে চাইছে কি না check করছি
      return res.status(400).json({
        message: "You cannot change your own role"
      });
    }

    const user = await User.findById(id); // User ID দিয়ে MongoDB থেকে user খুঁজছি

    if (!user) { // User database-এ না থাকলে
      return res.status(404).json({
        message: "User not found"
      });
    }

    user.role = role; // User-এর নতুন role সেট করছি

    await user.save(); // Updated role MongoDB-তে save করছি

    res.status(200).json({ // Role successfully update হলে response পাঠাচ্ছি
      message: "User role updated successfully",
      user: {
        id: user._id, // User ID পাঠাচ্ছি
        username: user.username, // Username পাঠাচ্ছি
        email: user.email, // Email পাঠাচ্ছি
        role: user.role // Updated role পাঠাচ্ছি
      }
    });

  } catch (error) { // Unexpected error হলে এখানে আসবে
    console.error("Update user role error:", error.message); // Server console-এ error দেখাচ্ছি

    res.status(500).json({
      message: "Internal server error"
    });
  }
};


const deleteUser = async (req, res) => { // নির্দিষ্ট user delete করার controller তৈরি করছি
  try {
    const { id } = req.params; // URL থেকে user ID নিচ্ছি

    if (id === req.user.userId) { // Admin নিজের account delete করতে চাইছে কি না check করছি
      return res.status(400).json({
        message: "You cannot delete your own account"
      });
    }

    const user = await User.findById(id); // User ID দিয়ে MongoDB থেকে user খুঁজছি

    if (!user) { // User database-এ না থাকলে
      return res.status(404).json({
        message: "User not found"
      });
    }

    await Task.deleteMany({
      user: id // User-এর সব tasks MongoDB থেকে delete করছি
    });

    await User.deleteOne({
      _id: id // তারপর user account MongoDB থেকে delete করছি
    });

    res.status(200).json({ // User successfully delete হলে response পাঠাচ্ছি
      message: "User and associated tasks deleted successfully"
    });

  } catch (error) { // Unexpected error হলে এখানে আসবে
    console.error("Delete user error:", error.message); // Server console-এ error দেখাচ্ছি

    res.status(500).json({
      message: "Internal server error"
    });
  }
};


module.exports = {
  getAllUsers,// Controller function-টি route-এ ব্যবহারের জন্য export করছি
  getAllTasks, // Controller function-টি route-এ ব্যবহারের জন্য export করছি
  getUserTasks, // Controller function-টি route-এ ব্যবহারের জন্য export করছি
  getUserById, // নির্দিষ্ট user's details পাওয়ার controller export করছ
  updateUserRole, // User role update করার controller export করছ
  deleteUser // User delete করার controller export করছ
};

