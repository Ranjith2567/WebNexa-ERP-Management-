const mongoose = require("mongoose");

const Product = require("../models/Product");
const Company = require("../models/Company");
const Branch = require("../models/Branch");
const Category = require("../models/Category");
const Brand = require("../models/Brand");
const Unit = require("../models/Unit");
const Stock = require("../models/Stock");

// =====================================================
// CREATE PRODUCT
// =====================================================
const createProduct = async (req, res, next) => {
    try {
        const {
            company,
            branch,
            name,
            sku,
            barcode,
            description,
            category,
            brand,
            unit,
            purchasePrice,
            sellingPrice,
            taxRate,
            openingStock,
            minimumStock,
            maximumStock,
            isActive,
        } = req.body;

        // =================================================
        // REQUIRED FIELDS
        // =================================================
        if (!company) {
            return res.status(400).json({
                success: false,
                message: "Company is required",
            });
        }

        if (!branch) {
            return res.status(400).json({
                success: false,
                message: "Branch is required",
            });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Product name is required",
            });
        }

        if (!sku || !sku.trim()) {
            return res.status(400).json({
                success: false,
                message: "SKU is required",
            });
        }

        if (
            sellingPrice === undefined ||
            sellingPrice === null
        ) {
            return res.status(400).json({
                success: false,
                message: "Selling price is required",
            });
        }

        // =================================================
        // OBJECT ID VALIDATION
        // =================================================
        if (!mongoose.Types.ObjectId.isValid(company)) {
            return res.status(400).json({
                success: false,
                message: "Invalid company ID",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(branch)) {
            return res.status(400).json({
                success: false,
                message: "Invalid branch ID",
            });
        }

        if (
            category &&
            !mongoose.Types.ObjectId.isValid(category)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID",
            });
        }

        if (
            brand &&
            !mongoose.Types.ObjectId.isValid(brand)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid brand ID",
            });
        }

        if (
            unit &&
            !mongoose.Types.ObjectId.isValid(unit)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid unit ID",
            });
        }

        // =================================================
        // NUMBER VALIDATION
        // =================================================
        const numericFields = [
            {
                name: "purchasePrice",
                value: purchasePrice,
                min: 0,
                message:
                    "Purchase price must be 0 or greater",
            },
            {
                name: "sellingPrice",
                value: sellingPrice,
                min: 0,
                message:
                    "Selling price must be 0 or greater",
            },
            {
                name: "taxRate",
                value: taxRate,
                min: 0,
                max: 100,
                message:
                    "Tax rate must be between 0 and 100",
            },
            {
                name: "openingStock",
                value: openingStock,
                min: 0,
                message:
                    "Opening stock must be 0 or greater",
            },
            {
                name: "minimumStock",
                value: minimumStock,
                min: 0,
                message:
                    "Minimum stock must be 0 or greater",
            },
            {
                name: "maximumStock",
                value: maximumStock,
                min: 0,
                message:
                    "Maximum stock must be 0 or greater",
            },
        ];

        for (const field of numericFields) {
            if (field.value !== undefined) {
                if (
                    typeof field.value !== "number" ||
                    !Number.isFinite(field.value) ||
                    field.value < field.min ||
                    (
                        field.max !== undefined &&
                        field.value > field.max
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message: field.message,
                    });
                }
            }
        }

        // =================================================
        // MAXIMUM STOCK VALIDATION
        // =================================================
        if (
            maximumStock !== undefined &&
            maximumStock > 0 &&
            minimumStock !== undefined &&
            maximumStock < minimumStock
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Maximum stock cannot be lower than minimum stock",
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
                message: "Company not found",
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
                    "Branch not found or does not belong to this company",
            });
        }

        // =================================================
        // CATEGORY VALIDATION
        // =================================================
        if (category) {
            const categoryExists =
                await Category.findOne({
                    _id: category,
                    company,
                });

            if (!categoryExists) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Category not found or does not belong to this company",
                });
            }
        }

        // =================================================
        // BRAND VALIDATION
        // =================================================
        if (brand) {
            const brandExists =
                await Brand.findOne({
                    _id: brand,
                    company,
                });

            if (!brandExists) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Brand not found or does not belong to this company",
                });
            }
        }

        // =================================================
        // UNIT VALIDATION
        // =================================================
        if (unit) {
            const unitExists =
                await Unit.findOne({
                    _id: unit,
                    company,
                });

            if (!unitExists) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Unit not found or does not belong to this company",
                });
            }
        }

        // =================================================
        // NORMALIZE
        // =================================================
        const normalizedName = name.trim();

        const normalizedSku =
            sku.trim().toUpperCase();

        const normalizedBarcode =
            barcode?.trim() || "";

        // =================================================
        // DUPLICATE SKU
        // =================================================
        const existingSku =
            await Product.findOne({
                company,
                sku: normalizedSku,
            });

        if (existingSku) {
            return res.status(400).json({
                success: false,
                message:
                    "Product SKU already exists",
            });
        }

        // =================================================
        // DUPLICATE BARCODE
        // =================================================
        if (normalizedBarcode) {
            const existingBarcode =
                await Product.findOne({
                    company,
                    barcode: normalizedBarcode,
                });

            if (existingBarcode) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Product barcode already exists",
                });
            }
        }

        // =================================================
        // CREATE PRODUCT
        // =================================================
        //
        // IMPORTANT:
        // Product.currentStock is NOT used.
        //
        // Actual stock is maintained in Stock model.
        //
        // openingStock is retained as product setup data.
        //
        // =================================================
        const product =
            await Product.create({
                company,
                branch,
                name: normalizedName,
                sku: normalizedSku,
                barcode: normalizedBarcode,
                description:
                    description?.trim() || "",
                category: category || null,
                brand: brand || null,
                unit: unit || null,

                purchasePrice:
                    purchasePrice !== undefined
                        ? purchasePrice
                        : 0,

                sellingPrice,

                taxRate:
                    taxRate !== undefined
                        ? taxRate
                        : 0,

                openingStock:
                    openingStock !== undefined
                        ? openingStock
                        : 0,

                minimumStock:
                    minimumStock !== undefined
                        ? minimumStock
                        : 0,

                maximumStock:
                    maximumStock !== undefined
                        ? maximumStock
                        : 0,

                isActive:
                    typeof isActive === "boolean"
                        ? isActive
                        : true,

                createdBy: req.user._id,
            });

        // =================================================
        // POPULATE
        // =================================================
        await product.populate([
            {
                path: "company",
                select: "name legalName",
            },
            {
                path: "branch",
                select: "name branchCode",
            },
            {
                path: "category",
                select: "name code",
            },
            {
                path: "brand",
                select: "name code",
            },
            {
                path: "unit",
                select: "name code symbol",
            },
            {
                path: "createdBy",
                select: "name email",
            },
        ]);

        return res.status(201).json({
            success: true,
            message:
                "Product created successfully",
            product,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message:
                    "Product SKU or barcode already exists",
            });
        }

        next(error);
    }
};

// =====================================================
// GET ALL PRODUCTS
// =====================================================
const getProducts = async (
    req,
    res,
    next
) => {
    try {
        const {
            company,
            branch,
            category,
            brand,
            unit,
            search,
            isActive,
            lowStock,
            page = 1,
            limit = 10,
        } = req.query;

        const filter = {};

        // =================================================
        // COMPANY FILTER
        // =================================================
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

        // =================================================
        // BRANCH FILTER
        // =================================================
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

        // =================================================
        // CATEGORY FILTER
        // =================================================
        if (category) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    category
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid category ID",
                });
            }

            filter.category = category;
        }

        // =================================================
        // BRAND FILTER
        // =================================================
        if (brand) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    brand
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid brand ID",
                });
            }

            filter.brand = brand;
        }

        // =================================================
        // UNIT FILTER
        // =================================================
        if (unit) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    unit
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid unit ID",
                });
            }

            filter.unit = unit;
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

            filter.$or = [
                {
                    name: searchRegex,
                },
                {
                    sku: searchRegex,
                },
                {
                    barcode: searchRegex,
                },
                {
                    description: searchRegex,
                },
            ];
        }

        // =================================================
        // ACTIVE FILTER
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
        // LOW STOCK FILTER
        // =================================================
        //
        // Product.minimumStock = stock threshold
        //
        // Stock.quantity = actual stock
        //
        // Stock.reservedQuantity = reserved stock
        //
        // availableQuantity =
        // quantity - reservedQuantity
        //
        // Low stock when:
        //
        // availableQuantity <= Product.minimumStock
        //
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
                    isActive: true,
                };

                if (company) {
                    stockMatch.company =
                        company;
                }

                if (branch) {
                    stockMatch.branch =
                        branch;
                }

                // -----------------------------------------
                // Find low-stock products
                // -----------------------------------------
                const lowStockRecords =
                    await Stock.aggregate([
                        {
                            $match:
                                stockMatch,
                        },

                        // Calculate available stock
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

                        // Get Product
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

                        // Compare with Product.minimumStock
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
                    ]);

                const lowStockProductIds =
                    [
                        ...new Set(
                            lowStockRecords.map(
                                (stock) =>
                                    stock.product.toString()
                            )
                        ),
                    ];

                // -----------------------------------------
                // No low-stock products
                // -----------------------------------------
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

                    const currentLimit =
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
                        count: 0,

                        pagination: {
                            page: currentPage,
                            limit: currentLimit,
                            total: 0,
                            pages: 0,
                        },

                        products: [],
                    });
                }

                filter._id = {
                    $in: lowStockProductIds,
                };
            }
        }

        // =================================================
        // PAGINATION
        // =================================================
        const currentPage = Math.max(
            parseInt(page, 10) || 1,
            1
        );

        const currentLimit = Math.min(
            Math.max(
                parseInt(limit, 10) || 10,
                1
            ),
            100
        );

        const skip =
            (currentPage - 1) *
            currentLimit;

        // =================================================
        // QUERY
        // =================================================
        const [
            products,
            total,
        ] = await Promise.all([
            Product.find(filter)
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "branch",
                    "name branchCode"
                )
                .populate(
                    "category",
                    "name code"
                )
                .populate(
                    "brand",
                    "name code"
                )
                .populate(
                    "unit",
                    "name code symbol"
                )
                .populate(
                    "createdBy",
                    "name email"
                )
                .sort({
                    name: 1,
                })
                .skip(skip)
                .limit(currentLimit)
                .lean(),

            Product.countDocuments(filter),
        ]);

        // =================================================
        // STOCK SUMMARY
        // =================================================
        const productIds =
            products.map(
                (product) => product._id
            );

        let stockSummary = [];

        if (productIds.length > 0) {
            stockSummary =
                await Stock.aggregate([
                    {
                        $match: {
                            product: {
                                $in: productIds,
                            },
                            isActive: true,
                        },
                    },
                    {
                        $group: {
                            _id: "$product",

                            totalQuantity: {
                                $sum: "$quantity",
                            },

                            totalReservedQuantity: {
                                $sum:
                                    "$reservedQuantity",
                            },

                            totalAvailableQuantity: {
                                $sum: {
                                    $subtract: [
                                        "$quantity",
                                        "$reservedQuantity",
                                    ],
                                },
                            },

                            warehouseCount: {
                                $sum: 1,
                            },
                        },
                    },
                ]);
        }

        const stockMap = new Map();

        stockSummary.forEach((stock) => {
            stockMap.set(
                stock._id.toString(),
                stock
            );
        });

        // =================================================
        // ATTACH STOCK SUMMARY
        // =================================================
        const productsWithStock =
            products.map((product) => {
                const stock =
                    stockMap.get(
                        product._id.toString()
                    );

                return {
                    ...product,

                    stockSummary: {
                        totalQuantity:
                            stock?.totalQuantity ||
                            0,

                        totalReservedQuantity:
                            stock?.totalReservedQuantity ||
                            0,

                        totalAvailableQuantity:
                            stock?.totalAvailableQuantity ||
                            0,

                        warehouseCount:
                            stock?.warehouseCount ||
                            0,
                    },
                };
            });

        // =================================================
        // RESPONSE
        // =================================================
        return res.status(200).json({
            success: true,

            count:
                productsWithStock.length,

            pagination: {
                page: currentPage,
                limit: currentLimit,
                total,
                pages:
                    Math.ceil(
                        total /
                            currentLimit
                    ),
            },

            products:
                productsWithStock,
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// GET PRODUCT BY ID
// =====================================================
const getProductById = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        const product =
            await Product.findById(id)
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "branch",
                    "name branchCode"
                )
                .populate(
                    "category",
                    "name code"
                )
                .populate(
                    "brand",
                    "name code"
                )
                .populate(
                    "unit",
                    "name code symbol"
                )
                .populate(
                    "createdBy",
                    "name email"
                )
                .lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // =================================================
        // GET STOCK BY WAREHOUSE
        // =================================================
        const stocks =
            await Stock.find({
                product: id,
                isActive: true,
            })
                .populate(
                    "warehouse",
                    "name code"
                )
                .populate(
                    "branch",
                    "name branchCode"
                )
                .lean();

        // =================================================
        // STOCK SUMMARY
        // =================================================
        const totalQuantity =
            stocks.reduce(
                (sum, stock) =>
                    sum +
                    Number(
                        stock.quantity || 0
                    ),
                0
            );

        const totalReservedQuantity =
            stocks.reduce(
                (sum, stock) =>
                    sum +
                    Number(
                        stock.reservedQuantity ||
                            0
                    ),
                0
            );

        const totalAvailableQuantity =
            Math.max(
                totalQuantity -
                    totalReservedQuantity,
                0
            );

        return res.status(200).json({
            success: true,

            product,

            stockSummary: {
                totalQuantity,
                totalReservedQuantity,
                totalAvailableQuantity,
                warehouseCount:
                    stocks.length,
            },

            stocks,
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// UPDATE PRODUCT
// =====================================================
const updateProduct = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        const product =
            await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const {
            branch,
            name,
            sku,
            barcode,
            description,
            category,
            brand,
            unit,
            purchasePrice,
            sellingPrice,
            taxRate,
            openingStock,
            minimumStock,
            maximumStock,
            isActive,
        } = req.body;

        // =================================================
        // BRANCH
        // =================================================
        if (branch !== undefined) {
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

            const branchExists =
                await Branch.findOne({
                    _id: branch,
                    company:
                        product.company,
                });

            if (!branchExists) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Branch not found or does not belong to this company",
                });
            }

            product.branch = branch;
        }

        // =================================================
        // NAME
        // =================================================
        if (name !== undefined) {
            const normalizedName =
                name.trim();

            if (!normalizedName) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Product name cannot be empty",
                });
            }

            product.name =
                normalizedName;
        }

        // =================================================
        // SKU
        // =================================================
        if (sku !== undefined) {
            const normalizedSku =
                sku.trim().toUpperCase();

            if (!normalizedSku) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Product SKU cannot be empty",
                });
            }

            const duplicateSku =
                await Product.findOne({
                    company:
                        product.company,
                    sku: normalizedSku,
                    _id: {
                        $ne: id,
                    },
                });

            if (duplicateSku) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Product SKU already exists",
                });
            }

            product.sku =
                normalizedSku;
        }

        // =================================================
        // BARCODE
        // =================================================
        if (barcode !== undefined) {
            const normalizedBarcode =
                barcode.trim();

            if (normalizedBarcode) {
                const duplicateBarcode =
                    await Product.findOne({
                        company:
                            product.company,
                        barcode:
                            normalizedBarcode,
                        _id: {
                            $ne: id,
                        },
                    });

                if (duplicateBarcode) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Product barcode already exists",
                    });
                }
            }

            product.barcode =
                normalizedBarcode;
        }

        // =================================================
        // DESCRIPTION
        // =================================================
        if (description !== undefined) {
            product.description =
                description.trim();
        }

        // =================================================
        // CATEGORY
        // =================================================
        if (category !== undefined) {
            if (
                category === null ||
                category === ""
            ) {
                product.category = null;
            } else {
                if (
                    !mongoose.Types.ObjectId.isValid(
                        category
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid category ID",
                    });
                }

                const categoryExists =
                    await Category.findOne({
                        _id: category,
                        company:
                            product.company,
                    });

                if (!categoryExists) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Category not found or does not belong to this company",
                    });
                }

                product.category =
                    category;
            }
        }

        // =================================================
        // BRAND
        // =================================================
        if (brand !== undefined) {
            if (
                brand === null ||
                brand === ""
            ) {
                product.brand = null;
            } else {
                if (
                    !mongoose.Types.ObjectId.isValid(
                        brand
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid brand ID",
                    });
                }

                const brandExists =
                    await Brand.findOne({
                        _id: brand,
                        company:
                            product.company,
                    });

                if (!brandExists) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Brand not found or does not belong to this company",
                    });
                }

                product.brand =
                    brand;
            }
        }

        // =================================================
        // UNIT
        // =================================================
        if (unit !== undefined) {
            if (
                unit === null ||
                unit === ""
            ) {
                product.unit = null;
            } else {
                if (
                    !mongoose.Types.ObjectId.isValid(
                        unit
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid unit ID",
                    });
                }

                const unitExists =
                    await Unit.findOne({
                        _id: unit,
                        company:
                            product.company,
                    });

                if (!unitExists) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Unit not found or does not belong to this company",
                    });
                }

                product.unit =
                    unit;
            }
        }

        // =================================================
        // PURCHASE PRICE
        // =================================================
        if (
            purchasePrice !== undefined
        ) {
            if (
                typeof purchasePrice !==
                    "number" ||
                !Number.isFinite(
                    purchasePrice
                ) ||
                purchasePrice < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Purchase price must be 0 or greater",
                });
            }

            product.purchasePrice =
                purchasePrice;
        }

        // =================================================
        // SELLING PRICE
        // =================================================
        if (
            sellingPrice !== undefined
        ) {
            if (
                typeof sellingPrice !==
                    "number" ||
                !Number.isFinite(
                    sellingPrice
                ) ||
                sellingPrice < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Selling price must be 0 or greater",
                });
            }

            product.sellingPrice =
                sellingPrice;
        }

        // =================================================
        // TAX
        // =================================================
        if (taxRate !== undefined) {
            if (
                typeof taxRate !==
                    "number" ||
                !Number.isFinite(
                    taxRate
                ) ||
                taxRate < 0 ||
                taxRate > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Tax rate must be between 0 and 100",
                });
            }

            product.taxRate =
                taxRate;
        }

        // =================================================
        // OPENING STOCK
        // =================================================
        //
        // This is setup/history information.
        //
        // Actual current stock is NOT updated here.
        //
        // Actual stock is maintained by Stock model.
        //
        if (
            openingStock !== undefined
        ) {
            if (
                typeof openingStock !==
                    "number" ||
                !Number.isFinite(
                    openingStock
                ) ||
                openingStock < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Opening stock must be 0 or greater",
                });
            }

            product.openingStock =
                openingStock;
        }

        // =================================================
        // MINIMUM STOCK
        // =================================================
        if (
            minimumStock !== undefined
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

            product.minimumStock =
                minimumStock;
        }

        // =================================================
        // MAXIMUM STOCK
        // =================================================
        if (
            maximumStock !== undefined
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

            product.maximumStock =
                maximumStock;
        }

        // =================================================
        // FINAL STOCK SETTINGS VALIDATION
        // =================================================
        if (
            product.maximumStock > 0 &&
            product.maximumStock <
                product.minimumStock
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Maximum stock cannot be lower than minimum stock",
            });
        }

        // =================================================
        // ACTIVE STATUS
        // =================================================
        if (isActive !== undefined) {
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

            product.isActive =
                isActive;
        }

        // =================================================
        // SAVE
        // =================================================
        await product.save();

        // =================================================
        // POPULATE
        // =================================================
        await product.populate([
            {
                path: "company",
                select:
                    "name legalName",
            },
            {
                path: "branch",
                select:
                    "name branchCode",
            },
            {
                path: "category",
                select:
                    "name code",
            },
            {
                path: "brand",
                select:
                    "name code",
            },
            {
                path: "unit",
                select:
                    "name code symbol",
            },
            {
                path: "createdBy",
                select:
                    "name email",
            },
        ]);

        return res.status(200).json({
            success: true,
            message:
                "Product updated successfully",
            product,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message:
                    "Product SKU or barcode already exists",
            });
        }

        next(error);
    }
};

// =====================================================
// DELETE PRODUCT
// =====================================================
const deleteProduct = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        const product =
            await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // =================================================
        // PREVENT DELETE IF STOCK EXISTS
        // =================================================
        const stockExists =
            await Stock.exists({
                product: id,
                isActive: true,
            });

        if (stockExists) {
            return res.status(409).json({
                success: false,
                message:
                    "Product cannot be deleted because stock records exist. Deactivate the product instead.",
            });
        }

        await product.deleteOne();

        return res.status(200).json({
            success: true,
            message:
                "Product deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// EXPORTS
// =====================================================
module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
};