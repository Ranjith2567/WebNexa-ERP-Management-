const mongoose = require("mongoose");

const Stock = require("../models/Stock");


// =====================================================
// GET INVENTORY STOCK SUMMARY
// =====================================================
const getStockSummary = async (req, res) => {
    try {
        const {
            company,
            branch,
            warehouse,
            product,
            category,
            lowStock,
            outOfStock,
            overStock,
            page = 1,
            limit = 20,
        } = req.query;


        // =================================================
        // COMPANY VALIDATION
        // =================================================

        if (!company) {
            return res.status(400).json({
                success: false,
                message: "Company is required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(company)) {
            return res.status(400).json({
                success: false,
                message: "Invalid company ID.",
            });
        }


        // =================================================
        // OPTIONAL ID VALIDATION
        // =================================================

        if (
            branch &&
            !mongoose.Types.ObjectId.isValid(branch)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid branch ID.",
            });
        }

        if (
            warehouse &&
            !mongoose.Types.ObjectId.isValid(warehouse)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid warehouse ID.",
            });
        }

        if (
            product &&
            !mongoose.Types.ObjectId.isValid(product)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID.",
            });
        }

        if (
            category &&
            !mongoose.Types.ObjectId.isValid(category)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID.",
            });
        }


        // =================================================
        // PAGINATION
        // =================================================

        const currentPage = Math.max(
            parseInt(page, 10) || 1,
            1
        );

        const perPage = Math.min(
            Math.max(
                parseInt(limit, 10) || 20,
                1
            ),
            100
        );

        const skip =
            (currentPage - 1) * perPage;


        // =================================================
        // STOCK MATCH
        // =================================================

        const stockMatch = {
            company:
                new mongoose.Types.ObjectId(company),

            isActive: true,
        };


        if (branch) {
            stockMatch.branch =
                new mongoose.Types.ObjectId(branch);
        }

        if (warehouse) {
            stockMatch.warehouse =
                new mongoose.Types.ObjectId(warehouse);
        }

        if (product) {
            stockMatch.product =
                new mongoose.Types.ObjectId(product);
        }


        // =================================================
        // BASE PIPELINE
        // =================================================

        const basePipeline = [

            // =================================================
            // STOCK
            // =================================================

            {
                $match: stockMatch,
            },


            // =================================================
            // PRODUCT LOOKUP
            // =================================================

            {
                $lookup: {
                    from: "products",
                    localField: "product",
                    foreignField: "_id",
                    as: "productData",
                },
            },


            {
                $unwind: {
                    path: "$productData",
                    preserveNullAndEmptyArrays: false,
                },
            },


            // =================================================
            // ONLY ACTIVE PRODUCTS
            // =================================================

            {
                $match: {
                    "productData.isActive": true,
                },
            },


            // =================================================
            // WAREHOUSE LOOKUP
            // =================================================

            {
                $lookup: {
                    from: "warehouses",
                    localField: "warehouse",
                    foreignField: "_id",
                    as: "warehouseData",
                },
            },


            {
                $unwind: {
                    path: "$warehouseData",
                    preserveNullAndEmptyArrays: false,
                },
            },


            // =================================================
            // ONLY ACTIVE WAREHOUSES
            // =================================================

            {
                $match: {
                    "warehouseData.isActive": true,
                },
            },


            // =================================================
            // CATEGORY LOOKUP
            // =================================================

            {
                $lookup: {
                    from: "categories",
                    localField: "productData.category",
                    foreignField: "_id",
                    as: "categoryData",
                },
            },


            {
                $unwind: {
                    path: "$categoryData",
                    preserveNullAndEmptyArrays: true,
                },
            },


            // =================================================
            // CATEGORY FILTER
            // =================================================

            ...(category
                ? [
                    {
                        $match: {
                            "productData.category":
                                new mongoose.Types.ObjectId(
                                    category
                                ),
                        },
                    },
                ]
                : []),


            // =================================================
            // CALCULATED VALUES
            // =================================================

            {
                $addFields: {

                    // -----------------------------------------
                    // AVAILABLE QUANTITY
                    // -----------------------------------------

                    availableQuantity: {
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


                    // -----------------------------------------
                    // STOCK VALUE
                    // quantity × purchase price
                    // -----------------------------------------

                    stockValue: {
                        $multiply: [
                            {
                                $ifNull: [
                                    "$quantity",
                                    0,
                                ],
                            },

                            {
                                $ifNull: [
                                    "$productData.purchasePrice",
                                    0,
                                ],
                            },
                        ],
                    },


                    // -----------------------------------------
                    // SELLING VALUE
                    // quantity × selling price
                    // -----------------------------------------

                    sellingValue: {
                        $multiply: [
                            {
                                $ifNull: [
                                    "$quantity",
                                    0,
                                ],
                            },

                            {
                                $ifNull: [
                                    "$productData.sellingPrice",
                                    0,
                                ],
                            },
                        ],
                    },
                },
            },


            // =================================================
            // STOCK STATUS
            // =================================================

            {
                $addFields: {

                    // -----------------------------------------
                    // OUT OF STOCK
                    // -----------------------------------------

                    isOutOfStock: {
                        $lte: [
                            "$availableQuantity",
                            0,
                        ],
                    },


                    // -----------------------------------------
                    // LOW STOCK
                    // -----------------------------------------

                    isLowStock: {
                        $and: [

                            {
                                $gt: [
                                    "$availableQuantity",
                                    0,
                                ],
                            },

                            {
                                $lte: [
                                    "$availableQuantity",

                                    {
                                        $ifNull: [
                                            "$minimumStock",
                                            0,
                                        ],
                                    },
                                ],
                            },
                        ],
                    },


                    // -----------------------------------------
                    // OVER STOCK
                    // -----------------------------------------

                    isOverStock: {
                        $and: [

                            {
                                $gt: [
                                    "$maximumStock",
                                    0,
                                ],
                            },

                            {
                                $gt: [
                                    "$quantity",
                                    "$maximumStock",
                                ],
                            },
                        ],
                    },
                },
            },


            // =================================================
            // LOW STOCK FILTER
            // =================================================

            ...(lowStock === "true"
                ? [
                    {
                        $match: {
                            isLowStock: true,
                        },
                    },
                ]
                : []),


            // =================================================
            // OUT OF STOCK FILTER
            // =================================================

            ...(outOfStock === "true"
                ? [
                    {
                        $match: {
                            isOutOfStock: true,
                        },
                    },
                ]
                : []),


            // =================================================
            // OVER STOCK FILTER
            // =================================================

            ...(overStock === "true"
                ? [
                    {
                        $match: {
                            isOverStock: true,
                        },
                    },
                ]
                : []),


            // =================================================
            // FINAL PROJECT
            // =================================================

            {
                $project: {

                    _id: 1,

                    // -----------------------------------------
                    // COMPANY / BRANCH
                    // -----------------------------------------

                    company: 1,

                    branch: 1,


                    // -----------------------------------------
                    // WAREHOUSE
                    // -----------------------------------------

                    warehouse:
                        "$warehouseData._id",

                    warehouseName:
                        "$warehouseData.name",

                    warehouseCode:
                        "$warehouseData.code",


                    // -----------------------------------------
                    // PRODUCT
                    // -----------------------------------------

                    product:
                        "$productData._id",

                    productName:
                        "$productData.name",

                    sku:
                        "$productData.sku",

                    barcode:
                        "$productData.barcode",


                    // -----------------------------------------
                    // CATEGORY
                    // -----------------------------------------

                    category:
                        "$categoryData._id",

                    categoryName:
                        "$categoryData.name",


                    // -----------------------------------------
                    // STOCK
                    // -----------------------------------------

                    quantity: 1,

                    reservedQuantity: 1,

                    availableQuantity: 1,


                    // -----------------------------------------
                    // STOCK LIMITS
                    // -----------------------------------------

                    minimumStock: 1,

                    maximumStock: 1,


                    // -----------------------------------------
                    // PRICING
                    // -----------------------------------------

                    purchasePrice:
                        "$productData.purchasePrice",

                    sellingPrice:
                        "$productData.sellingPrice",


                    // -----------------------------------------
                    // VALUES
                    // -----------------------------------------

                    stockValue: 1,

                    sellingValue: 1,

                    potentialProfit: {
                        $subtract: [
                            "$sellingValue",
                            "$stockValue",
                        ],
                    },


                    // -----------------------------------------
                    // STATUS
                    // -----------------------------------------

                    isLowStock: 1,

                    isOutOfStock: 1,

                    isOverStock: 1,


                    // -----------------------------------------
                    // DATES
                    // -----------------------------------------

                    lastStockUpdate: 1,

                    createdAt: 1,

                    updatedAt: 1,
                },
            },


            // =================================================
            // SORT
            // =================================================

            {
                $sort: {
                    productName: 1,
                    warehouseName: 1,
                },
            },
        ];


        // =================================================
        // TOTAL COUNT
        // =================================================

        const countPipeline = [
            ...basePipeline,

            {
                $count: "total",
            },
        ];


        const countResult =
            await Stock.aggregate(
                countPipeline
            );


        const total =
            countResult.length > 0
                ? countResult[0].total
                : 0;


        // =================================================
        // PAGINATED DATA
        // =================================================

        const dataPipeline = [
            ...basePipeline,

            {
                $skip: skip,
            },

            {
                $limit: perPage,
            },
        ];


        const data =
            await Stock.aggregate(
                dataPipeline
            );


        // =================================================
        // OVERALL SUMMARY
        // =================================================

        const summaryPipeline = [
            ...basePipeline,


            // =================================================
            // GROUP
            // =================================================

            {
                $group: {
                    _id: null,


                    // -----------------------------------------
                    // UNIQUE PRODUCTS
                    // -----------------------------------------

                    products: {
                        $addToSet: "$product",
                    },


                    // -----------------------------------------
                    // UNIQUE WAREHOUSES
                    // -----------------------------------------

                    warehouses: {
                        $addToSet: "$warehouse",
                    },


                    // -----------------------------------------
                    // QUANTITY
                    // -----------------------------------------

                    totalQuantity: {
                        $sum: "$quantity",
                    },


                    // -----------------------------------------
                    // RESERVED
                    // -----------------------------------------

                    totalReservedQuantity: {
                        $sum: "$reservedQuantity",
                    },


                    // -----------------------------------------
                    // AVAILABLE
                    // -----------------------------------------

                    totalAvailableQuantity: {
                        $sum: "$availableQuantity",
                    },


                    // -----------------------------------------
                    // INVENTORY VALUE
                    // -----------------------------------------

                    totalStockValue: {
                        $sum: "$stockValue",
                    },


                    // -----------------------------------------
                    // SELLING VALUE
                    // -----------------------------------------

                    totalSellingValue: {
                        $sum: "$sellingValue",
                    },


                    // -----------------------------------------
                    // LOW STOCK
                    // -----------------------------------------

                    lowStockItems: {
                        $sum: {
                            $cond: [
                                "$isLowStock",
                                1,
                                0,
                            ],
                        },
                    },


                    // -----------------------------------------
                    // OUT OF STOCK
                    // -----------------------------------------

                    outOfStockItems: {
                        $sum: {
                            $cond: [
                                "$isOutOfStock",
                                1,
                                0,
                            ],
                        },
                    },


                    // -----------------------------------------
                    // OVER STOCK
                    // -----------------------------------------

                    overStockItems: {
                        $sum: {
                            $cond: [
                                "$isOverStock",
                                1,
                                0,
                            ],
                        },
                    },
                },
            },


            // =================================================
            // SUMMARY OUTPUT
            // =================================================

            {
                $project: {
                    _id: 0,


                    totalProducts: {
                        $size: "$products",
                    },


                    totalWarehouses: {
                        $size: "$warehouses",
                    },


                    totalQuantity: 1,


                    totalReservedQuantity: 1,


                    totalAvailableQuantity: 1,


                    totalStockValue: 1,


                    totalSellingValue: 1,


                    potentialProfit: {
                        $subtract: [
                            "$totalSellingValue",
                            "$totalStockValue",
                        ],
                    },


                    lowStockItems: 1,


                    outOfStockItems: 1,


                    overStockItems: 1,
                },
            },
        ];


        const summaryResult =
            await Stock.aggregate(
                summaryPipeline
            );


        const summary =
            summaryResult.length > 0
                ? summaryResult[0]
                : {
                    totalProducts: 0,
                    totalWarehouses: 0,

                    totalQuantity: 0,

                    totalReservedQuantity: 0,

                    totalAvailableQuantity: 0,

                    totalStockValue: 0,

                    totalSellingValue: 0,

                    potentialProfit: 0,

                    lowStockItems: 0,

                    outOfStockItems: 0,

                    overStockItems: 0,
                };


        // =================================================
        // FINAL RESPONSE
        // =================================================

        return res.status(200).json({
            success: true,

            data,

            summary,

            pagination: {
                total,

                page: currentPage,

                limit: perPage,

                totalPages:
                    Math.ceil(
                        total / perPage
                    ),
            },
        });

    } catch (error) {

        console.error(
            "Get Stock Summary Error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to fetch stock summary.",

            error: error.message,
        });
    }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    getStockSummary,
};