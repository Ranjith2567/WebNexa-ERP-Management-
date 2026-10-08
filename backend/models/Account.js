const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
            index: true,
        },

        accountCode: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },

        accountName: {
            type: String,
            required: true,
            trim: true,
        },

        accountType: {
            type: String,
            enum: [
                "ASSET",
                "LIABILITY",
                "EQUITY",
                "INCOME",
                "EXPENSE",
            ],
            required: true,
        },

        parentAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            default: null,
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },

        isSystemAccount: {
            type: Boolean,
            default: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        openingBalance: {
            type: Number,
            min: 0,
            default: 0,
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

// One account code per company
accountSchema.index(
    {
        company: 1,
        accountCode: 1,
    },
    {
        unique: true,
    }
);

// Account name lookup
accountSchema.index({
    company: 1,
    accountName: 1,
});

// Active account filtering
accountSchema.index({
    company: 1,
    accountType: 1,
    isActive: 1,
});

module.exports = mongoose.model("Account", accountSchema);