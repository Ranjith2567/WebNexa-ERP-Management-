const mongoose = require("mongoose");

// ======================================================
// Sales Order Item Schema
// ======================================================
const salesOrderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product is required"],
        },

        description: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },

        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [0.000001, "Quantity must be greater than zero"],
        },

        unitPrice: {
            type: Number,
            required: [true, "Unit price is required"],
            min: [0, "Unit price cannot be negative"],
        },

        discountPercent: {
            type: Number,
            min: [0, "Discount cannot be negative"],
            max: [100, "Discount cannot exceed 100"],
            default: 0,
        },

        taxPercent: {
            type: Number,
            min: [0, "Tax cannot be negative"],
            max: [100, "Tax cannot exceed 100"],
            default: 0,
        },

        discountAmount: {
            type: Number,
            min: [0, "Discount amount cannot be negative"],
            default: 0,
        },

        taxableAmount: {
            type: Number,
            min: [0, "Taxable amount cannot be negative"],
            default: 0,
        },

        taxAmount: {
            type: Number,
            min: [0, "Tax amount cannot be negative"],
            default: 0,
        },

        lineTotal: {
            type: Number,
            min: [0, "Line total cannot be negative"],
            default: 0,
        },
    },
    {
        _id: true,
    }
);

// ======================================================
// Sales Order Schema
// ======================================================
const salesOrderSchema = new mongoose.Schema(
    {
        // ==================================================
        // Company
        // ==================================================
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: [true, "Company is required"],
            index: true,
        },

        // ==================================================
        // Branch
        // ==================================================
        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: [true, "Branch is required"],
            index: true,
        },

        // ==================================================
        // Sales Order Number
        // ==================================================
        salesOrderNumber: {
            type: String,
            required: [true, "Sales order number is required"],
            trim: true,
            uppercase: true,
        },

        // ==================================================
        // Order Date
        // ==================================================
        orderDate: {
            type: Date,
            required: true,
            default: Date.now,
        },

        // ==================================================
        // Expected Delivery Date
        // ==================================================
        expectedDeliveryDate: {
            type: Date,
            default: null,
        },

        // ==================================================
        // Customer
        // ==================================================
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: [true, "Customer is required"],
            index: true,
        },

        // ==================================================
        // Quotation Reference
        // ==================================================
        quotation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quotation",
            default: null,
            index: true,
        },

        // ==================================================
        // Sales Person
        // ==================================================
        salesPerson: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // ==================================================
        // Warehouse
        // ==================================================
        warehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            required: [true, "Warehouse is required"],
            index: true,
        },

        // ==================================================
        // Items
        // ==================================================
        items: {
            type: [salesOrderItemSchema],
            required: true,

            validate: {
                validator: function (items) {
                    return (
                        Array.isArray(items) &&
                        items.length > 0
                    );
                },

                message:
                    "At least one sales order item is required",
            },
        },

        // ==================================================
        // Financial Calculations
        // ==================================================
        subtotal: {
            type: Number,
            min: [0, "Subtotal cannot be negative"],
            default: 0,
        },

        discountAmount: {
            type: Number,
            min: [0, "Discount amount cannot be negative"],
            default: 0,
        },

        taxableAmount: {
            type: Number,
            min: [0, "Taxable amount cannot be negative"],
            default: 0,
        },

        taxAmount: {
            type: Number,
            min: [0, "Tax amount cannot be negative"],
            default: 0,
        },

        totalAmount: {
            type: Number,
            min: [0, "Total amount cannot be negative"],
            default: 0,
        },

        // ==================================================
        // Payment
        // ==================================================
        paymentStatus: {
            type: String,
            enum: [
                "UNPAID",
                "PARTIALLY_PAID",
                "PAID",
            ],
            default: "UNPAID",
            index: true,
        },

        paidAmount: {
            type: Number,
            min: [0, "Paid amount cannot be negative"],
            default: 0,
        },

        // ==================================================
        // Order Status
        // ==================================================
        status: {
            type: String,
            enum: [
                "DRAFT",
                "CONFIRMED",
                "PROCESSING",
                "READY_TO_DELIVER",
                "COMPLETED",
                "CANCELLED",
            ],
            default: "DRAFT",
            index: true,
        },

        // ==================================================
        // Sales Invoice Reference
        // ==================================================
        salesInvoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SalesInvoice",
            default: null,
            index: true,
        },

        // ==================================================
        // Notes
        // ==================================================
        notes: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: "",
        },

        // ==================================================
        // Terms & Conditions
        // ==================================================
        termsAndConditions: {
            type: String,
            trim: true,
            maxlength: 5000,
            default: "",
        },

        // ==================================================
        // Cancellation
        // ==================================================
        cancellationReason: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        cancelledAt: {
            type: Date,
            default: null,
        },

        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // ==================================================
        // Audit Fields
        // ==================================================
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Created by user is required"],
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

// ======================================================
// Indexes
// ======================================================

// Unique Sales Order Number per company
salesOrderSchema.index(
    {
        company: 1,
        salesOrderNumber: 1,
    },
    {
        unique: true,
    }
);

// Customer orders
salesOrderSchema.index({
    company: 1,
    customer: 1,
});

// Quotation conversion lookup
salesOrderSchema.index({
    company: 1,
    quotation: 1,
});

// Warehouse orders
salesOrderSchema.index({
    company: 1,
    warehouse: 1,
});

// Order date
salesOrderSchema.index({
    company: 1,
    orderDate: -1,
});

// Status filtering
salesOrderSchema.index({
    company: 1,
    status: 1,
});

// Payment status
salesOrderSchema.index({
    company: 1,
    paymentStatus: 1,
});

// ======================================================
// Model
// ======================================================
const SalesOrder = mongoose.model(
    "SalesOrder",
    salesOrderSchema
);

module.exports = SalesOrder;