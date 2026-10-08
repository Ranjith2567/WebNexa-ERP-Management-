const mongoose = require("mongoose");

const salesPaymentSchema = new mongoose.Schema(
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

        paymentNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },

        paymentDate: {
            type: Date,
            default: Date.now,
            required: true,
        },

        salesInvoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SalesInvoice",
            required: true,
            index: true,
        },

        salesOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SalesOrder",
            default: null,
            index: true,
        },

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
            index: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 0.01,
        },

        paymentMethod: {
            type: String,
            enum: [
                "CASH",
                "UPI",
                "BANK_TRANSFER",
                "CARD",
                "CHEQUE",
                "OTHER",
            ],
            required: true,
        },

        transactionReference: {
            type: String,
            trim: true,
            default: "",
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },

        status: {
            type: String,
            enum: [
                "SUCCESS",
                "CANCELLED",
            ],
            default: "SUCCESS",
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

/*
|--------------------------------------------------------------------------
| Payment Number
|--------------------------------------------------------------------------
|
| Example:
| SPAY-000001
|
| Unique inside a company.
|
*/

salesPaymentSchema.index(
    {
        company: 1,
        paymentNumber: 1,
    },
    {
        unique: true,
    }
);

/*
|--------------------------------------------------------------------------
| Transaction Reference
|--------------------------------------------------------------------------
|
| Allows searching payment references.
|
*/

salesPaymentSchema.index({
    company: 1,
    transactionReference: 1,
});

/*
|--------------------------------------------------------------------------
| Invoice Payment History
|--------------------------------------------------------------------------
*/

salesPaymentSchema.index({
    company: 1,
    salesInvoice: 1,
    paymentDate: -1,
});

/*
|--------------------------------------------------------------------------
| Customer Payment History
|--------------------------------------------------------------------------
*/

salesPaymentSchema.index({
    company: 1,
    customer: 1,
    paymentDate: -1,
});

/*
|--------------------------------------------------------------------------
| Branch Payment History
|--------------------------------------------------------------------------
*/

salesPaymentSchema.index({
    company: 1,
    branch: 1,
    paymentDate: -1,
});

/*
|--------------------------------------------------------------------------
| Payment Status
|--------------------------------------------------------------------------
*/

salesPaymentSchema.index({
    company: 1,
    status: 1,
});

module.exports = mongoose.model(
    "SalesPayment",
    salesPaymentSchema
);