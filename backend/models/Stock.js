const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
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

        warehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            required: [true, "Warehouse is required"],
            index: true,
        },

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product is required"],
            index: true,
        },

        // ==========================================
        // ACTUAL STOCK QUANTITY
        // ==========================================
        quantity: {
            type: Number,
            default: 0,
            min: [0, "Quantity cannot be negative"],
        },

        // ==========================================
        // RESERVED STOCK
        // ==========================================
        reservedQuantity: {
            type: Number,
            default: 0,
            min: [
                0,
                "Reserved quantity cannot be negative",
            ],
        },

        // ==========================================
        // LEGACY / TEMPORARY STOCK SETTINGS
        // ==========================================
        //
        // Actual low-stock business logic is handled
        // using Product.minimumStock / ReorderLevel.
        //
        minimumStock: {
            type: Number,
            default: 0,
            min: [
                0,
                "Minimum stock cannot be negative",
            ],
        },

        maximumStock: {
            type: Number,
            default: 0,
            min: [
                0,
                "Maximum stock cannot be negative",
            ],
        },

        // ==========================================
        // LAST STOCK MOVEMENT / UPDATE TIME
        // ==========================================
        lastStockUpdate: {
            type: Date,
            default: Date.now,
        },

        // ==========================================
        // STATUS
        // ==========================================
        isActive: {
            type: Boolean,
            default: true,
        },

        // ==========================================
        // CREATED BY
        // ==========================================
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Created by user is required"],
        },
    },
    {
        timestamps: true,
    }
);

// =====================================================
// UNIQUE STOCK
// One product can have only one stock record
// inside one warehouse/company.
// =====================================================
stockSchema.index(
    {
        company: 1,
        warehouse: 1,
        product: 1,
    },
    {
        unique: true,
    }
);

// =====================================================
// FILTER / QUERY INDEXES
// =====================================================

stockSchema.index({
    company: 1,
    branch: 1,
});

stockSchema.index({
    company: 1,
    product: 1,
});

stockSchema.index({
    company: 1,
    warehouse: 1,
});

stockSchema.index({
    company: 1,
    isActive: 1,
});

stockSchema.index({
    company: 1,
    warehouse: 1,
    isActive: 1,
});

// =====================================================
// VALIDATION
// Mongoose 9 compatible middleware
// =====================================================
stockSchema.pre("validate", function () {
    if (
        this.reservedQuantity >
        this.quantity
    ) {
        throw new Error(
            "Reserved quantity cannot be greater than total quantity"
        );
    }

    if (
        this.maximumStock > 0 &&
        this.minimumStock >
            this.maximumStock
    ) {
        throw new Error(
            "Minimum stock cannot be greater than maximum stock"
        );
    }
});

// =====================================================
// MODEL
// =====================================================

const Stock = mongoose.model(
    "Stock",
    stockSchema
);

module.exports = Stock;