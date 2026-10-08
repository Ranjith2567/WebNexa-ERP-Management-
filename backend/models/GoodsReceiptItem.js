const mongoose = require("mongoose");

const goodsReceiptItemSchema = new mongoose.Schema(
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

        goodsReceipt: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GoodsReceipt",
            required: [true, "Goods receipt is required"],
        },

        purchaseOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PurchaseOrder",
            required: [true, "Purchase order is required"],
        },

        purchaseOrderItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PurchaseOrderItem",
            required: [true, "Purchase order item is required"],
        },

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product is required"],
        },

        orderedQuantity: {
            type: Number,
            required: true,
            min: 0,
        },

        previouslyReceivedQuantity: {
            type: Number,
            default: 0,
            min: 0,
        },

        receivedQuantity: {
            type: Number,
            required: [true, "Received quantity is required"],
            min: [0, "Received quantity cannot be negative"],
        },

        rejectedQuantity: {
            type: Number,
            default: 0,
            min: 0,
        },

        acceptedQuantity: {
            type: Number,
            required: true,
            min: 0,
        },

        pendingQuantity: {
            type: Number,
            required: true,
            min: 0,
        },

        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        discountPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        discountAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        taxPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        taxAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        taxableAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        lineTotal: {
            type: Number,
            required: true,
            min: 0,
        },

        batchNumber: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: 100,
            default: "",
        },

        serialNumbers: {
            type: [String],
            default: [],
        },

        expiryDate: {
            type: Date,
            default: null,
        },

        manufacturingDate: {
            type: Date,
            default: null,
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// ===============================
// Indexes
// ===============================

goodsReceiptItemSchema.index({
    company: 1,
    goodsReceipt: 1,
});

goodsReceiptItemSchema.index({
    company: 1,
    purchaseOrder: 1,
});

goodsReceiptItemSchema.index({
    company: 1,
    purchaseOrderItem: 1,
});

goodsReceiptItemSchema.index({
    company: 1,
    product: 1,
});

const GoodsReceiptItem = mongoose.model(
    "GoodsReceiptItem",
    goodsReceiptItemSchema
);

module.exports = GoodsReceiptItem;