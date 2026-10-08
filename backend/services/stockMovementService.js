const mongoose = require("mongoose");
const StockMovement = require("../models/StockMovement");

// Allowed movement types
const MOVEMENT_TYPES = [
    "PURCHASE",
    "PURCHASE_RETURN",
    "SALE",
    "SALES_RETURN",
    "STOCK_ADJUSTMENT_IN",
    "STOCK_ADJUSTMENT_OUT",
    "STOCK_TRANSFER_IN",
    "STOCK_TRANSFER_OUT",
    "OPENING_STOCK",
    "DAMAGE",
    "EXPIRY",
    "OTHER",
];

// Allowed reference types
const REFERENCE_TYPES = [
    "GOODS_RECEIPT",
    "PURCHASE_RETURN",
    "SALES_INVOICE",
    "SALES_RETURN",
    "STOCK_ADJUSTMENT",
    "STOCK_TRANSFER",
    "PRODUCT",
    "OTHER",
];

const roundNumber = (value, decimals = 6) => {
    const factor = 10 ** decimals;
    return Math.round((value + Number.EPSILON) * factor) / factor;
};

const roundAmount = (value) => {
    return Math.round((value + Number.EPSILON) * 100) / 100;
};

const validateObjectId = (value, fieldName) => {
    if (!value || !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error(`Invalid ${fieldName}`);
    }
};

const recordStockMovement = async ({
    company,
    branch,
    warehouse,
    product,

    movementType,
    referenceType,

    referenceId = null,
    referenceNumber = "",

    quantityBefore,
    quantityChange,
    quantityAfter,

    unitPrice = 0,

    reason = "",
    notes = "",

    createdBy,

    session = null,
}) => {
    // --------------------------------------------------
    // Required fields
    // --------------------------------------------------

    if (!company) {
        throw new Error("Company is required for stock movement");
    }

    if (!branch) {
        throw new Error("Branch is required for stock movement");
    }

    if (!warehouse) {
        throw new Error("Warehouse is required for stock movement");
    }

    if (!product) {
        throw new Error("Product is required for stock movement");
    }

    if (!createdBy) {
        throw new Error("CreatedBy is required for stock movement");
    }

    // --------------------------------------------------
    // ObjectId validation
    // --------------------------------------------------

    validateObjectId(company, "company");
    validateObjectId(branch, "branch");
    validateObjectId(warehouse, "warehouse");
    validateObjectId(product, "product");
    validateObjectId(createdBy, "createdBy");

    if (
        referenceId !== null &&
        referenceId !== "" &&
        !mongoose.Types.ObjectId.isValid(referenceId)
    ) {
        throw new Error("Invalid referenceId");
    }

    // --------------------------------------------------
    // Movement type validation
    // --------------------------------------------------

    if (!MOVEMENT_TYPES.includes(movementType)) {
        throw new Error(
            `Invalid movementType. Allowed values: ${MOVEMENT_TYPES.join(", ")}`
        );
    }

    // --------------------------------------------------
    // Reference type validation
    // --------------------------------------------------

    if (!REFERENCE_TYPES.includes(referenceType)) {
        throw new Error(
            `Invalid referenceType. Allowed values: ${REFERENCE_TYPES.join(", ")}`
        );
    }

    // --------------------------------------------------
    // Quantity validation
    // --------------------------------------------------

    const before = Number(quantityBefore);
    const change = Number(quantityChange);
    const after = Number(quantityAfter);

    if (!Number.isFinite(before) || before < 0) {
        throw new Error(
            "Invalid quantity before movement"
        );
    }

    if (!Number.isFinite(change) || change === 0) {
        throw new Error(
            "Quantity change cannot be zero"
        );
    }

    if (!Number.isFinite(after) || after < 0) {
        throw new Error(
            "Invalid quantity after movement"
        );
    }

    // --------------------------------------------------
    // Quantity consistency
    // --------------------------------------------------

    const expectedAfter = before + change;

    if (
        Math.abs(
            expectedAfter - after
        ) > 0.000001
    ) {
        throw new Error(
            "Stock movement quantity mismatch: quantityAfter must equal quantityBefore + quantityChange"
        );
    }

    // Normalize quantity precision
    const normalizedBefore = roundNumber(before);
    const normalizedChange = roundNumber(change);
    const normalizedAfter = roundNumber(after);

    // --------------------------------------------------
    // Price validation
    // --------------------------------------------------

    const price = Number(unitPrice || 0);

    if (!Number.isFinite(price) || price < 0) {
        throw new Error(
            "Unit price cannot be negative"
        );
    }

    const normalizedPrice = roundAmount(price);

    // --------------------------------------------------
    // Total value
    // --------------------------------------------------

    const totalValue = roundAmount(
        Math.abs(normalizedChange) *
            normalizedPrice
    );

    // --------------------------------------------------
    // Reference number validation
    // --------------------------------------------------

    const normalizedReferenceNumber =
        String(referenceNumber || "").trim();

    const normalizedReason =
        String(reason || "").trim();

    const normalizedNotes =
        String(notes || "").trim();

    // --------------------------------------------------
    // Movement data
    // --------------------------------------------------

    const movementData = {
        company,
        branch,
        warehouse,
        product,

        movementType,
        referenceType,

        referenceId:
            referenceId || null,

        referenceNumber:
            normalizedReferenceNumber,

        quantityBefore:
            normalizedBefore,

        quantityChange:
            normalizedChange,

        quantityAfter:
            normalizedAfter,

        unitPrice:
            normalizedPrice,

        totalValue,

        reason:
            normalizedReason,

        notes:
            normalizedNotes,

        createdBy,
    };

    // --------------------------------------------------
    // Create movement
    // --------------------------------------------------

    let movement;

    if (session) {
        const result =
            await StockMovement.create(
                [movementData],
                { session }
            );

        movement = result[0];
    } else {
        movement =
            await StockMovement.create(
                movementData
            );
    }

    return movement;
};

module.exports = {
    recordStockMovement,
    MOVEMENT_TYPES,
    REFERENCE_TYPES,
};