const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: [true, "Company is required"],
        },

        name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
            maxlength: 100,
        },

        code: {
            type: String,
            required: [true, "Category code is required"],
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

        parentCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
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

// Unique category code within a company
categorySchema.index(
    { company: 1, code: 1 },
    { unique: true }
);

// Unique category name within a company
categorySchema.index(
    { company: 1, name: 1 },
    { unique: true }
);

// Useful filtering
categorySchema.index({
    company: 1,
    isActive: 1,
});

categorySchema.index({
    company: 1,
    parentCategory: 1,
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;