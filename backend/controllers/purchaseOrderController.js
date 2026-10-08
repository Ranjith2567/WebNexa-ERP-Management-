const mongoose = require("mongoose");

const PurchaseOrder = require("../models/PurchaseOrder");
const PurchaseOrderItem = require("../models/PurchaseOrderItem");
const Supplier = require("../models/Supplier");
const Warehouse = require("../models/Warehouse");
const Product = require("../models/Product");
const Company = require("../models/Company");
const Branch = require("../models/Branch");

const {
    createNotification,
} = require("../services/notificationService");

// ============================================================
// Helper Functions
// ============================================================

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const roundAmount = (value) => {
    return Math.round(
        (Number(value) + Number.EPSILON) * 100
    ) / 100;
};

const generatePONumber = async (companyId) => {
    const lastPO = await PurchaseOrder.findOne({
        company: companyId,
    })
        .sort({ createdAt: -1 })
        .select("poNumber");

    let nextNumber = 1;

    if (lastPO && lastPO.poNumber) {
        const match = lastPO.poNumber.match(/(\d+)$/);

        if (match) {
            nextNumber =
                parseInt(match[1], 10) + 1;
        }
    }

    return `PO-${String(nextNumber).padStart(6, "0")}`;
};

const populatePurchaseOrder = async (
    purchaseOrderId
) => {
    return PurchaseOrder.findById(purchaseOrderId)
        .populate(
            "company",
            "name legalName"
        )
        .populate(
            "branch",
            "name branchCode"
        )
        .populate(
            "supplier",
            "supplierCode name companyName email phone"
        )
        .populate(
            "warehouse",
            "name code"
        )
        .populate(
            "createdBy",
            "name email"
        )
        .populate(
            "updatedBy",
            "name email"
        );
};

// ============================================================
// PURCHASE ORDER NOTIFICATION
// ============================================================

const sendPurchaseOrderNotification = async ({
    purchaseOrder,
    recipient,
    event = "CREATED",
}) => {
    try {
        if (!purchaseOrder) {
            return null;
        }

        if (!recipient) {
            return null;
        }

        const poNumber =
            purchaseOrder.poNumber ||
            "Purchase Order";

        const status =
            purchaseOrder.status || "";

        const supplierName =
            purchaseOrder.supplier?.name ||
            purchaseOrder.supplier?.companyName ||
            "Supplier";

        const totalAmount =
            Number(
                purchaseOrder.totalAmount || 0
            ).toFixed(2);

        let title = "";
        let message = "";
        let priority = "MEDIUM";

        switch (event) {
            // ------------------------------------------------
            // CREATED
            // ------------------------------------------------

            case "CREATED":
                title =
                    "Purchase Order Created";

                message =
                    `${poNumber} has been created for ${supplierName}. ` +
                    `Total amount: ${totalAmount}. ` +
                    `Status: ${status}.`;

                break;

            // ------------------------------------------------
            // SUBMITTED FOR APPROVAL
            // ------------------------------------------------

            case "SUBMITTED_FOR_APPROVAL":
                title =
                    "Purchase Order Submitted";

                message =
                    `${poNumber} has been submitted for approval. ` +
                    `Supplier: ${supplierName}. ` +
                    `Total amount: ${totalAmount}.`;

                priority = "HIGH";

                break;

            // ------------------------------------------------
            // UPDATED
            // ------------------------------------------------

            case "UPDATED":
                title =
                    "Purchase Order Updated";

                message =
                    `${poNumber} has been updated. ` +
                    `Current status: ${status}. ` +
                    `Total amount: ${totalAmount}.`;

                break;

            // ------------------------------------------------
            // APPROVED
            // ------------------------------------------------

            case "APPROVED":
                title =
                    "Purchase Order Approved";

                message =
                    `${poNumber} has been approved. ` +
                    `Supplier: ${supplierName}. ` +
                    `Total amount: ${totalAmount}.`;

                priority = "HIGH";

                break;

            default:
                title =
                    "Purchase Order Updated";

                message =
                    `${poNumber} has been updated. ` +
                    `Current status: ${status}.`;
        }

        const notification =
            await createNotification({
                company:
                    purchaseOrder.company,
                branch:
                    purchaseOrder.branch || null,
                recipient,
                type: "PURCHASE_ORDER",
                title,
                message,
                priority,
                referenceType:
                    "PURCHASE_ORDER",
                referenceId:
                    purchaseOrder._id,
                metadata: {
                    event,
                    poNumber,
                    status,

                    supplierId:
                        purchaseOrder.supplier?._id ||
                        purchaseOrder.supplier ||
                        null,

                    supplierName,

                    warehouseId:
                        purchaseOrder.warehouse?._id ||
                        purchaseOrder.warehouse ||
                        null,

                    totalAmount:
                        Number(
                            purchaseOrder.totalAmount ||
                                0
                        ),

                    currency:
                        purchaseOrder.currency ||
                        "INR",
                },
                createdBy: recipient,
            });

        console.log(
            `Purchase Order Notification Created: ${event} - ${poNumber}`
        );

        return notification;
    } catch (error) {
        // ----------------------------------------------------
        // IMPORTANT
        // Notification failure must NOT break
        // the successful Purchase Order operation.
        // ----------------------------------------------------

        console.error(
            "Purchase Order Notification Error:",
            error.message
        );

        return null;
    }
};

// ============================================================
// CREATE PURCHASE ORDER
// POST /api/purchase-orders
// ============================================================

const createPurchaseOrder = async (
    req,
    res,
    next
) => {
    try {
        const {
            company,
            branch,
            supplier,
            warehouse,
            orderDate,
            expectedDeliveryDate,
            paymentTerms,
            currency,
            shippingAmount = 0,
            otherCharges = 0,
            notes = "",
            termsAndConditions = "",
            items,
            status = "DRAFT",
        } = req.body;

        // ----------------------------------------------------
        // Basic validation
        // ----------------------------------------------------

        if (!company) {
            return res.status(400).json({
                success: false,
                message:
                    "Company is required",
            });
        }

        if (!branch) {
            return res.status(400).json({
                success: false,
                message:
                    "Branch is required",
            });
        }

        if (!supplier) {
            return res.status(400).json({
                success: false,
                message:
                    "Supplier is required",
            });
        }

        if (!warehouse) {
            return res.status(400).json({
                success: false,
                message:
                    "Warehouse is required",
            });
        }

        if (!isValidObjectId(company)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid company ID",
            });
        }

        if (!isValidObjectId(branch)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid branch ID",
            });
        }

        if (!isValidObjectId(supplier)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid supplier ID",
            });
        }

        if (!isValidObjectId(warehouse)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid warehouse ID",
            });
        }

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "At least one purchase order item is required",
            });
        }

        // ----------------------------------------------------
        // Validate status
        // ----------------------------------------------------

        const allowedCreateStatuses = [
            "DRAFT",
            "PENDING_APPROVAL",
        ];

        if (
            !allowedCreateStatuses.includes(
                status
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "New purchase order can only be created as DRAFT or PENDING_APPROVAL",
            });
        }

        // ----------------------------------------------------
        // Validate charges
        // ----------------------------------------------------

        if (Number(shippingAmount) < 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Shipping amount cannot be negative",
            });
        }

        if (Number(otherCharges) < 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Other charges cannot be negative",
            });
        }

        // ----------------------------------------------------
        // Validate Company
        // ----------------------------------------------------

        const companyExists =
            await Company.findById(company);

        if (!companyExists) {
            return res.status(404).json({
                success: false,
                message:
                    "Company not found",
            });
        }

        if (!companyExists.isActive) {
            return res.status(400).json({
                success: false,
                message:
                    "Company is inactive",
            });
        }

        // ----------------------------------------------------
        // Validate Branch
        // ----------------------------------------------------

        const branchExists =
            await Branch.findOne({
                _id: branch,
                company,
            });

        if (!branchExists) {
            return res.status(404).json({
                success: false,
                message:
                    "Branch not found for this company",
            });
        }

        if (!branchExists.isActive) {
            return res.status(400).json({
                success: false,
                message:
                    "Branch is inactive",
            });
        }

        // ----------------------------------------------------
        // Validate Supplier
        // ----------------------------------------------------

        const supplierExists =
            await Supplier.findOne({
                _id: supplier,
                company,
                branch,
            });

        if (!supplierExists) {
            return res.status(404).json({
                success: false,
                message:
                    "Supplier not found for this company and branch",
            });
        }

        if (!supplierExists.isActive) {
            return res.status(400).json({
                success: false,
                message:
                    "Supplier is inactive",
            });
        }

        // ----------------------------------------------------
        // Validate Warehouse
        // ----------------------------------------------------

        const warehouseExists =
            await Warehouse.findOne({
                _id: warehouse,
                company,
                branch,
            });

        if (!warehouseExists) {
            return res.status(404).json({
                success: false,
                message:
                    "Warehouse not found for this company and branch",
            });
        }

        if (!warehouseExists.isActive) {
            return res.status(400).json({
                success: false,
                message:
                    "Warehouse is inactive",
            });
        }

        // ----------------------------------------------------
        // Validate dates
        // ----------------------------------------------------

        const finalOrderDate =
            orderDate
                ? new Date(orderDate)
                : new Date();

        if (
            Number.isNaN(
                finalOrderDate.getTime()
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid order date",
            });
        }

        let finalExpectedDeliveryDate =
            null;

        if (expectedDeliveryDate) {
            finalExpectedDeliveryDate =
                new Date(
                    expectedDeliveryDate
                );

            if (
                Number.isNaN(
                    finalExpectedDeliveryDate.getTime()
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid expected delivery date",
                });
            }

            if (
                finalExpectedDeliveryDate <
                finalOrderDate
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Expected delivery date cannot be before order date",
                });
            }
        }

        // ----------------------------------------------------
        // Payment Terms
        // ----------------------------------------------------

        let finalPaymentTerms =
            paymentTerms;

        if (
            finalPaymentTerms ===
                undefined ||
            finalPaymentTerms === null ||
            finalPaymentTerms === ""
        ) {
            finalPaymentTerms =
                supplierExists.paymentTerms ||
                0;
        }

        finalPaymentTerms =
            Number(finalPaymentTerms);

        if (
            !Number.isFinite(
                finalPaymentTerms
            ) ||
            finalPaymentTerms < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment terms must be a valid positive number",
            });
        }

        // ----------------------------------------------------
        // Prevent duplicate products
        // ----------------------------------------------------

        const productIds =
            items.map((item) =>
                String(item.product)
            );

        const uniqueProductIds =
            new Set(productIds);

        if (
            uniqueProductIds.size !==
            productIds.length
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Duplicate products are not allowed in the same purchase order",
            });
        }

        // ----------------------------------------------------
        // Process Items
        // ----------------------------------------------------

        const processedItems = [];

        let subtotal = 0;
        let totalDiscount = 0;
        let totalTax = 0;

        for (
            let i = 0;
            i < items.length;
            i++
        ) {
            const item = items[i];

            if (!item.product) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Product is required for item ${i + 1}`,
                });
            }

            if (
                !isValidObjectId(
                    item.product
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Invalid product ID for item ${i + 1}`,
                });
            }

            const quantity =
                Number(item.quantity);

            const unitPrice =
                Number(item.unitPrice);

            const discountPercentage =
                Number(
                    item.discountPercentage ||
                        0
                );

            const taxPercentage =
                Number(
                    item.taxPercentage ||
                        0
                );

            // ------------------------------------------------
            // Quantity validation
            // ------------------------------------------------

            if (
                !Number.isFinite(
                    quantity
                ) ||
                quantity <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Quantity must be greater than 0 for item ${i + 1}`,
                });
            }

            // ------------------------------------------------
            // Price validation
            // ------------------------------------------------

            if (
                !Number.isFinite(
                    unitPrice
                ) ||
                unitPrice < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Unit price must be a valid number for item ${i + 1}`,
                });
            }

            // ------------------------------------------------
            // Discount validation
            // ------------------------------------------------

            if (
                !Number.isFinite(
                    discountPercentage
                ) ||
                discountPercentage < 0 ||
                discountPercentage > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Discount percentage must be between 0 and 100 for item ${i + 1}`,
                });
            }

            // ------------------------------------------------
            // Tax validation
            // ------------------------------------------------

            if (
                !Number.isFinite(
                    taxPercentage
                ) ||
                taxPercentage < 0 ||
                taxPercentage > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Tax percentage must be between 0 and 100 for item ${i + 1}`,
                });
            }

            // ------------------------------------------------
            // Validate Product
            // ------------------------------------------------

            const productExists =
                await Product.findOne({
                    _id: item.product,
                    company,
                    branch,
                });

            if (!productExists) {
                return res.status(404).json({
                    success: false,
                    message:
                        `Product not found for item ${i + 1}`,
                });
            }

            if (!productExists.isActive) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Product "${productExists.name}" is inactive`,
                });
            }

            // ------------------------------------------------
            // Calculate Line Amounts
            // ------------------------------------------------

            const grossAmount =
                roundAmount(
                    quantity *
                        unitPrice
                );

            const discountAmount =
                roundAmount(
                    grossAmount *
                        (discountPercentage /
                            100)
                );

            const taxableAmount =
                roundAmount(
                    grossAmount -
                        discountAmount
                );

            const taxAmount =
                roundAmount(
                    taxableAmount *
                        (taxPercentage /
                            100)
                );

            const lineTotal =
                roundAmount(
                    taxableAmount +
                        taxAmount
                );

            subtotal =
                roundAmount(
                    subtotal +
                        grossAmount
                );

            totalDiscount =
                roundAmount(
                    totalDiscount +
                        discountAmount
                );

            totalTax =
                roundAmount(
                    totalTax +
                        taxAmount
                );

            processedItems.push({
                company,
                branch,
                purchaseOrder: null,
                product:
                    item.product,
                quantity,
                receivedQuantity: 0,
                pendingQuantity:
                    quantity,
                unitPrice,
                discountPercentage,
                discountAmount,
                taxPercentage,
                taxAmount,
                taxableAmount,
                lineTotal,
                notes:
                    item.notes || "",
            });
        }

        // ----------------------------------------------------
        // Calculate PO Total
        // ----------------------------------------------------

        const finalShippingAmount =
            roundAmount(
                Number(
                    shippingAmount
                )
            );

        const finalOtherCharges =
            roundAmount(
                Number(
                    otherCharges
                )
            );

        const totalAmount =
            roundAmount(
                subtotal -
                    totalDiscount +
                    totalTax +
                    finalShippingAmount +
                    finalOtherCharges
            );

        // ----------------------------------------------------
        // Generate PO Number
        // ----------------------------------------------------

        const poNumber =
            await generatePONumber(
                company
            );

        // ----------------------------------------------------
        // Create Purchase Order
        // ----------------------------------------------------

        const purchaseOrder =
            await PurchaseOrder.create({
                company,
                branch,
                supplier,
                warehouse,
                poNumber,
                orderDate:
                    finalOrderDate,
                expectedDeliveryDate:
                    finalExpectedDeliveryDate,
                paymentTerms:
                    finalPaymentTerms,
                currency:
                    currency || "INR",
                subtotal,
                discountAmount:
                    totalDiscount,
                taxAmount:
                    totalTax,
                shippingAmount:
                    finalShippingAmount,
                otherCharges:
                    finalOtherCharges,
                totalAmount,
                notes,
                termsAndConditions,
                status,
                createdBy:
                    req.user._id,
            });

        // ----------------------------------------------------
        // Attach PO ID to Items
        // ----------------------------------------------------

        const itemDocuments =
            processedItems.map(
                (item) => ({
                    ...item,
                    purchaseOrder:
                        purchaseOrder._id,
                })
            );

        try {
            await PurchaseOrderItem.insertMany(
                itemDocuments
            );
        } catch (itemError) {
            await PurchaseOrder.findByIdAndDelete(
                purchaseOrder._id
            );

            throw itemError;
        }

        // ----------------------------------------------------
        // PURCHASE ORDER NOTIFICATION
        // ----------------------------------------------------

        await sendPurchaseOrderNotification({
            purchaseOrder,
            recipient:
                req.user._id,
            event:
                status ===
                "PENDING_APPROVAL"
                    ? "SUBMITTED_FOR_APPROVAL"
                    : "CREATED",
        });

        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        const populatedPO =
            await populatePurchaseOrder(
                purchaseOrder._id
            );

        const purchaseOrderItems =
            await PurchaseOrderItem.find({
                purchaseOrder:
                    purchaseOrder._id,
            }).populate(
                "product",
                "name sku barcode purchasePrice sellingPrice taxRate"
            );

        return res.status(201).json({
            success: true,
            message:
                "Purchase order created successfully",
            data: {
                purchaseOrder:
                    populatedPO,
                items:
                    purchaseOrderItems,
            },
        });
    } catch (error) {
        if (
            error.code === 11000
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Purchase order number already exists. Please try again.",
            });
        }

        next(error);
    }
};

// ============================================================
// GET ALL PURCHASE ORDERS
// GET /api/purchase-orders
// ============================================================

const getPurchaseOrders = async (
    req,
    res,
    next
) => {
    try {
        const {
            company,
            branch,
            supplier,
            warehouse,
            status,
            search,
            startDate,
            endDate,
            page = 1,
            limit = 10,
        } = req.query;

        const filter = {};

        // ----------------------------------------------------
        // Company
        // ----------------------------------------------------

        if (company) {
            if (
                !isValidObjectId(
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

        // ----------------------------------------------------
        // Branch
        // ----------------------------------------------------

        if (branch) {
            if (
                !isValidObjectId(
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

        // ----------------------------------------------------
        // Supplier
        // ----------------------------------------------------

        if (supplier) {
            if (
                !isValidObjectId(
                    supplier
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid supplier ID",
                });
            }

            filter.supplier =
                supplier;
        }

        // ----------------------------------------------------
        // Warehouse
        // ----------------------------------------------------

        if (warehouse) {
            if (
                !isValidObjectId(
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

        // ----------------------------------------------------
        // Status
        // ----------------------------------------------------

        if (status) {
            const allowedStatuses = [
                "DRAFT",
                "PENDING_APPROVAL",
                "APPROVED",
                "REJECTED",
                "SENT",
                "PARTIALLY_RECEIVED",
                "RECEIVED",
                "CANCELLED",
            ];

            if (
                !allowedStatuses.includes(
                    status
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid purchase order status",
                });
            }

            filter.status =
                status;
        }

        // ----------------------------------------------------
        // Date Filter
        // ----------------------------------------------------

        if (
            startDate ||
            endDate
        ) {
            filter.orderDate =
                {};

            if (startDate) {
                const start =
                    new Date(
                        startDate
                    );

                if (
                    Number.isNaN(
                        start.getTime()
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid start date",
                    });
                }

                start.setHours(
                    0,
                    0,
                    0,
                    0
                );

                filter.orderDate.$gte =
                    start;
            }

            if (endDate) {
                const end =
                    new Date(
                        endDate
                    );

                if (
                    Number.isNaN(
                        end.getTime()
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid end date",
                    });
                }

                end.setHours(
                    23,
                    59,
                    59,
                    999
                );

                filter.orderDate.$lte =
                    end;
            }
        }

        // ----------------------------------------------------
        // Search
        // ----------------------------------------------------

        if (
            search &&
            search.trim()
        ) {
            const searchRegex =
                new RegExp(
                    search.trim(),
                    "i"
                );

            const matchingSuppliers =
                await Supplier.find({
                    $or: [
                        {
                            name:
                                searchRegex,
                        },
                        {
                            supplierCode:
                                searchRegex,
                        },
                        {
                            companyName:
                                searchRegex,
                        },
                    ],
                }).select(
                    "_id"
                );

            filter.$or = [
                {
                    poNumber:
                        searchRegex,
                },
                {
                    supplier: {
                        $in:
                            matchingSuppliers.map(
                                (
                                    supplier
                                ) =>
                                    supplier._id
                            ),
                    },
                },
            ];
        }

        // ----------------------------------------------------
        // Pagination
        // ----------------------------------------------------

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

        const skip =
            (currentPage - 1) *
            perPage;

        // ----------------------------------------------------
        // Query
        // ----------------------------------------------------

        const [
            purchaseOrders,
            total,
        ] =
            await Promise.all([
                PurchaseOrder.find(
                    filter
                )
                    .populate(
                        "company",
                        "name legalName"
                    )
                    .populate(
                        "branch",
                        "name branchCode"
                    )
                    .populate(
                        "supplier",
                        "supplierCode name companyName email phone"
                    )
                    .populate(
                        "warehouse",
                        "name code"
                    )
                    .populate(
                        "createdBy",
                        "name email"
                    )
                    .sort({
                        orderDate: -1,
                        createdAt:
                            -1,
                    })
                    .skip(skip)
                    .limit(perPage),

                PurchaseOrder.countDocuments(
                    filter
                ),
            ]);

        return res.status(200).json({
            success: true,
            count:
                purchaseOrders.length,
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
                purchaseOrders,
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// GET PURCHASE ORDER BY ID
// GET /api/purchase-orders/:id
// ============================================================

const getPurchaseOrderById =
    async (
        req,
        res,
        next
    ) => {
        try {
            const { id } =
                req.params;

            if (
                !isValidObjectId(
                    id
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid purchase order ID",
                });
            }

            const purchaseOrder =
                await populatePurchaseOrder(
                    id
                );

            if (!purchaseOrder) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Purchase order not found",
                });
            }

            const items =
                await PurchaseOrderItem.find(
                    {
                        purchaseOrder:
                            id,
                    }
                )
                    .populate(
                        "product",
                        "name sku barcode purchasePrice sellingPrice taxRate"
                    )
                    .sort({
                        createdAt:
                            1,
                    });

            return res.status(200).json({
                success: true,
                data: {
                    purchaseOrder,
                    items,
                },
            });
        } catch (error) {
            next(error);
        }
    };

// ============================================================
// UPDATE PURCHASE ORDER
// PUT /api/purchase-orders/:id
// ============================================================

const updatePurchaseOrder =
    async (
        req,
        res,
        next
    ) => {
        try {
            const { id } =
                req.params;

            if (
                !isValidObjectId(
                    id
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid purchase order ID",
                });
            }

            const purchaseOrder =
                await PurchaseOrder.findById(
                    id
                );

            if (!purchaseOrder) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Purchase order not found",
                });
            }

            // ------------------------------------------------
            // Capture previous status
            // ------------------------------------------------

            const previousStatus =
                purchaseOrder.status;

            // ------------------------------------------------
            // Only editable statuses
            // ------------------------------------------------

            const editableStatuses = [
                "DRAFT",
                "REJECTED",
            ];

            if (
                !editableStatuses.includes(
                    purchaseOrder.status
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Purchase order cannot be edited when status is ${purchaseOrder.status}`,
                });
            }

            const {
                supplier,
                warehouse,
                orderDate,
                expectedDeliveryDate,
                paymentTerms,
                currency,
                shippingAmount,
                otherCharges,
                notes,
                termsAndConditions,
                items,
                status,
            } = req.body;

            // ------------------------------------------------
            // Supplier validation
            // ------------------------------------------------

            if (
                supplier !==
                undefined
            ) {
                if (
                    !isValidObjectId(
                        supplier
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid supplier ID",
                    });
                }

                const supplierExists =
                    await Supplier.findOne(
                        {
                            _id:
                                supplier,
                            company:
                                purchaseOrder.company,
                            branch:
                                purchaseOrder.branch,
                            isActive:
                                true,
                        }
                    );

                if (!supplierExists) {
                    return res.status(404).json({
                        success: false,
                        message:
                            "Supplier not found for this company and branch",
                    });
                }

                purchaseOrder.supplier =
                    supplier;

                if (
                    paymentTerms ===
                    undefined
                ) {
                    purchaseOrder.paymentTerms =
                        supplierExists.paymentTerms ||
                        0;
                }
            }

            // ------------------------------------------------
            // Warehouse validation
            // ------------------------------------------------

            if (
                warehouse !==
                undefined
            ) {
                if (
                    !isValidObjectId(
                        warehouse
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid warehouse ID",
                    });
                }

                const warehouseExists =
                    await Warehouse.findOne(
                        {
                            _id:
                                warehouse,
                            company:
                                purchaseOrder.company,
                            branch:
                                purchaseOrder.branch,
                            isActive:
                                true,
                        }
                    );

                if (!warehouseExists) {
                    return res.status(404).json({
                        success: false,
                        message:
                            "Warehouse not found for this company and branch",
                    });
                }

                purchaseOrder.warehouse =
                    warehouse;
            }

            // ------------------------------------------------
            // Status
            // ------------------------------------------------

            if (
                status !==
                undefined
            ) {
                const allowedStatuses = [
                    "DRAFT",
                    "PENDING_APPROVAL",
                ];

                if (
                    !allowedStatuses.includes(
                        status
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Purchase order can only be updated to DRAFT or PENDING_APPROVAL",
                    });
                }

                purchaseOrder.status =
                    status;

                if (
                    status ===
                    "DRAFT"
                ) {
                    purchaseOrder.approval.approvedBy =
                        null;

                    purchaseOrder.approval.approvedAt =
                        null;

                    purchaseOrder.approval.rejectionReason =
                        "";
                }
            }

            // ------------------------------------------------
            // Dates
            // ------------------------------------------------

            let finalOrderDate =
                purchaseOrder.orderDate;

            if (
                orderDate !==
                undefined
            ) {
                finalOrderDate =
                    new Date(
                        orderDate
                    );

                if (
                    Number.isNaN(
                        finalOrderDate.getTime()
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid order date",
                    });
                }

                purchaseOrder.orderDate =
                    finalOrderDate;
            }

            if (
                expectedDeliveryDate !==
                undefined
            ) {
                if (
                    expectedDeliveryDate ===
                    null
                ) {
                    purchaseOrder.expectedDeliveryDate =
                        null;
                } else {
                    const deliveryDate =
                        new Date(
                            expectedDeliveryDate
                        );

                    if (
                        Number.isNaN(
                            deliveryDate.getTime()
                        )
                    ) {
                        return res.status(400).json({
                            success: false,
                            message:
                                "Invalid expected delivery date",
                        });
                    }

                    if (
                        deliveryDate <
                        finalOrderDate
                    ) {
                        return res.status(400).json({
                            success: false,
                            message:
                                "Expected delivery date cannot be before order date",
                        });
                    }

                    purchaseOrder.expectedDeliveryDate =
                        deliveryDate;
                }
            }

            // ------------------------------------------------
            // Basic fields
            // ------------------------------------------------

            if (
                paymentTerms !==
                undefined
            ) {
                const finalPaymentTerms =
                    Number(
                        paymentTerms
                    );

                if (
                    !Number.isFinite(
                        finalPaymentTerms
                    ) ||
                    finalPaymentTerms <
                        0
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Payment terms must be a valid positive number",
                    });
                }

                purchaseOrder.paymentTerms =
                    finalPaymentTerms;
            }

            if (
                currency !==
                undefined
            ) {
                purchaseOrder.currency =
                    String(
                        currency
                    ).toUpperCase();
            }

            if (
                notes !==
                undefined
            ) {
                purchaseOrder.notes =
                    notes;
            }

            if (
                termsAndConditions !==
                undefined
            ) {
                purchaseOrder.termsAndConditions =
                    termsAndConditions;
            }

            // ------------------------------------------------
            // Charges
            // ------------------------------------------------

            if (
                shippingAmount !==
                undefined
            ) {
                const amount =
                    Number(
                        shippingAmount
                    );

                if (
                    !Number.isFinite(
                        amount
                    ) ||
                    amount < 0
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Shipping amount must be valid and cannot be negative",
                    });
                }

                purchaseOrder.shippingAmount =
                    roundAmount(
                        amount
                    );
            }

            if (
                otherCharges !==
                undefined
            ) {
                const amount =
                    Number(
                        otherCharges
                    );

                if (
                    !Number.isFinite(
                        amount
                    ) ||
                    amount < 0
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Other charges must be valid and cannot be negative",
                    });
                }

                purchaseOrder.otherCharges =
                    roundAmount(
                        amount
                    );
            }

            // ------------------------------------------------
            // Update Items
            // ------------------------------------------------

            if (
                items !==
                undefined
            ) {
                if (
                    !Array.isArray(
                        items
                    ) ||
                    items.length ===
                        0
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "At least one purchase order item is required",
                    });
                }

                const productIds =
                    items.map(
                        (item) =>
                            String(
                                item.product
                            )
                    );

                if (
                    new Set(
                        productIds
                    ).size !==
                    productIds.length
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Duplicate products are not allowed in the same purchase order",
                    });
                }

                const processedItems =
                    [];

                let subtotal =
                    0;

                let totalDiscount =
                    0;

                let totalTax =
                    0;

                for (
                    let i = 0;
                    i <
                    items.length;
                    i++
                ) {
                    const item =
                        items[i];

                    if (
                        !item.product ||
                        !isValidObjectId(
                            item.product
                        )
                    ) {
                        return res.status(400).json({
                            success: false,
                            message:
                                `Invalid product for item ${i + 1}`,
                        });
                    }

                    const quantity =
                        Number(
                            item.quantity
                        );

                    const unitPrice =
                        Number(
                            item.unitPrice
                        );

                    const discountPercentage =
                        Number(
                            item.discountPercentage ||
                                0
                        );

                    const taxPercentage =
                        Number(
                            item.taxPercentage ||
                                0
                        );

                    if (
                        !Number.isFinite(
                            quantity
                        ) ||
                        quantity <=
                            0
                    ) {
                        return res.status(400).json({
                            success: false,
                            message:
                                `Quantity must be greater than 0 for item ${i + 1}`,
                        });
                    }

                    if (
                        !Number.isFinite(
                            unitPrice
                        ) ||
                        unitPrice <
                            0
                    ) {
                        return res.status(400).json({
                            success: false,
                            message:
                                `Unit price is invalid for item ${i + 1}`,
                        });
                    }

                    if (
                        !Number.isFinite(
                            discountPercentage
                        ) ||
                        discountPercentage <
                            0 ||
                        discountPercentage >
                            100
                    ) {
                        return res.status(400).json({
                            success: false,
                            message:
                                `Discount percentage is invalid for item ${i + 1}`,
                        });
                    }

                    if (
                        !Number.isFinite(
                            taxPercentage
                        ) ||
                        taxPercentage <
                            0 ||
                        taxPercentage >
                            100
                    ) {
                        return res.status(400).json({
                            success: false,
                            message:
                                `Tax percentage is invalid for item ${i + 1}`,
                        });
                    }

                    const productExists =
                        await Product.findOne(
                            {
                                _id:
                                    item.product,
                                company:
                                    purchaseOrder.company,
                                branch:
                                    purchaseOrder.branch,
                                isActive:
                                    true,
                            }
                        );

                    if (
                        !productExists
                    ) {
                        return res.status(404).json({
                            success: false,
                            message:
                                `Product not found for item ${i + 1}`,
                        });
                    }

                    const grossAmount =
                        roundAmount(
                            quantity *
                                unitPrice
                        );

                    const discountAmount =
                        roundAmount(
                            grossAmount *
                                (discountPercentage /
                                    100)
                        );

                    const taxableAmount =
                        roundAmount(
                            grossAmount -
                                discountAmount
                        );

                    const taxAmount =
                        roundAmount(
                            taxableAmount *
                                (taxPercentage /
                                    100)
                        );

                    const lineTotal =
                        roundAmount(
                            taxableAmount +
                                taxAmount
                        );

                    subtotal =
                        roundAmount(
                            subtotal +
                                grossAmount
                        );

                    totalDiscount =
                        roundAmount(
                            totalDiscount +
                                discountAmount
                        );

                    totalTax =
                        roundAmount(
                            totalTax +
                                taxAmount
                        );

                    processedItems.push(
                        {
                            company:
                                purchaseOrder.company,

                            branch:
                                purchaseOrder.branch,

                            purchaseOrder:
                                purchaseOrder._id,

                            product:
                                item.product,

                            quantity,

                            receivedQuantity:
                                0,

                            pendingQuantity:
                                quantity,

                            unitPrice,

                            discountPercentage,

                            discountAmount,

                            taxPercentage,

                            taxAmount,

                            taxableAmount,

                            lineTotal,

                            notes:
                                item.notes ||
                                "",
                        }
                    );
                }

                const totalAmount =
                    roundAmount(
                        subtotal -
                            totalDiscount +
                            totalTax +
                            purchaseOrder.shippingAmount +
                            purchaseOrder.otherCharges
                    );

                purchaseOrder.subtotal =
                    subtotal;

                purchaseOrder.discountAmount =
                    totalDiscount;

                purchaseOrder.taxAmount =
                    totalTax;

                purchaseOrder.totalAmount =
                    totalAmount;

                await PurchaseOrderItem.deleteMany(
                    {
                        purchaseOrder:
                            purchaseOrder._id,
                    }
                );

                await PurchaseOrderItem.insertMany(
                    processedItems
                );
            }

            // ------------------------------------------------
            // Updated By
            // ------------------------------------------------

            purchaseOrder.updatedBy =
                req.user._id;

            await purchaseOrder.save();

            // ------------------------------------------------
            // PURCHASE ORDER NOTIFICATION
            // ------------------------------------------------

            let notificationEvent =
                "UPDATED";

            if (
                previousStatus !==
                purchaseOrder.status
            ) {
                if (
                    previousStatus ===
                        "DRAFT" &&
                    purchaseOrder.status ===
                        "PENDING_APPROVAL"
                ) {
                    notificationEvent =
                        "SUBMITTED_FOR_APPROVAL";
                }
            }

            await sendPurchaseOrderNotification(
                {
                    purchaseOrder,
                    recipient:
                        req.user._id,
                    event:
                        notificationEvent,
                }
            );

            const populatedPO =
                await populatePurchaseOrder(
                    purchaseOrder._id
                );

            const updatedItems =
                await PurchaseOrderItem.find(
                    {
                        purchaseOrder:
                            purchaseOrder._id,
                    }
                ).populate(
                    "product",
                    "name sku barcode purchasePrice sellingPrice taxRate"
                );

            return res.status(200).json({
                success: true,
                message:
                    "Purchase order updated successfully",
                data: {
                    purchaseOrder:
                        populatedPO,
                    items:
                        updatedItems,
                },
            });
        } catch (error) {
            next(error);
        }
    };

// ============================================================
// APPROVE PURCHASE ORDER
// PATCH /api/purchase-orders/:id/approve
// ============================================================

const approvePurchaseOrder =
    async (
        req,
        res,
        next
    ) => {
        try {
            const { id } =
                req.params;

            // ------------------------------------------------
            // Validate ID
            // ------------------------------------------------

            if (
                !isValidObjectId(
                    id
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid purchase order ID",
                });
            }

            // ------------------------------------------------
            // Find Purchase Order
            // ------------------------------------------------

            const purchaseOrder =
                await PurchaseOrder.findById(
                    id
                );

            if (!purchaseOrder) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Purchase order not found",
                });
            }

            // ------------------------------------------------
            // Approval status validation
            // ------------------------------------------------

            if (
                purchaseOrder.status !==
                "PENDING_APPROVAL"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Only purchase orders pending approval can be approved",
                });
            }

            // ------------------------------------------------
            // Approve
            // ------------------------------------------------

            purchaseOrder.status =
                "APPROVED";

            purchaseOrder.approval.approvedBy =
                req.user._id;

            purchaseOrder.approval.approvedAt =
                new Date();

            purchaseOrder.approval.rejectionReason =
                "";

            purchaseOrder.updatedBy =
                req.user._id;

            await purchaseOrder.save();

            // ------------------------------------------------
            // PURCHASE ORDER NOTIFICATION
            // ------------------------------------------------

            await sendPurchaseOrderNotification(
                {
                    purchaseOrder,
                    recipient:
                        req.user._id,
                    event:
                        "APPROVED",
                }
            );

            // ------------------------------------------------
            // Populate Response
            // ------------------------------------------------

            const populatedPO =
                await populatePurchaseOrder(
                    purchaseOrder._id
                );

            const items =
                await PurchaseOrderItem.find(
                    {
                        purchaseOrder:
                            purchaseOrder._id,
                    }
                )
                    .populate(
                        "product",
                        "name sku barcode purchasePrice sellingPrice taxRate"
                    )
                    .sort({
                        createdAt:
                            1,
                    });

            return res.status(200).json({
                success: true,
                message:
                    "Purchase order approved successfully",
                data: {
                    purchaseOrder:
                        populatedPO,
                    items,
                },
            });
        } catch (error) {
            next(error);
        }
    };

// ============================================================
// DELETE PURCHASE ORDER
// DELETE /api/purchase-orders/:id
// ============================================================

const deletePurchaseOrder =
    async (
        req,
        res,
        next
    ) => {
        try {
            const { id } =
                req.params;

            if (
                !isValidObjectId(
                    id
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid purchase order ID",
                });
            }

            const purchaseOrder =
                await PurchaseOrder.findById(
                    id
                );

            if (!purchaseOrder) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Purchase order not found",
                });
            }

            // ------------------------------------------------
            // Only Draft / Rejected can be deleted
            // ------------------------------------------------

            const deletableStatuses = [
                "DRAFT",
                "REJECTED",
            ];

            if (
                !deletableStatuses.includes(
                    purchaseOrder.status
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Purchase order cannot be deleted when status is ${purchaseOrder.status}. Cancel it instead.`,
                });
            }

            // ------------------------------------------------
            // Delete Items
            // ------------------------------------------------

            await PurchaseOrderItem.deleteMany(
                {
                    purchaseOrder:
                        id,
                }
            );

            // ------------------------------------------------
            // Delete PO
            // ------------------------------------------------

            await PurchaseOrder.findByIdAndDelete(
                id
            );

            return res.status(200).json({
                success: true,
                message:
                    "Purchase order deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    };

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    createPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrderById,
    updatePurchaseOrder,
    deletePurchaseOrder,
    approvePurchaseOrder,
};