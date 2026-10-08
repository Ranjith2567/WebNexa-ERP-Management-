const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
    {
        // ==========================================
        // COMPANY & BRANCH
        // ==========================================

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

        // ==========================================
        // CUSTOMER IDENTIFICATION
        // ==========================================

        customerCode: {
            type: String,
            required: [true, "Customer code is required"],
            trim: true,
            uppercase: true,
            maxlength: 30,
        },

        customerType: {
            type: String,
            enum: [
                "INDIVIDUAL",
                "BUSINESS",
            ],
            default: "INDIVIDUAL",
        },

        // ==========================================
        // BASIC INFORMATION
        // ==========================================

        name: {
            type: String,
            required: [true, "Customer name is required"],
            trim: true,
            maxlength: 150,
        },

        companyName: {
            type: String,
            trim: true,
            maxlength: 200,
            default: "",
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: 150,
            default: "",
        },

        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
            maxlength: 20,
        },

        alternatePhone: {
            type: String,
            trim: true,
            maxlength: 20,
            default: "",
        },

        // ==========================================
        // TAX INFORMATION
        // ==========================================

        gstNumber: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: 20,
            default: "",
        },

        panNumber: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: 20,
            default: "",
        },

        // ==========================================
        // BILLING ADDRESS
        // ==========================================

        billingAddress: {
            addressLine1: {
                type: String,
                trim: true,
                maxlength: 250,
                default: "",
            },

            addressLine2: {
                type: String,
                trim: true,
                maxlength: 250,
                default: "",
            },

            city: {
                type: String,
                trim: true,
                maxlength: 100,
                default: "",
            },

            state: {
                type: String,
                trim: true,
                maxlength: 100,
                default: "",
            },

            country: {
                type: String,
                trim: true,
                maxlength: 100,
                default: "India",
            },

            postalCode: {
                type: String,
                trim: true,
                maxlength: 15,
                default: "",
            },
        },

        // ==========================================
        // SHIPPING ADDRESS
        // ==========================================

        shippingAddress: {
            addressLine1: {
                type: String,
                trim: true,
                maxlength: 250,
                default: "",
            },

            addressLine2: {
                type: String,
                trim: true,
                maxlength: 250,
                default: "",
            },

            city: {
                type: String,
                trim: true,
                maxlength: 100,
                default: "",
            },

            state: {
                type: String,
                trim: true,
                maxlength: 100,
                default: "",
            },

            country: {
                type: String,
                trim: true,
                maxlength: 100,
                default: "India",
            },

            postalCode: {
                type: String,
                trim: true,
                maxlength: 15,
                default: "",
            },
        },

        // ==========================================
        // FINANCIAL SETTINGS
        // ==========================================

        creditLimit: {
            type: Number,
            min: [0, "Credit limit cannot be negative"],
            default: 0,
        },

        paymentTerms: {
            type: Number,
            min: [0, "Payment terms cannot be negative"],
            default: 0,
        },

        openingBalance: {
            type: Number,
            default: 0,
        },

        // ==========================================
        // NOTES
        // ==========================================

        notes: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: "",
        },

        // ==========================================
        // STATUS
        // ==========================================

        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },

        // ==========================================
        // AUDIT
        // ==========================================

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
// UNIQUE CUSTOMER CODE PER COMPANY
// ======================================================

customerSchema.index(
    {
        company: 1,
        customerCode: 1,
    },
    {
        unique: true,
    }
);

// ======================================================
// CUSTOMER SEARCH
// ======================================================

customerSchema.index({
    company: 1,
    name: 1,
});

customerSchema.index({
    company: 1,
    phone: 1,
});

customerSchema.index({
    company: 1,
    email: 1,
});

// ======================================================
// BRANCH FILTER
// ======================================================

customerSchema.index({
    company: 1,
    branch: 1,
});

// ======================================================
// CUSTOMER TYPE
// ======================================================

customerSchema.index({
    company: 1,
    customerType: 1,
});

// ======================================================
// STATUS FILTER
// ======================================================

customerSchema.index({
    company: 1,
    isActive: 1,
});

// ======================================================
// MODEL
// ======================================================

const Customer = mongoose.model(
    "Customer",
    customerSchema
);

module.exports = Customer;