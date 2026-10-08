const mongoose = require("mongoose");

const ledgerEntrySchema = new mongoose.Schema(
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
            required: true,
            index: true,
        },

        account: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            required: true,
            index: true,
        },

        journalEntry: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "JournalEntry",
            required: true,
            index: true,
        },

        lineNumber: {
            type: Number,
            required: true,
            min: 1,
        },

        journalNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },

        transactionDate: {
            type: Date,
            required: true,
            index: true,
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },

        debit: {
            type: Number,
            min: 0,
            default: 0,
        },

        credit: {
            type: Number,
            min: 0,
            default: 0,
        },

        referenceType: {
            type: String,
            enum: [
                "MANUAL",
                "SALES",
                "PURCHASE",
                "EXPENSE",
                "PAYMENT",
                "RECEIPT",
                "ADJUSTMENT",
                "OTHER",
            ],
            default: "MANUAL",
        },

        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate ledger entry for the same
// company + journal + exact journal line
ledgerEntrySchema.index(
    {
        company: 1,
        journalEntry: 1,
        lineNumber: 1,
    },
    {
        unique: true,
    }
);

// Account-wise ledger history
ledgerEntrySchema.index({
    company: 1,
    account: 1,
    transactionDate: -1,
});

// Branch-wise ledger history
ledgerEntrySchema.index({
    company: 1,
    branch: 1,
    transactionDate: -1,
});

// Journal-wise ledger lookup
ledgerEntrySchema.index({
    company: 1,
    journalEntry: 1,
});

// Journal number lookup
ledgerEntrySchema.index({
    company: 1,
    journalNumber: 1,
});

module.exports = mongoose.model(
    "LedgerEntry",
    ledgerEntrySchema
);