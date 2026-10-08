const mongoose = require("mongoose");

const Stock = require("../models/Stock");
const Product = require("../models/Product");
const Warehouse = require("../models/Warehouse");

const {
    recordStockMovement,
} = require("./stockMovementService");

const {
    createStockNotification,
} = require("./notificationService");

// ======================================================
// Helpers
// ======================================================

const validateObjectId = (
    value,
    fieldName
) => {
    if (
        !value ||
        !mongoose.Types.ObjectId.isValid(value)
    ) {
        throw new Error(
            `Invalid ${fieldName}`
        );
    }
};

const roundQuantity = (value) => {
    return (
        Math.round(
            (Number(value) +
                Number.EPSILON) *
                1000000
        ) / 1000000
    );
};

// ======================================================
// CREATE STOCK NOTIFICATION
// ======================================================

const notifyStockStatus = async ({
    stock,
    company,
    branch,
    warehouse,
    product,
    recipient,
    createdBy,
    session = null,
}) => {
    try {
        if (
            !stock ||
            !recipient
        ) {
            return null;
        }

        if (
            !product ||
            !warehouse
        ) {
            return null;
        }

        const notification =
            await createStockNotification({
                company,
                branch,
                recipient,
                stock,
                product,
                warehouse,
                createdBy,
                session,
            });

        return notification;
    } catch (error) {
        console.error(
            "Stock Notification Error:",
            error.message
        );

        return null;
    }
};

// ======================================================
// GET STOCK
// ======================================================

const getStock = async ({
    company,
    branch,
    warehouse,
    product,
    session = null,
}) => {
    validateObjectId(
        company,
        "company"
    );

    validateObjectId(
        branch,
        "branch"
    );

    validateObjectId(
        warehouse,
        "warehouse"
    );

    validateObjectId(
        product,
        "product"
    );

    const query =
        Stock.findOne({
            company,
            branch,
            warehouse,
            product,
            isActive: true,
        });

    if (session) {
        query.session(session);
    }

    return await query;
};

// ======================================================
// CREATE STOCK IF NOT EXISTS
// ======================================================

const createStockIfNotExists =
    async ({
        company,
        branch,
        warehouse,
        product,
        createdBy,
        initialQuantity = 0,
        session = null,
    }) => {
        validateObjectId(
            company,
            "company"
        );

        validateObjectId(
            branch,
            "branch"
        );

        validateObjectId(
            warehouse,
            "warehouse"
        );

        validateObjectId(
            product,
            "product"
        );

        validateObjectId(
            createdBy,
            "createdBy"
        );

        const quantity =
            Number(initialQuantity);

        if (
            !Number.isFinite(
                quantity
            ) ||
            quantity < 0
        ) {
            throw new Error(
                "Initial stock quantity must be a valid non-negative number"
            );
        }

        let stock =
            await getStock({
                company,
                branch,
                warehouse,
                product,
                session,
            });

        if (stock) {
            return stock;
        }

        const productDataQuery =
            Product.findOne({
                _id: product,
                company,
                isActive: true,
            });

        if (session) {
            productDataQuery.session(
                session
            );
        }

        const productData =
            await productDataQuery;

        if (!productData) {
            throw new Error(
                "Product not found for this company"
            );
        }

        const stockData = {
            company,
            branch,
            warehouse,
            product,

            quantity,

            reservedQuantity: 0,

            minimumStock:
                productData.minimumStock ||
                0,

            maximumStock:
                productData.maximumStock ||
                0,

            lastStockUpdate:
                new Date(),

            isActive: true,

            createdBy,
        };

        if (session) {
            const result =
                await Stock.create(
                    [stockData],
                    { session }
                );

            stock = result[0];
        } else {
            stock =
                await Stock.create(
                    stockData
                );
        }

        return stock;
    };

// ======================================================
// INCREASE STOCK
// ======================================================

const increaseStock = async ({
    company,
    branch,
    warehouse,
    product,

    quantity,

    movementType = "PURCHASE",
    referenceType = "GOODS_RECEIPT",

    referenceId = null,
    referenceNumber = "",

    unitPrice = 0,

    reason = "",
    notes = "",

    createdBy,

    notificationRecipient = null,

    session = null,
}) => {
    const increaseQuantity =
        Number(quantity);

    if (
        !Number.isFinite(
            increaseQuantity
        ) ||
        increaseQuantity <= 0
    ) {
        throw new Error(
            "Increase quantity must be greater than zero"
        );
    }

    validateObjectId(
        company,
        "company"
    );

    validateObjectId(
        branch,
        "branch"
    );

    validateObjectId(
        warehouse,
        "warehouse"
    );

    validateObjectId(
        product,
        "product"
    );

    validateObjectId(
        createdBy,
        "createdBy"
    );

    // --------------------------------------------------
    // Get stock
    // --------------------------------------------------

    let stock =
        await getStock({
            company,
            branch,
            warehouse,
            product,
            session,
        });

    // --------------------------------------------------
    // Create stock if missing
    // --------------------------------------------------

    if (!stock) {
        stock =
            await createStockIfNotExists({
                company,
                branch,
                warehouse,
                product,
                createdBy,
                initialQuantity: 0,
                session,
            });
    }

    // --------------------------------------------------
    // Current quantity
    // --------------------------------------------------

    const quantityBefore =
        Number(stock.quantity) || 0;

    const quantityAfter =
        roundQuantity(
            quantityBefore +
                increaseQuantity
        );

    // --------------------------------------------------
    // Update stock
    // --------------------------------------------------

    stock.quantity =
        quantityAfter;

    stock.lastStockUpdate =
        new Date();

    await stock.save(
        session
            ? { session }
            : undefined
    );

    // --------------------------------------------------
    // Record movement
    // --------------------------------------------------

    const movement =
        await recordStockMovement({
            company,
            branch,
            warehouse,
            product,

            movementType,
            referenceType,

            referenceId,
            referenceNumber,

            quantityBefore,

            quantityChange:
                increaseQuantity,

            quantityAfter,

            unitPrice,

            reason,
            notes,

            createdBy,

            session,
        });

    // --------------------------------------------------
    // Stock notification
    // --------------------------------------------------

    if (notificationRecipient) {
        const productQuery =
            Product.findOne({
                _id: product,
                company,
                isActive: true,
            });

        const warehouseQuery =
            Warehouse.findOne({
                _id: warehouse,
                company,
                branch,
                isActive: true,
            });

        if (session) {
            productQuery.session(
                session
            );

            warehouseQuery.session(
                session
            );
        }

        const [
            productDocument,
            warehouseDocument,
        ] = await Promise.all([
            productQuery,
            warehouseQuery,
        ]);

        await notifyStockStatus({
            stock,
            company,
            branch,
            warehouse:
                warehouseDocument,
            product:
                productDocument,
            recipient:
                notificationRecipient,
            createdBy,
            session,
        });
    }

    return {
        stock,
        movement,
    };
};

// ======================================================
// DECREASE STOCK
// ======================================================

const decreaseStock = async ({
    company,
    branch,
    warehouse,
    product,

    quantity,

    movementType = "SALE",
    referenceType = "SALES_INVOICE",

    referenceId = null,
    referenceNumber = "",

    unitPrice = 0,

    reason = "",
    notes = "",

    createdBy,

    notificationRecipient = null,

    session = null,
}) => {
    const decreaseQuantity =
        Number(quantity);

    if (
        !Number.isFinite(
            decreaseQuantity
        ) ||
        decreaseQuantity <= 0
    ) {
        throw new Error(
            "Decrease quantity must be greater than zero"
        );
    }

    validateObjectId(
        company,
        "company"
    );

    validateObjectId(
        branch,
        "branch"
    );

    validateObjectId(
        warehouse,
        "warehouse"
    );

    validateObjectId(
        product,
        "product"
    );

    validateObjectId(
        createdBy,
        "createdBy"
    );

    // ==================================================
    // DEBUG INPUT
    // ==================================================

    console.log(
        "\n========== DECREASE STOCK =========="
    );

    console.log(
        "Company:",
        company.toString()
    );

    console.log(
        "Branch:",
        branch.toString()
    );

    console.log(
        "Warehouse:",
        warehouse.toString()
    );

    console.log(
        "Product:",
        product.toString()
    );

    console.log(
        "Requested:",
        decreaseQuantity
    );

    console.log(
        "Transaction Session:",
        session
            ? "YES"
            : "NO"
    );

    // ==================================================
    // GET CURRENT STOCK
    // ==================================================

    const stock =
        await getStock({
            company,
            branch,
            warehouse,
            product,
            session,
        });

    if (!stock) {
        console.log(
            "Stock record NOT FOUND"
        );

        throw new Error(
            "Stock record not found"
        );
    }

    const stockId =
        stock._id.toString();

    const quantityBefore =
        Number(stock.quantity) || 0;

    const reservedQuantity =
        Number(
            stock.reservedQuantity || 0
        );

    const availableQuantity =
        roundQuantity(
            quantityBefore -
                reservedQuantity
        );

    console.log(
        "Stock ID:",
        stockId
    );

    console.log(
        "Quantity Before:",
        quantityBefore
    );

    console.log(
        "Reserved Quantity:",
        reservedQuantity
    );

    console.log(
        "Available Quantity:",
        availableQuantity
    );

    // ==================================================
    // AVAILABLE STOCK CHECK
    // ==================================================

    if (
        decreaseQuantity >
        availableQuantity
    ) {
        console.log(
            "❌ INSUFFICIENT STOCK"
        );

        console.log(
            "====================================\n"
        );

        throw new Error(
            `Insufficient available stock. Available: ${availableQuantity}, Requested: ${decreaseQuantity}`
        );
    }

    // ==================================================
    // NEW QUANTITY
    // ==================================================

    const quantityAfter =
        roundQuantity(
            quantityBefore -
                decreaseQuantity
        );

    if (quantityAfter < 0) {
        throw new Error(
            "Stock quantity cannot become negative"
        );
    }

    // ==================================================
    // UPDATE STOCK
    // ==================================================

    stock.quantity =
        quantityAfter;

    stock.lastStockUpdate =
        new Date();

    await stock.save(
        session
            ? { session }
            : undefined
    );

    // ==================================================
    // RECORD MOVEMENT
    // ==================================================

    const movement =
        await recordStockMovement({
            company,
            branch,
            warehouse,
            product,

            movementType,
            referenceType,

            referenceId,
            referenceNumber,

            quantityBefore,

            quantityChange:
                -decreaseQuantity,

            quantityAfter,

            unitPrice,

            reason,
            notes,

            createdBy,

            session,
        });

    // ==================================================
    // STOCK NOTIFICATION
    // ==================================================

    if (notificationRecipient) {
        const productQuery =
            Product.findOne({
                _id: product,
                company,
                isActive: true,
            });

        const warehouseQuery =
            Warehouse.findOne({
                _id: warehouse,
                company,
                branch,
                isActive: true,
            });

        if (session) {
            productQuery.session(
                session
            );

            warehouseQuery.session(
                session
            );
        }

        const [
            productDocument,
            warehouseDocument,
        ] = await Promise.all([
            productQuery,
            warehouseQuery,
        ]);

        await notifyStockStatus({
            stock,
            company,
            branch,
            warehouse:
                warehouseDocument,
            product:
                productDocument,
            recipient:
                notificationRecipient,
            createdBy,
            session,
        });
    }

    console.log(
        "Stock deduction successful"
    );

    console.log(
        "Quantity After:",
        quantityAfter
    );

    console.log(
        "====================================\n"
    );

    return {
        stock,
        movement,
    };
};

// ======================================================
// RESERVE STOCK
// ======================================================

const reserveStock = async ({
    company,
    branch,
    warehouse,
    product,
    quantity,

    notificationRecipient = null,
    createdBy = null,

    session = null,
}) => {
    const reserveQuantity =
        Number(quantity);

    if (
        !Number.isFinite(
            reserveQuantity
        ) ||
        reserveQuantity <= 0
    ) {
        throw new Error(
            "Reserve quantity must be greater than zero"
        );
    }

    validateObjectId(
        company,
        "company"
    );

    validateObjectId(
        branch,
        "branch"
    );

    validateObjectId(
        warehouse,
        "warehouse"
    );

    validateObjectId(
        product,
        "product"
    );

    const stock =
        await getStock({
            company,
            branch,
            warehouse,
            product,
            session,
        });

    if (!stock) {
        throw new Error(
            "Stock record not found"
        );
    }

    const availableQuantity =
        Number(stock.quantity) -
        Number(
            stock.reservedQuantity ||
                0
        );

    if (
        reserveQuantity >
        availableQuantity
    ) {
        throw new Error(
            `Insufficient available stock. Available: ${availableQuantity}`
        );
    }

    stock.reservedQuantity =
        roundQuantity(
            Number(
                stock.reservedQuantity ||
                    0
            ) + reserveQuantity
        );

    stock.lastStockUpdate =
        new Date();

    await stock.save(
        session
            ? { session }
            : undefined
    );

    // --------------------------------------------------
    // Stock notification
    // --------------------------------------------------

    if (
        notificationRecipient &&
        createdBy
    ) {
        const productQuery =
            Product.findOne({
                _id: product,
                company,
                isActive: true,
            });

        const warehouseQuery =
            Warehouse.findOne({
                _id: warehouse,
                company,
                branch,
                isActive: true,
            });

        if (session) {
            productQuery.session(
                session
            );

            warehouseQuery.session(
                session
            );
        }

        const [
            productDocument,
            warehouseDocument,
        ] = await Promise.all([
            productQuery,
            warehouseQuery,
        ]);

        await notifyStockStatus({
            stock,
            company,
            branch,
            warehouse:
                warehouseDocument,
            product:
                productDocument,
            recipient:
                notificationRecipient,
            createdBy,
            session,
        });
    }

    return stock;
};

// ======================================================
// RELEASE RESERVED STOCK
// ======================================================

const releaseStock = async ({
    company,
    branch,
    warehouse,
    product,
    quantity,

    notificationRecipient = null,
    createdBy = null,

    session = null,
}) => {
    const releaseQuantity =
        Number(quantity);

    if (
        !Number.isFinite(
            releaseQuantity
        ) ||
        releaseQuantity <= 0
    ) {
        throw new Error(
            "Release quantity must be greater than zero"
        );
    }

    validateObjectId(
        company,
        "company"
    );

    validateObjectId(
        branch,
        "branch"
    );

    validateObjectId(
        warehouse,
        "warehouse"
    );

    validateObjectId(
        product,
        "product"
    );

    const stock =
        await getStock({
            company,
            branch,
            warehouse,
            product,
            session,
        });

    if (!stock) {
        throw new Error(
            "Stock record not found"
        );
    }

    const reservedQuantity =
        Number(
            stock.reservedQuantity ||
                0
        );

    if (
        releaseQuantity >
        reservedQuantity
    ) {
        throw new Error(
            `Cannot release more than reserved stock. Reserved: ${reservedQuantity}`
        );
    }

    stock.reservedQuantity =
        roundQuantity(
            reservedQuantity -
                releaseQuantity
        );

    stock.lastStockUpdate =
        new Date();

    await stock.save(
        session
            ? { session }
            : undefined
    );

    // --------------------------------------------------
    // Stock notification
    // --------------------------------------------------

    if (
        notificationRecipient &&
        createdBy
    ) {
        const productQuery =
            Product.findOne({
                _id: product,
                company,
                isActive: true,
            });

        const warehouseQuery =
            Warehouse.findOne({
                _id: warehouse,
                company,
                branch,
                isActive: true,
            });

        if (session) {
            productQuery.session(
                session
            );

            warehouseQuery.session(
                session
            );
        }

        const [
            productDocument,
            warehouseDocument,
        ] = await Promise.all([
            productQuery,
            warehouseQuery,
        ]);

        await notifyStockStatus({
            stock,
            company,
            branch,
            warehouse:
                warehouseDocument,
            product:
                productDocument,
            recipient:
                notificationRecipient,
            createdBy,
            session,
        });
    }

    return stock;
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    getStock,
    createStockIfNotExists,

    increaseStock,
    decreaseStock,

    reserveStock,
    releaseStock,
};