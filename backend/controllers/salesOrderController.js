const mongoose = require("mongoose");
const Counter = require("../models/Counter");

const SalesOrder = require("../models/SalesOrder");
const Company = require("../models/Company");
const Branch = require("../models/Branch");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const Warehouse = require("../models/Warehouse");
const Quotation = require("../models/Quotation");

const {
    reserveStock,
    releaseStock,
    decreaseStock,
} = require("../services/stockService");

const {
    createNotification,
    createStockNotification,
} = require("../services/notificationService");

// =====================================================
// HELPERS
// =====================================================

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const roundMoney = (value) => {
    return (
        Math.round(
            (Number(value) + Number.EPSILON) * 100
        ) / 100
    );
};

// =====================================================
// GENERATE SALES ORDER NUMBER
// =====================================================
//
// Example:
//
// SO-000001
// SO-000002
// SO-000003
//
// IMPORTANT:
// Counter is NOT attached to the SalesOrder transaction.
//
// Reason:
// If the sales order transaction fails, the generated
// number should not come back again and cause duplicate
// key errors.
//
// =====================================================

const generateSalesOrderNumber = async (
    companyId
) => {
    const counterKey =
        `salesOrder:${companyId}`;

    // -------------------------------------------------
    // Try existing counter first
    // -------------------------------------------------

    let counter =
        await Counter.findOneAndUpdate(
            {
                key: counterKey,
            },
            {
                $inc: {
                    seq: 1,
                },
            },
            {
                new: true,
                upsert: false,
            }
        );

    // -------------------------------------------------
    // Counter does not exist
    // -------------------------------------------------
    //
    // This can happen when:
    //
    // Sales Order already exists
    // BUT
    // Counter document was never created.
    //
    // Example:
    //
    // Existing:
    // SO-000001
    //
    // We need:
    // SO-000002
    //
    // -------------------------------------------------

    if (!counter) {
        const latestSalesOrder =
            await SalesOrder.findOne({
                company: companyId,

                salesOrderNumber: {
                    $regex: /^SO-\d+$/,
                },
            })
                .sort({
                    salesOrderNumber: -1,
                })
                .select(
                    "salesOrderNumber"
                )
                .lean();

        let latestSequence = 0;

        // -------------------------------------------------
        // Read latest existing number
        // -------------------------------------------------

        if (
            latestSalesOrder &&
            latestSalesOrder.salesOrderNumber
        ) {
            const match =
                latestSalesOrder.salesOrderNumber.match(
                    /^SO-(\d+)$/
                );

            if (match) {
                latestSequence =
                    Number(match[1]) || 0;
            }
        }

       // -------------------------------------------------
// Create counter
// -------------------------------------------------

try {
    await Counter.create({
        key: counterKey,
        seq: latestSequence,
    });
} catch (error) {
    // Counter already created by another request
    if (error.code !== 11000) {
        throw error;
    }
}

// -------------------------------------------------
// Increment counter
// -------------------------------------------------

counter =
    await Counter.findOneAndUpdate(
        {
            key: counterKey,
        },
        {
            $inc: {
                seq: 1,
            },
        },
        {
            new: true,
        }
    );

if (!counter) {
    throw new Error(
        "Failed to initialize sales order counter."
    );
}
    }
    // -------------------------------------------------
    // Final Sales Order Number
    // -------------------------------------------------

    return `SO-${String(
        counter.seq
    ).padStart(6, "0")}`;
};

// =====================================================
// CALCULATE ITEMS
// =====================================================

const calculateItems = async (
    items,
    companyId,
    session = null
) => {
    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {
        throw new Error(
            "At least one sales order item is required."
        );
    }

    const seenProducts = new Set();

    const calculatedItems = [];

    let subtotal = 0;
    let discountAmount = 0;
    let taxableAmount = 0;
    let taxAmount = 0;
    let totalAmount = 0;

    for (const item of items) {
        if (
            !item.product ||
            !isValidObjectId(item.product)
        ) {
            throw new Error(
                "Valid product is required for every item."
            );
        }

        const productId =
            String(item.product);

        if (
            seenProducts.has(productId)
        ) {
            throw new Error(
                "Duplicate products are not allowed in the same sales order."
            );
        }

        seenProducts.add(productId);

        const productQuery =
            Product.findOne({
                _id: item.product,
                company: companyId,
                isActive: true,
            });

        if (session) {
            productQuery.session(session);
        }

        const product =
            await productQuery;

        if (!product) {
            throw new Error(
                `Active product not found: ${item.product}`
            );
        }

        const quantity =
            Number(item.quantity);

        const unitPrice =
            Number(item.unitPrice);

        const discountPercent =
            Number(
                item.discountPercent || 0
            );

        const taxPercent =
            Number(
                item.taxPercent || 0
            );

        // ---------------------------------------------
        // Quantity validation
        // ---------------------------------------------

        if (
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {
            throw new Error(
                "Quantity must be greater than zero."
            );
        }

        // ---------------------------------------------
        // Price validation
        // ---------------------------------------------

        if (
            !Number.isFinite(unitPrice) ||
            unitPrice < 0
        ) {
            throw new Error(
                "Unit price cannot be negative."
            );
        }

        // ---------------------------------------------
        // Discount validation
        // ---------------------------------------------

        if (
            !Number.isFinite(
                discountPercent
            ) ||
            discountPercent < 0 ||
            discountPercent > 100
        ) {
            throw new Error(
                "Discount must be between 0 and 100."
            );
        }

        // ---------------------------------------------
        // Tax validation
        // ---------------------------------------------

        if (
            !Number.isFinite(taxPercent) ||
            taxPercent < 0 ||
            taxPercent > 100
        ) {
            throw new Error(
                "Tax must be between 0 and 100."
            );
        }

        // ---------------------------------------------
        // Calculations
        // ---------------------------------------------

        const grossAmount =
            quantity * unitPrice;

        const itemDiscount =
            grossAmount *
            (discountPercent / 100);

        const itemTaxable =
            grossAmount -
            itemDiscount;

        const itemTax =
            itemTaxable *
            (taxPercent / 100);

        const itemTotal =
            itemTaxable +
            itemTax;

        calculatedItems.push({
            product: product._id,

            description:
                item.description ||
                product.name ||
                "",

            quantity,

            unitPrice:
                roundMoney(unitPrice),

            discountPercent,

            taxPercent,

            discountAmount:
                roundMoney(
                    itemDiscount
                ),

            taxableAmount:
                roundMoney(
                    itemTaxable
                ),

            taxAmount:
                roundMoney(itemTax),

            lineTotal:
                roundMoney(itemTotal),
        });

        subtotal += grossAmount;

        discountAmount +=
            itemDiscount;

        taxableAmount +=
            itemTaxable;

        taxAmount += itemTax;

        totalAmount += itemTotal;
    }

    return {
        items: calculatedItems,

        subtotal:
            roundMoney(subtotal),

        discountAmount:
            roundMoney(
                discountAmount
            ),

        taxableAmount:
            roundMoney(
                taxableAmount
            ),

        taxAmount:
            roundMoney(taxAmount),

        totalAmount:
            roundMoney(totalAmount),
    };
};

// =====================================================
// VALIDATE COMPANY & BRANCH
// =====================================================

const validateCompanyAndBranch = async (
    companyId,
    branchId,
    session = null
) => {
    if (
        !companyId ||
        !isValidObjectId(companyId)
    ) {
        throw new Error(
            "Valid company is required."
        );
    }

    if (
        !branchId ||
        !isValidObjectId(branchId)
    ) {
        throw new Error(
            "Valid branch is required."
        );
    }

    const companyQuery =
        Company.findOne({
            _id: companyId,
            isActive: true,
        });

    if (session) {
        companyQuery.session(session);
    }

    const company =
        await companyQuery;

    if (!company) {
        throw new Error(
            "Active company not found."
        );
    }

    const branchQuery =
        Branch.findOne({
            _id: branchId,
            company: companyId,
            isActive: true,
        });

    if (session) {
        branchQuery.session(session);
    }

    const branch =
        await branchQuery;

    if (!branch) {
        throw new Error(
            "Active branch not found or branch does not belong to the selected company."
        );
    }

    return {
        company,
        branch,
    };
};

// =====================================================
// VALIDATE CUSTOMER
// =====================================================

const validateCustomer = async (
    customerId,
    companyId,
    branchId,
    session = null
) => {
    if (
        !customerId ||
        !isValidObjectId(customerId)
    ) {
        throw new Error(
            "Valid customer is required."
        );
    }

    const query =
        Customer.findOne({
            _id: customerId,
            company: companyId,
            branch: branchId,
            isActive: true,
        });

    if (session) {
        query.session(session);
    }

    const customer =
        await query;

    if (!customer) {
        throw new Error(
            "Active customer not found or customer does not belong to the selected company/branch."
        );
    }

    return customer;
};

// =====================================================
// VALIDATE WAREHOUSE
// =====================================================

const validateWarehouse = async (
    warehouseId,
    companyId,
    branchId,
    session = null
) => {
    if (
        !warehouseId ||
        !isValidObjectId(warehouseId)
    ) {
        throw new Error(
            "Valid warehouse is required."
        );
    }

    const query =
        Warehouse.findOne({
            _id: warehouseId,
            company: companyId,
            branch: branchId,
            isActive: true,
        });

    if (session) {
        query.session(session);
    }

    const warehouse =
        await query;

    if (!warehouse) {
        throw new Error(
            "Active warehouse not found or warehouse does not belong to the selected company/branch."
        );
    }

    return warehouse;
};

// =====================================================
// RESERVE SALES ORDER STOCK
// =====================================================

const reserveSalesOrderStock = async (
    salesOrder,
    userId,
    session
) => {
    const affectedStocks = [];

    for (
        const item of salesOrder.items
    ) {
        const stock =
            await reserveStock({
                company:
                    salesOrder.company,

                branch:
                    salesOrder.branch,

                warehouse:
                    salesOrder.warehouse,

                product:
                    item.product,

                quantity:
                    item.quantity,

                session,
            });

        if (stock) {
            affectedStocks.push(stock);
        }
    }

    return affectedStocks;
};

// =====================================================
// RELEASE SALES ORDER RESERVED STOCK
// =====================================================

const releaseSalesOrderStock = async (
    salesOrder,
    session
) => {
    const affectedStocks = [];

    for (
        const item of salesOrder.items
    ) {
        const stock =
            await releaseStock({
                company:
                    salesOrder.company,

                branch:
                    salesOrder.branch,

                warehouse:
                    salesOrder.warehouse,

                product:
                    item.product,

                quantity:
                    item.quantity,

                session,
            });

        if (stock) {
            affectedStocks.push(stock);
        }
    }

    return affectedStocks;
};

// =====================================================
// DEDUCT SALES ORDER STOCK
// =====================================================

const deductSalesOrderStock = async (
    salesOrder,
    userId,
    session
) => {
    const affectedStocks = [];

    for (
        const item of salesOrder.items
    ) {
        const result =
            await decreaseStock({
                company:
                    salesOrder.company,

                branch:
                    salesOrder.branch,

                warehouse:
                    salesOrder.warehouse,

                product:
                    item.product,

                quantity:
                    item.quantity,

                movementType:
                    "SALE",

                referenceType:
                    "OTHER",

                referenceId:
                    salesOrder._id,

                referenceNumber:
                    salesOrder.salesOrderNumber,

                unitPrice:
                    item.unitPrice,

                reason:
                    "Sales order stock deduction",

                notes:
                    `Stock deducted when sales order ${salesOrder.salesOrderNumber} moved to PROCESSING.`,

                createdBy:
                    userId,

                session,
            });

        if (result?.stock) {
            affectedStocks.push(
                result.stock
            );
        }
    }

    return affectedStocks;
};

// =====================================================
// SEND SALES ORDER STOCK NOTIFICATIONS
// =====================================================

const sendSalesOrderStockNotifications =
    async ({
        salesOrder,
        stocks = [],
        recipient,
        createdBy,
    }) => {
        try {
            if (!salesOrder) {
                return;
            }

            if (!recipient) {
                return;
            }

            if (
                !Array.isArray(stocks) ||
                stocks.length === 0
            ) {
                return;
            }

            const uniqueStocks = [
                ...new Map(
                    stocks
                        .filter(Boolean)
                        .map(
                            (stock) => [
                                String(
                                    stock._id
                                ),
                                stock,
                            ]
                        )
                ).values(),
            ];

            for (
                const stock of uniqueStocks
            ) {
                try {
                    if (
                        !stock ||
                        !stock._id
                    ) {
                        continue;
                    }

                    const productId =
                        stock.product;

                    const warehouseId =
                        stock.warehouse;

                    if (
                        !productId ||
                        !warehouseId
                    ) {
                        continue;
                    }

                    const product =
                        await Product.findOne({
                            _id: productId,
                            company:
                                salesOrder.company,
                            isActive: true,
                        });

                    if (!product) {
                        continue;
                    }

                    const warehouse =
                        await Warehouse.findOne({
                            _id:
                                warehouseId,

                            company:
                                salesOrder.company,

                            branch:
                                salesOrder.branch,

                            isActive: true,
                        });

                    if (!warehouse) {
                        continue;
                    }

                    await createStockNotification({
                        company:
                            salesOrder.company,

                        branch:
                            salesOrder.branch,

                        recipient,

                        stock,

                        product,

                        warehouse,

                        createdBy,
                    });
                } catch (error) {
                    console.error(
                        "Sales Order Stock Notification Error:",
                        error.message
                    );
                }
            }
        } catch (error) {
            console.error(
                "Send Sales Order Stock Notifications Error:",
                error.message
            );
        }
    };

// =====================================================
// SALES ORDER NOTIFICATION
// =====================================================

const sendSalesOrderNotification =
    async ({
        salesOrder,
        previousStatus = null,
        recipient,
        createdBy,
    }) => {
        try {
            if (!salesOrder) {
                return null;
            }

            if (!recipient) {
                return null;
            }

            let title =
                "Sales Order Updated";

            let message =
                `Sales order ${salesOrder.salesOrderNumber} was updated.`;

            let priority =
                "MEDIUM";

            // ---------------------------------------------
            // Sales Order Created
            // ---------------------------------------------

            if (
                previousStatus === null
            ) {
                title =
                    "Sales Order Created";

                message =
                    `Sales order ${salesOrder.salesOrderNumber} was created with status ${salesOrder.status}.`;
            }

            // ---------------------------------------------
            // Sales Order Status Updated
            // ---------------------------------------------

            else {
                title =
                    "Sales Order Status Updated";

                message =
                    `Sales order ${salesOrder.salesOrderNumber} status changed from ${previousStatus} to ${salesOrder.status}.`;

                if (
                    salesOrder.status ===
                    "CANCELLED"
                ) {
                    priority =
                        "HIGH";
                }

                if (
                    salesOrder.status ===
                    "COMPLETED"
                ) {
                    priority =
                        "LOW";
                }
            }

            return await createNotification({
                company:
                    salesOrder.company?._id ||
                    salesOrder.company,

                branch:
                    salesOrder.branch?._id ||
                    salesOrder.branch ||
                    null,

                recipient,

                type:
                    "SALES_ORDER",

                title,

                message,

                priority,

                referenceType:
                    "SALES_ORDER",

                referenceId:
                    salesOrder._id,

                metadata: {
                    salesOrderNumber:
                        salesOrder.salesOrderNumber,

                    previousStatus,

                    currentStatus:
                        salesOrder.status,

                    customerId:
                        salesOrder.customer?._id ||
                        salesOrder.customer ||
                        null,

                    warehouseId:
                        salesOrder.warehouse?._id ||
                        salesOrder.warehouse ||
                        null,

                    totalAmount:
                        salesOrder.totalAmount,
                },

                createdBy:
                    createdBy || null,
            });
        } catch (error) {
            console.error(
                "Sales Order Notification Error:",
                error.message
            );

            return null;
        }
    };

// =====================================================
// CREATE SALES ORDER
// =====================================================

const createSalesOrder = async (
    req,
    res
) => {
    const session =
        await SalesOrder.db.startSession();

    try {
        session.startTransaction();

        const {
            company,
            branch,
            customer,
            quotation,
            salesPerson,
            warehouse,
            orderDate,
            expectedDeliveryDate,
            items,
            notes,
            termsAndConditions,
            status,
        } = req.body;

        // ---------------------------------------------
        // Company & Branch
        // ---------------------------------------------

        await validateCompanyAndBranch(
            company,
            branch,
            session
        );

        // ---------------------------------------------
        // Customer
        // ---------------------------------------------

        const validCustomer =
            await validateCustomer(
                customer,
                company,
                branch,
                session
            );

        // ---------------------------------------------
        // Warehouse
        // ---------------------------------------------

        await validateWarehouse(
            warehouse,
            company,
            branch,
            session
        );

        // ---------------------------------------------
        // Dates
        // ---------------------------------------------

        const finalOrderDate =
            orderDate
                ? new Date(orderDate)
                : new Date();

        if (
            Number.isNaN(
                finalOrderDate.getTime()
            )
        ) {
            throw new Error(
                "Invalid order date."
            );
        }

        let finalExpectedDeliveryDate =
            expectedDeliveryDate
                ? new Date(
                      expectedDeliveryDate
                  )
                : null;

        if (
            finalExpectedDeliveryDate &&
            Number.isNaN(
                finalExpectedDeliveryDate.getTime()
            )
        ) {
            throw new Error(
                "Invalid expected delivery date."
            );
        }

        if (
            finalExpectedDeliveryDate &&
            finalExpectedDeliveryDate <
                finalOrderDate
        ) {
            throw new Error(
                "Expected delivery date cannot be before order date."
            );
        }

        // ---------------------------------------------
        // Status
        // ---------------------------------------------

        const finalStatus =
            status || "DRAFT";

        if (
            ![
                "DRAFT",
                "CONFIRMED",
            ].includes(finalStatus)
        ) {
            throw new Error(
                "Sales order can initially be only DRAFT or CONFIRMED."
            );
        }

        // ---------------------------------------------
        // Quotation
        // ---------------------------------------------

        let quotationDocument = null;

        if (quotation) {
            if (
                !isValidObjectId(
                    quotation
                )
            ) {
                throw new Error(
                    "Invalid quotation ID."
                );
            }

            const quotationQuery =
                Quotation.findOne({
                    _id: quotation,
                    company,
                    branch,
                });

            quotationQuery.session(
                session
            );

            quotationDocument =
                await quotationQuery;

            if (!quotationDocument) {
                throw new Error(
                    "Quotation not found."
                );
            }

            if (
                quotationDocument.status !==
                "ACCEPTED"
            ) {
                throw new Error(
                    "Only an ACCEPTED quotation can be converted into a sales order."
                );
            }

            if (
                quotationDocument.convertedToSalesOrder
            ) {
                throw new Error(
                    "This quotation has already been converted into a sales order."
                );
            }

            if (
                String(
                    quotationDocument.customer
                ) !== String(customer)
            ) {
                throw new Error(
                    "Sales order customer must match the quotation customer."
                );
            }
        }

        // ---------------------------------------------
        // Determine Items
        // ---------------------------------------------

        let finalItems = items;

        if (
            quotationDocument &&
            (
                !Array.isArray(items) ||
                items.length === 0
            )
        ) {
            finalItems =
                quotationDocument.items.map(
                    (item) => ({
                        product:
                            item.product,

                        description:
                            item.description,

                        quantity:
                            item.quantity,

                        unitPrice:
                            item.unitPrice,

                        discountPercent:
                            item.discountPercent,

                        taxPercent:
                            item.taxPercent,
                    })
                );
        }

        // ---------------------------------------------
        // Calculate Items
        // ---------------------------------------------

        const calculation =
            await calculateItems(
                finalItems,
                company,
                session
            );

        // ---------------------------------------------
        // Generate Sales Order Number
        // ---------------------------------------------
        //
        // IMPORTANT:
        // Do NOT pass the transaction session here.
        //
        // Counter must survive a failed sales order
        // transaction.
        //
        // ---------------------------------------------

        const salesOrderNumber =
            await generateSalesOrderNumber(
                company
            );

        // ---------------------------------------------
        // Create Sales Order
        // ---------------------------------------------

        const salesOrderData = {
            company,

            branch,

            salesOrderNumber,

            orderDate:
                finalOrderDate,

            expectedDeliveryDate:
                finalExpectedDeliveryDate,

            customer:
                validCustomer._id,

            quotation:
                quotationDocument
                    ? quotationDocument._id
                    : null,

            salesPerson:
                salesPerson || null,

            warehouse,

            items:
                calculation.items,

            subtotal:
                calculation.subtotal,

            discountAmount:
                calculation.discountAmount,

            taxableAmount:
                calculation.taxableAmount,

            taxAmount:
                calculation.taxAmount,

            totalAmount:
                calculation.totalAmount,

            paymentStatus:
                "UNPAID",

            paidAmount: 0,

            status:
                finalStatus,

            salesInvoice: null,

            notes:
                notes || "",

            termsAndConditions:
                termsAndConditions || "",

            createdBy:
                req.user._id,

            updatedBy: null,
        };

        const salesOrder =
            new SalesOrder(
                salesOrderData
            );

        await salesOrder.save({
            session,
        });

        console.log(
            "Sales Order Created:",
            salesOrder.salesOrderNumber
        );

        // ---------------------------------------------
        // Store affected stocks
        // ---------------------------------------------

        let affectedStocks = [];

        // ---------------------------------------------
        // CONFIRMED
        // Reserve stock immediately
        // ---------------------------------------------

        if (
            finalStatus ===
            "CONFIRMED"
        ) {
            affectedStocks =
                await reserveSalesOrderStock(
                    salesOrder,
                    req.user._id,
                    session
                );

            console.log(
                "Sales Order Stock Reserved:",
                salesOrder.salesOrderNumber
            );
        }

        // ---------------------------------------------
        // Link Quotation
        // ---------------------------------------------

        if (quotationDocument) {
            quotationDocument.convertedToSalesOrder =
                salesOrder._id;

            quotationDocument.updatedBy =
                req.user._id;

            await quotationDocument.save({
                session,
            });

            console.log(
                "Quotation Linked Successfully"
            );
        }

        // ---------------------------------------------
        // Populate
        // ---------------------------------------------

        await salesOrder.populate([
            {
                path: "company",
            },
            {
                path: "branch",
            },
            {
                path: "customer",
            },
            {
                path: "quotation",
            },
            {
                path: "salesPerson",
            },
            {
                path: "warehouse",
            },
            {
                path: "items.product",
            },
            {
                path: "createdBy",
                select: "-password",
            },
            {
                path: "updatedBy",
                select: "-password",
            },
        ]);

        // ---------------------------------------------
        // Commit
        // ---------------------------------------------

        await session.commitTransaction();

        // ---------------------------------------------
        // Notification AFTER COMMIT
        // ---------------------------------------------

        await sendSalesOrderNotification({
            salesOrder,

            previousStatus: null,

            recipient:
                req.user._id,

            createdBy:
                req.user._id,
        });

        // ---------------------------------------------
        // Stock Notifications
        // ---------------------------------------------

        if (
            finalStatus ===
            "CONFIRMED"
        ) {
            await sendSalesOrderStockNotifications({
                salesOrder,

                stocks:
                    affectedStocks,

                recipient:
                    req.user._id,

                createdBy:
                    req.user._id,
            });
        }

        return res.status(201).json({
            success: true,

            message:
                "Sales order created successfully.",

            salesOrder,
        });
    } catch (error) {
        console.error(
            "Create Sales Order Error:",
            error
        );

        if (
            session.inTransaction()
        ) {
            await session.abortTransaction();
        }

        return res.status(400).json({
            success: false,

            message:
                error.message ||
                "Failed to create sales order.",
        });
    } finally {
        await session.endSession();
    }
};

// =====================================================
// GET ALL SALES ORDERS
// =====================================================

const getSalesOrders = async (
    req,
    res
) => {
    try {
        const {
            company,
            branch,
            customer,
            quotation,
            warehouse,
            status,
            paymentStatus,
            search,
            page = 1,
            limit = 10,
            sortBy = "orderDate",
            sortOrder = "desc",
        } = req.query;

        const filter = {};

        if (company) {
            if (
                !isValidObjectId(company)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid company ID.",
                });
            }

            filter.company = company;
        }

        if (branch) {
            if (
                !isValidObjectId(branch)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid branch ID.",
                });
            }

            filter.branch = branch;
        }

        if (customer) {
            if (
                !isValidObjectId(customer)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid customer ID.",
                });
            }

            filter.customer = customer;
        }

        if (quotation) {
            if (
                !isValidObjectId(
                    quotation
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid quotation ID.",
                });
            }

            filter.quotation =
                quotation;
        }

        if (warehouse) {
            if (
                !isValidObjectId(
                    warehouse
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid warehouse ID.",
                });
            }

            filter.warehouse =
                warehouse;
        }

        if (status) {
            filter.status = status;
        }

        if (paymentStatus) {
            filter.paymentStatus =
                paymentStatus;
        }

        if (search) {
            filter.salesOrderNumber = {
                $regex: search,
                $options: "i",
            };
        }

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

        const allowedSortFields = [
            "orderDate",
            "createdAt",
            "salesOrderNumber",
            "totalAmount",
            "status",
        ];

        const safeSortBy =
            allowedSortFields.includes(
                sortBy
            )
                ? sortBy
                : "orderDate";

        const sortDirection =
            sortOrder === "asc"
                ? 1
                : -1;

        const [
            salesOrders,
            total,
        ] = await Promise.all([
            SalesOrder.find(filter)
                .sort({
                    [safeSortBy]:
                        sortDirection,
                })
                .skip(skip)
                .limit(limitNumber)
                .populate("company")
                .populate("branch")
                .populate("customer")
                .populate("quotation")
                .populate("salesPerson")
                .populate("warehouse")
                .populate("items.product")
                .populate(
                    "createdBy",
                    "-password"
                )
                .populate(
                    "updatedBy",
                    "-password"
                ),

            SalesOrder.countDocuments(
                filter
            ),
        ]);

        return res.status(200).json({
            success: true,

            count:
                salesOrders.length,

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

            salesOrders,
        });
    } catch (error) {
        console.error(
            "Get Sales Orders Error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                error.message ||
                "Failed to fetch sales orders.",
        });
    }
};

// =====================================================
// GET SALES ORDER BY ID
// =====================================================

const getSalesOrderById = async (
    req,
    res
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
                    "Invalid sales order ID.",
            });
        }

        const salesOrder =
            await SalesOrder.findById(
                id
            )
                .populate("company")
                .populate("branch")
                .populate("customer")
                .populate("quotation")
                .populate("salesPerson")
                .populate("warehouse")
                .populate("items.product")
                .populate(
                    "createdBy",
                    "-password"
                )
                .populate(
                    "updatedBy",
                    "-password"
                )
                .populate(
                    "cancelledBy",
                    "-password"
                );

        if (!salesOrder) {
            return res.status(404).json({
                success: false,
                message:
                    "Sales order not found.",
            });
        }

        return res.status(200).json({
            success: true,
            salesOrder,
        });
    } catch (error) {
        console.error(
            "Get Sales Order Error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                error.message ||
                "Failed to fetch sales order.",
        });
    }
};

// =====================================================
// UPDATE SALES ORDER
// =====================================================

const updateSalesOrder = async (
    req,
    res
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
                    "Invalid sales order ID.",
            });
        }

        const salesOrder =
            await SalesOrder.findById(
                id
            );

        if (!salesOrder) {
            return res.status(404).json({
                success: false,
                message:
                    "Sales order not found.",
            });
        }

        // ---------------------------------------------
        // Only DRAFT orders can be edited
        // ---------------------------------------------

        if (
            salesOrder.status !==
            "DRAFT"
        ) {
            return res.status(400).json({
                success: false,

                message:
                    `Sales order cannot be updated when status is ${salesOrder.status}. Only DRAFT sales orders can be updated.`,
            });
        }

        const {
            orderDate,
            expectedDeliveryDate,
            salesPerson,
            warehouse,
            items,
            notes,
            termsAndConditions,
        } = req.body;

        // ---------------------------------------------
        // Order Date
        // ---------------------------------------------

        if (
            orderDate !== undefined
        ) {
            const newOrderDate =
                new Date(orderDate);

            if (
                Number.isNaN(
                    newOrderDate.getTime()
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid order date.",
                });
            }

            salesOrder.orderDate =
                newOrderDate;
        }

        // ---------------------------------------------
        // Expected Delivery Date
        // ---------------------------------------------

        if (
            expectedDeliveryDate !==
            undefined
        ) {
            if (
                expectedDeliveryDate ===
                null
            ) {
                salesOrder.expectedDeliveryDate =
                    null;
            } else {
                const newDeliveryDate =
                    new Date(
                        expectedDeliveryDate
                    );

                if (
                    Number.isNaN(
                        newDeliveryDate.getTime()
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid expected delivery date.",
                    });
                }

                if (
                    newDeliveryDate <
                    salesOrder.orderDate
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Expected delivery date cannot be before order date.",
                    });
                }

                salesOrder.expectedDeliveryDate =
                    newDeliveryDate;
            }
        }

        // ---------------------------------------------
        // Warehouse
        // ---------------------------------------------

        if (
            warehouse !== undefined
        ) {
            if (
                warehouse === null ||
                !isValidObjectId(
                    warehouse
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Valid warehouse ID is required.",
                });
            }

            await validateWarehouse(
                warehouse,
                salesOrder.company,
                salesOrder.branch
            );

            salesOrder.warehouse =
                warehouse;
        }

        // ---------------------------------------------
        // Sales Person
        // ---------------------------------------------

        if (
            salesPerson !==
            undefined
        ) {
            if (
                salesPerson !== null &&
                !isValidObjectId(
                    salesPerson
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid sales person ID.",
                });
            }

            salesOrder.salesPerson =
                salesPerson;
        }

        // ---------------------------------------------
        // Items
        // ---------------------------------------------

        if (
            items !== undefined
        ) {
            const calculation =
                await calculateItems(
                    items,
                    salesOrder.company
                );

            salesOrder.items =
                calculation.items;

            salesOrder.subtotal =
                calculation.subtotal;

            salesOrder.discountAmount =
                calculation.discountAmount;

            salesOrder.taxableAmount =
                calculation.taxableAmount;

            salesOrder.taxAmount =
                calculation.taxAmount;

            salesOrder.totalAmount =
                calculation.totalAmount;
        }

        // ---------------------------------------------
        // Notes
        // ---------------------------------------------

        if (
            notes !== undefined
        ) {
            salesOrder.notes =
                notes;
        }

        // ---------------------------------------------
        // Terms
        // ---------------------------------------------

        if (
            termsAndConditions !==
            undefined
        ) {
            salesOrder.termsAndConditions =
                termsAndConditions;
        }

        salesOrder.updatedBy =
            req.user._id;

        await salesOrder.save();

        await salesOrder.populate([
            {
                path: "company",
            },
            {
                path: "branch",
            },
            {
                path: "customer",
            },
            {
                path: "quotation",
            },
            {
                path: "salesPerson",
            },
            {
                path: "warehouse",
            },
            {
                path: "items.product",
            },
            {
                path: "createdBy",
                select: "-password",
            },
            {
                path: "updatedBy",
                select: "-password",
            },
        ]);

        return res.status(200).json({
            success: true,

            message:
                "Sales order updated successfully.",

            salesOrder,
        });
    } catch (error) {
        console.error(
            "Update Sales Order Error:",
            error
        );

        return res.status(400).json({
            success: false,

            message:
                error.message ||
                "Failed to update sales order.",
        });
    }
};

// =====================================================
// UPDATE SALES ORDER STATUS
// =====================================================

const updateSalesOrderStatus =
    async (req, res) => {
        const session =
            await SalesOrder.db.startSession();

        try {
            session.startTransaction();

            const { id } =
                req.params;

            const {
                status,
                cancellationReason,
            } = req.body;

            // -----------------------------------------
            // Validate ID
            // -----------------------------------------

            if (
                !isValidObjectId(id)
            ) {
                throw new Error(
                    "Invalid sales order ID."
                );
            }

            // -----------------------------------------
            // Get Sales Order
            // -----------------------------------------

            const salesOrderQuery =
                SalesOrder.findById(id);

            salesOrderQuery.session(
                session
            );

            const salesOrder =
                await salesOrderQuery;

            if (!salesOrder) {
                throw new Error(
                    "Sales order not found."
                );
            }

            // -----------------------------------------
            // Validate status
            // -----------------------------------------

            const allowedStatuses = [
                "DRAFT",
                "CONFIRMED",
                "PROCESSING",
                "READY_TO_DELIVER",
                "COMPLETED",
                "CANCELLED",
            ];

            if (
                !allowedStatuses.includes(
                    status
                )
            ) {
                throw new Error(
                    "Invalid sales order status."
                );
            }

            // -----------------------------------------
            // Status transitions
            // -----------------------------------------

            const transitions = {
                DRAFT: [
                    "CONFIRMED",
                    "CANCELLED",
                ],

                CONFIRMED: [
                    "PROCESSING",
                    "CANCELLED",
                ],

                PROCESSING: [
                    "READY_TO_DELIVER",
                ],

                READY_TO_DELIVER: [
                    "COMPLETED",
                ],

                COMPLETED: [],

                CANCELLED: [],
            };

            const currentStatus =
                salesOrder.status;

            if (
                !transitions[
                    currentStatus
                ]?.includes(status)
            ) {
                throw new Error(
                    `Cannot change sales order status from ${currentStatus} to ${status}.`
                );
            }

            // -----------------------------------------
            // Affected Stocks
            // -----------------------------------------

            let affectedStocks = [];

            // -----------------------------------------
            // DRAFT -> CONFIRMED
            // -----------------------------------------

            if (
                currentStatus ===
                    "DRAFT" &&
                status ===
                    "CONFIRMED"
            ) {
                console.log(
                    "Reserving stock for sales order:",
                    salesOrder.salesOrderNumber
                );

                affectedStocks =
                    await reserveSalesOrderStock(
                        salesOrder,
                        req.user._id,
                        session
                    );

                console.log(
                    "Stock reservation completed."
                );
            }

            // -----------------------------------------
            // CONFIRMED -> PROCESSING
            // -----------------------------------------

            if (
                currentStatus ===
                    "CONFIRMED" &&
                status ===
                    "PROCESSING"
            ) {
                console.log(
                    "Releasing reserved stock:"
                );

                await releaseSalesOrderStock(
                    salesOrder,
                    session
                );

                console.log(
                    "Reserved stock released."
                );

                console.log(
                    "Deducting physical stock:"
                );

                affectedStocks =
                    await deductSalesOrderStock(
                        salesOrder,
                        req.user._id,
                        session
                    );

                console.log(
                    "Physical stock deducted."
                );
            }

            // -----------------------------------------
            // CONFIRMED -> CANCELLED
            // -----------------------------------------

            if (
                currentStatus ===
                    "CONFIRMED" &&
                status ===
                    "CANCELLED"
            ) {
                if (
                    !cancellationReason ||
                    !String(
                        cancellationReason
                    ).trim()
                ) {
                    throw new Error(
                        "Cancellation reason is required."
                    );
                }

                console.log(
                    "Releasing reserved stock because order is cancelled:"
                );

                await releaseSalesOrderStock(
                    salesOrder,
                    session
                );

                console.log(
                    "Reserved stock released."
                );

                salesOrder.cancellationReason =
                    String(
                        cancellationReason
                    ).trim();

                salesOrder.cancelledAt =
                    new Date();

                salesOrder.cancelledBy =
                    req.user._id;
            }

            // -----------------------------------------
            // DRAFT -> CANCELLED
            // -----------------------------------------

            if (
                currentStatus ===
                    "DRAFT" &&
                status ===
                    "CANCELLED"
            ) {
                if (
                    !cancellationReason ||
                    !String(
                        cancellationReason
                    ).trim()
                ) {
                    throw new Error(
                        "Cancellation reason is required."
                    );
                }

                salesOrder.cancellationReason =
                    String(
                        cancellationReason
                    ).trim();

                salesOrder.cancelledAt =
                    new Date();

                salesOrder.cancelledBy =
                    req.user._id;
            }

            // -----------------------------------------
            // Update Status
            // -----------------------------------------

            salesOrder.status =
                status;

            salesOrder.updatedBy =
                req.user._id;

            await salesOrder.save({
                session,
            });

            // -----------------------------------------
            // Populate
            // -----------------------------------------

            await salesOrder.populate([
                {
                    path: "company",
                },
                {
                    path: "branch",
                },
                {
                    path: "customer",
                },
                {
                    path: "quotation",
                },
                {
                    path: "salesPerson",
                },
                {
                    path: "warehouse",
                },
                {
                    path: "items.product",
                },
                {
                    path: "createdBy",
                    select: "-password",
                },
                {
                    path: "updatedBy",
                    select: "-password",
                },
                {
                    path: "cancelledBy",
                    select: "-password",
                },
            ]);

            // -----------------------------------------
            // Commit
            // -----------------------------------------

            await session.commitTransaction();

            console.log(
                `Sales Order ${salesOrder.salesOrderNumber} status changed: ${currentStatus} -> ${status}`
            );

            // -----------------------------------------
            // Notification
            // -----------------------------------------

            await sendSalesOrderNotification({
                salesOrder,

                previousStatus:
                    currentStatus,

                recipient:
                    req.user._id,

                createdBy:
                    req.user._id,
            });

            // -----------------------------------------
            // Stock Notification
            // -----------------------------------------

            if (
                (
                    currentStatus ===
                        "DRAFT" &&
                    status ===
                        "CONFIRMED"
                ) ||
                (
                    currentStatus ===
                        "CONFIRMED" &&
                    status ===
                        "PROCESSING"
                )
            ) {
                await sendSalesOrderStockNotifications({
                    salesOrder,

                    stocks:
                        affectedStocks,

                    recipient:
                        req.user._id,

                    createdBy:
                        req.user._id,
                });
            }

            return res.status(200).json({
                success: true,

                message:
                    "Sales order status updated successfully.",

                salesOrder,
            });
        } catch (error) {
            console.error(
                "Update Sales Order Status Error:",
                error
            );

            if (
                session.inTransaction()
            ) {
                await session.abortTransaction();

                console.log(
                    "Sales Order Status Transaction Aborted"
                );
            }

            return res.status(400).json({
                success: false,

                message:
                    error.message ||
                    "Failed to update sales order status.",
            });
        } finally {
            await session.endSession();
        }
    };

// =====================================================
// DELETE SALES ORDER
// =====================================================

const deleteSalesOrder = async (
    req,
    res
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
                    "Invalid sales order ID.",
            });
        }

        const salesOrder =
            await SalesOrder.findById(
                id
            );

        if (!salesOrder) {
            return res.status(404).json({
                success: false,
                message:
                    "Sales order not found.",
            });
        }

        // ---------------------------------------------
        // Only DRAFT and CANCELLED
        // can be deleted
        // ---------------------------------------------

        if (
            ![
                "DRAFT",
                "CANCELLED",
            ].includes(
                salesOrder.status
            )
        ) {
            return res.status(400).json({
                success: false,

                message:
                    `Sales order cannot be deleted when status is ${salesOrder.status}.`,
            });
        }

        // ---------------------------------------------
        // Restore quotation link
        // ---------------------------------------------

        if (
            salesOrder.quotation
        ) {
            const quotation =
                await Quotation.findOne({
                    _id:
                        salesOrder.quotation,

                    convertedToSalesOrder:
                        salesOrder._id,
                });

            if (quotation) {
                quotation.convertedToSalesOrder =
                    null;

                quotation.updatedBy =
                    req.user._id;

                await quotation.save();
            }
        }

        await salesOrder.deleteOne();

        return res.status(200).json({
            success: true,

            message:
                "Sales order deleted successfully.",
        });
    } catch (error) {
        console.error(
            "Delete Sales Order Error:",
            error
        );

        return res.status(400).json({
            success: false,

            message:
                error.message ||
                "Failed to delete sales order.",
        });
    }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    createSalesOrder,

    getSalesOrders,

    getSalesOrderById,

    updateSalesOrder,

    updateSalesOrderStatus,

    deleteSalesOrder,
};