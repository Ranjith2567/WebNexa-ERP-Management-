const mongoose = require("mongoose");

const SalesReturn = require("../models/SalesReturn");
const SalesInvoice = require("../models/SalesInvoice");
const SalesOrder = require("../models/SalesOrder");
const Customer = require("../models/Customer");
const Warehouse = require("../models/Warehouse");
const Product = require("../models/Product");

const { withTransaction } = require("../utils/withTransaction");

const {
    increaseStock,
} = require("../services/stockService");

// =====================================================
// Helper: Round Money
// =====================================================
const roundMoney = (value) => {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

// =====================================================
// Helper: Calculate Return Item
// =====================================================
const calculateReturnItem = (item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);

    const discountPercent = Number(
        item.discountPercent || 0
    );

    const taxPercent = Number(
        item.taxPercent || 0
    );

    const grossAmount = quantity * unitPrice;

    const discountAmount = roundMoney(
        grossAmount * (discountPercent / 100)
    );

    const taxableAmount = roundMoney(
        grossAmount - discountAmount
    );

    const taxAmount = roundMoney(
        taxableAmount * (taxPercent / 100)
    );

    const lineTotal = roundMoney(
        taxableAmount + taxAmount
    );

    return {
        product: item.product,
        description: item.description || "",
        quantity,
        unitPrice,
        discountPercent,
        discountAmount,
        taxableAmount,
        taxPercent,
        taxAmount,
        lineTotal,
    };
};

// =====================================================
// Helper: Calculate Totals
// =====================================================
const calculateTotals = (items) => {
    let subtotal = 0;
    let discountAmount = 0;
    let taxableAmount = 0;
    let taxAmount = 0;
    let grandTotal = 0;

    for (const item of items) {
        subtotal +=
            Number(item.quantity) *
            Number(item.unitPrice);

        discountAmount += Number(
            item.discountAmount || 0
        );

        taxableAmount += Number(
            item.taxableAmount || 0
        );

        taxAmount += Number(
            item.taxAmount || 0
        );

        grandTotal += Number(
            item.lineTotal || 0
        );
    }

    return {
        subtotal: roundMoney(subtotal),
        discountAmount: roundMoney(discountAmount),
        taxableAmount: roundMoney(taxableAmount),
        taxAmount: roundMoney(taxAmount),
        grandTotal: roundMoney(grandTotal),
    };
};

// =====================================================
// Helper: Generate Return Number
// =====================================================
const generateReturnNumber = async (
    companyId,
    session
) => {
    const lastReturn = await SalesReturn
        .findOne({ company: companyId })
        .sort({ createdAt: -1 })
        .session(session);

    let nextNumber = 1;

    if (lastReturn?.returnNumber) {
        const match =
            lastReturn.returnNumber.match(
                /(\d+)$/
            );

        if (match) {
            nextNumber =
                Number(match[1]) + 1;
        }
    }

    return `SRET-${String(nextNumber).padStart(6, "0")}`;
};

// =====================================================
// CREATE SALES RETURN
// =====================================================
const createSalesReturn = async (req, res) => {
    try {
        const {
            salesInvoice,
            warehouse,
            items,
            returnDate,
            reason,
            notes,
            settlementType = "NONE",
            refundAmount = 0,
            creditAmount = 0,
        } = req.body;

        if (
            !mongoose.Types.ObjectId.isValid(
                salesInvoice
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid sales invoice ID",
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(
                warehouse
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid warehouse ID",
            });
        }

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "At least one return item is required",
            });
        }

        if (!reason?.trim()) {
            return res.status(400).json({
                success: false,
                message:
                    "Return reason is required",
            });
        }

        const allowedSettlementTypes = [
            "REFUND",
            "CREDIT_NOTE",
            "ADJUST_INVOICE",
            "NONE",
        ];

        if (
            !allowedSettlementTypes.includes(
                settlementType
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid settlement type",
            });
        }

        const result =
            await withTransaction(
                async (session) => {
                    // ---------------------------------
                    // Load Invoice
                    // ---------------------------------
                    const invoice =
                        await SalesInvoice
                            .findById(salesInvoice)
                            .session(session);

                    if (!invoice) {
                        throw new Error(
                            "Sales invoice not found"
                        );
                    }

                    if (
                        invoice.status !== "ISSUED"
                    ) {
                        throw new Error(
                            "Sales return can only be created for an issued invoice"
                        );
                    }

                    // ---------------------------------
                    // Company / Branch
                    // ---------------------------------
                    const companyId =
                        invoice.company;

                    const branchId =
                        invoice.branch;

                    // ---------------------------------
                    // Customer
                    // ---------------------------------
                    const customer =
                        await Customer
                            .findById(
                                invoice.customer
                            )
                            .session(session);

                    if (!customer) {
                        throw new Error(
                            "Customer not found"
                        );
                    }

                    if (
                        customer.isActive === false
                    ) {
                        throw new Error(
                            "Customer is inactive"
                        );
                    }

                    // ---------------------------------
                    // Sales Order
                    // ---------------------------------
                    const salesOrder =
                        await SalesOrder
                            .findById(
                                invoice.salesOrder
                            )
                            .session(session);

                    if (!salesOrder) {
                        throw new Error(
                            "Sales order not found"
                        );
                    }

                    // ---------------------------------
                    // Warehouse
                    // ---------------------------------
                    const warehouseDoc =
                        await Warehouse
                            .findById(warehouse)
                            .session(session);

                    if (!warehouseDoc) {
                        throw new Error(
                            "Warehouse not found"
                        );
                    }

                    if (
                        warehouseDoc.company.toString() !==
                        companyId.toString()
                    ) {
                        throw new Error(
                            "Warehouse does not belong to the invoice company"
                        );
                    }

                    if (
                        warehouseDoc.branch &&
                        warehouseDoc.branch.toString() !==
                            branchId.toString()
                    ) {
                        throw new Error(
                            "Warehouse does not belong to the invoice branch"
                        );
                    }

                    // ---------------------------------
                    // Prepare Original Invoice Items
                    // ---------------------------------
                    const invoiceItems =
                        invoice.items || [];

                    const returnItems = [];

                    // ---------------------------------
                    // Validate Each Return Item
                    // ---------------------------------
                    for (const requestedItem of items) {
                        if (
                            !mongoose.Types.ObjectId.isValid(
                                requestedItem.product
                            )
                        ) {
                            throw new Error(
                                "Invalid product ID in return items"
                            );
                        }

                        const quantity = Number(
                            requestedItem.quantity
                        );

                        if (
                            !Number.isFinite(
                                quantity
                            ) ||
                            quantity <= 0
                        ) {
                            throw new Error(
                                "Return quantity must be greater than zero"
                            );
                        }

                        const originalItem =
                            invoiceItems.find(
                                (invoiceItem) =>
                                    invoiceItem.product.toString() ===
                                    requestedItem.product.toString()
                            );

                        if (!originalItem) {
                            throw new Error(
                                `Product ${requestedItem.product} was not sold in this invoice`
                            );
                        }

                        // ---------------------------------
                        // Calculate Already Returned
                        // ---------------------------------
                        const previousReturns =
                            await SalesReturn.find({
                                salesInvoice:
                                    invoice._id,
                                status: {
                                    $in: [
                                        "APPROVED",
                                        "PROCESSED",
                                    ],
                                },
                                "items.product":
                                    requestedItem.product,
                            }).session(session);

                        let alreadyReturned = 0;

                        for (
                            const previousReturn of previousReturns
                        ) {
                            for (
                                const previousItem of previousReturn.items
                            ) {
                                if (
                                    previousItem.product.toString() ===
                                    requestedItem.product.toString()
                                ) {
                                    alreadyReturned +=
                                        Number(
                                            previousItem.quantity
                                        );
                                }
                            }
                        }

                        const soldQuantity =
                            Number(
                                originalItem.quantity
                            );

                        const remainingReturnable =
                            soldQuantity -
                            alreadyReturned;

                        if (
                            quantity >
                            remainingReturnable
                        ) {
                            throw new Error(
                                `Return quantity exceeds returnable quantity for product ${requestedItem.product}. Remaining returnable quantity: ${remainingReturnable}`
                            );
                        }

                        // ---------------------------------
                        // Product Validation
                        // ---------------------------------
                        const product =
                            await Product
                                .findById(
                                    requestedItem.product
                                )
                                .session(session);

                        if (!product) {
                            throw new Error(
                                "Product not found"
                            );
                        }

                        // ---------------------------------
                        // Use Original Invoice Pricing
                        // ---------------------------------
                        const calculatedItem =
                            calculateReturnItem({
                                product:
                                    originalItem.product,
                                description:
                                    originalItem.description ||
                                    product.name,
                                quantity,
                                unitPrice:
                                    Number(
                                        originalItem.unitPrice
                                    ),
                                discountPercent:
                                    Number(
                                        originalItem.discountPercent ||
                                            0
                                    ),
                                taxPercent:
                                    Number(
                                        originalItem.taxPercent ||
                                            0
                                    ),
                            });

                        returnItems.push(
                            calculatedItem
                        );
                    }

                    // ---------------------------------
                    // Calculate Totals
                    // ---------------------------------
                    const totals =
                        calculateTotals(
                            returnItems
                        );

                    // ---------------------------------
                    // Validate Settlement
                    // ---------------------------------
                    const requestedRefund =
                        roundMoney(
                            Number(
                                refundAmount || 0
                            )
                        );

                    const requestedCredit =
                        roundMoney(
                            Number(
                                creditAmount || 0
                            )
                        );

                    if (
                        requestedRefund < 0 ||
                        requestedCredit < 0
                    ) {
                        throw new Error(
                            "Refund and credit amounts cannot be negative"
                        );
                    }

                    if (
                        requestedRefund >
                        totals.grandTotal
                    ) {
                        throw new Error(
                            "Refund amount cannot exceed return total"
                        );
                    }

                    if (
                        requestedCredit >
                        totals.grandTotal
                    ) {
                        throw new Error(
                            "Credit amount cannot exceed return total"
                        );
                    }

                    if (
                        settlementType ===
                            "REFUND" &&
                        requestedRefund !==
                            totals.grandTotal
                    ) {
                        throw new Error(
                            "Refund amount must equal return total for REFUND settlement"
                        );
                    }

                    if (
                        settlementType ===
                            "CREDIT_NOTE" &&
                        requestedCredit !==
                            totals.grandTotal
                    ) {
                        throw new Error(
                            "Credit amount must equal return total for CREDIT_NOTE settlement"
                        );
                    }

                    if (
                        settlementType ===
                            "NONE" &&
                        (requestedRefund > 0 ||
                            requestedCredit > 0)
                    ) {
                        throw new Error(
                            "Settlement type is NONE but refund/credit amount was provided"
                        );
                    }

                    // ---------------------------------
                    // Generate Return Number
                    // ---------------------------------
                    const returnNumber =
                        await generateReturnNumber(
                            companyId,
                            session
                        );

                    // ---------------------------------
                    // Create Return
                    // ---------------------------------
                    const salesReturn =
                        new SalesReturn({
                            company:
                                companyId,
                            branch:
                                branchId,
                            returnNumber,
                            returnDate:
                                returnDate ||
                                new Date(),
                            salesInvoice:
                                invoice._id,
                            salesOrder:
                                salesOrder._id,
                            customer:
                                customer._id,
                            warehouse:
                                warehouseDoc._id,
                            items:
                                returnItems,
                            subtotal:
                                totals.subtotal,
                            discountAmount:
                                totals.discountAmount,
                            taxableAmount:
                                totals.taxableAmount,
                            taxAmount:
                                totals.taxAmount,
                            grandTotal:
                                totals.grandTotal,
                            refundAmount:
                                requestedRefund,
                            creditAmount:
                                requestedCredit,
                            settlementType,
                            reason:
                                reason.trim(),
                            notes:
                                notes || "",
                            status: "PROCESSED",
                            createdBy:
                                req.user._id,
                            updatedBy:
                                req.user._id,
                            approvedBy:
                                req.user._id,
                            approvedAt:
                                new Date(),
                            processedAt:
                                new Date(),
                        });

                    await salesReturn.save({
                        session,
                    });

                    // ---------------------------------
                    // Increase Stock
                    // ---------------------------------
                    for (const returnItem of returnItems) {
                        await increaseStock({
                            company:
                                companyId,
                            branch:
                                branchId,
                            warehouse:
                                warehouseDoc._id,
                            product:
                                returnItem.product,
                            quantity:
                                returnItem.quantity,
                            unitPrice:
                                returnItem.unitPrice,
                            movementType:
                                "SALES_RETURN",
                            referenceType:
                                "SALES_RETURN",
                            referenceId:
                                salesReturn._id,
                            referenceNumber:
                                returnNumber,
                            reason:
                                reason.trim(),
                            notes:
                                notes || "",
                            createdBy:
                                req.user._id,
                            session,
                        });
                    }

                    return salesReturn;
                }
            );

        const populatedReturn =
            await SalesReturn.findById(
                result._id
            )
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "branch",
                    "name"
                )
                .populate(
                    "salesInvoice",
                    "invoiceNumber grandTotal paidAmount balanceDue paymentStatus"
                )
                .populate(
                    "salesOrder",
                    "salesOrderNumber status"
                )
                .populate(
                    "customer",
                    "customerCode name email phone"
                )
                .populate(
                    "warehouse",
                    "name code"
                )
                .populate(
                    "items.product",
                    "name sku barcode sellingPrice"
                )
                .populate(
                    "createdBy",
                    "name email"
                )
                .populate(
                    "approvedBy",
                    "name email"
                );

        return res.status(201).json({
            success: true,
            message:
                "Sales Return created and processed successfully",
            data: {
                salesReturn:
                    populatedReturn,
            },
        });
    } catch (error) {
        console.error(
            "Create Sales Return Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Failed to create sales return",
        });
    }
};

// =====================================================
// GET ALL SALES RETURNS
// =====================================================
const getSalesReturns = async (req, res) => {
    try {
        const {
            search,
            status,
            customer,
            salesInvoice,
            warehouse,
            page = 1,
            limit = 10,
        } = req.query;

        const filter = {};

        if (req.user.company) {
            filter.company =
                req.user.company;
        }

        if (status) {
            filter.status = status;
        }

        if (customer) {
            filter.customer = customer;
        }

        if (salesInvoice) {
            filter.salesInvoice =
                salesInvoice;
        }

        if (warehouse) {
            filter.warehouse =
                warehouse;
        }

        if (search) {
            filter.returnNumber = {
                $regex: search,
                $options: "i",
            };
        }

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

        const [
            returns,
            total,
        ] = await Promise.all([
            SalesReturn.find(filter)
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limitNumber)
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "branch",
                    "name"
                )
                .populate(
                    "salesInvoice",
                    "invoiceNumber grandTotal"
                )
                .populate(
                    "customer",
                    "customerCode name email phone"
                )
                .populate(
                    "warehouse",
                    "name code"
                )
                .populate(
                    "createdBy",
                    "name email"
                ),
            SalesReturn.countDocuments(
                filter
            ),
        ]);

        return res.status(200).json({
            success: true,
            data: returns,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                totalPages:
                    Math.ceil(
                        total /
                            limitNumber
                    ),
            },
        });
    } catch (error) {
        console.error(
            "Get Sales Returns Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch sales returns",
        });
    }
};

// =====================================================
// GET SALES RETURN BY ID
// =====================================================
const getSalesReturnById = async (
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
                    "Invalid sales return ID",
            });
        }

        const filter = {
            _id: id,
        };

        if (req.user.company) {
            filter.company =
                req.user.company;
        }

        const salesReturn =
            await SalesReturn.findOne(filter)
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "branch",
                    "name"
                )
                .populate(
                    "salesInvoice",
                    "invoiceNumber grandTotal paidAmount balanceDue paymentStatus"
                )
                .populate(
                    "salesOrder",
                    "salesOrderNumber status"
                )
                .populate(
                    "customer",
                    "customerCode name email phone"
                )
                .populate(
                    "warehouse",
                    "name code"
                )
                .populate(
                    "items.product",
                    "name sku barcode sellingPrice"
                )
                .populate(
                    "createdBy",
                    "name email"
                )
                .populate(
                    "approvedBy",
                    "name email"
                );

        if (!salesReturn) {
            return res.status(404).json({
                success: false,
                message:
                    "Sales return not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: salesReturn,
        });
    } catch (error) {
        console.error(
            "Get Sales Return Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch sales return",
        });
    }
};

// =====================================================
// DELETE SALES RETURN
// =====================================================
const deleteSalesReturn = async (
    req,
    res
) => {
    return res.status(400).json({
        success: false,
        message:
            "Sales returns are accounting records and cannot be hard deleted",
    });
};

module.exports = {
    createSalesReturn,
    getSalesReturns,
    getSalesReturnById,
    deleteSalesReturn,
};