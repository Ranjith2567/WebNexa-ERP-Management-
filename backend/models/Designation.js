const mongoose = require("mongoose");

const designationSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: [true, "Company is required"],
        },

        name: {
            type: String,
            required: [true, "Designation name is required"],
            trim: true,
            maxlength: 100,
        },

        code: {
            type: String,
            required: [true, "Designation code is required"],
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

        level: {
            type: Number,
            default: 1,
            min: 1,
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

// Same designation code cannot repeat inside same company
designationSchema.index(
    { company: 1, code: 1 },
    { unique: true }
);

// Same designation name cannot repeat inside same company
designationSchema.index(
    { company: 1, name: 1 },
    { unique: true }
);

const Designation = mongoose.model(
    "Designation",
    designationSchema
);

module.exports = Designation;