const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Company name is required"],
            trim: true,
            maxlength: 150,
        },

        legalName: {
            type: String,
            trim: true,
            default: "",
            maxlength: 200,
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: "",
        },

        phone: {
            type: String,
            trim: true,
            default: "",
        },

        gstNumber: {
            type: String,
            trim: true,
            uppercase: true,
            default: "",
        },

        panNumber: {
            type: String,
            trim: true,
            uppercase: true,
            default: "",
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

            country: {
                type: String,
                trim: true,
                default: "India",
            },

            pincode: {
                type: String,
                trim: true,
                default: "",
            },
        },

        logo: {
            type: String,
            default: "",
        },

        currency: {
            type: String,
            default: "INR",
        },

        financialYearStart: {
            type: String,
            default: "April",
        },

        timezone: {
            type: String,
            default: "Asia/Kolkata",
        },

        taxEnabled: {
            type: Boolean,
            default: true,
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

const Company = mongoose.model("Company", companySchema);

module.exports = Company;