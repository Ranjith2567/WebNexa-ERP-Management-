const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        // =====================================================
        // COMPANY / BRANCH
        // =====================================================

        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
            index: true,
        },

        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            default: null,
            index: true,
        },

        // =====================================================
        // RECIPIENT
        // =====================================================

        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // =====================================================
        // NOTIFICATION TYPE
        // =====================================================

        type: {
            type: String,
            enum: [
                "LOW_STOCK",
                "OUT_OF_STOCK",
                "OVER_STOCK",

                "SALES_ORDER",
                "SALES_INVOICE",
                "SALES_PAYMENT",
                "SALES_RETURN",

                "PURCHASE_ORDER",
                "GOODS_RECEIPT",
                "PURCHASE_INVOICE",
                "PURCHASE_PAYMENT",
                "PURCHASE_RETURN",

                "EXPENSE_CREATED",
                "EXPENSE_APPROVED",
                "EXPENSE_REJECTED",
                "EXPENSE_PAID",

                "CUSTOMER_PAYMENT_DUE",
                "SUPPLIER_PAYMENT_DUE",

                "STOCK_TRANSFER",
                "STOCK_ADJUSTMENT",

                "JOURNAL_POSTED",

                "USER_CREATED",
                "SYSTEM",
            ],
            required: true,
            index: true,
        },

        // =====================================================
        // NOTIFICATION CONTENT
        // =====================================================

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },

        // =====================================================
        // PRIORITY
        // =====================================================

        priority: {
            type: String,
            enum: [
                "LOW",
                "MEDIUM",
                "HIGH",
                "CRITICAL",
            ],
            default: "MEDIUM",
            index: true,
        },

        // =====================================================
        // REFERENCE
        // =====================================================

        referenceType: {
            type: String,
            enum: [
                "PRODUCT",
                "STOCK",
                "SALES_ORDER",
                "SALES_INVOICE",
                "SALES_PAYMENT",
                "SALES_RETURN",

                "PURCHASE_ORDER",
                "GOODS_RECEIPT",
                "PURCHASE_INVOICE",
                "PURCHASE_PAYMENT",
                "PURCHASE_RETURN",

                "EXPENSE",
                "CUSTOMER",
                "SUPPLIER",

                "STOCK_TRANSFER",
                "STOCK_ADJUSTMENT",

                "JOURNAL_ENTRY",
                "USER",
                "OTHER",
            ],
            default: "OTHER",
        },

        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },

        // =====================================================
        // READ / UNREAD
        // =====================================================

        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },

        readAt: {
            type: Date,
            default: null,
        },

        // =====================================================
        // EXTRA DATA
        // =====================================================

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        // =====================================================
        // CREATED BY
        // =====================================================

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// =====================================================
// INDEXES
// =====================================================

notificationSchema.index({
    company: 1,
    recipient: 1,
    createdAt: -1,
});

notificationSchema.index({
    company: 1,
    recipient: 1,
    isRead: 1,
});

notificationSchema.index({
    company: 1,
    recipient: 1,
    type: 1,
});

notificationSchema.index({
    company: 1,
    priority: 1,
});

notificationSchema.index({
    company: 1,
    referenceType: 1,
    referenceId: 1,
});

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);