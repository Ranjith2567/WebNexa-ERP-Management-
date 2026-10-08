const mongoose = require("mongoose");

const stockMovementSchema = new mongoose.Schema(
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

        movementType: {
            type: String,
            enum: [
                "PURCHASE",
                "PURCHASE_RETURN",
                "SALE",
                "SALES_RETURN",
                "STOCK_ADJUSTMENT_IN",
                "STOCK_ADJUSTMENT_OUT",
                "STOCK_TRANSFER_IN",
                "STOCK_TRANSFER_OUT",
                "OPENING_STOCK",
                "DAMAGE",
                "EXPIRY",
                "OTHER",
            ],
            required: [true, "Movement type is required"],
        },

        referenceType: {
            type: String,
            enum: [
                "GOODS_RECEIPT",
                "PURCHASE_RETURN",
                "SALES_INVOICE",
                "SALES_RETURN",
                "STOCK_ADJUSTMENT",
                "STOCK_TRANSFER",
                "PRODUCT",
                "OTHER",
            ],
            default: "OTHER",
        },

        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },

        referenceNumber: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: 50,
            default: "",
        },

        quantityBefore: {
            type: Number,
            required: true,
            min: 0,
        },

        quantityChange: {
            type: Number,
            required: true,
        },

        quantityAfter: {
            type: Number,
            required: true,
            min: 0,
        },

        unitPrice: {
            type: Number,
            min: 0,
            default: 0,
        },

        totalValue: {
            type: Number,
            min: 0,
            default: 0,
        },

        reason: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: "",
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

stockMovementSchema.index({
    company: 1,
    warehouse: 1,
    product: 1,
    createdAt: -1,
});

stockMovementSchema.index({
    company: 1,
    product: 1,
    createdAt: -1,
});

stockMovementSchema.index({
    company: 1,
    movementType: 1,
});

stockMovementSchema.index({
    company: 1,
    referenceType: 1,
    referenceId: 1,
});

const StockMovement = mongoose.model(
    "StockMovement",
    stockMovementSchema
);

module.exports = StockMovement;