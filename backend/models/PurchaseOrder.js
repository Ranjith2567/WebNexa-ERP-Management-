const mongoose = require("mongoose");

const purchaseOrderSchema = new mongoose.Schema(
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

        warehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            required: [true, "Warehouse is required"],
        },

        poNumber: {
            type: String,
            required: [true, "Purchase order number is required"],
            trim: true,
            uppercase: true,
            maxlength: 30,
        },

        orderDate: {
            type: Date,
            required: [true, "Order date is required"],
            default: Date.now,
        },

        expectedDeliveryDate: {
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

        totalAmount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
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

        status: {
            type: String,
            enum: [
                "DRAFT",
                "PENDING_APPROVAL",
                "APPROVED",
                "REJECTED",
                "SENT",
                "PARTIALLY_RECEIVED",
                "RECEIVED",
                "CANCELLED",
            ],
            default: "DRAFT",
        },

        approval: {
            approvedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                default: null,
            },

            approvedAt: {
                type: Date,
                default: null,
            },

            rejectionReason: {
                type: String,
                trim: true,
                maxlength: 1000,
                default: "",
            },
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

// =====================================================
// INDEXES
// =====================================================

purchaseOrderSchema.index(
    { company: 1, poNumber: 1 },
    { unique: true }
);

purchaseOrderSchema.index({
    company: 1,
    supplier: 1,
});

purchaseOrderSchema.index({
    company: 1,
    branch: 1,
});

purchaseOrderSchema.index({
    company: 1,
    warehouse: 1,
});

purchaseOrderSchema.index({
    company: 1,
    status: 1,
});

purchaseOrderSchema.index({
    company: 1,
    orderDate: -1,
});

const PurchaseOrder = mongoose.model(
    "PurchaseOrder",
    purchaseOrderSchema
);

module.exports = PurchaseOrder;