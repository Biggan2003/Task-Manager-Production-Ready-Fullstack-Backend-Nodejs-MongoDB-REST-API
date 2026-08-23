const {
  generateAccessToken, // Access token generate করার function
  generateRefreshToken, // Random refresh token generate করার function
  hashRefreshToken // Refresh token hash করার function
} = require("../utils/jwt");

const RefreshToken = require("../models/RefreshToken"); // Refresh token session database-এ store করার model import করছি

const crypto = require("crypto"); // Refresh token family ID generate করার জন্য crypto import করছি



const bcrypt = require("bcrypt"); // Password securely hash করার জন্য bcrypt import করছি

const User = require("../models/User"); // MongoDB-এর User model import করছি



const registerUser = async (req, res) => { // Register request handle করার controller তৈরি করছি
  try {
    const { username, email, password } = req.body; // Request body থেকে username, email এবং password নিচ্ছি

    if (!username || !email || !password) { // কোনো required field missing কি না check করছি
      return res.status(400).json({
        message: "Username, email and password are required"
      });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }] // একই username অথবা email আগে থেকেই আছে কি না খুঁজছি
    });

    if (existingUser) { // যদি user আগে থেকেই থাকে
      return res.status(409).json({
        message: "Username or email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Plain password-কে secure hash-এ convert করছি

    const user = await User.create({
      username, // User-এর username save করছি
      email, // User-এর email save করছি
      password: hashedPassword // Plain password নয়, hashed password save করছি
    });

    res.status(201).json({ // Successful registration-এর response পাঠাচ্ছি
      message: "User registered successfully",
      user: {
        id: user._id, // MongoDB generated user ID পাঠাচ্ছি
        username: user.username, // Username পাঠাচ্ছি
        email: user.email, // Email পাঠাচ্ছি
        role: user.role // User-এর role পাঠাচ্ছি
      }
    });
  } catch (error) { // Unexpected error হলে এখানে আসবে
    console.error("Register error:", error.message); // Server console-এ error দেখাচ্ছি

    res.status(500).json({
      message: "Internal server error"
    });
  }
};



const loginUser = async (req, res) => { // Login request handle করার controller তৈরি করছি
  try {
    const { email, password } = req.body; // Request body থেকে email এবং password নিচ্ছি

    if (!email || !password) { // Email অথবা password missing কি না check করছি
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email }); // MongoDB থেকে email দিয়ে user খুঁজছি

    if (!user) { // User না পাওয়া গেলে
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    ); // দেওয়া password এবং database-এর hashed password compare করছি

    if (!isPasswordValid) { // Password ভুল হলে
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const accessToken = generateAccessToken(user); // User-এর জন্য short-lived access token তৈরি করছি

    const refreshToken = generateRefreshToken(); // Secure random refresh token তৈরি করছি

    const tokenHash = hashRefreshToken(refreshToken); // Raw refresh token-এর SHA-256 hash তৈরি করছি

    const familyId = crypto.randomUUID(); // এই login session-এর জন্য unique token family ID তৈরি করছি

    await RefreshToken.create({
    user: user._id, // Refresh session কোন user-এর সেটা save করছি
    tokenHash, // Raw token নয়, hashed token database-এ save করছি
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Refresh token 10 দিন পরে expire হবে
    familyId // Token rotation track করার জন্য family ID save করছি
    });

    res.status(200).json({ // Login successful হলে response পাঠাচ্ছি
      message: "Login successful",

      accessToken, // API authentication-এর জন্য access token পাঠাচ্

      refreshToken, // Access token refresh করার জন্য refresh token পাঠাচ্ছি

      user: {
        id: user._id,  // MongoDB user ID পাঠাচ্
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) { // Unexpected error হলে এখানে আসবে
    console.error("Login error:", error.message); // Server console-এ error দেখাচ্ছি

    res.status(500).json({
      message: "Internal server error"
    });
  }
};




const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body; // Client থেকে refresh token নিচ্ছি

    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh token is required"
      });
    }

    const tokenHash = hashRefreshToken(refreshToken); // Received token-এর hash তৈরি করছি

    const storedToken = await RefreshToken.findOne({
      tokenHash
    }); // Database-এ token-এর session খুঁজছি

    if (!storedToken) {
      return res.status(401).json({
        message: "Invalid refresh token"
      });
    }

    if (storedToken.revokedAt) { // আগে ব্যবহার করা/revoked refresh token আবার ব্যবহার করা হয়েছে কি না check করছি

        await RefreshToken.updateMany(
            {
                familyId: storedToken.familyId, // একই token family-এর সব session খুঁজছি
                revokedAt: null // যেগুলো এখনো revoked হয়নি শুধু সেগুলো নিচ্ছি
            },
            {
                $set: {
                    revokedAt: new Date() // পুরো token family revoke করছি
                }
            }
        );

        return res.status(401).json({
            message: "Refresh token reuse detected" // পুরোনো token reuse detect হলে request reject করছি
        });

    }


    if (storedToken.expiresAt <= new Date()) {
      return res.status(401).json({
        message: "Refresh token has expired"
      });
    }

    const user = await User.findById(
      storedToken.user
    ); // Refresh session-এর user খুঁজছি

    if (!user) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    // পুরোনো refresh token revoke করছি
    storedToken.revokedAt = new Date();
    storedToken.lastUsedAt = new Date();

    await storedToken.save();

    // নতুন access token তৈরি করছি
    const accessToken = generateAccessToken(user);

    // নতুন refresh token তৈরি করছি
    const newRefreshToken = generateRefreshToken();

    // নতুন refresh token-এর hash তৈরি করছি
    const newTokenHash = hashRefreshToken(newRefreshToken);

    // নতুন token একই family-এর মধ্যে রাখছি
    await RefreshToken.create({
      user: user._id,
      tokenHash: newTokenHash,
      expiresAt: new Date(
        Date.now() + 10 * 24 * 60 * 60 * 1000
      ),
      familyId: storedToken.familyId
    });

    res.status(200).json({
      message: "Access token refreshed successfully",
      accessToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    console.error(
      "Refresh token error:",
      error.message
    );

    return res.status(401).json({
      message: "Invalid or expired refresh token"
    });
  }
};


const logoutUser = async (req, res) => { // User logout করার controller তৈরি করছি
  try {
    const { refreshToken } = req.body; // Client request body থেকে refresh token নিচ্ছি

    if (!refreshToken) { // Refresh token দেওয়া হয়েছে কি না check করছি
      return res.status(400).json({
        message: "Refresh token is required" // Token না থাকলে Bad Request response পাঠাচ্ছি
      });
    }

    const tokenHash = hashRefreshToken(refreshToken); // Raw refresh token-এর SHA-256 hash তৈরি করছি

    const storedToken = await RefreshToken.findOne({
      tokenHash // Database-এ একই token hash-এর refresh session খুঁজছি
    });

    if (!storedToken) { // Database-এ token session না পাওয়া গেলে
      return res.status(401).json({
        message: "Invalid refresh token" // Invalid token response পাঠাচ্ছি
      });
    }

    if (!storedToken.revokedAt) { // Token আগে থেকেই revoked কি না check করছি
      storedToken.revokedAt = new Date(); // Current time দিয়ে refresh token revoke করছি

      await storedToken.save(); // Updated revoked status MongoDB-তে save করছি
    }

    return res.status(200).json({
      message: "Logout successful" // Token successfully revoke হলে logout response পাঠাচ্ছি
    });

  } catch (error) { // Unexpected server/database error হলে এখানে আসবে
    console.error("Logout error:", error.message); // Server console-এ error log করছি

    return res.status(500).json({
      message: "Internal server error" // Unexpected error-এর জন্য generic response পাঠাচ্ছি
    });
  }
};


const getCurrentUser = async (req, res) => { // বর্তমানে logged-in user-এর information পাওয়ার controller তৈরি করছি
  try {
    const user = await User.findById(req.user.userId).select("-password"); // JWT থেকে user ID নিয়ে MongoDB থেকে user খুঁজছি এবং password বাদ দিচ্ছি

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
        role: user.role // User role পাঠাচ্ছি
      }
    });

  } catch (error) { // Unexpected error হলে এখানে আসবে
    console.error("Get current user error:", error.message); // Server console-এ error দেখাচ্ছি

    res.status(500).json({
      message: "Internal server error"
    });
  }
};



module.exports = {
  registerUser, // Controller function-টি route-এ ব্যবহারের জন্য export করছি
  loginUser, // Controller function-টি route-এ ব্যবহারের জন্য export করছি
  refreshAccessToken, // Controller function-টি route-এ ব্যবহারের জন্য export করছি
  logoutUser, // Controller function-টি route-এ ব্যবহারের জন্য export করছি
  getCurrentUser // Controller function-টি route-এ ব্যবহারের জন্য export করছি
};

