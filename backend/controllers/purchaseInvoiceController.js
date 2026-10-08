const mongoose = require("mongoose");

const PurchaseInvoice = require("../models/PurchaseInvoice");
const PurchaseInvoiceItem = require("../models/PurchaseInvoiceItem");
const PurchaseOrder = require("../models/PurchaseOrder");
const PurchaseOrderItem = require("../models/PurchaseOrderItem");
const GoodsReceipt = require("../models/GoodsReceipt");
const GoodsReceiptItem = require("../models/GoodsReceiptItem");
const Supplier = require("../models/Supplier");
const Product = require("../models/Product");

const {
    createNotification,
} = require("../services/notificationService");

// ============================================================
// Helpers
// ============================================================

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const roundAmount = (value) => {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

// ============================================================
// Purchase Invoice Notification
// ============================================================

const sendPurchaseInvoiceNotification = async ({
    invoice,
    recipient,
    event,
}) => {
    try {
        if (!invoice || !recipient) {
            return;
        }

        let title = "";
        let message = "";
        let priority = "MEDIUM";

        switch (event) {
            case "CREATED":
                title = "Purchase Invoice Created";
                message = `Purchase invoice ${invoice.internalInvoiceNumber} has been created for supplier ${invoice.supplier?.name || "Unknown Supplier"}.`;
                priority = "MEDIUM";
                break;

            case "POSTED":
                title = "Purchase Invoice Posted";
                message = `Purchase invoice ${invoice.internalInvoiceNumber} has been posted successfully. Total amount: ${invoice.totalAmount}.`;
                priority = "HIGH";
                break;

            case "UPDATED":
                title = "Purchase Invoice Updated";
                message = `Purchase invoice ${invoice.internalInvoiceNumber} has been updated.`;
                priority = "MEDIUM";
                break;

            default:
                return;
        }

        await createNotification({
            company: invoice.company,
            branch: invoice.branch,
            recipient,
            type: "PURCHASE_INVOICE",
            title,
            message,
            priority,
            referenceType: "PURCHASE_INVOICE",
            referenceId: invoice._id,
            metadata: {
                event,
                invoiceId: invoice._id,
                invoiceNumber: invoice.invoiceNumber,
                internalInvoiceNumber:
                    invoice.internalInvoiceNumber,
                supplierId:
                    invoice.supplier?._id ||
                    invoice.supplier ||
                    null,
                supplierName:
                    invoice.supplier?.name ||
                    invoice.supplier?.companyName ||
                    "",
                purchaseOrderId:
                    invoice.purchaseOrder || null,
                goodsReceiptId:
                    invoice.goodsReceipt || null,
                invoiceDate:
                    invoice.invoiceDate || null,
                dueDate:
                    invoice.dueDate || null,
                totalAmount:
                    Number(invoice.totalAmount || 0),
                paidAmount:
                    Number(invoice.paidAmount || 0),
                dueAmount:
                    Number(invoice.dueAmount || 0),
                paymentStatus:
                    invoice.paymentStatus || "",
                status:
                    invoice.status || "",
            },
            createdBy: recipient,
        });
    } catch (error) {
        // Notification failure must never break invoice operation
        console.error(
            "Purchase Invoice Notification Error:",
            error.message
        );
    }
};

// ============================================================
// Generate Internal Invoice Number
// ============================================================

const generateInternalInvoiceNumber = async () => {
    const lastInvoice = await PurchaseInvoice.findOne({})
        .sort({ createdAt: -1 })
        .select("internalInvoiceNumber");

    if (!lastInvoice) {
        return "PINV-000001";
    }

    const match =
        lastInvoice.internalInvoiceNumber.match(
            /(\d+)$/
        );

    const nextNumber = match
        ? Number(match[1]) + 1
        : 1;

    return `PINV-${String(nextNumber).padStart(6, "0")}`;
};

// ============================================================
// Populate Invoice
// ============================================================

const populatePurchaseInvoice = async (invoiceId) => {
    return await PurchaseInvoice.findById(invoiceId)
        .populate(
            "company",
            "name legalName email phone gstNumber panNumber"
        )
        .populate(
            "branch",
            "name branchCode email phone"
        )
        .populate(
            "supplier",
            "supplierCode name companyName email phone gstNumber panNumber paymentTerms creditLimit"
        )
        .populate(
            "purchaseOrder",
            "poNumber orderDate status totalAmount"
        )
        .populate(
            "goodsReceipt",
            "grnNumber receiptDate status totalQuantity totalAmount"
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
// Create Purchase Invoice
// ============================================================

const createPurchaseInvoice = async (req, res, next) => {
    try {
        const {
            company,
            branch,
            supplier,
            purchaseOrder,
            goodsReceipt,
            invoiceNumber,
            invoiceDate,
            dueDate,
            paymentTerms,
            currency,
            shippingAmount,
            otherCharges,
            roundOffAmount,
            paidAmount,
            notes,
            termsAndConditions,
            items,
        } = req.body;

        // ----------------------------------------------------
        // Basic Validation
        // ----------------------------------------------------

        if (!company || !isValidObjectId(company)) {
            return res.status(400).json({
                success: false,
                message: "Valid company is required",
            });
        }

        if (!branch || !isValidObjectId(branch)) {
            return res.status(400).json({
                success: false,
                message: "Valid branch is required",
            });
        }

        if (!supplier || !isValidObjectId(supplier)) {
            return res.status(400).json({
                success: false,
                message: "Valid supplier is required",
            });
        }

        if (!invoiceNumber?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Invoice number is required",
            });
        }

        if (
            purchaseOrder &&
            !isValidObjectId(purchaseOrder)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid purchase order ID",
            });
        }

        if (
            goodsReceipt &&
            !isValidObjectId(goodsReceipt)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid goods receipt ID",
            });
        }

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "At least one invoice item is required",
            });
        }

        // ----------------------------------------------------
        // Validate Supplier
        // ----------------------------------------------------

        const supplierDoc =
            await Supplier.findById(supplier);

        if (!supplierDoc) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found",
            });
        }

        if (
            supplierDoc.company.toString() !==
            company.toString()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Supplier does not belong to selected company",
            });
        }

        if (
            supplierDoc.branch.toString() !==
            branch.toString()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Supplier does not belong to selected branch",
            });
        }

        // ----------------------------------------------------
        // Duplicate Supplier Invoice Number
        // ----------------------------------------------------

        const existingInvoice =
            await PurchaseInvoice.findOne({
                company,
                invoiceNumber:
                    invoiceNumber.trim().toUpperCase(),
            });

        if (existingInvoice) {
            return res.status(409).json({
                success: false,
                message:
                    "Supplier invoice number already exists",
            });
        }

        // ----------------------------------------------------
        // Validate Purchase Order
        // ----------------------------------------------------

        let purchaseOrderDoc = null;

        if (purchaseOrder) {
            purchaseOrderDoc =
                await PurchaseOrder.findById(
                    purchaseOrder
                );

            if (!purchaseOrderDoc) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Purchase order not found",
                });
            }

            if (
                purchaseOrderDoc.company.toString() !==
                company.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Purchase order does not belong to selected company",
                });
            }

            if (
                purchaseOrderDoc.branch.toString() !==
                branch.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Purchase order does not belong to selected branch",
                });
            }

            if (
                purchaseOrderDoc.supplier.toString() !==
                supplier.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Purchase order supplier does not match invoice supplier",
                });
            }

            if (
                ![
                    "APPROVED",
                    "SENT",
                    "PARTIALLY_RECEIVED",
                    "RECEIVED",
                ].includes(
                    purchaseOrderDoc.status
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Purchase order is not eligible for invoicing",
                });
            }
        }

        // ----------------------------------------------------
        // Validate Goods Receipt
        // ----------------------------------------------------

        let goodsReceiptDoc = null;

        if (goodsReceipt) {
            goodsReceiptDoc =
                await GoodsReceipt.findById(
                    goodsReceipt
                );

            if (!goodsReceiptDoc) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Goods receipt not found",
                });
            }

            if (
                goodsReceiptDoc.company.toString() !==
                company.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Goods receipt does not belong to selected company",
                });
            }

            if (
                goodsReceiptDoc.branch.toString() !==
                branch.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Goods receipt does not belong to selected branch",
                });
            }

            if (
                goodsReceiptDoc.supplier.toString() !==
                supplier.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Goods receipt supplier does not match invoice supplier",
                });
            }

            if (
                purchaseOrder &&
                goodsReceiptDoc.purchaseOrder.toString() !==
                    purchaseOrder.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Goods receipt does not belong to selected purchase order",
                });
            }

            if (
                ![
                    "RECEIVED",
                    "PARTIALLY_RECEIVED",
                ].includes(
                    goodsReceiptDoc.status
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Goods receipt is not eligible for invoicing",
                });
            }
        }

        // ----------------------------------------------------
        // Duplicate Products
        // ----------------------------------------------------

        const productIds = items.map(
            (item) =>
                item.product?.toString()
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
                    "Duplicate products are not allowed in one invoice",
            });
        }

        // ----------------------------------------------------
        // Load PO Items
        // ----------------------------------------------------

        let purchaseOrderItems = [];

        if (purchaseOrder) {
            purchaseOrderItems =
                await PurchaseOrderItem.find({
                    purchaseOrder,
                });

            if (
                purchaseOrderItems.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Purchase order has no items",
                });
            }
        }

        const poItemMap = new Map();

        purchaseOrderItems.forEach((item) => {
            poItemMap.set(
                item._id.toString(),
                item
            );
        });

        // ----------------------------------------------------
        // Load GRN Items
        // ----------------------------------------------------

        let goodsReceiptItems = [];

        if (goodsReceipt) {
            goodsReceiptItems =
                await GoodsReceiptItem.find({
                    goodsReceipt,
                });

            if (
                goodsReceiptItems.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Goods receipt has no items",
                });
            }
        }

        const grnItemMap = new Map();

        goodsReceiptItems.forEach((item) => {
            grnItemMap.set(
                item._id.toString(),
                item
            );
        });

        // ----------------------------------------------------
        // Validate & Calculate Items
        // ----------------------------------------------------

        const invoiceItems = [];

        let subtotal = 0;
        let discountAmount = 0;
        let taxAmount = 0;

        for (const item of items) {
            const {
                product,
                quantity,
                unitPrice,
                discountPercentage = 0,
                taxPercentage = 0,
                cessPercentage = 0,
                purchaseOrderItem,
                goodsReceiptItem,
                notes = "",
            } = item;

            if (
                !product ||
                !isValidObjectId(product)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Valid product is required for every item",
                });
            }

            const qty = Number(quantity);
            const price = Number(unitPrice);
            const discountPct =
                Number(discountPercentage);
            const taxPct =
                Number(taxPercentage);
            const cessPct =
                Number(cessPercentage);

            if (
                !Number.isFinite(qty) ||
                qty <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Quantity must be greater than 0",
                });
            }

            if (
                !Number.isFinite(price) ||
                price < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Unit price cannot be negative",
                });
            }

            if (
                discountPct < 0 ||
                discountPct > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Discount percentage must be between 0 and 100",
                });
            }

            if (
                taxPct < 0 ||
                taxPct > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Tax percentage must be between 0 and 100",
                });
            }

            if (
                cessPct < 0 ||
                cessPct > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Cess percentage must be between 0 and 100",
                });
            }

            // ------------------------------------------------
            // Product Validation
            // ------------------------------------------------

            const productDoc =
                await Product.findById(product);

            if (!productDoc) {
                return res.status(404).json({
                    success: false,
                    message:
                        `Product not found: ${product}`,
                });
            }

            if (
                productDoc.company.toString() !==
                company.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Product does not belong to selected company",
                });
            }

            // ------------------------------------------------
            // PO Item Validation
            // ------------------------------------------------

            let poItem = null;

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

                poItem =
                    poItemMap.get(
                        purchaseOrderItem.toString()
                    );

                if (!poItem) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Purchase order item does not belong to selected purchase order",
                    });
                }

                if (
                    poItem.product.toString() !==
                    product.toString()
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Product does not match purchase order item",
                    });
                }
            }

            // ------------------------------------------------
            // GRN Item Validation
            // ------------------------------------------------

            let grnItem = null;

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

                grnItem =
                    grnItemMap.get(
                        goodsReceiptItem.toString()
                    );

                if (!grnItem) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Goods receipt item does not belong to selected goods receipt",
                    });
                }

                if (
                    grnItem.product.toString() !==
                    product.toString()
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Product does not match goods receipt item",
                    });
                }

                if (
                    qty >
                    Number(
                        grnItem.acceptedQuantity
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invoice quantity cannot exceed accepted goods receipt quantity",
                    });
                }
            }

            // ------------------------------------------------
            // Calculation
            // ------------------------------------------------

            const grossAmount =
                roundAmount(qty * price);

            const itemDiscount =
                roundAmount(
                    (grossAmount *
                        discountPct) /
                        100
                );

            const taxable =
                roundAmount(
                    grossAmount -
                        itemDiscount
                );

            const itemTax =
                roundAmount(
                    (taxable * taxPct) /
                        100
                );

            const cessAmount =
                roundAmount(
                    (taxable * cessPct) /
                        100
                );

            const lineTotal =
                roundAmount(
                    taxable +
                        itemTax +
                        cessAmount
                );

            subtotal += grossAmount;
            discountAmount += itemDiscount;
            taxAmount += itemTax;

            invoiceItems.push({
                company,
                branch,
                purchaseInvoice: null,

                purchaseOrder:
                    purchaseOrder || null,

                goodsReceipt:
                    goodsReceipt || null,

                purchaseOrderItem:
                    purchaseOrderItem || null,

                goodsReceiptItem:
                    goodsReceiptItem || null,

                product,

                quantity: qty,

                unitPrice: price,

                discountPercentage:
                    discountPct,

                discountAmount:
                    itemDiscount,

                taxableAmount:
                    taxable,

                taxPercentage:
                    taxPct,

                taxAmount:
                    itemTax,

                cessPercentage:
                    cessPct,

                cessAmount,

                lineTotal,

                notes,
            });
        }

        subtotal = roundAmount(subtotal);

        discountAmount =
            roundAmount(discountAmount);

        taxAmount =
            roundAmount(taxAmount);

        // ----------------------------------------------------
        // Other Charges
        // ----------------------------------------------------

        const shipping =
            Number(shippingAmount || 0);

        const other =
            Number(otherCharges || 0);

        const roundOff =
            Number(roundOffAmount || 0);

        const paid =
            Number(paidAmount || 0);

        if (
            shipping < 0 ||
            other < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Shipping and other charges cannot be negative",
            });
        }

        if (!Number.isFinite(paid) || paid < 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Paid amount cannot be negative",
            });
        }

        // ----------------------------------------------------
        // Total
        // ----------------------------------------------------

        const totalAmount =
            roundAmount(
                subtotal -
                    discountAmount +
                    taxAmount +
                    shipping +
                    other +
                    roundOff
            );

        if (paid > totalAmount) {
            return res.status(400).json({
                success: false,
                message:
                    "Paid amount cannot exceed invoice total",
            });
        }

        const dueAmount =
            roundAmount(
                totalAmount - paid
            );

        let paymentStatus = "UNPAID";

        if (paid > 0 && dueAmount > 0) {
            paymentStatus = "PARTIALLY_PAID";
        } else if (
            totalAmount > 0 &&
            dueAmount === 0
        ) {
            paymentStatus = "PAID";
        }

        // ----------------------------------------------------
        // Generate Internal Invoice Number
        // ----------------------------------------------------

        const internalInvoiceNumber =
            await generateInternalInvoiceNumber();

        // ----------------------------------------------------
        // Create Invoice
        // ----------------------------------------------------

        const invoice =
            await PurchaseInvoice.create({
                company,
                branch,
                supplier,

                purchaseOrder:
                    purchaseOrder || null,

                goodsReceipt:
                    goodsReceipt || null,

                invoiceNumber:
                    invoiceNumber
                        .trim()
                        .toUpperCase(),

                internalInvoiceNumber,

                invoiceDate:
                    invoiceDate || new Date(),

                dueDate:
                    dueDate || null,

                paymentTerms:
                    Number(paymentTerms || 0),

                currency:
                    currency
                        ?.trim()
                        .toUpperCase() || "INR",

                subtotal,

                discountAmount,

                taxAmount,

                shippingAmount:
                    roundAmount(shipping),

                otherCharges:
                    roundAmount(other),

                roundOffAmount:
                    roundAmount(roundOff),

                totalAmount,

                paidAmount: paid,

                dueAmount,

                paymentStatus,

                status: "POSTED",

                notes:
                    notes || "",

                termsAndConditions:
                    termsAndConditions || "",

                createdBy: req.user._id,
            });

        // ----------------------------------------------------
        // Attach Invoice ID to Items
        // ----------------------------------------------------

        const finalInvoiceItems =
            invoiceItems.map((item) => ({
                ...item,
                purchaseInvoice:
                    invoice._id,
            }));

        try {
            await PurchaseInvoiceItem.insertMany(
                finalInvoiceItems
            );
        } catch (error) {
            await PurchaseInvoice.findByIdAndDelete(
                invoice._id
            );

            throw error;
        }

        // ----------------------------------------------------
        // Populate Invoice
        // ----------------------------------------------------

        const populatedInvoice =
            await populatePurchaseInvoice(
                invoice._id
            );

        const createdItems =
            await PurchaseInvoiceItem.find({
                purchaseInvoice:
                    invoice._id,
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
                .sort({
                    createdAt: 1,
                });

        // ----------------------------------------------------
        // Purchase Invoice Notification
        // ----------------------------------------------------

        await sendPurchaseInvoiceNotification({
            invoice: populatedInvoice,
            recipient: req.user._id,
            event: "POSTED",
        });

        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        return res.status(201).json({
            success: true,
            message:
                "Purchase invoice created successfully",
            data: {
                invoice:
                    populatedInvoice,
                items:
                    createdItems,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// Get All Purchase Invoices
// ============================================================

const getPurchaseInvoices = async (
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
            status,
            paymentStatus,
            search,
            startDate,
            endDate,
            page = 1,
            limit = 20,
        } = req.query;

        const filter = {};

        if (company) {
            if (!isValidObjectId(company)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid company ID",
                });
            }

            filter.company = company;
        }

        if (branch) {
            if (!isValidObjectId(branch)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid branch ID",
                });
            }

            filter.branch = branch;
        }

        if (supplier) {
            if (!isValidObjectId(supplier)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid supplier ID",
                });
            }

            filter.supplier = supplier;
        }

        if (purchaseOrder) {
            if (
                !isValidObjectId(
                    purchaseOrder
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid purchase order ID",
                });
            }

            filter.purchaseOrder =
                purchaseOrder;
        }

        if (goodsReceipt) {
            if (
                !isValidObjectId(
                    goodsReceipt
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid goods receipt ID",
                });
            }

            filter.goodsReceipt =
                goodsReceipt;
        }

        if (status) {
            filter.status = status
                .trim()
                .toUpperCase();
        }

        if (paymentStatus) {
            filter.paymentStatus =
                paymentStatus
                    .trim()
                    .toUpperCase();
        }

        if (search?.trim()) {
            const searchRegex =
                new RegExp(
                    search.trim(),
                    "i"
                );

            const suppliers =
                await Supplier.find({
                    $or: [
                        {
                            name: searchRegex,
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
                }).select("_id");

            filter.$or = [
                {
                    invoiceNumber:
                        searchRegex,
                },
                {
                    internalInvoiceNumber:
                        searchRegex,
                },
                {
                    supplier: {
                        $in: suppliers.map(
                            (item) =>
                                item._id
                        ),
                    },
                },
            ];
        }

        if (startDate || endDate) {
            filter.invoiceDate = {};

            if (startDate) {
                filter.invoiceDate.$gte =
                    new Date(startDate);
            }

            if (endDate) {
                const end =
                    new Date(endDate);

                end.setHours(
                    23,
                    59,
                    59,
                    999
                );

                filter.invoiceDate.$lte =
                    end;
            }
        }

        const pageNumber =
            Math.max(Number(page), 1);

        const limitNumber =
            Math.min(
                Math.max(Number(limit), 1),
                100
            );

        const skip =
            (pageNumber - 1) *
            limitNumber;

        const [
            invoices,
            total,
        ] = await Promise.all([
            PurchaseInvoice.find(filter)
                .populate(
                    "supplier",
                    "supplierCode name companyName email phone"
                )
                .populate(
                    "purchaseOrder",
                    "poNumber status totalAmount"
                )
                .populate(
                    "goodsReceipt",
                    "grnNumber status totalAmount"
                )
                .populate(
                    "branch",
                    "name branchCode"
                )
                .sort({
                    invoiceDate: -1,
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limitNumber),

            PurchaseInvoice.countDocuments(
                filter
            ),
        ]);

        return res.status(200).json({
            success: true,
            data: invoices,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages:
                    Math.ceil(
                        total /
                            limitNumber
                    ),
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// Get Purchase Invoice By ID
// ============================================================

const getPurchaseInvoiceById = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid purchase invoice ID",
            });
        }

        const invoice =
            await populatePurchaseInvoice(
                id
            );

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message:
                    "Purchase invoice not found",
            });
        }

        const items =
            await PurchaseInvoiceItem.find({
                purchaseInvoice: id,
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
                .sort({
                    createdAt: 1,
                });

        return res.status(200).json({
            success: true,
            data: {
                invoice,
                items,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// Update Purchase Invoice
// ============================================================

const updatePurchaseInvoice = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid purchase invoice ID",
            });
        }

        const invoice =
            await PurchaseInvoice.findById(id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message:
                    "Purchase invoice not found",
            });
        }

        if (
            ![
                "DRAFT",
                "POSTED",
            ].includes(invoice.status)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only draft or posted invoices can be updated",
            });
        }

        // ----------------------------------------------------
        // Prevent changing accounting references
        // ----------------------------------------------------

        if (
            req.body.purchaseOrder &&
            invoice.purchaseOrder &&
            req.body.purchaseOrder.toString() !==
                invoice.purchaseOrder.toString()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Purchase order cannot be changed after invoice creation",
            });
        }

        if (
            req.body.goodsReceipt &&
            invoice.goodsReceipt &&
            req.body.goodsReceipt.toString() !==
                invoice.goodsReceipt.toString()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Goods receipt cannot be changed after invoice creation",
            });
        }

        const allowedFields = [
            "invoiceDate",
            "dueDate",
            "paymentTerms",
            "currency",
            "shippingAmount",
            "otherCharges",
            "roundOffAmount",
            "paidAmount",
            "notes",
            "termsAndConditions",
        ];

        allowedFields.forEach((field) => {
            if (
                req.body[field] !==
                undefined
            ) {
                invoice[field] =
                    req.body[field];
            }
        });

        const paid =
            Number(
                invoice.paidAmount || 0
            );

        if (
            !Number.isFinite(paid) ||
            paid < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Paid amount cannot be negative",
            });
        }

        if (
            paid > invoice.totalAmount
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Paid amount cannot exceed invoice total",
            });
        }

        invoice.dueAmount =
            roundAmount(
                invoice.totalAmount -
                    paid
            );

        if (paid === 0) {
            invoice.paymentStatus =
                "UNPAID";
        } else if (
            invoice.dueAmount > 0
        ) {
            invoice.paymentStatus =
                "PARTIALLY_PAID";
        } else {
            invoice.paymentStatus =
                "PAID";
        }

        invoice.updatedBy =
            req.user._id;

        await invoice.save();

        const populatedInvoice =
            await populatePurchaseInvoice(
                invoice._id
            );

        const items =
            await PurchaseInvoiceItem.find({
                purchaseInvoice:
                    invoice._id,
            })
                .populate(
                    "product",
                    "name sku barcode purchasePrice sellingPrice taxRate"
                )
                .sort({
                    createdAt: 1,
                });

        // ----------------------------------------------------
        // Purchase Invoice Updated Notification
        // ----------------------------------------------------

        await sendPurchaseInvoiceNotification({
            invoice: populatedInvoice,
            recipient: req.user._id,
            event: "UPDATED",
        });

        return res.status(200).json({
            success: true,
            message:
                "Purchase invoice updated successfully",
            data: {
                invoice:
                    populatedInvoice,
                items,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// Delete Purchase Invoice
// ============================================================

const deletePurchaseInvoice = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid purchase invoice ID",
            });
        }

        const invoice =
            await PurchaseInvoice.findById(id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message:
                    "Purchase invoice not found",
            });
        }

        if (
            invoice.status !== "DRAFT"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only draft purchase invoices can be deleted",
            });
        }

        await PurchaseInvoiceItem.deleteMany({
            purchaseInvoice: id,
        });

        await PurchaseInvoice.findByIdAndDelete(
            id
        );

        return res.status(200).json({
            success: true,
            message:
                "Purchase invoice deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// Exports
// ============================================================

module.exports = {
    createPurchaseInvoice,
    getPurchaseInvoices,
    getPurchaseInvoiceById,
    updatePurchaseInvoice,
    deletePurchaseInvoice,
};