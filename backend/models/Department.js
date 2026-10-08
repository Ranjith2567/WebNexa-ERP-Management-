const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: [true, "Company is required"],
        },

        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            default: null,
        },

        name: {
            type: String,
            required: [true, "Department name is required"],
            trim: true,
            maxlength: 100,
        },

        code: {
            type: String,
            required: [true, "Department code is required"],
            trim: true,
            uppercase: true,
            maxlength: 30,
        },

        description: {
            type: String,
            trim: true,
            default: "",
            maxlength: 500,
        },

        head: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
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

// Same department code cannot repeat inside same company
departmentSchema.index(
    { company: 1, code: 1 },
    { unique: true }
);

// Department name should also be unique inside company
departmentSchema.index(
    { company: 1, name: 1 },
    { unique: true }
);

const Department = mongoose.model(
    "Department",
    departmentSchema
);

module.exports = Department;