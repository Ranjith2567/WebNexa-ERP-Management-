const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
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

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },

        action: {
            type: String,
            enum: [
                "CREATE",
                "UPDATE",
                "DELETE",

                "LOGIN",
                "LOGOUT",

                "APPROVE",
                "REJECT",
                "CANCEL",

                "PAYMENT",
                "REFUND",

                "STOCK_IN",
                "STOCK_OUT",
                "TRANSFER",
                "ADJUSTMENT",

                "POST",
                "PROCESS",

                "EXPORT",
                "IMPORT",

                "PASSWORD_CHANGE",
                "PASSWORD_RESET",

                "OTHER",
            ],
            required: true,
            index: true,
        },

        module: {
            type: String,
            enum: [
                "AUTH",
                "USER",
                "COMPANY",
                "BRANCH",
                "EMPLOYEE",
                "DEPARTMENT",
                "DESIGNATION",

                "PRODUCT",
                "CATEGORY",
                "BRAND",
                "UNIT",

                "STOCK",
                "STOCK_TRANSFER",
                "STOCK_ADJUSTMENT",
                "WAREHOUSE",
                "REORDER_LEVEL",

                "SUPPLIER",
                "PURCHASE_ORDER",
                "GOODS_RECEIPT",
                "PURCHASE_INVOICE",
                "PURCHASE_PAYMENT",
                "PURCHASE_RETURN",

                "CUSTOMER",
                "QUOTATION",
                "SALES_ORDER",
                "SALES_INVOICE",
                "SALES_PAYMENT",
                "SALES_RETURN",
                "CREDIT_NOTE",

                "EXPENSE",
                "EXPENSE_CATEGORY",

                "ACCOUNT",
                "JOURNAL_ENTRY",
                "LEDGER_ENTRY",

                "DASHBOARD",
                "REPORT",
                "NOTIFICATION",

                "SETTINGS",
                "SYSTEM",

                "OTHER",
            ],
            required: true,
            index: true,
        },

        referenceType: {
            type: String,
            enum: [
                "USER",
                "COMPANY",
                "BRANCH",
                "EMPLOYEE",
                "DEPARTMENT",
                "DESIGNATION",

                "PRODUCT",
                "CATEGORY",
                "BRAND",
                "UNIT",

                "STOCK",
                "STOCK_TRANSFER",
                "STOCK_ADJUSTMENT",
                "WAREHOUSE",
                "REORDER_LEVEL",

                "SUPPLIER",
                "PURCHASE_ORDER",
                "GOODS_RECEIPT",
                "PURCHASE_INVOICE",
                "PURCHASE_PAYMENT",
                "PURCHASE_RETURN",

                "CUSTOMER",
                "QUOTATION",
                "SALES_ORDER",
                "SALES_INVOICE",
                "SALES_PAYMENT",
                "SALES_RETURN",
                "CREDIT_NOTE",

                "EXPENSE",
                "EXPENSE_CATEGORY",

                "ACCOUNT",
                "JOURNAL_ENTRY",
                "LEDGER_ENTRY",

                "NOTIFICATION",
                "OTHER",
            ],
            default: "OTHER",
            index: true,
        },

        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            index: true,
        },

        referenceNumber: {
            type: String,
            trim: true,
            default: "",
            maxlength: 100,
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },

        oldValues: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },

        newValues: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        ipAddress: {
            type: String,
            trim: true,
            default: "",
            maxlength: 100,
        },

        userAgent: {
            type: String,
            trim: true,
            default: "",
            maxlength: 1000,
        },

        status: {
            type: String,
            enum: ["SUCCESS", "FAILED"],
            default: "SUCCESS",
            index: true,
        },

        errorMessage: {
            type: String,
            trim: true,
            default: "",
            maxlength: 1000,
        },
    },
    {
        timestamps: true,
    }
);


// ===============================
// INDEXES
// ===============================

auditLogSchema.index({
    company: 1,
    createdAt: -1,
});

auditLogSchema.index({
    company: 1,
    branch: 1,
    createdAt: -1,
});

auditLogSchema.index({
    company: 1,
    user: 1,
    createdAt: -1,
});

auditLogSchema.index({
    company: 1,
    module: 1,
    createdAt: -1,
});

auditLogSchema.index({
    company: 1,
    action: 1,
    createdAt: -1,
});

auditLogSchema.index({
    company: 1,
    referenceType: 1,
    referenceId: 1,
});

auditLogSchema.index({
    company: 1,
    status: 1,
    createdAt: -1,
});


module.exports = mongoose.model("AuditLog", auditLogSchema);