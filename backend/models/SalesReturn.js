const mongoose = require("mongoose");

const salesReturnItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },

        quantity: {
            type: Number,
            required: true,
            min: 0.000001,
        },

        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        discountPercent: {
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

        taxPercent: {
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
    },
    { _id: false }
);

const salesReturnSchema = new mongoose.Schema(
    {
        // ===============================
        // Company / Branch
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
        // Return Number
        // ===============================
        returnNumber: {
            type: String,
            required: true,
            trim: true,
        },

        // ===============================
        // Return Date
        // ===============================
        returnDate: {
            type: Date,
            default: Date.now,
            required: true,
        },

        // ===============================
        // Original Sales Invoice
        // ===============================
        salesInvoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SalesInvoice",
            required: true,
            index: true,
        },

        // ===============================
        // Sales Order
        // ===============================
        salesOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SalesOrder",
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
        // Warehouse
        // ===============================
        warehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            required: true,
            index: true,
        },

        // ===============================
        // Return Items
        // ===============================
        items: {
            type: [salesReturnItemSchema],
            required: true,
            validate: {
                validator: function (items) {
                    return items && items.length > 0;
                },
                message: "At least one return item is required",
            },
        },

        // ===============================
        // Totals
        // ===============================
        subtotal: {
            type: Number,
            default: 0,
            min: 0,
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

        taxAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        grandTotal: {
            type: Number,
            default: 0,
            min: 0,
        },

        // ===============================
        // Refund / Credit
        // ===============================
        refundAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        creditAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        settlementType: {
            type: String,
            enum: [
                "REFUND",
                "CREDIT_NOTE",
                "ADJUST_INVOICE",
                "NONE",
            ],
            default: "NONE",
        },

        // ===============================
        // Return Reason
        // ===============================
        reason: {
            type: String,
            required: true,
            trim: true,
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },

        // ===============================
        // Status
        // ===============================
        status: {
            type: String,
            enum: [
                "DRAFT",
                "REQUESTED",
                "APPROVED",
                "PROCESSED",
                "REJECTED",
                "CANCELLED",
            ],
            default: "DRAFT",
            index: true,
        },

        // ===============================
        // Audit
        // ===============================
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        approvedAt: {
            type: Date,
        },

        processedAt: {
            type: Date,
        },

        cancelledAt: {
            type: Date,
        },

        cancellationReason: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// ===============================
// Indexes
// ===============================

salesReturnSchema.index(
    {
        company: 1,
        returnNumber: 1,
    },
    {
        unique: true,
    }
);

salesReturnSchema.index({
    company: 1,
    salesInvoice: 1,
});

salesReturnSchema.index({
    company: 1,
    salesOrder: 1,
});

salesReturnSchema.index({
    company: 1,
    customer: 1,
    returnDate: -1,
});

salesReturnSchema.index({
    company: 1,
    status: 1,
});

salesReturnSchema.index({
    company: 1,
    warehouse: 1,
    returnDate: -1,
});

module.exports = mongoose.model(
    "SalesReturn",
    salesReturnSchema
);