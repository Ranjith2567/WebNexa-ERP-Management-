const mongoose = require("mongoose");

const purchaseReturnItemSchema = new mongoose.Schema(
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

        purchaseReturn: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PurchaseReturn",
            required: [true, "Purchase return is required"],
        },

        purchaseOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PurchaseOrder",
            default: null,
        },

        purchaseOrderItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PurchaseOrderItem",
            default: null,
        },

        goodsReceipt: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GoodsReceipt",
            default: null,
        },

        goodsReceiptItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GoodsReceiptItem",
            default: null,
        },

        purchaseInvoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PurchaseInvoice",
            default: null,
        },

        purchaseInvoiceItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PurchaseInvoiceItem",
            default: null,
        },

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product is required"],
        },

        quantity: {
            type: Number,
            required: [true, "Return quantity is required"],
            min: [
                0.01,
                "Return quantity must be greater than 0",
            ],
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

        taxableAmount: {
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

        lineTotal: {
            type: Number,
            required: true,
            min: 0,
        },

        reason: {
            type: String,
            enum: [
                "DAMAGED",
                "DEFECTIVE",
                "WRONG_PRODUCT",
                "EXCESS_QUANTITY",
                "QUALITY_ISSUE",
                "EXPIRED",
                "OTHER",
            ],
            required: [
                true,
                "Return reason is required",
            ],
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

// Return lookup
purchaseReturnItemSchema.index({
    company: 1,
    purchaseReturn: 1,
});

// Product lookup
purchaseReturnItemSchema.index({
    company: 1,
    product: 1,
});

// Purchase order lookup
purchaseReturnItemSchema.index({
    company: 1,
    purchaseOrder: 1,
});

// Goods receipt lookup
purchaseReturnItemSchema.index({
    company: 1,
    goodsReceipt: 1,
});

// Purchase invoice lookup
purchaseReturnItemSchema.index({
    company: 1,
    purchaseInvoice: 1,
});

// Prevent duplicate product
// within the same return
purchaseReturnItemSchema.index(
    {
        purchaseReturn: 1,
        product: 1,
    },
    {
        unique: true,
    }
);

const PurchaseReturnItem =
    mongoose.model(
        "PurchaseReturnItem",
        purchaseReturnItemSchema
    );

module.exports = PurchaseReturnItem;