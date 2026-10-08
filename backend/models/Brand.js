const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: [true, "Company is required"],
        },

        name: {
            type: String,
            required: [true, "Brand name is required"],
            trim: true,
            maxlength: 100,
        },

        code: {
            type: String,
            required: [true, "Brand code is required"],
            trim: true,
            uppercase: true,
            maxlength: 30,
        },

        description: {
            type: String,
            trim: true,
            default: "",
            maxlength: 500,
        },

        logo: {
            type: String,
            trim: true,
            default: "",
        },

        website: {
            type: String,
            trim: true,
            default: "",
            maxlength: 300,
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

// ===============================
// Unique Brand Code per Company
// ===============================
brandSchema.index(
    {
        company: 1,
        code: 1,
    },
    {
        unique: true,
    }
);

// ===============================
// Unique Brand Name per Company
// ===============================
brandSchema.index(
    {
        company: 1,
        name: 1,
    },
    {
        unique: true,
    }
);

// ===============================
// Company + Active Filter
// ===============================
brandSchema.index({
    company: 1,
    isActive: 1,
});

const Brand = mongoose.model("Brand", brandSchema);

module.exports = Brand;