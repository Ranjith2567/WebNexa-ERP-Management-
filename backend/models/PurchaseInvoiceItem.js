const mongoose = require("mongoose");

const purchaseInvoiceItemSchema = new mongoose.Schema(
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

        purchaseInvoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PurchaseInvoice",
            required: [true, "Purchase invoice is required"],
        },

        purchaseOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PurchaseOrder",
            default: null,
        },

        goodsReceipt: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GoodsReceipt",
            default: null,
        },

        purchaseOrderItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PurchaseOrderItem",
            default: null,
        },

        goodsReceiptItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GoodsReceiptItem",
            default: null,
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

        cessPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        cessAmount: {
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

// Invoice → Items
purchaseInvoiceItemSchema.index({
    company: 1,
    purchaseInvoice: 1,
});

// Product-wise invoice lookup
purchaseInvoiceItemSchema.index({
    company: 1,
    product: 1,
});

// PO-wise invoice lookup
purchaseInvoiceItemSchema.index({
    company: 1,
    purchaseOrder: 1,
});

// GRN-wise invoice lookup
purchaseInvoiceItemSchema.index({
    company: 1,
    goodsReceipt: 1,
});

// Prevent duplicate product lines inside same invoice
purchaseInvoiceItemSchema.index(
    {
        purchaseInvoice: 1,
        product: 1,
    },
    {
        unique: true,
    }
);

const PurchaseInvoiceItem = mongoose.model(
    "PurchaseInvoiceItem",
    purchaseInvoiceItemSchema
);

module.exports = PurchaseInvoiceItem;