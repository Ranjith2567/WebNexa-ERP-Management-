const mongoose = require("mongoose");

const purchaseInvoiceSchema = new mongoose.Schema(
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

        invoiceNumber: {
            type: String,
            required: [true, "Invoice number is required"],
            trim: true,
            uppercase: true,
            maxlength: 100,
        },

        internalInvoiceNumber: {
            type: String,
            required: [true, "Internal invoice number is required"],
            trim: true,
            uppercase: true,
            maxlength: 30,
        },

        invoiceDate: {
            type: Date,
            required: [true, "Invoice date is required"],
            default: Date.now,
        },

        dueDate: {
            type: Date,
            default: null,
        },

        paymentTerms: {
            type: Number,
            default: 0,
            min: 0,
        },

        currency: {
            type: String,
            trim: true,
            uppercase: true,
            default: "INR",
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

        shippingAmount: {
            type: Number,
            min: 0,
            default: 0,
        },

        otherCharges: {
            type: Number,
            min: 0,
            default: 0,
        },

        roundOffAmount: {
            type: Number,
            default: 0,
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        paidAmount: {
            type: Number,
            min: 0,
            default: 0,
        },

        dueAmount: {
            type: Number,
            min: 0,
            default: 0,
        },

        paymentStatus: {
            type: String,
            enum: [
                "UNPAID",
                "PARTIALLY_PAID",
                "PAID",
                "OVERDUE",
                "CANCELLED",
            ],
            default: "UNPAID",
        },

        status: {
            type: String,
            enum: [
                "DRAFT",
                "POSTED",
                "PARTIALLY_PAID",
                "PAID",
                "CANCELLED",
            ],
            default: "DRAFT",
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: "",
        },

        termsAndConditions: {
            type: String,
            trim: true,
            maxlength: 5000,
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

// Supplier invoice number should be unique per company
purchaseInvoiceSchema.index(
    {
        company: 1,
        invoiceNumber: 1,
    },
    {
        unique: true,
    }
);

// Internal ERP invoice number
purchaseInvoiceSchema.index(
    {
        company: 1,
        internalInvoiceNumber: 1,
    },
    {
        unique: true,
    }
);

purchaseInvoiceSchema.index({
    company: 1,
    supplier: 1,
});

purchaseInvoiceSchema.index({
    company: 1,
    branch: 1,
});

purchaseInvoiceSchema.index({
    company: 1,
    purchaseOrder: 1,
});

purchaseInvoiceSchema.index({
    company: 1,
    goodsReceipt: 1,
});

purchaseInvoiceSchema.index({
    company: 1,
    status: 1,
});

purchaseInvoiceSchema.index({
    company: 1,
    paymentStatus: 1,
});

purchaseInvoiceSchema.index({
    company: 1,
    invoiceDate: -1,
});

const PurchaseInvoice = mongoose.model(
    "PurchaseInvoice",
    purchaseInvoiceSchema
);

module.exports = PurchaseInvoice;