const mongoose = require("mongoose");

const quotationItemSchema = new mongoose.Schema(
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

        lineTotal: {
            type: Number,
            min: 0,
            default: 0,
        },
    },
    { _id: true }
);

const quotationSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: [true, "Company is required"],
            index: true,
        },

        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: [true, "Branch is required"],
            index: true,
        },

        quotationNumber: {
            type: String,
            required: [true, "Quotation number is required"],
            trim: true,
            uppercase: true,
        },

        quotationDate: {
            type: Date,
            required: true,
            default: Date.now,
        },

        validUntil: {
            type: Date,
            required: true,
        },

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: [true, "Customer is required"],
            index: true,
        },

        salesPerson: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        items: {
            type: [quotationItemSchema],
            required: true,
            validate: {
                validator: function (items) {
                    return Array.isArray(items) && items.length > 0;
                },
                message: "At least one quotation item is required",
            },
        },

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

        totalAmount: {
            type: Number,
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
                "SENT",
                "ACCEPTED",
                "REJECTED",
                "EXPIRED",
                "CANCELLED",
            ],
            default: "DRAFT",
            index: true,
        },

        convertedToSalesOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SalesOrder",
            default: null,
        },

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

quotationSchema.index(
    { company: 1, quotationNumber: 1 },
    { unique: true }
);

quotationSchema.index({ company: 1, customer: 1 });
quotationSchema.index({ company: 1, quotationDate: -1 });
quotationSchema.index({ company: 1, status: 1 });
quotationSchema.index({ company: 1, validUntil: 1 });

const Quotation = mongoose.model("Quotation", quotationSchema);

module.exports = Quotation;