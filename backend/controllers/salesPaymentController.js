const mongoose = require("mongoose");

const SalesPayment = require("../models/SalesPayment");
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
    return Math.round(
        (Number(value) + Number.EPSILON) * 100
    ) / 100;
};

const validateObjectId = (value, fieldName) => {
    if (
        !value ||
        !mongoose.Types.ObjectId.isValid(value)
    ) {
        throw new Error(`Invalid ${fieldName}`);
    }
};

/*
|--------------------------------------------------------------------------
| Generate Payment Number
|--------------------------------------------------------------------------
|
| Example:
| SPAY-000001
|
*/

const generatePaymentNumber = async (
    company,
    session
) => {
    const lastPayment =
        await SalesPayment.findOne({
            company,
        })
            .sort({
                createdAt: -1,
            })
            .select("paymentNumber")
            .session(session);

    let nextNumber = 1;

    if (
        lastPayment &&
        lastPayment.paymentNumber
    ) {
        const match =
            lastPayment.paymentNumber.match(
                /(\d+)$/
            );

        if (match) {
            nextNumber =
                Number(match[1]) + 1;
        }
    }

    return `SPAY-${String(
        nextNumber
    ).padStart(6, "0")}`;
};

/*
|--------------------------------------------------------------------------
| Calculate Payment Status
|--------------------------------------------------------------------------
*/

const calculatePaymentStatus = (
    grandTotal,
    paidAmount,
    dueDate
) => {
    const total =
        roundMoney(grandTotal);

    const paid =
        roundMoney(paidAmount);

    const balance =
        roundMoney(total - paid);

    if (balance <= 0) {
        return "PAID";
    }

    if (paid > 0) {
        return "PARTIALLY_PAID";
    }

    /*
    |--------------------------------------------------------------------------
    | Overdue
    |--------------------------------------------------------------------------
    */

    if (
        dueDate &&
        new Date(dueDate) < new Date()
    ) {
        return "OVERDUE";
    }

    return "UNPAID";
};

/*
|--------------------------------------------------------------------------
| CREATE SALES PAYMENT
|--------------------------------------------------------------------------
|
| POST /api/sales-payments
|
*/

const createSalesPayment = async (
    req,
    res
) => {
    try {
        const userId = req.user._id;

        const {
            salesInvoice: salesInvoiceId,
            amount,
            paymentMethod,
            transactionReference = "",
            paymentDate,
            notes = "",
        } = req.body;

        /*
        |--------------------------------------------------------------------------
        | Basic Validation
        |--------------------------------------------------------------------------
        */

        validateObjectId(
            salesInvoiceId,
            "salesInvoice"
        );

        const paymentAmount =
            Number(amount);

        if (
            !Number.isFinite(
                paymentAmount
            ) ||
            paymentAmount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment amount must be greater than zero",
            });
        }

        const allowedMethods = [
            "CASH",
            "UPI",
            "BANK_TRANSFER",
            "CARD",
            "CHEQUE",
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

        /*
        |--------------------------------------------------------------------------
        | Transaction
        |--------------------------------------------------------------------------
        */

        const result =
            await withTransaction(
                async (session) => {
                    /*
                    |--------------------------------------------------------------------------
                    | 1. Get Invoice
                    |--------------------------------------------------------------------------
                    */

                    const invoice =
                        await SalesInvoice.findById(
                            salesInvoiceId
                        )
                            .session(session);

                    if (!invoice) {
                        throw new Error(
                            "Sales Invoice not found"
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | 2. Validate Invoice Status
                    |--------------------------------------------------------------------------
                    */

                    if (
                        invoice.status ===
                        "CANCELLED"
                    ) {
                        throw new Error(
                            "Cannot make payment for a cancelled invoice"
                        );
                    }

                    if (
                        invoice.status !==
                        "ISSUED"
                    ) {
                        throw new Error(
                            "Payment can only be made against an ISSUED invoice"
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | 3. Get Customer
                    |--------------------------------------------------------------------------
                    */

                    const customer =
                        await Customer.findOne({
                            _id:
                                invoice.customer,
                            company:
                                invoice.company,
                            isActive: true,
                        }).session(
                            session
                        );

                    if (!customer) {
                        throw new Error(
                            "Customer not found for this company"
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | 4. Calculate Current Balance
                    |--------------------------------------------------------------------------
                    */

                    const currentPaid =
                        roundMoney(
                            invoice.paidAmount ||
                                0
                        );

                    const grandTotal =
                        roundMoney(
                            invoice.grandTotal
                        );

                    const currentBalance =
                        roundMoney(
                            grandTotal -
                                currentPaid
                        );

                    /*
                    |--------------------------------------------------------------------------
                    | 5. Prevent Overpayment
                    |--------------------------------------------------------------------------
                    */

                    if (
                        paymentAmount >
                        currentBalance
                    ) {
                        throw new Error(
                            `Payment exceeds invoice balance. Balance due: ${currentBalance}`
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | 6. Generate Payment Number
                    |--------------------------------------------------------------------------
                    */

                    const paymentNumber =
                        await generatePaymentNumber(
                            invoice.company,
                            session
                        );

                    /*
                    |--------------------------------------------------------------------------
                    | 7. Create Payment
                    |--------------------------------------------------------------------------
                    */

                    const paymentData = {
                        company:
                            invoice.company,

                        branch:
                            invoice.branch,

                        paymentNumber,

                        paymentDate:
                            paymentDate ||
                            new Date(),

                        salesInvoice:
                            invoice._id,

                        customer:
                            invoice.customer,

                        amount:
                            roundMoney(
                                paymentAmount
                            ),

                        paymentMethod,

                        transactionReference:
                            transactionReference.trim(),

                        notes,

                        status: "SUCCESS",

                        createdBy:
                            userId,

                        updatedBy:
                            userId,
                    };

                    /*
                    |--------------------------------------------------------------------------
                    | Link Sales Order
                    |--------------------------------------------------------------------------
                    */

                    if (
                        invoice.salesOrder
                    ) {
                        paymentData.salesOrder =
                            invoice.salesOrder;
                    }

                    const createdPayments =
                        await SalesPayment.create(
                            [paymentData],
                            { session }
                        );

                    const payment =
                        createdPayments[0];

                    /*
                    |--------------------------------------------------------------------------
                    | 8. Update Invoice Paid Amount
                    |--------------------------------------------------------------------------
                    */

                    const newPaidAmount =
                        roundMoney(
                            currentPaid +
                                paymentAmount
                        );

                    const newBalanceDue =
                        roundMoney(
                            grandTotal -
                                newPaidAmount
                        );

                    const newPaymentStatus =
                        calculatePaymentStatus(
                            grandTotal,
                            newPaidAmount,
                            invoice.dueDate
                        );

                    invoice.paidAmount =
                        newPaidAmount;

                    invoice.balanceDue =
                        Math.max(
                            newBalanceDue,
                            0
                        );

                    invoice.paymentStatus =
                        newPaymentStatus;

                    invoice.updatedBy =
                        userId;

                    await invoice.save({
                        session,
                    });

                    /*
                    |--------------------------------------------------------------------------
                    | 9. Populate Payment
                    |--------------------------------------------------------------------------
                    */

                    await payment.populate([
                        {
                            path:
                                "company",
                            select:
                                "name legalName",
                        },
                        {
                            path:
                                "branch",
                            select:
                                "name code",
                        },
                        {
                            path:
                                "salesInvoice",
                            select:
                                "invoiceNumber grandTotal paidAmount balanceDue paymentStatus",
                        },
                        {
                            path:
                                "salesOrder",
                            select:
                                "salesOrderNumber status",
                        },
                        {
                            path:
                                "customer",
                            select:
                                "customerCode name email phone",
                        },
                        {
                            path:
                                "createdBy",
                            select:
                                "name email",
                        },
                    ]);

                    return {
                        payment,
                        invoice,
                    };
                }
            );

        return res.status(201).json({
            success: true,
            message:
                "Sales Payment created successfully",
            data: {
                payment:
                    result.payment,

                invoice: {
                    _id:
                        result.invoice._id,

                    invoiceNumber:
                        result.invoice
                            .invoiceNumber,

                    grandTotal:
                        result.invoice
                            .grandTotal,

                    paidAmount:
                        result.invoice
                            .paidAmount,

                    balanceDue:
                        result.invoice
                            .balanceDue,

                    paymentStatus:
                        result.invoice
                            .paymentStatus,
                },
            },
        });
    } catch (error) {
        console.error(
            "Create Sales Payment Error:",
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
| GET ALL SALES PAYMENTS
|--------------------------------------------------------------------------
|
| GET /api/sales-payments
|
| Query:
|
| ?page=1
| ?limit=10
| ?search=SPAY-000001
| ?paymentMethod=UPI
| ?status=SUCCESS
|
*/

const getSalesPayments = async (
    req,
    res
) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = "",
            paymentMethod,
            status,
            customer,
            salesInvoice,
            salesOrder,
        } = req.query;

        const pageNumber =
            Math.max(
                Number(page),
                1
            );

        const limitNumber =
            Math.min(
                Math.max(
                    Number(limit),
                    1
                ),
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
            filter.$or = [
                {
                    paymentNumber: {
                        $regex:
                            search.trim(),
                        $options: "i",
                    },
                },
                {
                    transactionReference: {
                        $regex:
                            search.trim(),
                        $options: "i",
                    },
                },
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Filters
        |--------------------------------------------------------------------------
        */

        if (paymentMethod) {
            filter.paymentMethod =
                paymentMethod;
        }

        if (status) {
            filter.status =
                status;
        }

        if (customer) {
            validateObjectId(
                customer,
                "customer"
            );

            filter.customer =
                customer;
        }

        if (salesInvoice) {
            validateObjectId(
                salesInvoice,
                "salesInvoice"
            );

            filter.salesInvoice =
                salesInvoice;
        }

        if (salesOrder) {
            validateObjectId(
                salesOrder,
                "salesOrder"
            );

            filter.salesOrder =
                salesOrder;
        }

        /*
        |--------------------------------------------------------------------------
        | Fetch
        |--------------------------------------------------------------------------
        */

        const [
            payments,
            total,
        ] = await Promise.all([
            SalesPayment.find(filter)
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "branch",
                    "name code"
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
                    "createdBy",
                    "name email"
                )
                .sort({
                    paymentDate: -1,
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limitNumber),

            SalesPayment.countDocuments(
                filter
            ),
        ]);

        return res.status(200).json({
            success: true,
            count: payments.length,
            total,
            page: pageNumber,
            pages: Math.ceil(
                total /
                    limitNumber
            ),
            data: payments,
        });
    } catch (error) {
        console.error(
            "Get Sales Payments Error:",
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
| GET SALES PAYMENT BY ID
|--------------------------------------------------------------------------
|
| GET /api/sales-payments/:id
|
*/

const getSalesPaymentById = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;

        validateObjectId(
            id,
            "salesPayment"
        );

        const payment =
            await SalesPayment.findById(
                id
            )
                .populate(
                    "company",
                    "name legalName email phone gstNumber panNumber"
                )
                .populate(
                    "branch",
                    "name code email phone address"
                )
                .populate(
                    "salesInvoice",
                    "invoiceNumber invoiceDate dueDate grandTotal paidAmount balanceDue paymentStatus status"
                )
                .populate(
                    "salesOrder",
                    "salesOrderNumber status"
                )
                .populate(
                    "customer",
                    "customerCode name email phone alternatePhone"
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
                    "Sales Payment not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: payment,
        });
    } catch (error) {
        console.error(
            "Get Sales Payment Error:",
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
| CANCEL SALES PAYMENT
|--------------------------------------------------------------------------
|
| PATCH /api/sales-payments/:id/cancel
|
| Payment is NOT deleted.
| It is cancelled and invoice totals are reversed.
|
*/

const cancelSalesPayment = async (
    req,
    res
) => {
    try {
        const userId =
            req.user._id;

        const { id } =
            req.params;

        const {
            cancellationReason = "",
        } = req.body;

        validateObjectId(
            id,
            "salesPayment"
        );

        if (
            !cancellationReason.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Cancellation reason is required",
            });
        }

        const result =
            await withTransaction(
                async (session) => {
                    /*
                    |--------------------------------------------------------------------------
                    | 1. Get Payment
                    |--------------------------------------------------------------------------
                    */

                    const payment =
                        await SalesPayment.findById(
                            id
                        ).session(
                            session
                        );

                    if (!payment) {
                        throw new Error(
                            "Sales Payment not found"
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | 2. Payment Already Cancelled
                    |--------------------------------------------------------------------------
                    */

                    if (
                        payment.status ===
                        "CANCELLED"
                    ) {
                        throw new Error(
                            "Payment is already cancelled"
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | 3. Get Invoice
                    |--------------------------------------------------------------------------
                    */

                    const invoice =
                        await SalesInvoice.findById(
                            payment.salesInvoice
                        ).session(
                            session
                        );

                    if (!invoice) {
                        throw new Error(
                            "Sales Invoice not found"
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | 4. Validate Amount
                    |--------------------------------------------------------------------------
                    */

                    const currentPaid =
                        roundMoney(
                            invoice.paidAmount ||
                                0
                        );

                    const paymentAmount =
                        roundMoney(
                            payment.amount
                        );

                    const newPaidAmount =
                        roundMoney(
                            currentPaid -
                                paymentAmount
                        );

                    if (
                        newPaidAmount <
                        0
                    ) {
                        throw new Error(
                            "Invoice paid amount cannot become negative"
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | 5. Reverse Payment
                    |--------------------------------------------------------------------------
                    */

                    const newBalance =
                        roundMoney(
                            invoice.grandTotal -
                                newPaidAmount
                        );

                    invoice.paidAmount =
                        newPaidAmount;

                    invoice.balanceDue =
                        Math.max(
                            newBalance,
                            0
                        );

                    invoice.paymentStatus =
                        calculatePaymentStatus(
                            invoice.grandTotal,
                            newPaidAmount,
                            invoice.dueDate
                        );

                    invoice.updatedBy =
                        userId;

                    await invoice.save({
                        session,
                    });

                    /*
                    |--------------------------------------------------------------------------
                    | 6. Cancel Payment
                    |--------------------------------------------------------------------------
                    */

                    payment.status =
                        "CANCELLED";

                    payment.cancelledAt =
                        new Date();

                    payment.cancellationReason =
                        cancellationReason;

                    payment.updatedBy =
                        userId;

                    await payment.save({
                        session,
                    });

                    return {
                        payment,
                        invoice,
                    };
                }
            );

        await result.payment.populate([
            {
                path:
                    "salesInvoice",
                select:
                    "invoiceNumber grandTotal paidAmount balanceDue paymentStatus",
            },
            {
                path:
                    "customer",
                select:
                    "customerCode name email phone",
            },
        ]);

        return res.status(200).json({
            success: true,
            message:
                "Sales Payment cancelled successfully",
            data: {
                payment:
                    result.payment,

                invoice: {
                    invoiceNumber:
                        result.invoice
                            .invoiceNumber,

                    grandTotal:
                        result.invoice
                            .grandTotal,

                    paidAmount:
                        result.invoice
                            .paidAmount,

                    balanceDue:
                        result.invoice
                            .balanceDue,

                    paymentStatus:
                        result.invoice
                            .paymentStatus,
                },
            },
        });
    } catch (error) {
        console.error(
            "Cancel Sales Payment Error:",
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
| DELETE SALES PAYMENT
|--------------------------------------------------------------------------
|
| Financial records should never be hard deleted.
|
*/

const deleteSalesPayment = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;

        validateObjectId(
            id,
            "salesPayment"
        );

        const payment =
            await SalesPayment.findById(
                id
            );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message:
                    "Sales Payment not found",
            });
        }

        return res.status(400).json({
            success: false,
            message:
                "Sales payments cannot be permanently deleted. Cancel the payment instead.",
        });
    } catch (error) {
        console.error(
            "Delete Sales Payment Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createSalesPayment,
    getSalesPayments,
    getSalesPaymentById,
    cancelSalesPayment,
    deleteSalesPayment,
};