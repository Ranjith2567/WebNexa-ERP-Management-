const mongoose = require("mongoose");

const ExpenseCategory = require("../models/ExpenseCategory");
const Company = require("../models/Company");
const Branch = require("../models/Branch");

// ======================================================
// CREATE EXPENSE CATEGORY
// ======================================================

const createExpenseCategory = async (req, res) => {
    try {
        const {
            company,
            branch,
            name,
            code,
            description,
            parentCategory,
        } = req.body;

        const createdBy = req.user._id;

        // ------------------------------------------
        // Required fields
        // ------------------------------------------

        if (!company || !branch || !name || !code) {
            return res.status(400).json({
                success: false,
                message:
                    "Company, branch, name and code are required.",
            });
        }

        // ------------------------------------------
        // Validate ObjectIds
        // ------------------------------------------

        if (
            !mongoose.Types.ObjectId.isValid(company) ||
            !mongoose.Types.ObjectId.isValid(branch)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid company or branch ID.",
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
        // Validate parent category
        // ------------------------------------------

        let parentCategoryData = null;

        if (parentCategory) {
            // Validate parent category ObjectId
            if (
                !mongoose.Types.ObjectId.isValid(
                    parentCategory
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid parent category ID.",
                });
            }

            // Parent must belong to same company + branch
            // and must be active
            parentCategoryData =
                await ExpenseCategory.findOne({
                    _id: parentCategory,
                    company,
                    branch,
                    isActive: true,
                });

            if (!parentCategoryData) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Active parent expense category not found.",
                });
            }
        }

        // ------------------------------------------
        // Normalize name and code
        // ------------------------------------------

        const normalizedName = name.trim();

        const normalizedCode = code
            .trim()
            .toUpperCase();

        if (!normalizedName) {
            return res.status(400).json({
                success: false,
                message: "Category name cannot be empty.",
            });
        }

        if (!normalizedCode) {
            return res.status(400).json({
                success: false,
                message: "Category code cannot be empty.",
            });
        }

        // ------------------------------------------
        // Check duplicate name
        // ------------------------------------------

        const existingName =
            await ExpenseCategory.findOne({
                company,
                branch,
                name: normalizedName,
            });

        if (existingName) {
            return res.status(409).json({
                success: false,
                message:
                    "Expense category with this name already exists in this branch.",
            });
        }

        // ------------------------------------------
        // Check duplicate code
        // ------------------------------------------

        const existingCode =
            await ExpenseCategory.findOne({
                company,
                branch,
                code: normalizedCode,
            });

        if (existingCode) {
            return res.status(409).json({
                success: false,
                message:
                    "Expense category with this code already exists in this branch.",
            });
        }

        // ------------------------------------------
        // Create category
        // ------------------------------------------

        const category =
            await ExpenseCategory.create({
                company,
                branch,
                name: normalizedName,
                code: normalizedCode,
                description: description
                    ? description.trim()
                    : "",
                parentCategory:
                    parentCategory || null,
                isActive: true,
                createdBy,
                updatedBy: createdBy,
            });

        // ------------------------------------------
        // Populate response
        // ------------------------------------------

        const populatedCategory =
            await ExpenseCategory.findById(
                category._id
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
                    "parentCategory",
                    "name code"
                )
                .populate(
                    "createdBy",
                    "name email role"
                )
                .populate(
                    "updatedBy",
                    "name email role"
                );

        return res.status(201).json({
            success: true,
            message:
                "Expense category created successfully.",
            data: populatedCategory,
        });
    } catch (error) {
        console.error(
            "Create Expense Category Error:",
            error
        );

        // MongoDB duplicate key protection
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Expense category name or code already exists in this branch.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to create expense category.",
        });
    }
};

// ======================================================
// GET ALL EXPENSE CATEGORIES
// ======================================================

const getExpenseCategories = async (req, res) => {
    try {
        const {
            company,
            branch,
            isActive,
            search,
            page = 1,
            limit = 10,
        } = req.query;

        const filter = {};

        // ------------------------------------------
        // Company filter
        // ------------------------------------------

        if (company) {
            if (
                !mongoose.Types.ObjectId.isValid(company)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid company ID.",
                });
            }

            filter.company = company;
        }

        // ------------------------------------------
        // Branch filter
        // ------------------------------------------

        if (branch) {
            if (
                !mongoose.Types.ObjectId.isValid(branch)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid branch ID.",
                });
            }

            filter.branch = branch;
        }

        // ------------------------------------------
        // Active filter
        // ------------------------------------------

        if (isActive !== undefined) {
            filter.isActive =
                isActive === "true";
        }

        // ------------------------------------------
        // Search
        // ------------------------------------------

        if (search && search.trim()) {
            filter.$or = [
                {
                    name: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
                {
                    code: {
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
            ];
        }

        // ------------------------------------------
        // Pagination
        // ------------------------------------------

        const currentPage = Math.max(
            Number(page) || 1,
            1
        );

        const perPage = Math.min(
            Math.max(Number(limit) || 10, 1),
            100
        );

        const skip =
            (currentPage - 1) * perPage;

        const [categories, total] =
            await Promise.all([
                ExpenseCategory.find(filter)
                    .populate(
                        "company",
                        "name legalName"
                    )
                    .populate(
                        "branch",
                        "name branchCode"
                    )
                    .populate(
                        "parentCategory",
                        "name code"
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
                        name: 1,
                    })
                    .skip(skip)
                    .limit(perPage),

                ExpenseCategory.countDocuments(
                    filter
                ),
            ]);

        const totalPages = Math.ceil(
            total / perPage
        );

        return res.status(200).json({
            success: true,
            data: categories,
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
            "Get Expense Categories Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch expense categories.",
        });
    }
};

// ======================================================
// GET SINGLE EXPENSE CATEGORY
// ======================================================

const getExpenseCategoryById = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        // ------------------------------------------
        // Validate ID
        // ------------------------------------------

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid expense category ID.",
            });
        }

        // ------------------------------------------
        // Find category
        // ------------------------------------------

        const category =
            await ExpenseCategory.findById(id)
                .populate(
                    "company",
                    "name legalName email phone"
                )
                .populate(
                    "branch",
                    "name branchCode email"
                )
                .populate(
                    "parentCategory",
                    "name code description"
                )
                .populate(
                    "createdBy",
                    "name email role"
                )
                .populate(
                    "updatedBy",
                    "name email role"
                );

        if (!category) {
            return res.status(404).json({
                success: false,
                message:
                    "Expense category not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: category,
        });
    } catch (error) {
        console.error(
            "Get Expense Category Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch expense category.",
        });
    }
};

// ======================================================
// UPDATE EXPENSE CATEGORY
// ======================================================

const updateExpenseCategory = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const {
            name,
            code,
            description,
            parentCategory,
            isActive,
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
                    "Invalid expense category ID.",
            });
        }

        // ------------------------------------------
        // Find category
        // ------------------------------------------

        const category =
            await ExpenseCategory.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message:
                    "Expense category not found.",
            });
        }

        // ------------------------------------------
        // Update name
        // ------------------------------------------

        if (name !== undefined) {
            const normalizedName =
                name.trim();

            if (!normalizedName) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Category name cannot be empty.",
                });
            }

            const duplicateName =
                await ExpenseCategory.findOne({
                    company:
                        category.company,
                    branch:
                        category.branch,
                    name: normalizedName,
                    _id: {
                        $ne: id,
                    },
                });

            if (duplicateName) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Another expense category with this name already exists.",
                });
            }

            category.name = normalizedName;
        }

        // ------------------------------------------
        // Update code
        // ------------------------------------------

        if (code !== undefined) {
            const normalizedCode =
                code.trim().toUpperCase();

            if (!normalizedCode) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Category code cannot be empty.",
                });
            }

            const duplicateCode =
                await ExpenseCategory.findOne({
                    company:
                        category.company,
                    branch:
                        category.branch,
                    code: normalizedCode,
                    _id: {
                        $ne: id,
                    },
                });

            if (duplicateCode) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Another expense category with this code already exists.",
                });
            }

            category.code = normalizedCode;
        }

        // ------------------------------------------
        // Update description
        // ------------------------------------------

        if (description !== undefined) {
            category.description =
                description.trim();
        }

        // ------------------------------------------
        // Update parent category
        // ------------------------------------------

        if (parentCategory !== undefined) {
            if (
                parentCategory === null ||
                parentCategory === ""
            ) {
                category.parentCategory = null;
            } else {
                // Validate parent ID
                if (
                    !mongoose.Types.ObjectId.isValid(
                        parentCategory
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid parent category ID.",
                    });
                }

                // Cannot be own parent
                if (
                    parentCategory.toString() ===
                    id.toString()
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "A category cannot be its own parent.",
                    });
                }

                // Parent must belong to same
                // company + branch
                const parent =
                    await ExpenseCategory.findOne({
                        _id: parentCategory,
                        company:
                            category.company,
                        branch:
                            category.branch,
                        isActive: true,
                    });

                if (!parent) {
                    return res.status(404).json({
                        success: false,
                        message:
                            "Active parent expense category not found.",
                    });
                }

                category.parentCategory =
                    parentCategory;
            }
        }

        // ------------------------------------------
        // Update active status
        // ------------------------------------------

        if (isActive !== undefined) {
            category.isActive = Boolean(
                isActive
            );
        }

        category.updatedBy = updatedBy;

        await category.save();

        // ------------------------------------------
        // Populate updated category
        // ------------------------------------------

        const populatedCategory =
            await ExpenseCategory.findById(
                category._id
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
                    "parentCategory",
                    "name code"
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
                "Expense category updated successfully.",
            data: populatedCategory,
        });
    } catch (error) {
        console.error(
            "Update Expense Category Error:",
            error
        );

        // MongoDB duplicate key protection
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Expense category name or code already exists in this branch.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to update expense category.",
        });
    }
};

// ======================================================
// DELETE EXPENSE CATEGORY
// ======================================================

const deleteExpenseCategory = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        // ------------------------------------------
        // Validate ID
        // ------------------------------------------

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid expense category ID.",
            });
        }

        // ------------------------------------------
        // Find category
        // ------------------------------------------

        const category =
            await ExpenseCategory.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message:
                    "Expense category not found.",
            });
        }

        // ------------------------------------------
        // Check child categories
        // ------------------------------------------

        const childCategory =
            await ExpenseCategory.findOne({
                parentCategory: id,
                isActive: true,
            });

        if (childCategory) {
            return res.status(400).json({
                success: false,
                message:
                    "Cannot delete category because it has active child categories.",
            });
        }

        // ------------------------------------------
        // Soft delete
        // ------------------------------------------

        category.isActive = false;
        category.updatedBy = req.user._id;

        await category.save();

        return res.status(200).json({
            success: true,
            message:
                "Expense category deactivated successfully.",
        });
    } catch (error) {
        console.error(
            "Delete Expense Category Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to delete expense category.",
        });
    }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    createExpenseCategory,
    getExpenseCategories,
    getExpenseCategoryById,
    updateExpenseCategory,
    deleteExpenseCategory,
};