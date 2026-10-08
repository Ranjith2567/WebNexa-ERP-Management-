const mongoose = require("mongoose");

const stockTransferSchema = new mongoose.Schema(
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

        transferNumber: {
            type: String,
            required: [true, "Transfer number is required"],
            trim: true,
            uppercase: true,
        },

        fromWarehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            required: [true, "Source warehouse is required"],
        },

        toWarehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            required: [true, "Destination warehouse is required"],
        },

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product is required"],
        },

        quantity: {
            type: Number,
            required: [true, "Transfer quantity is required"],
            min: 1,
        },

        reason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "APPROVED",
                "IN_TRANSIT",
                "COMPLETED",
                "CANCELLED",
            ],
            default: "PENDING",
        },

        transferDate: {
            type: Date,
            default: Date.now,
        },

        completedAt: {
            type: Date,
            default: null,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// ===============================
// Indexes
// ===============================

stockTransferSchema.index(
    {
        company: 1,
        transferNumber: 1,
    },
    {
        unique: true,
    }
);

stockTransferSchema.index({
    company: 1,
    branch: 1,
});

stockTransferSchema.index({
    company: 1,
    fromWarehouse: 1,
});

stockTransferSchema.index({
    company: 1,
    toWarehouse: 1,
});

stockTransferSchema.index({
    company: 1,
    product: 1,
});

stockTransferSchema.index({
    company: 1,
    status: 1,
});

stockTransferSchema.index({
    company: 1,
    transferDate: -1,
});

const StockTransfer = mongoose.model(
    "StockTransfer",
    stockTransferSchema
);

module.exports = StockTransfer;