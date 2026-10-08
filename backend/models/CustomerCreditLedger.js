const mongoose = require("mongoose");

const customerCreditLedgerSchema = new mongoose.Schema(
    {
        // ===============================
        // Company & Branch
        // ===============================
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
            index: true,
        },

        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: true,
            index: true,
        },

        // ===============================
        // Customer
        // ===============================
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
            index: true,
        },

        // ===============================
        // Transaction Type
        // ===============================
        transactionType: {
            type: String,
            enum: [
                "CREDIT_NOTE",
                "CREDIT_APPLIED",
                "CREDIT_REVERSAL",
                "MANUAL_CREDIT",
                "MANUAL_DEBIT",
            ],
            required: true,
        },

        // ===============================
        // Credit Note Reference
        // ===============================
        creditNote: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CreditNote",
            default: null,
        },

        // ===============================
        // Sales Invoice Reference
        // ===============================
        salesInvoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SalesInvoice",
            default: null,
        },

        // ===============================
        // Amount
        // ===============================
        amount: {
            type: Number,
            required: true,
            min: 0.01,
        },

        // ===============================
        // Running Balance
        // ===============================
        balanceBefore: {
            type: Number,
            required: true,
            min: 0,
        },

        balanceAfter: {
            type: Number,
            required: true,
            min: 0,
        },

        // ===============================
        // Transaction Date
        // ===============================
        transactionDate: {
            type: Date,
            required: true,
            default: Date.now,
            index: true,
        },

        // ===============================
        // Reference
        // ===============================
        referenceNumber: {
            type: String,
            trim: true,
            default: "",
        },

        // ===============================
        // Description
        // ===============================
        description: {
            type: String,
            trim: true,
            default: "",
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },

        // ===============================
        // Created By
        // ===============================
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

customerCreditLedgerSchema.index({
    company: 1,
    customer: 1,
    transactionDate: -1,
});

customerCreditLedgerSchema.index({
    company: 1,
    creditNote: 1,
});

customerCreditLedgerSchema.index({
    company: 1,
    salesInvoice: 1,
});

customerCreditLedgerSchema.index({
    company: 1,
    transactionType: 1,
});

module.exports = mongoose.model(
    "CustomerCreditLedger",
    customerCreditLedgerSchema
);