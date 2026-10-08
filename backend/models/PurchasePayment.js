const mongoose = require("mongoose");

const purchasePaymentSchema = new mongoose.Schema(
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

        purchaseInvoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PurchaseInvoice",
            required: [true, "Purchase invoice is required"],
        },

        paymentNumber: {
            type: String,
            required: [true, "Payment number is required"],
            trim: true,
            uppercase: true,
            maxlength: 30,
        },

        paymentDate: {
            type: Date,
            required: [true, "Payment date is required"],
            default: Date.now,
        },

        amount: {
            type: Number,
            required: [true, "Payment amount is required"],
            min: [0.01, "Payment amount must be greater than 0"],
        },

        paymentMethod: {
            type: String,
            enum: [
                "CASH",
                "BANK_TRANSFER",
                "UPI",
                "CHEQUE",
                "CARD",
                "NEFT",
                "RTGS",
                "IMPS",
                "OTHER",
            ],
            required: [true, "Payment method is required"],
        },

        transactionReference: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: 100,
            default: "",
        },

        bankName: {
            type: String,
            trim: true,
            maxlength: 150,
            default: "",
        },

        chequeNumber: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: 50,
            default: "",
        },

        chequeDate: {
            type: Date,
            default: null,
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: "",
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "COMPLETED",
                "CANCELLED",
            ],
            default: "COMPLETED",
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

// Unique payment number inside company
purchasePaymentSchema.index(
    {
        company: 1,
        paymentNumber: 1,
    },
    {
        unique: true,
    }
);

// Invoice payment lookup
purchasePaymentSchema.index({
    company: 1,
    purchaseInvoice: 1,
});

// Supplier payment lookup
purchasePaymentSchema.index({
    company: 1,
    supplier: 1,
});

// Branch payment lookup
purchasePaymentSchema.index({
    company: 1,
    branch: 1,
});

// Payment date reports
purchasePaymentSchema.index({
    company: 1,
    paymentDate: -1,
});

// Payment status
purchasePaymentSchema.index({
    company: 1,
    status: 1,
});

const PurchasePayment = mongoose.model(
    "PurchasePayment",
    purchasePaymentSchema
);

module.exports = PurchasePayment;