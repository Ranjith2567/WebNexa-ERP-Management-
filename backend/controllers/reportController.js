const mongoose = require("mongoose");

const SalesInvoice = require("../models/SalesInvoice");
const PurchaseInvoice = require("../models/PurchaseInvoice");
const Stock = require("../models/Stock");
const Expense = require("../models/Expense");
const {
    createExcelReport,
} = require("../utils/excelReport");
const {
    createPDFReport,
} = require("../utils/pdfReport");
// =====================================================
// GET SALES REPORT
// =====================================================

const getSalesReport = async (req, res) => {
    try {
        const {
            company,
            branch,
            customer,
            salesPerson,
            status,
            paymentStatus,
            fromDate,
            toDate,
            page = 1,
            limit = 20,
        } = req.query;

        // =================================================
        // VALIDATION
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
            customer &&
            !mongoose.Types.ObjectId.isValid(customer)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID.",
            });
        }

        if (
            salesPerson &&
            !mongoose.Types.ObjectId.isValid(salesPerson)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid sales person ID.",
            });
        }

        // =================================================
        // PAGINATION
        // =================================================

        const currentPage = Math.max(
            Number(page) || 1,
            1
        );

        const currentLimit = Math.min(
            Math.max(Number(limit) || 20, 1),
            100
        );

        const skip =
            (currentPage - 1) * currentLimit;

        // =================================================
        // MATCH FILTER
        // =================================================

        const match = {
            company:
                new mongoose.Types.ObjectId(company),
        };

        if (branch) {
            match.branch =
                new mongoose.Types.ObjectId(branch);
        }

        if (customer) {
            match.customer =
                new mongoose.Types.ObjectId(customer);
        }

        if (salesPerson) {
            match.salesPerson =
                new mongoose.Types.ObjectId(salesPerson);
        }

        // =================================================
        // STATUS FILTER
        // =================================================

        if (status) {
            const allowedStatuses = [
                "DRAFT",
                "ISSUED",
                "CANCELLED",
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid invoice status.",
                });
            }

            match.status = status;
        }

        // =================================================
        // PAYMENT STATUS FILTER
        // =================================================

        if (paymentStatus) {
            const allowedPaymentStatuses = [
                "UNPAID",
                "PARTIALLY_PAID",
                "PAID",
                "OVERDUE",
            ];

            if (
                !allowedPaymentStatuses.includes(
                    paymentStatus
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid payment status.",
                });
            }

            match.paymentStatus =
                paymentStatus;
        }

        // =================================================
        // DATE FILTER
        // =================================================

        if (fromDate || toDate) {
            match.invoiceDate = {};

            if (fromDate) {
                const startDate =
                    new Date(fromDate);

                if (isNaN(startDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid fromDate.",
                    });
                }

                startDate.setHours(
                    0,
                    0,
                    0,
                    0
                );

                match.invoiceDate.$gte =
                    startDate;
            }

            if (toDate) {
                const endDate =
                    new Date(toDate);

                if (isNaN(endDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid toDate.",
                    });
                }

                endDate.setHours(
                    23,
                    59,
                    59,
                    999
                );

                match.invoiceDate.$lte =
                    endDate;
            }
        }

        // =================================================
        // GET TOTAL COUNT
        // =================================================

        const total =
            await SalesInvoice.countDocuments(
                match
            );

        // =================================================
        // GET REPORT DATA
        // =================================================

        const invoices =
            await SalesInvoice.find(match)
                .populate(
                    "customer",
                    "name email phone"
                )
                .populate(
                    "salesPerson",
                    "name email"
                )
                .populate(
                    "branch",
                    "name code"
                )
                .populate(
                    "salesOrder",
                    "orderNumber"
                )
                .sort({
                    invoiceDate: -1,
                    createdAt: -1,
                })
                .skip(skip)
                .limit(currentLimit)
                .lean();

        // =================================================
        // REPORT SUMMARY
        // =================================================

        const summaryResult =
            await SalesInvoice.aggregate([
                {
                    $match: match,
                },

                {
                    $group: {
                        _id: null,

                        totalInvoices: {
                            $sum: 1,
                        },

                        subtotal: {
                            $sum: {
                                $ifNull: [
                                    "$subtotal",
                                    0,
                                ],
                            },
                        },

                        discountAmount: {
                            $sum: {
                                $ifNull: [
                                    "$discountAmount",
                                    0,
                                ],
                            },
                        },

                        taxableAmount: {
                            $sum: {
                                $ifNull: [
                                    "$taxableAmount",
                                    0,
                                ],
                            },
                        },

                        taxAmount: {
                            $sum: {
                                $ifNull: [
                                    "$taxAmount",
                                    0,
                                ],
                            },
                        },

                        grandTotal: {
                            $sum: {
                                $ifNull: [
                                    "$grandTotal",
                                    0,
                                ],
                            },
                        },

                        paidAmount: {
                            $sum: {
                                $ifNull: [
                                    "$paidAmount",
                                    0,
                                ],
                            },
                        },

                        balanceDue: {
                            $sum: {
                                $ifNull: [
                                    "$balanceDue",
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]);

        const summary =
            summaryResult[0] || {
                totalInvoices: 0,
                subtotal: 0,
                discountAmount: 0,
                taxableAmount: 0,
                taxAmount: 0,
                grandTotal: 0,
                paidAmount: 0,
                balanceDue: 0,
            };

        // =================================================
        // PAYMENT STATUS SUMMARY
        // =================================================

        const paymentStatusSummary =
            await SalesInvoice.aggregate([
                {
                    $match: match,
                },

                {
                    $group: {
                        _id: "$paymentStatus",

                        count: {
                            $sum: 1,
                        },

                        amount: {
                            $sum: {
                                $ifNull: [
                                    "$grandTotal",
                                    0,
                                ],
                            },
                        },
                    },
                },

                {
                    $sort: {
                        _id: 1,
                    },
                },
            ]);

        // =================================================
        // FINAL RESPONSE
        // =================================================

        return res.status(200).json({
            success: true,

            data: {
                invoices,

                summary: {
                    totalInvoices:
                        summary.totalInvoices,

                    subtotal:
                        summary.subtotal,

                    discountAmount:
                        summary.discountAmount,

                    taxableAmount:
                        summary.taxableAmount,

                    taxAmount:
                        summary.taxAmount,

                    grandTotal:
                        summary.grandTotal,

                    paidAmount:
                        summary.paidAmount,

                    balanceDue:
                        summary.balanceDue,
                },

                paymentStatusSummary:
                    paymentStatusSummary.map(
                        (item) => ({
                            paymentStatus:
                                item._id,

                            count:
                                item.count,

                            amount:
                                item.amount,
                        })
                    ),
            },

            pagination: {
                total,
                page: currentPage,
                limit: currentLimit,
                totalPages:
                    Math.ceil(
                        total / currentLimit
                    ),
            },
        });

    } catch (error) {
        console.error(
            "Get Sales Report Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch sales report.",
            error: error.message,
        });
    }
};

// =====================================================
// GET PURCHASE REPORT
// =====================================================

const getPurchaseReport = async (req, res) => {
    try {
        const {
            company,
            branch,
            supplier,
            purchaseOrder,
            goodsReceipt,
            status,
            paymentStatus,
            fromDate,
            toDate,
            page = 1,
            limit = 20,
        } = req.query;

        // =================================================
        // VALIDATION
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
            supplier &&
            !mongoose.Types.ObjectId.isValid(supplier)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid supplier ID.",
            });
        }

        if (
            purchaseOrder &&
            !mongoose.Types.ObjectId.isValid(
                purchaseOrder
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid purchase order ID.",
            });
        }

        if (
            goodsReceipt &&
            !mongoose.Types.ObjectId.isValid(
                goodsReceipt
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid goods receipt ID.",
            });
        }

        // =================================================
        // PAGINATION
        // =================================================

        const currentPage = Math.max(
            Number(page) || 1,
            1
        );

        const currentLimit = Math.min(
            Math.max(Number(limit) || 20, 1),
            100
        );

        const skip =
            (currentPage - 1) * currentLimit;

        // =================================================
        // MATCH FILTER
        // =================================================

        const match = {
            company:
                new mongoose.Types.ObjectId(company),
        };

        if (branch) {
            match.branch =
                new mongoose.Types.ObjectId(branch);
        }

        if (supplier) {
            match.supplier =
                new mongoose.Types.ObjectId(supplier);
        }

        if (purchaseOrder) {
            match.purchaseOrder =
                new mongoose.Types.ObjectId(
                    purchaseOrder
                );
        }

        if (goodsReceipt) {
            match.goodsReceipt =
                new mongoose.Types.ObjectId(
                    goodsReceipt
                );
        }

        // =================================================
        // STATUS FILTER
        // =================================================

        if (status) {
            const allowedStatuses = [
                "DRAFT",
                "POSTED",
                "PARTIALLY_PAID",
                "PAID",
                "CANCELLED",
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid purchase invoice status.",
                });
            }

            match.status = status;
        }

        // =================================================
        // PAYMENT STATUS FILTER
        // =================================================

        if (paymentStatus) {
            const allowedPaymentStatuses = [
                "UNPAID",
                "PARTIALLY_PAID",
                "PAID",
                "OVERDUE",
                "CANCELLED",
            ];

            if (
                !allowedPaymentStatuses.includes(
                    paymentStatus
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid payment status.",
                });
            }

            match.paymentStatus =
                paymentStatus;
        }

        // =================================================
        // DATE FILTER
        // =================================================

        if (fromDate || toDate) {
            match.invoiceDate = {};

            if (fromDate) {
                const startDate =
                    new Date(fromDate);

                if (isNaN(startDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid fromDate.",
                    });
                }

                startDate.setHours(
                    0,
                    0,
                    0,
                    0
                );

                match.invoiceDate.$gte =
                    startDate;
            }

            if (toDate) {
                const endDate =
                    new Date(toDate);

                if (isNaN(endDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid toDate.",
                    });
                }

                endDate.setHours(
                    23,
                    59,
                    59,
                    999
                );

                match.invoiceDate.$lte =
                    endDate;
            }
        }

        // =================================================
        // GET TOTAL COUNT
        // =================================================

        const total =
            await PurchaseInvoice.countDocuments(
                match
            );

        // =================================================
        // GET REPORT DATA
        // =================================================

        const invoices =
            await PurchaseInvoice.find(match)
                .populate("supplier")
                .populate(
                    "branch",
                    "name code"
                )
                .populate("purchaseOrder")
                .populate("goodsReceipt")
                .sort({
                    invoiceDate: -1,
                    createdAt: -1,
                })
                .skip(skip)
                .limit(currentLimit)
                .lean();

        // =================================================
        // REPORT SUMMARY
        // =================================================

        const summaryResult =
            await PurchaseInvoice.aggregate([
                {
                    $match: match,
                },

                {
                    $group: {
                        _id: null,

                        totalInvoices: {
                            $sum: 1,
                        },

                        subtotal: {
                            $sum: {
                                $ifNull: [
                                    "$subtotal",
                                    0,
                                ],
                            },
                        },

                        discountAmount: {
                            $sum: {
                                $ifNull: [
                                    "$discountAmount",
                                    0,
                                ],
                            },
                        },

                        taxAmount: {
                            $sum: {
                                $ifNull: [
                                    "$taxAmount",
                                    0,
                                ],
                            },
                        },

                        shippingAmount: {
                            $sum: {
                                $ifNull: [
                                    "$shippingAmount",
                                    0,
                                ],
                            },
                        },

                        otherCharges: {
                            $sum: {
                                $ifNull: [
                                    "$otherCharges",
                                    0,
                                ],
                            },
                        },

                        roundOffAmount: {
                            $sum: {
                                $ifNull: [
                                    "$roundOffAmount",
                                    0,
                                ],
                            },
                        },

                        totalAmount: {
                            $sum: {
                                $ifNull: [
                                    "$totalAmount",
                                    0,
                                ],
                            },
                        },

                        paidAmount: {
                            $sum: {
                                $ifNull: [
                                    "$paidAmount",
                                    0,
                                ],
                            },
                        },

                        dueAmount: {
                            $sum: {
                                $ifNull: [
                                    "$dueAmount",
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]);

        const summary =
            summaryResult[0] || {
                totalInvoices: 0,
                subtotal: 0,
                discountAmount: 0,
                taxAmount: 0,
                shippingAmount: 0,
                otherCharges: 0,
                roundOffAmount: 0,
                totalAmount: 0,
                paidAmount: 0,
                dueAmount: 0,
            };

        // =================================================
        // PAYMENT STATUS SUMMARY
        // =================================================

        const paymentStatusSummary =
            await PurchaseInvoice.aggregate([
                {
                    $match: match,
                },

                {
                    $group: {
                        _id: "$paymentStatus",

                        count: {
                            $sum: 1,
                        },

                        amount: {
                            $sum: {
                                $ifNull: [
                                    "$totalAmount",
                                    0,
                                ],
                            },
                        },

                        paidAmount: {
                            $sum: {
                                $ifNull: [
                                    "$paidAmount",
                                    0,
                                ],
                            },
                        },

                        dueAmount: {
                            $sum: {
                                $ifNull: [
                                    "$dueAmount",
                                    0,
                                ],
                            },
                        },
                    },
                },

                {
                    $sort: {
                        _id: 1,
                    },
                },
            ]);

        // =================================================
        // FINAL RESPONSE
        // =================================================

        return res.status(200).json({
            success: true,

            data: {
                invoices,

                summary: {
                    totalInvoices:
                        summary.totalInvoices,

                    subtotal:
                        summary.subtotal,

                    discountAmount:
                        summary.discountAmount,

                    taxAmount:
                        summary.taxAmount,

                    shippingAmount:
                        summary.shippingAmount,

                    otherCharges:
                        summary.otherCharges,

                    roundOffAmount:
                        summary.roundOffAmount,

                    totalAmount:
                        summary.totalAmount,

                    paidAmount:
                        summary.paidAmount,

                    dueAmount:
                        summary.dueAmount,
                },

                paymentStatusSummary:
                    paymentStatusSummary.map(
                        (item) => ({
                            paymentStatus:
                                item._id,

                            count:
                                item.count,

                            amount:
                                item.amount,

                            paidAmount:
                                item.paidAmount,

                            dueAmount:
                                item.dueAmount,
                        })
                    ),
            },

            pagination: {
                total,
                page: currentPage,
                limit: currentLimit,
                totalPages:
                    Math.ceil(
                        total / currentLimit
                    ),
            },
        });

    } catch (error) {
        console.error(
            "Get Purchase Report Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch purchase report.",
            error: error.message,
        });
    }
};

// =====================================================
// GET INVENTORY / STOCK REPORT
// =====================================================

const getInventoryReport = async (req, res) => {
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
        // VALIDATION
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
            Number(page) || 1,
            1
        );

        const currentLimit = Math.min(
            Math.max(Number(limit) || 20, 1),
            100
        );

        const skip =
            (currentPage - 1) * currentLimit;

        // =================================================
        // BASE MATCH
        // =================================================

        const match = {
            company:
                new mongoose.Types.ObjectId(company),

            isActive: true,
        };

        if (branch) {
            match.branch =
                new mongoose.Types.ObjectId(branch);
        }

        if (warehouse) {
            match.warehouse =
                new mongoose.Types.ObjectId(
                    warehouse
                );
        }

        if (product) {
            match.product =
                new mongoose.Types.ObjectId(product);
        }

        // =================================================
        // BASE PIPELINE
        // =================================================

        const pipeline = [
            {
                $match: match,
            },

            // =============================================
            // PRODUCT LOOKUP
            // =============================================

            {
                $lookup: {
                    from: "products",
                    localField: "product",
                    foreignField: "_id",
                    as: "productData",
                },
            },

            {
                $unwind: "$productData",
            },

            // =============================================
            // WAREHOUSE LOOKUP
            // =============================================

            {
                $lookup: {
                    from: "warehouses",
                    localField: "warehouse",
                    foreignField: "_id",
                    as: "warehouseData",
                },
            },

            {
                $unwind: "$warehouseData",
            },

            // =============================================
            // CATEGORY LOOKUP
            // =============================================

            {
                $lookup: {
                    from: "categories",
                    localField:
                        "productData.category",
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

            // =============================================
            // CATEGORY FILTER
            // =============================================

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

            // =============================================
            // CALCULATED VALUES
            // =============================================

            {
                $addFields: {
                    availableQuantity: {
                        $subtract: [
                            "$quantity",
                            "$reservedQuantity",
                        ],
                    },

                    stockValue: {
                        $multiply: [
                            "$quantity",
                            {
                                $ifNull: [
                                    "$productData.purchasePrice",
                                    0,
                                ],
                            },
                        ],
                    },

                    sellingValue: {
                        $multiply: [
                            "$quantity",
                            {
                                $ifNull: [
                                    "$productData.sellingPrice",
                                    0,
                                ],
                            },
                        ],
                    },

                    potentialProfit: {
                        $subtract: [
                            {
                                $multiply: [
                                    "$quantity",
                                    {
                                        $ifNull: [
                                            "$productData.sellingPrice",
                                            0,
                                        ],
                                    },
                                ],
                            },

                            {
                                $multiply: [
                                    "$quantity",
                                    {
                                        $ifNull: [
                                            "$productData.purchasePrice",
                                            0,
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                },
            },

            // =============================================
            // STOCK STATUS
            // =============================================

            {
                $addFields: {
                    stockStatus: {
                        $switch: {
                            branches: [
                                {
                                    case: {
                                        $lte: [
                                            "$availableQuantity",
                                            0,
                                        ],
                                    },

                                    then:
                                        "OUT_OF_STOCK",
                                },

                                {
                                    case: {
                                        $and: [
                                            {
                                                $gt: [
                                                    "$minimumStock",
                                                    0,
                                                ],
                                            },

                                            {
                                                $lte: [
                                                    "$availableQuantity",
                                                    "$minimumStock",
                                                ],
                                            },
                                        ],
                                    },

                                    then:
                                        "LOW_STOCK",
                                },

                                {
                                    case: {
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

                                    then:
                                        "OVER_STOCK",
                                },
                            ],

                            default: "NORMAL",
                        },
                    },
                },
            },
        ];

        // =================================================
        // STOCK STATUS FILTER
        // =================================================

        if (lowStock === "true") {
            pipeline.push({
                $match: {
                    stockStatus: "LOW_STOCK",
                },
            });
        }

        if (outOfStock === "true") {
            pipeline.push({
                $match: {
                    stockStatus: "OUT_OF_STOCK",
                },
            });
        }

        if (overStock === "true") {
            pipeline.push({
                $match: {
                    stockStatus: "OVER_STOCK",
                },
            });
        }

        // =================================================
        // TOTAL COUNT
        // =================================================

        const countPipeline = [
            ...pipeline,

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
        // REPORT DATA
        // =================================================

        const reportPipeline = [
            ...pipeline,

            {
                $sort: {
                    "productData.name": 1,
                    "warehouseData.name": 1,
                },
            },

            {
                $skip: skip,
            },

            {
                $limit: currentLimit,
            },

            // =============================================
            // FINAL PROJECT
            // =============================================

            {
                $project: {
                    _id: 1,

                    company: 1,

                    branch: 1,

                    warehouse: {
                        _id:
                            "$warehouseData._id",

                        name:
                            "$warehouseData.name",

                        code:
                            "$warehouseData.code",
                    },

                    product: {
                        _id:
                            "$productData._id",

                        name:
                            "$productData.name",

                        sku:
                            "$productData.sku",

                        barcode:
                            "$productData.barcode",

                        purchasePrice:
                            "$productData.purchasePrice",

                        sellingPrice:
                            "$productData.sellingPrice",
                    },

                    category: {
                        _id:
                            "$categoryData._id",

                        name:
                            "$categoryData.name",
                    },

                    quantity: 1,

                    reservedQuantity: 1,

                    availableQuantity: 1,

                    minimumStock: 1,

                    maximumStock: 1,

                    stockStatus: 1,

                    stockValue: 1,

                    sellingValue: 1,

                    potentialProfit: 1,

                    lastStockUpdate: 1,

                    createdAt: 1,

                    updatedAt: 1,
                },
            },
        ];

        const stocks =
            await Stock.aggregate(
                reportPipeline
            );

        // =================================================
        // SUMMARY
        // =================================================

        const summaryPipeline = [
            ...pipeline,

            {
                $group: {
                    _id: null,

                    totalItems: {
                        $sum: 1,
                    },

                    totalQuantity: {
                        $sum: "$quantity",
                    },

                    totalReservedQuantity: {
                        $sum: "$reservedQuantity",
                    },

                    totalAvailableQuantity: {
                        $sum: "$availableQuantity",
                    },

                    totalStockValue: {
                        $sum: "$stockValue",
                    },

                    totalSellingValue: {
                        $sum: "$sellingValue",
                    },

                    totalPotentialProfit: {
                        $sum: "$potentialProfit",
                    },

                    lowStockItems: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$stockStatus",
                                        "LOW_STOCK",
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },

                    outOfStockItems: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$stockStatus",
                                        "OUT_OF_STOCK",
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },

                    overStockItems: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$stockStatus",
                                        "OVER_STOCK",
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },

                    normalStockItems: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$stockStatus",
                                        "NORMAL",
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
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
                      totalItems: 0,

                      totalQuantity: 0,

                      totalReservedQuantity: 0,

                      totalAvailableQuantity: 0,

                      totalStockValue: 0,

                      totalSellingValue: 0,

                      totalPotentialProfit: 0,

                      lowStockItems: 0,

                      outOfStockItems: 0,

                      overStockItems: 0,

                      normalStockItems: 0,
                  };

        // =================================================
        // FINAL RESPONSE
        // =================================================

        return res.status(200).json({
            success: true,

            data: {
                stocks,

                summary: {
                    totalItems:
                        summary.totalItems,

                    totalQuantity:
                        summary.totalQuantity,

                    totalReservedQuantity:
                        summary.totalReservedQuantity,

                    totalAvailableQuantity:
                        summary.totalAvailableQuantity,

                    totalStockValue:
                        summary.totalStockValue,

                    totalSellingValue:
                        summary.totalSellingValue,

                    totalPotentialProfit:
                        summary.totalPotentialProfit,

                    lowStockItems:
                        summary.lowStockItems,

                    outOfStockItems:
                        summary.outOfStockItems,

                    overStockItems:
                        summary.overStockItems,

                    normalStockItems:
                        summary.normalStockItems,
                },
            },

            pagination: {
                total,

                page: currentPage,

                limit: currentLimit,

                totalPages:
                    Math.ceil(
                        total / currentLimit
                    ),
            },
        });

    } catch (error) {
        console.error(
            "Get Inventory Report Error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to fetch inventory report.",

            error: error.message,
        });
    }
};

// =====================================================
// GET EXPENSE REPORT
// =====================================================

const getExpenseReport = async (req, res) => {
    try {
        const {
            company,
            branch,
            category,
            supplier,
            status,
            paymentMethod,
            fromDate,
            toDate,
            page = 1,
            limit = 20,
        } = req.query;

        // =================================================
        // VALIDATION
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
            category &&
            !mongoose.Types.ObjectId.isValid(category)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid expense category ID.",
            });
        }

        if (
            supplier &&
            !mongoose.Types.ObjectId.isValid(supplier)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid supplier ID.",
            });
        }

        // =================================================
        // PAGINATION
        // =================================================

        const currentPage = Math.max(
            Number(page) || 1,
            1
        );

        const currentLimit = Math.min(
            Math.max(Number(limit) || 20, 1),
            100
        );

        const skip =
            (currentPage - 1) * currentLimit;

        // =================================================
        // BASE MATCH
        // =================================================

        const match = {
            company:
                new mongoose.Types.ObjectId(company),
        };

        if (branch) {
            match.branch =
                new mongoose.Types.ObjectId(branch);
        }

        if (category) {
            match.category =
                new mongoose.Types.ObjectId(category);
        }

        if (supplier) {
            match.supplier =
                new mongoose.Types.ObjectId(supplier);
        }

        // =================================================
        // STATUS FILTER
        // =================================================

        if (status) {
            const allowedStatuses = [
                "DRAFT",
                "PENDING",
                "APPROVED",
                "REJECTED",
                "PAID",
                "CANCELLED",
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid expense status.",
                });
            }

            match.status = status;
        }

        // =================================================
        // PAYMENT METHOD FILTER
        // =================================================

        if (paymentMethod) {
            const allowedPaymentMethods = [
                "CASH",
                "BANK_TRANSFER",
                "UPI",
                "CARD",
                "CHEQUE",
                "OTHER",
            ];

            if (
                !allowedPaymentMethods.includes(
                    paymentMethod
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid payment method.",
                });
            }

            match.paymentMethod =
                paymentMethod;
        }

        // =================================================
        // DATE FILTER
        // =================================================

        if (fromDate || toDate) {
            match.expenseDate = {};

            if (fromDate) {
                const startDate =
                    new Date(fromDate);

                if (isNaN(startDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid fromDate.",
                    });
                }

                startDate.setHours(
                    0,
                    0,
                    0,
                    0
                );

                match.expenseDate.$gte =
                    startDate;
            }

            if (toDate) {
                const endDate =
                    new Date(toDate);

                if (isNaN(endDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid toDate.",
                    });
                }

                endDate.setHours(
                    23,
                    59,
                    59,
                    999
                );

                match.expenseDate.$lte =
                    endDate;
            }
        }

        // =================================================
        // TOTAL COUNT
        // =================================================

        const total =
            await Expense.countDocuments(match);

        // =================================================
        // GET REPORT DATA
        // =================================================

        const expenses =
            await Expense.find(match)
                .populate(
                    "category",
                    "name code parentCategory"
                )
                .populate(
                    "branch",
                    "name code"
                )
                .populate(
                    "supplier",
                    "name email phone"
                )
                .populate(
                    "approvedBy",
                    "name email"
                )
                .populate(
                    "paidBy",
                    "name email"
                )
                .populate(
                    "createdBy",
                    "name email"
                )
                .populate(
                    "updatedBy",
                    "name email"
                )
                .sort({
                    expenseDate: -1,
                    createdAt: -1,
                })
                .skip(skip)
                .limit(currentLimit)
                .lean();

        // =================================================
        // OVERALL SUMMARY
        // =================================================

        const summaryResult =
            await Expense.aggregate([
                {
                    $match: match,
                },

                {
                    $group: {
                        _id: null,

                        totalExpenses: {
                            $sum: 1,
                        },

                        totalAmount: {
                            $sum: {
                                $ifNull: [
                                    "$amount",
                                    0,
                                ],
                            },
                        },

                        averageAmount: {
                            $avg: {
                                $ifNull: [
                                    "$amount",
                                    0,
                                ],
                            },
                        },

                        maximumAmount: {
                            $max: {
                                $ifNull: [
                                    "$amount",
                                    0,
                                ],
                            },
                        },

                        minimumAmount: {
                            $min: {
                                $ifNull: [
                                    "$amount",
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]);

        const summary =
            summaryResult[0] || {
                totalExpenses: 0,
                totalAmount: 0,
                averageAmount: 0,
                maximumAmount: 0,
                minimumAmount: 0,
            };

        // =================================================
        // STATUS SUMMARY
        // =================================================

        const statusSummary =
            await Expense.aggregate([
                {
                    $match: match,
                },

                {
                    $group: {
                        _id: "$status",

                        count: {
                            $sum: 1,
                        },

                        amount: {
                            $sum: {
                                $ifNull: [
                                    "$amount",
                                    0,
                                ],
                            },
                        },
                    },
                },

                {
                    $sort: {
                        _id: 1,
                    },
                },
            ]);

        // =================================================
        // PAYMENT METHOD SUMMARY
        // =================================================

        const paymentMethodSummary =
            await Expense.aggregate([
                {
                    $match: match,
                },

                {
                    $group: {
                        _id: "$paymentMethod",

                        count: {
                            $sum: 1,
                        },

                        amount: {
                            $sum: {
                                $ifNull: [
                                    "$amount",
                                    0,
                                ],
                            },
                        },
                    },
                },

                {
                    $sort: {
                        _id: 1,
                    },
                },
            ]);

        // =================================================
        // CATEGORY SUMMARY
        // =================================================

        const categorySummary =
            await Expense.aggregate([
                {
                    $match: match,
                },

                {
                    $group: {
                        _id: "$category",

                        count: {
                            $sum: 1,
                        },

                        amount: {
                            $sum: {
                                $ifNull: [
                                    "$amount",
                                    0,
                                ],
                            },
                        },
                    },
                },

                {
                    $lookup: {
                        from: "expensecategories",

                        localField: "_id",

                        foreignField: "_id",

                        as: "categoryData",
                    },
                },

                {
                    $unwind: {
                        path: "$categoryData",

                        preserveNullAndEmptyArrays:
                            true,
                    },
                },

                {
                    $project: {
                        _id: 0,

                        category: "$_id",

                        categoryName:
                            "$categoryData.name",

                        count: 1,

                        amount: 1,
                    },
                },

                {
                    $sort: {
                        amount: -1,
                    },
                },
            ]);

        // =================================================
        // FINAL RESPONSE
        // =================================================

        return res.status(200).json({
            success: true,

            data: {
                expenses,

                summary: {
                    totalExpenses:
                        summary.totalExpenses,

                    totalAmount:
                        summary.totalAmount,

                    averageAmount:
                        summary.averageAmount || 0,

                    maximumAmount:
                        summary.maximumAmount || 0,

                    minimumAmount:
                        summary.minimumAmount || 0,
                },

                statusSummary:
                    statusSummary.map(
                        (item) => ({
                            status:
                                item._id,

                            count:
                                item.count,

                            amount:
                                item.amount,
                        })
                    ),

                paymentMethodSummary:
                    paymentMethodSummary.map(
                        (item) => ({
                            paymentMethod:
                                item._id,

                            count:
                                item.count,

                            amount:
                                item.amount,
                        })
                    ),

                categorySummary,
            },

            pagination: {
                total,

                page: currentPage,

                limit: currentLimit,

                totalPages:
                    Math.ceil(
                        total / currentLimit
                    ),
            },
        });

    } catch (error) {
        console.error(
            "Get Expense Report Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch expense report.",
            error: error.message,
        });
    }
};
// =====================================================
// EXCEL EXPORT HELPER
// =====================================================

const executeReportForExcel = async ({
    handler,
    req,
}) => {
    let responseStatus = 200;
    let responseBody = null;

    const reportRequest = {
        ...req,
        query: {
            ...req.query,
            page: 1,
            limit: 5000,
        },
    };

    const reportResponse = {
        status(statusCode) {
            responseStatus = statusCode;
            return this;
        },

        json(data) {
            responseBody = data;
            return data;
        },
    };

    await handler(
        reportRequest,
        reportResponse
    );

    return {
        status: responseStatus,
        body: responseBody,
    };
};


// =====================================================
// SEND EXCEL FILE
// =====================================================

const sendExcelFile = ({
    res,
    buffer,
    fileName,
}) => {
    res.set({
        "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        "Content-Disposition":
            `attachment; filename="${fileName}"`,

        "Content-Length":
            buffer.length,
    });

    return res.send(buffer);
};
// =====================================================
// SEND PDF FILE
// =====================================================

const sendPDFFile = ({
    res,
    buffer,
    fileName,
}) => {
    res.set({
        "Content-Type": "application/pdf",

        "Content-Disposition":
            `attachment; filename="${fileName}"`,

        "Content-Length":
            buffer.length,
    });

    return res.send(buffer);
};
// =====================================================
// EXPORT SALES REPORT TO EXCEL
// =====================================================

const exportSalesReportExcel = async (req, res) => {
    try {
        const result =
            await executeReportForExcel({
                handler: getSalesReport,
                req,
            });

        if (
            result.status !== 200 ||
            !result.body ||
            !result.body.success
        ) {
            return res.status(
                result.status || 500
            ).json(
                result.body || {
                    success: false,
                    message:
                        "Failed to generate sales Excel report.",
                }
            );
        }

        const invoices =
            result.body.data?.invoices || [];

        const rows = invoices.map((invoice) => ({
            invoiceNumber:
                invoice.invoiceNumber || "",

            invoiceDate:
                invoice.invoiceDate
                    ? new Date(
                          invoice.invoiceDate
                      ).toLocaleDateString("en-IN")
                    : "",

            customer:
                invoice.customer?.name || "",

            salesPerson:
                invoice.salesPerson?.name || "",

            branch:
                invoice.branch?.name || "",

            salesOrder:
                invoice.salesOrder?.orderNumber || "",

            status:
                invoice.status || "",

            paymentStatus:
                invoice.paymentStatus || "",

            subtotal:
                invoice.subtotal || 0,

            discountAmount:
                invoice.discountAmount || 0,

            taxableAmount:
                invoice.taxableAmount || 0,

            taxAmount:
                invoice.taxAmount || 0,

            grandTotal:
                invoice.grandTotal || 0,

            paidAmount:
                invoice.paidAmount || 0,

            balanceDue:
                invoice.balanceDue || 0,
        }));

        const columns = [
            {
                header: "Invoice Number",
                key: "invoiceNumber",
            },
            {
                header: "Invoice Date",
                key: "invoiceDate",
            },
            {
                header: "Customer",
                key: "customer",
            },
            {
                header: "Sales Person",
                key: "salesPerson",
            },
            {
                header: "Branch",
                key: "branch",
            },
            {
                header: "Sales Order",
                key: "salesOrder",
            },
            {
                header: "Status",
                key: "status",
            },
            {
                header: "Payment Status",
                key: "paymentStatus",
            },
            {
                header: "Subtotal",
                key: "subtotal",
            },
            {
                header: "Discount",
                key: "discountAmount",
            },
            {
                header: "Taxable Amount",
                key: "taxableAmount",
            },
            {
                header: "Tax",
                key: "taxAmount",
            },
            {
                header: "Grand Total",
                key: "grandTotal",
            },
            {
                header: "Paid Amount",
                key: "paidAmount",
            },
            {
                header: "Balance Due",
                key: "balanceDue",
            },
        ];

        const buffer =
            await createExcelReport({
                title:
                    "WebNexa ERP - Sales Report",
                columns,
                rows,
            });

        return sendExcelFile({
            res,
            buffer,
            fileName:
                "webnexa-sales-report.xlsx",
        });

    } catch (error) {
        console.error(
            "Export Sales Excel Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to export sales report to Excel.",
            error: error.message,
        });
    }
};
// =====================================================
// EXPORT SALES REPORT TO PDF
// =====================================================

const exportSalesReportPDF = async (
    req,
    res
) => {
    try {
        const result =
            await executeReportForExcel({
                handler: getSalesReport,
                req,
            });

        if (
            result.status !== 200 ||
            !result.body ||
            !result.body.success
        ) {
            return res.status(
                result.status || 500
            ).json(
                result.body || {
                    success: false,
                    message:
                        "Failed to generate sales PDF report.",
                }
            );
        }

        const invoices =
            result.body.data?.invoices || [];

        const rows = invoices.map((invoice) => ({
            invoiceNumber:
                invoice.invoiceNumber || "",

            invoiceDate:
                invoice.invoiceDate
                    ? new Date(
                          invoice.invoiceDate
                      ).toLocaleDateString("en-IN")
                    : "",

            customer:
                invoice.customer?.name || "",

            salesPerson:
                invoice.salesPerson?.name || "",

            branch:
                invoice.branch?.name || "",

            status:
                invoice.status || "",

            paymentStatus:
                invoice.paymentStatus || "",

            grandTotal:
                invoice.grandTotal || 0,

            paidAmount:
                invoice.paidAmount || 0,

            balanceDue:
                invoice.balanceDue || 0,
        }));

        const columns = [
            {
                header: "Invoice",
                key: "invoiceNumber",
            },
            {
                header: "Date",
                key: "invoiceDate",
            },
            {
                header: "Customer",
                key: "customer",
            },
            {
                header: "Sales Person",
                key: "salesPerson",
            },
            {
                header: "Branch",
                key: "branch",
            },
            {
                header: "Status",
                key: "status",
            },
            {
                header: "Payment",
                key: "paymentStatus",
            },
            {
                header: "Grand Total",
                key: "grandTotal",
            },
            {
                header: "Paid",
                key: "paidAmount",
            },
            {
                header: "Balance",
                key: "balanceDue",
            },
        ];

        const buffer =
            await createPDFReport({
                title:
                    "WebNexa ERP - Sales Report",
                columns,
                rows,
            });

        return sendPDFFile({
            res,
            buffer,
            fileName:
                "webnexa-sales-report.pdf",
        });

    } catch (error) {
        console.error(
            "Export Sales PDF Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to export sales report to PDF.",
            error: error.message,
        });
    }
};
// =====================================================
// EXPORT PURCHASE REPORT TO PDF
// =====================================================

const exportPurchaseReportPDF = async (
    req,
    res
) => {
    try {
        const result =
            await executeReportForExcel({
                handler: getPurchaseReport,
                req,
            });

        if (
            result.status !== 200 ||
            !result.body ||
            !result.body.success
        ) {
            return res.status(
                result.status || 500
            ).json(
                result.body || {
                    success: false,
                    message:
                        "Failed to generate purchase PDF report.",
                }
            );
        }

        const invoices =
            result.body.data?.invoices || [];

        const rows = invoices.map((invoice) => ({
            invoiceNumber:
                invoice.invoiceNumber || "",

            invoiceDate:
                invoice.invoiceDate
                    ? new Date(
                          invoice.invoiceDate
                      ).toLocaleDateString("en-IN")
                    : "",

            supplier:
                invoice.supplier?.name ||
                invoice.supplier?.companyName ||
                "",

            branch:
                invoice.branch?.name || "",

            purchaseOrder:
                invoice.purchaseOrder?.poNumber || "",

            goodsReceipt:
                invoice.goodsReceipt?.grnNumber ||
                invoice.goodsReceipt?.receiptNumber ||
                "",

            status:
                invoice.status || "",

            paymentStatus:
                invoice.paymentStatus || "",

            totalAmount:
                invoice.totalAmount || 0,

            paidAmount:
                invoice.paidAmount || 0,

            dueAmount:
                invoice.dueAmount || 0,
        }));

        const columns = [
            {
                header: "Invoice",
                key: "invoiceNumber",
            },
            {
                header: "Date",
                key: "invoiceDate",
            },
            {
                header: "Supplier",
                key: "supplier",
            },
            {
                header: "Branch",
                key: "branch",
            },
            {
                header: "Purchase Order",
                key: "purchaseOrder",
            },
            {
                header: "Goods Receipt",
                key: "goodsReceipt",
            },
            {
                header: "Status",
                key: "status",
            },
            {
                header: "Payment",
                key: "paymentStatus",
            },
            {
                header: "Total",
                key: "totalAmount",
            },
            {
                header: "Paid",
                key: "paidAmount",
            },
            {
                header: "Due",
                key: "dueAmount",
            },
        ];

        const buffer =
            await createPDFReport({
                title:
                    "WebNexa ERP - Purchase Report",
                columns,
                rows,
            });

        return sendPDFFile({
            res,
            buffer,
            fileName:
                "webnexa-purchase-report.pdf",
        });

    } catch (error) {
        console.error(
            "Export Purchase PDF Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to export purchase report to PDF.",
            error: error.message,
        });
    }
};
// =====================================================
// EXPORT INVENTORY REPORT TO PDF
// =====================================================

const exportInventoryReportPDF = async (
    req,
    res
) => {
    try {
        const result =
            await executeReportForExcel({
                handler: getInventoryReport,
                req,
            });

        if (
            result.status !== 200 ||
            !result.body ||
            !result.body.success
        ) {
            return res.status(
                result.status || 500
            ).json(
                result.body || {
                    success: false,
                    message:
                        "Failed to generate inventory PDF report.",
                }
            );
        }

        const stocks =
            result.body.data?.stocks || [];

        const rows = stocks.map((stock) => ({
            product:
                stock.product?.name || "",

            sku:
                stock.product?.sku || "",

            warehouse:
                stock.warehouse?.name || "",

            quantity:
                stock.quantity || 0,

            reservedQuantity:
                stock.reservedQuantity || 0,

            availableQuantity:
                stock.availableQuantity || 0,

            stockStatus:
                stock.stockStatus || "",

            stockValue:
                stock.stockValue || 0,

            sellingValue:
                stock.sellingValue || 0,

            potentialProfit:
                stock.potentialProfit || 0,
        }));

        const columns = [
            {
                header: "Product",
                key: "product",
            },
            {
                header: "SKU",
                key: "sku",
            },
            {
                header: "Warehouse",
                key: "warehouse",
            },
            {
                header: "Quantity",
                key: "quantity",
            },
            {
                header: "Reserved",
                key: "reservedQuantity",
            },
            {
                header: "Available",
                key: "availableQuantity",
            },
            {
                header: "Status",
                key: "stockStatus",
            },
            {
                header: "Stock Value",
                key: "stockValue",
            },
            {
                header: "Selling Value",
                key: "sellingValue",
            },
            {
                header: "Potential Profit",
                key: "potentialProfit",
            },
        ];

        const buffer =
            await createPDFReport({
                title:
                    "WebNexa ERP - Inventory Report",
                columns,
                rows,
            });

        return sendPDFFile({
            res,
            buffer,
            fileName:
                "webnexa-inventory-report.pdf",
        });

    } catch (error) {
        console.error(
            "Export Inventory PDF Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to export inventory report to PDF.",
            error: error.message,
        });
    }
};
// =====================================================
// EXPORT EXPENSE REPORT TO PDF
// =====================================================

const exportExpenseReportPDF = async (
    req,
    res
) => {
    try {
        const result =
            await executeReportForExcel({
                handler: getExpenseReport,
                req,
            });

        if (
            result.status !== 200 ||
            !result.body ||
            !result.body.success
        ) {
            return res.status(
                result.status || 500
            ).json(
                result.body || {
                    success: false,
                    message:
                        "Failed to generate expense PDF report.",
                }
            );
        }

        const expenses =
            result.body.data?.expenses || [];

        const rows = expenses.map((expense) => ({
            expenseNumber:
                expense.expenseNumber || "",

            expenseDate:
                expense.expenseDate
                    ? new Date(
                          expense.expenseDate
                      ).toLocaleDateString("en-IN")
                    : "",

            description:
                expense.description || "",

            category:
                expense.category?.name || "",

            branch:
                expense.branch?.name || "",

            status:
                expense.status || "",

            paymentMethod:
                expense.paymentMethod || "",

            amount:
                expense.amount || 0,
        }));

        const columns = [
            {
                header: "Expense No",
                key: "expenseNumber",
            },
            {
                header: "Date",
                key: "expenseDate",
            },
            {
                header: "Description",
                key: "description",
            },
            {
                header: "Category",
                key: "category",
            },
            {
                header: "Branch",
                key: "branch",
            },
            {
                header: "Status",
                key: "status",
            },
            {
                header: "Payment Method",
                key: "paymentMethod",
            },
            {
                header: "Amount",
                key: "amount",
            },
        ];

        const buffer =
            await createPDFReport({
                title:
                    "WebNexa ERP - Expense Report",
                columns,
                rows,
            });

        return sendPDFFile({
            res,
            buffer,
            fileName:
                "webnexa-expense-report.pdf",
        });

    } catch (error) {
        console.error(
            "Export Expense PDF Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to export expense report to PDF.",
            error: error.message,
        });
    }
};
// =====================================================
// EXPORT PURCHASE REPORT TO EXCEL
// =====================================================

const exportPurchaseReportExcel = async (
    req,
    res
) => {
    try {
        const result =
            await executeReportForExcel({
                handler: getPurchaseReport,
                req,
            });

        if (
            result.status !== 200 ||
            !result.body ||
            !result.body.success
        ) {
            return res.status(
                result.status || 500
            ).json(
                result.body || {
                    success: false,
                    message:
                        "Failed to generate purchase Excel report.",
                }
            );
        }

        const invoices =
            result.body.data?.invoices || [];

        const rows = invoices.map((invoice) => ({
            invoiceNumber:
                invoice.invoiceNumber || "",

            internalInvoiceNumber:
                invoice.internalInvoiceNumber || "",

            invoiceDate:
                invoice.invoiceDate
                    ? new Date(
                          invoice.invoiceDate
                      ).toLocaleDateString("en-IN")
                    : "",

            supplier:
                invoice.supplier?.name ||
                invoice.supplier?.companyName ||
                "",

            branch:
                invoice.branch?.name || "",

            purchaseOrder:
                invoice.purchaseOrder?.poNumber || "",

            goodsReceipt:
                invoice.goodsReceipt?.grnNumber ||
                invoice.goodsReceipt?.receiptNumber ||
                "",

            status:
                invoice.status || "",

            paymentStatus:
                invoice.paymentStatus || "",

            subtotal:
                invoice.subtotal || 0,

            discountAmount:
                invoice.discountAmount || 0,

            taxAmount:
                invoice.taxAmount || 0,

            shippingAmount:
                invoice.shippingAmount || 0,

            otherCharges:
                invoice.otherCharges || 0,

            roundOffAmount:
                invoice.roundOffAmount || 0,

            totalAmount:
                invoice.totalAmount || 0,

            paidAmount:
                invoice.paidAmount || 0,

            dueAmount:
                invoice.dueAmount || 0,
        }));

        const columns = [
            {
                header: "Invoice Number",
                key: "invoiceNumber",
            },
            {
                header: "Internal Invoice Number",
                key: "internalInvoiceNumber",
            },
            {
                header: "Invoice Date",
                key: "invoiceDate",
            },
            {
                header: "Supplier",
                key: "supplier",
            },
            {
                header: "Branch",
                key: "branch",
            },
            {
                header: "Purchase Order",
                key: "purchaseOrder",
            },
            {
                header: "Goods Receipt",
                key: "goodsReceipt",
            },
            {
                header: "Status",
                key: "status",
            },
            {
                header: "Payment Status",
                key: "paymentStatus",
            },
            {
                header: "Subtotal",
                key: "subtotal",
            },
            {
                header: "Discount",
                key: "discountAmount",
            },
            {
                header: "Tax",
                key: "taxAmount",
            },
            {
                header: "Shipping",
                key: "shippingAmount",
            },
            {
                header: "Other Charges",
                key: "otherCharges",
            },
            {
                header: "Round Off",
                key: "roundOffAmount",
            },
            {
                header: "Total Amount",
                key: "totalAmount",
            },
            {
                header: "Paid Amount",
                key: "paidAmount",
            },
            {
                header: "Due Amount",
                key: "dueAmount",
            },
        ];

        const buffer =
            await createExcelReport({
                title:
                    "WebNexa ERP - Purchase Report",
                columns,
                rows,
            });

        return sendExcelFile({
            res,
            buffer,
            fileName:
                "webnexa-purchase-report.xlsx",
        });

    } catch (error) {
        console.error(
            "Export Purchase Excel Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to export purchase report to Excel.",
            error: error.message,
        });
    }
};
// =====================================================
// EXPORT INVENTORY REPORT TO EXCEL
// =====================================================

const exportInventoryReportExcel = async (
    req,
    res
) => {
    try {
        const result =
            await executeReportForExcel({
                handler: getInventoryReport,
                req,
            });

        if (
            result.status !== 200 ||
            !result.body ||
            !result.body.success
        ) {
            return res.status(
                result.status || 500
            ).json(
                result.body || {
                    success: false,
                    message:
                        "Failed to generate inventory Excel report.",
                }
            );
        }

        const stocks =
            result.body.data?.stocks || [];

        const rows = stocks.map((stock) => ({
            product:
                stock.product?.name || "",

            sku:
                stock.product?.sku || "",

            barcode:
                stock.product?.barcode || "",

            category:
                stock.category?.name ||
                stock.product?.category?.name ||
                "",

            warehouse:
                stock.warehouse?.name || "",

            warehouseCode:
                stock.warehouse?.code || "",

            quantity:
                stock.quantity || 0,

            reservedQuantity:
                stock.reservedQuantity || 0,

            availableQuantity:
                stock.availableQuantity || 0,

            minimumStock:
                stock.minimumStock || 0,

            maximumStock:
                stock.maximumStock || 0,

            stockStatus:
                stock.stockStatus || "",

            purchasePrice:
                stock.purchasePrice || 0,

            sellingPrice:
                stock.sellingPrice || 0,

            stockValue:
                stock.stockValue || 0,

            sellingValue:
                stock.sellingValue || 0,

            potentialProfit:
                stock.potentialProfit || 0,

            lastStockUpdate:
                stock.updatedAt
                    ? new Date(
                          stock.updatedAt
                      ).toLocaleDateString("en-IN")
                    : "",
        }));

        const columns = [
            {
                header: "Product",
                key: "product",
            },
            {
                header: "SKU",
                key: "sku",
            },
            {
                header: "Barcode",
                key: "barcode",
            },
            {
                header: "Category",
                key: "category",
            },
            {
                header: "Warehouse",
                key: "warehouse",
            },
            {
                header: "Warehouse Code",
                key: "warehouseCode",
            },
            {
                header: "Quantity",
                key: "quantity",
            },
            {
                header: "Reserved Quantity",
                key: "reservedQuantity",
            },
            {
                header: "Available Quantity",
                key: "availableQuantity",
            },
            {
                header: "Minimum Stock",
                key: "minimumStock",
            },
            {
                header: "Maximum Stock",
                key: "maximumStock",
            },
            {
                header: "Stock Status",
                key: "stockStatus",
            },
            {
                header: "Purchase Price",
                key: "purchasePrice",
            },
            {
                header: "Selling Price",
                key: "sellingPrice",
            },
            {
                header: "Stock Value",
                key: "stockValue",
            },
            {
                header: "Selling Value",
                key: "sellingValue",
            },
            {
                header: "Potential Profit",
                key: "potentialProfit",
            },
            {
                header: "Last Stock Update",
                key: "lastStockUpdate",
            },
        ];

        const buffer =
            await createExcelReport({
                title:
                    "WebNexa ERP - Inventory Report",
                columns,
                rows,
            });

        return sendExcelFile({
            res,
            buffer,
            fileName:
                "webnexa-inventory-report.xlsx",
        });

    } catch (error) {
        console.error(
            "Export Inventory Excel Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to export inventory report to Excel.",
            error: error.message,
        });
    }
};
// =====================================================
// EXPORT EXPENSE REPORT TO EXCEL
// =====================================================

const exportExpenseReportExcel = async (
    req,
    res
) => {
    try {
        const result =
            await executeReportForExcel({
                handler: getExpenseReport,
                req,
            });

        if (
            result.status !== 200 ||
            !result.body ||
            !result.body.success
        ) {
            return res.status(
                result.status || 500
            ).json(
                result.body || {
                    success: false,
                    message:
                        "Failed to generate expense Excel report.",
                }
            );
        }

        const expenses =
            result.body.data?.expenses || [];

        const rows = expenses.map((expense) => ({
            expenseNumber:
                expense.expenseNumber || "",

            expenseDate:
                expense.expenseDate
                    ? new Date(
                          expense.expenseDate
                      ).toLocaleDateString("en-IN")
                    : "",

            description:
                expense.description || "",

            category:
                expense.category?.name || "",

            supplier:
                expense.supplier?.name ||
                expense.supplier?.companyName ||
                "",

            branch:
                expense.branch?.name || "",

            status:
                expense.status || "",

            paymentMethod:
                expense.paymentMethod || "",

            amount:
                expense.amount || 0,

            approvedBy:
                expense.approvedBy?.name || "",

            paidBy:
                expense.paidBy?.name || "",

            createdBy:
                expense.createdBy?.name || "",
        }));

        const columns = [
            {
                header: "Expense Number",
                key: "expenseNumber",
            },
            {
                header: "Expense Date",
                key: "expenseDate",
            },
            {
                header: "Description",
                key: "description",
            },
            {
                header: "Category",
                key: "category",
            },
            {
                header: "Supplier",
                key: "supplier",
            },
            {
                header: "Branch",
                key: "branch",
            },
            {
                header: "Status",
                key: "status",
            },
            {
                header: "Payment Method",
                key: "paymentMethod",
            },
            {
                header: "Amount",
                key: "amount",
            },
            {
                header: "Approved By",
                key: "approvedBy",
            },
            {
                header: "Paid By",
                key: "paidBy",
            },
            {
                header: "Created By",
                key: "createdBy",
            },
        ];

        const buffer =
            await createExcelReport({
                title:
                    "WebNexa ERP - Expense Report",
                columns,
                rows,
            });

        return sendExcelFile({
            res,
            buffer,
            fileName:
                "webnexa-expense-report.xlsx",
        });

    } catch (error) {
        console.error(
            "Export Expense Excel Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to export expense report to Excel.",
            error: error.message,
        });
    }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    getSalesReport,
    getPurchaseReport,
    getInventoryReport,
    getExpenseReport,
    exportSalesReportExcel,
    exportPurchaseReportExcel,
    exportInventoryReportExcel,
    exportExpenseReportExcel,
    exportSalesReportPDF,
    exportPurchaseReportPDF,
    exportInventoryReportPDF,
    exportExpenseReportPDF,
};