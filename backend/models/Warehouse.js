const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema(
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

        name: {
            type: String,
            required: [true, "Warehouse name is required"],
            trim: true,
            maxlength: 150,
        },

        code: {
            type: String,
            required: [true, "Warehouse code is required"],
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

            postalCode: {
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

        manager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        capacity: {
            type: Number,
            default: 0,
            min: 0,
        },

        isMainWarehouse: {
            type: Boolean,
            default: false,
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

// Unique warehouse code within company
warehouseSchema.index(
    {
        company: 1,
        code: 1,
    },
    {
        unique: true,
    }
);

// Unique warehouse name within company
warehouseSchema.index(
    {
        company: 1,
        name: 1,
    },
    {
        unique: true,
    }
);

// Branch-wise warehouse lookup
warehouseSchema.index({
    company: 1,
    branch: 1,
});

// Active warehouse lookup
warehouseSchema.index({
    company: 1,
    isActive: 1,
});

const Warehouse = mongoose.model(
    "Warehouse",
    warehouseSchema
);

module.exports = Warehouse;