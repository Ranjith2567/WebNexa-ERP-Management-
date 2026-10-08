const mongoose = require("mongoose");

const journalEntryLineSchema = new mongoose.Schema(
    {
        account: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            required: true,
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
    },
    { _id: false }
);

const journalEntrySchema = new mongoose.Schema(
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

        journalNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },

        journalDate: {
            type: Date,
            required: true,
            default: Date.now,
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

        description: {
            type: String,
            trim: true,
            default: "",
        },

        entries: {
            type: [journalEntryLineSchema],
            required: true,
            validate: {
                validator: function (entries) {
                    return Array.isArray(entries) && entries.length >= 2;
                },
                message: "At least two journal entry lines are required.",
            },
        },

        totalDebit: {
            type: Number,
            min: 0,
            default: 0,
        },

        totalCredit: {
            type: Number,
            min: 0,
            default: 0,
        },

        status: {
            type: String,
            enum: ["DRAFT", "POSTED", "CANCELLED"],
            default: "DRAFT",
        },

        postedAt: {
            type: Date,
            default: null,
        },

        cancelledAt: {
            type: Date,
            default: null,
        },

        cancellationReason: {
            type: String,
            trim: true,
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

journalEntrySchema.index(
    { company: 1, journalNumber: 1 },
    { unique: true }
);

journalEntrySchema.index({
    company: 1,
    branch: 1,
    journalDate: -1,
});

journalEntrySchema.index({
    company: 1,
    status: 1,
});

module.exports = mongoose.model("JournalEntry", journalEntrySchema);