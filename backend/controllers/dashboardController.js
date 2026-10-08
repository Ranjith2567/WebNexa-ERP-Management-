const mongoose = require("mongoose");

const User = require("../models/User");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const Warehouse = require("../models/Warehouse");
const Stock = require("../models/Stock");
const SalesInvoice = require("../models/SalesInvoice");
const PurchaseInvoice = require("../models/PurchaseInvoice");
const Expense = require("../models/Expense");
const LedgerEntry = require("../models/LedgerEntry");

// =====================================================
// GET DASHBOARD SUMMARY
// =====================================================

const getDashboardSummary = async (req, res) => {
    try {
        const {
            company,
            branch,
            year,
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

        // =================================================
        // YEAR
        // =================================================

        const selectedYear =
            Number.parseInt(year, 10) ||
            new Date().getFullYear();

        if (
            selectedYear < 2000 ||
            selectedYear > 2100
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid dashboard year.",
            });
        }

        // =================================================
        // OBJECT IDS
        // =================================================

        const companyId =
            new mongoose.Types.ObjectId(company);

        const branchId = branch
            ? new mongoose.Types.ObjectId(branch)
            : null;

        // =================================================
        // DATE RANGE
        // =================================================

        const yearStart = new Date(
            `${selectedYear}-01-01T00:00:00+05:30`
        );

        const yearEnd = new Date(
            `${selectedYear + 1}-01-01T00:00:00+05:30`
        );

        // =================================================
        // COMMON MATCHES
        // =================================================

        const userMatch = {
            company: companyId,
            isActive: true,
        };

        const productMatch = {
            company: companyId,
            isActive: true,
        };

        const customerMatch = {
            company: companyId,
            isActive: true,
        };

        const supplierMatch = {
            company: companyId,
            isActive: true,
        };

        const warehouseMatch = {
            company: companyId,
            isActive: true,
        };

        const stockMatch = {
            company: companyId,
            isActive: true,
        };

        // =================================================
        // SALES
        //
        // Only ISSUED invoices are actual sales.
        // =================================================

        const salesMatch = {
            company: companyId,
            status: "ISSUED",
        };

        // =================================================
        // PURCHASES
        //
        // DRAFT and CANCELLED purchases are not included.
        // =================================================

        const purchaseMatch = {
            company: companyId,
            status: {
                $in: [
                    "POSTED",
                    "PARTIALLY_PAID",
                    "PAID",
                ],
            },
        };

        // =================================================
        // EXPENSES
        //
        // Only approved/paid expenses affect profit.
        // =================================================

        const expenseMatch = {
            company: companyId,
            status: {
                $in: [
                    "APPROVED",
                    "PAID",
                ],
            },
        };

        // =================================================
        // LEDGER
        // =================================================

        const ledgerMatch = {
            company: companyId,
        };

        // =================================================
        // BRANCH FILTER
        // =================================================

        if (branchId) {
            userMatch.branch = branchId;
            productMatch.branch = branchId;
            customerMatch.branch = branchId;
            supplierMatch.branch = branchId;
            warehouseMatch.branch = branchId;
            stockMatch.branch = branchId;
            salesMatch.branch = branchId;
            purchaseMatch.branch = branchId;
            expenseMatch.branch = branchId;
            ledgerMatch.branch = branchId;
        }

        // =================================================
        // ALL DASHBOARD QUERIES
        // =================================================

        const [
            totalUsers,
            totalEmployees,
            totalProducts,
            totalCustomers,
            totalSuppliers,
            totalWarehouses,

            stockSummary,

            salesSummary,
            monthlySalesSummary,

            purchaseSummary,
            monthlyPurchaseSummary,

            expenseSummary,
            monthlyExpenseSummary,

            cogsSummary,

            financeSummary,
        ] = await Promise.all([

            // =================================================
            // USERS
            // =================================================

            User.countDocuments(userMatch),

            // =================================================
            // EMPLOYEES
            // =================================================

            User.countDocuments({
                ...userMatch,
                role: "EMPLOYEE",
            }),

            // =================================================
            // PRODUCTS
            // =================================================

            Product.countDocuments(productMatch),

            // =================================================
            // CUSTOMERS
            // =================================================

            Customer.countDocuments(customerMatch),

            // =================================================
            // SUPPLIERS
            // =================================================

            Supplier.countDocuments(supplierMatch),

            // =================================================
            // WAREHOUSES
            // =================================================

            Warehouse.countDocuments(warehouseMatch),

            // =================================================
            // STOCK SUMMARY
            // =================================================

            Stock.aggregate([
                {
                    $match: stockMatch,
                },

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

                {
                    $match: {
                        "productData.isActive": true,
                    },
                },

                {
                    $addFields: {
                        actualMinimumStock: {
                            $cond: [
                                {
                                    $gt: [
                                        {
                                            $ifNull: [
                                                "$minimumStock",
                                                0,
                                            ],
                                        },
                                        0,
                                    ],
                                },
                                "$minimumStock",
                                {
                                    $ifNull: [
                                        "$productData.minimumStock",
                                        0,
                                    ],
                                },
                            ],
                        },

                        actualMaximumStock: {
                            $cond: [
                                {
                                    $gt: [
                                        {
                                            $ifNull: [
                                                "$maximumStock",
                                                0,
                                            ],
                                        },
                                        0,
                                    ],
                                },
                                "$maximumStock",
                                {
                                    $ifNull: [
                                        "$productData.maximumStock",
                                        0,
                                    ],
                                },
                            ],
                        },

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
                    },
                },

                {
                    $addFields: {
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
                    },
                },

                {
                    $group: {
                        _id: null,

                        totalQuantity: {
                            $sum: {
                                $ifNull: [
                                    "$quantity",
                                    0,
                                ],
                            },
                        },

                        totalReservedQuantity: {
                            $sum: {
                                $ifNull: [
                                    "$reservedQuantity",
                                    0,
                                ],
                            },
                        },

                        totalAvailableQuantity: {
                            $sum: "$availableQuantity",
                        },

                        totalStockValue: {
                            $sum: "$stockValue",
                        },

                        lowStockItems: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            {
                                                $gt: [
                                                    "$availableQuantity",
                                                    0,
                                                ],
                                            },
                                            {
                                                $gt: [
                                                    "$actualMinimumStock",
                                                    0,
                                                ],
                                            },
                                            {
                                                $lte: [
                                                    "$availableQuantity",
                                                    "$actualMinimumStock",
                                                ],
                                            },
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
                                        $lte: [
                                            "$availableQuantity",
                                            0,
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
                                        $and: [
                                            {
                                                $gt: [
                                                    "$actualMaximumStock",
                                                    0,
                                                ],
                                            },
                                            {
                                                $gt: [
                                                    "$quantity",
                                                    "$actualMaximumStock",
                                                ],
                                            },
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]),

            // =================================================
            // TOTAL SALES
            // ALL-TIME
            // =================================================

            SalesInvoice.aggregate([
                {
                    $match: salesMatch,
                },

                {
                    $group: {
                        _id: null,

                        totalSales: {
                            $sum: {
                                $ifNull: [
                                    "$grandTotal",
                                    0,
                                ],
                            },
                        },

                        totalInvoices: {
                            $sum: 1,
                        },
                    },
                },
            ]),

            // =================================================
            // MONTHLY SALES
            //
            // IMPORTANT:
            // invoiceDate is the actual business date.
            // =================================================

            SalesInvoice.aggregate([
                {
                    $match: {
                        ...salesMatch,

                        invoiceDate: {
                            $gte: yearStart,
                            $lt: yearEnd,
                        },
                    },
                },

                {
                    $group: {
                        _id: {
                            $month: {
                                date: "$invoiceDate",
                                timezone: "Asia/Kolkata",
                            },
                        },

                        sales: {
                            $sum: {
                                $ifNull: [
                                    "$grandTotal",
                                    0,
                                ],
                            },
                        },

                        invoices: {
                            $sum: 1,
                        },
                    },
                },

                {
                    $sort: {
                        "_id": 1,
                    },
                },
            ]),

            // =================================================
            // PURCHASE SUMMARY
            // ALL-TIME
            // =================================================

            PurchaseInvoice.aggregate([
                {
                    $match: purchaseMatch,
                },

                {
                    $group: {
                        _id: null,

                        totalPurchases: {
                            $sum: {
                                $ifNull: [
                                    "$totalAmount",
                                    0,
                                ],
                            },
                        },

                        totalInvoices: {
                            $sum: 1,
                        },
                    },
                },
            ]),

            // =================================================
            // MONTHLY PURCHASES
            // =================================================

            PurchaseInvoice.aggregate([
                {
                    $match: {
                        ...purchaseMatch,

                        invoiceDate: {
                            $gte: yearStart,
                            $lt: yearEnd,
                        },
                    },
                },

                {
                    $group: {
                        _id: {
                            $month: {
                                date: "$invoiceDate",
                                timezone: "Asia/Kolkata",
                            },
                        },

                        purchases: {
                            $sum: {
                                $ifNull: [
                                    "$totalAmount",
                                    0,
                                ],
                            },
                        },
                    },
                },

                {
                    $sort: {
                        "_id": 1,
                    },
                },
            ]),

            // =================================================
            // EXPENSE SUMMARY
            // ALL-TIME
            // =================================================

            Expense.aggregate([
                {
                    $match: expenseMatch,
                },

                {
                    $group: {
                        _id: null,

                        totalExpenses: {
                            $sum: {
                                $ifNull: [
                                    "$amount",
                                    0,
                                ],
                            },
                        },

                        totalExpenseEntries: {
                            $sum: 1,
                        },
                    },
                },
            ]),

            // =================================================
            // MONTHLY EXPENSES
            // =================================================

            Expense.aggregate([
                {
                    $match: {
                        ...expenseMatch,

                        expenseDate: {
                            $gte: yearStart,
                            $lt: yearEnd,
                        },
                    },
                },

                {
                    $group: {
                        _id: {
                            $month: {
                                date: "$expenseDate",
                                timezone: "Asia/Kolkata",
                            },
                        },

                        expenses: {
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
                        "_id": 1,
                    },
                },
            ]),

            // =================================================
            // COGS
            //
            // ISSUED SALES
            // quantity × product.purchasePrice
            //
            // NOTE:
            // Product.purchasePrice is current purchase cost.
            // =================================================

            SalesInvoice.aggregate([
                {
                    $match: salesMatch,
                },

                {
                    $unwind: "$items",
                },

                {
                    $lookup: {
                        from: "products",
                        localField: "items.product",
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

                {
                    $group: {
                        _id: null,

                        totalCOGS: {
                            $sum: {
                                $multiply: [
                                    {
                                        $ifNull: [
                                            "$items.quantity",
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
                        },
                    },
                },
            ]),

            // =================================================
            // FINANCE / LEDGER
            // =================================================

            LedgerEntry.aggregate([
                {
                    $match: ledgerMatch,
                },

                {
                    $group: {
                        _id: null,

                        totalDebit: {
                            $sum: {
                                $ifNull: [
                                    "$debit",
                                    0,
                                ],
                            },
                        },

                        totalCredit: {
                            $sum: {
                                $ifNull: [
                                    "$credit",
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]),
        ]);

        // =================================================
        // NORMALIZE STOCK
        // =================================================

        const stock = stockSummary[0] || {
            totalQuantity: 0,
            totalReservedQuantity: 0,
            totalAvailableQuantity: 0,
            totalStockValue: 0,
            lowStockItems: 0,
            outOfStockItems: 0,
            overStockItems: 0,
        };

        // =================================================
        // NORMALIZE SALES
        // =================================================

        const sales = salesSummary[0] || {
            totalSales: 0,
            totalInvoices: 0,
        };

        // =================================================
        // NORMALIZE PURCHASES
        // =================================================

        const purchases = purchaseSummary[0] || {
            totalPurchases: 0,
            totalInvoices: 0,
        };

        // =================================================
        // NORMALIZE EXPENSES
        // =================================================

        const expenses = expenseSummary[0] || {
            totalExpenses: 0,
            totalExpenseEntries: 0,
        };

        // =================================================
        // NORMALIZE COGS
        // =================================================

        const cogs =
            cogsSummary[0] || {
                totalCOGS: 0,
            };

        // =================================================
        // NORMALIZE FINANCE
        // =================================================

        const finance =
            financeSummary[0] || {
                totalDebit: 0,
                totalCredit: 0,
            };

        // =================================================
        // MONTH NAMES
        // =================================================

        const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];

        // =================================================
        // MONTHLY SALES
        // =================================================

        const monthlySalesMap = new Map();

        monthlySalesSummary.forEach((item) => {
            monthlySalesMap.set(
                Number(item._id),
                {
                    sales: Number(item.sales || 0),
                    invoices: Number(
                        item.invoices || 0
                    ),
                }
            );
        });

        const monthlySales = monthNames.map(
            (month, index) => {
                const data =
                    monthlySalesMap.get(index + 1);

                return {
                    month,
                    sales: data?.sales || 0,
                    invoices:
                        data?.invoices || 0,
                };
            }
        );

        // =================================================
        // MONTHLY PURCHASES
        // =================================================

        const monthlyPurchaseMap = new Map();

        monthlyPurchaseSummary.forEach((item) => {
            monthlyPurchaseMap.set(
                Number(item._id),
                Number(item.purchases || 0)
            );
        });

        const monthlyPurchases =
            monthNames.map((month, index) => ({
                month,

                purchases:
                    monthlyPurchaseMap.get(
                        index + 1
                    ) || 0,
            }));

        // =================================================
        // MONTHLY EXPENSES
        // =================================================

        const monthlyExpenseMap = new Map();

        monthlyExpenseSummary.forEach((item) => {
            monthlyExpenseMap.set(
                Number(item._id),
                Number(item.expenses || 0)
            );
        });

        const monthlyExpenses =
            monthNames.map((month, index) => ({
                month,

                expenses:
                    monthlyExpenseMap.get(
                        index + 1
                    ) || 0,
            }));

        // =================================================
        // FINANCIAL CALCULATIONS
        // =================================================

        const totalSales =
            Number(sales.totalSales || 0);

        const totalPurchases =
            Number(
                purchases.totalPurchases || 0
            );

        const totalExpenses =
            Number(
                expenses.totalExpenses || 0
            );

        const totalCOGS =
            Number(cogs.totalCOGS || 0);

        // =================================================
        // GROSS PROFIT
        // =================================================

        const grossProfit =
            totalSales - totalCOGS;

        // =================================================
        // NET PROFIT
        // =================================================

        const netProfit =
            grossProfit - totalExpenses;

        // =================================================
        // LEDGER BALANCE
        // =================================================

        const totalDebit =
            Number(
                finance.totalDebit || 0
            );

        const totalCredit =
            Number(
                finance.totalCredit || 0
            );

        const ledgerDifference =
            totalDebit - totalCredit;

        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({
            success: true,

            data: {
                // =========================================
                // ORGANISATION OVERVIEW
                // =========================================

                overview: {
                    totalUsers,

                    totalEmployees,

                    totalProducts,

                    totalCustomers,

                    totalSuppliers,

                    totalWarehouses,
                },

                // =========================================
                // SALES
                // =========================================

                sales: {
                    totalSales,

                    totalInvoices:
                        sales.totalInvoices,

                    monthlySales,

                    selectedYear,
                },

                // =========================================
                // PURCHASES
                // =========================================

                purchases: {
                    totalPurchases,

                    totalInvoices:
                        purchases.totalInvoices,

                    monthlyPurchases,
                },

                // =========================================
                // EXPENSES
                // =========================================

                expenses: {
                    totalExpenses,

                    totalExpenseEntries:
                        expenses.totalExpenseEntries,

                    monthlyExpenses,
                },

                // =========================================
                // INVENTORY
                // =========================================

                inventory: {
                    totalProducts,

                    totalQuantity:
                        Number(
                            stock.totalQuantity || 0
                        ),

                    totalReservedQuantity:
                        Number(
                            stock.totalReservedQuantity ||
                                0
                        ),

                    totalAvailableQuantity:
                        Number(
                            stock.totalAvailableQuantity ||
                                0
                        ),

                    totalStockValue:
                        Number(
                            stock.totalStockValue || 0
                        ),

                    lowStockItems:
                        Number(
                            stock.lowStockItems || 0
                        ),

                    outOfStockItems:
                        Number(
                            stock.outOfStockItems || 0
                        ),

                    overStockItems:
                        Number(
                            stock.overStockItems || 0
                        ),

                    totalWarehouses:
                        totalWarehouses,
                },

                // =========================================
                // FINANCE
                // =========================================

                finance: {
                    totalDebit,

                    totalCredit,

                    difference:
                        ledgerDifference,
                },

                // =========================================
                // PROFITABILITY
                // =========================================

                profitability: {
                    revenue: totalSales,

                    cogs: totalCOGS,

                    grossProfit,

                    expenses: totalExpenses,

                    netProfit,
                },

                // =========================================
                // DASHBOARD YEAR
                // =========================================

                period: {
                    year: selectedYear,

                    start: yearStart,

                    end: yearEnd,
                },
            },
        });

    } catch (error) {
        console.error(
            "Get Dashboard Summary Error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to fetch dashboard summary.",

            error: error.message,
        });
    }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    getDashboardSummary,
};