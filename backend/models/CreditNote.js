const mongoose = require("mongoose");

const creditNoteItemSchema = new mongoose.Schema(
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
            min: 0,
            max: 100,
            default: 0,
        },

        discountAmount: {
            type: Number,
            min: 0,
            default: 0,
        },

        taxableAmount: {
            type: Number,
            min: 0,
            default: 0,
        },

        taxPercent: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        taxAmount: {
            type: Number,
            min: 0,
            default: 0,
        },

        lineTotal: {
            type: Number,
            min: 0,
            default: 0,
        },
    },
    { _id: false }
);

const creditNoteSchema = new mongoose.Schema(
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
        // Credit Note Number
        // ===============================
        creditNoteNumber: {
            type: String,
            required: true,
            trim: true,
        },

        // ===============================
        // Dates
        // ===============================
        creditNoteDate: {
            type: Date,
            required: true,
            default: Date.now,
        },

        // ===============================
        // References
        // ===============================
        salesReturn: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SalesReturn",
            required: true,
        },

        salesInvoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SalesInvoice",
            required: true,
        },

        salesOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SalesOrder",
            default: null,
        },

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },

        // ===============================
        // Items
        // ===============================
        items: {
            type: [creditNoteItemSchema],
            required: true,
            validate: {
                validator: function (items) {
                    return items && items.length > 0;
                },
                message: "Credit Note must contain at least one item",
            },
        },

        // ===============================
        // Totals
        // ===============================
        subtotal: {
            type: Number,
            min: 0,
            default: 0,
        },

        discountAmount: {
            type: Number,
            min: 0,
            default: 0,
        },

        taxableAmount: {
            type: Number,
            min: 0,
            default: 0,
        },

        taxAmount: {
            type: Number,
            min: 0,
            default: 0,
        },

        grandTotal: {
            type: Number,
            min: 0,
            required: true,
        },

        // ===============================
        // Application
        // ===============================
        appliedAmount: {
            type: Number,
            min: 0,
            default: 0,
        },

        remainingAmount: {
            type: Number,
            min: 0,
            default: 0,
        },

        // ===============================
        // Status
        // ===============================
        status: {
            type: String,
            enum: [
                "DRAFT",
                "ISSUED",
                "PARTIALLY_APPLIED",
                "FULLY_APPLIED",
                "CANCELLED",
            ],
            default: "DRAFT",
            index: true,
        },

        // ===============================
        // Reason / Notes
        // ===============================
        reason: {
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
            default: null,
        },

        issuedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        issuedAt: {
            type: Date,
            default: null,
        },

        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
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
    },
    {
        timestamps: true,
    }
);

// ===============================
// Indexes
// ===============================

creditNoteSchema.index(
    { company: 1, creditNoteNumber: 1 },
    { unique: true }
);

creditNoteSchema.index(
    { company: 1, salesReturn: 1 },
    { unique: true }
);

creditNoteSchema.index(
    { company: 1, salesInvoice: 1 }
);

creditNoteSchema.index(
    { company: 1, customer: 1, creditNoteDate: -1 }
);

creditNoteSchema.index(
    { company: 1, status: 1 }
);

module.exports = mongoose.model(
    "CreditNote",
    creditNoteSchema
);