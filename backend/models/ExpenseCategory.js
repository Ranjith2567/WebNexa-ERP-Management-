const mongoose = require("mongoose");

const expenseCategorySchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
            index: true,
        },

        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: true,
            index: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        code: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },

        parentCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ExpenseCategory",
            default: null,
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

/*
 * Same category name should not repeat
 * inside the same company + branch.
 */
expenseCategorySchema.index(
    {
        company: 1,
        branch: 1,
        name: 1,
    },
    {
        unique: true,
    }
);

/*
 * Category code should also be unique
 * inside the same company + branch.
 */
expenseCategorySchema.index(
    {
        company: 1,
        branch: 1,
        code: 1,
    },
    {
        unique: true,
    }
);

expenseCategorySchema.index({
    company: 1,
    branch: 1,
    isActive: 1,
});

module.exports = mongoose.model(
    "ExpenseCategory",
    expenseCategorySchema
);