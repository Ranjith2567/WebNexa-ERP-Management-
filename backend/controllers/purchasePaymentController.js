const mongoose = require("mongoose");

const PurchasePayment = require("../models/PurchasePayment");
const PurchaseInvoice = require("../models/PurchaseInvoice");
const Supplier = require("../models/Supplier");

const {
    createNotification,
} = require("../services/notificationService");

const isValidObjectId = (id) =>
    mongoose.Types.ObjectId.isValid(id);

const roundAmount = (value) =>
    Math.round(
        (Number(value) + Number.EPSILON) * 100
    ) / 100;

// ============================================================
// Purchase Payment Notification
// ============================================================

const sendPurchasePaymentNotification = async ({
    payment,
    invoice,
    supplier,
    recipient,
    event = "CREATED",
}) => {
    try {
        if (!payment || !invoice || !recipient) {
            return;
        }

        let title = "";
        let message = "";
        let priority = "MEDIUM";

        const paymentAmount = roundAmount(
            payment.amount || 0
        );

        const dueAmount = roundAmount(
            invoice.dueAmount || 0
        );

        const invoiceNumber =
            invoice.internalInvoiceNumber ||
            invoice.invoiceNumber ||
            "Purchase Invoice";

        const supplierName =
            supplier?.name ||
            supplier?.companyName ||
            "Unknown Supplier";

        // ----------------------------------------------------
        // Event Message
        // ----------------------------------------------------

        if (event === "COMPLETED") {
            if (
                invoice.paymentStatus === "PAID" ||
                invoice.status === "PAID" ||
                dueAmount <= 0
            ) {
                title = "Purchase Invoice Fully Paid";

                message =
                    `Payment of ${paymentAmount} has been completed for ${invoiceNumber}. ` +
                    `The purchase invoice is now fully paid.`;

                priority = "HIGH";
            } else {
                title = "Purchase Payment Completed";

                message =
                    `Payment of ${paymentAmount} has been completed for ${invoiceNumber}. ` +
                    `Remaining due amount: ${dueAmount}.`;

                priority = "MEDIUM";
            }
        } else {
            title = "Purchase Payment Created";

            message =
                `Purchase payment ${payment.paymentNumber} of ${paymentAmount} ` +
                `has been recorded for ${invoiceNumber}. ` +
                `Remaining due amount: ${dueAmount}.`;

            priority = "MEDIUM";
        }

        await createNotification({
            company: payment.company,
            branch: payment.branch,
            recipient,

            type: "PURCHASE_PAYMENT",

            title,
            message,

            priority,

            referenceType: "PURCHASE_PAYMENT",
            referenceId: payment._id,

            metadata: {
                event,

                paymentId:
                    payment._id,

                paymentNumber:
                    payment.paymentNumber,

                purchaseInvoiceId:
                    invoice._id,

                invoiceNumber:
                    invoice.invoiceNumber || "",

                internalInvoiceNumber:
                    invoice.internalInvoiceNumber || "",

                supplierId:
                    supplier?._id ||
                    payment.supplier ||
                    null,

                supplierName,

                amount:
                    paymentAmount,

                paymentMethod:
                    payment.paymentMethod || "",

                transactionReference:
                    payment.transactionReference || "",

                paymentDate:
                    payment.paymentDate || null,

                invoiceTotalAmount:
                    roundAmount(
                        invoice.totalAmount || 0
                    ),

                invoicePaidAmount:
                    roundAmount(
                        invoice.paidAmount || 0
                    ),

                invoiceDueAmount:
                    dueAmount,

                paymentStatus:
                    invoice.paymentStatus || "",

                invoiceStatus:
                    invoice.status || "",
            },

            createdBy: recipient,
        });
    } catch (error) {
        // Notification failure must never
        // break successful payment operation.
        console.error(
            "Purchase Payment Notification Error:",
            error.message
        );
    }
};

// ============================================================
// Generate Payment Number
// ============================================================

// Generate PAY-000001
const generatePaymentNumber = async (company) => {
    const lastPayment = await PurchasePayment.findOne({
        company,
    })
        .sort({ createdAt: -1 })
        .select("paymentNumber");

    if (!lastPayment) {
        return "PAY-000001";
    }

    const match =
        lastPayment.paymentNumber?.match(
            /(\d+)$/
        );

    const nextNumber = match
        ? Number(match[1]) + 1
        : 1;

    return `PAY-${String(nextNumber).padStart(
        6,
        "0"
    )}`;
};

// ============================================================
// Create Purchase Payment
// ============================================================

const createPurchasePayment = async (
    req,
    res,
    next
) => {
    try {
        const {
            company,
            branch,
            supplier,
            purchaseInvoice,
            paymentDate,
            amount,
            paymentMethod,
            transactionReference,
            bankName,
            chequeNumber,
            chequeDate,
            notes,
            status,
        } = req.body;

        // -------------------------
        // Required validation
        // -------------------------

        if (
            !company ||
            !branch ||
            !supplier ||
            !purchaseInvoice
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Company, branch, supplier and purchase invoice are required",
            });
        }

        if (
            !isValidObjectId(company) ||
            !isValidObjectId(branch) ||
            !isValidObjectId(supplier) ||
            !isValidObjectId(purchaseInvoice)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid company, branch, supplier or purchase invoice ID",
            });
        }

        // -------------------------
        // Amount validation
        // -------------------------

        const paymentAmount =
            Number(amount);

        if (
            !Number.isFinite(paymentAmount) ||
            paymentAmount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment amount must be greater than 0",
            });
        }

        // -------------------------
        // Find Invoice
        // -------------------------

        const invoice =
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

        // -------------------------
        // Company validation
        // -------------------------

        if (
            invoice.company.toString() !==
            company.toString()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Purchase invoice does not belong to the selected company",
            });
        }

        if (
            invoice.branch.toString() !==
            branch.toString()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Purchase invoice does not belong to the selected branch",
            });
        }

        if (
            invoice.supplier.toString() !==
            supplier.toString()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Purchase invoice does not belong to the selected supplier",
            });
        }

        // -------------------------
        // Invoice status validation
        // -------------------------

        if (
            invoice.status ===
            "CANCELLED"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment cannot be made for a cancelled invoice",
            });
        }

        // -------------------------
        // Supplier validation
        // -------------------------

        const supplierData =
            await Supplier.findById(
                supplier
            ).select(
                "_id company branch name supplierCode companyName isActive"
            );

        if (!supplierData) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found",
            });
        }

        if (!supplierData.isActive) {
            return res.status(400).json({
                success: false,
                message:
                    "Cannot make payment to an inactive supplier",
            });
        }

        // -------------------------
        // Calculate current due
        // -------------------------

        const currentPaid =
            roundAmount(
                invoice.paidAmount || 0
            );

        const totalAmount =
            roundAmount(
                invoice.totalAmount || 0
            );

        const currentDue =
            roundAmount(
                totalAmount - currentPaid
            );

        if (currentDue <= 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Purchase invoice is already fully paid",
            });
        }

        // -------------------------
        // Payment cannot exceed due
        // -------------------------

        if (
            paymentAmount > currentDue
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Payment amount cannot exceed due amount of ${currentDue}`,
            });
        }

        // -------------------------
        // Payment method validation
        // -------------------------

        const allowedMethods = [
            "CASH",
            "BANK_TRANSFER",
            "UPI",
            "CHEQUE",
            "CARD",
            "NEFT",
            "RTGS",
            "IMPS",
            "OTHER",
        ];

        if (
            !allowedMethods.includes(
                paymentMethod
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment method",
            });
        }

        // -------------------------
        // Cheque validation
        // -------------------------

        if (
            paymentMethod === "CHEQUE" &&
            !chequeNumber
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Cheque number is required for cheque payments",
            });
        }

        // -------------------------
        // Generate payment number
        // -------------------------

        const paymentNumber =
            await generatePaymentNumber(
                company
            );

        // -------------------------
        // Create payment
        // -------------------------

        const payment =
            await PurchasePayment.create({
                company,
                branch,
                supplier,
                purchaseInvoice,

                paymentNumber,

                paymentDate:
                    paymentDate ||
                    new Date(),

                amount:
                    roundAmount(
                        paymentAmount
                    ),

                paymentMethod,

                transactionReference:
                    transactionReference ||
                    "",

                bankName:
                    bankName || "",

                chequeNumber:
                    chequeNumber || "",

                chequeDate:
                    chequeDate || null,

                notes:
                    notes || "",

                status:
                    status || "COMPLETED",

                createdBy:
                    req.user._id,
            });

        // -------------------------
        // Update invoice
        // -------------------------

        const newPaidAmount =
            roundAmount(
                currentPaid +
                    paymentAmount
            );

        const newDueAmount =
            roundAmount(
                totalAmount -
                    newPaidAmount
            );

        invoice.paidAmount =
            newPaidAmount;

        invoice.dueAmount =
            Math.max(
                newDueAmount,
                0
            );

        if (
            newDueAmount <= 0
        ) {
            invoice.paymentStatus =
                "PAID";

            invoice.status =
                "PAID";
        } else {
            invoice.paymentStatus =
                "PARTIALLY_PAID";

            invoice.status =
                "PARTIALLY_PAID";
        }

        invoice.updatedBy =
            req.user._id;

        await invoice.save();

        // -------------------------
        // Populate payment
        // -------------------------

        const populatedPayment =
            await PurchasePayment.findById(
                payment._id
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
                    "purchaseInvoice",
                    "invoiceNumber internalInvoiceNumber invoiceDate totalAmount paidAmount dueAmount paymentStatus status"
                )
                .populate(
                    "createdBy",
                    "name email"
                );

        // ====================================================
        // Purchase Payment Notification
        // ====================================================

        await sendPurchasePaymentNotification({
            payment: populatedPayment,
            invoice: {
                _id: invoice._id,
                company: invoice.company,
                branch: invoice.branch,
                invoiceNumber:
                    invoice.invoiceNumber,
                internalInvoiceNumber:
                    invoice.internalInvoiceNumber,
                totalAmount:
                    invoice.totalAmount,
                paidAmount:
                    invoice.paidAmount,
                dueAmount:
                    invoice.dueAmount,
                paymentStatus:
                    invoice.paymentStatus,
                status:
                    invoice.status,
            },
            supplier: supplierData,
            recipient: req.user._id,
            event:
                payment.status === "COMPLETED"
                    ? "COMPLETED"
                    : "CREATED",
        });

        return res.status(201).json({
            success: true,
            message:
                "Purchase payment created successfully",
            data: {
                payment:
                    populatedPayment,
                invoice: {
                    _id: invoice._id,
                    invoiceNumber:
                        invoice.invoiceNumber,
                    totalAmount:
                        invoice.totalAmount,
                    paidAmount:
                        invoice.paidAmount,
                    dueAmount:
                        invoice.dueAmount,
                    paymentStatus:
                        invoice.paymentStatus,
                    status:
                        invoice.status,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// Get Payments
// ============================================================

const getPurchasePayments = async (
    req,
    res,
    next
) => {
    try {
        const {
            company,
            branch,
            supplier,
            purchaseInvoice,
            paymentMethod,
            status,
            search,
            startDate,
            endDate,
            page = 1,
            limit = 20,
        } = req.query;

        const filter = {};

        // -------------------------
        // ID filters
        // -------------------------

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

        if (purchaseInvoice) {
            if (
                !isValidObjectId(
                    purchaseInvoice
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid purchase invoice ID",
                });
            }

            filter.purchaseInvoice =
                purchaseInvoice;
        }

        // -------------------------
        // Other filters
        // -------------------------

        if (paymentMethod) {
            filter.paymentMethod =
                paymentMethod;
        }

        if (status) {
            filter.status = status;
        }

        // -------------------------
        // Date filter
        // -------------------------

        if (
            startDate ||
            endDate
        ) {
            filter.paymentDate = {};

            if (startDate) {
                const start =
                    new Date(startDate);

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

                filter.paymentDate.$gte =
                    start;
            }

            if (endDate) {
                const end =
                    new Date(endDate);

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

                filter.paymentDate.$lte =
                    end;
            }
        }

        // -------------------------
        // Pagination
        // -------------------------

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

        // -------------------------
        // Search
        // -------------------------

        if (search) {
            const regex =
                new RegExp(
                    search.trim(),
                    "i"
                );

            const [
                matchingSuppliers,
                matchingInvoices,
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
                    paymentNumber:
                        regex,
                },
                {
                    transactionReference:
                        regex,
                },
                {
                    supplier: {
                        $in: matchingSuppliers.map(
                            (item) =>
                                item._id
                        ),
                    },
                },
                {
                    purchaseInvoice: {
                        $in: matchingInvoices.map(
                            (item) =>
                                item._id
                        ),
                    },
                },
            ];
        }

        const skip =
            (currentPage - 1) *
            perPage;

        const [
            payments,
            total,
        ] = await Promise.all([
            PurchasePayment.find(filter)
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
                    "purchaseInvoice",
                    "invoiceNumber internalInvoiceNumber totalAmount paidAmount dueAmount paymentStatus status"
                )
                .populate(
                    "createdBy",
                    "name email"
                )
                .sort({
                    paymentDate: -1,
                    createdAt: -1,
                })
                .skip(skip)
                .limit(perPage),

            PurchasePayment.countDocuments(
                filter
            ),
        ]);

        return res.status(200).json({
            success: true,
            data: payments,
            pagination: {
                page: currentPage,
                limit: perPage,
                total,
                pages: Math.ceil(
                    total / perPage
                ),
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// Get Payment By ID
// ============================================================

const getPurchasePaymentById =
    async (req, res, next) => {
        try {
            const { id } =
                req.params;

            if (
                !isValidObjectId(id)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid purchase payment ID",
                });
            }

            const payment =
                await PurchasePayment.findById(
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
                        "purchaseInvoice",
                        "invoiceNumber internalInvoiceNumber invoiceDate totalAmount paidAmount dueAmount paymentStatus status"
                    )
                    .populate(
                        "createdBy",
                        "name email"
                    )
                    .populate(
                        "updatedBy",
                        "name email"
                    );

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Purchase payment not found",
                });
            }

            return res.status(200).json({
                success: true,
                data: payment,
            });
        } catch (error) {
            next(error);
        }
    };

// ============================================================
// Delete Payment
// ============================================================

const deletePurchasePayment =
    async (req, res, next) => {
        try {
            const { id } =
                req.params;

            if (
                !isValidObjectId(id)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid purchase payment ID",
                });
            }

            const payment =
                await PurchasePayment.findById(
                    id
                );

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Purchase payment not found",
                });
            }

            // Completed payments should not
            // be hard deleted.
            if (
                payment.status ===
                "COMPLETED"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Completed payments cannot be deleted",
                });
            }

            await payment.deleteOne();

            return res.status(200).json({
                success: true,
                message:
                    "Purchase payment deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    };

module.exports = {
    createPurchasePayment,
    getPurchasePayments,
    getPurchasePaymentById,
    deletePurchasePayment,
};