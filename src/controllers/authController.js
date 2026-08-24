const {
    generateAccessToken, // Access token generate করার function
    generateRefreshToken, // Random refresh token generate করার function
    hashRefreshToken // Refresh token hash করার function
} = require("../utils/jwt");

const RefreshToken = require("../models/RefreshToken");
// Refresh token session database-এ store করার model import করছি

const crypto = require("crypto");
// Refresh token family ID generate করার জন্য crypto import করছি

const bcrypt = require("bcrypt");
// Password securely hash করার জন্য bcrypt import করছি

const User = require("../models/User");
// MongoDB-এর User model import করছি


// ============================================================
// REGISTER USER
// ============================================================

const registerUser = async (req, res) => {
    // Register request handle করার controller তৈরি করছি

    try {
        const { username, email, password } = req.body;
        // Request body থেকে username, email এবং password নিচ্ছি


        if (!username || !email || !password) {
            // কোনো required field missing কি না check করছি

            return res.status(400).json({
                message: "Username, email and password are required"
            });
        }


        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });
        // একই username অথবা email আগে থেকেই আছে কি না খুঁজছি


        if (existingUser) {
            // যদি user আগে থেকেই থাকে

            return res.status(409).json({
                message: "Username or email already exists"
            });
        }


        const hashedPassword = await bcrypt.hash(password, 10);
        // Plain password-কে secure hash-এ convert করছি


        const user = await User.create({
            username,
            // Username save করছি

            email,
            // Email save করছি

            password: hashedPassword
            // Plain password নয়, hashed password save করছি
        });


        return res.status(201).json({
            // Successful registration-এর response পাঠাচ্ছি

            message: "User registered successfully",

            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        // Unexpected error হলে এখানে আসবে

        console.error("Register error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// ============================================================
// LOGIN USER
// ============================================================

const loginUser = async (req, res) => {
    // Login request handle করার controller তৈরি করছি

    try {
        const { email, password } = req.body;
        // Request body থেকে email এবং password নিচ্ছি


        if (!email || !password) {
            // Email অথবা password missing কি না check করছি

            return res.status(400).json({
                message: "Email and password are required"
            });
        }


        const user = await User.findOne({ email });
        // MongoDB থেকে email দিয়ে user খুঁজছি


        if (!user) {
            // User না পাওয়া গেলে

            return res.status(401).json({
                message: "Invalid email or password"
            });
        }


        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );
        // দেওয়া password এবং database-এর hashed password compare করছি


        if (!isPasswordValid) {
            // Password ভুল হলে

            return res.status(401).json({
                message: "Invalid email or password"
            });
        }


        // --------------------------------------------------------
        // Generate Access Token
        // --------------------------------------------------------

        const accessToken = generateAccessToken(user);
        // User-এর জন্য short-lived access token তৈরি করছি


        // --------------------------------------------------------
        // Generate Refresh Token
        // --------------------------------------------------------

        const refreshToken = generateRefreshToken();
        // Secure random refresh token তৈরি করছি


        const tokenHash = hashRefreshToken(refreshToken);
        // Raw refresh token-এর SHA-256 hash তৈরি করছি


        const familyId = crypto.randomUUID();
        // এই login session-এর জন্য unique token family ID তৈরি করছি


        // --------------------------------------------------------
        // Store Refresh Token Session
        // --------------------------------------------------------

        await RefreshToken.create({
            user: user._id,
            // Refresh session কোন user-এর সেটা save করছি

            tokenHash,
            // Raw token নয়, hashed token database-এ save করছি

            expiresAt: new Date(
                Date.now() + 10 * 24 * 60 * 60 * 1000
            ),
            // Refresh token 10 দিন পরে expire হবে

            familyId
            // Token rotation track করার জন্য family ID save করছি
        });


        // --------------------------------------------------------
        // Set Access Token Cookie
        // --------------------------------------------------------

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            // JavaScript থেকে access token access করা বন্ধ করছি

            secure: process.env.NODE_ENV === "production",
            // Production-এ শুধু HTTPS connection-এর মাধ্যমে cookie পাঠাচ্ছি

            sameSite: "strict",
            // Cross-site request থেকে cookie protection দিচ্ছি

            maxAge: 60 * 60 * 1000,
            // Access token cookie 1 hour valid রাখছি

            path: "/"
            // Protected API সহ পুরো application-এর request-এ cookie পাঠানো যাবে
        });


        // --------------------------------------------------------
        // Set Refresh Token Cookie
        // --------------------------------------------------------

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            // JavaScript থেকে refresh token access করা বন্ধ করছি

            secure: process.env.NODE_ENV === "production",
            // Production-এ শুধু HTTPS connection ব্যবহার করছি

            sameSite: "strict",
            // Cross-site request থেকে cookie protection দিচ্ছি

            maxAge: 10 * 24 * 60 * 60 * 1000,
            // Refresh token cookie 10 দিন valid রাখছি

            path: "/api/auth"
            // Refresh/logout/authentication routes-এর জন্য cookie পাঠানো হবে
        });


        // --------------------------------------------------------
        // Login Response
        // --------------------------------------------------------

        return res.status(200).json({
            // Successful login-এর response পাঠাচ্ছি

            message: "Login successful",

            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }

            // IMPORTANT:
            // accessToken এখানে আর পাঠানো হচ্ছে না.
            // JWT শুধুমাত্র HttpOnly cookie-এর মধ্যে থাকবে.
        });

    } catch (error) {
        // Unexpected error হলে এখানে আসবে

        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// ============================================================
// REFRESH ACCESS TOKEN
// ============================================================

const refreshAccessToken = async (req, res) => {
    // Refresh token ব্যবহার করে নতুন access এবং refresh token তৈরি করছি

    try {

        const { refreshToken } = req.cookies;
        // HttpOnly refreshToken cookie থেকে refresh token নিচ্ছি


        if (!refreshToken) {
            // Refresh token cookie না থাকলে

            return res.status(401).json({
                message: "Refresh token is required"
            });
        }


        const tokenHash = hashRefreshToken(refreshToken);
        // Received refresh token-এর hash তৈরি করছি


        const storedToken = await RefreshToken.findOne({
            tokenHash
        });
        // Database-এ token-এর session খুঁজছি


        if (!storedToken) {
            // Database-এ token পাওয়া না গেলে

            return res.status(401).json({
                message: "Invalid refresh token"
            });
        }


        // --------------------------------------------------------
        // Refresh Token Reuse Detection
        // --------------------------------------------------------

        if (storedToken.revokedAt) {
            // আগে ব্যবহার করা/revoked refresh token আবার ব্যবহার করা হয়েছে

            await RefreshToken.updateMany(
                {
                    familyId: storedToken.familyId,
                    revokedAt: null
                },
                {
                    $set: {
                        revokedAt: new Date()
                    }
                }
            );
            // একই token family-এর সব active token revoke করছি


            return res.status(401).json({
                message: "Refresh token reuse detected"
            });
        }


        // --------------------------------------------------------
        // Check Expiration
        // --------------------------------------------------------

        if (storedToken.expiresAt <= new Date()) {

            return res.status(401).json({
                message: "Refresh token has expired"
            });
        }


        // --------------------------------------------------------
        // Find User
        // --------------------------------------------------------

        const user = await User.findById(storedToken.user);
        // Refresh session-এর user খুঁজছি


        if (!user) {

            return res.status(401).json({
                message: "User not found"
            });
        }


        // --------------------------------------------------------
        // Revoke Old Refresh Token
        // --------------------------------------------------------

        storedToken.revokedAt = new Date();
        // পুরোনো refresh token revoke করছি

        storedToken.lastUsedAt = new Date();
        // Last used time update করছি

        await storedToken.save();
        // Updated refresh token database-এ save করছি


        // --------------------------------------------------------
        // Generate New Access Token
        // --------------------------------------------------------

        const accessToken = generateAccessToken(user);
        // নতুন access token তৈরি করছি


        // --------------------------------------------------------
        // Generate New Refresh Token
        // --------------------------------------------------------

        const newRefreshToken = generateRefreshToken();
        // নতুন refresh token তৈরি করছি


        const newTokenHash = hashRefreshToken(newRefreshToken);
        // নতুন refresh token-এর hash তৈরি করছি


        // --------------------------------------------------------
        // Store New Refresh Token
        // --------------------------------------------------------

        await RefreshToken.create({
            user: user._id,
            // Token কোন user-এর সেটা save করছি

            tokenHash: newTokenHash,
            // নতুন refresh token-এর hash save করছি

            expiresAt: new Date(
                Date.now() + 10 * 24 * 60 * 60 * 1000
            ),
            // নতুন refresh token 10 দিন valid থাকবে

            familyId: storedToken.familyId
            // একই token family maintain করছি
        });


        // --------------------------------------------------------
        // Set New Access Token Cookie
        // --------------------------------------------------------

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            // JavaScript access বন্ধ করছি

            secure: process.env.NODE_ENV === "production",
            // Production-এ HTTPS required

            sameSite: "strict",
            // CSRF protection

            maxAge: 60 * 60 * 1000,
            // Access token 1 hour valid থাকবে

            path: "/"
            // Application-এর protected API requests-এর জন্য cookie পাঠানো হবে
        });


        // --------------------------------------------------------
        // Set New Refresh Token Cookie
        // --------------------------------------------------------

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            // JavaScript access বন্ধ করছি

            secure: process.env.NODE_ENV === "production",
            // Production-এ HTTPS required

            sameSite: "strict",
            // Cross-site protection

            maxAge: 10 * 24 * 60 * 60 * 1000,
            // Refresh token 10 দিন valid থাকবে

            path: "/api/auth"
            // Auth endpoints-এর জন্য cookie পাঠানো হবে
        });


        // --------------------------------------------------------
        // Refresh Response
        // --------------------------------------------------------

        return res.status(200).json({
            message: "Access token refreshed successfully"

            // IMPORTANT:
            // accessToken আর response body-তে পাঠানো হচ্ছে না.
            // নতুন access token HttpOnly cookie-তে সেট হয়েছে.
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


// ============================================================
// LOGOUT USER
// ============================================================

const logoutUser = async (req, res) => {
    // User logout করার controller তৈরি করছি

    try {

        const { refreshToken } = req.cookies;
        // HttpOnly refreshToken cookie থেকে refresh token নিচ্ছি


        if (refreshToken) {
            // Refresh token থাকলে database session revoke করছি

            const tokenHash = hashRefreshToken(refreshToken);
            // Raw refresh token-এর hash তৈরি করছি


            const storedToken = await RefreshToken.findOne({
                tokenHash
            });
            // Database-এ একই token hash-এর refresh session খুঁজছি


            if (storedToken && !storedToken.revokedAt) {
                // Token পাওয়া গেলে এবং আগে revoke না হলে

                storedToken.revokedAt = new Date();
                // Current time দিয়ে refresh token revoke করছি

                await storedToken.save();
                // Updated revoked status MongoDB-তে save করছি
            }
        }


        // --------------------------------------------------------
        // Clear Refresh Token Cookie
        // --------------------------------------------------------

        res.clearCookie("refreshToken", {
            httpOnly: true,

            secure: process.env.NODE_ENV === "production",

            sameSite: "strict",

            path: "/api/auth"
            // Login-এর সময় যে path ব্যবহার করা হয়েছিল সেটিই ব্যবহার করছি
        });


        // --------------------------------------------------------
        // Clear Access Token Cookie
        // --------------------------------------------------------

        res.clearCookie("accessToken", {
            httpOnly: true,

            secure: process.env.NODE_ENV === "production",

            sameSite: "strict",

            path: "/"
            // Login-এর accessToken cookie-এর একই path ব্যবহার করছি
        });


        return res.status(200).json({
            message: "Logout successful"
        });

    } catch (error) {

        console.error(
            "Logout error:",
            error.message
        );


        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// ============================================================
// GET CURRENT USER
// ============================================================

const getCurrentUser = async (req, res) => {
    // বর্তমানে logged-in user-এর information পাওয়ার controller তৈরি করছি

    try {

        const user = await User.findById(
            req.user.userId
        ).select("-password");
        // JWT থেকে user ID নিয়ে MongoDB থেকে user খুঁজছি
        // এবং password বাদ দিচ্ছি


        if (!user) {
            // User database-এ না থাকলে

            return res.status(404).json({
                message: "User not found"
            });
        }


        return res.status(200).json({
            // User successfully পাওয়া গেলে response পাঠাচ্ছি

            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        console.error(
            "Get current user error:",
            error.message
        );


        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    getCurrentUser
};
