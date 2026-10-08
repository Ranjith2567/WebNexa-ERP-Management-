const mongoose = require("mongoose");

const PurchaseReturn = require("../models/PurchaseReturn");
const PurchaseReturnItem = require("../models/PurchaseReturnItem");

const PurchaseOrder = require("../models/PurchaseOrder");
const PurchaseOrderItem = require("../models/PurchaseOrderItem");

const GoodsReceipt = require("../models/GoodsReceipt");
const GoodsReceiptItem = require("../models/GoodsReceiptItem");

const PurchaseInvoice = require("../models/PurchaseInvoice");
const PurchaseInvoiceItem = require("../models/PurchaseInvoiceItem");

const Supplier = require("../models/Supplier");
const Product = require("../models/Product");
const Warehouse = require("../models/Warehouse");

const { decreaseStock } = require("../services/stockService");

const {
    createNotification,
    createStockNotification,
} = require("../services/notificationService");

const { withTransaction } = require("../utils/withTransaction");

const {
    createApprovalRequest,
    registerApprovalHandler,
} = require("../services/approvalService");

const {
    createCreateAuditLog,
    createApprovalAuditLog,
    createRejectionAuditLog,
    createDeleteAuditLog,
} = require("../services/auditLogService");

// ======================================================
// Helpers
// ======================================================

const isValidObjectId = (id) =>
    mongoose.Types.ObjectId.isValid(id);

const roundAmount = (value) =>
    Math.round(
        (Number(value) + Number.EPSILON) * 100
    ) / 100;

// ======================================================
// Purchase Return Notification
// ======================================================

const sendPurchaseReturnNotification = async ({
    purchaseReturn,
    supplier,
    recipient,
    event,
}) => {
    try {
        if (
            !purchaseReturn ||
            !recipient ||
            !event
        ) {
            return;
        }

        let title = "";
        let message = "";
        let priority = "MEDIUM";

        const supplierName =
            supplier?.name ||
            supplier?.companyName ||
            "Unknown Supplier";

        const returnNumber =
            purchaseReturn.returnNumber ||
            "Purchase Return";

        const totalAmount =
            roundAmount(
                purchaseReturn.totalAmount || 0
            );

        const totalQuantity =
            Number(
                purchaseReturn.totalQuantity || 0
            );

        switch (event) {
            case "CREATED":
                title =
                    "Purchase Return Created";

                message =
                    `Purchase return ${returnNumber} has been created for supplier ${supplierName} and is pending approval. ` +
                    `Return amount: ${totalAmount}.`;

                priority = "MEDIUM";
                break;

            case "PROCESSED":
                title =
                    "Purchase Return Approved";

                message =
                    `Purchase return ${returnNumber} has been approved and processed. ` +
                    `${totalQuantity} item(s) returned to supplier ${supplierName}. ` +
                    `Return amount: ${totalAmount}.`;

                priority = "HIGH";
                break;

            case "REJECTED":
                title =
                    "Purchase Return Rejected";

                message =
                    `Purchase return ${returnNumber} for supplier ${supplierName} has been rejected.`;

                priority = "HIGH";
                break;

            default:
                return;
        }

        await createNotification({
            company:
                purchaseReturn.company?._id ||
                purchaseReturn.company,

            branch:
                purchaseReturn.branch?._id ||
                purchaseReturn.branch ||
                null,

            recipient,

            type:
                "PURCHASE_RETURN",

            title,
            message,

            priority,

            referenceType:
                "PURCHASE_RETURN",

            referenceId:
                purchaseReturn._id,

            metadata: {
                event,

                purchaseReturnId:
                    purchaseReturn._id,

                returnNumber,

                supplierId:
                    supplier?._id ||
                    purchaseReturn.supplier ||
                    null,

                supplierName,

                purchaseOrderId:
                    purchaseReturn.purchaseOrder?._id ||
                    purchaseReturn.purchaseOrder ||
                    null,

                goodsReceiptId:
                    purchaseReturn.goodsReceipt?._id ||
                    purchaseReturn.goodsReceipt ||
                    null,

                purchaseInvoiceId:
                    purchaseReturn.purchaseInvoice?._id ||
                    purchaseReturn.purchaseInvoice ||
                    null,

                returnDate:
                    purchaseReturn.returnDate ||
                    null,

                reason:
                    purchaseReturn.reason ||
                    "",

                creditNoteNumber:
                    purchaseReturn.creditNoteNumber ||
                    "",

                totalQuantity,

                subtotal:
                    roundAmount(
                        purchaseReturn.subtotal || 0
                    ),

                discountAmount:
                    roundAmount(
                        purchaseReturn.discountAmount || 0
                    ),

                taxAmount:
                    roundAmount(
                        purchaseReturn.taxAmount || 0
                    ),

                totalAmount,

                refundAmount:
                    roundAmount(
                        purchaseReturn.refundAmount || 0
                    ),

                status:
                    purchaseReturn.status ||
                    "",

                rejectionReason:
                    purchaseReturn.rejectionReason ||
                    "",
            },

            createdBy:
                recipient,
        });
    } catch (error) {
        console.error(
            "Purchase Return Notification Error:",
            error.message
        );
    }
};

// ======================================================
// Purchase Return Stock Notifications
// ======================================================

const sendPurchaseReturnStockNotifications = async ({
    purchaseReturn,
    stockResults = [],
    recipient,
    createdBy,
}) => {
    try {
        if (
            !purchaseReturn ||
            !recipient ||
            !Array.isArray(stockResults) ||
            stockResults.length === 0
        ) {
            return;
        }

        for (const result of stockResults) {
            try {
                if (
                    !result?.stock ||
                    !result?.product
                ) {
                    continue;
                }

                const product =
                    await Product.findOne({
                        _id:
                            result.product,

                        company:
                            purchaseReturn.company,

                        isActive: true,
                    });

                if (!product) {
                    console.error(
                        `Product not found for stock notification: ${result.product}`
                    );

                    continue;
                }

                const warehouseId =
                    result.stock.warehouse;

                if (!warehouseId) {
                    console.error(
                        `Warehouse missing for stock notification: ${result.stock._id}`
                    );

                    continue;
                }

                const warehouse =
                    await Warehouse.findOne({
                        _id:
                            warehouseId,

                        company:
                            purchaseReturn.company,

                        branch:
                            purchaseReturn.branch,
                    });

                if (!warehouse) {
                    console.error(
                        `Warehouse not found for stock notification: ${warehouseId}`
                    );

                    continue;
                }

                await createStockNotification({
                    company:
                        purchaseReturn.company,

                    branch:
                        purchaseReturn.branch,

                    recipient,

                    stock:
                        result.stock,

                    product,

                    warehouse,

                    createdBy,
                });
            } catch (error) {
                console.error(
                    "Purchase Return Stock Notification Error:",
                    error.message
                );
            }
        }
    } catch (error) {
        console.error(
            "Purchase Return Stock Notifications Error:",
            error.message
        );
    }
};

// ======================================================
// Generate Return Number
// ======================================================

const generateReturnNumber = async (
    company,
    session = null
) => {
    const query = PurchaseReturn.findOne({
        company,
    })
        .sort({ createdAt: -1 })
        .select("returnNumber");

    if (session) {
        query.session(session);
    }

    const lastReturn = await query;

    if (!lastReturn) {
        return "PR-000001";
    }

    const match =
        lastReturn.returnNumber?.match(
            /(\d+)$/
        );

    const nextNumber = match
        ? Number(match[1]) + 1
        : 1;

    return `PR-${String(nextNumber).padStart(
        6,
        "0"
    )}`;
};

// ======================================================
// Populate Purchase Return
// ======================================================

const populatePurchaseReturn = async (id) => {
    return PurchaseReturn.findById(id)
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
            "purchaseOrder",
            "poNumber orderDate totalAmount status"
        )
        .populate(
            "goodsReceipt",
            "grnNumber receiptDate totalQuantity totalAmount status warehouse"
        )
        .populate(
            "purchaseInvoice",
            "invoiceNumber internalInvoiceNumber invoiceDate totalAmount paidAmount dueAmount status goodsReceipt"
        )
        .populate(
            "approval.approvedBy",
            "name email"
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

// ======================================================
// CREATE PURCHASE RETURN
// ======================================================

const createPurchaseReturn = async (
    req,
    res,
    next
) => {
    try {
        const {
            company,
            branch,
            supplier,
            purchaseOrder,
            goodsReceipt,
            purchaseInvoice,
            returnDate,
            reason,
            creditNoteNumber,
            notes,
            items,
        } = req.body;

        if (
            !company ||
            !branch ||
            !supplier
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Company, branch and supplier are required",
            });
        }

        if (
            !items ||
            !Array.isArray(items)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Return items are required",
            });
        }

        if (items.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "At least one return item is required",
            });
        }

        const idsToValidate = [
            company,
            branch,
            supplier,
        ];

        if (purchaseOrder) {
            idsToValidate.push(
                purchaseOrder
            );
        }

        if (goodsReceipt) {
            idsToValidate.push(
                goodsReceipt
            );
        }

        if (purchaseInvoice) {
            idsToValidate.push(
                purchaseInvoice
            );
        }

        for (const id of idsToValidate) {
            if (!isValidObjectId(id)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid company, branch, supplier or reference ID",
                });
            }
        }

        const allowedReasons = [
            "DAMAGED",
            "DEFECTIVE",
            "WRONG_PRODUCT",
            "EXCESS_QUANTITY",
            "QUALITY_ISSUE",
            "EXPIRED",
            "OTHER",
        ];

        if (
            !allowedReasons.includes(
                reason
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid purchase return reason",
            });
        }

        // ==================================================
        // Supplier Validation
        // ==================================================

        const supplierData =
            await Supplier.findById(
                supplier
            );

        if (!supplierData) {
            return res.status(404).json({
                success: false,
                message:
                    "Supplier not found",
            });
        }

        if (
            supplierData.company.toString() !==
            company.toString()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Supplier does not belong to the selected company",
            });
        }

        if (
            supplierData.branch.toString() !==
            branch.toString()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Supplier does not belong to the selected branch",
            });
        }

        // ==================================================
        // Purchase Order Validation
        // ==================================================

        let po = null;

        if (purchaseOrder) {
            po =
                await PurchaseOrder.findById(
                    purchaseOrder
                );

            if (!po) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Purchase order not found",
                });
            }

            if (
                po.company.toString() !==
                    company.toString() ||
                po.branch.toString() !==
                    branch.toString() ||
                po.supplier.toString() !==
                    supplier.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Purchase order relationship is invalid",
                });
            }
        }

        // ==================================================
        // Goods Receipt Validation
        // ==================================================

        let grn = null;

        if (goodsReceipt) {
            grn =
                await GoodsReceipt.findById(
                    goodsReceipt
                );

            if (!grn) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Goods receipt not found",
                });
            }

            if (
                grn.company.toString() !==
                    company.toString() ||
                grn.branch.toString() !==
                    branch.toString() ||
                grn.supplier.toString() !==
                    supplier.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Goods receipt relationship is invalid",
                });
            }

            if (
                ![
                    "RECEIVED",
                    "PARTIALLY_RECEIVED",
                ].includes(grn.status)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Only received goods can be returned",
                });
            }

            if (!grn.warehouse) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Goods receipt warehouse is required for purchase return",
                });
            }

            if (
                po &&
                grn.purchaseOrder.toString() !==
                    po._id.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Goods receipt does not belong to the selected purchase order",
                });
            }
        }

        // ==================================================
        // Purchase Invoice Validation
        // ==================================================

        let invoice = null;

        if (purchaseInvoice) {
            invoice =
                await PurchaseInvoice.findById(
                    purchaseInvoice
                );

            if (!invoice) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Purchase invoice not found",
                });
            }

            if (
                invoice.company.toString() !==
                    company.toString() ||
                invoice.branch.toString() !==
                    branch.toString() ||
                invoice.supplier.toString() !==
                    supplier.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Purchase invoice relationship is invalid",
                });
            }

            if (
                invoice.status ===
                "CANCELLED"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Cancelled purchase invoice cannot be returned",
                });
            }

            if (
                po &&
                invoice.purchaseOrder &&
                invoice.purchaseOrder.toString() !==
                    po._id.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Purchase invoice does not belong to the selected purchase order",
                });
            }

            if (
                grn &&
                invoice.goodsReceipt &&
                invoice.goodsReceipt.toString() !==
                    grn._id.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Purchase invoice does not belong to the selected goods receipt",
                });
            }
        }

        // ==================================================
        // Product Validation
        // ==================================================

        const productIds =
            items.map((item) =>
                item.product?.toString()
            );

        const uniqueProducts =
            new Set(productIds);

        if (
            uniqueProducts.size !==
            productIds.length
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Duplicate products are not allowed in the same purchase return",
            });
        }

        // ==================================================
        // Reference Item Maps
        // ==================================================

        const grnItemMap = new Map();
        const invoiceItemMap = new Map();
        const poItemMap = new Map();

        if (goodsReceipt) {
            const grnItems =
                await GoodsReceiptItem.find({
                    goodsReceipt,
                });

            for (const item of grnItems) {
                grnItemMap.set(
                    item._id.toString(),
                    item
                );
            }
        }

        if (purchaseInvoice) {
            const invoiceItems =
                await PurchaseInvoiceItem.find({
                    purchaseInvoice,
                });

            for (const item of invoiceItems) {
                invoiceItemMap.set(
                    item._id.toString(),
                    item
                );
            }
        }

        if (purchaseOrder) {
            const poItems =
                await PurchaseOrderItem.find({
                    purchaseOrder,
                });

            for (const item of poItems) {
                poItemMap.set(
                    item._id.toString(),
                    item
                );
            }
        }

        // ==================================================
        // Build Return Items
        // ==================================================

        const returnItems = [];

        let totalQuantity = 0;
        let subtotal = 0;
        let discountAmount = 0;
        let taxAmount = 0;
        let totalAmount = 0;

        for (const item of items) {
            const {
                product,
                purchaseOrderItem,
                goodsReceiptItem,
                purchaseInvoiceItem,
                quantity,
                reason: itemReason,
                batchNumber,
                serialNumbers,
                notes: itemNotes,
            } = item;

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Product is required for every return item",
                });
            }

            if (
                !isValidObjectId(product)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid product ID",
                });
            }

            const returnQuantity =
                Number(quantity);

            if (
                !Number.isFinite(
                    returnQuantity
                ) ||
                returnQuantity <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Return quantity must be greater than 0",
                });
            }

            const productData =
                await Product.findById(
                    product
                );

            if (!productData) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Product not found",
                });
            }

            if (
                productData.company.toString() !==
                company.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Product does not belong to the selected company",
                });
            }

            let referenceGRNItem = null;
            let referenceInvoiceItem = null;
            let referencePOItem = null;

            // ==================================================
            // GRN Item
            // ==================================================

            if (goodsReceiptItem) {
                if (
                    !isValidObjectId(
                        goodsReceiptItem
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid goods receipt item ID",
                    });
                }

                referenceGRNItem =
                    grnItemMap.get(
                        goodsReceiptItem.toString()
                    );

                if (!referenceGRNItem) {
                    return res.status(404).json({
                        success: false,
                        message:
                            "Goods receipt item not found",
                    });
                }

                if (
                    referenceGRNItem.product.toString() !==
                    product.toString()
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Product does not match goods receipt item",
                    });
                }
            }

            // ==================================================
            // Invoice Item
            // ==================================================

            if (purchaseInvoiceItem) {
                if (
                    !isValidObjectId(
                        purchaseInvoiceItem
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid purchase invoice item ID",
                    });
                }

                referenceInvoiceItem =
                    invoiceItemMap.get(
                        purchaseInvoiceItem.toString()
                    );

                if (!referenceInvoiceItem) {
                    return res.status(404).json({
                        success: false,
                        message:
                            "Purchase invoice item not found",
                    });
                }

                if (
                    referenceInvoiceItem.product.toString() !==
                    product.toString()
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Product does not match purchase invoice item",
                    });
                }
            }

            // ==================================================
            // PO Item
            // ==================================================

            if (purchaseOrderItem) {
                if (
                    !isValidObjectId(
                        purchaseOrderItem
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid purchase order item ID",
                    });
                }

                referencePOItem =
                    poItemMap.get(
                        purchaseOrderItem.toString()
                    );

                if (!referencePOItem) {
                    return res.status(404).json({
                        success: false,
                        message:
                            "Purchase order item not found",
                    });
                }

                if (
                    referencePOItem.product.toString() !==
                    product.toString()
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Product does not match purchase order item",
                    });
                }
            }

            // ==================================================
            // Received Quantity
            // ==================================================

            let receivedQuantity = null;

            if (referenceGRNItem) {
                receivedQuantity =
                    Number(
                        referenceGRNItem.acceptedQuantity
                    );
            } else if (
                referenceInvoiceItem
            ) {
                receivedQuantity =
                    Number(
                        referenceInvoiceItem.quantity
                    );
            } else if (
                referencePOItem
            ) {
                receivedQuantity =
                    Number(
                        referencePOItem.receivedQuantity
                    );
            }

            // ==================================================
            // Previous Return Validation
            // ==================================================

            if (
                receivedQuantity !== null
            ) {
                const returnFilter = {
                    product,
                };

                if (goodsReceiptItem) {
                    returnFilter.goodsReceiptItem =
                        goodsReceiptItem;
                } else if (
                    purchaseInvoiceItem
                ) {
                    returnFilter.purchaseInvoiceItem =
                        purchaseInvoiceItem;
                } else if (
                    purchaseOrderItem
                ) {
                    returnFilter.purchaseOrderItem =
                        purchaseOrderItem;
                }

                const previousReturns =
                    await PurchaseReturnItem.find(
                        returnFilter
                    ).populate({
                        path: "purchaseReturn",
                        select: "status",
                    });

                let alreadyReturned = 0;

                for (
                    const previousReturn of previousReturns
                ) {
                    if (
                        previousReturn
                            .purchaseReturn
                            ?.status !==
                        "CANCELLED"
                    ) {
                        alreadyReturned +=
                            Number(
                                previousReturn.quantity
                            );
                    }
                }

                const remainingReturnable =
                    roundAmount(
                        receivedQuantity -
                            alreadyReturned
                    );

                if (
                    returnQuantity >
                    remainingReturnable
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            `Return quantity cannot exceed remaining returnable quantity of ${remainingReturnable}`,
                    });
                }
            }

            // ==================================================
            // Pricing
            // ==================================================

            const sourceItem =
                referenceInvoiceItem ||
                referenceGRNItem ||
                referencePOItem;

            const unitPrice =
                Number(
                    sourceItem?.unitPrice ??
                        productData.purchasePrice ??
                        0
                );

            const discountPercentage =
                Number(
                    sourceItem
                        ?.discountPercentage ??
                        0
                );

            const taxPercentage =
                Number(
                    sourceItem
                        ?.taxPercentage ??
                        productData.taxRate ??
                        0
                );

            const grossAmount =
                roundAmount(
                    returnQuantity *
                        unitPrice
                );

            const itemDiscount =
                roundAmount(
                    grossAmount *
                        (discountPercentage /
                            100)
                );

            const taxableAmount =
                roundAmount(
                    grossAmount -
                        itemDiscount
                );

            const itemTax =
                roundAmount(
                    taxableAmount *
                        (taxPercentage /
                            100)
                );

            const lineTotal =
                roundAmount(
                    taxableAmount +
                        itemTax
                );

            totalQuantity +=
                returnQuantity;

            subtotal =
                roundAmount(
                    subtotal +
                        grossAmount
                );

            discountAmount =
                roundAmount(
                    discountAmount +
                        itemDiscount
                );

            taxAmount =
                roundAmount(
                    taxAmount +
                        itemTax
                );

            totalAmount =
                roundAmount(
                    totalAmount +
                        lineTotal
                );

            returnItems.push({
                company,
                branch,

                purchaseOrder:
                    po
                        ? po._id
                        : null,

                purchaseOrderItem:
                    purchaseOrderItem ||
                    null,

                goodsReceipt:
                    grn
                        ? grn._id
                        : null,

                goodsReceiptItem:
                    goodsReceiptItem ||
                    null,

                purchaseInvoice:
                    invoice
                        ? invoice._id
                        : null,

                purchaseInvoiceItem:
                    purchaseInvoiceItem ||
                    null,

                product,

                quantity:
                    returnQuantity,

                unitPrice,

                discountPercentage,

                discountAmount:
                    itemDiscount,

                taxableAmount,

                taxPercentage,

                taxAmount:
                    itemTax,

                lineTotal,

                reason:
                    itemReason ||
                    reason,

                batchNumber:
                    batchNumber || "",

                serialNumbers:
                    Array.isArray(
                        serialNumbers
                    )
                        ? serialNumbers
                        : [],

                notes:
                    itemNotes || "",
            });
        }

        // ==================================================
        // Generate Return Number
        // ==================================================

        const returnNumber =
            await generateReturnNumber(
                company
            );

        // ==================================================
        // Create Purchase Return
        // ==================================================

        const purchaseReturn =
            await PurchaseReturn.create({
                company,
                branch,
                supplier,

                purchaseOrder:
                    po
                        ? po._id
                        : null,

                goodsReceipt:
                    grn
                        ? grn._id
                        : null,

                purchaseInvoice:
                    invoice
                        ? invoice._id
                        : null,

                returnNumber,

                returnDate:
                    returnDate ||
                    new Date(),

                reason,

                creditNoteNumber:
                    creditNoteNumber ||
                    "",

                totalQuantity,

                subtotal,

                discountAmount,

                taxAmount,

                totalAmount,

                refundAmount: 0,

                status:
                    "PENDING_APPROVAL",

                notes:
                    notes || "",

                createdBy:
                    req.user._id,
            });

        // ==================================================
        // Create Purchase Return Items
        // ==================================================

        try {
            await PurchaseReturnItem.insertMany(
                returnItems.map(
                    (item) => ({
                        ...item,

                        purchaseReturn:
                            purchaseReturn._id,
                    })
                )
            );
        } catch (itemError) {
            await purchaseReturn.deleteOne();
            throw itemError;
        }

        // ==================================================
        // GENERIC APPROVAL REQUEST
        // ==================================================

        let approvalRequest;

        try {
            approvalRequest =
                await createApprovalRequest({
                    company:
                        purchaseReturn.company,

                    branch:
                        purchaseReturn.branch,

                    module:
                        "PURCHASE_RETURN",

                    referenceType:
                        "PURCHASE_RETURN",

                    referenceId:
                        purchaseReturn._id,

                    referenceNumber:
                        purchaseReturn.returnNumber,

                    title:
                        `Purchase Return Approval - ${purchaseReturn.returnNumber}`,

                    description:
                        `Purchase return ${purchaseReturn.returnNumber} requires approval before stock is deducted.`,

                    requestedBy:
                        req.user._id,

                    // Same 2-level SUPER_ADMIN
                    // approval pattern used by PO
                    steps: [
                        {
                            level: 1,
                            approverType:
                                "ROLE",
                            approverRole:
                                "SUPER_ADMIN",
                        },
                        {
                            level: 2,
                            approverType:
                                "ROLE",
                            approverRole:
                                "SUPER_ADMIN",
                        },
                    ],

                    metadata: {
                        purchaseReturnId:
                            purchaseReturn._id,

                        returnNumber:
                            purchaseReturn.returnNumber,

                        supplier:
                            purchaseReturn.supplier,

                        totalQuantity:
                            purchaseReturn.totalQuantity,

                        totalAmount:
                            purchaseReturn.totalAmount,

                        reason:
                            purchaseReturn.reason,
                    },

                    createdBy:
                        req.user._id,

                    updatedBy:
                        req.user._id,
                });
        } catch (approvalError) {
            // Approval request creation failed.
            // Remove return + items so that
            // no orphan PENDING_APPROVAL return remains.

            await PurchaseReturnItem.deleteMany({
                purchaseReturn:
                    purchaseReturn._id,
            });

            await purchaseReturn.deleteOne();

            throw approvalError;
        }

        // ==================================================
        // Populate Return
        // ==================================================

        const populatedReturn =
            await populatePurchaseReturn(
                purchaseReturn._id
            );

        const createdItems =
            await PurchaseReturnItem.find({
                purchaseReturn:
                    purchaseReturn._id,
            })
                .populate(
                    "product",
                    "name sku barcode purchasePrice sellingPrice taxRate"
                )
                .populate(
                    "purchaseOrderItem",
                    "quantity receivedQuantity pendingQuantity unitPrice"
                )
                .populate(
                    "goodsReceiptItem",
                    "orderedQuantity receivedQuantity acceptedQuantity pendingQuantity unitPrice"
                )
                .populate(
                    "purchaseInvoiceItem",
                    "quantity unitPrice taxableAmount taxAmount lineTotal"
                );

        // ==================================================
        // AUDIT LOG - CREATED
        // ==================================================

        await createCreateAuditLog({
            req,

            company:
                purchaseReturn.company,

            branch:
                purchaseReturn.branch,

            user:
                req.user._id,

            module:
                "PURCHASE_RETURN",

            referenceType:
                "PURCHASE_RETURN",

            referenceId:
                purchaseReturn._id,

            referenceNumber:
                purchaseReturn.returnNumber,

            description:
                `Purchase return ${purchaseReturn.returnNumber} created and sent for approval.`,

            newValues: {
                returnNumber:
                    purchaseReturn.returnNumber,

                supplier:
                    purchaseReturn.supplier,

                purchaseOrder:
                    purchaseReturn.purchaseOrder,

                goodsReceipt:
                    purchaseReturn.goodsReceipt,

                purchaseInvoice:
                    purchaseReturn.purchaseInvoice,

                returnDate:
                    purchaseReturn.returnDate,

                reason:
                    purchaseReturn.reason,

                creditNoteNumber:
                    purchaseReturn.creditNoteNumber,

                totalQuantity:
                    purchaseReturn.totalQuantity,

                subtotal:
                    purchaseReturn.subtotal,

                discountAmount:
                    purchaseReturn.discountAmount,

                taxAmount:
                    purchaseReturn.taxAmount,

                totalAmount:
                    purchaseReturn.totalAmount,

                refundAmount:
                    purchaseReturn.refundAmount,

                status:
                    purchaseReturn.status,

                notes:
                    purchaseReturn.notes,

                itemCount:
                    createdItems.length,

                approvalRequestId:
                    approvalRequest?._id ||
                    null,
            },

            metadata: {
                event:
                    "CREATED",

                itemCount:
                    createdItems.length,

                createdBy:
                    req.user._id,

                approvalRequestId:
                    approvalRequest?._id ||
                    null,
            },
        });

        // ==================================================
        // Created Notification
        // ==================================================

        await sendPurchaseReturnNotification({
            purchaseReturn:
                populatedReturn,

            supplier:
                supplierData,

            recipient:
                req.user._id,

            event:
                "CREATED",
        });

        return res.status(201).json({
            success: true,

            message:
                "Purchase return created successfully and sent for approval",

            data: {
                purchaseReturn:
                    populatedReturn,

                items:
                    createdItems,

                approvalRequest:
                    approvalRequest,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// GET PURCHASE RETURNS
// ======================================================

const getPurchaseReturns = async (
    req,
    res,
    next
) => {
    try {
        const {
            company,
            branch,
            supplier,
            purchaseOrder,
            goodsReceipt,
            purchaseInvoice,
            status,
            reason,
            search,
            startDate,
            endDate,
            page = 1,
            limit = 20,
        } = req.query;

        const filter = {};

        const idFilters = [
            ["company", company],
            ["branch", branch],
            ["supplier", supplier],
            ["purchaseOrder", purchaseOrder],
            ["goodsReceipt", goodsReceipt],
            ["purchaseInvoice", purchaseInvoice],
        ];

        for (
            const [field, value] of idFilters
        ) {
            if (value) {
                if (
                    !isValidObjectId(value)
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            `Invalid ${field} ID`,
                    });
                }

                filter[field] = value;
            }
        }

        if (status) {
            filter.status = status;
        }

        if (reason) {
            filter.reason = reason;
        }

        if (search) {
            const regex =
                new RegExp(
                    search.trim(),
                    "i"
                );

            const [
                suppliers,
                purchaseOrders,
                goodsReceipts,
                invoices,
            ] = await Promise.all([
                Supplier.find({
                    $or: [
                        {
                            name: regex,
                        },
                        {
                            supplierCode:
                                regex,
                        },
                    ],
                }).select("_id"),

                PurchaseOrder.find({
                    poNumber: regex,
                }).select("_id"),

                GoodsReceipt.find({
                    grnNumber: regex,
                }).select("_id"),

                PurchaseInvoice.find({
                    $or: [
                        {
                            invoiceNumber:
                                regex,
                        },
                        {
                            internalInvoiceNumber:
                                regex,
                        },
                    ],
                }).select("_id"),
            ]);

            filter.$or = [
                {
                    returnNumber:
                        regex,
                },
                {
                    creditNoteNumber:
                        regex,
                },
                {
                    supplier: {
                        $in: suppliers.map(
                            (item) =>
                                item._id
                        ),
                    },
                },
                {
                    purchaseOrder: {
                        $in: purchaseOrders.map(
                            (item) =>
                                item._id
                        ),
                    },
                },
                {
                    goodsReceipt: {
                        $in: goodsReceipts.map(
                            (item) =>
                                item._id
                        ),
                    },
                },
                {
                    purchaseInvoice: {
                        $in: invoices.map(
                            (item) =>
                                item._id
                        ),
                    },
                },
            ];
        }

        if (
            startDate ||
            endDate
        ) {
            filter.returnDate = {};

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

                filter.returnDate.$gte =
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

                filter.returnDate.$lte =
                    end;
            }
        }

        const currentPage =
            Math.max(
                Number(page) || 1,
                1
            );

        const perPage =
            Math.min(
                Math.max(
                    Number(limit) || 20,
                    1
                ),
                100
            );

        const skip =
            (currentPage - 1) *
            perPage;

        const [
            returns,
            total,
        ] = await Promise.all([
            PurchaseReturn.find(filter)
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
                    "supplierCode name companyName"
                )
                .populate(
                    "purchaseOrder",
                    "poNumber totalAmount status"
                )
                .populate(
                    "goodsReceipt",
                    "grnNumber totalQuantity totalAmount status warehouse"
                )
                .populate(
                    "purchaseInvoice",
                    "invoiceNumber internalInvoiceNumber totalAmount status goodsReceipt"
                )
                .populate(
                    "approval.approvedBy",
                    "name email"
                )
                .populate(
                    "createdBy",
                    "name email"
                )
                .sort({
                    returnDate: -1,
                    createdAt: -1,
                })
                .skip(skip)
                .limit(perPage),

            PurchaseReturn.countDocuments(
                filter
            ),
        ]);

        return res.status(200).json({
            success: true,

            data:
                returns,

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
                    ),
            },
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// GET PURCHASE RETURN BY ID
// ======================================================

const getPurchaseReturnById =
    async (
        req,
        res,
        next
    ) => {
        try {
            const { id } =
                req.params;

            if (
                !isValidObjectId(id)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid purchase return ID",
                });
            }

            const purchaseReturn =
                await populatePurchaseReturn(
                    id
                );

            if (!purchaseReturn) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Purchase return not found",
                });
            }

            const items =
                await PurchaseReturnItem.find({
                    purchaseReturn:
                        id,
                })
                    .populate(
                        "product",
                        "name sku barcode purchasePrice sellingPrice taxRate"
                    )
                    .populate(
                        "purchaseOrderItem"
                    )
                    .populate(
                        "goodsReceiptItem"
                    )
                    .populate(
                        "purchaseInvoiceItem"
                    );

            return res.status(200).json({
                success: true,

                data: {
                    purchaseReturn,

                    items,
                },
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// PROCESS PURCHASE RETURN AFTER FINAL APPROVAL
// ======================================================
//
// IMPORTANT:
// Generic approvalController will call this function
// ONLY when ApprovalRequest becomes APPROVED.
//
// This contains the old stock deduction logic.
// ======================================================

const processApprovedPurchaseReturn =
    async ({
        purchaseReturnId,
        userId,
        session,
    }) => {
        const purchaseReturn =
            await PurchaseReturn.findById(
                purchaseReturnId
            ).session(
                session
            );

        if (!purchaseReturn) {
            const error =
                new Error(
                    "Purchase return not found"
                );

            error.statusCode =
                404;

            throw error;
        }

        if (
            purchaseReturn.status !==
            "PENDING_APPROVAL"
        ) {
            const error =
                new Error(
                    "Purchase return is not pending approval"
                );

            error.statusCode =
                400;

            throw error;
        }

        const items =
            await PurchaseReturnItem.find({
                purchaseReturn:
                    purchaseReturn._id,
            }).session(
                session
            );

        if (
            !items ||
            items.length === 0
        ) {
            const error =
                new Error(
                    "Purchase return has no items"
                );

            error.statusCode =
                400;

            throw error;
        }

        // ==================================================
        // Determine Warehouse
        // ==================================================

        let warehouse = null;

        // --------------------------------------------------
        // 1. Direct Goods Receipt
        // --------------------------------------------------

        if (
            purchaseReturn.goodsReceipt
        ) {
            const goodsReceipt =
                await GoodsReceipt.findOne({
                    _id:
                        purchaseReturn.goodsReceipt,

                    company:
                        purchaseReturn.company,

                    branch:
                        purchaseReturn.branch,
                })
                    .select(
                        "warehouse status"
                    )
                    .session(
                        session
                    );

            if (!goodsReceipt) {
                const error =
                    new Error(
                        "Goods receipt not found for purchase return"
                    );

                error.statusCode =
                    404;

                throw error;
            }

            if (
                ![
                    "RECEIVED",
                    "PARTIALLY_RECEIVED",
                ].includes(
                    goodsReceipt.status
                )
            ) {
                const error =
                    new Error(
                        "Only received goods can be returned"
                    );

                error.statusCode =
                    400;

                throw error;
            }

            if (
                !goodsReceipt.warehouse
            ) {
                const error =
                    new Error(
                        "Goods receipt warehouse is missing"
                    );

                error.statusCode =
                    400;

                throw error;
            }

            warehouse =
                goodsReceipt.warehouse;
        }

        // --------------------------------------------------
        // 2. Purchase Invoice → GRN → Warehouse
        // --------------------------------------------------

        if (
            !warehouse &&
            purchaseReturn.purchaseInvoice
        ) {
            const purchaseInvoice =
                await PurchaseInvoice.findOne({
                    _id:
                        purchaseReturn.purchaseInvoice,

                    company:
                        purchaseReturn.company,

                    branch:
                        purchaseReturn.branch,
                })
                    .select(
                        "goodsReceipt status"
                    )
                    .session(
                        session
                    );

            if (!purchaseInvoice) {
                const error =
                    new Error(
                        "Purchase invoice not found for purchase return"
                    );

                error.statusCode =
                    404;

                throw error;
            }

            if (
                purchaseInvoice.goodsReceipt
            ) {
                const goodsReceipt =
                    await GoodsReceipt.findOne({
                        _id:
                            purchaseInvoice.goodsReceipt,

                        company:
                            purchaseReturn.company,

                        branch:
                            purchaseReturn.branch,
                    })
                        .select(
                            "warehouse status"
                        )
                        .session(
                            session
                        );

                if (!goodsReceipt) {
                    const error =
                        new Error(
                            "Goods receipt linked to purchase invoice was not found"
                        );

                    error.statusCode =
                        404;

                    throw error;
                }

                if (
                    ![
                        "RECEIVED",
                        "PARTIALLY_RECEIVED",
                    ].includes(
                        goodsReceipt.status
                    )
                ) {
                    const error =
                        new Error(
                            "Only received goods can be returned"
                        );

                    error.statusCode =
                        400;

                    throw error;
                }

                if (
                    !goodsReceipt.warehouse
                ) {
                    const error =
                        new Error(
                            "Goods receipt warehouse is missing"
                        );

                    error.statusCode =
                        400;

                    throw error;
                }

                warehouse =
                    goodsReceipt.warehouse;
            }
        }

        // ==================================================
        // Final Warehouse Validation
        // ==================================================

        if (!warehouse) {
            const error =
                new Error(
                    "Warehouse could not be determined for purchase return"
                );

            error.statusCode =
                400;

            throw error;
        }

        // ==================================================
        // Validate Products
        // ==================================================

        for (
            const item of items
        ) {
            const returnQuantity =
                Number(
                    item.quantity || 0
                );

            if (
                !Number.isFinite(
                    returnQuantity
                ) ||
                returnQuantity <= 0
            ) {
                const error =
                    new Error(
                        `Invalid return quantity for product ${item.product}`
                    );

                error.statusCode =
                    400;

                throw error;
            }

            const product =
                await Product.findOne({
                    _id:
                        item.product,

                    company:
                        purchaseReturn.company,

                    isActive:
                        true,
                })
                    .select(
                        "_id name sku"
                    )
                    .session(
                        session
                    );

            if (!product) {
                const error =
                    new Error(
                        `Product ${item.product} not found in selected company`
                    );

                error.statusCode =
                    400;

                throw error;
            }
        }

        // ==================================================
        // Capture Old Values
        // ==================================================

        const oldPurchaseReturnValues = {
            status:
                purchaseReturn.status,

            approval:
                purchaseReturn.approval,

            rejectionReason:
                purchaseReturn.rejectionReason ||
                "",

            totalQuantity:
                purchaseReturn.totalQuantity,

            totalAmount:
                purchaseReturn.totalAmount,

            refundAmount:
                purchaseReturn.refundAmount,
        };

        // ==================================================
        // Deduct Stock
        // ==================================================

        const stockResults = [];

        for (
            const item of items
        ) {
            const returnQuantity =
                Number(
                    item.quantity
                );

            const stockResult =
                await decreaseStock({
                    company:
                        purchaseReturn.company,

                    branch:
                        purchaseReturn.branch,

                    warehouse,

                    product:
                        item.product,

                    quantity:
                        returnQuantity,

                    movementType:
                        "PURCHASE_RETURN",

                    referenceType:
                        "PURCHASE_RETURN",

                    referenceId:
                        purchaseReturn._id,

                    referenceNumber:
                        purchaseReturn.returnNumber,

                    unitPrice:
                        Number(
                            item.unitPrice ||
                                0
                        ),

                    reason:
                        "Purchase return to supplier",

                    notes:
                        `Stock deducted for purchase return ${purchaseReturn.returnNumber}`,

                    createdBy:
                        userId,

                    session,
                });

            stockResults.push({
                product:
                    item.product,

                quantity:
                    returnQuantity,

                stock:
                    stockResult.stock,
            });
        }

        // ==================================================
        // Update Purchase Return
        // ==================================================

        purchaseReturn.status =
            "PROCESSED";

        purchaseReturn.approval = {
            approvedBy:
                userId,

            approvedAt:
                new Date(),
        };

        purchaseReturn.updatedBy =
            userId;

        await purchaseReturn.save({
            session,
        });

        return {
            purchaseReturnId:
                purchaseReturn._id,

            stockResults,

            oldPurchaseReturnValues,
        };
    };
// ======================================================
// GENERIC APPROVAL WORKFLOW HANDLER
// ======================================================

registerApprovalHandler(
    "PURCHASE_RETURN",
    {
        onFinalApprove:
            async ({
                user,
                session,
                approvalRequest,
            }) => {
                return processApprovedPurchaseReturn({
                    purchaseReturnId:
                        approvalRequest.referenceId,

                    userId:
                        user._id,

                    session,
                });
            },
    }
);
// ======================================================
// DIRECT APPROVE PURCHASE RETURN
// ======================================================
//
// OLD endpoint is intentionally blocked.
// Approval MUST happen through generic ApprovalRequest.
// ======================================================

const approvePurchaseReturn =
    async (
        req,
        res
    ) => {
        return res.status(400).json({
            success: false,

            message:
                "Direct purchase return approval is disabled. Use the generic approval workflow.",
        });
    };

// ======================================================
// DIRECT REJECT PURCHASE RETURN
// ======================================================
//
// OLD endpoint is intentionally blocked.
// Rejection MUST happen through generic ApprovalRequest.
// ======================================================

const rejectPurchaseReturn =
    async (
        req,
        res
    ) => {
        return res.status(400).json({
            success: false,

            message:
                "Direct purchase return rejection is disabled. Use the generic approval workflow.",
        });
    };

// ======================================================
// DELETE PURCHASE RETURN
// ======================================================

const deletePurchaseReturn =
    async (
        req,
        res,
        next
    ) => {
        try {
            const { id } =
                req.params;

            if (
                !isValidObjectId(id)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid purchase return ID",
                });
            }

            const purchaseReturn =
                await PurchaseReturn.findById(
                    id
                );

            if (!purchaseReturn) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Purchase return not found",
                });
            }

            if (
                ![
                    "DRAFT",
                    "REJECTED",
                ].includes(
                    purchaseReturn.status
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Only draft or rejected purchase returns can be deleted",
                });
            }

            // ==================================================
            // Capture Old Values
            // ==================================================

            const oldPurchaseReturnValues = {
                _id:
                    purchaseReturn._id,

                company:
                    purchaseReturn.company,

                branch:
                    purchaseReturn.branch,

                supplier:
                    purchaseReturn.supplier,

                purchaseOrder:
                    purchaseReturn.purchaseOrder,

                goodsReceipt:
                    purchaseReturn.goodsReceipt,

                purchaseInvoice:
                    purchaseReturn.purchaseInvoice,

                returnNumber:
                    purchaseReturn.returnNumber,

                returnDate:
                    purchaseReturn.returnDate,

                reason:
                    purchaseReturn.reason,

                creditNoteNumber:
                    purchaseReturn.creditNoteNumber,

                totalQuantity:
                    purchaseReturn.totalQuantity,

                subtotal:
                    purchaseReturn.subtotal,

                discountAmount:
                    purchaseReturn.discountAmount,

                taxAmount:
                    purchaseReturn.taxAmount,

                totalAmount:
                    purchaseReturn.totalAmount,

                refundAmount:
                    purchaseReturn.refundAmount,

                status:
                    purchaseReturn.status,

                notes:
                    purchaseReturn.notes,

                rejectionReason:
                    purchaseReturn.rejectionReason ||
                    "",

                createdBy:
                    purchaseReturn.createdBy,

                updatedBy:
                    purchaseReturn.updatedBy,
            };

            const deletedItemCount =
                await PurchaseReturnItem.countDocuments({
                    purchaseReturn:
                        purchaseReturn._id,
                });

            await PurchaseReturnItem.deleteMany({
                purchaseReturn:
                    purchaseReturn._id,
            });

            await purchaseReturn.deleteOne();

            // ==================================================
            // AUDIT LOG - DELETE
            // ==================================================

            await createDeleteAuditLog({
                req,

                company:
                    oldPurchaseReturnValues.company,

                branch:
                    oldPurchaseReturnValues.branch,

                user:
                    req.user._id,

                module:
                    "PURCHASE_RETURN",

                referenceType:
                    "PURCHASE_RETURN",

                referenceId:
                    oldPurchaseReturnValues._id,

                referenceNumber:
                    oldPurchaseReturnValues.returnNumber,

                description:
                    `Purchase return ${oldPurchaseReturnValues.returnNumber} deleted.`,

                oldValues:
                    oldPurchaseReturnValues,

                metadata: {
                    event:
                        "DELETED",

                    deletedStatus:
                        oldPurchaseReturnValues.status,

                    deletedItemCount,
                },
            });

            return res.status(200).json({
                success: true,

                message:
                    "Purchase return deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    createPurchaseReturn,

    getPurchaseReturns,

    getPurchaseReturnById,

    // Kept exported so existing route
    // doesn't immediately break,
    // but these are now blocked.
    approvePurchaseReturn,

    rejectPurchaseReturn,

    deletePurchaseReturn,

    // Generic approvalController will use this
    // after final approval.
    processApprovedPurchaseReturn,
};