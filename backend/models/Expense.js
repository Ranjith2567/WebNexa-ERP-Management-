const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
    {
        // ===============================
        // Company
        // ===============================
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
            index: true,
        },

        // ===============================
        // Branch
        // ===============================
        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: true,
            index: true,
        },

        // ===============================
        // Expense Number
        // ===============================
        expenseNumber: {
            type: String,
            required: true,
            trim: true,
        },

        // ===============================
        // Expense Category
        // ===============================
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ExpenseCategory",
            required: true,
            index: true,
        },

        // ===============================
        // Expense Date
        // ===============================
        expenseDate: {
            type: Date,
            required: true,
            index: true,
        },

        // ===============================
        // Amount
        // ===============================
        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        // ===============================
        // Payment Method
        // ===============================
        paymentMethod: {
            type: String,
            enum: [
                "CASH",
                "BANK_TRANSFER",
                "UPI",
                "CARD",
                "CHEQUE",
                "OTHER",
            ],
            required: true,
        },

        // ===============================
        // Paid From
        // ===============================
        paidFrom: {
            type: String,
            trim: true,
            default: "",
        },

        // ===============================
        // Supplier
        // ===============================
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            default: null,
            index: true,
        },

        // ===============================
        // Description
        // ===============================
        description: {
            type: String,
            trim: true,
            default: "",
        },

        // ===============================
        // Reference Number
        // ===============================
        referenceNumber: {
            type: String,
            trim: true,
            default: "",
        },

        // ===============================
        // Expense Workflow Status
        // ===============================
        status: {
            type: String,
            enum: [
                "DRAFT",
                "PENDING",
                "APPROVED",
                "REJECTED",
                "PAID",
                "CANCELLED",
            ],
            default: "DRAFT",
            index: true,
        },

        // ===============================
        // Approval Details
        // ===============================
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        approvedAt: {
            type: Date,
            default: null,
        },

        // ===============================
        // Rejection Details
        // ===============================
        rejectionReason: {
            type: String,
            trim: true,
            default: "",
        },

        // ===============================
        // Payment Details
        // ===============================
        paidBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        paidAt: {
            type: Date,
            default: null,
        },

        // ===============================
        // Notes
        // ===============================
        notes: {
            type: String,
            trim: true,
            default: "",
        },

        // ===============================
        // Audit Fields
        // ===============================
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        updatedBy: {
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

expenseSchema.index(
    {
        company: 1,
        branch: 1,
        expenseNumber: 1,
    },
    {
        unique: true,
    }
);

expenseSchema.index({
    company: 1,
    branch: 1,
    expenseDate: -1,
});

expenseSchema.index({
    company: 1,
    branch: 1,
    status: 1,
});

expenseSchema.index({
    company: 1,
    branch: 1,
    category: 1,
});

expenseSchema.index({
    company: 1,
    branch: 1,
    approvedBy: 1,
});

expenseSchema.index({
    company: 1,
    branch: 1,
    paidBy: 1,
});

// ===============================
// Export Model
// ===============================

module.exports = mongoose.model(
    "Expense",
    expenseSchema
);