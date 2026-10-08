const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
        },

        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: true,
        },

        originalName: {
            type: String,
            required: true,
            trim: true,
        },

        fileName: {
            type: String,
            required: true,
            trim: true,
        },

        storageKey: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        mimeType: {
            type: String,
            required: true,
            trim: true,
        },

        fileSize: {
            type: Number,
            required: true,
            min: 0,
        },

        entityType: {
            type: String,
            required: true,
            enum: [
                "PURCHASE_ORDER",
                "PURCHASE_INVOICE",
                "PURCHASE_RETURN",
                "SALES_ORDER",
                "SALES_INVOICE",
                "SALES_RETURN",
                "EXPENSE",
                "CUSTOMER",
                "SUPPLIER",
                "EMPLOYEE",
                "USER",
                "GENERAL",
            ],
        },

        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },

        isPublic: {
            type: Boolean,
            default: false,
        },

        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Useful indexes
documentSchema.index({ company: 1, branch: 1 });
documentSchema.index({ entityType: 1, entityId: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Document", documentSchema);