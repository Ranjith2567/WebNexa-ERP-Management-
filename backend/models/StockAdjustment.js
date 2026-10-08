const mongoose = require("mongoose");

const stockAdjustmentSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: [true, "Company is required"],
        },

        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: [true, "Branch is required"],
        },

        warehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            required: [true, "Warehouse is required"],
        },

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product is required"],
        },

        adjustmentNumber: {
            type: String,
            required: [true, "Adjustment number is required"],
            trim: true,
            uppercase: true,
        },

        adjustmentType: {
            type: String,
            enum: ["INCREASE", "DECREASE"],
            required: [true, "Adjustment type is required"],
        },

        quantity: {
            type: Number,
            required: [true, "Adjustment quantity is required"],
            min: 1,
        },

        previousQuantity: {
            type: Number,
            required: true,
            min: 0,
        },

        newQuantity: {
            type: Number,
            required: true,
            min: 0,
        },

        reason: {
            type: String,
            required: [true, "Adjustment reason is required"],
            trim: true,
            maxlength: 500,
        },

        notes: {
            type: String,
            trim: true,
            default: "",
            maxlength: 1000,
        },

        adjustmentDate: {
            type: Date,
            default: Date.now,
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

// ===============================
// Indexes
// ===============================

stockAdjustmentSchema.index(
    {
        company: 1,
        adjustmentNumber: 1,
    },
    {
        unique: true,
    }
);

stockAdjustmentSchema.index({
    company: 1,
    branch: 1,
});

stockAdjustmentSchema.index({
    company: 1,
    warehouse: 1,
});

stockAdjustmentSchema.index({
    company: 1,
    product: 1,
});

stockAdjustmentSchema.index({
    company: 1,
    adjustmentType: 1,
});

stockAdjustmentSchema.index({
    company: 1,
    adjustmentDate: -1,
});

const StockAdjustment = mongoose.model(
    "StockAdjustment",
    stockAdjustmentSchema
);

module.exports = StockAdjustment;