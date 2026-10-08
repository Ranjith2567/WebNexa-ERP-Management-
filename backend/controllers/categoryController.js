const mongoose = require("mongoose");

const Category = require("../models/Category");
const Product = require("../models/Product");

// ==========================================
// CREATE CATEGORY
// ==========================================
const createCategory = async (req, res) => {
    try {
        const {
            company,
            name,
            code,
            description,
            parentCategory,
            isActive,
        } = req.body;

        // Required fields
        if (!company) {
            return res.status(400).json({
                success: false,
                message: "Company is required",
            });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Category name is required",
            });
        }

        if (!code || !code.trim()) {
            return res.status(400).json({
                success: false,
                message: "Category code is required",
            });
        }

        // Validate Company ID
        if (!mongoose.Types.ObjectId.isValid(company)) {
            return res.status(400).json({
                success: false,
                message: "Invalid company ID",
            });
        }

        // Validate Parent Category ID
        if (
            parentCategory &&
            !mongoose.Types.ObjectId.isValid(parentCategory)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid parent category ID",
            });
        }

        const normalizedName = name.trim();
        const normalizedCode = code.trim().toUpperCase();

        // Duplicate name
        const existingName = await Category.findOne({
            company,
            name: normalizedName,
        });

        if (existingName) {
            return res.status(409).json({
                success: false,
                message: "Category with this name already exists",
            });
        }

        // Duplicate code
        const existingCode = await Category.findOne({
            company,
            code: normalizedCode,
        });

        if (existingCode) {
            return res.status(409).json({
                success: false,
                message: "Category with this code already exists",
            });
        }

        // Parent category validation
        if (parentCategory) {
            const parent = await Category.findOne({
                _id: parentCategory,
                company,
            });

            if (!parent) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Parent category not found or does not belong to this company",
                });
            }
        }

        const category = await Category.create({
            company,
            name: normalizedName,
            code: normalizedCode,
            description: description?.trim() || "",
            parentCategory: parentCategory || null,
            isActive:
                isActive !== undefined ? isActive : true,
            createdBy: req.user._id,
        });

        const populatedCategory = await Category.findById(
            category._id
        )
            .populate("company", "name legalName")
            .populate(
                "parentCategory",
                "name code"
            )
            .populate(
                "createdBy",
                "name email role"
            );

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            category: populatedCategory,
        });
    } catch (error) {
        console.error(
            "Create Category Error:",
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Category with this name or code already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create category",
            error: error.message,
        });
    }
};

// ==========================================
// GET ALL CATEGORIES
// ==========================================
const getCategories = async (req, res) => {
    try {
        const {
            company,
            search = "",
            isActive,
            parentCategory,
            page = 1,
            limit = 10,
        } = req.query;

        const filter = {};

        // Company filter
        if (company !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(company)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid company ID",
                });
            }

            filter.company = company;
        }

        // Active filter
        if (isActive !== undefined) {
            filter.isActive = isActive === "true";
        }

        // Parent category filter
        if (parentCategory !== undefined) {
            if (
                parentCategory !== "null" &&
                !mongoose.Types.ObjectId.isValid(parentCategory)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid parent category ID",
                });
            }

            filter.parentCategory =
                parentCategory === "null"
                    ? null
                    : parentCategory;
        }

        // Search
        if (search.trim()) {
            const searchText = search.trim();

            filter.$or = [
                {
                    name: {
                        $regex: searchText,
                        $options: "i",
                    },
                },
                {
                    code: {
                        $regex: searchText,
                        $options: "i",
                    },
                },
                {
                    description: {
                        $regex: searchText,
                        $options: "i",
                    },
                },
            ];
        }

        // Pagination
        const pageNumber = Math.max(
            parseInt(page, 10) || 1,
            1
        );

        const limitNumber = Math.min(
            Math.max(parseInt(limit, 10) || 10, 1),
            100
        );

        const skip =
            (pageNumber - 1) * limitNumber;

        const totalCategories =
            await Category.countDocuments(filter);

        const categories =
            await Category.find(filter)
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "parentCategory",
                    "name code"
                )
                .populate(
                    "createdBy",
                    "name email role"
                )
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber);

        const totalPages = Math.ceil(
            totalCategories / limitNumber
        );

        return res.status(200).json({
            success: true,

            pagination: {
                totalCategories,
                currentPage: pageNumber,
                itemsPerPage: limitNumber,
                totalPages,
                hasNextPage:
                    pageNumber < totalPages,
                hasPreviousPage:
                    pageNumber > 1,
            },

            filters: {
                company: company || null,
                search: search || "",
                isActive:
                    isActive !== undefined
                        ? isActive === "true"
                        : null,
                parentCategory:
                    parentCategory || null,
            },

            count: categories.length,
            categories,
        });
    } catch (error) {
        console.error(
            "Get Categories Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch categories",
            error: error.message,
        });
    }
};

// ==========================================
// GET SINGLE CATEGORY
// ==========================================
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID",
            });
        }

        const category =
            await Category.findById(id)
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "parentCategory",
                    "name code"
                )
                .populate(
                    "createdBy",
                    "name email role"
                );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        return res.status(200).json({
            success: true,
            category,
        });
    } catch (error) {
        console.error(
            "Get Category Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch category",
            error: error.message,
        });
    }
};

// ==========================================
// UPDATE CATEGORY
// ==========================================
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID",
            });
        }

        const category =
            await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        const {
            name,
            code,
            description,
            parentCategory,
            isActive,
        } = req.body;

        // Update name
        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Category name cannot be empty",
                });
            }

            const normalizedName =
                name.trim();

            const existingName =
                await Category.findOne({
                    company: category.company,
                    name: normalizedName,
                    _id: { $ne: category._id },
                });

            if (existingName) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Category with this name already exists",
                });
            }

            category.name = normalizedName;
        }

        // Update code
        if (code !== undefined) {
            if (!code.trim()) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Category code cannot be empty",
                });
            }

            const normalizedCode =
                code.trim().toUpperCase();

            const existingCode =
                await Category.findOne({
                    company: category.company,
                    code: normalizedCode,
                    _id: { $ne: category._id },
                });

            if (existingCode) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Category with this code already exists",
                });
            }

            category.code = normalizedCode;
        }

        // Update description
        if (description !== undefined) {
            category.description =
                description.trim();
        }

        // Update parent category
        if (parentCategory !== undefined) {
            if (parentCategory === null || parentCategory === "") {
                category.parentCategory = null;
            } else {
                if (
                    !mongoose.Types.ObjectId.isValid(
                        parentCategory
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid parent category ID",
                    });
                }

                // Prevent category becoming its own parent
                if (
                    parentCategory.toString() ===
                    category._id.toString()
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Category cannot be its own parent",
                    });
                }

                const parent =
                    await Category.findOne({
                        _id: parentCategory,
                        company: category.company,
                    });

                if (!parent) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Parent category not found or does not belong to this company",
                    });
                }

                category.parentCategory =
                    parentCategory;
            }
        }

        // Update active status
        if (isActive !== undefined) {
            category.isActive = isActive;
        }

        await category.save();

        const updatedCategory =
            await Category.findById(category._id)
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "parentCategory",
                    "name code"
                )
                .populate(
                    "createdBy",
                    "name email role"
                );

        return res.status(200).json({
            success: true,
            message:
                "Category updated successfully",
            category: updatedCategory,
        });
    } catch (error) {
        console.error(
            "Update Category Error:",
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Category with this name or code already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update category",
            error: error.message,
        });
    }
};

// ==========================================
// DELETE CATEGORY
// ==========================================
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID",
            });
        }

        const category =
            await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        // Check products using this category
        const productCount =
            await Product.countDocuments({
                category: category._id,
            });

        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message:
                    `Cannot delete category. ${productCount} product(s) are linked to this category.`,
            });
        }

        // Check child categories
        const childCategoryCount =
            await Category.countDocuments({
                parentCategory: category._id,
            });

        if (childCategoryCount > 0) {
            return res.status(400).json({
                success: false,
                message:
                    `Cannot delete category. ${childCategoryCount} child categor(y/ies) are linked to this category.`,
            });
        }

        await Category.findByIdAndDelete(
            category._id
        );

        return res.status(200).json({
            success: true,
            message:
                "Category deleted successfully",
        });
    } catch (error) {
        console.error(
            "Delete Category Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to delete category",
            error: error.message,
        });
    }
};

module.exports = {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
};