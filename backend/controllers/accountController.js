const mongoose = require("mongoose");

const Account = require("../models/Account");
const Company = require("../models/Company");


// ======================================================
// Helpers
// ======================================================

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};


// ======================================================
// Validate Company
// ======================================================

const validateCompany = async (companyId) => {
    if (!isValidObjectId(companyId)) {
        throw new Error("Invalid company ID.");
    }

    const company = await Company.findById(companyId);

    if (!company) {
        throw new Error("Company not found.");
    }

    if (company.isActive === false) {
        throw new Error("Company is inactive.");
    }

    return company;
};


// ======================================================
// Create Account
// ======================================================

const createAccount = async (req, res) => {
    try {
        const {
            company,
            accountCode,
            accountName,
            accountType,
            parentAccount,
            description,
            openingBalance,
        } = req.body;

        if (!company) {
            return res.status(400).json({
                success: false,
                message: "Company is required.",
            });
        }

        if (!accountCode) {
            return res.status(400).json({
                success: false,
                message: "Account code is required.",
            });
        }

        if (!accountName) {
            return res.status(400).json({
                success: false,
                message: "Account name is required.",
            });
        }

        const validAccountTypes = [
            "ASSET",
            "LIABILITY",
            "EQUITY",
            "INCOME",
            "EXPENSE",
        ];

        if (!validAccountTypes.includes(accountType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account type.",
            });
        }

        await validateCompany(company);

        // Parent account validation
        if (parentAccount !== undefined && parentAccount !== null) {
            if (!isValidObjectId(parentAccount)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid parent account ID.",
                });
            }

            const parent = await Account.findOne({
                _id: parentAccount,
                company,
            });

            if (!parent) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Parent account not found in this company.",
                });
            }

            if (!parent.isActive) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Parent account is inactive.",
                });
            }
        }

        // Prevent duplicate account code
        const existingAccount = await Account.findOne({
            company,
            accountCode: accountCode.toUpperCase(),
        });

        if (existingAccount) {
            return res.status(409).json({
                success: false,
                message: "Account code already exists.",
            });
        }

        const account = await Account.create({
            company,
            accountCode: accountCode.toUpperCase(),
            accountName,
            accountType,
            parentAccount:
                parentAccount || null,
            description:
                description || "",
            openingBalance:
                openingBalance || 0,
            createdBy: req.user._id,
        });

        const populatedAccount =
            await Account.findById(account._id)
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "parentAccount",
                    "accountCode accountName accountType"
                )
                .populate(
                    "createdBy",
                    "name email role"
                );

        return res.status(201).json({
            success: true,
            message: "Account created successfully.",
            data: populatedAccount,
        });

    } catch (error) {
        console.error(
            "Create Account Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to create account.",
        });
    }
};


// ======================================================
// Get All Accounts
// ======================================================

const getAccounts = async (req, res) => {
    try {
        const {
            company,
            accountType,
            isActive,
            search,
            page = 1,
            limit = 20,
        } = req.query;

        if (!company) {
            return res.status(400).json({
                success: false,
                message: "Company is required.",
            });
        }

        await validateCompany(company);

        const filter = {
            company,
        };

        if (accountType) {
            filter.accountType =
                accountType.toUpperCase();
        }

        if (isActive !== undefined) {
            filter.isActive =
                isActive === "true";
        }

        if (search) {
            filter.$or = [
                {
                    accountCode: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    accountName: {
                        $regex: search,
                        $options: "i",
                    },
                },
            ];
        }

        const pageNumber =
            Math.max(parseInt(page, 10) || 1, 1);

        const limitNumber =
            Math.min(
                Math.max(
                    parseInt(limit, 10) || 20,
                    1
                ),
                100
            );

        const skip =
            (pageNumber - 1) *
            limitNumber;

        const [
            accounts,
            total,
        ] = await Promise.all([
            Account.find(filter)
                .populate(
                    "parentAccount",
                    "accountCode accountName accountType"
                )
                .populate(
                    "createdBy",
                    "name email"
                )
                .sort({
                    accountCode: 1,
                })
                .skip(skip)
                .limit(limitNumber),

            Account.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            data: accounts,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                pages:
                    Math.ceil(
                        total / limitNumber
                    ),
            },
        });

    } catch (error) {
        console.error(
            "Get Accounts Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch accounts.",
        });
    }
};


// ======================================================
// Get Account By ID
// ======================================================

const getAccountById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account ID.",
            });
        }

        const account =
            await Account.findById(id)
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "parentAccount",
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

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: account,
        });

    } catch (error) {
        console.error(
            "Get Account Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch account.",
        });
    }
};


// ======================================================
// Update Account
// ======================================================

const updateAccount = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account ID.",
            });
        }

        const account =
            await Account.findById(id);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found.",
            });
        }

        if (account.isSystemAccount) {
            return res.status(400).json({
                success: false,
                message:
                    "System accounts cannot be modified.",
            });
        }

        const {
            accountName,
            accountType,
            parentAccount,
            description,
            isActive,
            openingBalance,
        } = req.body;

        if (accountName !== undefined) {
            account.accountName =
                accountName.trim();
        }

        if (accountType !== undefined) {
            const validAccountTypes = [
                "ASSET",
                "LIABILITY",
                "EQUITY",
                "INCOME",
                "EXPENSE",
            ];

            if (
                !validAccountTypes.includes(
                    accountType
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid account type.",
                });
            }

            account.accountType =
                accountType;
        }

        if (parentAccount !== undefined) {
            if (
                parentAccount !== null &&
                !isValidObjectId(parentAccount)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid parent account ID.",
                });
            }

            if (parentAccount) {
                const parent =
                    await Account.findOne({
                        _id: parentAccount,
                        company:
                            account.company,
                    });

                if (!parent) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Parent account not found.",
                    });
                }

                if (
                    parent._id.equals(
                        account._id
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "An account cannot be its own parent.",
                    });
                }
            }

            account.parentAccount =
                parentAccount;
        }

        if (description !== undefined) {
            account.description =
                description.trim();
        }

        if (isActive !== undefined) {
            account.isActive =
                Boolean(isActive);
        }

        if (openingBalance !== undefined) {
            if (
                typeof openingBalance !==
                    "number" ||
                openingBalance < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Opening balance must be a valid positive number.",
                });
            }

            account.openingBalance =
                openingBalance;
        }

        account.updatedBy =
            req.user._id;

        await account.save();

        const updatedAccount =
            await Account.findById(account._id)
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "parentAccount",
                    "accountCode accountName accountType"
                )
                .populate(
                    "updatedBy",
                    "name email role"
                );

        return res.status(200).json({
            success: true,
            message:
                "Account updated successfully.",
            data: updatedAccount,
        });

    } catch (error) {
        console.error(
            "Update Account Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to update account.",
        });
    }
};


// ======================================================
// Deactivate Account
// ======================================================

const deactivateAccount = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account ID.",
            });
        }

        const account =
            await Account.findById(id);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found.",
            });
        }

        if (account.isSystemAccount) {
            return res.status(400).json({
                success: false,
                message:
                    "System accounts cannot be deactivated.",
            });
        }

        account.isActive = false;
        account.updatedBy = req.user._id;

        await account.save();

        return res.status(200).json({
            success: true,
            message:
                "Account deactivated successfully.",
        });

    } catch (error) {
        console.error(
            "Deactivate Account Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to deactivate account.",
        });
    }
};


// ======================================================
// Delete Account
// ======================================================

const deleteAccount = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account ID.",
            });
        }

        const account =
            await Account.findById(id);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found.",
            });
        }

        if (account.isSystemAccount) {
            return res.status(400).json({
                success: false,
                message:
                    "System accounts cannot be deleted.",
            });
        }

        const childAccount =
            await Account.findOne({
                parentAccount: account._id,
                isActive: true,
            });

        if (childAccount) {
            return res.status(400).json({
                success: false,
                message:
                    "Cannot delete account while active child accounts exist.",
            });
        }

        await account.deleteOne();

        return res.status(200).json({
            success: true,
            message:
                "Account deleted successfully.",
        });

    } catch (error) {
        console.error(
            "Delete Account Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to delete account.",
        });
    }
};


module.exports = {
    createAccount,
    getAccounts,
    getAccountById,
    updateAccount,
    deactivateAccount,
    deleteAccount,
};