const mongoose = require("mongoose");

const purchaseOrderItemSchema = new mongoose.Schema(
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

        purchaseOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PurchaseOrder",
            required: [true, "Purchase order is required"],
        },

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product is required"],
        },

        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [0.01, "Quantity must be greater than 0"],
        },

        receivedQuantity: {
            type: Number,
            default: 0,
            min: 0,
        },

        pendingQuantity: {
            type: Number,
            default: 0,
            min: 0,
        },

        unitPrice: {
            type: Number,
            required: [true, "Unit price is required"],
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

// =====================================================
// INDEXES
// =====================================================

purchaseOrderItemSchema.index({
    company: 1,
    purchaseOrder: 1,
});

purchaseOrderItemSchema.index({
    company: 1,
    product: 1,
});

purchaseOrderItemSchema.index({
    purchaseOrder: 1,
    product: 1,
});

const PurchaseOrderItem = mongoose.model(
    "PurchaseOrderItem",
    purchaseOrderItemSchema
);

module.exports = PurchaseOrderItem;