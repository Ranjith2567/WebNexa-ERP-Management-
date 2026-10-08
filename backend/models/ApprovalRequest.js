const mongoose = require("mongoose");

const approvalStepSchema = new mongoose.Schema(
    {
        level: {
            type: Number,
            required: true,
            min: 1,
        },

        approverType: {
            type: String,
            enum: ["ROLE", "USER"],
            required: true,
        },

        approverRole: {
            type: String,
            trim: true,
            default: null,
        },

        approverUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED", "SKIPPED"],
            default: "PENDING",
        },

        actedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        actedAt: {
            type: Date,
            default: null,
        },

        comments: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },
    },
    { _id: true }
);

const approvalRequestSchema = new mongoose.Schema(
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
            default: null,
            index: true,
        },

        module: {
            type: String,
            enum: [
                "PURCHASE_ORDER",
                "PURCHASE_RETURN",
                "EXPENSE",
                "STOCK_ADJUSTMENT",
                "SALES_RETURN",
                "QUOTATION",
                "SALES_ORDER",
                "PURCHASE_INVOICE",
                "SALES_INVOICE",
                "OTHER",
            ],
            required: true,
            index: true,
        },

        referenceType: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
            index: true,
        },

        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },

        referenceNumber: {
            type: String,
            trim: true,
            default: "",
            maxlength: 100,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        requestedAt: {
            type: Date,
            default: Date.now,
        },

        currentLevel: {
            type: Number,
            default: 1,
            min: 1,
        },

        totalLevels: {
            type: Number,
            default: 1,
            min: 1,
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "APPROVED",
                "REJECTED",
                "CANCELLED",
            ],
            default: "PENDING",
            index: true,
        },

        steps: {
            type: [approvalStepSchema],
            default: [],
        },

        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        approvedAt: {
            type: Date,
            default: null,
        },

        rejectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        rejectedAt: {
            type: Date,
            default: null,
        },

        rejectionReason: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
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
            maxlength: 1000,
            default: "",
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
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
| Indexes
|--------------------------------------------------------------------------
*/

approvalRequestSchema.index({
    company: 1,
    module: 1,
    status: 1,
    createdAt: -1,
});

approvalRequestSchema.index({
    company: 1,
    referenceType: 1,
    referenceId: 1,
});

approvalRequestSchema.index({
    company: 1,
    requestedBy: 1,
    status: 1,
    createdAt: -1,
});

approvalRequestSchema.index({
    company: 1,
    "steps.approverRole": 1,
    status: 1,
});

approvalRequestSchema.index({
    company: 1,
    "steps.approverUser": 1,
    status: 1,
});

module.exports = mongoose.model(
    "ApprovalRequest",
    approvalRequestSchema
);