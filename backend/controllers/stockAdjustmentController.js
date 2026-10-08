const mongoose = require("mongoose");

const StockAdjustment = require("../models/StockAdjustment");
const Stock = require("../models/Stock");
const Company = require("../models/Company");
const Branch = require("../models/Branch");
const Warehouse = require("../models/Warehouse");
const Product = require("../models/Product");

const {
    recordStockMovement,
} = require("../services/stockMovementService");

const {
    withTransaction,
} = require("../utils/withTransaction");

// =====================================================
// Generate Adjustment Number
// =====================================================

const generateAdjustmentNumber = async (
    session = null
) => {
    const query = StockAdjustment
        .findOne()
        .sort({ createdAt: -1 });

    if (session) {
        query.session(session);
    }

    const lastAdjustment =
        await query;

    if (!lastAdjustment) {
        return "ST-ADJ-000001";
    }

    const lastNumber = parseInt(
        lastAdjustment.adjustmentNumber.replace(
            "ST-ADJ-",
            ""
        ),
        10
    );

    if (Number.isNaN(lastNumber)) {
        throw new Error(
            "Invalid stock adjustment number format"
        );
    }

    const nextNumber =
        lastNumber + 1;

    return `ST-ADJ-${String(
        nextNumber
    ).padStart(6, "0")}`;
};

// =====================================================
// Create Stock Adjustment
// =====================================================

const createStockAdjustment = async (
    req,
    res
) => {
    try {
        const {
            company,
            branch,
            warehouse,
            product,
            adjustmentType,
            quantity,
            reason,
            notes,
        } = req.body;

        // -----------------------------
        // Required fields
        // -----------------------------

        if (
            !company ||
            !branch ||
            !warehouse ||
            !product ||
            !adjustmentType ||
            quantity === undefined ||
            !reason
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Company, branch, warehouse, product, adjustment type, quantity and reason are required",
            });
        }

        // -----------------------------
        // Validate ObjectIds
        // -----------------------------

        if (
            !mongoose.Types.ObjectId.isValid(
                company
            ) ||
            !mongoose.Types.ObjectId.isValid(
                branch
            ) ||
            !mongoose.Types.ObjectId.isValid(
                warehouse
            ) ||
            !mongoose.Types.ObjectId.isValid(
                product
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid company, branch, warehouse or product ID",
            });
        }

        // -----------------------------
        // Validate adjustment type
        // -----------------------------

        if (
            ![
                "INCREASE",
                "DECREASE",
            ].includes(adjustmentType)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Stock adjustment type must be INCREASE or DECREASE",
            });
        }

        // -----------------------------
        // Validate quantity
        // -----------------------------

        const adjustmentQuantity =
            Number(quantity);

        if (
            !Number.isFinite(
                adjustmentQuantity
            ) ||
            adjustmentQuantity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Quantity must be greater than 0",
            });
        }

        // -----------------------------
        // Company validation
        // -----------------------------

        const companyData =
            await Company.findById(
                company
            );

        if (!companyData) {
            return res.status(404).json({
                success: false,
                message:
                    "Company not found",
            });
        }

        // -----------------------------
        // Branch validation
        // -----------------------------

        const branchData =
            await Branch.findOne({
                _id: branch,
                company,
            });

        if (!branchData) {
            return res.status(404).json({
                success: false,
                message:
                    "Branch not found or does not belong to the company",
            });
        }

        // -----------------------------
        // Warehouse validation
        // -----------------------------

        const warehouseData =
            await Warehouse.findOne({
                _id: warehouse,
                company,
                branch,
                isActive: true,
            });

        if (!warehouseData) {
            return res.status(404).json({
                success: false,
                message:
                    "Warehouse not found, inactive, or does not belong to the branch",
            });
        }

        // -----------------------------
        // Product validation
        // -----------------------------

        const productData =
            await Product.findOne({
                _id: product,
                company,
                branch,
                isActive: true,
            });

        if (!productData) {
            return res.status(404).json({
                success: false,
                message:
                    "Product not found, inactive, or does not belong to the branch",
            });
        }

        // =================================================
        // TRANSACTION
        // =================================================

        const adjustment =
            await withTransaction(
                async (session) => {
                    // -----------------------------
                    // Find fresh Stock INSIDE transaction
                    // -----------------------------

                    const stock =
                        await Stock.findOne({
                            company,
                            branch,
                            warehouse,
                            product,
                        }).session(
                            session
                        );

                    if (!stock) {
                        throw new Error(
                            "Stock record not found for this warehouse and product"
                        );
                    }

                    if (!stock.isActive) {
                        throw new Error(
                            "Stock record is inactive"
                        );
                    }

                    // -----------------------------
                    // Calculate quantities
                    // -----------------------------

                    const previousQuantity =
                        Number(
                            stock.quantity ||
                                0
                        );

                    let newQuantity;

                    if (
                        adjustmentType ===
                        "INCREASE"
                    ) {
                        newQuantity =
                            previousQuantity +
                            adjustmentQuantity;
                    } else {
                        newQuantity =
                            previousQuantity -
                            adjustmentQuantity;

                        // Cannot go below zero
                        if (
                            newQuantity <
                            0
                        ) {
                            throw new Error(
                                `Insufficient stock. Available quantity is ${previousQuantity}`
                            );
                        }
                    }

                    // -----------------------------
                    // Calculate stock movement
                    // -----------------------------

                    const quantityChange =
                        adjustmentType ===
                        "INCREASE"
                            ? adjustmentQuantity
                            : -adjustmentQuantity;

                    // -----------------------------
                    // Generate adjustment number
                    // -----------------------------

                    const adjustmentNumber =
                        await generateAdjustmentNumber(
                            session
                        );

                    // -----------------------------
                    // Create adjustment
                    // -----------------------------

                    const createdAdjustment =
                        await StockAdjustment.create(
                            [
                                {
                                    company,
                                    branch,
                                    warehouse,
                                    product,
                                    adjustmentNumber,
                                    adjustmentType,
                                    quantity:
                                        adjustmentQuantity,
                                    previousQuantity,
                                    newQuantity,
                                    reason,
                                    notes:
                                        notes ||
                                        "",
                                    adjustmentDate:
                                        new Date(),
                                    createdBy:
                                        req.user
                                            ._id,
                                },
                            ],
                            {
                                session,
                            }
                        ).then(
                            (
                                result
                            ) =>
                                result[0]
                        );

                    // -----------------------------
                    // Update Stock
                    // -----------------------------

                    stock.quantity =
                        newQuantity;

                    stock.lastStockUpdate =
                        new Date();

                    // Reserved quantity
                    // cannot exceed actual stock
                    if (
                        Number(
                            stock.reservedQuantity ||
                                0
                        ) >
                        newQuantity
                    ) {
                        stock.reservedQuantity =
                            newQuantity;
                    }

                    await stock.save({
                        session,
                    });

                    // -----------------------------
                    // Stock Movement Type
                    // -----------------------------

                    const movementType =
                        adjustmentType ===
                        "INCREASE"
                            ? "STOCK_ADJUSTMENT_IN"
                            : "STOCK_ADJUSTMENT_OUT";

                    // -----------------------------
                    // Record Stock Movement
                    // -----------------------------

                    await recordStockMovement({
                        company,
                        branch,
                        warehouse,
                        product,

                        movementType,

                        referenceType:
                            "STOCK_ADJUSTMENT",

                        referenceId:
                            createdAdjustment._id,

                        referenceNumber:
                            adjustmentNumber,

                        quantityBefore:
                            previousQuantity,

                        quantityChange,

                        quantityAfter:
                            newQuantity,

                        unitPrice:
                            Number(
                                productData.purchasePrice ||
                                    0
                            ),

                        reason,

                        notes:
                            notes ||
                            `Stock adjusted through ${adjustmentNumber}`,

                        createdBy:
                            req.user._id,

                        session,
                    });

                    return createdAdjustment;
                }
            );

        // =================================================
        // Transaction completed successfully
        // =================================================

        // -----------------------------
        // Populate response
        // -----------------------------

        const populatedAdjustment =
            await StockAdjustment.findById(
                adjustment._id
            )
                .populate(
                    "company",
                    "name"
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
                    "name email role"
                );

        return res.status(201).json({
            success: true,
            message:
                "Stock adjustment created successfully",
            data:
                populatedAdjustment,
        });
    } catch (error) {
        console.error(
            "Create Stock Adjustment Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to create stock adjustment",
        });
    }
};

// =====================================================
// Get All Stock Adjustments
// =====================================================

const getStockAdjustments = async (
    req,
    res
) => {
    try {
        const {
            company,
            branch,
            warehouse,
            product,
            adjustmentType,
            search,
            page = 1,
            limit = 10,
        } = req.query;

        const filter = {};

        // -----------------------------
        // Validate filters
        // -----------------------------

        if (company) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    company
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid company ID",
                });
            }

            filter.company =
                company;
        }

        if (branch) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    branch
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid branch ID",
                });
            }

            filter.branch =
                branch;
        }

        if (warehouse) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    warehouse
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid warehouse ID",
                });
            }

            filter.warehouse =
                warehouse;
        }

        if (product) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    product
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid product ID",
                });
            }

            filter.product =
                product;
        }

        if (adjustmentType) {
            if (
                ![
                    "INCREASE",
                    "DECREASE",
                ].includes(
                    adjustmentType
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid adjustment type",
                });
            }

            filter.adjustmentType =
                adjustmentType;
        }

        // -----------------------------
        // Pagination
        // -----------------------------

        const currentPage =
            Math.max(
                parseInt(page, 10) || 1,
                1
            );

        const perPage =
            Math.min(
                Math.max(
                    parseInt(
                        limit,
                        10
                    ) || 10,
                    1
                ),
                100
            );

        // -----------------------------
        // Search
        // -----------------------------

        if (
            search &&
            search.trim()
        ) {
            const searchRegex =
                new RegExp(
                    search.trim(),
                    "i"
                );

            const [
                matchingProducts,
                matchingWarehouses,
            ] =
                await Promise.all([
                    Product.find({
                        $or: [
                            {
                                name:
                                    searchRegex,
                            },
                            {
                                sku:
                                    searchRegex,
                            },
                            {
                                barcode:
                                    searchRegex,
                            },
                        ],
                    }).select(
                        "_id"
                    ),

                    Warehouse.find({
                        $or: [
                            {
                                name:
                                    searchRegex,
                            },
                            {
                                code:
                                    searchRegex,
                            },
                        ],
                    }).select(
                        "_id"
                    ),
                ]);

            filter.$or = [
                {
                    adjustmentNumber:
                        searchRegex,
                },
                {
                    reason:
                        searchRegex,
                },
                {
                    notes:
                        searchRegex,
                },
                {
                    product: {
                        $in:
                            matchingProducts.map(
                                (
                                    item
                                ) =>
                                    item._id
                            ),
                    },
                },
                {
                    warehouse: {
                        $in:
                            matchingWarehouses.map(
                                (
                                    item
                                ) =>
                                    item._id
                            ),
                    },
                },
            ];
        }

        // -----------------------------
        // Query
        // -----------------------------

        const skip =
            (currentPage - 1) *
            perPage;

        const [
            adjustments,
            total,
        ] =
            await Promise.all([
                StockAdjustment.find(
                    filter
                )
                    .populate(
                        "company",
                        "name"
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
                        "name email role"
                    )
                    .sort({
                        adjustmentDate:
                            -1,
                    })
                    .skip(skip)
                    .limit(perPage),

                StockAdjustment.countDocuments(
                    filter
                ),
            ]);

        return res.status(200).json({
            success: true,
            count:
                adjustments.length,
            pagination: {
                total,
                page:
                    currentPage,
                limit:
                    perPage,
                totalPages:
                    Math.ceil(
                        total /
                            perPage
                    ),
            },
            data:
                adjustments,
        });
    } catch (error) {
        console.error(
            "Get Stock Adjustments Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch stock adjustments",
        });
    }
};

// =====================================================
// Get Stock Adjustment By ID
// =====================================================

const getStockAdjustmentById =
    async (req, res) => {
        try {
            const { id } =
                req.params;

            if (
                !mongoose.Types.ObjectId.isValid(
                    id
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid adjustment ID",
                });
            }

            const adjustment =
                await StockAdjustment.findById(
                    id
                )
                    .populate(
                        "company",
                        "name"
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
                        "name email role"
                    );

            if (!adjustment) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Stock adjustment not found",
                });
            }

            return res.status(200).json({
                success: true,
                data:
                    adjustment,
            });
        } catch (error) {
            console.error(
                "Get Stock Adjustment By ID Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Failed to fetch stock adjustment",
            });
        }
    };

// =====================================================
// Delete Stock Adjustment
// =====================================================

const deleteStockAdjustment =
    async (req, res) => {
        try {
            const { id } =
                req.params;

            if (
                !mongoose.Types.ObjectId.isValid(
                    id
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid adjustment ID",
                });
            }

            const adjustment =
                await StockAdjustment.findById(
                    id
                );

            if (!adjustment) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Stock adjustment not found",
                });
            }

            return res.status(400).json({
                success: false,
                message:
                    "Stock adjustments are permanent inventory records and cannot be deleted",
            });
        } catch (error) {
            console.error(
                "Delete Stock Adjustment Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Failed to delete stock adjustment",
            });
        }
    };

// =====================================================
// Exports
// =====================================================

module.exports = {
    createStockAdjustment,
    getStockAdjustments,
    getStockAdjustmentById,
    deleteStockAdjustment,
};