const mongoose = require("mongoose");

const ReorderLevel = require("../models/ReorderLevel");
const Company = require("../models/Company");
const Branch = require("../models/Branch");
const Warehouse = require("../models/Warehouse");
const Product = require("../models/Product");
const Stock = require("../models/Stock");

// =====================================================
// CREATE REORDER LEVEL
// =====================================================
const createReorderLevel = async (req, res) => {
    try {
        const {
            company,
            branch,
            warehouse,
            product,
            reorderLevel,
            reorderQuantity,
            maximumStock,
            autoReorder,
        } = req.body;

        // -------------------------------
        // Required Fields
        // -------------------------------
        if (
            !company ||
            !branch ||
            !warehouse ||
            !product ||
            reorderLevel === undefined ||
            reorderQuantity === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Company, branch, warehouse, product, reorder level and reorder quantity are required",
            });
        }

        // -------------------------------
        // ObjectId Validation
        // -------------------------------
        if (
            !mongoose.Types.ObjectId.isValid(company) ||
            !mongoose.Types.ObjectId.isValid(branch) ||
            !mongoose.Types.ObjectId.isValid(warehouse) ||
            !mongoose.Types.ObjectId.isValid(product)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid company, branch, warehouse or product ID",
            });
        }

        // -------------------------------
        // Number Validation
        // -------------------------------
        const finalReorderLevel =
            Number(reorderLevel);

        const finalReorderQuantity =
            Number(reorderQuantity);

        const finalMaximumStock =
            maximumStock !== undefined &&
            maximumStock !== null
                ? Number(maximumStock)
                : 0;

        if (
            !Number.isFinite(finalReorderLevel) ||
            finalReorderLevel < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Reorder level must be 0 or greater",
            });
        }

        if (
            !Number.isFinite(finalReorderQuantity) ||
            finalReorderQuantity < 1
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Reorder quantity must be at least 1",
            });
        }

        if (
            !Number.isFinite(finalMaximumStock) ||
            finalMaximumStock < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Maximum stock must be 0 or greater",
            });
        }

        // -------------------------------
        // Maximum Stock Validation
        // -------------------------------
        if (
            finalMaximumStock > 0 &&
            finalMaximumStock < finalReorderLevel
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Maximum stock cannot be lower than reorder level",
            });
        }

        // -------------------------------
        // Auto Reorder Validation
        // -------------------------------
        if (
            autoReorder !== undefined &&
            typeof autoReorder !== "boolean"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "autoReorder must be true or false",
            });
        }

        // -------------------------------
        // Company Validation
        // -------------------------------
        const companyExists =
            await Company.findById(company);

        if (!companyExists) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        // -------------------------------
        // Branch Validation
        // -------------------------------
        const branchExists =
            await Branch.findOne({
                _id: branch,
                company,
            });

        if (!branchExists) {
            return res.status(404).json({
                success: false,
                message:
                    "Branch not found or does not belong to the selected company",
            });
        }

        // -------------------------------
        // Warehouse Validation
        // -------------------------------
        const warehouseExists =
            await Warehouse.findOne({
                _id: warehouse,
                company,
                branch,
                isActive: true,
            });

        if (!warehouseExists) {
            return res.status(404).json({
                success: false,
                message:
                    "Warehouse not found or does not belong to the selected company and branch",
            });
        }

        // -------------------------------
        // Product Validation
        // -------------------------------
        const productExists =
            await Product.findOne({
                _id: product,
                company,
                branch,
                isActive: true,
            });

        if (!productExists) {
            return res.status(404).json({
                success: false,
                message:
                    "Product not found or does not belong to the selected company and branch",
            });
        }

        // -------------------------------
        // Stock Validation
        // -------------------------------
        const stockExists =
            await Stock.findOne({
                company,
                branch,
                warehouse,
                product,
                isActive: true,
            });

        if (!stockExists) {
            return res.status(404).json({
                success: false,
                message:
                    "Stock record not found for this warehouse and product",
            });
        }

        // -------------------------------
        // Duplicate Check
        // -------------------------------
        const existingReorderLevel =
            await ReorderLevel.findOne({
                company,
                warehouse,
                product,
            });

        if (existingReorderLevel) {
            return res.status(409).json({
                success: false,
                message:
                    "Reorder configuration already exists for this product in this warehouse",
            });
        }

        // -------------------------------
        // Create Reorder Level
        // -------------------------------
        const reorderConfig =
            await ReorderLevel.create({
                company,
                branch,
                warehouse,
                product,
                reorderLevel:
                    finalReorderLevel,
                reorderQuantity:
                    finalReorderQuantity,
                maximumStock:
                    finalMaximumStock,
                autoReorder:
                    autoReorder !== undefined
                        ? autoReorder
                        : false,
                isActive: true,
                createdBy: req.user._id,
            });

        // -------------------------------
        // Populate
        // -------------------------------
        await reorderConfig.populate([
            {
                path: "company",
                select: "name email",
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
                select:
                    "name sku barcode sellingPrice purchasePrice minimumStock maximumStock",
            },
            {
                path: "createdBy",
                select: "name email role",
            },
        ]);

        return res.status(201).json({
            success: true,
            message:
                "Reorder configuration created successfully",
            data: reorderConfig,
        });
    } catch (error) {
        console.error(
            "Create Reorder Level Error:",
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Reorder configuration already exists for this warehouse and product",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to create reorder configuration",
        });
    }
};

// =====================================================
// GET ALL REORDER LEVELS
// =====================================================
const getReorderLevels = async (req, res) => {
    try {
        const {
            company,
            branch,
            warehouse,
            product,
            isActive,
            autoReorder,
            search,
            page = 1,
            limit = 10,
        } = req.query;

        const filter = {};

        // -------------------------------
        // ObjectId Filters
        // -------------------------------
        if (company) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    company
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid company ID",
                });
            }

            filter.company = company;
        }

        if (branch) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    branch
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid branch ID",
                });
            }

            filter.branch = branch;
        }

        if (warehouse) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    warehouse
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid warehouse ID",
                });
            }

            filter.warehouse = warehouse;
        }

        if (product) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    product
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid product ID",
                });
            }

            filter.product = product;
        }

        // -------------------------------
        // Boolean Filters
        // -------------------------------
        if (isActive !== undefined) {
            if (
                isActive !== "true" &&
                isActive !== "false"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "isActive must be true or false",
                });
            }

            filter.isActive =
                isActive === "true";
        }

        if (autoReorder !== undefined) {
            if (
                autoReorder !== "true" &&
                autoReorder !== "false"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "autoReorder must be true or false",
                });
            }

            filter.autoReorder =
                autoReorder === "true";
        }

        // -------------------------------
        // Search
        // -------------------------------
        if (search && search.trim()) {
            const escapedSearch =
                search
                    .trim()
                    .replace(
                        /[.*+?^${}()|[\]\\]/g,
                        "\\$&"
                    );

            const regex =
                new RegExp(
                    escapedSearch,
                    "i"
                );

            const productFilter = {
                $or: [
                    { name: regex },
                    { sku: regex },
                    { barcode: regex },
                ],
            };

            if (company) {
                productFilter.company =
                    company;
            }

            const warehouseFilter = {
                $or: [
                    { name: regex },
                    { code: regex },
                ],
            };

            if (company) {
                warehouseFilter.company =
                    company;
            }

            const [
                matchingProducts,
                matchingWarehouses,
            ] = await Promise.all([
                Product.find(
                    productFilter
                ).select("_id"),

                Warehouse.find(
                    warehouseFilter
                ).select("_id"),
            ]);

            const productIds =
                matchingProducts.map(
                    (item) => item._id
                );

            const warehouseIds =
                matchingWarehouses.map(
                    (item) => item._id
                );

            filter.$or = [
                {
                    product: {
                        $in: productIds,
                    },
                },
                {
                    warehouse: {
                        $in: warehouseIds,
                    },
                },
            ];
        }

        // -------------------------------
        // Pagination
        // -------------------------------
        const pageNumber = Math.max(
            parseInt(page, 10) || 1,
            1
        );

        const limitNumber = Math.min(
            Math.max(
                parseInt(limit, 10) || 10,
                1
            ),
            100
        );

        const skip =
            (pageNumber - 1) *
            limitNumber;

        // -------------------------------
        // Query
        // -------------------------------
        const [
            reorderLevels,
            total,
        ] = await Promise.all([
            ReorderLevel.find(filter)
                .populate(
                    "company",
                    "name email"
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
                    "name sku barcode sellingPrice purchasePrice minimumStock maximumStock"
                )
                .populate(
                    "createdBy",
                    "name email role"
                )
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limitNumber),

            ReorderLevel.countDocuments(
                filter
            ),
        ]);

        return res.status(200).json({
            success: true,
            count: reorderLevels.length,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                pages:
                    Math.ceil(
                        total /
                        limitNumber
                    ),
            },
            data: reorderLevels,
        });
    } catch (error) {
        console.error(
            "Get Reorder Levels Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch reorder configurations",
        });
    }
};

// =====================================================
// GET LOW STOCK ALERTS
// =====================================================
const getLowStockAlerts = async (
    req,
    res
) => {
    try {
        const {
            company,
            branch,
            warehouse,
            page = 1,
            limit = 20,
        } = req.query;

        const filter = {
            isActive: true,
        };

        // -------------------------------
        // Company Filter
        // -------------------------------
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

            filter.company = company;
        }

        // -------------------------------
        // Branch Filter
        // -------------------------------
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

            filter.branch = branch;
        }

        // -------------------------------
        // Warehouse Filter
        // -------------------------------
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

            filter.warehouse = warehouse;
        }

        // -------------------------------
        // Pagination
        // -------------------------------
        const pageNumber = Math.max(
            parseInt(page, 10) || 1,
            1
        );

        const limitNumber = Math.min(
            Math.max(
                parseInt(limit, 10) || 20,
                1
            ),
            100
        );

        const skip =
            (pageNumber - 1) *
            limitNumber;

        // -------------------------------
        // Get Reorder Configurations
        // -------------------------------
        const reorderLevels =
            await ReorderLevel.find(filter)
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
                    "name sku barcode sellingPrice purchasePrice minimumStock maximumStock"
                )
                .lean();

        // -------------------------------
        // Get Matching Stock Records
        // -------------------------------
        const stockConditions =
            reorderLevels
                .map((item) => {
                    if (
                        !item.warehouse ||
                        !item.product
                    ) {
                        return null;
                    }

                    return {
                        warehouse:
                            item.warehouse._id,

                        product:
                            item.product._id,

                        company:
                            item.company?._id ||
                            item.company,

                        branch:
                            item.branch?._id ||
                            item.branch,
                    };
                })
                .filter(Boolean);

        let stocks = [];

        if (
            stockConditions.length > 0
        ) {
            stocks =
                await Stock.find({
                    $or: stockConditions,
                    isActive: true,
                }).lean();
        }

        // -------------------------------
        // Create Stock Map
        // -------------------------------
        const stockMap = new Map();

        stocks.forEach((stock) => {
            const key =
                `${stock.warehouse}_${stock.product}`;

            stockMap.set(
                key,
                stock
            );
        });

        // -------------------------------
        // Build Alerts
        // -------------------------------
        const alerts = [];

        reorderLevels.forEach(
            (reorder) => {
                if (
                    !reorder.warehouse ||
                    !reorder.product
                ) {
                    return;
                }

                const key =
                    `${reorder.warehouse._id}_${reorder.product._id}`;

                const stock =
                    stockMap.get(key);

                if (!stock) {
                    return;
                }

                // -------------------------------
                // Available Stock
                // -------------------------------
                const quantity =
                    Number(
                        stock.quantity || 0
                    );

                const reservedQuantity =
                    Number(
                        stock.reservedQuantity ||
                        0
                    );

                const availableQuantity =
                    Math.max(
                        quantity -
                        reservedQuantity,
                        0
                    );

                // -------------------------------
                // Low Stock Condition
                // -------------------------------
                if (
                    availableQuantity <=
                    reorder.reorderLevel
                ) {
                    const severity =
                        availableQuantity === 0
                            ? "OUT_OF_STOCK"
                            : "LOW_STOCK";

                    // Suggested quantity
                    // should normally refill up
                    // to maximum stock when configured.
                    let suggestedOrderQuantity =
                        Number(
                            reorder.reorderQuantity ||
                            0
                        );

                    if (
                        reorder.maximumStock >
                        0
                    ) {
                        suggestedOrderQuantity =
                            Math.max(
                                reorder.maximumStock -
                                    availableQuantity,
                                0
                            );
                    }

                    alerts.push({
                        _id:
                            reorder._id,

                        company:
                            reorder.company,

                        branch:
                            reorder.branch,

                        warehouse:
                            reorder.warehouse,

                        product:
                            reorder.product,

                        currentQuantity:
                            quantity,

                        reservedQuantity:
                            reservedQuantity,

                        availableQuantity:
                            availableQuantity,

                        reorderLevel:
                            reorder.reorderLevel,

                        reorderQuantity:
                            reorder.reorderQuantity,

                        maximumStock:
                            reorder.maximumStock,

                        suggestedOrderQuantity,

                        autoReorder:
                            reorder.autoReorder,

                        severity,

                        lastStockUpdate:
                            stock.lastStockUpdate,

                        isActive:
                            reorder.isActive,
                    });
                }
            }
        );

        // -------------------------------
        // Sort
        // -------------------------------
        alerts.sort(
            (a, b) =>
                a.availableQuantity -
                b.availableQuantity
        );

        // -------------------------------
        // Pagination
        // -------------------------------
        const total =
            alerts.length;

        const paginatedAlerts =
            alerts.slice(
                skip,
                skip + limitNumber
            );

        // -------------------------------
        // Response
        // -------------------------------
        return res.status(200).json({
            success: true,

            count:
                paginatedAlerts.length,

            total,

            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalPages:
                    Math.ceil(
                        total /
                        limitNumber
                    ),
            },

            data: paginatedAlerts,
        });
    } catch (error) {
        console.error(
            "Get Low Stock Alerts Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to get low stock alerts",
        });
    }
};

// =====================================================
// GET REORDER LEVEL BY ID
// =====================================================
const getReorderLevelById = async (
    req,
    res
) => {
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
                    "Invalid reorder configuration ID",
            });
        }

        const reorderConfig =
            await ReorderLevel.findById(
                id
            )
                .populate(
                    "company",
                    "name email phone"
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
                    "name sku barcode sellingPrice purchasePrice minimumStock maximumStock"
                )
                .populate(
                    "createdBy",
                    "name email role"
                );

        if (!reorderConfig) {
            return res.status(404).json({
                success: false,
                message:
                    "Reorder configuration not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: reorderConfig,
        });
    } catch (error) {
        console.error(
            "Get Reorder Level By ID Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch reorder configuration",
        });
    }
};

// =====================================================
// UPDATE REORDER LEVEL
// =====================================================
const updateReorderLevel = async (
    req,
    res
) => {
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
                    "Invalid reorder configuration ID",
            });
        }

        const reorderConfig =
            await ReorderLevel.findById(
                id
            );

        if (!reorderConfig) {
            return res.status(404).json({
                success: false,
                message:
                    "Reorder configuration not found",
            });
        }

        const {
            reorderLevel,
            reorderQuantity,
            maximumStock,
            autoReorder,
            isActive,
        } = req.body;

        // -------------------------------
        // Validate Reorder Level
        // -------------------------------
        if (
            reorderLevel !== undefined
        ) {
            const value =
                Number(
                    reorderLevel
                );

            if (
                !Number.isFinite(
                    value
                ) ||
                value < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Reorder level must be 0 or greater",
                });
            }
        }

        // -------------------------------
        // Validate Reorder Quantity
        // -------------------------------
        if (
            reorderQuantity !==
            undefined
        ) {
            const value =
                Number(
                    reorderQuantity
                );

            if (
                !Number.isFinite(
                    value
                ) ||
                value < 1
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Reorder quantity must be at least 1",
                });
            }
        }

        // -------------------------------
        // Validate Maximum Stock
        // -------------------------------
        if (
            maximumStock !==
            undefined
        ) {
            const value =
                Number(
                    maximumStock
                );

            if (
                !Number.isFinite(
                    value
                ) ||
                value < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Maximum stock must be 0 or greater",
                });
            }
        }

        // -------------------------------
        // Validate Auto Reorder
        // -------------------------------
        if (
            autoReorder !==
            undefined &&
            typeof autoReorder !==
                "boolean"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "autoReorder must be true or false",
            });
        }

        // -------------------------------
        // Validate Active Status
        // -------------------------------
        if (
            isActive !==
            undefined &&
            typeof isActive !==
                "boolean"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "isActive must be true or false",
            });
        }

        // -------------------------------
        // Calculate Final Values
        // -------------------------------
        const finalReorderLevel =
            reorderLevel !==
            undefined
                ? Number(
                      reorderLevel
                  )
                : reorderConfig.reorderLevel;

        const finalMaximumStock =
            maximumStock !==
            undefined
                ? Number(
                      maximumStock
                  )
                : reorderConfig.maximumStock;

        if (
            finalMaximumStock > 0 &&
            finalMaximumStock <
                finalReorderLevel
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Maximum stock cannot be lower than reorder level",
            });
        }

        // -------------------------------
        // Update Fields
        // -------------------------------
        if (
            reorderLevel !==
            undefined
        ) {
            reorderConfig.reorderLevel =
                Number(
                    reorderLevel
                );
        }

        if (
            reorderQuantity !==
            undefined
        ) {
            reorderConfig.reorderQuantity =
                Number(
                    reorderQuantity
                );
        }

        if (
            maximumStock !==
            undefined
        ) {
            reorderConfig.maximumStock =
                Number(
                    maximumStock
                );
        }

        if (
            autoReorder !==
            undefined
        ) {
            reorderConfig.autoReorder =
                autoReorder;
        }

        if (
            isActive !==
            undefined
        ) {
            reorderConfig.isActive =
                isActive;
        }

        // -------------------------------
        // Save
        // -------------------------------
        await reorderConfig.save();

        // -------------------------------
        // Populate
        // -------------------------------
        await reorderConfig.populate([
            {
                path: "company",
                select: "name email",
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
                select:
                    "name sku barcode sellingPrice purchasePrice minimumStock maximumStock",
            },
            {
                path: "createdBy",
                select: "name email role",
            },
        ]);

        return res.status(200).json({
            success: true,
            message:
                "Reorder configuration updated successfully",
            data: reorderConfig,
        });
    } catch (error) {
        console.error(
            "Update Reorder Level Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to update reorder configuration",
        });
    }
};

// =====================================================
// DELETE REORDER LEVEL
// =====================================================
const deleteReorderLevel = async (
    req,
    res
) => {
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
                    "Invalid reorder configuration ID",
            });
        }

        const reorderConfig =
            await ReorderLevel.findById(
                id
            );

        if (!reorderConfig) {
            return res.status(404).json({
                success: false,
                message:
                    "Reorder configuration not found",
            });
        }

        await reorderConfig.deleteOne();

        return res.status(200).json({
            success: true,
            message:
                "Reorder configuration deleted successfully",
        });
    } catch (error) {
        console.error(
            "Delete Reorder Level Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to delete reorder configuration",
        });
    }
};

// =====================================================
// EXPORTS
// =====================================================
module.exports = {
    createReorderLevel,
    getReorderLevels,
    getLowStockAlerts,
    getReorderLevelById,
    updateReorderLevel,
    deleteReorderLevel,
};