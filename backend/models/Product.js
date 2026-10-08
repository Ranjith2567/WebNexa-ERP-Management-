const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        // =====================================================
        // COMPANY
        // =====================================================
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: [true, "Company is required"],
        },

        // =====================================================
        // BRANCH
        // =====================================================
        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: [true, "Branch is required"],
        },

        // =====================================================
        // BASIC DETAILS
        // =====================================================
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
            maxlength: 150,
        },

        sku: {
            type: String,
            required: [true, "SKU is required"],
            trim: true,
            uppercase: true,
            maxlength: 50,
        },

        barcode: {
            type: String,
            trim: true,
            default: "",
            maxlength: 100,
        },

        description: {
            type: String,
            trim: true,
            default: "",
            maxlength: 1000,
        },

        // =====================================================
        // INVENTORY CLASSIFICATION
        // =====================================================
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null,
        },

        brand: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Brand",
            default: null,
        },

        unit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Unit",
            default: null,
        },

        // =====================================================
        // PRICING
        // =====================================================
        purchasePrice: {
            type: Number,
            default: 0,
            min: 0,
        },

        sellingPrice: {
            type: Number,
            required: [true, "Selling price is required"],
            min: 0,
        },

        // =====================================================
        // TAX
        // =====================================================
        taxRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        // =====================================================
        // STOCK SETTINGS
        // =====================================================
        // Product-level opening/reference stock.
        // Actual warehouse stock is maintained in Stock model.
        openingStock: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Product-level default minimum stock.
        // Warehouse-specific minimum stock is maintained in Stock.
        minimumStock: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Product-level default maximum stock.
        // Warehouse-specific maximum stock is maintained in Stock.
        maximumStock: {
            type: Number,
            default: 0,
            min: 0,
        },

        // =====================================================
        // PRODUCT STATUS
        // =====================================================
        isActive: {
            type: Boolean,
            default: true,
        },

        // =====================================================
        // PRODUCT CREATOR
        // =====================================================
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

// =====================================================
// UNIQUE SKU PER COMPANY
// =====================================================
productSchema.index(
    {
        company: 1,
        sku: 1,
    },
    {
        unique: true,
    }
);

// =====================================================
// UNIQUE BARCODE PER COMPANY
// Only when barcode is provided
// =====================================================
productSchema.index(
    {
        company: 1,
        barcode: 1,
    },
    {
        unique: true,
        partialFilterExpression: {
            barcode: {
                $type: "string",
                $ne: "",
            },
        },
    }
);

// =====================================================
// SEARCH / FILTER INDEXES
// =====================================================
productSchema.index({
    company: 1,
    branch: 1,
});

productSchema.index({
    company: 1,
    category: 1,
});

productSchema.index({
    company: 1,
    brand: 1,
});

productSchema.index({
    company: 1,
    unit: 1,
});

productSchema.index({
    company: 1,
    isActive: 1,
});

// =====================================================
// MODEL
// =====================================================
const Product = mongoose.model(
    "Product",
    productSchema
);

module.exports = Product;