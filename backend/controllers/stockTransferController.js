const mongoose = require("mongoose");

const StockTransfer = require("../models/StockTransfer");
const Stock = require("../models/Stock");
const Company = require("../models/Company");
const Branch = require("../models/Branch");
const Warehouse = require("../models/Warehouse");
const Product = require("../models/Product");

// ===============================
// Generate Transfer Number
// ===============================
const generateTransferNumber = async () => {
    const lastTransfer = await StockTransfer.findOne({})
        .sort({ createdAt: -1 })
        .select("transferNumber");

    if (!lastTransfer) {
        return "ST-000001";
    }

    const lastNumber = parseInt(
        lastTransfer.transferNumber.replace("ST-", ""),
        10
    );

    const nextNumber = lastNumber + 1;

    return `ST-${String(nextNumber).padStart(6, "0")}`;
};

// ===============================
// Create Stock Transfer
// ===============================
const createStockTransfer = async (req, res) => {
    try {
        const {
            company,
            branch,
            fromWarehouse,
            toWarehouse,
            product,
            quantity,
            reason = "",
            notes = "",
            transferDate,
        } = req.body;

        // ===============================
        // Required Fields
        // ===============================
        if (
            !company ||
            !branch ||
            !fromWarehouse ||
            !toWarehouse ||
            !product ||
            quantity === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Company, branch, source warehouse, destination warehouse, product and quantity are required",
            });
        }

        // ===============================
        // ObjectId Validation
        // ===============================
        if (
            !mongoose.Types.ObjectId.isValid(company) ||
            !mongoose.Types.ObjectId.isValid(branch) ||
            !mongoose.Types.ObjectId.isValid(fromWarehouse) ||
            !mongoose.Types.ObjectId.isValid(toWarehouse) ||
            !mongoose.Types.ObjectId.isValid(product)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid company, branch, warehouse or product ID",
            });
        }

        // ===============================
        // Quantity Validation
        // ===============================
        if (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Transfer quantity must be greater than 0",
            });
        }

        // ===============================
        // Same Warehouse Check
        // ===============================
        if (
            fromWarehouse.toString() ===
            toWarehouse.toString()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Source and destination warehouse cannot be the same",
            });
        }

        // ===============================
        // Validate Company
        // ===============================
        const companyExists = await Company.findById(company);

        if (!companyExists) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        // ===============================
        // Validate Branch
        // ===============================
        const branchExists = await Branch.findOne({
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

        // ===============================
        // Validate Source Warehouse
        // ===============================
        const sourceWarehouse = await Warehouse.findOne({
            _id: fromWarehouse,
            company,
            branch,
            isActive: true,
        });

        if (!sourceWarehouse) {
            return res.status(400).json({
                success: false,
                message:
                    "Source warehouse not found or inactive",
            });
        }

        // ===============================
        // Validate Destination Warehouse
        // ===============================
        const destinationWarehouse =
            await Warehouse.findOne({
                _id: toWarehouse,
                company,
                branch,
                isActive: true,
            });

        if (!destinationWarehouse) {
            return res.status(400).json({
                success: false,
                message:
                    "Destination warehouse not found or inactive",
            });
        }

        // ===============================
        // Validate Product
        // ===============================
        const productExists = await Product.findOne({
            _id: product,
            company,
            branch,
            isActive: true,
        });

        if (!productExists) {
            return res.status(400).json({
                success: false,
                message:
                    "Product not found or inactive",
            });
        }

        // ===============================
        // Find Source Stock
        // ===============================
        const sourceStock = await Stock.findOne({
            company,
            branch,
            warehouse: fromWarehouse,
            product,
            isActive: true,
        });

        if (!sourceStock) {
            return res.status(400).json({
                success: false,
                message:
                    "Product stock not found in source warehouse",
            });
        }

        // ===============================
        // Available Stock Check
        // ===============================
        const availableQuantity =
            sourceStock.quantity -
            sourceStock.reservedQuantity;

        if (Number(quantity) > availableQuantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient available stock. Available quantity: ${availableQuantity}`,
            });
        }

        // ===============================
        // Generate Transfer Number
        // ===============================
        const transferNumber =
            await generateTransferNumber();

        // ===============================
        // Create Transfer
        // ===============================
        const stockTransfer =
            await StockTransfer.create({
                company,
                branch,
                transferNumber,
                fromWarehouse,
                toWarehouse,
                product,
                quantity: Number(quantity),
                reason,
                notes,
                status: "PENDING",
                transferDate:
                    transferDate || new Date(),
                createdBy: req.user._id,
            });

        // ===============================
        // Populate Response
        // ===============================
        await stockTransfer.populate([
            {
                path: "company",
                select: "name",
            },
            {
                path: "branch",
                select: "name branchCode",
            },
            {
                path: "fromWarehouse",
                select: "name code",
            },
            {
                path: "toWarehouse",
                select: "name code",
            },
            {
                path: "product",
                select:
                    "name sku barcode sellingPrice purchasePrice",
            },
            {
                path: "createdBy",
                select: "name email role",
            },
        ]);

        return res.status(201).json({
            success: true,
            message:
                "Stock transfer created successfully",
            data: stockTransfer,
        });
    } catch (error) {
        console.error(
            "Create Stock Transfer Error:",
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Transfer number already exists. Please try again",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to create stock transfer",
            error: error.message,
        });
    }
};

// ===============================
// Get All Stock Transfers
// ===============================
const getStockTransfers = async (req, res) => {
    try {
        const {
            company,
            branch,
            fromWarehouse,
            toWarehouse,
            product,
            status,
            search,
            page = 1,
            limit = 10,
        } = req.query;

        const filter = {};

        // ===============================
        // Filters
        // ===============================

        if (company) {
            if (!mongoose.Types.ObjectId.isValid(company)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid company ID",
                });
            }

            filter.company = company;
        }

        if (branch) {
            if (!mongoose.Types.ObjectId.isValid(branch)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid branch ID",
                });
            }

            filter.branch = branch;
        }

        if (fromWarehouse) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    fromWarehouse
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid source warehouse ID",
                });
            }

            filter.fromWarehouse = fromWarehouse;
        }

        if (toWarehouse) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    toWarehouse
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid destination warehouse ID",
                });
            }

            filter.toWarehouse = toWarehouse;
        }

        if (product) {
            if (
                !mongoose.Types.ObjectId.isValid(product)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid product ID",
                });
            }

            filter.product = product;
        }

        if (status) {
            const validStatuses = [
                "PENDING",
                "APPROVED",
                "IN_TRANSIT",
                "COMPLETED",
                "CANCELLED",
            ];

            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid transfer status",
                });
            }

            filter.status = status;
        }

        // ===============================
        // Search
        // ===============================
        if (search) {
            const searchRegex = new RegExp(
                search,
                "i"
            );

            const matchingProducts =
                await Product.find({
                    $or: [
                        { name: searchRegex },
                        { sku: searchRegex },
                        { barcode: searchRegex },
                    ],
                }).select("_id");

            const matchingWarehouses =
                await Warehouse.find({
                    $or: [
                        { name: searchRegex },
                        { code: searchRegex },
                    ],
                }).select("_id");

            filter.$or = [
                {
                    transferNumber: searchRegex,
                },
                {
                    reason: searchRegex,
                },
                {
                    product: {
                        $in: matchingProducts.map(
                            (item) => item._id
                        ),
                    },
                },
                {
                    fromWarehouse: {
                        $in: matchingWarehouses.map(
                            (item) => item._id
                        ),
                    },
                },
                {
                    toWarehouse: {
                        $in: matchingWarehouses.map(
                            (item) => item._id
                        ),
                    },
                },
            ];
        }

        // ===============================
        // Pagination
        // ===============================
        const currentPage = Math.max(
            parseInt(page, 10) || 1,
            1
        );

        const perPage = Math.min(
            Math.max(
                parseInt(limit, 10) || 10,
                1
            ),
            100
        );

        const skip =
            (currentPage - 1) * perPage;

        // ===============================
        // Query
        // ===============================
        const [transfers, total] =
            await Promise.all([
                StockTransfer.find(filter)
                    .populate(
                        "company",
                        "name"
                    )
                    .populate(
                        "branch",
                        "name branchCode"
                    )
                    .populate(
                        "fromWarehouse",
                        "name code"
                    )
                    .populate(
                        "toWarehouse",
                        "name code"
                    )
                    .populate(
                        "product",
                        "name sku barcode sellingPrice purchasePrice"
                    )
                    .populate(
                        "createdBy",
                        "name email role"
                    )
                    .populate(
                        "approvedBy",
                        "name email role"
                    )
                    .sort({
                        createdAt: -1,
                    })
                    .skip(skip)
                    .limit(perPage),

                StockTransfer.countDocuments(
                    filter
                ),
            ]);

        return res.status(200).json({
            success: true,
            data: transfers,
            pagination: {
                page: currentPage,
                limit: perPage,
                total,
                pages:
                    Math.ceil(
                        total / perPage
                    ) || 1,
            },
        });
    } catch (error) {
        console.error(
            "Get Stock Transfers Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch stock transfers",
            error: error.message,
        });
    }
};

// ===============================
// Get Stock Transfer By ID
// ===============================
const getStockTransferById = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid stock transfer ID",
            });
        }

        const transfer =
            await StockTransfer.findById(id)
                .populate(
                    "company",
                    "name"
                )
                .populate(
                    "branch",
                    "name branchCode"
                )
                .populate(
                    "fromWarehouse",
                    "name code"
                )
                .populate(
                    "toWarehouse",
                    "name code"
                )
                .populate(
                    "product",
                    "name sku barcode sellingPrice purchasePrice"
                )
                .populate(
                    "createdBy",
                    "name email role"
                )
                .populate(
                    "approvedBy",
                    "name email role"
                );

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message:
                    "Stock transfer not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: transfer,
        });
    } catch (error) {
        console.error(
            "Get Stock Transfer Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch stock transfer",
            error: error.message,
        });
    }
};

// ===============================
// Update Stock Transfer Status
// ===============================
const updateStockTransferStatus = async (
    req,
    res
) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid stock transfer ID",
            });
        }

        const validStatuses = [
            "PENDING",
            "APPROVED",
            "IN_TRANSIT",
            "COMPLETED",
            "CANCELLED",
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid transfer status",
            });
        }

        const transfer =
            await StockTransfer.findById(id);

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message:
                    "Stock transfer not found",
            });
        }

        // ===============================
        // Prevent Changes After Completion
        // ===============================
        if (
            transfer.status === "COMPLETED" ||
            transfer.status === "CANCELLED"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Completed or cancelled transfer cannot be changed",
            });
        }

        // ===============================
        // Status Flow Validation
        // ===============================
        const allowedTransitions = {
            PENDING: ["APPROVED", "CANCELLED"],
            APPROVED: ["IN_TRANSIT", "CANCELLED"],
            IN_TRANSIT: ["COMPLETED"],
        };

        if (
            !allowedTransitions[
                transfer.status
            ]?.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: `Cannot change status from ${transfer.status} to ${status}`,
            });
        }

        // ===============================
        // Approve Transfer
        // ===============================
        if (status === "APPROVED") {
            transfer.approvedBy = req.user._id;
        }

        // ===============================
        // Complete Transfer
        // ===============================
        if (status === "COMPLETED") {
            const sourceStock =
                await Stock.findOne({
                    company:
                        transfer.company,
                    branch:
                        transfer.branch,
                    warehouse:
                        transfer.fromWarehouse,
                    product:
                        transfer.product,
                    isActive: true,
                });

            if (!sourceStock) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Source warehouse stock not found",
                });
            }

            const availableQuantity =
                sourceStock.quantity -
                sourceStock.reservedQuantity;

            if (
                transfer.quantity >
                availableQuantity
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient available stock. Available quantity: ${availableQuantity}`,
                });
            }

            // ===============================
            // Find / Create Destination Stock
            // ===============================
            let destinationStock =
                await Stock.findOne({
                    company:
                        transfer.company,
                    branch:
                        transfer.branch,
                    warehouse:
                        transfer.toWarehouse,
                    product:
                        transfer.product,
                });

            if (!destinationStock) {
                destinationStock =
                    await Stock.create({
                        company:
                            transfer.company,
                        branch:
                            transfer.branch,
                        warehouse:
                            transfer.toWarehouse,
                        product:
                            transfer.product,
                        quantity: 0,
                        reservedQuantity: 0,
                        minimumStock: 0,
                        maximumStock: 0,
                        isActive: true,
                        createdBy:
                            req.user._id,
                    });
            }

            // ===============================
            // Move Stock
            // ===============================
            sourceStock.quantity -=
                transfer.quantity;

            sourceStock.lastStockUpdate =
                new Date();

            destinationStock.quantity +=
                transfer.quantity;

            destinationStock.lastStockUpdate =
                new Date();

            await sourceStock.save();
            await destinationStock.save();

            transfer.completedAt =
                new Date();
        }

        transfer.status = status;

        await transfer.save();

        await transfer.populate([
            {
                path: "company",
                select: "name",
            },
            {
                path: "branch",
                select: "name branchCode",
            },
            {
                path: "fromWarehouse",
                select: "name code",
            },
            {
                path: "toWarehouse",
                select: "name code",
            },
            {
                path: "product",
                select:
                    "name sku barcode sellingPrice purchasePrice",
            },
            {
                path: "createdBy",
                select: "name email role",
            },
            {
                path: "approvedBy",
                select: "name email role",
            },
        ]);

        return res.status(200).json({
            success: true,
            message:
                `Stock transfer ${status.toLowerCase()} successfully`,
            data: transfer,
        });
    } catch (error) {
        console.error(
            "Update Stock Transfer Status Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update stock transfer status",
            error: error.message,
        });
    }
};

// ===============================
// Delete Stock Transfer
// ===============================
const deleteStockTransfer = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid stock transfer ID",
            });
        }

        const transfer =
            await StockTransfer.findById(id);

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message:
                    "Stock transfer not found",
            });
        }

        // Completed transfers should never be deleted
        if (
            transfer.status === "COMPLETED"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Completed stock transfer cannot be deleted",
            });
        }

        await StockTransfer.findByIdAndDelete(
            id
        );

        return res.status(200).json({
            success: true,
            message:
                "Stock transfer deleted successfully",
        });
    } catch (error) {
        console.error(
            "Delete Stock Transfer Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete stock transfer",
            error: error.message,
        });
    }
};

// ===============================
// Exports
// ===============================
module.exports = {
    createStockTransfer,
    getStockTransfers,
    getStockTransferById,
    updateStockTransferStatus,
    deleteStockTransfer,
};