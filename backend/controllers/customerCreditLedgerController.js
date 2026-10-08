const mongoose = require("mongoose");

const CustomerCreditLedger = require("../models/CustomerCreditLedger");
const CreditNote = require("../models/CreditNote");
const SalesInvoice = require("../models/SalesInvoice");
const Customer = require("../models/Customer");

const { withTransaction } = require("../utils/withTransaction");

// =====================================================
// Helper
// =====================================================

const roundMoney = (value) => {
    return Math.round(
        (Number(value) + Number.EPSILON) * 100
    ) / 100;
};

// =====================================================
// Get Customer Credit Balance
// =====================================================

const getCustomerCreditBalance = async (
    companyId,
    customerId,
    session = null
) => {
    if (!companyId || !customerId) {
        return 0;
    }

    const query = {
        company: companyId,
        customer: customerId,
    };

    let ledgerQuery = CustomerCreditLedger.find(query)
        .sort({
            transactionDate: 1,
            createdAt: 1,
        });

    // Apply session only when transaction exists
    if (session) {
        ledgerQuery = ledgerQuery.session(session);
    }

    const ledgerEntries = await ledgerQuery;

    if (!ledgerEntries.length) {
        return 0;
    }

    return roundMoney(
        ledgerEntries[
            ledgerEntries.length - 1
        ].balanceAfter
    );
};

// =====================================================
// Create Credit Ledger Entry
// =====================================================

const createCreditLedgerEntry = async ({
    company,
    branch,
    customer,
    transactionType,
    creditNote = null,
    salesInvoice = null,
    amount,
    referenceNumber = "",
    description = "",
    notes = "",
    createdBy,
    session,
}) => {
    const currentBalance =
        await getCustomerCreditBalance(
            company,
            customer,
            session
        );

    let balanceBefore = currentBalance;
    let balanceAfter = currentBalance;

    const numericAmount = roundMoney(amount);

    if (numericAmount <= 0) {
        throw new Error(
            "Ledger amount must be greater than zero"
        );
    }

    // =================================================
    // CREDIT NOTE / MANUAL CREDIT
    // =================================================

    if (
        transactionType === "CREDIT_NOTE" ||
        transactionType === "MANUAL_CREDIT"
    ) {
        balanceAfter = roundMoney(
            balanceBefore + numericAmount
        );
    }

    // =================================================
    // CREDIT APPLIED / MANUAL DEBIT
    // =================================================

    if (
        transactionType === "CREDIT_APPLIED" ||
        transactionType === "MANUAL_DEBIT"
    ) {
        if (numericAmount > balanceBefore) {
            throw new Error(
                "Insufficient customer credit balance"
            );
        }

        balanceAfter = roundMoney(
            balanceBefore - numericAmount
        );
    }

    // =================================================
    // CREDIT REVERSAL
    // =================================================

    if (
        transactionType === "CREDIT_REVERSAL"
    ) {
        balanceAfter = roundMoney(
            balanceBefore + numericAmount
        );
    }

    // =================================================
    // Create Ledger Entry
    // =================================================

    const [entry] =
        await CustomerCreditLedger.create(
            [
                {
                    company,
                    branch,
                    customer,

                    transactionType,

                    creditNote,

                    salesInvoice,

                    amount: numericAmount,

                    balanceBefore,

                    balanceAfter,

                    transactionDate: new Date(),

                    referenceNumber,

                    description,

                    notes,

                    createdBy,
                },
            ],
            { session }
        );

    return entry;
};

// =====================================================
// Create Credit Note Ledger Entry
// =====================================================

const createCreditNoteLedgerEntry =
    async (req, res) => {
        try {
            const {
                creditNote: creditNoteId,
            } = req.body;

            // =================================================
            // Required Validation
            // =================================================

            if (!creditNoteId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Credit Note is required",
                });
            }

            // =================================================
            // Credit Note ID Validation
            // =================================================

            if (
                !mongoose.Types.ObjectId.isValid(
                    creditNoteId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid Credit Note ID",
                });
            }

            // =================================================
            // Transaction
            // =================================================

            const result =
                await withTransaction(
                    async (session) => {

                        // ==================================
                        // Get Credit Note
                        // ==================================

                        const creditNote =
                            await CreditNote.findById(
                                creditNoteId
                            ).session(session);

                        if (!creditNote) {
                            throw new Error(
                                "Credit Note not found"
                            );
                        }

                        // ==================================
                        // Status Validation
                        // ==================================

                        if (
                            creditNote.status ===
                            "CANCELLED"
                        ) {
                            throw new Error(
                                "Cancelled Credit Note cannot be added to customer credit"
                            );
                        }

                        // ==================================
                        // Duplicate Ledger Protection
                        // ==================================

                        const existingEntry =
                            await CustomerCreditLedger.findOne(
                                {
                                    company:
                                        creditNote.company,

                                    customer:
                                        creditNote.customer,

                                    creditNote:
                                        creditNote._id,

                                    transactionType:
                                        "CREDIT_NOTE",
                                }
                            ).session(session);

                        if (existingEntry) {
                            throw new Error(
                                "Credit Note is already added to customer credit ledger"
                            );
                        }

                        // ==================================
                        // Credit Amount
                        // ==================================

                        const creditAmount =
                            roundMoney(
                                creditNote.grandTotal
                            );

                        if (creditAmount <= 0) {
                            throw new Error(
                                "Credit Note amount must be greater than zero"
                            );
                        }

                        // ==================================
                        // Customer Validation
                        // ==================================

                        const customer =
                            await Customer.findById(
                                creditNote.customer
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

                        // ==================================
                        // Create Ledger
                        // ==================================

                        const entry =
                            await createCreditLedgerEntry(
                                {
                                    company:
                                        creditNote.company,

                                    branch:
                                        creditNote.branch,

                                    customer:
                                        creditNote.customer,

                                    transactionType:
                                        "CREDIT_NOTE",

                                    creditNote:
                                        creditNote._id,

                                    salesInvoice:
                                        creditNote.salesInvoice,

                                    amount:
                                        creditAmount,

                                    referenceNumber:
                                        creditNote.creditNoteNumber,

                                    description:
                                        "Credit Note added to customer credit",

                                    notes:
                                        creditNote.notes,

                                    createdBy:
                                        req.user._id,

                                    session,
                                }
                            );

                        // ==================================
                        // Populate
                        // ==================================

                        const populatedEntry =
                            await CustomerCreditLedger.findById(
                                entry._id
                            )
                                .populate(
                                    "customer",
                                    "customerCode name email phone"
                                )
                                .populate(
                                    "creditNote",
                                    "creditNoteNumber grandTotal remainingAmount status"
                                )
                                .populate(
                                    "salesInvoice",
                                    "invoiceNumber grandTotal paidAmount balanceDue paymentStatus"
                                )
                                .populate(
                                    "createdBy",
                                    "name email"
                                )
                                .session(session);

                        return populatedEntry;
                    }
                );

            // =================================================
            // Response
            // =================================================

            return res.status(201).json({
                success: true,
                message:
                    "Customer credit added successfully",
                data: {
                    ledgerEntry: result,
                },
            });

        } catch (error) {
            console.error(
                "Create Credit Ledger Error:",
                error
            );

            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    };

// =====================================================
// Get Customer Credit Balance
// =====================================================

const getCustomerCreditBalanceController =
    async (req, res) => {
        try {
            const {
                customerId,
            } = req.params;

            // =================================================
            // Validate Customer ID
            // =================================================

            if (
                !mongoose.Types.ObjectId.isValid(
                    customerId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid customer ID",
                });
            }

            // =================================================
            // Get Customer
            // IMPORTANT:
            // company + branch included
            // =================================================

            const customer =
                await Customer.findById(
                    customerId
                ).select(
                    "customerCode name email phone isActive company branch"
                );

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Customer not found",
                });
            }

            // =================================================
            // Active Customer Validation
            // =================================================

            if (
                customer.isActive === false
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Customer is inactive",
                });
            }

            // =================================================
            // Company Context
            // =================================================

            let companyId =
                req.user.company ||
                customer.company;

            // =================================================
            // Fallback:
            // If user/customer company is unavailable,
            // get company from customer's latest ledger.
            // =================================================

            if (!companyId) {
                const latestLedger =
                    await CustomerCreditLedger.findOne(
                        {
                            customer:
                                customer._id,
                        }
                    ).sort({
                        transactionDate: -1,
                        createdAt: -1,
                    });

                if (latestLedger) {
                    companyId =
                        latestLedger.company;
                }
            }

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Company context not found",
                });
            }

            // =================================================
            // Get Balance
            // =================================================

            const balance =
                await getCustomerCreditBalance(
                    companyId,
                    customer._id
                );

            // =================================================
            // Response
            // =================================================

            return res.status(200).json({
                success: true,
                data: {
                    customer,
                    creditBalance:
                        balance,
                },
            });

        } catch (error) {
            console.error(
                "Get Credit Balance Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to get customer credit balance",
            });
        }
    };

// =====================================================
// Get Customer Credit Ledger
// =====================================================

const getCustomerCreditLedger =
    async (req, res) => {
        try {
            const {
                customer,
                transactionType,
                page = 1,
                limit = 10,
            } = req.query;

            const filter = {};

            // =================================================
            // Customer Filter
            // =================================================

            if (customer) {
                if (
                    !mongoose.Types.ObjectId.isValid(
                        customer
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid customer ID",
                    });
                }

                filter.customer = customer;
            }

            // =================================================
            // Transaction Type Filter
            // =================================================

            if (transactionType) {
                filter.transactionType =
                    transactionType;
            }

            const pageNumber =
                Math.max(1, Number(page));

            const limitNumber =
                Math.max(1, Number(limit));

            const skip =
                (pageNumber - 1) *
                limitNumber;

            // =================================================
            // Fetch Data
            // =================================================

            const [
                ledgerEntries,
                total,
            ] = await Promise.all([
                CustomerCreditLedger.find(
                    filter
                )
                    .sort({
                        transactionDate: -1,
                        createdAt: -1,
                    })
                    .skip(skip)
                    .limit(limitNumber)
                    .populate(
                        "customer",
                        "customerCode name email phone"
                    )
                    .populate(
                        "creditNote",
                        "creditNoteNumber grandTotal status"
                    )
                    .populate(
                        "salesInvoice",
                        "invoiceNumber grandTotal"
                    )
                    .populate(
                        "createdBy",
                        "name email"
                    ),

                CustomerCreditLedger.countDocuments(
                    filter
                ),
            ]);

            // =================================================
            // Response
            // =================================================

            return res.status(200).json({
                success: true,
                data: {
                    ledgerEntries,

                    pagination: {
                        total,

                        page:
                            pageNumber,

                        limit:
                            limitNumber,

                        totalPages:
                            Math.ceil(
                                total /
                                    limitNumber
                            ),
                    },
                },
            });

        } catch (error) {
            console.error(
                "Get Credit Ledger Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch customer credit ledger",
            });
        }
    };

// =====================================================
// Apply Credit to Sales Invoice
// =====================================================

const applyCustomerCredit =
    async (req, res) => {
        try {
            const {
                creditNote: creditNoteId,
                salesInvoice:
                    salesInvoiceId,
                amount,
            } = req.body;

            // =================================================
            // Required Validation
            // =================================================

            if (
                !creditNoteId ||
                !salesInvoiceId ||
                amount === undefined
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Credit Note, Sales Invoice and amount are required",
                });
            }

            // =================================================
            // Credit Note ID Validation
            // =================================================

            if (
                !mongoose.Types.ObjectId.isValid(
                    creditNoteId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid Credit Note ID",
                });
            }

            // =================================================
            // Sales Invoice ID Validation
            // =================================================

            if (
                !mongoose.Types.ObjectId.isValid(
                    salesInvoiceId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid Sales Invoice ID",
                });
            }

            // =================================================
            // Amount Validation
            // =================================================

            const applicationAmount =
                roundMoney(amount);

            if (
                applicationAmount <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Application amount must be greater than zero",
                });
            }

            // =================================================
            // Transaction
            // =================================================

            const result =
                await withTransaction(
                    async (session) => {

                        // ==================================
                        // Get Credit Note
                        // ==================================

                        const creditNote =
                            await CreditNote.findById(
                                creditNoteId
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
                                "Cancelled Credit Note cannot be applied"
                            );
                        }

                        // ==================================
                        // Get Invoice
                        // ==================================

                        const invoice =
                            await SalesInvoice.findById(
                                salesInvoiceId
                            ).session(session);

                        if (!invoice) {
                            throw new Error(
                                "Sales Invoice not found"
                            );
                        }

                        if (
                            invoice.status !==
                            "ISSUED"
                        ) {
                            throw new Error(
                                "Credit can only be applied to an issued invoice"
                            );
                        }

                        // ==================================
                        // Customer Match
                        // ==================================

                        if (
                            creditNote.customer.toString() !==
                            invoice.customer.toString()
                        ) {
                            throw new Error(
                                "Credit Note customer does not match Sales Invoice customer"
                            );
                        }

                        // ==================================
                        // Credit Note Remaining
                        // ==================================

                        const remainingCredit =
                            roundMoney(
                                creditNote.remainingAmount
                            );

                        if (
                            applicationAmount >
                            remainingCredit
                        ) {
                            throw new Error(
                                `Credit Note has only ₹${remainingCredit.toFixed(
                                    2
                                )} remaining`
                            );
                        }

                        // ==================================
                        // Invoice Balance
                        // ==================================

                        const invoiceBalance =
                            roundMoney(
                                invoice.balanceDue
                            );

                        if (
                            invoiceBalance <= 0
                        ) {
                            throw new Error(
                                "Sales Invoice has no outstanding balance"
                            );
                        }

                        if (
                            applicationAmount >
                            invoiceBalance
                        ) {
                            throw new Error(
                                `Credit application cannot exceed invoice balance of ₹${invoiceBalance.toFixed(
                                    2
                                )}`
                            );
                        }

                        // ==================================
                        // Current Customer Credit
                        // ==================================

                        const currentBalance =
                            await getCustomerCreditBalance(
                                creditNote.company,
                                creditNote.customer,
                                session
                            );

                        if (
                            applicationAmount >
                            currentBalance
                        ) {
                            throw new Error(
                                `Customer has only ₹${currentBalance.toFixed(
                                    2
                                )} available credit`
                            );
                        }

                        // ==================================
                        // Update Credit Note
                        // ==================================

                        creditNote.appliedAmount =
                            roundMoney(
                                creditNote.appliedAmount +
                                    applicationAmount
                            );

                        creditNote.remainingAmount =
                            roundMoney(
                                creditNote.grandTotal -
                                    creditNote.appliedAmount
                            );

                        if (
                            creditNote.remainingAmount <=
                            0
                        ) {
                            creditNote.remainingAmount =
                                0;

                            creditNote.status =
                                "FULLY_APPLIED";
                        } else {
                            creditNote.status =
                                "PARTIALLY_APPLIED";
                        }

                        creditNote.updatedBy =
                            req.user._id;

                        await creditNote.save({
                            session,
                        });

                        // ==================================
                        // Update Invoice
                        // ==================================

                        invoice.paidAmount =
                            roundMoney(
                                invoice.paidAmount +
                                    applicationAmount
                            );

                        invoice.balanceDue =
                            roundMoney(
                                invoice.grandTotal -
                                    invoice.paidAmount
                            );

                        if (
                            invoice.balanceDue <=
                            0
                        ) {
                            invoice.balanceDue =
                                0;

                            invoice.paymentStatus =
                                "PAID";
                        } else if (
                            invoice.paidAmount >
                            0
                        ) {
                            invoice.paymentStatus =
                                "PARTIALLY_PAID";
                        } else {
                            invoice.paymentStatus =
                                "UNPAID";
                        }

                        invoice.updatedBy =
                            req.user._id;

                        await invoice.save({
                            session,
                        });

                        // ==================================
                        // Ledger Entry
                        // ==================================

                        const ledgerEntry =
                            await createCreditLedgerEntry(
                                {
                                    company:
                                        creditNote.company,

                                    branch:
                                        creditNote.branch,

                                    customer:
                                        creditNote.customer,

                                    transactionType:
                                        "CREDIT_APPLIED",

                                    creditNote:
                                        creditNote._id,

                                    salesInvoice:
                                        invoice._id,

                                    amount:
                                        applicationAmount,

                                    referenceNumber:
                                        invoice.invoiceNumber,

                                    description:
                                        "Customer credit applied to Sales Invoice",

                                    notes:
                                        `Credit Note ${creditNote.creditNoteNumber} applied to ${invoice.invoiceNumber}`,

                                    createdBy:
                                        req.user._id,

                                    session,
                                }
                            );

                        return {
                            creditNote,
                            invoice,
                            ledgerEntry,
                        };
                    }
                );

            // =================================================
            // Response
            // =================================================

            return res.status(200).json({
                success: true,
                message:
                    "Customer credit applied successfully",
                data: result,
            });

        } catch (error) {
            console.error(
                "Apply Customer Credit Error:",
                error
            );

            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    };

// =====================================================
// Reverse Credit Application
// =====================================================

const reverseCustomerCredit =
    async (req, res) => {
        try {
            const {
                creditNote: creditNoteId,
                salesInvoice:
                    salesInvoiceId,
                amount,
            } = req.body;

            // =================================================
            // Required Validation
            // =================================================

            if (
                !creditNoteId ||
                !salesInvoiceId ||
                amount === undefined
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Credit Note, Sales Invoice and amount are required",
                });
            }

            // =================================================
            // ID Validation
            // =================================================

            if (
                !mongoose.Types.ObjectId.isValid(
                    creditNoteId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid Credit Note ID",
                });
            }

            if (
                !mongoose.Types.ObjectId.isValid(
                    salesInvoiceId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid Sales Invoice ID",
                });
            }

            // =================================================
            // Amount Validation
            // =================================================

            const reversalAmount =
                roundMoney(amount);

            if (
                reversalAmount <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Reversal amount must be greater than zero",
                });
            }

            // =================================================
            // Transaction
            // =================================================

            const result =
                await withTransaction(
                    async (session) => {

                        // ==================================
                        // Get Credit Note
                        // ==================================

                        const creditNote =
                            await CreditNote.findById(
                                creditNoteId
                            ).session(session);

                        if (!creditNote) {
                            throw new Error(
                                "Credit Note not found"
                            );
                        }

                        // ==================================
                        // Cancelled Validation
                        // ==================================

                        if (
                            creditNote.status ===
                            "CANCELLED"
                        ) {
                            throw new Error(
                                "Cancelled Credit Note cannot be reversed"
                            );
                        }

                        // ==================================
                        // Get Invoice
                        // ==================================

                        const invoice =
                            await SalesInvoice.findById(
                                salesInvoiceId
                            ).session(session);

                        if (!invoice) {
                            throw new Error(
                                "Sales Invoice not found"
                            );
                        }

                        // ==================================
                        // Customer Match
                        // ==================================

                        if (
                            creditNote.customer.toString() !==
                            invoice.customer.toString()
                        ) {
                            throw new Error(
                                "Credit Note customer does not match Sales Invoice customer"
                            );
                        }

                        // ==================================
                        // Find Applied Ledger
                        // ==================================

                        const appliedEntries =
                            await CustomerCreditLedger.find(
                                {
                                    company:
                                        creditNote.company,

                                    customer:
                                        creditNote.customer,

                                    creditNote:
                                        creditNote._id,

                                    salesInvoice:
                                        invoice._id,

                                    transactionType:
                                        "CREDIT_APPLIED",
                                }
                            )
                                .sort({
                                    transactionDate:
                                        -1,

                                    createdAt:
                                        -1,
                                })
                                .session(session);

                        const totalApplied =
                            roundMoney(
                                appliedEntries.reduce(
                                    (
                                        sum,
                                        entry
                                    ) =>
                                        sum +
                                        Number(
                                            entry.amount
                                        ),
                                    0
                                )
                            );

                        if (
                            totalApplied <= 0
                        ) {
                            throw new Error(
                                "No credit application found for this Sales Invoice"
                            );
                        }

                        if (
                            reversalAmount >
                            totalApplied
                        ) {
                            throw new Error(
                                `Reversal amount cannot exceed applied credit of ₹${totalApplied.toFixed(
                                    2
                                )}`
                            );
                        }

                        // ==================================
                        // Credit Note Applied Validation
                        // ==================================

                        const currentApplied =
                            roundMoney(
                                creditNote.appliedAmount
                            );

                        if (
                            reversalAmount >
                            currentApplied
                        ) {
                            throw new Error(
                                "Reversal amount exceeds Credit Note applied amount"
                            );
                        }

                        // ==================================
                        // Update Credit Note
                        // ==================================

                        creditNote.appliedAmount =
                            roundMoney(
                                currentApplied -
                                    reversalAmount
                            );

                        if (
                            creditNote.appliedAmount <
                            0
                        ) {
                            creditNote.appliedAmount =
                                0;
                        }

                        creditNote.remainingAmount =
                            roundMoney(
                                creditNote.grandTotal -
                                    creditNote.appliedAmount
                            );

                        if (
                            creditNote.remainingAmount <=
                            0
                        ) {
                            creditNote.remainingAmount =
                                0;

                            creditNote.status =
                                "FULLY_APPLIED";
                        } else if (
                            creditNote.appliedAmount >
                            0
                        ) {
                            creditNote.status =
                                "PARTIALLY_APPLIED";
                        } else {
                            creditNote.status =
                                "ISSUED";
                        }

                        creditNote.updatedBy =
                            req.user._id;

                        await creditNote.save({
                            session,
                        });

                        // ==================================
                        // Update Invoice
                        // ==================================

                        invoice.paidAmount =
                            roundMoney(
                                invoice.paidAmount -
                                    reversalAmount
                            );

                        if (
                            invoice.paidAmount < 0
                        ) {
                            invoice.paidAmount = 0;
                        }

                        invoice.balanceDue =
                            roundMoney(
                                invoice.grandTotal -
                                    invoice.paidAmount
                            );

                        if (
                            invoice.balanceDue <=
                            0
                        ) {
                            invoice.balanceDue = 0;

                            invoice.paymentStatus =
                                "PAID";
                        } else if (
                            invoice.paidAmount >
                            0
                        ) {
                            invoice.paymentStatus =
                                "PARTIALLY_PAID";
                        } else {
                            invoice.paymentStatus =
                                "UNPAID";
                        }

                        invoice.updatedBy =
                            req.user._id;

                        await invoice.save({
                            session,
                        });

                        // ==================================
                        // Reversal Ledger
                        // ==================================

                        const ledgerEntry =
                            await createCreditLedgerEntry(
                                {
                                    company:
                                        creditNote.company,

                                    branch:
                                        creditNote.branch,

                                    customer:
                                        creditNote.customer,

                                    transactionType:
                                        "CREDIT_REVERSAL",

                                    creditNote:
                                        creditNote._id,

                                    salesInvoice:
                                        invoice._id,

                                    amount:
                                        reversalAmount,

                                    referenceNumber:
                                        invoice.invoiceNumber,

                                    description:
                                        "Customer credit application reversed",

                                    notes:
                                        `Credit application reversal for ${creditNote.creditNoteNumber}`,

                                    createdBy:
                                        req.user._id,

                                    session,
                                }
                            );

                        return {
                            creditNote,
                            invoice,
                            ledgerEntry,
                        };
                    }
                );

            // =================================================
            // Response
            // =================================================

            return res.status(200).json({
                success: true,
                message:
                    "Customer credit application reversed successfully",
                data: result,
            });

        } catch (error) {
            console.error(
                "Reverse Customer Credit Error:",
                error
            );

            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    };

// =====================================================
// Delete Protection
// =====================================================

const deleteCustomerCreditLedger =
    async (req, res) => {
        return res.status(405).json({
            success: false,
            message:
                "Customer credit ledger entries cannot be deleted. Use reversal for accounting retention.",
        });
    };

// =====================================================
// Exports
// =====================================================

module.exports = {
    createCreditNoteLedgerEntry,
    createCreditLedgerEntry,
    getCustomerCreditBalanceController,
    getCustomerCreditLedger,
    applyCustomerCredit,
    reverseCustomerCredit,
    deleteCustomerCreditLedger,
};