const mongoose = require("mongoose");

const LedgerEntry = require("../models/LedgerEntry");
const Company = require("../models/Company");

const roundAmount = (amount) => {
    return (
        Math.round(
            (Number(amount) + Number.EPSILON) * 100
        ) / 100
    );
};

// =====================================================
// GET TRIAL BALANCE
// =====================================================

const getTrialBalance = async (req, res) => {
    try {
        const {
            company,
            branch,
            fromDate,
            toDate,
        } = req.query;

        // -------------------------------------------------
        // Validate company
        // -------------------------------------------------

        if (
            !company ||
            !mongoose.Types.ObjectId.isValid(company)
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid company ID is required.",
            });
        }

        // -------------------------------------------------
        // Check company
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
            !mongoose.Types.ObjectId.isValid(branch)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid branch ID.",
            });
        }

        // -------------------------------------------------
        // Build aggregation filter
        // -------------------------------------------------

        const matchFilter = {
            company:
                new mongoose.Types.ObjectId(company),
        };

        if (branch) {
            matchFilter.branch =
                new mongoose.Types.ObjectId(branch);
        }

        // -------------------------------------------------
        // Date filters
        // -------------------------------------------------

        if (fromDate || toDate) {
            matchFilter.transactionDate = {};

            if (fromDate) {
                const startDate = new Date(fromDate);

                if (
                    Number.isNaN(
                        startDate.getTime()
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid fromDate.",
                    });
                }

                startDate.setHours(
                    0,
                    0,
                    0,
                    0
                );

                matchFilter.transactionDate.$gte =
                    startDate;
            }

            if (toDate) {
                const endDate = new Date(toDate);

                if (
                    Number.isNaN(
                        endDate.getTime()
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid toDate.",
                    });
                }

                endDate.setHours(
                    23,
                    59,
                    59,
                    999
                );

                matchFilter.transactionDate.$lte =
                    endDate;
            }
        }

        // -------------------------------------------------
        // Aggregate account-wise totals
        // -------------------------------------------------

        const trialBalance =
            await LedgerEntry.aggregate([
                {
                    $match: matchFilter,
                },

                {
                    $group: {
                        _id: "$account",

                        totalDebit: {
                            $sum: "$debit",
                        },

                        totalCredit: {
                            $sum: "$credit",
                        },
                    },
                },

                {
                    $lookup: {
                        from: "accounts",
                        localField: "_id",
                        foreignField: "_id",
                        as: "account",
                    },
                },

                {
                    $unwind: "$account",
                },

                {
                    $project: {
                        _id: 0,

                        account: "$account._id",

                        accountCode:
                            "$account.accountCode",

                        accountName:
                            "$account.accountName",

                        accountType:
                            "$account.accountType",

                        totalDebit: 1,

                        totalCredit: 1,

                        balance: {
                            $subtract: [
                                "$totalDebit",
                                "$totalCredit",
                            ],
                        },
                    },
                },

                {
                    $sort: {
                        accountCode: 1,
                    },
                },
            ]);

        // -------------------------------------------------
        // Format account balances
        // -------------------------------------------------

        const data = trialBalance.map(
            (item) => ({
                account: item.account,
                accountCode:
                    item.accountCode,
                accountName:
                    item.accountName,
                accountType:
                    item.accountType,

                totalDebit: roundAmount(
                    item.totalDebit
                ),

                totalCredit: roundAmount(
                    item.totalCredit
                ),

                balance: roundAmount(
                    item.balance
                ),
            })
        );

        // -------------------------------------------------
        // Calculate grand totals
        // -------------------------------------------------

        let grandTotalDebit = 0;
        let grandTotalCredit = 0;

        data.forEach((item) => {
            grandTotalDebit +=
                item.totalDebit;

            grandTotalCredit +=
                item.totalCredit;
        });

        grandTotalDebit =
            roundAmount(grandTotalDebit);

        grandTotalCredit =
            roundAmount(grandTotalCredit);

        const difference = roundAmount(
            grandTotalDebit -
                grandTotalCredit
        );

        // -------------------------------------------------
        // Response
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            data,

            summary: {
                totalAccounts: data.length,

                totalDebit:
                    grandTotalDebit,

                totalCredit:
                    grandTotalCredit,

                difference,
            },
        });
    } catch (error) {
        console.error(
            "Get Trial Balance Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to generate trial balance.",
        });
    }
};

module.exports = {
    getTrialBalance,
};