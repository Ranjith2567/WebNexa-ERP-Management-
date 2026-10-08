const mongoose = require("mongoose");

const GoodsReceipt = require("../models/GoodsReceipt");
const GoodsReceiptItem = require("../models/GoodsReceiptItem");
const PurchaseOrder = require("../models/PurchaseOrder");
const PurchaseOrderItem = require("../models/PurchaseOrderItem");
const Product = require("../models/Product");
const Warehouse = require("../models/Warehouse");

const {
    increaseStock,
} = require("../services/stockService");

const {
    createNotification,
    createStockNotification,
} = require("../services/notificationService");

const {
    withTransaction,
} = require("../utils/withTransaction");

// ==========================================
// Helpers
// ==========================================

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const roundAmount = (amount) => {
    return (
        Math.round(
            (Number(amount) + Number.EPSILON) * 100
        ) / 100
    );
};

const roundQuantity = (quantity) => {
    return (
        Math.round(
            (Number(quantity) + Number.EPSILON) * 1000000
        ) / 1000000
    );
};

// ==========================================
// Generate GRN Number
// ==========================================

const generateGRNNumber = async (
    companyId,
    session = null
) => {
    const query = GoodsReceipt.findOne({
        company: companyId,
    })
        .sort({
            createdAt: -1,
        })
        .select("grnNumber");

    if (session) {
        query.session(session);
    }

    const lastGRN = await query;

    if (!lastGRN) {
        return "GRN-000001";
    }

    if (
        !lastGRN.grnNumber ||
        !lastGRN.grnNumber.startsWith("GRN-")
    ) {
        throw new Error(
            "Invalid GRN number format"
        );
    }

    const lastNumber = parseInt(
        lastGRN.grnNumber.replace("GRN-", ""),
        10
    );

    if (Number.isNaN(lastNumber)) {
        throw new Error(
            "Invalid GRN number format"
        );
    }

    const nextNumber = lastNumber + 1;

    return `GRN-${String(nextNumber).padStart(
        6,
        "0"
    )}`;
};

// ==========================================
// GOODS RECEIPT NOTIFICATION
// ==========================================

const sendGoodsReceiptNotification = async ({
    goodsReceipt,
    recipient,
    event = "RECEIVED",
}) => {
    try {
        if (!goodsReceipt || !recipient) {
            return null;
        }

        const grnNumber =
            goodsReceipt.grnNumber ||
            "Goods Receipt";

        const status =
            goodsReceipt.status || "";

        const totalQuantity =
            Number(
                goodsReceipt.totalQuantity || 0
            );

        const totalAmount =
            Number(
                goodsReceipt.totalAmount || 0
            );

        // ------------------------------------------
        // Get Supplier Name
        // ------------------------------------------

        let supplierName = "Supplier";

        if (goodsReceipt.supplier) {
            const supplierId =
                goodsReceipt.supplier?._id ||
                goodsReceipt.supplier;

            const supplier =
                await mongoose
                    .model("Supplier")
                    .findById(
                        supplierId
                    )
                    .select(
                        "name companyName"
                    )
                    .lean();

            if (supplier) {
                supplierName =
                    supplier.name ||
                    supplier.companyName ||
                    "Supplier";
            }
        }

        let title =
            "Goods Receipt Created";

        let message =
            `${grnNumber} has been created for ${supplierName}. ` +
            `Received quantity: ${totalQuantity}. ` +
            `Total amount: ${totalAmount.toFixed(2)}.`;

        let priority = "MEDIUM";

        if (event === "RECEIVED") {
            title =
                "Goods Receipt Completed";

            message =
                `${grnNumber} has been received from ${supplierName}. ` +
                `Accepted quantity: ${totalQuantity}. ` +
                `Total amount: ${totalAmount.toFixed(2)}.`;

            priority = "HIGH";
        }

        if (
            event === "PARTIALLY_RECEIVED"
        ) {
            title =
                "Goods Partially Received";

            message =
                `${grnNumber} has been partially received from ${supplierName}. ` +
                `Accepted quantity: ${totalQuantity}. ` +
                `Total amount: ${totalAmount.toFixed(2)}.`;

            priority = "MEDIUM";
        }

        if (event === "DRAFT") {
            title =
                "Goods Receipt Draft Created";

            message =
                `${grnNumber} draft has been created for ${supplierName}.`;

            priority = "LOW";
        }

        return await createNotification({
            company:
                goodsReceipt.company,
            branch:
                goodsReceipt.branch || null,
            recipient,
            type: "GOODS_RECEIPT",
            title,
            message,
            priority,
            referenceType:
                "GOODS_RECEIPT",
            referenceId:
                goodsReceipt._id,
            metadata: {
                event,
                grnNumber,
                status,
                purchaseOrderId:
                    goodsReceipt.purchaseOrder ||
                    null,
                supplierId:
                    goodsReceipt.supplier ||
                    null,
                supplierName,
                warehouseId:
                    goodsReceipt.warehouse ||
                    null,
                totalQuantity,
                totalAmount,
                invoiceNumber:
                    goodsReceipt.invoiceNumber ||
                    "",
            },
            createdBy: recipient,
        });
    } catch (error) {
        console.error(
            "Goods Receipt Notification Error:",
            error.message
        );

        return null;
    }
};

// ==========================================
// STOCK NOTIFICATIONS AFTER GRN
// ==========================================

const sendGoodsReceiptStockNotifications =
    async ({
        goodsReceipt,
        stocks = [],
        recipient,
        createdBy,
    }) => {
        try {
            if (
                !goodsReceipt ||
                !recipient ||
                !Array.isArray(stocks) ||
                stocks.length === 0
            ) {
                return;
            }

            for (const stock of stocks) {
                try {
                    if (!stock) {
                        continue;
                    }

                    const product =
                        await Product.findOne({
                            _id:
                                stock.product,
                            company:
                                goodsReceipt.company,
                            branch:
                                goodsReceipt.branch,
                        }).lean();

                    if (!product) {
                        console.error(
                            `Stock notification skipped: Product not found for stock ${stock._id}`
                        );

                        continue;
                    }

                    const warehouse =
                        await Warehouse.findOne({
                            _id:
                                stock.warehouse,
                            company:
                                goodsReceipt.company,
                            branch:
                                goodsReceipt.branch,
                        }).lean();

                    await createStockNotification({
                        company:
                            goodsReceipt.company,
                        branch:
                            goodsReceipt.branch,
                        recipient,
                        stock,
                        product,
                        warehouse,
                        createdBy,
                    });
                } catch (stockNotificationError) {
                    console.error(
                        "Goods Receipt Stock Notification Error:",
                        stockNotificationError.message
                    );
                }
            }
        } catch (error) {
            console.error(
                "Goods Receipt Stock Notification Error:",
                error.message
            );
        }
    };

// ==========================================
// CREATE GOODS RECEIPT
// ==========================================

const createGoodsReceipt = async (
    req,
    res,
    next
) => {
    try {
        const {
            company,
            branch,
            purchaseOrder,
            receiptDate,
            invoiceNumber,
            invoiceDate,
            vehicleNumber,
            status = "RECEIVED",
            notes = "",
            rejectionReason = "",
            items,
        } = req.body;

        // ==========================================
        // Basic Validation
        // ==========================================

        if (
            !company ||
            !isValidObjectId(company)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid company is required",
            });
        }

        if (
            !branch ||
            !isValidObjectId(branch)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid branch is required",
            });
        }

        if (
            !purchaseOrder ||
            !isValidObjectId(purchaseOrder)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid purchase order is required",
            });
        }

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "At least one receipt item is required",
            });
        }

        // ==========================================
        // Validate Status
        // ==========================================

        if (
            ![
                "DRAFT",
                "RECEIVED",
                "PARTIALLY_RECEIVED",
            ].includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid goods receipt status",
            });
        }

        // ==========================================
        // Duplicate Product Check
        // ==========================================

        const productIds = items.map(
            (item) =>
                item.product
                    ? item.product.toString()
                    : ""
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
                    "Duplicate products are not allowed in the same goods receipt",
            });
        }

        // ==========================================
        // TRANSACTION
        // ==========================================

        const result =
            await withTransaction(
                async (session) => {
                    // ==========================================
                    // Find Purchase Order
                    // ==========================================

                    const purchaseOrderData =
                        await PurchaseOrder.findOne({
                            _id: purchaseOrder,
                            company,
                            branch,
                        }).session(session);

                    if (!purchaseOrderData) {
                        throw new Error(
                            "Purchase order not found or does not belong to the selected company and branch"
                        );
                    }

                    // ==========================================
                    // PO Status Validation
                    // ==========================================

                    const allowedPOStatuses = [
                        "APPROVED",
                        "SENT",
                        "PARTIALLY_RECEIVED",
                    ];

                    if (
                        !allowedPOStatuses.includes(
                            purchaseOrderData.status
                        )
                    ) {
                        throw new Error(
                            `Purchase order with status ${purchaseOrderData.status} cannot receive goods`
                        );
                    }

                    // ==========================================
                    // Warehouse Validation
                    // ==========================================

                    const warehouse =
                        purchaseOrderData.warehouse;

                    if (!warehouse) {
                        throw new Error(
                            "Warehouse is not assigned to this purchase order"
                        );
                    }

                    if (
                        !isValidObjectId(
                            warehouse
                        )
                    ) {
                        throw new Error(
                            "Invalid warehouse assigned to purchase order"
                        );
                    }

                    // ==========================================
                    // Get PO Items
                    // ==========================================

                    const purchaseOrderItems =
                        await PurchaseOrderItem.find({
                            purchaseOrder,
                            company,
                            branch,
                        }).session(session);

                    if (
                        purchaseOrderItems.length === 0
                    ) {
                        throw new Error(
                            "No items found for this purchase order"
                        );
                    }

                    // ==========================================
                    // PO Item Map
                    // ==========================================

                    const poItemMap =
                        new Map();

                    purchaseOrderItems.forEach(
                        (item) => {
                            poItemMap.set(
                                item._id.toString(),
                                item
                            );
                        }
                    );

                    // ==========================================
                    // Validate & Calculate Items
                    // ==========================================

                    const processedItems = [];

                    let totalQuantity = 0;
                    let totalAmount = 0;

                    for (
                        const item of items
                    ) {
                        const {
                            purchaseOrderItem,
                            product,
                            receivedQuantity,
                            rejectedQuantity = 0,
                            batchNumber = "",
                            serialNumbers = [],
                            expiryDate = null,
                            manufacturingDate = null,
                            notes:
                                itemNotes = "",
                        } = item;

                        // ------------------------------------------
                        // Validate PO Item ID
                        // ------------------------------------------

                        if (
                            !purchaseOrderItem ||
                            !isValidObjectId(
                                purchaseOrderItem
                            )
                        ) {
                            throw new Error(
                                "Valid purchase order item is required"
                            );
                        }

                        // ------------------------------------------
                        // Validate Product ID
                        // ------------------------------------------

                        if (
                            !product ||
                            !isValidObjectId(product)
                        ) {
                            throw new Error(
                                "Valid product is required"
                            );
                        }

                        // ------------------------------------------
                        // Find PO Item
                        // ------------------------------------------

                        const poItem =
                            poItemMap.get(
                                purchaseOrderItem.toString()
                            );

                        if (!poItem) {
                            throw new Error(
                                "Purchase order item does not belong to this purchase order"
                            );
                        }

                        // ------------------------------------------
                        // Product Match
                        // ------------------------------------------

                        if (
                            poItem.product.toString() !==
                            product.toString()
                        ) {
                            throw new Error(
                                "Product does not match the purchase order item"
                            );
                        }

                        // ------------------------------------------
                        // Quantity Validation
                        // ------------------------------------------

                        const receivedQty =
                            Number(
                                receivedQuantity
                            );

                        const rejectedQty =
                            Number(
                                rejectedQuantity
                            );

                        if (
                            !Number.isFinite(
                                receivedQty
                            ) ||
                            receivedQty <= 0
                        ) {
                            throw new Error(
                                "Received quantity must be greater than 0"
                            );
                        }

                        if (
                            !Number.isFinite(
                                rejectedQty
                            ) ||
                            rejectedQty < 0
                        ) {
                            throw new Error(
                                "Rejected quantity cannot be negative"
                            );
                        }

                        if (
                            rejectedQty >
                            receivedQty
                        ) {
                            throw new Error(
                                "Rejected quantity cannot be greater than received quantity"
                            );
                        }

                        // ------------------------------------------
                        // Previous Received
                        // ------------------------------------------

                        const previouslyReceived =
                            Number(
                                poItem.receivedQuantity ||
                                    0
                            );

                        // ------------------------------------------
                        // Pending Before Receipt
                        // ------------------------------------------

                        const pendingBeforeReceipt =
                            Math.max(
                                Number(
                                    poItem.quantity
                                ) -
                                    previouslyReceived,
                                0
                            );

                        // ------------------------------------------
                        // Validate Pending
                        // ------------------------------------------

                        if (
                            receivedQty >
                            pendingBeforeReceipt
                        ) {
                            throw new Error(
                                `Received quantity cannot exceed pending quantity (${pendingBeforeReceipt}) for this product`
                            );
                        }

                        // ------------------------------------------
                        // Accepted Quantity
                        // ------------------------------------------

                        const acceptedQty =
                            receivedQty -
                            rejectedQty;

                        if (
                            acceptedQty < 0
                        ) {
                            throw new Error(
                                "Accepted quantity cannot be negative"
                            );
                        }

                        // ------------------------------------------
                        // Pending After Receipt
                        // ------------------------------------------

                        const pendingAfterReceipt =
                            Math.max(
                                pendingBeforeReceipt -
                                    receivedQty,
                                0
                            );

                        // ------------------------------------------
                        // Financial Calculation
                        // ------------------------------------------

                        const unitPrice =
                            Number(
                                poItem.unitPrice ||
                                    0
                            );

                        const discountPercentage =
                            Number(
                                poItem.discountPercentage ||
                                    0
                            );

                        const taxPercentage =
                            Number(
                                poItem.taxPercentage ||
                                    0
                            );

                        if (
                            !Number.isFinite(
                                unitPrice
                            ) ||
                            unitPrice < 0
                        ) {
                            throw new Error(
                                "Invalid unit price in purchase order item"
                            );
                        }

                        if (
                            !Number.isFinite(
                                discountPercentage
                            ) ||
                            discountPercentage < 0 ||
                            discountPercentage > 100
                        ) {
                            throw new Error(
                                "Invalid discount percentage in purchase order item"
                            );
                        }

                        if (
                            !Number.isFinite(
                                taxPercentage
                            ) ||
                            taxPercentage < 0
                        ) {
                            throw new Error(
                                "Invalid tax percentage in purchase order item"
                            );
                        }

                        const grossAmount =
                            receivedQty *
                            unitPrice;

                        const discountAmount =
                            grossAmount *
                            (discountPercentage /
                                100);

                        const taxableAmount =
                            grossAmount -
                            discountAmount;

                        const taxAmount =
                            taxableAmount *
                            (taxPercentage /
                                100);

                        const lineTotal =
                            taxableAmount +
                            taxAmount;

                        // ------------------------------------------
                        // Totals
                        // ------------------------------------------

                        totalQuantity +=
                            acceptedQty;

                        totalAmount +=
                            lineTotal;

                        // ------------------------------------------
                        // Processed Item
                        // ------------------------------------------

                        processedItems.push({
                            purchaseOrderItem:
                                poItem._id,

                            product:
                                poItem.product,

                            orderedQuantity:
                                Number(
                                    poItem.quantity
                                ),

                            previouslyReceivedQuantity:
                                previouslyReceived,

                            receivedQuantity:
                                roundQuantity(
                                    receivedQty
                                ),

                            rejectedQuantity:
                                roundQuantity(
                                    rejectedQty
                                ),

                            acceptedQuantity:
                                roundQuantity(
                                    acceptedQty
                                ),

                            pendingQuantity:
                                roundQuantity(
                                    pendingAfterReceipt
                                ),

                            unitPrice,

                            discountPercentage,

                            discountAmount:
                                roundAmount(
                                    discountAmount
                                ),

                            taxPercentage,

                            taxAmount:
                                roundAmount(
                                    taxAmount
                                ),

                            taxableAmount:
                                roundAmount(
                                    taxableAmount
                                ),

                            lineTotal:
                                roundAmount(
                                    lineTotal
                                ),

                            batchNumber:
                                String(
                                    batchNumber || ""
                                ).trim(),

                            serialNumbers:
                                Array.isArray(
                                    serialNumbers
                                )
                                    ? serialNumbers
                                    : [],

                            expiryDate,

                            manufacturingDate,

                            notes:
                                itemNotes || "",
                        });
                    }

                    // ==========================================
                    // Determine GRN Status
                    // ==========================================

                    const allPOItemsFullyReceived =
                        purchaseOrderItems.every(
                            (poItem) => {
                                const receiptItem =
                                    processedItems.find(
                                        (item) =>
                                            item.purchaseOrderItem
                                                .toString() ===
                                            poItem._id.toString()
                                    );

                                const currentReceived =
                                    Number(
                                        poItem.receivedQuantity ||
                                            0
                                    );

                                const receivedInThisGRN =
                                    receiptItem
                                        ? Number(
                                              receiptItem.receivedQuantity
                                          )
                                        : 0;

                                return (
                                    currentReceived +
                                        receivedInThisGRN >=
                                    Number(
                                        poItem.quantity
                                    )
                                );
                            }
                        );

                    const grnStatus =
                        status === "DRAFT"
                            ? "DRAFT"
                            : allPOItemsFullyReceived
                            ? "RECEIVED"
                            : "PARTIALLY_RECEIVED";

                    // ==========================================
                    // Generate GRN Number
                    // ==========================================

                    const grnNumber =
                        await generateGRNNumber(
                            company,
                            session
                        );

                    // ==========================================
                    // Create Goods Receipt
                    // ==========================================

                    const goodsReceipt =
                        await GoodsReceipt.create(
                            [
                                {
                                    company,
                                    branch,
                                    purchaseOrder,

                                    supplier:
                                        purchaseOrderData.supplier,

                                    warehouse,

                                    grnNumber,

                                    receiptDate:
                                        receiptDate ||
                                        new Date(),

                                    invoiceNumber:
                                        invoiceNumber ||
                                        "",

                                    invoiceDate:
                                        invoiceDate ||
                                        null,

                                    vehicleNumber:
                                        vehicleNumber ||
                                        "",

                                    receivedBy:
                                        req.user._id,

                                    status:
                                        grnStatus,

                                    totalQuantity:
                                        roundQuantity(
                                            totalQuantity
                                        ),

                                    totalAmount:
                                        roundAmount(
                                            totalAmount
                                        ),

                                    notes,

                                    rejectionReason,

                                    createdBy:
                                        req.user._id,
                                },
                            ],
                            {
                                session,
                            }
                        ).then(
                            (result) =>
                                result[0]
                        );

                    // ==========================================
                    // Create GRN Items
                    // ==========================================

                    const itemDocuments =
                        processedItems.map(
                            (item) => ({
                                company,
                                branch,

                                goodsReceipt:
                                    goodsReceipt._id,

                                purchaseOrder,

                                purchaseOrderItem:
                                    item.purchaseOrderItem,

                                product:
                                    item.product,

                                orderedQuantity:
                                    item.orderedQuantity,

                                previouslyReceivedQuantity:
                                    item.previouslyReceivedQuantity,

                                receivedQuantity:
                                    item.receivedQuantity,

                                rejectedQuantity:
                                    item.rejectedQuantity,

                                acceptedQuantity:
                                    item.acceptedQuantity,

                                pendingQuantity:
                                    item.pendingQuantity,

                                unitPrice:
                                    item.unitPrice,

                                discountPercentage:
                                    item.discountPercentage,

                                discountAmount:
                                    item.discountAmount,

                                taxPercentage:
                                    item.taxPercentage,

                                taxAmount:
                                    item.taxAmount,

                                taxableAmount:
                                    item.taxableAmount,

                                lineTotal:
                                    item.lineTotal,

                                batchNumber:
                                    item.batchNumber,

                                serialNumbers:
                                    item.serialNumbers,

                                expiryDate:
                                    item.expiryDate,

                                manufacturingDate:
                                    item.manufacturingDate,

                                notes:
                                    item.notes,
                            })
                        );

                    await GoodsReceiptItem.insertMany(
                        itemDocuments,
                        {
                            session,
                        }
                    );

                    // ==========================================
                    // Track Changed Stocks
                    // ==========================================

                    const affectedStocks = [];

                    // ==========================================
                    // DRAFT
                    // ==========================================

                    if (
                        grnStatus === "DRAFT"
                    ) {
                        return {
                            goodsReceipt,
                            processedItems,
                            affectedStocks,
                        };
                    }

                    // ==========================================
                    // UPDATE PO ITEMS + STOCK
                    // ==========================================

                    for (
                        const item of processedItems
                    ) {
                        // ------------------------------------------
                        // Fresh PO Item
                        // ------------------------------------------

                        const poItem =
                            await PurchaseOrderItem.findOne(
                                {
                                    _id:
                                        item.purchaseOrderItem,

                                    purchaseOrder,

                                    company,

                                    branch,
                                }
                            ).session(
                                session
                            );

                        if (!poItem) {
                            throw new Error(
                                "Purchase order item not found during transaction"
                            );
                        }

                        // ------------------------------------------
                        // Re-check pending quantity
                        // ------------------------------------------

                        const currentReceived =
                            Number(
                                poItem.receivedQuantity ||
                                    0
                            );

                        const currentPending =
                            Math.max(
                                Number(
                                    poItem.quantity
                                ) -
                                    currentReceived,
                                0
                            );

                        if (
                            item.receivedQuantity >
                            currentPending
                        ) {
                            throw new Error(
                                `Received quantity exceeds current pending quantity (${currentPending})`
                            );
                        }

                        // ------------------------------------------
                        // Update PO Received Quantity
                        // ------------------------------------------

                        poItem.receivedQuantity =
                            roundQuantity(
                                currentReceived +
                                    item.receivedQuantity
                            );

                        // ------------------------------------------
                        // Update Pending Quantity
                        // ------------------------------------------

                        poItem.pendingQuantity =
                            roundQuantity(
                                Math.max(
                                    Number(
                                        poItem.quantity
                                    ) -
                                        poItem.receivedQuantity,
                                    0
                                )
                            );

                        await poItem.save({
                            session,
                        });

                        // ==========================================
                        // STOCK SERVICE
                        // ==========================================

                        const acceptedQuantity =
                            Number(
                                item.acceptedQuantity ||
                                    0
                            );

                        if (
                            acceptedQuantity > 0
                        ) {
                            const stockResult =
                                await increaseStock({
                                    company,

                                    branch,

                                    warehouse,

                                    product:
                                        item.product,

                                    quantity:
                                        acceptedQuantity,

                                    movementType:
                                        "PURCHASE",

                                    referenceType:
                                        "GOODS_RECEIPT",

                                    referenceId:
                                        goodsReceipt._id,

                                    referenceNumber:
                                        goodsReceipt.grnNumber,

                                    unitPrice:
                                        Number(
                                            item.unitPrice ||
                                                0
                                        ),

                                    reason:
                                        "Goods received from supplier",

                                    notes:
                                        item.notes ||
                                        `Stock added through GRN ${goodsReceipt.grnNumber}`,

                                    createdBy:
                                        req.user._id,

                                    session,
                                });

                            // ------------------------------------------
                            // Capture affected stock
                            // ------------------------------------------

                            if (
                                stockResult &&
                                stockResult.stock
                            ) {
                                affectedStocks.push(
                                    stockResult.stock
                                );
                            }
                        }
                    }

                    // ==========================================
                    // UPDATE PURCHASE ORDER STATUS
                    // ==========================================

                    const updatedPOItems =
                        await PurchaseOrderItem.find({
                            purchaseOrder,
                            company,
                            branch,
                        }).session(
                            session
                        );

                    const fullyReceived =
                        updatedPOItems.every(
                            (item) =>
                                Number(
                                    item.receivedQuantity ||
                                        0
                                ) >=
                                Number(
                                    item.quantity
                                )
                        );

                    const partiallyReceived =
                        updatedPOItems.some(
                            (item) =>
                                Number(
                                    item.receivedQuantity ||
                                        0
                                ) > 0
                        );

                    if (
                        fullyReceived
                    ) {
                        purchaseOrderData.status =
                            "RECEIVED";
                    } else if (
                        partiallyReceived
                    ) {
                        purchaseOrderData.status =
                            "PARTIALLY_RECEIVED";
                    }

                    purchaseOrderData.updatedBy =
                        req.user._id;

                    await purchaseOrderData.save({
                        session,
                    });

                    // ==========================================
                    // RETURN TRANSACTION RESULT
                    // ==========================================

                    return {
                        goodsReceipt,
                        processedItems,
                        affectedStocks,
                    };
                }
            );

        // ==========================================
        // POPULATE GOODS RECEIPT
        // ==========================================

        const populatedGRN =
            await GoodsReceipt.findById(
                result.goodsReceipt._id
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
                    "purchaseOrder",
                    "poNumber orderDate status totalAmount"
                )
                .populate(
                    "receivedBy",
                    "name email"
                )
                .populate(
                    "createdBy",
                    "name email"
                );

        // ==========================================
        // Populate GRN Items
        // ==========================================

        const populatedItems =
            await GoodsReceiptItem.find({
                goodsReceipt:
                    result.goodsReceipt._id,
            }).populate(
                "product",
                "name sku barcode purchasePrice sellingPrice taxRate"
            );

        // ==========================================
        // GOODS RECEIPT NOTIFICATION
        // ==========================================

        let notificationEvent =
            "RECEIVED";

        if (
            result.goodsReceipt.status ===
            "DRAFT"
        ) {
            notificationEvent =
                "DRAFT";
        } else if (
            result.goodsReceipt.status ===
            "PARTIALLY_RECEIVED"
        ) {
            notificationEvent =
                "PARTIALLY_RECEIVED";
        }

        await sendGoodsReceiptNotification({
            goodsReceipt:
                result.goodsReceipt,
            recipient:
                req.user._id,
            event:
                notificationEvent,
        });

        // ==========================================
        // STOCK NOTIFICATIONS
        // ==========================================

        if (
            result.goodsReceipt.status !==
                "DRAFT" &&
            result.affectedStocks &&
            result.affectedStocks.length > 0
        ) {
            await sendGoodsReceiptStockNotifications({
                goodsReceipt:
                    result.goodsReceipt,
                stocks:
                    result.affectedStocks,
                recipient:
                    req.user._id,
                createdBy:
                    req.user._id,
            });
        }

        // ==========================================
        // SUCCESS RESPONSE
        // ==========================================

        return res.status(201).json({
            success: true,

            message:
                result.goodsReceipt.status ===
                "DRAFT"
                    ? "Goods receipt draft created successfully"
                    : "Goods receipt created successfully",

            data: {
                goodsReceipt:
                    populatedGRN,

                items:
                    populatedItems,
            },
        });
    } catch (error) {
        console.error(
            "Create Goods Receipt Error:",
            error
        );

        next(error);
    }
};

// ==========================================
// GET ALL GOODS RECEIPTS
// ==========================================

const getGoodsReceipts = async (
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
            purchaseOrder,
            status,
            search,
            startDate,
            endDate,
            page = 1,
            limit = 10,
        } = req.query;

        const filter = {};

        // ==========================================
        // Validate ObjectIds
        // ==========================================

        const objectIdFields = {
            company,
            branch,
            supplier,
            warehouse,
            purchaseOrder,
        };

        for (const [
            field,
            value,
        ] of Object.entries(
            objectIdFields
        )) {
            if (
                value &&
                !isValidObjectId(value)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Invalid ${field}`,
                });
            }
        }

        // ==========================================
        // Filters
        // ==========================================

        if (company) {
            filter.company =
                company;
        }

        if (branch) {
            filter.branch =
                branch;
        }

        if (supplier) {
            filter.supplier =
                supplier;
        }

        if (warehouse) {
            filter.warehouse =
                warehouse;
        }

        if (purchaseOrder) {
            filter.purchaseOrder =
                purchaseOrder;
        }

        if (status) {
            const normalizedStatus =
                status.toUpperCase();

            if (
                ![
                    "DRAFT",
                    "RECEIVED",
                    "PARTIALLY_RECEIVED",
                ].includes(
                    normalizedStatus
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid status",
                });
            }

            filter.status =
                normalizedStatus;
        }

        // ==========================================
        // Search
        // ==========================================

        if (search) {
            const searchText =
                search.trim();

            filter.$or = [
                {
                    grnNumber: {
                        $regex:
                            searchText,
                        $options: "i",
                    },
                },
                {
                    invoiceNumber: {
                        $regex:
                            searchText,
                        $options: "i",
                    },
                },
                {
                    vehicleNumber: {
                        $regex:
                            searchText,
                        $options: "i",
                    },
                },
            ];
        }

        // ==========================================
        // Date Filter
        // ==========================================

        if (
            startDate ||
            endDate
        ) {
            filter.receiptDate =
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
                            "Invalid startDate",
                    });
                }

                filter.receiptDate.$gte =
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
                            "Invalid endDate",
                    });
                }

                end.setHours(
                    23,
                    59,
                    59,
                    999
                );

                filter.receiptDate.$lte =
                    end;
            }
        }

        // ==========================================
        // Pagination
        // ==========================================

        const pageNumber =
            Math.max(
                Number(page) || 1,
                1
            );

        const limitNumber =
            Math.min(
                Math.max(
                    Number(limit) || 10,
                    1
                ),
                100
            );

        const skip =
            (pageNumber - 1) *
            limitNumber;

        // ==========================================
        // Query
        // ==========================================

        const [
            receipts,
            total,
        ] =
            await Promise.all([
                GoodsReceipt.find(
                    filter
                )
                    .populate(
                        "supplier",
                        "supplierCode name"
                    )
                    .populate(
                        "warehouse",
                        "name code"
                    )
                    .populate(
                        "purchaseOrder",
                        "poNumber status"
                    )
                    .populate(
                        "receivedBy",
                        "name email"
                    )
                    .sort({
                        receiptDate:
                            -1,
                        createdAt:
                            -1,
                    })
                    .skip(skip)
                    .limit(
                        limitNumber
                    ),

                GoodsReceipt.countDocuments(
                    filter
                ),
            ]);

        // ==========================================
        // Response
        // ==========================================

        return res.status(200).json({
            success: true,

            count:
                receipts.length,

            total,

            page:
                pageNumber,

            pages:
                Math.ceil(
                    total /
                        limitNumber
                ),

            data:
                receipts,
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// GET GOODS RECEIPT BY ID
// ==========================================

const getGoodsReceiptById = async (
    req,
    res,
    next
) => {
    try {
        const { id } =
            req.params;

        // ==========================================
        // Validate ID
        // ==========================================

        if (
            !isValidObjectId(id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid goods receipt ID",
            });
        }

        // ==========================================
        // Find GRN
        // ==========================================

        const goodsReceipt =
            await GoodsReceipt.findById(
                id
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
                    "purchaseOrder",
                    "poNumber orderDate status totalAmount"
                )
                .populate(
                    "receivedBy",
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

        // ==========================================
        // Not Found
        // ==========================================

        if (!goodsReceipt) {
            return res.status(404).json({
                success: false,
                message:
                    "Goods receipt not found",
            });
        }

        // ==========================================
        // Get Items
        // ==========================================

        const items =
            await GoodsReceiptItem.find({
                goodsReceipt: id,
            }).populate(
                "product",
                "name sku barcode purchasePrice sellingPrice taxRate"
            );

        // ==========================================
        // Response
        // ==========================================

        return res.status(200).json({
            success: true,

            data: {
                goodsReceipt,

                items,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    createGoodsReceipt,
    getGoodsReceipts,
    getGoodsReceiptById,
};