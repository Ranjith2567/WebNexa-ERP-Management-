const mongoose = require("mongoose");

const Stock = require("../models/Stock");
const Company = require("../models/Company");
const Branch = require("../models/Branch");
const Warehouse = require("../models/Warehouse");
const Product = require("../models/Product");

const {
    createStockNotification,
} = require("../services/notificationService");

// =====================================================
// STOCK NOTIFICATION HELPER
// =====================================================
//
// Important:
// Notification failure should NOT break stock operation.
//
// Stock update/create is the main transaction.
// Notification is a secondary operation.
//
// =====================================================

const sendStockNotification = async ({
    stock,
    product,
    warehouse,
    company,
    branch,
    recipient,
    createdBy,
}) => {
    try {
        // ---------------------------------------------
        // Do not notify inactive stock
        // ---------------------------------------------

        if (!stock || !stock.isActive) {
            return null;
        }

        // ---------------------------------------------
        // Create notification
        // ---------------------------------------------

        const notification =
            await createStockNotification({
                company,
                branch,
                recipient,
                stock,
                product,
                warehouse,
                createdBy,
            });

        if (notification) {
            console.log(
                `Stock Notification Created: ${notification.type} - ${product.name}`
            );
        }

        return notification;
    } catch (error) {
        // ---------------------------------------------
        // Notification failure must not break
        // stock operation
        // ---------------------------------------------

        console.error(
            "Stock Notification Error:",
            error.message
        );

        return null;
    }
};


// =====================================================
// CREATE STOCK
// =====================================================

const createStock = async (req, res) => {
    try {
        const {
            company,
            branch,
            warehouse,
            product,
            quantity = 0,
            reservedQuantity = 0,
            minimumStock = 0,
            maximumStock = 0,
            isActive = true,
        } = req.body;

        // =================================================
        // REQUIRED FIELDS
        // =================================================

        if (
            !company ||
            !branch ||
            !warehouse ||
            !product
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Company, branch, warehouse and product are required",
            });
        }

        // =================================================
        // OBJECT ID VALIDATION
        // =================================================

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

        // =================================================
        // NUMBER VALIDATION
        // =================================================

        const numericFields = [
            {
                value: quantity,
                message:
                    "Quantity must be 0 or greater",
            },
            {
                value: reservedQuantity,
                message:
                    "Reserved quantity must be 0 or greater",
            },
            {
                value: minimumStock,
                message:
                    "Minimum stock must be 0 or greater",
            },
            {
                value: maximumStock,
                message:
                    "Maximum stock must be 0 or greater",
            },
        ];

        for (const field of numericFields) {
            if (
                typeof field.value !== "number" ||
                !Number.isFinite(field.value) ||
                field.value < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: field.message,
                });
            }
        }

        // =================================================
        // RESERVED QUANTITY VALIDATION
        // =================================================

        if (
            reservedQuantity > quantity
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Reserved quantity cannot be greater than total quantity",
            });
        }

        // =================================================
        // MIN / MAX VALIDATION
        // =================================================

        if (
            maximumStock > 0 &&
            minimumStock > maximumStock
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Minimum stock cannot be greater than maximum stock",
            });
        }

        // =================================================
        // ACTIVE VALIDATION
        // =================================================

        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                success: false,
                message:
                    "isActive must be true or false",
            });
        }

        // =================================================
        // COMPANY VALIDATION
        // =================================================

        const companyExists =
            await Company.findById(company);

        if (!companyExists) {
            return res.status(404).json({
                success: false,
                message:
                    "Company not found",
            });
        }

        // =================================================
        // BRANCH VALIDATION
        // =================================================

        const branchExists =
            await Branch.findOne({
                _id: branch,
                company,
            });

        if (!branchExists) {
            return res.status(400).json({
                success: false,
                message:
                    "Branch not found or does not belong to the selected company",
            });
        }

        // =================================================
        // WAREHOUSE VALIDATION
        // =================================================

        const warehouseExists =
            await Warehouse.findOne({
                _id: warehouse,
                company,
                branch,
            });

        if (!warehouseExists) {
            return res.status(400).json({
                success: false,
                message:
                    "Warehouse not found or does not belong to the selected company and branch",
            });
        }

        // =================================================
        // PRODUCT VALIDATION
        // =================================================

        const productExists =
            await Product.findOne({
                _id: product,
                company,
                branch,
            });

        if (!productExists) {
            return res.status(400).json({
                success: false,
                message:
                    "Product not found or does not belong to the selected company and branch",
            });
        }

        // =================================================
        // DUPLICATE STOCK CHECK
        // =================================================

        const existingStock =
            await Stock.findOne({
                company,
                warehouse,
                product,
            });

        if (existingStock) {
            return res.status(409).json({
                success: false,
                message:
                    "Stock already exists for this product in this warehouse",
            });
        }

        // =================================================
        // CREATE STOCK
        // =================================================

        const stock =
            await Stock.create({
                company,
                branch,
                warehouse,
                product,
                quantity,
                reservedQuantity,
                minimumStock,
                maximumStock,
                isActive,
                lastStockUpdate:
                    new Date(),
                createdBy:
                    req.user._id,
            });

        // =================================================
        // POPULATE
        // =================================================

        await stock.populate([
            {
                path: "company",
                select: "name",
            },
            {
                path: "branch",
                select:
                    "name branchCode",
            },
            {
                path: "warehouse",
                select:
                    "name code",
            },
            {
                path: "product",
                select:
                    "name sku barcode sellingPrice purchasePrice minimumStock maximumStock",
            },
            {
                path: "createdBy",
                select:
                    "name email role",
            },
        ]);

        // =================================================
        // AVAILABLE QUANTITY
        // =================================================

        const availableQuantity =
            Math.max(
                stock.quantity -
                    stock.reservedQuantity,
                0
            );

        // =================================================
        // AUTOMATIC STOCK NOTIFICATION
        // =================================================

        await sendStockNotification({
            stock,
            product: stock.product,
            warehouse: stock.warehouse,
            company,
            branch,
            recipient: req.user._id,
            createdBy: req.user._id,
        });

        // =================================================
        // RESPONSE
        // =================================================

        return res.status(201).json({
            success: true,
            message:
                "Stock created successfully",

            data: {
                ...stock.toObject(),

                availableQuantity,
            },
        });
    } catch (error) {
        console.error(
            "Create Stock Error:",
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Stock already exists for this product in this warehouse",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to create stock",
            error: error.message,
        });
    }
};


// =====================================================
// GET ALL STOCKS
// =====================================================

const getStocks = async (req, res) => {
    try {
        const {
            company,
            branch,
            warehouse,
            product,
            isActive,
            search,
            lowStock,
            page = 1,
            limit = 10,
        } = req.query;

        const filter = {};

        // =================================================
        // COMPANY
        // =================================================

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

        // =================================================
        // BRANCH
        // =================================================

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

        // =================================================
        // WAREHOUSE
        // =================================================

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

        // =================================================
        // PRODUCT
        // =================================================

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

        // =================================================
        // ACTIVE
        // =================================================

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

        // =================================================
        // SEARCH
        // =================================================

        if (search?.trim()) {
            const escapedSearch =
                search
                    .trim()
                    .replace(
                        /[.*+?^${}()|[\]\\]/g,
                        "\\$&"
                    );

            const searchRegex =
                new RegExp(
                    escapedSearch,
                    "i"
                );

            const productFilter = {
                $or: [
                    {
                        name: searchRegex,
                    },
                    {
                        sku: searchRegex,
                    },
                    {
                        barcode:
                            searchRegex,
                    },
                ],
            };

            if (company) {
                productFilter.company =
                    company;
            }

            if (branch) {
                productFilter.branch =
                    branch;
            }

            const matchingProducts =
                await Product.find(
                    productFilter
                ).select("_id");

            const warehouseFilter = {
                $or: [
                    {
                        name: searchRegex,
                    },
                    {
                        code: searchRegex,
                    },
                ],
            };

            if (company) {
                warehouseFilter.company =
                    company;
            }

            if (branch) {
                warehouseFilter.branch =
                    branch;
            }

            const matchingWarehouses =
                await Warehouse.find(
                    warehouseFilter
                ).select("_id");

            filter.$or = [
                {
                    product: {
                        $in:
                            matchingProducts.map(
                                (item) =>
                                    item._id
                            ),
                    },
                },
                {
                    warehouse: {
                        $in:
                            matchingWarehouses.map(
                                (item) =>
                                    item._id
                            ),
                    },
                },
            ];
        }

        // =================================================
        // LOW STOCK
        // =================================================

        if (lowStock !== undefined) {
            if (
                lowStock !== "true" &&
                lowStock !== "false"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "lowStock must be true or false",
                });
            }

            if (lowStock === "true") {
                const stockMatch = {
                    ...filter,
                    isActive: true,
                };

                delete stockMatch.$or;

                const pipeline = [
                    {
                        $match:
                            stockMatch,
                    },

                    {
                        $addFields: {
                            availableQuantity: {
                                $max: [
                                    {
                                        $subtract: [
                                            {
                                                $ifNull: [
                                                    "$quantity",
                                                    0,
                                                ],
                                            },
                                            {
                                                $ifNull: [
                                                    "$reservedQuantity",
                                                    0,
                                                ],
                                            },
                                        ],
                                    },
                                    0,
                                ],
                            },
                        },
                    },

                    {
                        $lookup: {
                            from: "products",
                            localField:
                                "product",
                            foreignField:
                                "_id",
                            as: "productData",
                        },
                    },

                    {
                        $unwind:
                            "$productData",
                    },

                    {
                        $match: {
                            "productData.isActive":
                                true,
                        },
                    },

                    {
                        $match: {
                            $expr: {
                                $lte: [
                                    "$availableQuantity",
                                    {
                                        $ifNull: [
                                            "$productData.minimumStock",
                                            0,
                                        ],
                                    },
                                ],
                            },
                        },
                    },

                    {
                        $project: {
                            product: 1,
                        },
                    },
                ];

                const lowStockRecords =
                    await Stock.aggregate(
                        pipeline
                    );

                const lowStockProductIds =
                    [
                        ...new Set(
                            lowStockRecords.map(
                                (stock) =>
                                    stock.product.toString()
                            )
                        ),
                    ];

                if (
                    lowStockProductIds.length ===
                    0
                ) {
                    const currentPage =
                        Math.max(
                            parseInt(
                                page,
                                10
                            ) || 1,
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

                    return res.status(200).json({
                        success: true,
                        data: [],

                        pagination: {
                            page:
                                currentPage,
                            limit:
                                perPage,
                            total: 0,
                            pages: 0,
                        },
                    });
                }

                filter.product = {
                    $in:
                        lowStockProductIds,
                };
            }
        }

        // =================================================
        // PAGINATION
        // =================================================

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

        const skip =
            (currentPage - 1) *
            perPage;

        // =================================================
        // QUERY
        // =================================================

        const [
            stocks,
            total,
        ] = await Promise.all([
            Stock.find(filter)
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
                .limit(perPage),

            Stock.countDocuments(
                filter
            ),
        ]);

        // =================================================
        // FORMAT RESPONSE
        // =================================================

        const formattedStocks =
            stocks.map((stock) => {
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

                return {
                    ...stock.toObject(),

                    availableQuantity,
                };
            });

        return res.status(200).json({
            success: true,

            data:
                formattedStocks,

            pagination: {
                page:
                    currentPage,
                limit:
                    perPage,
                total,

                pages:
                    Math.ceil(
                        total /
                            perPage
                    ) || 1,
            },
        });
    } catch (error) {
        console.error(
            "Get Stocks Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch stocks",
            error: error.message,
        });
    }
};


// =====================================================
// GET STOCK BY ID
// =====================================================

const getStockById = async (
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
                    "Invalid stock ID",
            });
        }

        const stock =
            await Stock.findById(id)
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
                    "name sku barcode sellingPrice purchasePrice minimumStock maximumStock"
                )
                .populate(
                    "createdBy",
                    "name email role"
                );

        if (!stock) {
            return res.status(404).json({
                success: false,
                message:
                    "Stock not found",
            });
        }

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

        return res.status(200).json({
            success: true,

            data: {
                ...stock.toObject(),

                availableQuantity,
            },
        });
    } catch (error) {
        console.error(
            "Get Stock Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch stock",
            error: error.message,
        });
    }
};


// =====================================================
// UPDATE STOCK
// =====================================================

const updateStock = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;

        const {
            quantity,
            reservedQuantity,
            minimumStock,
            maximumStock,
            isActive,
        } = req.body;

        // =================================================
        // ID VALIDATION
        // =================================================

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid stock ID",
            });
        }

        // =================================================
        // FIND STOCK
        // =================================================

        const stock =
            await Stock.findById(id);

        if (!stock) {
            return res.status(404).json({
                success: false,
                message:
                    "Stock not found",
            });
        }

        // =================================================
        // QUANTITY UPDATE BLOCK
        // =================================================

        if (quantity !== undefined) {
            return res.status(400).json({
                success: false,
                message:
                    "Direct stock quantity update is not allowed. Use stock movement, goods receipt, purchase return, sales, sales return, stock adjustment or stock transfer.",
            });
        }

        // =================================================
        // RESERVED QUANTITY
        // =================================================

        let newReservedQuantity =
            stock.reservedQuantity;

        if (
            reservedQuantity !==
            undefined
        ) {
            if (
                typeof reservedQuantity !==
                    "number" ||
                !Number.isFinite(
                    reservedQuantity
                ) ||
                reservedQuantity < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Reserved quantity must be 0 or greater",
                });
            }

            newReservedQuantity =
                reservedQuantity;
        }

        // =================================================
        // RESERVED QUANTITY CHECK
        // =================================================

        if (
            newReservedQuantity >
            stock.quantity
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Reserved quantity cannot be greater than total quantity",
            });
        }

        // =================================================
        // MINIMUM STOCK
        // =================================================

        if (
            minimumStock !==
            undefined
        ) {
            if (
                typeof minimumStock !==
                    "number" ||
                !Number.isFinite(
                    minimumStock
                ) ||
                minimumStock < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Minimum stock must be 0 or greater",
                });
            }

            stock.minimumStock =
                minimumStock;
        }

        // =================================================
        // MAXIMUM STOCK
        // =================================================

        if (
            maximumStock !==
            undefined
        ) {
            if (
                typeof maximumStock !==
                    "number" ||
                !Number.isFinite(
                    maximumStock
                ) ||
                maximumStock < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Maximum stock must be 0 or greater",
                });
            }

            stock.maximumStock =
                maximumStock;
        }

        // =================================================
        // MIN / MAX VALIDATION
        // =================================================

        if (
            stock.maximumStock > 0 &&
            stock.minimumStock >
                stock.maximumStock
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Minimum stock cannot be greater than maximum stock",
            });
        }

        // =================================================
        // RESERVED UPDATE
        // =================================================

        if (
            reservedQuantity !==
            undefined
        ) {
            stock.reservedQuantity =
                newReservedQuantity;
        }

        // =================================================
        // ACTIVE STATUS
        // =================================================

        if (
            isActive !==
            undefined
        ) {
            if (
                typeof isActive !==
                "boolean"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "isActive must be true or false",
                });
            }

            stock.isActive =
                isActive;
        }

        // =================================================
        // UPDATE TIMESTAMP
        // =================================================

        stock.lastStockUpdate =
            new Date();

        // =================================================
        // SAVE
        // =================================================

        await stock.save();

        // =================================================
        // POPULATE
        // =================================================

        await stock.populate([
            {
                path: "company",
                select:
                    "name",
            },
            {
                path: "branch",
                select:
                    "name branchCode",
            },
            {
                path: "warehouse",
                select:
                    "name code",
            },
            {
                path: "product",
                select:
                    "name sku barcode sellingPrice purchasePrice minimumStock maximumStock",
            },
            {
                path: "createdBy",
                select:
                    "name email role",
            },
        ]);

        // =================================================
        // AVAILABLE QUANTITY
        // =================================================

        const availableQuantity =
            Math.max(
                stock.quantity -
                    stock.reservedQuantity,
                0
            );

        // =================================================
        // AUTOMATIC STOCK NOTIFICATION
        // =================================================

        await sendStockNotification({
            stock,
            product: stock.product,
            warehouse: stock.warehouse,
            company: stock.company._id,
            branch: stock.branch._id,
            recipient: req.user._id,
            createdBy: req.user._id,
        });

        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({
            success: true,
            message:
                "Stock updated successfully",

            data: {
                ...stock.toObject(),

                availableQuantity,
            },
        });
    } catch (error) {
        console.error(
            "Update Stock Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update stock",
            error: error.message,
        });
    }
};


// =====================================================
// DELETE STOCK
// =====================================================

const deleteStock = async (
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
                    "Invalid stock ID",
            });
        }

        const stock =
            await Stock.findById(id);

        if (!stock) {
            return res.status(404).json({
                success: false,
                message:
                    "Stock not found",
            });
        }

        // =================================================
        // PROTECT STOCK WITH QUANTITY
        // =================================================

        if (
            stock.quantity > 0 ||
            stock.reservedQuantity > 0
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Stock cannot be deleted while quantity or reserved quantity exists. Use an appropriate stock adjustment or deactivate the stock.",
            });
        }

        await stock.deleteOne();

        return res.status(200).json({
            success: true,
            message:
                "Stock deleted successfully",
        });
    } catch (error) {
        console.error(
            "Delete Stock Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete stock",
            error: error.message,
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    createStock,
    getStocks,
    getStockById,
    updateStock,
    deleteStock,
};