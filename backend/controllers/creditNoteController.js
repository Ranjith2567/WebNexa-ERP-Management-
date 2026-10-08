const mongoose = require("mongoose");

const CreditNote = require("../models/CreditNote");
const SalesReturn = require("../models/SalesReturn");
const SalesInvoice = require("../models/SalesInvoice");
const Customer = require("../models/Customer");

const { withTransaction } = require("../utils/withTransaction");

// =====================================================
// Customer Credit Ledger Helper
// =====================================================

const {
    createCreditLedgerEntry,
} = require("./customerCreditLedgerController");

// =====================================================
// Helper
// =====================================================

const roundMoney = (value) => {
    return Math.round(
        (Number(value) + Number.EPSILON) * 100
    ) / 100;
};

// =====================================================
// Generate Credit Note Number
// =====================================================

const generateCreditNoteNumber = async (
    companyId,
    session
) => {
    const lastCreditNote =
        await CreditNote.findOne({
            company: companyId,
        })
            .sort({ createdAt: -1 })
            .select("creditNoteNumber")
            .session(session);

    let nextNumber = 1;

    if (lastCreditNote?.creditNoteNumber) {
        const match =
            lastCreditNote.creditNoteNumber.match(
                /(\d+)$/
            );

        if (match) {
            nextNumber =
                parseInt(match[1], 10) + 1;
        }
    }

    return `CN-${String(nextNumber).padStart(
        6,
        "0"
    )}`;
};

// =====================================================
// Create Credit Note from Sales Return
// =====================================================

const createCreditNote = async (req, res) => {
    try {
        const {
            salesReturn: salesReturnId,
            creditNoteDate,
            reason,
            notes,
        } = req.body;

        if (!salesReturnId) {
            return res.status(400).json({
                success: false,
                message: "Sales return is required",
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(
                salesReturnId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid sales return ID",
            });
        }

        const result =
            await withTransaction(
                async (session) => {
                    // ==========================================
                    // Get Sales Return
                    // ==========================================

                    const salesReturn =
                        await SalesReturn.findById(
                            salesReturnId
                        ).session(session);

                    if (!salesReturn) {
                        throw new Error(
                            "Sales return not found"
                        );
                    }

                    // ==========================================
                    // Company / Branch Validation
                    // ==========================================

                    if (
                        !salesReturn.company ||
                        !salesReturn.branch
                    ) {
                        throw new Error(
                            "Sales return company or branch is missing"
                        );
                    }

                    // ==========================================
                    // Return Status
                    // ==========================================

                    if (
                        salesReturn.status !==
                        "PROCESSED"
                    ) {
                        throw new Error(
                            "Credit Note can only be created for a processed sales return"
                        );
                    }

                    // ==========================================
                    // Settlement Validation
                    // ==========================================

                    if (
                        salesReturn.settlementType !==
                        "CREDIT_NOTE"
                    ) {
                        throw new Error(
                            "Sales return settlement type must be CREDIT_NOTE"
                        );
                    }

                    if (
                        Number(
                            salesReturn.creditAmount
                        ) <= 0
                    ) {
                        throw new Error(
                            "Credit amount must be greater than zero"
                        );
                    }

                    // ==========================================
                    // Check Duplicate Credit Note
                    // ==========================================

                    const existingCreditNote =
                        await CreditNote.findOne({
                            company:
                                salesReturn.company,

                            salesReturn:
                                salesReturn._id,
                        }).session(session);

                    if (existingCreditNote) {
                        throw new Error(
                            `Credit Note already exists: ${existingCreditNote.creditNoteNumber}`
                        );
                    }

                    // ==========================================
                    // Get Invoice
                    // ==========================================

                    const invoice =
                        await SalesInvoice.findById(
                            salesReturn.salesInvoice
                        ).session(session);

                    if (!invoice) {
                        throw new Error(
                            "Sales invoice not found"
                        );
                    }

                    if (
                        invoice.company.toString() !==
                        salesReturn.company.toString()
                    ) {
                        throw new Error(
                            "Sales invoice company mismatch"
                        );
                    }

                    // ==========================================
                    // Customer Validation
                    // ==========================================

                    const customer =
                        await Customer.findById(
                            salesReturn.customer
                        ).session(session);

                    if (!customer) {
                        throw new Error(
                            "Customer not found"
                        );
                    }

                    if (
                        customer.isActive ===
                        false
                    ) {
                        throw new Error(
                            "Customer is inactive"
                        );
                    }

                    // ==========================================
                    // Calculate Items
                    // ==========================================

                    const items =
                        salesReturn.items.map(
                            (item) => ({
                                product:
                                    item.product,

                                description:
                                    item.description ||
                                    "",

                                quantity:
                                    Number(
                                        item.quantity
                                    ),

                                unitPrice:
                                    Number(
                                        item.unitPrice
                                    ),

                                discountPercent:
                                    Number(
                                        item.discountPercent ||
                                            0
                                    ),

                                discountAmount:
                                    roundMoney(
                                        Number(
                                            item.discountAmount ||
                                                0
                                        )
                                    ),

                                taxableAmount:
                                    roundMoney(
                                        Number(
                                            item.taxableAmount ||
                                                0
                                        )
                                    ),

                                taxPercent:
                                    Number(
                                        item.taxPercent ||
                                            0
                                    ),

                                taxAmount:
                                    roundMoney(
                                        Number(
                                            item.taxAmount ||
                                                0
                                        )
                                    ),

                                lineTotal:
                                    roundMoney(
                                        Number(
                                            item.lineTotal ||
                                                0
                                        )
                                    ),
                            })
                        );

                    if (!items.length) {
                        throw new Error(
                            "Sales return has no items"
                        );
                    }

                    // ==========================================
                    // Calculate Totals
                    // ==========================================

                    const subtotal =
                        roundMoney(
                            items.reduce(
                                (
                                    sum,
                                    item
                                ) =>
                                    sum +
                                    item.quantity *
                                        item.unitPrice,
                                0
                            )
                        );

                    const discountAmount =
                        roundMoney(
                            items.reduce(
                                (
                                    sum,
                                    item
                                ) =>
                                    sum +
                                    item.discountAmount,
                                0
                            )
                        );

                    const taxableAmount =
                        roundMoney(
                            items.reduce(
                                (
                                    sum,
                                    item
                                ) =>
                                    sum +
                                    item.taxableAmount,
                                0
                            )
                        );

                    const taxAmount =
                        roundMoney(
                            items.reduce(
                                (
                                    sum,
                                    item
                                ) =>
                                    sum +
                                    item.taxAmount,
                                0
                            )
                        );

                    const grandTotal =
                        roundMoney(
                            items.reduce(
                                (
                                    sum,
                                    item
                                ) =>
                                    sum +
                                    item.lineTotal,
                                0
                            )
                        );

                    // ==========================================
                    // Verify with Sales Return
                    // ==========================================

                    if (
                        Math.abs(
                            grandTotal -
                                Number(
                                    salesReturn.grandTotal
                                )
                        ) > 0.01
                    ) {
                        throw new Error(
                            "Credit Note total does not match Sales Return total"
                        );
                    }

                    const creditAmount =
                        roundMoney(
                            Number(
                                salesReturn.creditAmount
                            )
                        );

                    if (
                        Math.abs(
                            creditAmount -
                                grandTotal
                        ) > 0.01
                    ) {
                        throw new Error(
                            "Credit amount must equal Sales Return total"
                        );
                    }

                    // ==========================================
                    // Generate Number
                    // ==========================================

                    const creditNoteNumber =
                        await generateCreditNoteNumber(
                            salesReturn.company,
                            session
                        );

                    // ==========================================
                    // Create Credit Note
                    // ==========================================

                    const creditNote =
                        await CreditNote.create(
                            [
                                {
                                    company:
                                        salesReturn.company,

                                    branch:
                                        salesReturn.branch,

                                    creditNoteNumber,

                                    creditNoteDate:
                                        creditNoteDate
                                            ? new Date(
                                                  creditNoteDate
                                              )
                                            : new Date(),

                                    salesReturn:
                                        salesReturn._id,

                                    salesInvoice:
                                        salesReturn.salesInvoice,

                                    salesOrder:
                                        salesReturn.salesOrder ||
                                        null,

                                    customer:
                                        salesReturn.customer,

                                    items,

                                    subtotal,

                                    discountAmount,

                                    taxableAmount,

                                    taxAmount,

                                    grandTotal,

                                    appliedAmount: 0,

                                    remainingAmount:
                                        grandTotal,

                                    status:
                                        "ISSUED",

                                    reason:
                                        reason ||
                                        salesReturn.reason ||
                                        "",

                                    notes:
                                        notes ||
                                        salesReturn.notes ||
                                        "",

                                    createdBy:
                                        req.user._id,

                                    updatedBy:
                                        req.user._id,

                                    issuedBy:
                                        req.user._id,

                                    issuedAt:
                                        new Date(),
                                },
                            ],
                            { session }
                        );

                    // ==========================================
                    // Create Customer Credit Ledger Entry
                    // ==========================================

                    await createCreditLedgerEntry({
                        company:
                            salesReturn.company,

                        branch:
                            salesReturn.branch,

                        customer:
                            salesReturn.customer,

                        transactionType:
                            "CREDIT_NOTE",

                        creditNote:
                            creditNote[0]._id,

                        salesInvoice:
                            salesReturn.salesInvoice,

                        amount:
                            grandTotal,

                        referenceNumber:
                            creditNoteNumber,

                        description:
                            "Credit Note added to customer credit",

                        notes:
                            notes ||
                            salesReturn.notes ||
                            "",

                        createdBy:
                            req.user._id,

                        session,
                    });

                    // ==========================================
                    // Populate
                    // ==========================================

                    const createdCreditNote =
                        await CreditNote.findById(
                            creditNote[0]._id
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
                                "salesReturn",
                                "returnNumber grandTotal settlementType status"
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
                                "items.product",
                                "name sku barcode sellingPrice"
                            )
                            .populate(
                                "createdBy",
                                "name email"
                            )
                            .populate(
                                "issuedBy",
                                "name email"
                            )
                            .session(session);

                    return createdCreditNote;
                }
            );

        return res.status(201).json({
            success: true,
            message:
                "Credit Note created successfully",
            data: {
                creditNote: result,
            },
        });
    } catch (error) {
        console.error(
            "Create Credit Note Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// =====================================================
// Get All Credit Notes
// =====================================================

const getCreditNotes = async (req, res) => {
    try {
        const {
            search,
            status,
            customer,
            salesReturn,
            salesInvoice,
            page = 1,
            limit = 10,
        } = req.query;

        const filter = {};

        if (search) {
            filter.creditNoteNumber = {
                $regex: search,
                $options: "i",
            };
        }

        if (status) {
            filter.status = status;
        }

        if (customer) {
            filter.customer = customer;
        }

        if (salesReturn) {
            filter.salesReturn = salesReturn;
        }

        if (salesInvoice) {
            filter.salesInvoice = salesInvoice;
        }

        const skip =
            (Number(page) - 1) *
            Number(limit);

        const [creditNotes, total] =
            await Promise.all([
                CreditNote.find(filter)
                    .sort({
                        creditNoteDate: -1,
                    })
                    .skip(skip)
                    .limit(Number(limit))
                    .populate(
                        "company",
                        "name legalName"
                    )
                    .populate(
                        "branch",
                        "name"
                    )
                    .populate(
                        "customer",
                        "customerCode name email phone"
                    )
                    .populate(
                        "salesReturn",
                        "returnNumber grandTotal"
                    )
                    .populate(
                        "salesInvoice",
                        "invoiceNumber grandTotal"
                    ),

                CreditNote.countDocuments(filter),
            ]);

        return res.status(200).json({
            success: true,
            data: {
                creditNotes,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(
                        total / Number(limit)
                    ),
                },
            },
        });
    } catch (error) {
        console.error(
            "Get Credit Notes Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch credit notes",
        });
    }
};

// =====================================================
// Get Credit Note By ID
// =====================================================

const getCreditNoteById = async (req, res) => {
    try {
        const creditNote =
            await CreditNote.findById(
                req.params.id
            )
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "branch"
                )
                .populate(
                    "salesReturn"
                )
                .populate(
                    "salesInvoice"
                )
                .populate(
                    "salesOrder"
                )
                .populate(
                    "customer"
                )
                .populate(
                    "items.product"
                )
                .populate(
                    "createdBy",
                    "name email"
                )
                .populate(
                    "updatedBy",
                    "name email"
                )
                .populate(
                    "issuedBy",
                    "name email"
                )
                .populate(
                    "cancelledBy",
                    "name email"
                );

        if (!creditNote) {
            return res.status(404).json({
                success: false,
                message:
                    "Credit Note not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                creditNote,
            },
        });
    } catch (error) {
        console.error(
            "Get Credit Note Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch Credit Note",
        });
    }
};

// =====================================================
// Cancel Credit Note
// =====================================================

const cancelCreditNote = async (req, res) => {
    try {
        const { cancellationReason } =
            req.body;

        if (!cancellationReason) {
            return res.status(400).json({
                success: false,
                message:
                    "Cancellation reason is required",
            });
        }

        const result =
            await withTransaction(
                async (session) => {
                    const creditNote =
                        await CreditNote.findById(
                            req.params.id
                        ).session(session);

                    if (!creditNote) {
                        throw new Error(
                            "Credit Note not found"
                        );
                    }

                    if (
                        creditNote.status ===
                        "CANCELLED"
                    ) {
                        throw new Error(
                            "Credit Note is already cancelled"
                        );
                    }

                    if (
                        creditNote.appliedAmount >
                        0
                    ) {
                        throw new Error(
                            "Applied Credit Note cannot be cancelled"
                        );
                    }

                    creditNote.status =
                        "CANCELLED";

                    creditNote.cancelledBy =
                        req.user._id;

                    creditNote.cancelledAt =
                        new Date();

                    creditNote.cancellationReason =
                        cancellationReason;

                    creditNote.updatedBy =
                        req.user._id;

                    await creditNote.save({
                        session,
                    });

                    return creditNote;
                }
            );

        return res.status(200).json({
            success: true,
            message:
                "Credit Note cancelled successfully",
            data: {
                creditNote: result,
            },
        });
    } catch (error) {
        console.error(
            "Cancel Credit Note Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// =====================================================
// Delete Credit Note
// =====================================================

const deleteCreditNote = async (req, res) => {
    return res.status(405).json({
        success: false,
        message:
            "Credit Notes cannot be deleted. Use cancellation for accounting retention.",
    });
};

module.exports = {
    createCreditNote,
    getCreditNotes,
    getCreditNoteById,
    cancelCreditNote,
    deleteCreditNote,
};