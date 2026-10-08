const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// ==========================================
// GENERATE JWT TOKEN
// ==========================================

const generateToken = (userId, role) => {
    return jwt.sign(
        {
            userId,
            role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
};

// ==========================================
// FORMAT VALIDATION ERRORS
// ==========================================

const getValidationErrors = (error) => {
    const errors = {};

    if (error && error.errors) {
        Object.keys(error.errors).forEach(
            (field) => {
                errors[field] =
                    error.errors[field].message;
            }
        );
    }

    return errors;
};

// ==========================================
// REGISTER USER
// ==========================================

const registerUser = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            password,
            role,
        } = req.body || {};

        // --------------------------------------
        // BASIC REQUIRED FIELD VALIDATION
        // --------------------------------------

        if (
            !name ||
            !email ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email and password are required",
            });
        }

        const normalizedEmail =
            email
                .toString()
                .trim()
                .toLowerCase();

        // --------------------------------------
        // CHECK EXISTING USER
        // --------------------------------------

        const existingUser =
            await User.findOne({
                email: normalizedEmail,
            });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message:
                    "Email already registered",
            });
        }

        // --------------------------------------
        // CREATE USER
        // --------------------------------------
        // If role is not provided,
        // User model default will be used.
        //
        // If role is provided,
        // Mongoose enum validation will validate it.
        // --------------------------------------

        const user =
            await User.create({
                name,
                email: normalizedEmail,
                phone,
                password,
                role,
            });

        // --------------------------------------
        // SUCCESS RESPONSE
        // --------------------------------------

        return res.status(201).json({
            success: true,
            message:
                "User registered successfully",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
            },
        });

    } catch (error) {
        console.error(
            "Register Error:",
            error
        );

        // --------------------------------------
        // MONGOOSE VALIDATION ERROR
        // --------------------------------------

        if (
            error.name ===
            "ValidationError"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Validation failed",
                errors:
                    getValidationErrors(
                        error
                    ),
            });
        }

        // --------------------------------------
        // DUPLICATE KEY ERROR
        // --------------------------------------

        if (
            error.code === 11000
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Email already registered",
            });
        }

        // --------------------------------------
        // INVALID OBJECT ID
        // --------------------------------------

        if (
            error.name ===
            "CastError"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Invalid ${
                        error.path || "ID"
                    } format`,
            });
        }

        // --------------------------------------
        // FALLBACK SERVER ERROR
        // --------------------------------------

        return res.status(500).json({
            success: false,
            message:
                "Internal Server Error",
        });
    }
};

// ==========================================
// LOGIN USER
// ==========================================

const loginUser = async (req, res) => {
    try {
        const {
            email,
            password,
        } = req.body || {};

        // --------------------------------------
        // REQUIRED FIELD VALIDATION
        // --------------------------------------

        if (
            !email ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required",
            });
        }

        const normalizedEmail =
            email
                .toString()
                .trim()
                .toLowerCase();

        // --------------------------------------
        // FIND USER
        // --------------------------------------

        const user =
            await User.findOne({
                email: normalizedEmail,
            }).select("+password");

        // --------------------------------------
        // USER NOT FOUND
        // --------------------------------------

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password",
            });
        }

        // --------------------------------------
        // ACCOUNT STATUS
        // --------------------------------------

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message:
                    "Your account is inactive",
            });
        }

        // --------------------------------------
        // PASSWORD CHECK
        // --------------------------------------

        const isPasswordMatch =
            await user.comparePassword(
                password
            );

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password",
            });
        }

        // --------------------------------------
        // UPDATE LAST LOGIN
        // --------------------------------------

        user.lastLogin =
            new Date();

        await user.save();

        // --------------------------------------
        // GENERATE TOKEN
        // --------------------------------------

        const token =
            generateToken(
                user._id.toString(),
                user.role
            );

        // --------------------------------------
        // SUCCESS
        // --------------------------------------

        return res.status(200).json({
            success: true,
            message:
                "Login successful",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                permissions:
                    user.permissions,
                company:
                    user.company,
                branch:
                    user.branch,
            },
        });

    } catch (error) {
        console.error(
            "Login Error:",
            error
        );

        // --------------------------------------
        // MONGOOSE VALIDATION ERROR
        // --------------------------------------

        if (
            error.name ===
            "ValidationError"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Validation failed",
                errors:
                    getValidationErrors(
                        error
                    ),
            });
        }

        // --------------------------------------
        // FALLBACK SERVER ERROR
        // --------------------------------------

        return res.status(500).json({
            success: false,
            message:
                "Internal Server Error",
        });
    }
};

// ==========================================
// FORGOT PASSWORD
// ==========================================

const forgotPassword = async (
    req,
    res
) => {
    try {
        const {
            email,
        } = req.body || {};

        // --------------------------------------
        // REQUIRED FIELD VALIDATION
        // --------------------------------------

        if (!email) {
            return res.status(400).json({
                success: false,
                message:
                    "Email is required.",
            });
        }

        const normalizedEmail =
            email
                .toString()
                .trim()
                .toLowerCase();

        // --------------------------------------
        // FIND USER
        // --------------------------------------

        const user =
            await User.findOne({
                email: normalizedEmail,
            });

        // --------------------------------------
        // DO NOT REVEAL EMAIL EXISTENCE
        // --------------------------------------

        if (!user) {
            return res.status(200).json({
                success: true,
                message:
                    "If an account exists with this email, a password reset link will be sent.",
            });
        }

        // --------------------------------------
        // GENERATE RESET TOKEN
        // --------------------------------------

        const resetToken =
            crypto
                .randomBytes(32)
                .toString("hex");

        // --------------------------------------
        // HASH TOKEN
        // --------------------------------------

        const hashedToken =
            crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");

        // --------------------------------------
        // TOKEN EXPIRY
        // 15 MINUTES
        // --------------------------------------

        const resetTokenExpiry =
            Date.now() +
            15 * 60 * 1000;

        user.resetPasswordToken =
            hashedToken;

        user.resetPasswordExpires =
            resetTokenExpiry;

        await user.save();

        // --------------------------------------
        // RESET URL
        // --------------------------------------

        const resetUrl =
            `http://localhost:5173/reset-password/${resetToken}`;

        // --------------------------------------
        // SUCCESS
        // --------------------------------------

        return res.status(200).json({
            success: true,
            message:
                "Password reset token generated successfully.",

            resetUrl,

            expiresIn:
                "15 minutes",
        });

    } catch (error) {
        console.error(
            "Forgot Password Error:",
            error
        );

        // --------------------------------------
        // MONGOOSE VALIDATION ERROR
        // --------------------------------------

        if (
            error.name ===
            "ValidationError"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Validation failed",
                errors:
                    getValidationErrors(
                        error
                    ),
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to process forgot password request.",
        });
    }
};

// ==========================================
// RESET PASSWORD
// ==========================================

const resetPassword = async (
    req,
    res
) => {
    try {
        const {
            token,
        } = req.params;

        const {
            password,
        } = req.body || {};

        // --------------------------------------
        // VALIDATE TOKEN
        // --------------------------------------

        if (!token) {
            return res.status(400).json({
                success: false,
                message:
                    "Reset token is required.",
            });
        }

        // --------------------------------------
        // VALIDATE PASSWORD
        // --------------------------------------

        if (!password) {
            return res.status(400).json({
                success: false,
                message:
                    "New password is required.",
            });
        }

        if (
            password.length < 6
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters.",
            });
        }

        if (
            password.length > 128
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Password cannot exceed 128 characters.",
            });
        }

        // --------------------------------------
        // HASH TOKEN
        // --------------------------------------

        const hashedToken =
            crypto
                .createHash("sha256")
                .update(token)
                .digest("hex");

        // --------------------------------------
        // FIND USER
        // TOKEN MUST NOT BE EXPIRED
        // --------------------------------------

        const user =
            await User.findOne({
                resetPasswordToken:
                    hashedToken,

                resetPasswordExpires: {
                    $gt: new Date(),
                },
            });

        // --------------------------------------
        // INVALID / EXPIRED TOKEN
        // --------------------------------------

        if (!user) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid or expired reset token.",
            });
        }

        // --------------------------------------
        // UPDATE PASSWORD
        // --------------------------------------

        user.password =
            password;

        // --------------------------------------
        // CLEAR RESET TOKEN
        // --------------------------------------

        user.resetPasswordToken =
            null;

        user.resetPasswordExpires =
            null;

        // --------------------------------------
        // SAVE
        // Password automatically hashed
        // by User pre-save middleware
        // --------------------------------------

        await user.save();

        // --------------------------------------
        // SUCCESS
        // --------------------------------------

        return res.status(200).json({
            success: true,
            message:
                "Password reset successfully.",
        });

    } catch (error) {
        console.error(
            "Reset Password Error:",
            error
        );

        // --------------------------------------
        // MONGOOSE VALIDATION ERROR
        // --------------------------------------

        if (
            error.name ===
            "ValidationError"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Validation failed",
                errors:
                    getValidationErrors(
                        error
                    ),
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to reset password.",
        });
    }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
};