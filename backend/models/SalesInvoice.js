const mongoose = require("mongoose");

const salesInvoiceItemSchema = new mongoose.Schema(
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
            default: 0,
            min: 0,
        },
    },
    { _id: false }
);

const salesInvoiceSchema = new mongoose.Schema(
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

        invoiceNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },

        invoiceDate: {
            type: Date,
            default: Date.now,
            required: true,
        },

        dueDate: {
            type: Date,
            default: null,
        },

        salesOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SalesOrder",
            required: true,
            index: true,
        },

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
            index: true,
        },

        salesPerson: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        items: {
            type: [salesInvoiceItemSchema],
            required: true,
            validate: {
                validator: function (items) {
                    return Array.isArray(items) && items.length > 0;
                },
                message: "At least one invoice item is required",
            },
        },

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

        paidAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        balanceDue: {
            type: Number,
            default: 0,
            min: 0,
        },

        paymentStatus: {
            type: String,
            enum: [
                "UNPAID",
                "PARTIALLY_PAID",
                "PAID",
                "OVERDUE",
            ],
            default: "UNPAID",
        },

        status: {
            type: String,
            enum: [
                "DRAFT",
                "ISSUED",
                "CANCELLED",
            ],
            default: "DRAFT",
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },

        termsAndConditions: {
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

/*
 * Invoice number must be unique inside a company.
 */
salesInvoiceSchema.index(
    { company: 1, invoiceNumber: 1 },
    { unique: true }
);

/*
 * One Sales Order → One Sales Invoice
 */
salesInvoiceSchema.index(
    { company: 1, salesOrder: 1 },
    { unique: true }
);

salesInvoiceSchema.index({
    company: 1,
    branch: 1,
    invoiceDate: -1,
});

salesInvoiceSchema.index({
    company: 1,
    customer: 1,
    invoiceDate: -1,
});

salesInvoiceSchema.index({
    company: 1,
    paymentStatus: 1,
});

module.exports = mongoose.model("SalesInvoice", salesInvoiceSchema);