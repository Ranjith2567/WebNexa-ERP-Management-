// ==========================================
// MODELS
// ==========================================

const Company = require("../models/Company");
const Branch = require("../models/Branch");
const User = require("../models/User");
const Department = require("../models/Department");
const Designation = require("../models/Designation");
const Category = require("../models/Category");
const Brand = require("../models/Brand");
const Unit = require("../models/Unit");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const Customer = require("../models/Customer");

const PurchaseOrder = require("../models/PurchaseOrder");
const PurchaseInvoice = require("../models/PurchaseInvoice");
const PurchaseReturn = require("../models/PurchaseReturn");

const Quotation = require("../models/Quotation");
const SalesOrder = require("../models/SalesOrder");
const SalesInvoice = require("../models/SalesInvoice");
const SalesReturn = require("../models/SalesReturn");

const Expense = require("../models/Expense");
const ExpenseCategory = require("../models/ExpenseCategory");
const Account = require("../models/Account");

// ==========================================
// HELPERS
// ==========================================

const escapeRegex = (value) => {
    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
};

// ==========================================
// MODULE CONFIGURATION
// ==========================================

const MODULE_CONFIG = {
    companies: {
        model: Company,
        label: "Company",
        permission: "settings.view",

        fields: [
            "name",
            "legalName",
            "email",
            "phone",
            "gstNumber",
            "panNumber",
        ],

        select:
            "name legalName email phone gstNumber panNumber",
    },

    branches: {
        model: Branch,
        label: "Branch",
        permission: "settings.view",

        fields: [
            "name",
            "branchCode",
            "email",
            "phone",
        ],

        select:
            "name branchCode email phone",
    },

    users: {
        model: User,
        label: "User",
        permission: "users.view",

        fields: [
            "name",
            "email",
            "phone",
            "employeeId",
            "role",
        ],

        select:
            "name email phone employeeId designation department role",
    },

    departments: {
        model: Department,
        label: "Department",
        permission: "employees.view",

        fields: [
            "name",
            "code",
            "description",
        ],

        select:
            "name code description",
    },

    designations: {
        model: Designation,
        label: "Designation",
        permission: "employees.view",

        fields: [
            "name",
            "code",
            "description",
        ],

        select:
            "name code description level",
    },

    categories: {
        model: Category,
        label: "Category",
        permission: "inventory.view",

        fields: [
            "name",
            "code",
            "description",
        ],

        select:
            "name code description",
    },

    brands: {
        model: Brand,
        label: "Brand",
        permission: "inventory.view",

        fields: [
            "name",
            "code",
            "description",
            "website",
        ],

        select:
            "name code description website",
    },

    units: {
        model: Unit,
        label: "Unit",
        permission: "inventory.view",

        fields: [
            "name",
            "code",
            "symbol",
            "description",
        ],

        select:
            "name code symbol description",
    },

    products: {
        model: Product,
        label: "Product",
        permission: "inventory.view",

        fields: [
            "name",
            "sku",
            "barcode",
            "description",
        ],

        select:
            "name sku barcode description sellingPrice purchasePrice",
    },

    suppliers: {
        model: Supplier,
        label: "Supplier",
        permission: "purchase.view",

        fields: [
            "supplierCode",
            "name",
            "companyName",
            "email",
            "phone",
        ],

        select:
            "supplierCode name companyName email phone",
    },

    customers: {
        model: Customer,
        label: "Customer",
        permission: "sales.view",

        fields: [
            "customerCode",
            "name",
            "companyName",
            "email",
            "phone",
        ],

        select:
            "customerCode name companyName email phone",
    },

    purchaseOrders: {
        model: PurchaseOrder,
        label: "Purchase Order",
        permission: "purchase.view",

        fields: [
            "poNumber",
            "notes",
        ],

        select:
            "poNumber orderDate status totalAmount notes",
    },

    purchaseInvoices: {
        model: PurchaseInvoice,
        label: "Purchase Invoice",
        permission: "purchase.view",

        fields: [
            "invoiceNumber",
            "internalInvoiceNumber",
        ],

        select:
            "invoiceNumber internalInvoiceNumber invoiceDate status totalAmount",
    },

    purchaseReturns: {
        model: PurchaseReturn,
        label: "Purchase Return",
        permission: "purchase.view",

        fields: [
            "returnNumber",
            "creditNoteNumber",
            "reason",
            "notes",
        ],

        select:
            "returnNumber creditNoteNumber returnDate status totalAmount reason notes supplier purchaseOrder purchaseInvoice",
    },

    quotations: {
        model: Quotation,
        label: "Quotation",
        permission: "sales.view",

        fields: [
            "quotationNumber",
            "notes",
        ],

        select:
            "quotationNumber quotationDate status totalAmount notes",
    },

    salesOrders: {
        model: SalesOrder,
        label: "Sales Order",
        permission: "sales.view",

        fields: [
            "orderNumber",
            "salesOrderNumber",
            "notes",
        ],

        select:
            "orderNumber salesOrderNumber orderDate status totalAmount notes customer quotation",
    },

    salesInvoices: {
        model: SalesInvoice,
        label: "Sales Invoice",
        permission: "sales.view",

        fields: [
            "invoiceNumber",
            "internalInvoiceNumber",
        ],

        select:
            "invoiceNumber internalInvoiceNumber invoiceDate status totalAmount",
    },

    salesReturns: {
        model: SalesReturn,
        label: "Sales Return",
        permission: "sales.view",

        fields: [
            "returnNumber",
            "creditNoteNumber",
            "reason",
            "notes",
        ],

        select:
            "returnNumber creditNoteNumber returnDate status totalAmount reason notes",
    },

    expenses: {
        model: Expense,
        label: "Expense",
        permission: "reports.view",

        fields: [
            "expenseNumber",
            "description",
            "notes",
        ],

        select:
            "expenseNumber expenseDate amount paymentMethod description notes",
    },

    expenseCategories: {
        model: ExpenseCategory,
        label: "Expense Category",
        permission: "reports.view",

        fields: [
            "name",
            "code",
            "description",
        ],

        select:
            "name code description",
    },

    accounts: {
        model: Account,
        label: "Account",
        permission: "reports.view",

        fields: [
            "accountCode",
            "accountName",
            "description",
        ],

        select:
            "accountCode accountName description",
    },
};

// ==========================================
// TYPE ALIASES
// ==========================================

const TYPE_ALIASES = {
    company: "companies",
    companies: "companies",

    branch: "branches",
    branches: "branches",

    user: "users",
    users: "users",

    employee: "users",
    employees: "users",

    department: "departments",
    departments: "departments",

    designation: "designations",
    designations: "designations",

    category: "categories",
    categories: "categories",

    brand: "brands",
    brands: "brands",

    unit: "units",
    units: "units",

    product: "products",
    products: "products",

    supplier: "suppliers",
    suppliers: "suppliers",

    customer: "customers",
    customers: "customers",

    purchaseorder: "purchaseOrders",
    purchaseorders: "purchaseOrders",

    purchaseinvoice: "purchaseInvoices",
    purchaseinvoices: "purchaseInvoices",

    purchasereturn: "purchaseReturns",
    purchasereturns: "purchaseReturns",

    quotation: "quotations",
    quotations: "quotations",

    salesorder: "salesOrders",
    salesorders: "salesOrders",

    salesinvoice: "salesInvoices",
    salesinvoices: "salesInvoices",

    salesreturn: "salesReturns",
    salesreturns: "salesReturns",

    expense: "expenses",
    expenses: "expenses",

    expensecategory: "expenseCategories",
    expensecategories: "expenseCategories",

    account: "accounts",
    accounts: "accounts",
};

// ==========================================
// PERMISSION CHECK
// ==========================================

const hasPermission = (
    user,
    permission
) => {
    if (!user) {
        return false;
    }

    if (
        user.role === "SUPER_ADMIN"
    ) {
        return true;
    }

    const permissions =
        Array.isArray(
            user.permissions
        )
            ? user.permissions
            : [];

    return permissions.includes(
        permission
    );
};

// ==========================================
// BUILD SEARCH FILTER
// ==========================================

const buildSearchFilter = (
    fields,
    regex
) => {
    return {
        $or: fields.map(
            (field) => ({
                [field]: regex,
            })
        ),
    };
};

// ==========================================
// SCORE RESULT
// ==========================================

const calculateScore = (
    item,
    fields,
    searchText
) => {
    const query =
        searchText
            .toLowerCase()
            .trim();

    let highestScore = 0;
    let matchedField = null;

    for (
        const field
        of fields
    ) {
        const value =
            item[field];

        if (
            value === null ||
            value === undefined
        ) {
            continue;
        }

        const text =
            String(value)
                .toLowerCase()
                .trim();

        if (!text) {
            continue;
        }

        let score = 0;

        if (
            text === query
        ) {
            score = 100;
        } else if (
            text.startsWith(query)
        ) {
            score = 80;
        } else if (
            text.includes(query)
        ) {
            score = 60;
        }

        if (
            score >
            highestScore
        ) {
            highestScore =
                score;

            matchedField =
                field;
        }
    }

    return {
        score:
            highestScore,

        matchedField:
            matchedField,
    };
};

// ==========================================
// FORMAT RESULT
// ==========================================

const formatResult = (
    moduleName,
    config,
    item,
    searchText
) => {
    const scoring =
        calculateScore(
            item,
            config.fields,
            searchText
        );

    const title =
        item.name ||
        item.poNumber ||
        item.invoiceNumber ||
        item.returnNumber ||
        item.quotationNumber ||
        item.orderNumber ||
        item.salesOrderNumber ||
        item.expenseNumber ||
        item.accountName ||
        item.customerCode ||
        item.supplierCode ||
        item.employeeId ||
        item.accountCode ||
        item.code ||
        item.sku ||
        moduleName;

    const subtitle =
        item.email ||
        item.phone ||
        item.sku ||
        item.barcode ||
        item.code ||
        item.poNumber ||
        item.invoiceNumber ||
        item.returnNumber ||
        item.quotationNumber ||
        item.orderNumber ||
        item.salesOrderNumber ||
        item.accountCode ||
        item.customerCode ||
        item.supplierCode ||
        "";

    return {
        id:
            item._id,

        type:
            moduleName,

        typeLabel:
            config.label,

        title,

        subtitle,

        matchedField:
            scoring.matchedField,

        score:
            scoring.score,

        data:
            item,
    };
};

// ==========================================
// TRACK RELATIONSHIP RESULT
// ==========================================

const trackRelationshipResult = (
    relationshipResultIds,
    moduleName,
    item
) => {
    if (
        !relationshipResultIds[
            moduleName
        ]
    ) {
        relationshipResultIds[
            moduleName
        ] = new Set();
    }

    relationshipResultIds[
        moduleName
    ].add(
        String(item._id)
    );
};

// ==========================================
// ADD RELATIONSHIP RESULT
// ==========================================

const addRelationshipResult = ({
    allResults,
    relationshipResultIds,
    moduleName,
    config,
    item,
    searchText,
    relationshipMatch,
    minimumScore = 45,
}) => {
    const formatted =
        formatResult(
            moduleName,
            config,
            item,
            searchText
        );

    formatted.relationshipMatch =
        relationshipMatch;

    formatted.score =
        Math.max(
            Number(
                formatted.score || 0
            ),
            minimumScore
        );

    trackRelationshipResult(
        relationshipResultIds,
        moduleName,
        item
    );

    allResults.push(
        formatted
    );
};

// ==========================================
// GLOBAL SEARCH
// ==========================================

const globalSearch = async (
    req,
    res,
    next
) => {
    try {
        // ======================================
        // QUERY VALIDATION
        // ======================================

        const rawQuery =
            req.query.q;

        if (
            rawQuery ===
                undefined ||
            rawQuery === null
        ) {
            return res
                .status(400)
                .json({
                    success:
                        false,

                    message:
                        "Search query is required",
                });
        }

        const searchText =
            String(
                rawQuery
            ).trim();

        if (!searchText) {
            return res
                .status(400)
                .json({
                    success:
                        false,

                    message:
                        "Search query cannot be empty",
                });
        }

        if (
            searchText.length <
            2
        ) {
            return res
                .status(400)
                .json({
                    success:
                        false,

                    message:
                        "Search query must contain at least 2 characters",
                });
        }

        if (
            searchText.length >
            100
        ) {
            return res
                .status(400)
                .json({
                    success:
                        false,

                    message:
                        "Search query cannot exceed 100 characters",
                });
        }

        // ======================================
        // PAGINATION VALIDATION
        // ======================================

        const rawPage =
            req.query.page;

        const rawLimit =
            req.query.limit;

        let page = 1;
        let limit = 10;

        if (
            rawPage !==
            undefined
        ) {
            const pageValue =
                Number(
                    rawPage
                );

            if (
                !Number.isInteger(
                    pageValue
                ) ||
                pageValue < 1
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Page must be a positive integer",
                    });
            }

            page =
                pageValue;
        }

        if (
            rawLimit !==
            undefined
        ) {
            const limitValue =
                Number(
                    rawLimit
                );

            if (
                !Number.isInteger(
                    limitValue
                ) ||
                limitValue < 1
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Limit must be a positive integer",
                    });
            }

            if (
                limitValue >
                50
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Limit cannot exceed 50",

                        maxLimit:
                            50,
                    });
            }

            limit =
                limitValue;
        }

        const skip =
            (page - 1) *
            limit;

        // ======================================
        // TYPE FILTER
        // ======================================

        let requestedType =
            req.query.type;

        let selectedModules =
            Object.keys(
                MODULE_CONFIG
            );

        if (
            requestedType
        ) {
            requestedType =
                String(
                    requestedType
                )
                    .trim()
                    .toLowerCase();

            const normalizedType =
                TYPE_ALIASES[
                    requestedType
                ];

            if (
                !normalizedType
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Invalid search type",

                        availableTypes:
                            Object.keys(
                                MODULE_CONFIG
                            ),
                    });
            }

            selectedModules = [
                normalizedType,
            ];
        }

        // ======================================
        // SAFE REGEX
        // ======================================

        const escapedQuery =
            escapeRegex(
                searchText
            );

        const regex =
            new RegExp(
                escapedQuery,
                "i"
            );

        // ======================================
        // PERMISSION-AWARE MODULE FILTER
        // ======================================

        selectedModules =
            selectedModules.filter(
                (
                    moduleName
                ) => {
                    const config =
                        MODULE_CONFIG[
                            moduleName
                        ];

                    return hasPermission(
                        req.user,
                        config.permission
                    );
                }
            );

        // ======================================
        // CANDIDATE LIMIT
        // ======================================

        const candidateLimit =
            Math.min(
                Math.max(
                    limit * 5,
                    50
                ),
                200
            );

        // ======================================
        // DIRECT MODULE SEARCH
        // ======================================

        const moduleSearchPromises =
            selectedModules.map(
                async (
                    moduleName
                ) => {
                    const config =
                        MODULE_CONFIG[
                            moduleName
                        ];

                    const filter =
                        buildSearchFilter(
                            config.fields,
                            regex
                        );

                    const [
                        items,
                        totalResults,
                    ] =
                        await Promise.all([
                            config.model
                                .find(
                                    filter
                                )
                                .select(
                                    config.select
                                )
                                .limit(
                                    candidateLimit
                                )
                                .lean(),

                            config.model
                                .countDocuments(
                                    filter
                                ),
                        ]);

                    return {
                        moduleName,
                        config,
                        items,
                        totalResults,
                    };
                }
            );

        const moduleSearchResults =
            await Promise.all(
                moduleSearchPromises
            );

        // ======================================
        // MODULE TOTAL COUNTS
        // ======================================

        const moduleTotalCounts =
            {};

        for (
            const moduleResult
            of moduleSearchResults
        ) {
            moduleTotalCounts[
                moduleResult.moduleName
            ] =
                moduleResult.totalResults;
        }

        // ======================================
        // RESULTS
        // ======================================

        let allResults = [];

        // ======================================
        // RELATIONSHIP RESULT COUNTS
        // ======================================

        const relationshipResultIds =
            {};

        // ======================================
        // DIRECT SEARCH RESULTS
        // ======================================

        for (
            const moduleResult
            of moduleSearchResults
        ) {
            const {
                moduleName,
                config,
                items,
            } =
                moduleResult;

            for (
                const item
                of items
            ) {
                allResults.push(
                    formatResult(
                        moduleName,
                        config,
                        item,
                        searchText
                    )
                );
            }
        }

        // ======================================
        // RELATIONSHIP SEARCH
        // ======================================

        // ======================================
        // USER -> DEPARTMENT
        // ======================================

        if (
            hasPermission(
                req.user,
                "users.view"
            ) &&
            hasPermission(
                req.user,
                "employees.view"
            )
        ) {
            const matchingDepartments =
                await Department.find({
                    $or: [
                        {
                            name:
                                regex,
                        },
                        {
                            code:
                                regex,
                        },
                        {
                            description:
                                regex,
                        },
                    ],
                })
                    .select(
                        "_id name code"
                    )
                    .limit(50)
                    .lean();

            if (
                matchingDepartments.length
            ) {
                const departmentIds =
                    matchingDepartments.map(
                        (
                            department
                        ) =>
                            department._id
                    );

                const relatedUsers =
                    await User.find({
                        department: {
                            $in:
                                departmentIds,
                        },
                    })
                        .select(
                            "name email phone employeeId designation department role"
                        )
                        .limit(
                            candidateLimit
                        )
                        .lean();

                for (
                    const item
                    of relatedUsers
                ) {
                    addRelationshipResult({
                        allResults,
                        relationshipResultIds,

                        moduleName:
                            "users",

                        config:
                            MODULE_CONFIG
                                .users,

                        item,

                        searchText,

                        relationshipMatch:
                            "department",

                        minimumScore:
                            45,
                    });
                }
            }
        }

        // ======================================
        // USER -> DESIGNATION
        // ======================================

        if (
            hasPermission(
                req.user,
                "users.view"
            ) &&
            hasPermission(
                req.user,
                "employees.view"
            )
        ) {
            const matchingDesignations =
                await Designation.find({
                    $or: [
                        {
                            name:
                                regex,
                        },
                        {
                            code:
                                regex,
                        },
                        {
                            description:
                                regex,
                        },
                    ],
                })
                    .select(
                        "_id name code"
                    )
                    .limit(50)
                    .lean();

            if (
                matchingDesignations.length
            ) {
                const designationIds =
                    matchingDesignations.map(
                        (
                            designation
                        ) =>
                            designation._id
                    );

                const relatedUsers =
                    await User.find({
                        designation: {
                            $in:
                                designationIds,
                        },
                    })
                        .select(
                            "name email phone employeeId designation department role"
                        )
                        .limit(
                            candidateLimit
                        )
                        .lean();

                for (
                    const item
                    of relatedUsers
                ) {
                    addRelationshipResult({
                        allResults,
                        relationshipResultIds,

                        moduleName:
                            "users",

                        config:
                            MODULE_CONFIG
                                .users,

                        item,

                        searchText,

                        relationshipMatch:
                            "designation",

                        minimumScore:
                            45,
                    });
                }
            }
        }

        // ======================================
        // SUPPLIER -> PURCHASE RETURNS
        // ======================================

        if (
            hasPermission(
                req.user,
                "purchase.view"
            )
        ) {
            const matchingSuppliers =
                await Supplier.find({
                    $or: [
                        {
                            name:
                                regex,
                        },
                        {
                            supplierCode:
                                regex,
                        },
                        {
                            companyName:
                                regex,
                        },
                    ],
                })
                    .select(
                        "_id name supplierCode"
                    )
                    .limit(50)
                    .lean();

            if (
                matchingSuppliers.length
            ) {
                const supplierIds =
                    matchingSuppliers.map(
                        (
                            supplier
                        ) =>
                            supplier._id
                    );

                const relatedReturns =
                    await PurchaseReturn.find({
                        supplier: {
                            $in:
                                supplierIds,
                        },
                    })
                        .select(
                            "returnNumber creditNoteNumber returnDate status totalAmount reason notes supplier purchaseOrder purchaseInvoice"
                        )
                        .limit(
                            candidateLimit
                        )
                        .lean();

                for (
                    const item
                    of relatedReturns
                ) {
                    addRelationshipResult({
                        allResults,
                        relationshipResultIds,

                        moduleName:
                            "purchaseReturns",

                        config:
                            MODULE_CONFIG
                                .purchaseReturns,

                        item,

                        searchText,

                        relationshipMatch:
                            "supplier",

                        minimumScore:
                            45,
                    });
                }
            }
        }

        // ======================================
        // PURCHASE ORDER -> PURCHASE RETURNS
        // ======================================

        if (
            hasPermission(
                req.user,
                "purchase.view"
            )
        ) {
            const matchingPurchaseOrders =
                await PurchaseOrder.find({
                    poNumber:
                        regex,
                })
                    .select(
                        "_id poNumber"
                    )
                    .limit(50)
                    .lean();

            if (
                matchingPurchaseOrders.length
            ) {
                const purchaseOrderIds =
                    matchingPurchaseOrders.map(
                        (
                            po
                        ) =>
                            po._id
                    );

                const relatedReturns =
                    await PurchaseReturn.find({
                        purchaseOrder: {
                            $in:
                                purchaseOrderIds,
                        },
                    })
                        .select(
                            "returnNumber creditNoteNumber returnDate status totalAmount reason notes supplier purchaseOrder purchaseInvoice"
                        )
                        .limit(
                            candidateLimit
                        )
                        .lean();

                for (
                    const item
                    of relatedReturns
                ) {
                    addRelationshipResult({
                        allResults,
                        relationshipResultIds,

                        moduleName:
                            "purchaseReturns",

                        config:
                            MODULE_CONFIG
                                .purchaseReturns,

                        item,

                        searchText,

                        relationshipMatch:
                            "purchaseOrder",

                        minimumScore:
                            45,
                    });
                }
            }
        }

        // ======================================
        // PURCHASE INVOICE -> PURCHASE RETURNS
        // ======================================

        if (
            hasPermission(
                req.user,
                "purchase.view"
            )
        ) {
            const matchingPurchaseInvoices =
                await PurchaseInvoice.find({
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
                })
                    .select(
                        "_id invoiceNumber internalInvoiceNumber"
                    )
                    .limit(50)
                    .lean();

            if (
                matchingPurchaseInvoices.length
            ) {
                const purchaseInvoiceIds =
                    matchingPurchaseInvoices.map(
                        (
                            invoice
                        ) =>
                            invoice._id
                    );

                const relatedReturns =
                    await PurchaseReturn.find({
                        purchaseInvoice: {
                            $in:
                                purchaseInvoiceIds,
                        },
                    })
                        .select(
                            "returnNumber creditNoteNumber returnDate status totalAmount reason notes supplier purchaseOrder purchaseInvoice"
                        )
                        .limit(
                            candidateLimit
                        )
                        .lean();

                for (
                    const item
                    of relatedReturns
                ) {
                    addRelationshipResult({
                        allResults,
                        relationshipResultIds,

                        moduleName:
                            "purchaseReturns",

                        config:
                            MODULE_CONFIG
                                .purchaseReturns,

                        item,

                        searchText,

                        relationshipMatch:
                            "purchaseInvoice",

                        minimumScore:
                            45,
                    });
                }
            }
        }

        // ======================================
        // CUSTOMER -> SALES ORDERS
        // ======================================

        if (
            hasPermission(
                req.user,
                "sales.view"
            )
        ) {
            const matchingCustomers =
                await Customer.find({
                    $or: [
                        {
                            name:
                                regex,
                        },
                        {
                            customerCode:
                                regex,
                        },
                        {
                            companyName:
                                regex,
                        },
                    ],
                })
                    .select(
                        "_id name customerCode"
                    )
                    .limit(50)
                    .lean();

            if (
                matchingCustomers.length
            ) {
                const customerIds =
                    matchingCustomers.map(
                        (
                            customer
                        ) =>
                            customer._id
                    );

                const relatedOrders =
                    await SalesOrder.find({
                        customer: {
                            $in:
                                customerIds,
                        },
                    })
                        .select(
                            "orderNumber salesOrderNumber orderDate status totalAmount notes customer quotation"
                        )
                        .limit(
                            candidateLimit
                        )
                        .lean();

                for (
                    const item
                    of relatedOrders
                ) {
                    addRelationshipResult({
                        allResults,
                        relationshipResultIds,

                        moduleName:
                            "salesOrders",

                        config:
                            MODULE_CONFIG
                                .salesOrders,

                        item,

                        searchText,

                        relationshipMatch:
                            "customer",

                        minimumScore:
                            45,
                    });
                }
            }
        }

        // ======================================
        // QUOTATION -> SALES ORDERS
        // ======================================

        if (
            hasPermission(
                req.user,
                "sales.view"
            )
        ) {
            const matchingQuotations =
                await Quotation.find({
                    quotationNumber:
                        regex,
                })
                    .select(
                        "_id quotationNumber"
                    )
                    .limit(50)
                    .lean();

            if (
                matchingQuotations.length
            ) {
                const quotationIds =
                    matchingQuotations.map(
                        (
                            quotation
                        ) =>
                            quotation._id
                    );

                const relatedOrders =
                    await SalesOrder.find({
                        quotation: {
                            $in:
                                quotationIds,
                        },
                    })
                        .select(
                            "orderNumber salesOrderNumber orderDate status totalAmount notes customer quotation"
                        )
                        .limit(
                            candidateLimit
                        )
                        .lean();

                for (
                    const item
                    of relatedOrders
                ) {
                    addRelationshipResult({
                        allResults,
                        relationshipResultIds,

                        moduleName:
                            "salesOrders",

                        config:
                            MODULE_CONFIG
                                .salesOrders,

                        item,

                        searchText,

                        relationshipMatch:
                            "quotation",

                        minimumScore:
                            45,
                    });
                }
            }
        }

        // ======================================
        // REMOVE DUPLICATES
        // ======================================

        const uniqueResults =
            new Map();

        for (
            const result
            of allResults
        ) {
            const key =
                `${result.type}:${String(
                    result.id
                )}`;

            const existing =
                uniqueResults.get(
                    key
                );

            if (
                !existing ||
                result.score >
                    existing.score
            ) {
                uniqueResults.set(
                    key,
                    result
                );
            }
        }

        allResults =
            Array.from(
                uniqueResults.values()
            );
// ======================================
// ADVANCED SORTING
// ======================================

const requestedSort =
    req.query.sort
        ? String(req.query.sort)
              .trim()
              .toLowerCase()
        : "relevance";

const allowedSorts = [
    "relevance",
    "title",
];

if (
    !allowedSorts.includes(
        requestedSort
    )
) {
    return res.status(400).json({
        success: false,
        message: "Invalid sort option",
        availableSorts:
            allowedSorts,
    });
}

allResults.sort(
    (a, b) => {
        if (
            requestedSort ===
            "title"
        ) {
            return String(
                a.title || ""
            ).localeCompare(
                String(
                    b.title || ""
                )
            );
        }

        // Default: relevance
        if (
            b.score !==
            a.score
        ) {
            return (
                b.score -
                a.score
            );
        }

        return String(
            a.title || ""
        ).localeCompare(
            String(
                b.title || ""
            )
        );
    }
); 
        // ======================================
        // FINAL GROUPED RESULTS
        // ======================================

        const finalGroupedResults =
            {};

        for (
            const moduleName
            of Object.keys(
                MODULE_CONFIG
            )
        ) {
            finalGroupedResults[
                moduleName
            ] = [];
        }

        for (
            const result
            of allResults
        ) {
            if (
                finalGroupedResults[
                    result.type
                ]
            ) {
                finalGroupedResults[
                    result.type
                ].push(result);
            }
        }

        // ======================================
        // FINAL MODULE PAGINATION
        // ======================================

        const finalModulePagination =
            {};

        for (
            const moduleName
            of Object.keys(
                MODULE_CONFIG
            )
        ) {
            const moduleResults =
                finalGroupedResults[
                    moduleName
                ] || [];

            const directCount =
                moduleTotalCounts[
                    moduleName
                ];

            const relationshipIds =
                relationshipResultIds[
                    moduleName
                ]
                    ? Array.from(
                          relationshipResultIds[
                              moduleName
                          ]
                      )
                    : [];

            const relationshipCount =
                relationshipIds.length;

            let overlapCount = 0;

            // ==================================
            // REMOVE DIRECT / RELATIONSHIP
            // DUPLICATE COUNTS
            // ==================================

            if (
                directCount !==
                    undefined &&
                relationshipCount >
                    0
            ) {
                const config =
                    MODULE_CONFIG[
                        moduleName
                    ];

                const directFilter =
                    buildSearchFilter(
                        config.fields,
                        regex
                    );

                overlapCount =
                    await config.model.countDocuments(
                        {
                            $and: [
                                {
                                    _id: {
                                        $in:
                                            relationshipIds,
                                    },
                                },
                                directFilter,
                            ],
                        }
                    );
            }

            const totalResults =
                directCount !==
                    undefined
                    ? directCount +
                      relationshipCount -
                      overlapCount
                    : relationshipCount;

            finalModulePagination[
                moduleName
            ] = {
                totalResults,

                totalPages:
                    totalResults === 0
                        ? 0
                        : Math.ceil(
                              totalResults /
                                  limit
                          ),

                returnedResults:
                    moduleResults.length,
            };
        }

        // ======================================
        // GLOBAL PAGINATION
        // ======================================

        const totalResults =
            allResults.length;

        const totalPages =
            totalResults === 0
                ? 0
                : Math.ceil(
                      totalResults /
                          limit
                  );

        const paginatedResults =
            allResults.slice(
                skip,
                skip + limit
            );

        const returnedResults =
            paginatedResults.length;

        // ======================================
        // RESPONSE
        // ======================================

        return res
            .status(200)
            .json({
                success:
                    true,

                message:
                    "Global search completed successfully",

                data: {
                    query:
                        searchText,

                    filter: {
                        type:
                            requestedType ||
                            "all",
                    },

                    pagination: {
                        page,

                        limit,

                        skip,

                        totalResults,

                        returnedResults,

                        totalPages,
                    },

                    results:
                        paginatedResults,

                    groupedResults:
                        finalGroupedResults,

                    modulePagination:
                        finalModulePagination,
                },
            });
    } catch (error) {
        console.error(
            "Global Search Error:",
            error
        );

        next(error);
    }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
    globalSearch,
};