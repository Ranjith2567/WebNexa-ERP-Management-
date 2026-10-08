const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
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

        supplierCode: {
            type: String,
            required: [true, "Supplier code is required"],
            trim: true,
            uppercase: true,
            maxlength: 30,
        },

        name: {
            type: String,
            required: [true, "Supplier name is required"],
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

        paymentTerms: {
            type: Number,
            default: 0,
            min: 0,
        },

        creditLimit: {
            type: Number,
            default: 0,
            min: 0,
        },

        address: {
            street: {
                type: String,
                trim: true,
                default: "",
            },

            city: {
                type: String,
                trim: true,
                default: "",
            },

            state: {
                type: String,
                trim: true,
                default: "",
            },

            pincode: {
                type: String,
                trim: true,
                default: "",
            },

            country: {
                type: String,
                trim: true,
                default: "India",
            },
        },

        bankDetails: {
            accountName: {
                type: String,
                trim: true,
                default: "",
            },

            accountNumber: {
                type: String,
                trim: true,
                default: "",
            },

            bankName: {
                type: String,
                trim: true,
                default: "",
            },

            ifscCode: {
                type: String,
                trim: true,
                uppercase: true,
                default: "",
            },
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Supplier code unique within company
supplierSchema.index(
    { company: 1, supplierCode: 1 },
    { unique: true }
);

// Supplier name unique within company
supplierSchema.index(
    { company: 1, name: 1 },
    { unique: true }
);

supplierSchema.index({ company: 1, branch: 1 });
supplierSchema.index({ company: 1, isActive: 1 });

const Supplier = mongoose.model("Supplier", supplierSchema);

module.exports = Supplier;