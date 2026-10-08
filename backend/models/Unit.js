const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: [true, "Company is required"],
        },

        name: {
            type: String,
            required: [true, "Unit name is required"],
            trim: true,
            maxlength: 100,
        },

        code: {
            type: String,
            required: [true, "Unit code is required"],
            trim: true,
            uppercase: true,
            maxlength: 30,
        },

        symbol: {
            type: String,
            trim: true,
            default: "",
            maxlength: 20,
        },

        description: {
            type: String,
            trim: true,
            default: "",
            maxlength: 500,
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

// Unique code within company
unitSchema.index(
    {
        company: 1,
        code: 1,
    },
    {
        unique: true,
    }
);

// Unique name within company
unitSchema.index(
    {
        company: 1,
        name: 1,
    },
    {
        unique: true,
    }
);

// Active units
unitSchema.index({
    company: 1,
    isActive: 1,
});

const Unit = mongoose.model("Unit", unitSchema);

module.exports = Unit;