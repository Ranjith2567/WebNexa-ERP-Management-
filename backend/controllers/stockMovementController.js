const mongoose = require("mongoose");

const StockMovement = require("../models/StockMovement");
const Stock = require("../models/Stock");
const Company = require("../models/Company");
const Branch = require("../models/Branch");
const Warehouse = require("../models/Warehouse");
const Product = require("../models/Product");

const {
    recordStockMovement,
    MOVEMENT_TYPES,
    REFERENCE_TYPES,
} = require("../services/stockMovementService");

// ======================================================
// Helper
// ======================================================

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const sendError = (res, statusCode, message) => {
    return res.status(statusCode).json({
        success: false,
        message,
    });
};

const getPagination = (query) => {
    const page = Math.max(
        Number(query.page) || 1,
        1
    );

    const limit = Math.min(
        Math.max(
            Number(query.limit) || 20,
            1
        ),
        100
    );

    return {
        page,
        limit,
        skip: (page - 1) * limit,
    };
};

// ======================================================
// CREATE STOCK MOVEMENT
// ======================================================

const createStockMovement = async (req, res) => {
    try {
        const {
            company,
            branch,
            warehouse,
            product,

            movementType,
            referenceType,

            referenceId,
            referenceNumber,

            quantityBefore,
            quantityChange,
            quantityAfter,

            unitPrice,

            reason,
            notes,
        } = req.body;

        const createdBy = req.user._id;

        // --------------------------------------------------
        // Required IDs
        // --------------------------------------------------

        if (!company) {
            return sendError(
                res,
                400,
                "Company is required"
            );
        }

        if (!branch) {
            return sendError(
                res,
                400,
                "Branch is required"
            );
        }

        if (!warehouse) {
            return sendError(
                res,
                400,
                "Warehouse is required"
            );
        }

        if (!product) {
            return sendError(
                res,
                400,
                "Product is required"
            );
        }

        // --------------------------------------------------
        // ObjectId validation
        // --------------------------------------------------

        const ids = [
            ["company", company],
            ["branch", branch],
            ["warehouse", warehouse],
            ["product", product],
        ];

        for (const [field, value] of ids) {
            if (!isValidObjectId(value)) {
                return sendError(
                    res,
                    400,
                    `Invalid ${field}`
                );
            }
        }

        if (
            referenceId &&
            !isValidObjectId(referenceId)
        ) {
            return sendError(
                res,
                400,
                "Invalid referenceId"
            );
        }

        // --------------------------------------------------
        // Movement type
        // --------------------------------------------------

        if (
            !MOVEMENT_TYPES.includes(
                movementType
            )
        ) {
            return sendError(
                res,
                400,
                `Invalid movementType. Allowed values: ${MOVEMENT_TYPES.join(", ")}`
            );
        }

        // --------------------------------------------------
        // Reference type
        // --------------------------------------------------

        if (
            !REFERENCE_TYPES.includes(
                referenceType
            )
        ) {
            return sendError(
                res,
                400,
                `Invalid referenceType. Allowed values: ${REFERENCE_TYPES.join(", ")}`
            );
        }

        // --------------------------------------------------
        // Validate company
        // --------------------------------------------------

        const companyExists =
            await Company.findOne({
                _id: company,
                isActive: true,
            });

        if (!companyExists) {
            return sendError(
                res,
                404,
                "Company not found or inactive"
            );
        }

        // --------------------------------------------------
        // Validate branch
        // --------------------------------------------------

        const branchExists =
            await Branch.findOne({
                _id: branch,
                company,
                isActive: true,
            });

        if (!branchExists) {
            return sendError(
                res,
                404,
                "Branch not found for this company or inactive"
            );
        }

        // --------------------------------------------------
        // Validate warehouse
        // --------------------------------------------------

        const warehouseExists =
            await Warehouse.findOne({
                _id: warehouse,
                company,
                branch,
                isActive: true,
            });

        if (!warehouseExists) {
            return sendError(
                res,
                404,
                "Warehouse not found for this company/branch or inactive"
            );
        }

        // --------------------------------------------------
        // Validate product
        // --------------------------------------------------

        const productExists =
            await Product.findOne({
                _id: product,
                company,
                isActive: true,
            });

        if (!productExists) {
            return sendError(
                res,
                404,
                "Product not found for this company or inactive"
            );
        }

        // --------------------------------------------------
        // Validate product branch
        // --------------------------------------------------

        if (
            productExists.branch &&
            productExists.branch.toString() !==
                branch.toString()
        ) {
            return sendError(
                res,
                400,
                "Product does not belong to this branch"
            );
        }

        // --------------------------------------------------
        // Quantity validation
        // --------------------------------------------------

        const before =
            Number(quantityBefore);

        const change =
            Number(quantityChange);

        const after =
            Number(quantityAfter);

        if (
            !Number.isFinite(before) ||
            before < 0
        ) {
            return sendError(
                res,
                400,
                "Invalid quantityBefore"
            );
        }

        if (
            !Number.isFinite(change) ||
            change === 0
        ) {
            return sendError(
                res,
                400,
                "quantityChange cannot be zero"
            );
        }

        if (
            !Number.isFinite(after) ||
            after < 0
        ) {
            return sendError(
                res,
                400,
                "Invalid quantityAfter"
            );
        }

        // --------------------------------------------------
        // Quantity consistency
        // --------------------------------------------------

        const expectedAfter =
            before + change;

        if (
            Math.abs(
                expectedAfter - after
            ) > 0.000001
        ) {
            return sendError(
                res,
                400,
                "quantityAfter must equal quantityBefore + quantityChange"
            );
        }

        // --------------------------------------------------
        // Price
        // --------------------------------------------------

        const price =
            Number(unitPrice || 0);

        if (
            !Number.isFinite(price) ||
            price < 0
        ) {
            return sendError(
                res,
                400,
                "unitPrice cannot be negative"
            );
        }

        // --------------------------------------------------
        // Check current Stock
        // --------------------------------------------------

        const stock =
            await Stock.findOne({
                company,
                branch,
                warehouse,
                product,
                isActive: true,
            });

        /*
         * IMPORTANT:
         *
         * Manual stock movement creation should not
         * silently create a fake stock ledger.
         *
         * If a stock record exists, the requested
         * quantityBefore should match it.
         */

        if (stock) {
            const stockQuantity =
                Number(stock.quantity);

            if (
                Math.abs(
                    stockQuantity - before
                ) > 0.000001
            ) {
                return sendError(
                    res,
                    409,
                    `quantityBefore does not match current stock. Current stock is ${stockQuantity}`
                );
            }
        }

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

                referenceId:
                    referenceId || null,

                referenceNumber:
                    referenceNumber || "",

                quantityBefore:
                    before,

                quantityChange:
                    change,

                quantityAfter:
                    after,

                unitPrice:
                    price,

                reason:
                    reason || "",

                notes:
                    notes || "",

                createdBy,
            });

        // --------------------------------------------------
        // Populate response
        // --------------------------------------------------

        await movement.populate([
            {
                path: "company",
                select: "name legalName",
            },
            {
                path: "branch",
                select: "name branchCode",
            },
            {
                path: "warehouse",
                select: "name code",
            },
            {
                path: "product",
                select: "name sku barcode",
            },
            {
                path: "createdBy",
                select: "name email",
            },
        ]);

        return res.status(201).json({
            success: true,
            message:
                "Stock movement recorded successfully",
            data: movement,
        });
    } catch (error) {
        console.error(
            "Create Stock Movement Error:",
            error
        );

        return sendError(
            res,
            500,
            error.message ||
                "Failed to create stock movement"
        );
    }
};

// ======================================================
// GET STOCK MOVEMENTS
// ======================================================

const getStockMovements = async (req, res) => {
    try {
        const {
            company,
            branch,
            warehouse,
            product,
            movementType,
            referenceType,
            referenceId,
            referenceNumber,
            search,
            fromDate,
            toDate,
        } = req.query;

        const {
            page,
            limit,
            skip,
        } = getPagination(req.query);

        const filter = {};

        // --------------------------------------------------
        // Filters
        // --------------------------------------------------

        if (company) {
            if (!isValidObjectId(company)) {
                return sendError(
                    res,
                    400,
                    "Invalid company"
                );
            }

            filter.company = company;
        }

        if (branch) {
            if (!isValidObjectId(branch)) {
                return sendError(
                    res,
                    400,
                    "Invalid branch"
                );
            }

            filter.branch = branch;
        }

        if (warehouse) {
            if (!isValidObjectId(warehouse)) {
                return sendError(
                    res,
                    400,
                    "Invalid warehouse"
                );
            }

            filter.warehouse = warehouse;
        }

        if (product) {
            if (!isValidObjectId(product)) {
                return sendError(
                    res,
                    400,
                    "Invalid product"
                );
            }

            filter.product = product;
        }

        if (referenceId) {
            if (!isValidObjectId(referenceId)) {
                return sendError(
                    res,
                    400,
                    "Invalid referenceId"
                );
            }

            filter.referenceId =
                referenceId;
        }

        if (movementType) {
            if (
                !MOVEMENT_TYPES.includes(
                    movementType
                )
            ) {
                return sendError(
                    res,
                    400,
                    "Invalid movementType"
                );
            }

            filter.movementType =
                movementType;
        }

        if (referenceType) {
            if (
                !REFERENCE_TYPES.includes(
                    referenceType
                )
            ) {
                return sendError(
                    res,
                    400,
                    "Invalid referenceType"
                );
            }

            filter.referenceType =
                referenceType;
        }

        if (referenceNumber) {
            filter.referenceNumber = {
                $regex:
                    referenceNumber.trim(),
                $options: "i",
            };
        }

        // --------------------------------------------------
        // Date filter
        // --------------------------------------------------

        if (fromDate || toDate) {
            filter.createdAt = {};

            if (fromDate) {
                const start =
                    new Date(fromDate);

                if (
                    Number.isNaN(
                        start.getTime()
                    )
                ) {
                    return sendError(
                        res,
                        400,
                        "Invalid fromDate"
                    );
                }

                filter.createdAt.$gte =
                    start;
            }

            if (toDate) {
                const end =
                    new Date(toDate);

                if (
                    Number.isNaN(
                        end.getTime()
                    )
                ) {
                    return sendError(
                        res,
                        400,
                        "Invalid toDate"
                    );
                }

                end.setHours(
                    23,
                    59,
                    59,
                    999
                );

                filter.createdAt.$lte =
                    end;
            }
        }

        // --------------------------------------------------
        // Search
        // --------------------------------------------------

        if (search) {
            filter.$or = [
                {
                    referenceNumber: {
                        $regex:
                            search.trim(),
                        $options: "i",
                    },
                },
                {
                    reason: {
                        $regex:
                            search.trim(),
                        $options: "i",
                    },
                },
                {
                    notes: {
                        $regex:
                            search.trim(),
                        $options: "i",
                    },
                },
            ];
        }

        // --------------------------------------------------
        // Query
        // --------------------------------------------------

        const [
            movements,
            total,
        ] = await Promise.all([
            StockMovement.find(filter)
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "branch",
                    "name branchCode"
                )
                .populate(
                    "warehouse",
                    "name code"
                )
                .populate(
                    "product",
                    "name sku barcode"
                )
                .populate(
                    "createdBy",
                    "name email"
                )
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
                .lean(),

            StockMovement.countDocuments(
                filter
            ),
        ]);

        return res.status(200).json({
            success: true,
            count: movements.length,
            total,
            page,
            limit,
            totalPages:
                Math.ceil(
                    total / limit
                ),
            data: movements,
        });
    } catch (error) {
        console.error(
            "Get Stock Movements Error:",
            error
        );

        return sendError(
            res,
            500,
            error.message ||
                "Failed to fetch stock movements"
        );
    }
};

// ======================================================
// GET STOCK MOVEMENT BY ID
// ======================================================

const getStockMovementById = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return sendError(
                res,
                400,
                "Invalid stock movement ID"
            );
        }

        const movement =
            await StockMovement.findById(id)
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "branch",
                    "name branchCode"
                )
                .populate(
                    "warehouse",
                    "name code"
                )
                .populate(
                    "product",
                    "name sku barcode"
                )
                .populate(
                    "createdBy",
                    "name email"
                );

        if (!movement) {
            return sendError(
                res,
                404,
                "Stock movement not found"
            );
        }

        return res.status(200).json({
            success: true,
            data: movement,
        });
    } catch (error) {
        console.error(
            "Get Stock Movement Error:",
            error
        );

        return sendError(
            res,
            500,
            error.message ||
                "Failed to fetch stock movement"
        );
    }
};

// ======================================================
// GET PRODUCT STOCK LEDGER
// ======================================================

const getProductStockLedger = async (
    req,
    res
) => {
    try {
        const {
            productId,
            warehouse,
            fromDate,
            toDate,
        } = req.query;

        if (!productId) {
            return sendError(
                res,
                400,
                "productId is required"
            );
        }

        if (!isValidObjectId(productId)) {
            return sendError(
                res,
                400,
                "Invalid productId"
            );
        }

        const filter = {
            product: productId,
        };

        // --------------------------------------------------
        // Warehouse
        // --------------------------------------------------

        if (warehouse) {
            if (!isValidObjectId(warehouse)) {
                return sendError(
                    res,
                    400,
                    "Invalid warehouse"
                );
            }

            filter.warehouse =
                warehouse;
        }

        // --------------------------------------------------
        // Date
        // --------------------------------------------------

        if (fromDate || toDate) {
            filter.createdAt = {};

            if (fromDate) {
                const start =
                    new Date(fromDate);

                if (
                    Number.isNaN(
                        start.getTime()
                    )
                ) {
                    return sendError(
                        res,
                        400,
                        "Invalid fromDate"
                    );
                }

                filter.createdAt.$gte =
                    start;
            }

            if (toDate) {
                const end =
                    new Date(toDate);

                if (
                    Number.isNaN(
                        end.getTime()
                    )
                ) {
                    return sendError(
                        res,
                        400,
                        "Invalid toDate"
                    );
                }

                end.setHours(
                    23,
                    59,
                    59,
                    999
                );

                filter.createdAt.$lte =
                    end;
            }
        }

        // --------------------------------------------------
        // Ledger
        // --------------------------------------------------

        const movements =
            await StockMovement.find(filter)
                .populate(
                    "warehouse",
                    "name code"
                )
                .populate(
                    "product",
                    "name sku barcode"
                )
                .populate(
                    "createdBy",
                    "name email"
                )
                .sort({
                    createdAt: 1,
                    _id: 1,
                })
                .lean();

        // --------------------------------------------------
        // Calculate ledger summary
        // --------------------------------------------------

        let totalIn = 0;
        let totalOut = 0;

        for (const movement of movements) {
            const change =
                Number(
                    movement.quantityChange
                );

            if (change > 0) {
                totalIn += change;
            } else {
                totalOut +=
                    Math.abs(change);
            }
        }

        const firstMovement =
            movements[0];

        const lastMovement =
            movements[
                movements.length - 1
            ];

        const openingQuantity =
            firstMovement
                ? Number(
                      firstMovement
                          .quantityBefore
                  )
                : 0;

        const closingQuantity =
            lastMovement
                ? Number(
                      lastMovement
                          .quantityAfter
                  )
                : 0;

        return res.status(200).json({
            success: true,

            summary: {
                movementCount:
                    movements.length,

                openingQuantity,

                totalIn,

                totalOut,

                closingQuantity,
            },

            data: movements,
        });
    } catch (error) {
        console.error(
            "Get Product Stock Ledger Error:",
            error
        );

        return sendError(
            res,
            500,
            error.message ||
                "Failed to fetch product stock ledger"
        );
    }
};

// ======================================================
// DELETE STOCK MOVEMENT
// ======================================================

const deleteStockMovement = async (
    req,
    res
) => {
    return sendError(
        res,
        405,
        "Stock movements cannot be deleted because they are permanent audit records"
    );
};

module.exports = {
    createStockMovement,
    getStockMovements,
    getStockMovementById,
    getProductStockLedger,
    deleteStockMovement,
};