const mongoose = require("mongoose");

const JournalEntry = require("../models/JournalEntry");
const LedgerEntry = require("../models/LedgerEntry");
const Account = require("../models/Account");
const Company = require("../models/Company");
const Branch = require("../models/Branch");

const { withTransaction } = require("../utils/withTransaction");

// =====================================================
// Helpers
// =====================================================

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const roundAmount = (value) => {
    return (
        Math.round(
            (Number(value) + Number.EPSILON) * 100
        ) / 100
    );
};

// =====================================================
// Validate Company & Branch
// =====================================================

const validateCompanyAndBranch = async (
    companyId,
    branchId,
    session = null
) => {
    if (!isValidObjectId(companyId)) {
        throw new Error("Invalid company ID.");
    }

    if (!isValidObjectId(branchId)) {
        throw new Error("Invalid branch ID.");
    }

    const companyQuery = Company.findById(companyId);
    const branchQuery = Branch.findById(branchId);

    if (session) {
        companyQuery.session(session);
        branchQuery.session(session);
    }

    const company = await companyQuery;

    if (!company) {
        throw new Error("Company not found.");
    }

    const branch = await branchQuery;

    if (!branch) {
        throw new Error("Branch not found.");
    }

    if (
        branch.company &&
        branch.company.toString() !== companyId.toString()
    ) {
        throw new Error(
            "Branch does not belong to the selected company."
        );
    }

    return {
        company,
        branch,
    };
};

// =====================================================
// Validate Journal Lines
// =====================================================

const validateJournalLines = async (
    entries,
    companyId,
    session = null
) => {
    if (!Array.isArray(entries) || entries.length < 2) {
        throw new Error(
            "At least two journal entry lines are required."
        );
    }

    let totalDebit = 0;
    let totalCredit = 0;

    const accountIds = [];

    for (const entry of entries) {
        if (!entry.account) {
            throw new Error(
                "Account is required for every journal entry line."
            );
        }

        if (!isValidObjectId(entry.account)) {
            throw new Error(
                `Invalid account ID: ${entry.account}`
            );
        }

        const debit = Number(entry.debit || 0);
        const credit = Number(entry.credit || 0);

        if (
            !Number.isFinite(debit) ||
            !Number.isFinite(credit)
        ) {
            throw new Error(
                "Debit and credit values must be valid numbers."
            );
        }

        if (debit < 0 || credit < 0) {
            throw new Error(
                "Debit and credit values cannot be negative."
            );
        }

        if (debit > 0 && credit > 0) {
            throw new Error(
                "A journal entry line cannot have both debit and credit."
            );
        }

        if (debit === 0 && credit === 0) {
            throw new Error(
                "Each journal entry line must contain either debit or credit."
            );
        }

        totalDebit += debit;
        totalCredit += credit;

        accountIds.push(entry.account);
    }

    totalDebit = roundAmount(totalDebit);
    totalCredit = roundAmount(totalCredit);

    if (totalDebit <= 0) {
        throw new Error(
            "Total debit must be greater than zero."
        );
    }

    if (totalCredit <= 0) {
        throw new Error(
            "Total credit must be greater than zero."
        );
    }

    if (totalDebit !== totalCredit) {
        throw new Error(
            `Journal entry is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}.`
        );
    }

    const accountQuery = Account.find({
        _id: { $in: accountIds },
        company: companyId,
        isActive: true,
    });

    if (session) {
        accountQuery.session(session);
    }

    const accounts = await accountQuery;

    const accountMap = new Map(
        accounts.map((account) => [
            account._id.toString(),
            account,
        ])
    );

    for (const accountId of accountIds) {
        if (!accountMap.has(accountId.toString())) {
            throw new Error(
                `Account ${accountId} was not found, is inactive, or does not belong to this company.`
            );
        }
    }

    return {
        totalDebit,
        totalCredit,
        accounts,
    };
};

// =====================================================
// Generate Journal Number
// =====================================================

const generateJournalNumber = async (
    companyId,
    session = null
) => {
    const query = JournalEntry.findOne({
        company: companyId,
    })
        .sort({ createdAt: -1 })
        .select("journalNumber");

    if (session) {
        query.session(session);
    }

    const lastJournal = await query;

    let nextNumber = 1;

    if (
        lastJournal &&
        lastJournal.journalNumber
    ) {
        const match =
            lastJournal.journalNumber.match(/(\d+)$/);

        if (match) {
            nextNumber =
                Number(match[1]) + 1;
        }
    }

    return `JV-${String(nextNumber).padStart(6, "0")}`;
};

// =====================================================
// Create Journal Entry
// =====================================================

const createJournalEntry = async (req, res) => {
    try {
        const {
            company,
            branch,
            journalDate,
            referenceType,
            referenceId,
            description,
            entries,
        } = req.body;

        if (!company || !branch) {
            return res.status(400).json({
                success: false,
                message:
                    "Company and branch are required.",
            });
        }

        const result = await withTransaction(
            async (session) => {
                await validateCompanyAndBranch(
                    company,
                    branch,
                    session
                );

                const validation =
                    await validateJournalLines(
                        entries,
                        company,
                        session
                    );

                const journalNumber =
                    await generateJournalNumber(
                        company,
                        session
                    );

                const journalEntry =
                    await JournalEntry.create(
                        [
                            {
                                company,
                                branch,
                                journalNumber,

                                journalDate:
                                    journalDate ||
                                    new Date(),

                                referenceType:
                                    referenceType ||
                                    "MANUAL",

                                referenceId:
                                    referenceId ||
                                    null,

                                description:
                                    description || "",

                                entries:
                                    entries.map(
                                        (entry) => ({
                                            account:
                                                entry.account,

                                            description:
                                                entry.description ||
                                                "",

                                            debit:
                                                roundAmount(
                                                    Number(
                                                        entry.debit ||
                                                        0
                                                    )
                                                ),

                                            credit:
                                                roundAmount(
                                                    Number(
                                                        entry.credit ||
                                                        0
                                                    )
                                                ),
                                        })
                                    ),

                                totalDebit:
                                    validation.totalDebit,

                                totalCredit:
                                    validation.totalCredit,

                                status: "DRAFT",

                                createdBy:
                                    req.user._id,
                            },
                        ],
                        {
                            session,
                        }
                    );

                return journalEntry[0];
            }
        );

        const populatedJournal =
            await JournalEntry.findById(
                result._id
            )
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "branch",
                    "name code city state"
                )
                .populate(
                    "entries.account",
                    "accountCode accountName accountType"
                )
                .populate(
                    "createdBy",
                    "name email role"
                );

        return res.status(201).json({
            success: true,
            message:
                "Journal entry created successfully.",
            data: populatedJournal,
        });
    } catch (error) {
        console.error(
            "Create Journal Entry Error:",
            error
        );

        if (
            error.code === 11000 &&
            error.keyPattern?.journalNumber
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Journal number already exists. Please try again.",
            });
        }

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// =====================================================
// Get Journal Entries
// =====================================================

const getJournalEntries = async (req, res) => {
    try {
        const {
            company,
            branch,
            status,
            referenceType,
            fromDate,
            toDate,
            search,
            page = 1,
            limit = 20,
        } = req.query;

        if (!company) {
            return res.status(400).json({
                success: false,
                message:
                    "Company ID is required.",
            });
        }

        if (!isValidObjectId(company)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid company ID.",
            });
        }

        const pageNumber = Math.max(
            Number(page) || 1,
            1
        );

        const limitNumber = Math.min(
            Math.max(
                Number(limit) || 20,
                1
            ),
            100
        );

        const skip =
            (pageNumber - 1) *
            limitNumber;

        const filter = {
            company,
        };

        if (branch) {
            if (!isValidObjectId(branch)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid branch ID.",
                });
            }

            filter.branch = branch;
        }

        if (status) {
            filter.status =
                status.toUpperCase();
        }

        if (referenceType) {
            filter.referenceType =
                referenceType.toUpperCase();
        }

        if (fromDate || toDate) {
            filter.journalDate = {};

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

                filter.journalDate.$gte =
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

                filter.journalDate.$lte =
                    endDate;
            }
        }

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

        const [
            journals,
            total,
        ] = await Promise.all([
            JournalEntry.find(filter)
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "branch",
                    "name code city state"
                )
                .populate(
                    "entries.account",
                    "accountCode accountName accountType"
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
                    journalDate: -1,
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limitNumber),

            JournalEntry.countDocuments(
                filter
            ),
        ]);

        return res.status(200).json({
            success: true,
            data: journals,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(
                    total / limitNumber
                ),
            },
        });
    } catch (error) {
        console.error(
            "Get Journal Entries Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch journal entries.",
        });
    }
};

// =====================================================
// Get Journal Entry By ID
// =====================================================

const getJournalEntryById = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid journal entry ID.",
            });
        }

        const journalEntry =
            await JournalEntry.findById(id)
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "branch",
                    "name code city state"
                )
                .populate(
                    "entries.account",
                    "accountCode accountName accountType"
                )
                .populate(
                    "createdBy",
                    "name email role"
                )
                .populate(
                    "updatedBy",
                    "name email role"
                );

        if (!journalEntry) {
            return res.status(404).json({
                success: false,
                message:
                    "Journal entry not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: journalEntry,
        });
    } catch (error) {
        console.error(
            "Get Journal Entry By ID Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch journal entry.",
        });
    }
};

// =====================================================
// Update Journal Entry
// =====================================================

const updateJournalEntry = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid journal entry ID.",
            });
        }

        const journalEntry =
            await JournalEntry.findById(id);

        if (!journalEntry) {
            return res.status(404).json({
                success: false,
                message:
                    "Journal entry not found.",
            });
        }

        if (
            journalEntry.status !==
            "DRAFT"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only DRAFT journal entries can be updated.",
            });
        }

        const {
            journalDate,
            referenceType,
            referenceId,
            description,
            entries,
        } = req.body;

        const result =
            await withTransaction(
                async (session) => {
                    const current =
                        await JournalEntry.findById(
                            id
                        ).session(session);

                    if (!current) {
                        throw new Error(
                            "Journal entry not found."
                        );
                    }

                    if (
                        current.status !==
                        "DRAFT"
                    ) {
                        throw new Error(
                            "Only DRAFT journal entries can be updated."
                        );
                    }

                    const companyId =
                        current.company.toString();

                    const validation =
                        await validateJournalLines(
                            entries ||
                                current.entries,
                            companyId,
                            session
                        );

                    if (
                        journalDate !==
                        undefined
                    ) {
                        const parsedDate =
                            new Date(
                                journalDate
                            );

                        if (
                            Number.isNaN(
                                parsedDate.getTime()
                            )
                        ) {
                            throw new Error(
                                "Invalid journal date."
                            );
                        }

                        current.journalDate =
                            parsedDate;
                    }

                    if (
                        referenceType !==
                        undefined
                    ) {
                        current.referenceType =
                            referenceType;
                    }

                    if (
                        referenceId !==
                        undefined
                    ) {
                        current.referenceId =
                            referenceId ||
                            null;
                    }

                    if (
                        description !==
                        undefined
                    ) {
                        current.description =
                            description;
                    }

                    if (
                        entries !==
                        undefined
                    ) {
                        current.entries =
                            entries.map(
                                (entry) => ({
                                    account:
                                        entry.account,

                                    description:
                                        entry.description ||
                                        "",

                                    debit:
                                        roundAmount(
                                            Number(
                                                entry.debit ||
                                                0
                                            )
                                        ),

                                    credit:
                                        roundAmount(
                                            Number(
                                                entry.credit ||
                                                0
                                            )
                                        ),
                                })
                            );
                    }

                    current.totalDebit =
                        validation.totalDebit;

                    current.totalCredit =
                        validation.totalCredit;

                    current.updatedBy =
                        req.user._id;

                    await current.save({
                        session,
                    });

                    return current;
                }
            );

        const populatedJournal =
            await JournalEntry.findById(
                result._id
            )
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "branch",
                    "name code city state"
                )
                .populate(
                    "entries.account",
                    "accountCode accountName accountType"
                )
                .populate(
                    "updatedBy",
                    "name email role"
                );

        return res.status(200).json({
            success: true,
            message:
                "Journal entry updated successfully.",
            data: populatedJournal,
        });
    } catch (error) {
        console.error(
            "Update Journal Entry Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
const postJournalEntry = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid journal entry ID.",
            });
        }

        const result = await withTransaction(
            async (session) => {
                // ==========================================
                // 1. Get Journal Entry
                // ==========================================

                const journalEntry =
                    await JournalEntry.findById(id).session(
                        session
                    );

                if (!journalEntry) {
                    throw new Error(
                        "Journal entry not found."
                    );
                }

                // ==========================================
                // 2. Only DRAFT can be posted
                // ==========================================

                if (journalEntry.status !== "DRAFT") {
                    throw new Error(
                        "Only DRAFT journal entries can be posted."
                    );
                }

                // ==========================================
                // 3. Validate Journal Lines
                // ==========================================

                const validation =
                    await validateJournalLines(
                        journalEntry.entries,
                        journalEntry.company,
                        session
                    );

                // ==========================================
                // 4. Find Existing Ledger Entries
                // ==========================================

                const existingLedgerEntries =
                    await LedgerEntry.find({
                        company: journalEntry.company,
                        journalEntry: journalEntry._id,
                    })
                        .session(session)
                        .lean();

                const existingLineNumbers =
                    new Set(
                        existingLedgerEntries.map(
                            (ledger) =>
                                Number(ledger.lineNumber)
                        )
                    );

                // ==========================================
                // 5. Find Missing Ledger Lines
                // ==========================================

                const missingLedgerDocuments = [];

                journalEntry.entries.forEach(
                    (entry, index) => {
                        const lineNumber =
                            index + 1;

                        if (
                            existingLineNumbers.has(
                                lineNumber
                            )
                        ) {
                            return;
                        }

                        missingLedgerDocuments.push({
                            company:
                                journalEntry.company,

                            branch:
                                journalEntry.branch,

                            account:
                                entry.account,

                            journalEntry:
                                journalEntry._id,

                            lineNumber,

                            journalNumber:
                                journalEntry.journalNumber,

                            transactionDate:
                                journalEntry.journalDate,

                            description:
                                entry.description ||
                                journalEntry.description ||
                                "",

                            debit: roundAmount(
                                Number(
                                    entry.debit || 0
                                )
                            ),

                            credit: roundAmount(
                                Number(
                                    entry.credit || 0
                                )
                            ),

                            referenceType:
                                journalEntry.referenceType,

                            referenceId:
                                journalEntry.referenceId ||
                                null,
                        });
                    }
                );

                // ==========================================
                // 6. Create Missing Ledger Entries
                // ==========================================

                if (
                    missingLedgerDocuments.length > 0
                ) {
                    await LedgerEntry.insertMany(
                        missingLedgerDocuments,
                        {
                            session,
                        }
                    );
                }

                // ==========================================
                // 7. Update Journal Entry
                // ==========================================

                journalEntry.totalDebit =
                    validation.totalDebit;

                journalEntry.totalCredit =
                    validation.totalCredit;

                journalEntry.status = "POSTED";

                journalEntry.postedAt =
                    new Date();

                journalEntry.updatedBy =
                    req.user._id;

                await journalEntry.save({
                    session,
                });

                return journalEntry;
            }
        );

        // ==========================================
        // 8. Populate Response
        // ==========================================

        const populatedJournal =
            await JournalEntry.findById(
                result._id
            )
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "branch",
                    "name code city state"
                )
                .populate(
                    "entries.account",
                    "accountCode accountName accountType"
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
                "Journal entry posted successfully and ledger entries verified.",
            data: populatedJournal,
        });
    } catch (error) {
        console.error(
            "Post Journal Entry Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// =====================================================
// Cancel Journal Entry
// =====================================================

const cancelJournalEntry = async (
    req,
    res
) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid journal entry ID.",
            });
        }

        const journalEntry =
            await JournalEntry.findById(id);

        if (!journalEntry) {
            return res.status(404).json({
                success: false,
                message:
                    "Journal entry not found.",
            });
        }

        if (
            journalEntry.status ===
            "CANCELLED"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Journal entry is already cancelled.",
            });
        }

        const result =
            await withTransaction(
                async (session) => {
                    const current =
                        await JournalEntry.findById(
                            id
                        ).session(session);

                    if (!current) {
                        throw new Error(
                            "Journal entry not found."
                        );
                    }

                    current.status =
                        "CANCELLED";

                    current.cancelledAt =
                        new Date();

                    current.cancellationReason =
                        reason || "";

                    current.updatedBy =
                        req.user._id;

                    await current.save({
                        session,
                    });

                    return current;
                }
            );

        return res.status(200).json({
            success: true,
            message:
                "Journal entry cancelled successfully.",
            data: result,
        });
    } catch (error) {
        console.error(
            "Cancel Journal Entry Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// =====================================================
// Delete Journal Entry
// =====================================================

const deleteJournalEntry = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid journal entry ID.",
            });
        }

        const journalEntry =
            await JournalEntry.findById(id);

        if (!journalEntry) {
            return res.status(404).json({
                success: false,
                message:
                    "Journal entry not found.",
            });
        }

        if (
            journalEntry.status !==
            "DRAFT"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only DRAFT journal entries can be deleted.",
            });
        }

        await JournalEntry.findByIdAndDelete(
            id
        );

        return res.status(200).json({
            success: true,
            message:
                "Journal entry deleted successfully.",
        });
    } catch (error) {
        console.error(
            "Delete Journal Entry Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete journal entry.",
        });
    }
};

// =====================================================
// Exports
// =====================================================

module.exports = {
    createJournalEntry,
    getJournalEntries,
    getJournalEntryById,
    updateJournalEntry,
    postJournalEntry,
    cancelJournalEntry,
    deleteJournalEntry,
};