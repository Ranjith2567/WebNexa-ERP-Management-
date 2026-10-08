const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: [true, "Company is required"],
        },

        name: {
            type: String,
            required: [true, "Branch name is required"],
            trim: true,
            maxlength: 150,
        },

        branchCode: {
            type: String,
            required: [true, "Branch code is required"],
            trim: true,
            uppercase: true,
            maxlength: 30,
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: "",
        },

        phone: {
            type: String,
            trim: true,
            default: "",
        },

        address: {
            street: {
                type: String,
                trim: true,
                default: "",
            },

            city: {
                type: String,
                trim: true,
                default: "",
            },

            state: {
                type: String,
                trim: true,
                default: "",
            },

            country: {
                type: String,
                trim: true,
                default: "India",
            },

            pincode: {
                type: String,
                trim: true,
                default: "",
            },
        },

        manager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        isMainBranch: {
            type: Boolean,
            default: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

branchSchema.index(
    { company: 1, branchCode: 1 },
    { unique: true }
);

const Branch = mongoose.model("Branch", branchSchema);

module.exports = Branch;