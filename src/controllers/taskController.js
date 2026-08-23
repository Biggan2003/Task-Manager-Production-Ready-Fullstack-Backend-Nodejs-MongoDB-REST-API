const Task = require("../models/Task"); // MongoDB-এর Task model import করছি


const createTask = async (req, res) => { // নতুন task তৈরি করার controller তৈরি করছি
  try {
    const { title, done = false } = req.body; // Request body থেকে title এবং done নিচ্ছি

    if (!title || title.trim() === "") { // Title missing অথবা empty কি না check করছি
      return res.status(400).json({
        message: "Title is required"
      });
    }

    const task = await Task.create({
      title: title.trim(), // Task title-এর extra spaces remove করে save করছি
      done: Boolean(done), // done value-কে Boolean হিসেবে save করছি
      user: req.user.userId // JWT থেকে পাওয়া user ID-কে task owner হিসেবে save করছি
    });

    res.status(201).json({ // Task successfully তৈরি হলে response পাঠাচ্ছি
      message: "Task created successfully",
      task
    });

  } catch (error) { // Unexpected error হলে এখানে আসবে
    console.error("Create task error:", error.message); // Server console-এ error দেখাচ্ছি

    res.status(500).json({
      message: "Internal server error"
    });
  }
};


const getMyTasks = async (req, res) => { // Logged-in user-এর tasks পাওয়ার controller তৈরি করছি
  try {
    const tasks = await Task.find({
      user: req.user.userId // শুধু current user's tasks খুঁজছি
    }).sort({
      createdAt: -1 // নতুন task আগে দেখানোর জন্য descending order ব্যবহার করছি
    });

    res.status(200).json({
      tasks
    });

  } catch (error) {
    console.error("Get tasks error:", error.message);

    res.status(500).json({
      message: "Internal server error"
    });
  }
};

const getTaskById = async (req, res) => { // নির্দিষ্ট একটি task পাওয়ার controller তৈরি করছি
  try {
    const { id } = req.params; // URL থেকে task ID নিচ্ছি

    const task = await Task.findOne({
      _id: id, // নির্দিষ্ট task ID খুঁজছি
      user: req.user.userId // শুধুমাত্র logged-in user's task খুঁজছি
    });

    if (!task) { // Task না পাওয়া গেলে অথবা অন্য user's task হলে
      return res.status(404).json({
        message: "Task not found"
      });
    }

    res.status(200).json({ // Task পাওয়া গেলে successful response পাঠাচ্ছি
      task
    });

  } catch (error) { // Unexpected error হলে এখানে আসবে
    console.error("Get task error:", error.message); // Server console-এ error দেখাচ্ছি

    res.status(500).json({
      message: "Internal server error"
    });
  }
};


const updateTask = async (req, res) => { // Existing task update করার controller তৈরি করছি
  try {
    const { id } = req.params; // URL থেকে task ID নিচ্ছি

    const { title, done } = req.body; // Request body থেকে title এবং done নিচ্ছি

    const task = await Task.findOne({
      _id: id, // নির্দিষ্ট task ID খুঁজছি
      user: req.user.userId // Task-টি current user-এর কি না নিশ্চিত করছি
    });

    if (!task) { // Task না পাওয়া গেলে অথবা অন্য user's task হলে
      return res.status(404).json({
        message: "Task not found"
      });
    }

    if (title !== undefined) { // Request-এ title দেওয়া হয়েছে কি না check করছি

      if (typeof title !== "string" || title.trim() === "") { // Title valid কি না check করছি
        return res.status(400).json({
          message: "Title must not be empty"
        });
      }

      task.title = title.trim(); // Valid title update করছি
    }

    if (done !== undefined) { // Request-এ done value দেওয়া হয়েছে কি না check করছি
      task.done = Boolean(done); // done value Boolean হিসেবে update করছি
    }

    await task.save(); // Updated task MongoDB-তে save করছি

    res.status(200).json({
      message: "Task updated successfully",
      task
    });

  } catch (error) {
    console.error("Update task error:", error.message);

    res.status(500).json({
      message: "Internal server error"
    });
  }
};


const deleteTask = async (req, res) => { // Existing task delete করার controller তৈরি করছি
  try {
    const { id } = req.params; // URL থেকে task ID নিচ্ছি

    const task = await Task.findOne({
      _id: id, // নির্দিষ্ট task ID খুঁজছি
      user: req.user.userId // নিশ্চিত করছি task-টি current logged-in user's
    });

    if (!task) { // Task না পাওয়া গেলে অথবা অন্য user's task হলে
      return res.status(404).json({
        message: "Task not found"
      });
    }

    await Task.deleteOne({
      _id: id // নির্দিষ্ট task MongoDB থেকে delete করছি
    });

    res.status(200).json({ // Successful deletion-এর response পাঠাচ্ছি
      message: "Task deleted successfully"
    });

  } catch (error) { // Unexpected error হলে এখানে আসবে
    console.error("Delete task error:", error.message); // Server console-এ error দেখাচ্ছি

    res.status(500).json({
      message: "Internal server error"
    });
  }
};




module.exports = {
  createTask, // Create task controller export করছি
  getMyTasks, // সব নিজের task পাওয়ার controller export করছি
  getTaskById, // নির্দিষ্ট task পাওয়ার controller export করছি
  updateTask, // Task update controller export করছি
  deleteTask // Task delete controller export করছি
};
