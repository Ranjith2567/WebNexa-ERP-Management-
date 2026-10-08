const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        // =====================================
        // BASIC DETAILS
        // =====================================

        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters"],
            maxlength: [100, "Name cannot exceed 100 characters"],
            validate: {
                validator: function (value) {
                    return value.trim().length >= 2;
                },
                message: "Name cannot be empty",
            },
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: [
                150,
                "Email cannot exceed 150 characters",
            ],
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Please provide a valid email address",
            ],
        },

        phone: {
            type: String,
            trim: true,
            default: "",
            validate: {
                validator: function (value) {
                    if (!value) {
                        return true;
                    }

                    return /^\+?[0-9\s-]{7,15}$/.test(
                        value
                    );
                },
                message: "Please provide a valid phone number",
            },
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [
                6,
                "Password must be at least 6 characters",
            ],
            maxlength: [
                128,
                "Password cannot exceed 128 characters",
            ],
            select: false,
        },

        // =====================================
        // PASSWORD RESET
        // =====================================

        resetPasswordToken: {
            type: String,
            default: null,
            select: false,
        },

        resetPasswordExpires: {
            type: Date,
            default: null,
            select: false,
        },

        // =====================================
        // EMPLOYEE DETAILS
        // =====================================

        employeeId: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            uppercase: true,
            default: null,
            validate: {
                validator: function (value) {
                    if (!value) {
                        return true;
                    }

                    return /^EMP-\d{4,}$/.test(value);
                },
                message:
                    "Employee ID must follow format EMP-0001",
            },
        },

        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            default: null,
        },

        designation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Designation",
            default: null,
        },

        joiningDate: {
            type: Date,
            default: null,
            validate: {
                validator: function (value) {
                    if (!value) {
                        return true;
                    }

                    return value <= new Date();
                },
                message:
                    "Joining date cannot be in the future",
            },
        },

        dateOfBirth: {
            type: Date,
            default: null,
            validate: {
                validator: function (value) {
                    if (!value) {
                        return true;
                    }

                    return value <= new Date();
                },
                message:
                    "Date of birth cannot be in the future",
            },
        },

        gender: {
            type: String,
            enum: {
                values: [
                    "MALE",
                    "FEMALE",
                    "OTHER",
                    "",
                ],
                message:
                    "Gender must be MALE, FEMALE, OTHER, or empty",
            },
            default: "",
        },

        address: {
            street: {
                type: String,
                trim: true,
                maxlength: [
                    200,
                    "Street cannot exceed 200 characters",
                ],
                default: "",
            },

            city: {
                type: String,
                trim: true,
                maxlength: [
                    100,
                    "City cannot exceed 100 characters",
                ],
                default: "",
            },

            state: {
                type: String,
                trim: true,
                maxlength: [
                    100,
                    "State cannot exceed 100 characters",
                ],
                default: "",
            },

            country: {
                type: String,
                trim: true,
                maxlength: [
                    100,
                    "Country cannot exceed 100 characters",
                ],
                default: "India",
            },

            pincode: {
                type: String,
                trim: true,
                default: "",
                validate: {
                    validator: function (value) {
                        if (!value) {
                            return true;
                        }

                        return /^\d{6}$/.test(value);
                    },
                    message:
                        "Pincode must be a valid 6-digit number",
                },
            },
        },

        // =====================================
        // ERP ORGANIZATION
        // =====================================

        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            default: null,
        },

        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            default: null,
        },

        // =====================================
        // ROLE & PERMISSIONS
        // =====================================

        role: {
            type: String,
            enum: {
                values: [
                    "SUPER_ADMIN",
                    "ADMIN",
                    "MANAGER",
                    "HR",
                    "SALES",
                    "PURCHASE",
                    "INVENTORY",
                    "ACCOUNTANT",
                    "EMPLOYEE",
                ],
                message: "Invalid user role",
            },
            default: "EMPLOYEE",
        },

        permissions: {
            type: [
                {
                    type: String,
                    trim: true,
                },
            ],
            default: [],
        },

        // =====================================
        // PROFILE
        // =====================================

        profileImage: {
            type: String,
            trim: true,
            default: "",
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        lastLogin: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// =====================================
// PASSWORD HASH
// =====================================

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    const salt = await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(
        this.password,
        salt
    );
});

// =====================================
// PASSWORD COMPARE
// =====================================

userSchema.methods.comparePassword = async function (
    enteredPassword
) {
    return await bcrypt.compare(
        enteredPassword,
        this.password
    );
};

// =====================================
// USER MODEL
// =====================================

const User = mongoose.model(
    "User",
    userSchema
);

module.exports = User;