const mongoose = require("mongoose");

const LedgerEntry = require("../models/LedgerEntry");
const Account = require("../models/Account");
const Company = require("../models/Company");
const Branch = require("../models/Branch");

// =====================================================
// HELPERS
// =====================================================

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const roundAmount = (amount) => {
    return (
        Math.round(
            (Number(amount) + Number.EPSILON) * 100
        ) / 100
    );
};

// =====================================================
// GET ACCOUNT LEDGER
// =====================================================

const getAccountLedger = async (req, res) => {
    try {
        const {
            company,
            branch,
            account,
            fromDate,
            toDate,
            page = 1,
            limit = 20,
        } = req.query;

        // -------------------------------------------------
        // Required company
        // -------------------------------------------------

        if (!company || !isValidObjectId(company)) {
            return res.status(400).json({
                success: false,
                message: "Valid company ID is required.",
            });
        }

        // -------------------------------------------------
        // Validate branch
        // -------------------------------------------------

        if (branch && !isValidObjectId(branch)) {
            return res.status(400).json({
                success: false,
                message: "Invalid branch ID.",
            });
        }

        // -------------------------------------------------
        // Validate account
        // -------------------------------------------------

        if (account && !isValidObjectId(account)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account ID.",
            });
        }

        // -------------------------------------------------
        // Validate company
        // -------------------------------------------------

        const companyExists = await Company.findById(company);

        if (!companyExists) {
            return res.status(404).json({
                success: false,
                message: "Company not found.",
            });
        }

        // -------------------------------------------------
        // Validate branch belongs to company
        // -------------------------------------------------

        if (branch) {
            const branchExists = await Branch.findOne({
                _id: branch,
                company,
            });

            if (!branchExists) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Branch not found for this company.",
                });
            }
        }

        // -------------------------------------------------
        // Validate account belongs to company
        // -------------------------------------------------

        if (account) {
            const accountExists = await Account.findOne({
                _id: account,
                company,
            });

            if (!accountExists) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Account not found for this company.",
                });
            }
        }

        // -------------------------------------------------
        // Pagination
        // -------------------------------------------------

        const currentPage = Math.max(
            Number(page) || 1,
            1
        );

        const perPage = Math.min(
            Math.max(Number(limit) || 20, 1),
            100
        );

        const skip = (currentPage - 1) * perPage;

        // -------------------------------------------------
        // Build MongoDB filter
        // -------------------------------------------------

        const filter = {
            company,
        };

        if (branch) {
            filter.branch = branch;
        }

        if (account) {
            filter.account = account;
        }

        // -------------------------------------------------
        // Date filters
        // -------------------------------------------------

        if (fromDate || toDate) {
            filter.transactionDate = {};

            // From date
            if (fromDate) {
                const startDate = new Date(fromDate);

                if (Number.isNaN(startDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid fromDate.",
                    });
                }

                startDate.setHours(0, 0, 0, 0);

                filter.transactionDate.$gte = startDate;
            }

            // To date
            if (toDate) {
                const endDate = new Date(toDate);

                if (Number.isNaN(endDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid toDate.",
                    });
                }

                endDate.setHours(23, 59, 59, 999);

                filter.transactionDate.$lte = endDate;
            }
        }

        // -------------------------------------------------
        // Get total count
        // -------------------------------------------------

        const total =
            await LedgerEntry.countDocuments(filter);

        // -------------------------------------------------
        // Get ledger entries
        // -------------------------------------------------

        const entries = await LedgerEntry.find(filter)
            .populate({
                path: "account",
                select:
                    "accountCode accountName accountType",
            })
            .populate({
                path: "journalEntry",
                select:
                    "journalNumber status referenceType description",
            })
            .populate({
                path: "branch",
                select: "name",
            })
            .sort({
                transactionDate: 1,
                createdAt: 1,
            })
            .skip(skip)
            .limit(perPage);

        // =================================================
        // IMPORTANT:
        // Mongoose automatically casts values for find(),
        // but aggregate() does NOT automatically cast
        // string IDs to ObjectId.
        //
        // Therefore we create a separate aggregation
        // filter using ObjectId values.
        // =================================================

        const aggregateFilter = {
            company: new mongoose.Types.ObjectId(company),
        };

        if (branch) {
            aggregateFilter.branch =
                new mongoose.Types.ObjectId(branch);
        }

        if (account) {
            aggregateFilter.account =
                new mongoose.Types.ObjectId(account);
        }

        // -------------------------------------------------
        // Add date filter to aggregation
        // -------------------------------------------------

        if (filter.transactionDate) {
            aggregateFilter.transactionDate =
                filter.transactionDate;
        }

        // -------------------------------------------------
        // Calculate ledger totals
        // -------------------------------------------------

        const totals = await LedgerEntry.aggregate([
            {
                $match: aggregateFilter,
            },
            {
                $group: {
                    _id: null,

                    totalDebit: {
                        $sum: "$debit",
                    },

                    totalCredit: {
                        $sum: "$credit",
                    },
                },
            },
        ]);

        const totalDebit = roundAmount(
            totals[0]?.totalDebit || 0
        );

        const totalCredit = roundAmount(
            totals[0]?.totalCredit || 0
        );

        // -------------------------------------------------
        // Closing balance
        // -------------------------------------------------

        const closingBalance = roundAmount(
            totalDebit - totalCredit
        );

        // -------------------------------------------------
        // Response
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            data: entries,

            summary: {
                totalDebit,
                totalCredit,
                closingBalance,
            },

            pagination: {
                total,
                page: currentPage,
                limit: perPage,
                totalPages: Math.ceil(
                    total / perPage
                ),
            },
        });
    } catch (error) {
        console.error(
            "Get Account Ledger Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch account ledger.",
        });
    }
};

// =====================================================
// GET LEDGER BY ACCOUNT
// =====================================================

const getLedgerByAccount = async (req, res) => {
    try {
        const { accountId } = req.params;

        const {
            fromDate,
            toDate,
            page = 1,
            limit = 20,
        } = req.query;

        // -------------------------------------------------
        // Validate account ID
        // -------------------------------------------------

        if (!isValidObjectId(accountId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account ID.",
            });
        }

        // -------------------------------------------------
        // Find account
        // -------------------------------------------------

        const account =
            await Account.findById(accountId);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found.",
            });
        }

        // -------------------------------------------------
        // Pagination
        // -------------------------------------------------

        const currentPage = Math.max(
            Number(page) || 1,
            1
        );

        const perPage = Math.min(
            Math.max(Number(limit) || 20, 1),
            100
        );

        const skip = (currentPage - 1) * perPage;

        // -------------------------------------------------
        // Build filter
        // -------------------------------------------------

        const filter = {
            company: account.company,
            account: account._id,
        };

        // -------------------------------------------------
        // Date filters
        // -------------------------------------------------

        if (fromDate || toDate) {
            filter.transactionDate = {};

            // From date
            if (fromDate) {
                const startDate = new Date(fromDate);

                if (Number.isNaN(startDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid fromDate.",
                    });
                }

                startDate.setHours(0, 0, 0, 0);

                filter.transactionDate.$gte =
                    startDate;
            }

            // To date
            if (toDate) {
                const endDate = new Date(toDate);

                if (Number.isNaN(endDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid toDate.",
                    });
                }

                endDate.setHours(23, 59, 59, 999);

                filter.transactionDate.$lte =
                    endDate;
            }
        }

        // -------------------------------------------------
        // Count
        // -------------------------------------------------

        const total =
            await LedgerEntry.countDocuments(filter);

        // -------------------------------------------------
        // Get ledger entries
        // -------------------------------------------------

        const entries = await LedgerEntry.find(filter)
            .populate({
                path: "journalEntry",
                select:
                    "journalNumber status referenceType description",
            })
            .populate({
                path: "branch",
                select: "name",
            })
            .sort({
                transactionDate: 1,
                createdAt: 1,
            })
            .skip(skip)
            .limit(perPage);

        // =================================================
        // Explicit ObjectId filter for aggregation
        // =================================================

        const aggregateFilter = {
            company: new mongoose.Types.ObjectId(
                account.company.toString()
            ),

            account: new mongoose.Types.ObjectId(
                account._id.toString()
            ),
        };

        // -------------------------------------------------
        // Add date filter
        // -------------------------------------------------

        if (filter.transactionDate) {
            aggregateFilter.transactionDate =
                filter.transactionDate;
        }

        // -------------------------------------------------
        // Calculate totals
        // -------------------------------------------------

        const totals = await LedgerEntry.aggregate([
            {
                $match: aggregateFilter,
            },
            {
                $group: {
                    _id: null,

                    totalDebit: {
                        $sum: "$debit",
                    },

                    totalCredit: {
                        $sum: "$credit",
                    },
                },
            },
        ]);

        const totalDebit = roundAmount(
            totals[0]?.totalDebit || 0
        );

        const totalCredit = roundAmount(
            totals[0]?.totalCredit || 0
        );

        // -------------------------------------------------
        // Closing balance
        // -------------------------------------------------

        const closingBalance = roundAmount(
            totalDebit - totalCredit
        );

        // -------------------------------------------------
        // Response
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            data: {
                account: {
                    _id: account._id,
                    accountCode:
                        account.accountCode,
                    accountName:
                        account.accountName,
                    accountType:
                        account.accountType,
                },

                entries,

                summary: {
                    totalDebit,
                    totalCredit,
                    closingBalance,
                },
            },

            pagination: {
                total,
                page: currentPage,
                limit: perPage,
                totalPages: Math.ceil(
                    total / perPage
                ),
            },
        });
    } catch (error) {
        console.error(
            "Get Ledger By Account Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch account ledger.",
        });
    }
};

// =====================================================
// GET LEDGER ENTRY BY ID
// =====================================================

const getLedgerEntryById = async (req, res) => {
    try {
        const { id } = req.params;

        // -------------------------------------------------
        // Validate ID
        // -------------------------------------------------

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid ledger entry ID.",
            });
        }

        // -------------------------------------------------
        // Find ledger entry
        // -------------------------------------------------

        const ledgerEntry =
            await LedgerEntry.findById(id)
                .populate({
                    path: "company",
                    select: "name legalName",
                })
                .populate({
                    path: "branch",
                    select: "name",
                })
                .populate({
                    path: "account",
                    select:
                        "accountCode accountName accountType",
                })
                .populate({
                    path: "journalEntry",
                    select:
                        "journalNumber journalDate status referenceType description",
                });

        // -------------------------------------------------
        // Not found
        // -------------------------------------------------

        if (!ledgerEntry) {
            return res.status(404).json({
                success: false,
                message:
                    "Ledger entry not found.",
            });
        }

        // -------------------------------------------------
        // Response
        // -------------------------------------------------

        return res.status(200).json({
            success: true,
            data: ledgerEntry,
        });
    } catch (error) {
        console.error(
            "Get Ledger Entry By ID Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch ledger entry.",
        });
    }
};

// =====================================================
// GET TRANSACTION HISTORY
// =====================================================

const getTransactionHistory = async (req, res) => {
    try {
        const {
            company,
            branch,
            account,
            fromDate,
            toDate,
            referenceType,
            search,
            page = 1,
            limit = 20,
        } = req.query;

        // -------------------------------------------------
        // Validate company
        // -------------------------------------------------

        if (
            !company ||
            !isValidObjectId(company)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid company ID is required.",
            });
        }

        // -------------------------------------------------
        // Validate company exists
        // -------------------------------------------------

        const companyExists =
            await Company.findById(company);

        if (!companyExists) {
            return res.status(404).json({
                success: false,
                message: "Company not found.",
            });
        }

        // -------------------------------------------------
        // Validate branch
        // -------------------------------------------------

        if (
            branch &&
            !isValidObjectId(branch)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid branch ID.",
            });
        }

        // -------------------------------------------------
        // Validate account
        // -------------------------------------------------

        if (
            account &&
            !isValidObjectId(account)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid account ID.",
            });
        }

        // -------------------------------------------------
        // Validate branch belongs to company
        // -------------------------------------------------

        if (branch) {
            const branchExists =
                await Branch.findOne({
                    _id: branch,
                    company,
                });

            if (!branchExists) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Branch not found for this company.",
                });
            }
        }

        // -------------------------------------------------
        // Validate account belongs to company
        // -------------------------------------------------

        if (account) {
            const accountExists =
                await Account.findOne({
                    _id: account,
                    company,
                });

            if (!accountExists) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Account not found for this company.",
                });
            }
        }

        // -------------------------------------------------
        // Pagination
        // -------------------------------------------------

        const currentPage = Math.max(
            Number(page) || 1,
            1
        );

        const perPage = Math.min(
            Math.max(Number(limit) || 20, 1),
            100
        );

        const skip =
            (currentPage - 1) * perPage;

        // -------------------------------------------------
        // Build filter
        // -------------------------------------------------

        const filter = {
            company,
        };

        if (branch) {
            filter.branch = branch;
        }

        if (account) {
            filter.account = account;
        }

        // -------------------------------------------------
        // Reference Type
        // -------------------------------------------------

        if (referenceType) {
            const allowedReferenceTypes = [
                "MANUAL",
                "SALES",
                "PURCHASE",
                "EXPENSE",
                "PAYMENT",
                "RECEIPT",
                "ADJUSTMENT",
                "OTHER",
            ];

            if (
                !allowedReferenceTypes.includes(
                    referenceType.toUpperCase()
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid referenceType.",
                });
            }

            filter.referenceType =
                referenceType.toUpperCase();
        }

        // -------------------------------------------------
        // Date filters
        // -------------------------------------------------

        if (fromDate || toDate) {
            filter.transactionDate = {};

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

                startDate.setHours(
                    0,
                    0,
                    0,
                    0
                );

                filter.transactionDate.$gte =
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

                filter.transactionDate.$lte =
                    endDate;
            }
        }

        // -------------------------------------------------
        // Search
        // -------------------------------------------------

        if (search) {
            filter.$or = [
                {
                    journalNumber: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    description: {
                        $regex: search,
                        $options: "i",
                    },
                },
            ];
        }

        // -------------------------------------------------
        // Total count
        // -------------------------------------------------

        const total =
            await LedgerEntry.countDocuments(
                filter
            );

        // -------------------------------------------------
        // Get transactions
        // -------------------------------------------------

        const entries =
            await LedgerEntry.find(filter)
                .populate({
                    path: "company",
                    select:
                        "name legalName",
                })
                .populate({
                    path: "branch",
                    select: "name",
                })
                .populate({
                    path: "account",
                    select:
                        "accountCode accountName accountType",
                })
                .populate({
                    path: "journalEntry",
                    select:
                        "journalNumber journalDate status referenceType referenceId description",
                })
                .sort({
                    transactionDate: -1,
                    createdAt: -1,
                })
                .skip(skip)
                .limit(perPage);

        // -------------------------------------------------
        // Format response
        // -------------------------------------------------

        const data = entries.map(
            (entry) => ({
                id: entry._id,

                journalEntry:
                    entry.journalEntry?._id ||
                    null,

                journalNumber:
                    entry.journalNumber,

                transactionDate:
                    entry.transactionDate,

                company:
                    entry.company?._id ||
                    null,

                companyName:
                    entry.company?.name ||
                    "",

                branch:
                    entry.branch?._id ||
                    null,

                branchName:
                    entry.branch?.name ||
                    "",

                account:
                    entry.account?._id ||
                    null,

                accountCode:
                    entry.account
                        ?.accountCode || "",

                accountName:
                    entry.account
                        ?.accountName || "",

                accountType:
                    entry.account
                        ?.accountType || "",

                description:
                    entry.description,

                debit: roundAmount(
                    entry.debit
                ),

                credit: roundAmount(
                    entry.credit
                ),

                referenceType:
                    entry.referenceType,

                referenceId:
                    entry.referenceId ||
                    null,

                journalStatus:
                    entry.journalEntry
                        ?.status || "",

                createdAt:
                    entry.createdAt,
            })
        );

        // -------------------------------------------------
        // Response
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            data,

            pagination: {
                total,
                page: currentPage,
                limit: perPage,
                totalPages: Math.ceil(
                    total / perPage
                ),
            },
        });
    } catch (error) {
        console.error(
            "Get Transaction History Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch transaction history.",
        });
    }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getAccountLedger,
    getLedgerByAccount,
    getLedgerEntryById,
    getTransactionHistory,
};