const mongoose = require("mongoose");

const reorderLevelSchema = new mongoose.Schema(
    {
        // ===============================
        // Company
        // ===============================
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: [true, "Company is required"],
        },

        // ===============================
        // Branch
        // ===============================
        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: [true, "Branch is required"],
        },

        // ===============================
        // Warehouse
        // ===============================
        warehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            required: [true, "Warehouse is required"],
        },

        // ===============================
        // Product
        // ===============================
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product is required"],
        },

        // ===============================
        // Reorder Level
        // When stock reaches this level,
        // reorder should be considered
        // ===============================
        reorderLevel: {
            type: Number,
            required: [true, "Reorder level is required"],
            min: 0,
        },

        // ===============================
        // Reorder Quantity
        // Suggested quantity to purchase
        // ===============================
        reorderQuantity: {
            type: Number,
            required: [true, "Reorder quantity is required"],
            min: 1,
        },

        // ===============================
        // Maximum Stock Level
        // Stock should ideally not exceed
        // this level after replenishment
        // ===============================
        maximumStock: {
            type: Number,
            default: 0,
            min: 0,
        },

        // ===============================
        // Auto Reorder
        // Future Purchase Order automation
        // ===============================
        autoReorder: {
            type: Boolean,
            default: false,
        },

        // ===============================
        // Active Status
        // ===============================
        isActive: {
            type: Boolean,
            default: true,
        },

        // ===============================
        // Created By
        // ===============================
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

// ===============================
// Unique Reorder Configuration
// One product can have one reorder
// configuration per warehouse
// ===============================
reorderLevelSchema.index(
    {
        company: 1,
        warehouse: 1,
        product: 1,
    },
    {
        unique: true,
    }
);

// ===============================
// Search / Filter Indexes
// ===============================
reorderLevelSchema.index({
    company: 1,
    branch: 1,
});

reorderLevelSchema.index({
    company: 1,
    warehouse: 1,
});

reorderLevelSchema.index({
    company: 1,
    product: 1,
});

reorderLevelSchema.index({
    company: 1,
    isActive: 1,
});

reorderLevelSchema.index({
    company: 1,
    autoReorder: 1,
});

const ReorderLevel = mongoose.model(
    "ReorderLevel",
    reorderLevelSchema
);

module.exports = ReorderLevel;