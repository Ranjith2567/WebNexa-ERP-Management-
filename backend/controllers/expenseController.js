const mongoose = require("mongoose");

const Expense = require("../models/Expense");
const Company = require("../models/Company");
const Branch = require("../models/Branch");
const ExpenseCategory = require("../models/ExpenseCategory");
const Supplier = require("../models/Supplier");

// ======================================================
// GENERATE EXPENSE NUMBER
// ======================================================

const generateExpenseNumber = async (company, branch) => {
    const lastExpense = await Expense.findOne({
        company,
        branch,
    })
        .sort({
            createdAt: -1,
        })
        .select("expenseNumber");

    if (!lastExpense) {
        return "EXP-000001";
    }

    const lastNumber = parseInt(
        lastExpense.expenseNumber.replace("EXP-", ""),
        10
    );

    const nextNumber = lastNumber + 1;

    return `EXP-${String(nextNumber).padStart(6, "0")}`;
};

// ======================================================
// CREATE EXPENSE
// ======================================================

const createExpense = async (req, res) => {
    try {
        const {
            company,
            branch,
            category,
            expenseDate,
            amount,
            paymentMethod,
            paidFrom,
            supplier,
            description,
            referenceNumber,
            status,
            notes,
        } = req.body;

        const createdBy = req.user._id;

        // ------------------------------------------
        // Required fields
        // ------------------------------------------

        if (
            !company ||
            !branch ||
            !category ||
            !expenseDate ||
            amount === undefined ||
            amount === null ||
            !paymentMethod
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Company, branch, category, expense date, amount and payment method are required.",
            });
        }

        // ------------------------------------------
        // Validate ObjectIds
        // ------------------------------------------

        if (
            !mongoose.Types.ObjectId.isValid(company) ||
            !mongoose.Types.ObjectId.isValid(branch) ||
            !mongoose.Types.ObjectId.isValid(category)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid company, branch or category ID.",
            });
        }

        // ------------------------------------------
        // Validate amount
        // ------------------------------------------

        if (Number.isNaN(Number(amount))) {
            return res.status(400).json({
                success: false,
                message: "Amount must be a valid number.",
            });
        }

        if (Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Expense amount must be greater than zero.",
            });
        }

        // ------------------------------------------
        // Validate date
        // ------------------------------------------

        const parsedDate = new Date(expenseDate);

        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid expense date.",
            });
        }

        // ------------------------------------------
        // Validate company
        // ------------------------------------------

        const companyData = await Company.findOne({
            _id: company,
            isActive: true,
        });

        if (!companyData) {
            return res.status(404).json({
                success: false,
                message: "Active company not found.",
            });
        }

        // ------------------------------------------
        // Validate branch
        // ------------------------------------------

        const branchData = await Branch.findOne({
            _id: branch,
            company,
            isActive: true,
        });

        if (!branchData) {
            return res.status(404).json({
                success: false,
                message:
                    "Active branch not found for this company.",
            });
        }

        // ------------------------------------------
        // Validate category
        // ------------------------------------------

        const categoryData =
            await ExpenseCategory.findOne({
                _id: category,
                company,
                branch,
                isActive: true,
            });

        if (!categoryData) {
            return res.status(404).json({
                success: false,
                message:
                    "Active expense category not found for this branch.",
            });
        }

        // ------------------------------------------
        // Validate supplier
        // ------------------------------------------

        let supplierData = null;

        if (supplier) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    supplier
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid supplier ID.",
                });
            }

            supplierData = await Supplier.findOne({
                _id: supplier,
                company,
                branch,
                isActive: true,
            });

            if (!supplierData) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Active supplier not found for this branch.",
                });
            }
        }

        // ------------------------------------------
        // Validate payment method
        // ------------------------------------------

        const validPaymentMethods = [
            "CASH",
            "BANK_TRANSFER",
            "UPI",
            "CARD",
            "CHEQUE",
            "OTHER",
        ];

        if (
            !validPaymentMethods.includes(
                paymentMethod
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment method.",
            });
        }

        // ------------------------------------------
        // Validate status
        // ------------------------------------------

        const validStatuses = [
            "DRAFT",
            "PENDING",
            "APPROVED",
            "REJECTED",
            "PAID",
            "CANCELLED",
        ];

        const expenseStatus =
            status || "DRAFT";

        if (
            !validStatuses.includes(
                expenseStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid expense status.",
            });
        }

        // ------------------------------------------
        // Generate expense number
        // ------------------------------------------

        const expenseNumber =
            await generateExpenseNumber(
                company,
                branch
            );

        // ------------------------------------------
        // Create expense
        // ------------------------------------------

        const expense =
            await Expense.create({
                company,
                branch,
                expenseNumber,
                category,
                expenseDate: parsedDate,
                amount: Number(amount),
                paymentMethod,
                paidFrom: paidFrom
                    ? paidFrom.trim()
                    : "",
                supplier:
                    supplier || null,
                description: description
                    ? description.trim()
                    : "",
                referenceNumber:
                    referenceNumber
                        ? referenceNumber.trim()
                        : "",
                status: expenseStatus,
                notes: notes
                    ? notes.trim()
                    : "",
                createdBy,
                updatedBy: createdBy,
            });

        // ------------------------------------------
        // Populate response
        // ------------------------------------------

        const populatedExpense =
            await Expense.findById(
                expense._id
            )
                .populate(
                    "company",
                    "name legalName email phone"
                )
                .populate(
                    "branch",
                    "name branchCode email"
                )
                .populate(
                    "category",
                    "name code description"
                )
                .populate(
                    "supplier",
                    "name email phone"
                )
                .populate(
                    "createdBy",
                    "name email role"
                )
                .populate(
                    "updatedBy",
                    "name email role"
                )
                .populate(
                    "approvedBy",
                    "name email role"
                )
                .populate(
                    "paidBy",
                    "name email role"
                );

        return res.status(201).json({
            success: true,
            message:
                "Expense created successfully.",
            data: populatedExpense,
        });
    } catch (error) {
        console.error(
            "Create Expense Error:",
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Expense number already exists. Please try again.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to create expense.",
        });
    }
};

// ======================================================
// GET ALL EXPENSES
// ======================================================

const getExpenses = async (req, res) => {
    try {
        const {
            company,
            branch,
            category,
            supplier,
            status,
            paymentMethod,
            search,
            fromDate,
            toDate,
            page = 1,
            limit = 10,
        } = req.query;

        const filter = {};

        // ------------------------------------------
        // Company
        // ------------------------------------------

        if (company) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    company
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid company ID.",
                });
            }

            filter.company = company;
        }

        // ------------------------------------------
        // Branch
        // ------------------------------------------

        if (branch) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    branch
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid branch ID.",
                });
            }

            filter.branch = branch;
        }

        // ------------------------------------------
        // Category
        // ------------------------------------------

        if (category) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    category
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid category ID.",
                });
            }

            filter.category = category;
        }

        // ------------------------------------------
        // Supplier
        // ------------------------------------------

        if (supplier) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    supplier
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid supplier ID.",
                });
            }

            filter.supplier = supplier;
        }

        // ------------------------------------------
        // Status
        // ------------------------------------------

        if (status) {
            const validStatuses = [
                "DRAFT",
                "PENDING",
                "APPROVED",
                "REJECTED",
                "PAID",
                "CANCELLED",
            ];

            if (
                !validStatuses.includes(
                    status
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid expense status.",
                });
            }

            filter.status = status;
        }

        // ------------------------------------------
        // Payment method
        // ------------------------------------------

        if (paymentMethod) {
            const validPaymentMethods = [
                "CASH",
                "BANK_TRANSFER",
                "UPI",
                "CARD",
                "CHEQUE",
                "OTHER",
            ];

            if (
                !validPaymentMethods.includes(
                    paymentMethod
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid payment method.",
                });
            }

            filter.paymentMethod =
                paymentMethod;
        }

        // ------------------------------------------
        // Search
        // ------------------------------------------

        if (search && search.trim()) {
            filter.$or = [
                {
                    expenseNumber: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
                {
                    description: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
                {
                    referenceNumber: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
                {
                    paidFrom: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
            ];
        }

        // ------------------------------------------
        // Date filters
        // ------------------------------------------

        if (fromDate || toDate) {
            filter.expenseDate = {};

            if (fromDate) {
                const startDate =
                    new Date(fromDate);

                if (
                    Number.isNaN(
                        startDate.getTime()
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid fromDate.",
                    });
                }

                filter.expenseDate.$gte =
                    startDate;
            }

            if (toDate) {
                const endDate =
                    new Date(toDate);

                if (
                    Number.isNaN(
                        endDate.getTime()
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid toDate.",
                    });
                }

                endDate.setHours(
                    23,
                    59,
                    59,
                    999
                );

                filter.expenseDate.$lte =
                    endDate;
            }
        }

        // ------------------------------------------
        // Pagination
        // ------------------------------------------

        const currentPage = Math.max(
            Number(page) || 1,
            1
        );

        const perPage = Math.min(
            Math.max(
                Number(limit) || 10,
                1
            ),
            100
        );

        const skip =
            (currentPage - 1) * perPage;

        const [
            expenses,
            total,
        ] = await Promise.all([
            Expense.find(filter)
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "branch",
                    "name branchCode"
                )
                .populate(
                    "category",
                    "name code"
                )
                .populate(
                    "supplier",
                    "name email phone"
                )
                .populate(
                    "approvedBy",
                    "name email role"
                )
                .populate(
                    "paidBy",
                    "name email role"
                )
                .populate(
                    "createdBy",
                    "name email role"
                )
                .populate(
                    "updatedBy",
                    "name email role"
                )
                .sort({
                    expenseDate: -1,
                    createdAt: -1,
                })
                .skip(skip)
                .limit(perPage),

            Expense.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(
            total / perPage
        );

        return res.status(200).json({
            success: true,
            data: expenses,
            pagination: {
                currentPage,
                perPage,
                totalItems: total,
                totalPages,
                hasNextPage:
                    currentPage < totalPages,
                hasPreviousPage:
                    currentPage > 1,
            },
        });
    } catch (error) {
        console.error(
            "Get Expenses Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch expenses.",
        });
    }
};

// ======================================================
// GET SINGLE EXPENSE
// ======================================================

const getExpenseById = async (
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
                    "Invalid expense ID.",
            });
        }

        const expense =
            await Expense.findById(id)
                .populate(
                    "company",
                    "name legalName email phone"
                )
                .populate(
                    "branch",
                    "name branchCode email"
                )
                .populate(
                    "category",
                    "name code description"
                )
                .populate(
                    "supplier",
                    "name email phone"
                )
                .populate(
                    "approvedBy",
                    "name email role"
                )
                .populate(
                    "paidBy",
                    "name email role"
                )
                .populate(
                    "createdBy",
                    "name email role"
                )
                .populate(
                    "updatedBy",
                    "name email role"
                );

        if (!expense) {
            return res.status(404).json({
                success: false,
                message:
                    "Expense not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: expense,
        });
    } catch (error) {
        console.error(
            "Get Expense Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch expense.",
        });
    }
};

// ======================================================
// UPDATE EXPENSE
// ======================================================

const updateExpense = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const {
            category,
            expenseDate,
            amount,
            paymentMethod,
            paidFrom,
            supplier,
            description,
            referenceNumber,
            status,
            notes,
        } = req.body;

        const updatedBy = req.user._id;

        // ------------------------------------------
        // Validate ID
        // ------------------------------------------

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid expense ID.",
            });
        }

        // ------------------------------------------
        // Find expense
        // ------------------------------------------

        const expense =
            await Expense.findById(id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message:
                    "Expense not found.",
            });
        }

        // ------------------------------------------
        // Workflow protection
        // ------------------------------------------
        // Status changes must happen through
        // dedicated workflow APIs.

        if (status !== undefined) {
            if (status !== expense.status) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Expense status cannot be changed through update. Use the appropriate workflow action.",
                });
            }
        }

        // ------------------------------------------
        // Category update
        // ------------------------------------------

        if (category !== undefined) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    category
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid category ID.",
                });
            }

            const categoryData =
                await ExpenseCategory.findOne({
                    _id: category,
                    company:
                        expense.company,
                    branch:
                        expense.branch,
                    isActive: true,
                });

            if (!categoryData) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Active expense category not found.",
                });
            }

            expense.category = category;
        }

        // ------------------------------------------
        // Expense date update
        // ------------------------------------------

        if (expenseDate !== undefined) {
            const parsedDate =
                new Date(expenseDate);

            if (
                Number.isNaN(
                    parsedDate.getTime()
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid expense date.",
                });
            }

            expense.expenseDate =
                parsedDate;
        }

        // ------------------------------------------
        // Amount update
        // ------------------------------------------

        if (amount !== undefined) {
            if (Number.isNaN(Number(amount))) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Amount must be a valid number.",
                });
            }

            if (Number(amount) <= 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Expense amount must be greater than zero.",
                });
            }

            expense.amount =
                Number(amount);
        }

        // ------------------------------------------
        // Payment method update
        // ------------------------------------------

        if (
            paymentMethod !== undefined
        ) {
            const validPaymentMethods = [
                "CASH",
                "BANK_TRANSFER",
                "UPI",
                "CARD",
                "CHEQUE",
                "OTHER",
            ];

            if (
                !validPaymentMethods.includes(
                    paymentMethod
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid payment method.",
                });
            }

            expense.paymentMethod =
                paymentMethod;
        }

        // ------------------------------------------
        // Paid from
        // ------------------------------------------

        if (paidFrom !== undefined) {
            expense.paidFrom =
                paidFrom.trim();
        }

        // ------------------------------------------
        // Supplier update
        // ------------------------------------------

        if (supplier !== undefined) {
            if (
                supplier === null ||
                supplier === ""
            ) {
                expense.supplier = null;
            } else {
                if (
                    !mongoose.Types.ObjectId.isValid(
                        supplier
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid supplier ID.",
                    });
                }

                const supplierData =
                    await Supplier.findOne({
                        _id: supplier,
                        company:
                            expense.company,
                        branch:
                            expense.branch,
                        isActive: true,
                    });

                if (!supplierData) {
                    return res.status(404).json({
                        success: false,
                        message:
                            "Active supplier not found.",
                    });
                }

                expense.supplier =
                    supplier;
            }
        }

        // ------------------------------------------
        // Description
        // ------------------------------------------

        if (description !== undefined) {
            expense.description =
                description.trim();
        }

        // ------------------------------------------
        // Reference number
        // ------------------------------------------

        if (
            referenceNumber !== undefined
        ) {
            expense.referenceNumber =
                referenceNumber.trim();
        }

        // ------------------------------------------
        // Notes
        // ------------------------------------------

        if (notes !== undefined) {
            expense.notes =
                notes.trim();
        }

        expense.updatedBy = updatedBy;

        await expense.save();

        // ------------------------------------------
        // Populate response
        // ------------------------------------------

        const populatedExpense =
            await Expense.findById(
                expense._id
            )
                .populate(
                    "company",
                    "name legalName email phone"
                )
                .populate(
                    "branch",
                    "name branchCode email"
                )
                .populate(
                    "category",
                    "name code description"
                )
                .populate(
                    "supplier",
                    "name email phone"
                )
                .populate(
                    "approvedBy",
                    "name email role"
                )
                .populate(
                    "paidBy",
                    "name email role"
                )
                .populate(
                    "createdBy",
                    "name email role"
                )
                .populate(
                    "updatedBy",
                    "name email role"
                );

        return res.status(200).json({
            success: true,
            message:
                "Expense updated successfully.",
            data: populatedExpense,
        });
    } catch (error) {
        console.error(
            "Update Expense Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to update expense.",
        });
    }
};

// ======================================================
// DELETE EXPENSE
// ======================================================

const deleteExpense = async (
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
                    "Invalid expense ID.",
            });
        }

        const expense =
            await Expense.findById(id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message:
                    "Expense not found.",
            });
        }

        // ------------------------------------------
        // Only drafts can be deleted
        // ------------------------------------------

        if (expense.status !== "DRAFT") {
            return res.status(400).json({
                success: false,
                message:
                    "Only draft expenses can be deleted.",
            });
        }

        await Expense.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message:
                "Expense deleted successfully.",
        });
    } catch (error) {
        console.error(
            "Delete Expense Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to delete expense.",
        });
    }
};

// ======================================================
// SUBMIT EXPENSE FOR APPROVAL
// ======================================================

const submitExpenseForApproval = async (
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
                    "Invalid expense ID.",
            });
        }

        const expense =
            await Expense.findById(id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message:
                    "Expense not found.",
            });
        }

        // ------------------------------------------
        // Only DRAFT can be submitted
        // ------------------------------------------

        if (expense.status !== "DRAFT") {
            return res.status(400).json({
                success: false,
                message:
                    `Expense cannot be submitted from ${expense.status} status.`,
            });
        }

        expense.status = "PENDING";
        expense.updatedBy = req.user._id;

        // Clear previous approval/rejection data

        expense.rejectionReason = "";
        expense.approvedBy = null;
        expense.approvedAt = null;
        expense.paidBy = null;
        expense.paidAt = null;

        await expense.save();

        const updatedExpense =
            await Expense.findById(
                expense._id
            )
                .populate(
                    "company",
                    "name legalName email phone"
                )
                .populate(
                    "branch",
                    "name branchCode email"
                )
                .populate(
                    "category",
                    "name code description"
                )
                .populate(
                    "supplier",
                    "name email phone"
                )
                .populate(
                    "createdBy",
                    "name email role"
                )
                .populate(
                    "updatedBy",
                    "name email role"
                );

        return res.status(200).json({
            success: true,
            message:
                "Expense submitted for approval successfully.",
            data: updatedExpense,
        });
    } catch (error) {
        console.error(
            "Submit Expense For Approval Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to submit expense for approval.",
        });
    }
};

// ======================================================
// APPROVE EXPENSE
// ======================================================

const approveExpense = async (
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
                    "Invalid expense ID.",
            });
        }

        const expense =
            await Expense.findById(id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message:
                    "Expense not found.",
            });
        }

        // ------------------------------------------
        // Only PENDING can be approved
        // ------------------------------------------

        if (expense.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message:
                    `Only PENDING expenses can be approved. Current status: ${expense.status}.`,
            });
        }

        expense.status = "APPROVED";
        expense.approvedBy = req.user._id;
        expense.approvedAt = new Date();

        expense.rejectionReason = "";

        expense.updatedBy =
            req.user._id;

        await expense.save();

        const updatedExpense =
            await Expense.findById(
                expense._id
            )
                .populate(
                    "company",
                    "name legalName email phone"
                )
                .populate(
                    "branch",
                    "name branchCode email"
                )
                .populate(
                    "category",
                    "name code description"
                )
                .populate(
                    "supplier",
                    "name email phone"
                )
                .populate(
                    "approvedBy",
                    "name email role"
                )
                .populate(
                    "paidBy",
                    "name email role"
                )
                .populate(
                    "createdBy",
                    "name email role"
                )
                .populate(
                    "updatedBy",
                    "name email role"
                );

        return res.status(200).json({
            success: true,
            message:
                "Expense approved successfully.",
            data: updatedExpense,
        });
    } catch (error) {
        console.error(
            "Approve Expense Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to approve expense.",
        });
    }
};

// ======================================================
// REJECT EXPENSE
// ======================================================

const rejectExpense = async (
    req,
    res
) => {
    try {
        const { id } = req.params;
        const { rejectionReason } =
            req.body;

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid expense ID.",
            });
        }

        // ------------------------------------------
        // Rejection reason required
        // ------------------------------------------

        if (
            !rejectionReason ||
            rejectionReason.trim().length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Rejection reason is required.",
            });
        }

        const expense =
            await Expense.findById(id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message:
                    "Expense not found.",
            });
        }

        // ------------------------------------------
        // Only PENDING can be rejected
        // ------------------------------------------

        if (expense.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message:
                    `Only PENDING expenses can be rejected. Current status: ${expense.status}.`,
            });
        }

        expense.status = "REJECTED";

        expense.rejectionReason =
            rejectionReason.trim();

        expense.approvedBy = null;
        expense.approvedAt = null;

        expense.updatedBy =
            req.user._id;

        await expense.save();

        const updatedExpense =
            await Expense.findById(
                expense._id
            )
                .populate(
                    "company",
                    "name legalName email phone"
                )
                .populate(
                    "branch",
                    "name branchCode email"
                )
                .populate(
                    "category",
                    "name code description"
                )
                .populate(
                    "supplier",
                    "name email phone"
                )
                .populate(
                    "approvedBy",
                    "name email role"
                )
                .populate(
                    "paidBy",
                    "name email role"
                )
                .populate(
                    "createdBy",
                    "name email role"
                )
                .populate(
                    "updatedBy",
                    "name email role"
                );

        return res.status(200).json({
            success: true,
            message:
                "Expense rejected successfully.",
            data: updatedExpense,
        });
    } catch (error) {
        console.error(
            "Reject Expense Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to reject expense.",
        });
    }
};

// ======================================================
// MARK EXPENSE AS PAID
// ======================================================

const markExpenseAsPaid = async (
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
                    "Invalid expense ID.",
            });
        }

        const expense =
            await Expense.findById(id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message:
                    "Expense not found.",
            });
        }

        // ------------------------------------------
        // Only APPROVED can be paid
        // ------------------------------------------

        if (expense.status !== "APPROVED") {
            return res.status(400).json({
                success: false,
                message:
                    `Only APPROVED expenses can be marked as paid. Current status: ${expense.status}.`,
            });
        }

        expense.status = "PAID";

        expense.paidBy =
            req.user._id;

        expense.paidAt =
            new Date();

        expense.updatedBy =
            req.user._id;

        await expense.save();

        const updatedExpense =
            await Expense.findById(
                expense._id
            )
                .populate(
                    "company",
                    "name legalName email phone"
                )
                .populate(
                    "branch",
                    "name branchCode email"
                )
                .populate(
                    "category",
                    "name code description"
                )
                .populate(
                    "supplier",
                    "name email phone"
                )
                .populate(
                    "approvedBy",
                    "name email role"
                )
                .populate(
                    "paidBy",
                    "name email role"
                )
                .populate(
                    "createdBy",
                    "name email role"
                )
                .populate(
                    "updatedBy",
                    "name email role"
                );

        return res.status(200).json({
            success: true,
            message:
                "Expense marked as paid successfully.",
            data: updatedExpense,
        });
    } catch (error) {
        console.error(
            "Mark Expense As Paid Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to mark expense as paid.",
        });
    }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    createExpense,
    getExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense,

    submitExpenseForApproval,
    approveExpense,
    rejectExpense,
    markExpenseAsPaid,
};