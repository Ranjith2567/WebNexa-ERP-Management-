const mongoose = require("mongoose");

const goodsReceiptSchema = new mongoose.Schema(
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

        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            required: [true, "Supplier is required"],
        },

        warehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            required: [true, "Warehouse is required"],
        },

        grnNumber: {
            type: String,
            required: [true, "GRN number is required"],
            trim: true,
            uppercase: true,
            maxlength: 30,
        },

        receiptDate: {
            type: Date,
            required: [true, "Receipt date is required"],
            default: Date.now,
        },

        invoiceNumber: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: 100,
            default: "",
        },

        invoiceDate: {
            type: Date,
            default: null,
        },

        vehicleNumber: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: 30,
            default: "",
        },

        receivedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Received by is required"],
        },

        status: {
            type: String,
            enum: [
                "DRAFT",
                "RECEIVED",
                "PARTIALLY_RECEIVED",
                "REJECTED",
                "CANCELLED",
            ],
            default: "RECEIVED",
        },

        totalQuantity: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: "",
        },

        rejectionReason: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// ===============================
// Indexes
// ===============================

goodsReceiptSchema.index(
    {
        company: 1,
        grnNumber: 1,
    },
    {
        unique: true,
    }
);

goodsReceiptSchema.index({
    company: 1,
    purchaseOrder: 1,
});

goodsReceiptSchema.index({
    company: 1,
    supplier: 1,
});

goodsReceiptSchema.index({
    company: 1,
    branch: 1,
});

goodsReceiptSchema.index({
    company: 1,
    warehouse: 1,
});

goodsReceiptSchema.index({
    company: 1,
    status: 1,
});

goodsReceiptSchema.index({
    company: 1,
    receiptDate: -1,
});

const GoodsReceipt = mongoose.model(
    "GoodsReceipt",
    goodsReceiptSchema
);

module.exports = GoodsReceipt;