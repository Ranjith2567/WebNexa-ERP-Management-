const mongoose = require("mongoose");

const purchaseReturnSchema = new mongoose.Schema(
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

        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            required: [true, "Supplier is required"],
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

        purchaseInvoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PurchaseInvoice",
            default: null,
        },

        returnNumber: {
            type: String,
            required: [true, "Return number is required"],
            trim: true,
            uppercase: true,
            maxlength: 30,
        },

        returnDate: {
            type: Date,
            required: [true, "Return date is required"],
            default: Date.now,
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
            required: [true, "Return reason is required"],
        },

        refundAmount: {
            type: Number,
            min: 0,
            default: 0,
        },

        creditNoteNumber: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: 100,
            default: "",
        },

        totalQuantity: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        discountAmount: {
            type: Number,
            min: 0,
            default: 0,
        },

        taxAmount: {
            type: Number,
            min: 0,
            default: 0,
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        status: {
            type: String,
            enum: [
                "DRAFT",
                "PENDING_APPROVAL",
                "APPROVED",
                "PROCESSED",
                "REFUNDED",
                "CANCELLED",
                "REJECTED",
            ],
            default: "DRAFT",
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

        approval: {
            approvedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                default: null,
            },

            approvedAt: {
                type: Date,
                default: null,
            },
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

// Unique return number per company
purchaseReturnSchema.index(
    {
        company: 1,
        returnNumber: 1,
    },
    {
        unique: true,
    }
);

// Supplier returns
purchaseReturnSchema.index({
    company: 1,
    supplier: 1,
});

// PO returns
purchaseReturnSchema.index({
    company: 1,
    purchaseOrder: 1,
});

// GRN returns
purchaseReturnSchema.index({
    company: 1,
    goodsReceipt: 1,
});

// Invoice returns
purchaseReturnSchema.index({
    company: 1,
    purchaseInvoice: 1,
});

// Status filtering
purchaseReturnSchema.index({
    company: 1,
    status: 1,
});

// Return date reports
purchaseReturnSchema.index({
    company: 1,
    returnDate: -1,
});

const PurchaseReturn = mongoose.model(
    "PurchaseReturn",
    purchaseReturnSchema
);

module.exports = PurchaseReturn;