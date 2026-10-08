const mongoose = require("mongoose");

const SalesInvoice = require("../models/SalesInvoice");
const SalesOrder = require("../models/SalesOrder");
const Customer = require("../models/Customer");

const { withTransaction } = require("../utils/withTransaction");

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const roundMoney = (value) => {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

const validateObjectId = (value, fieldName) => {
    if (!value || !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error(`Invalid ${fieldName}`);
    }
};

const generateInvoiceNumber = async (company, session) => {
    const lastInvoice = await SalesInvoice.findOne({
        company,
    })
        .sort({ createdAt: -1 })
        .select("invoiceNumber")
        .session(session);

    let nextNumber = 1;

    if (lastInvoice && lastInvoice.invoiceNumber) {
        const match = lastInvoice.invoiceNumber.match(/(\d+)$/);

        if (match) {
            nextNumber = Number(match[1]) + 1;
        }
    }

    return `INV-${String(nextNumber).padStart(6, "0")}`;
};

/*
|--------------------------------------------------------------------------
| Calculate Invoice Item
|--------------------------------------------------------------------------
*/

const calculateInvoiceItem = (item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);

    const discountPercent = Number(item.discountPercent || 0);
    const taxPercent = Number(item.taxPercent || 0);

    if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("Item quantity must be greater than zero");
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error("Item unit price cannot be negative");
    }

    if (
        !Number.isFinite(discountPercent) ||
        discountPercent < 0 ||
        discountPercent > 100
    ) {
        throw new Error("Invalid discount percentage");
    }

    if (
        !Number.isFinite(taxPercent) ||
        taxPercent < 0 ||
        taxPercent > 100
    ) {
        throw new Error("Invalid tax percentage");
    }

    const grossAmount = roundMoney(quantity * unitPrice);

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

/*
|--------------------------------------------------------------------------
| Calculate Invoice Totals
|--------------------------------------------------------------------------
*/

const calculateInvoiceTotals = (items) => {
    let subtotal = 0;
    let discountAmount = 0;
    let taxableAmount = 0;
    let taxAmount = 0;
    let grandTotal = 0;

    for (const item of items) {
        subtotal += Number(item.quantity) * Number(item.unitPrice);

        discountAmount += Number(item.discountAmount || 0);

        taxableAmount += Number(item.taxableAmount || 0);

        taxAmount += Number(item.taxAmount || 0);

        grandTotal += Number(item.lineTotal || 0);
    }

    return {
        subtotal: roundMoney(subtotal),
        discountAmount: roundMoney(discountAmount),
        taxableAmount: roundMoney(taxableAmount),
        taxAmount: roundMoney(taxAmount),
        grandTotal: roundMoney(grandTotal),
    };
};

/*
|--------------------------------------------------------------------------
| Validate Company + Branch
|--------------------------------------------------------------------------
*/

const validateCompanyAndBranch = async (
    companyId,
    branchId,
    session
) => {
    validateObjectId(companyId, "company");
    validateObjectId(branchId, "branch");

    const Company = require("../models/Company");
    const Branch = require("../models/Branch");

    const company = await Company.findOne({
        _id: companyId,
        isActive: true,
    }).session(session);

    if (!company) {
        throw new Error("Company not found");
    }

    const branch = await Branch.findOne({
        _id: branchId,
        company: companyId,
        isActive: true,
    }).session(session);

    if (!branch) {
        throw new Error(
            "Branch not found for this company"
        );
    }

    return {
        company,
        branch,
    };
};

/*
|--------------------------------------------------------------------------
| CREATE SALES INVOICE
|--------------------------------------------------------------------------
|
| POST /api/sales-invoices
|
| Can create invoice from Sales Order.
|
*/

const createSalesInvoice = async (req, res) => {
    try {
        const userId = req.user._id;

        const {
            salesOrder: salesOrderId,
            invoiceDate,
            dueDate,
            notes = "",
            termsAndConditions = "",
        } = req.body;

        validateObjectId(salesOrderId, "salesOrder");

        const result = await withTransaction(async (session) => {
            /*
            |--------------------------------------------------------------------------
            | 1. Get Sales Order
            |--------------------------------------------------------------------------
            */

            const salesOrder = await SalesOrder.findOne({
                _id: salesOrderId,
            })
                .session(session)
                .populate("customer")
                .populate("salesPerson")
                .populate("items.product");

            if (!salesOrder) {
                throw new Error("Sales Order not found");
            }

            /*
            |--------------------------------------------------------------------------
            | 2. Validate Sales Order Status
            |--------------------------------------------------------------------------
            */

            if (
                salesOrder.status !== "PROCESSING" &&
                salesOrder.status !== "READY_TO_DELIVER"
            ) {
                throw new Error(
                    "Sales Invoice can only be created for PROCESSING or READY_TO_DELIVER Sales Orders"
                );
            }

            /*
            |--------------------------------------------------------------------------
            | 3. Validate Company + Branch
            |--------------------------------------------------------------------------
            */

            await validateCompanyAndBranch(
                salesOrder.company,
                salesOrder.branch,
                session
            );

            /*
            |--------------------------------------------------------------------------
            | 4. Validate Customer
            |--------------------------------------------------------------------------
            */

            const customer = await Customer.findOne({
                _id: salesOrder.customer,
                company: salesOrder.company,
                isActive: true,
            }).session(session);

            if (!customer) {
                throw new Error(
                    "Customer not found for this company"
                );
            }

            /*
            |--------------------------------------------------------------------------
            | 5. Check Existing Invoice
            |--------------------------------------------------------------------------
            */

            const existingInvoice = await SalesInvoice.findOne({
                company: salesOrder.company,
                salesOrder: salesOrder._id,
            }).session(session);

            if (existingInvoice) {
                throw new Error(
                    `Sales Invoice already exists: ${existingInvoice.invoiceNumber}`
                );
            }

            /*
            |--------------------------------------------------------------------------
            | 6. Prepare Invoice Items
            |--------------------------------------------------------------------------
            */

            if (
                !Array.isArray(salesOrder.items) ||
                salesOrder.items.length === 0
            ) {
                throw new Error(
                    "Sales Order has no items"
                );
            }

            const invoiceItems = salesOrder.items.map((item) => {
                return calculateInvoiceItem({
                    product: item.product?._id || item.product,

                    description:
                        item.description ||
                        item.product?.name ||
                        "",

                    quantity: item.quantity,

                    unitPrice: item.unitPrice,

                    discountPercent:
                        item.discountPercent || 0,

                    taxPercent:
                        item.taxPercent || 0,
                });
            });

            /*
            |--------------------------------------------------------------------------
            | 7. Calculate Totals
            |--------------------------------------------------------------------------
            */

            const totals = calculateInvoiceTotals(
                invoiceItems
            );

            /*
            |--------------------------------------------------------------------------
            | 8. Generate Invoice Number
            |--------------------------------------------------------------------------
            */

            const invoiceNumber =
                await generateInvoiceNumber(
                    salesOrder.company,
                    session
                );

            /*
            |--------------------------------------------------------------------------
            | 9. Create Invoice
            |--------------------------------------------------------------------------
            */

            const invoiceData = {
                company: salesOrder.company,
                branch: salesOrder.branch,

                invoiceNumber,

                invoiceDate:
                    invoiceDate || new Date(),

                dueDate:
                    dueDate || null,

                salesOrder:
                    salesOrder._id,

                customer:
                    salesOrder.customer,

                salesPerson:
                    salesOrder.salesPerson || null,

                items: invoiceItems,

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

                paidAmount: 0,

                balanceDue:
                    totals.grandTotal,

                paymentStatus: "UNPAID",

                status: "DRAFT",

                notes,

                termsAndConditions,

                createdBy: userId,

                updatedBy: userId,
            };

            const createdInvoices =
                await SalesInvoice.create(
                    [invoiceData],
                    { session }
                );

            const invoice =
                createdInvoices[0];

            /*
            |--------------------------------------------------------------------------
            | 10. Link Invoice to Sales Order
            |--------------------------------------------------------------------------
            */

            salesOrder.salesInvoice =
                invoice._id;

            salesOrder.updatedBy =
                userId;

            await salesOrder.save({
                session,
            });

            /*
            |--------------------------------------------------------------------------
            | 11. Return populated invoice
            |--------------------------------------------------------------------------
            */

            await invoice.populate([
                {
                    path: "company",
                    select: "name legalName",
                },
                {
                    path: "branch",
                    select: "name code",
                },
                {
                    path: "customer",
                    select:
                        "customerCode name email phone",
                },
                {
                    path: "salesOrder",
                    select:
                        "salesOrderNumber status total",
                },
                {
                    path: "salesPerson",
                    select:
                        "name email",
                },
                {
                    path: "items.product",
                    select:
                        "name sku barcode sellingPrice",
                },
            ]);

            return invoice;
        });

        return res.status(201).json({
            success: true,
            message:
                "Sales Invoice created successfully",
            data: result,
        });
    } catch (error) {
        console.error(
            "Create Sales Invoice Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/*
|--------------------------------------------------------------------------
| GET ALL SALES INVOICES
|--------------------------------------------------------------------------
|
| GET /api/sales-invoices
|
| Supports:
| ?page=1
| ?limit=10
| ?search=INV-000001
| ?status=ISSUED
| ?paymentStatus=UNPAID
|
*/

const getSalesInvoices = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = "",
            status,
            paymentStatus,
            customer,
            salesOrder,
        } = req.query;

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

        const filter = {};

        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        if (search.trim()) {
            filter.invoiceNumber = {
                $regex: search.trim(),
                $options: "i",
            };
        }

        /*
        |--------------------------------------------------------------------------
        | Status filters
        |--------------------------------------------------------------------------
        */

        if (status) {
            filter.status = status;
        }

        if (paymentStatus) {
            filter.paymentStatus =
                paymentStatus;
        }

        if (customer) {
            validateObjectId(
                customer,
                "customer"
            );

            filter.customer =
                customer;
        }

        if (salesOrder) {
            validateObjectId(
                salesOrder,
                "salesOrder"
            );

            filter.salesOrder =
                salesOrder;
        }

        const [invoices, total] =
            await Promise.all([
                SalesInvoice.find(filter)
                    .populate(
                        "company",
                        "name legalName"
                    )
                    .populate(
                        "branch",
                        "name code"
                    )
                    .populate(
                        "customer",
                        "customerCode name email phone"
                    )
                    .populate(
                        "salesOrder",
                        "salesOrderNumber status"
                    )
                    .populate(
                        "salesPerson",
                        "name email"
                    )
                    .sort({
                        invoiceDate: -1,
                        createdAt: -1,
                    })
                    .skip(skip)
                    .limit(limitNumber),

                SalesInvoice.countDocuments(
                    filter
                ),
            ]);

        return res.status(200).json({
            success: true,
            count: invoices.length,
            total,
            page: pageNumber,
            pages: Math.ceil(
                total / limitNumber
            ),
            data: invoices,
        });
    } catch (error) {
        console.error(
            "Get Sales Invoices Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/*
|--------------------------------------------------------------------------
| GET SALES INVOICE BY ID
|--------------------------------------------------------------------------
|
| GET /api/sales-invoices/:id
|
*/

const getSalesInvoiceById = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        validateObjectId(
            id,
            "salesInvoice"
        );

        const invoice =
            await SalesInvoice.findById(id)
                .populate(
                    "company",
                    "name legalName email phone gstNumber panNumber"
                )
                .populate(
                    "branch",
                    "name code email phone address"
                )
                .populate(
                    "customer",
                    "customerCode name email phone alternatePhone address creditLimit paymentTerms"
                )
                .populate(
                    "salesOrder",
                    "salesOrderNumber status orderDate total paymentStatus"
                )
                .populate(
                    "salesPerson",
                    "name email"
                )
                .populate(
                    "items.product",
                    "name sku barcode sellingPrice taxPercentage"
                )
                .populate(
                    "createdBy",
                    "name email"
                )
                .populate(
                    "updatedBy",
                    "name email"
                );

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message:
                    "Sales Invoice not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: invoice,
        });
    } catch (error) {
        console.error(
            "Get Sales Invoice Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/*
|--------------------------------------------------------------------------
| UPDATE SALES INVOICE
|--------------------------------------------------------------------------
|
| PATCH /api/sales-invoices/:id
|
| Only DRAFT invoices can be edited.
| Current create flow creates ISSUED invoices,
| so this endpoint mainly protects the future
| if draft creation is introduced.
|
*/

const updateSalesInvoice = async (
    req,
    res
) => {
    try {
        const userId = req.user._id;

        const { id } = req.params;

        validateObjectId(
            id,
            "salesInvoice"
        );

        const invoice =
            await SalesInvoice.findById(id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message:
                    "Sales Invoice not found",
            });
        }

        if (invoice.status !== "DRAFT") {
            return res.status(400).json({
                success: false,
                message:
                    "Only DRAFT sales invoices can be edited",
            });
        }

        const {
            invoiceDate,
            dueDate,
            items,
            notes,
            termsAndConditions,
        } = req.body;

        if (invoiceDate !== undefined) {
            invoice.invoiceDate =
                invoiceDate;
        }

        if (dueDate !== undefined) {
            invoice.dueDate =
                dueDate || null;
        }

        if (notes !== undefined) {
            invoice.notes = notes;
        }

        if (
            termsAndConditions !==
            undefined
        ) {
            invoice.termsAndConditions =
                termsAndConditions;
        }

        if (items !== undefined) {
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

            const invoiceItems =
                items.map(
                    calculateInvoiceItem
                );

            const totals =
                calculateInvoiceTotals(
                    invoiceItems
                );

            invoice.items =
                invoiceItems;

            invoice.subtotal =
                totals.subtotal;

            invoice.discountAmount =
                totals.discountAmount;

            invoice.taxableAmount =
                totals.taxableAmount;

            invoice.taxAmount =
                totals.taxAmount;

            invoice.grandTotal =
                totals.grandTotal;

            invoice.balanceDue =
                roundMoney(
                    totals.grandTotal -
                    Number(
                        invoice.paidAmount ||
                            0
                    )
                );
        }

        invoice.updatedBy =
            userId;

        await invoice.save();

        await invoice.populate([
            {
                path: "customer",
                select:
                    "customerCode name email phone",
            },
            {
                path: "salesOrder",
                select:
                    "salesOrderNumber status",
            },
            {
                path: "items.product",
                select:
                    "name sku barcode sellingPrice",
            },
        ]);

        return res.status(200).json({
            success: true,
            message:
                "Sales Invoice updated successfully",
            data: invoice,
        });
    } catch (error) {
        console.error(
            "Update Sales Invoice Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/*
|--------------------------------------------------------------------------
| UPDATE SALES INVOICE STATUS
|--------------------------------------------------------------------------
|
| PATCH /api/sales-invoices/:id/status
|
*/

const updateSalesInvoiceStatus = async (
    req,
    res
) => {
    try {
        const userId = req.user._id;

        const { id } = req.params;

        const {
            status,
            cancellationReason = "",
        } = req.body;

        validateObjectId(
            id,
            "salesInvoice"
        );

        const allowedStatuses = [
            "DRAFT",
            "ISSUED",
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
                    "Invalid invoice status",
            });
        }

        const result =
            await withTransaction(
                async (session) => {
                    const invoice =
                        await SalesInvoice.findById(
                            id
                        ).session(session);

                    if (!invoice) {
                        throw new Error(
                            "Sales Invoice not found"
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Already same status
                    |--------------------------------------------------------------------------
                    */

                    if (
                        invoice.status ===
                        status
                    ) {
                        throw new Error(
                            `Invoice is already ${status}`
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Cancelled invoice cannot change
                    |--------------------------------------------------------------------------
                    */

                    if (
                        invoice.status ===
                        "CANCELLED"
                    ) {
                        throw new Error(
                            "Cancelled invoice cannot be changed"
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | DRAFT → ISSUED
                    |--------------------------------------------------------------------------
                    */

                    if (
                        invoice.status ===
                            "DRAFT" &&
                        status ===
                            "ISSUED"
                    ) {
                        invoice.status =
                            "ISSUED";
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | DRAFT → CANCELLED
                    |--------------------------------------------------------------------------
                    */

                    else if (
                        invoice.status ===
                            "DRAFT" &&
                        status ===
                            "CANCELLED"
                    ) {
                        if (
                            !cancellationReason.trim()
                        ) {
                            throw new Error(
                                "Cancellation reason is required"
                            );
                        }

                        invoice.status =
                            "CANCELLED";

                        invoice.cancelledAt =
                            new Date();

                        invoice.cancellationReason =
                            cancellationReason;
                    }

                    else {
                        throw new Error(
                            `Invalid status transition: ${invoice.status} → ${status}`
                        );
                    }

                    invoice.updatedBy =
                        userId;

                    await invoice.save({
                        session,
                    });

                    return invoice;
                }
            );

        await result.populate([
            {
                path: "customer",
                select:
                    "customerCode name email phone",
            },
            {
                path: "salesOrder",
                select:
                    "salesOrderNumber status",
            },
        ]);

        return res.status(200).json({
            success: true,
            message:
                "Sales Invoice status updated successfully",
            data: result,
        });
    } catch (error) {
        console.error(
            "Update Sales Invoice Status Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/*
|--------------------------------------------------------------------------
| DELETE SALES INVOICE
|--------------------------------------------------------------------------
|
| DELETE /api/sales-invoices/:id
|
| Financial documents should generally not be
| physically deleted after issue.
|
*/

const deleteSalesInvoice = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        validateObjectId(
            id,
            "salesInvoice"
        );

        const invoice =
            await SalesInvoice.findById(id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message:
                    "Sales Invoice not found",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Never hard delete financial invoice
        |--------------------------------------------------------------------------
        */

        if (
            invoice.status !==
            "CANCELLED"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Issued sales invoices cannot be deleted. Cancel the invoice instead.",
            });
        }

        return res.status(400).json({
            success: false,
            message:
                "Sales invoices are retained for audit and accounting purposes and cannot be permanently deleted.",
        });
    } catch (error) {
        console.error(
            "Delete Sales Invoice Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createSalesInvoice,
    getSalesInvoices,
    getSalesInvoiceById,
    updateSalesInvoice,
    updateSalesInvoiceStatus,
    deleteSalesInvoice,
};