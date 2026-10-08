const mongoose = require("mongoose");

const Brand = require("../models/Brand");
const Product = require("../models/Product");

// =====================================================
// CREATE BRAND
// POST /api/brands
// =====================================================
const createBrand = async (req, res) => {
    try {
        const {
            company,
            name,
            code,
            description,
            logo,
            website,
            isActive,
        } = req.body;

        // -----------------------------
        // Required fields
        // -----------------------------
        if (!company) {
            return res.status(400).json({
                success: false,
                message: "Company is required",
            });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Brand name is required",
            });
        }

        if (!code || !code.trim()) {
            return res.status(400).json({
                success: false,
                message: "Brand code is required",
            });
        }

        // -----------------------------
        // Validate Company ID
        // -----------------------------
        if (!mongoose.Types.ObjectId.isValid(company)) {
            return res.status(400).json({
                success: false,
                message: "Invalid company ID",
            });
        }

        const normalizedName = name.trim();
        const normalizedCode = code.trim().toUpperCase();

        // -----------------------------
        // Duplicate code check
        // -----------------------------
        const existingCode = await Brand.findOne({
            company,
            code: normalizedCode,
        });

        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: "Brand code already exists",
            });
        }

        // -----------------------------
        // Duplicate name check
        // -----------------------------
        const existingName = await Brand.findOne({
            company,
            name: normalizedName,
        });

        if (existingName) {
            return res.status(400).json({
                success: false,
                message: "Brand name already exists",
            });
        }

        // -----------------------------
        // Create Brand
        // -----------------------------
        const brand = await Brand.create({
            company,
            name: normalizedName,
            code: normalizedCode,
            description: description?.trim() || "",
            logo: logo?.trim() || "",
            website: website?.trim() || "",
            isActive:
                typeof isActive === "boolean"
                    ? isActive
                    : true,
            createdBy: req.user._id,
        });

        // -----------------------------
        // Populate response
        // -----------------------------
        const populatedBrand = await Brand.findById(
            brand._id
        )
            .populate("company", "name legalName")
            .populate("createdBy", "name email");

        return res.status(201).json({
            success: true,
            message: "Brand created successfully",
            brand: populatedBrand,
        });
    } catch (error) {
        console.error("Create Brand Error:", error);

        // Duplicate MongoDB index error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Brand name or code already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create brand",
            error: error.message,
        });
    }
};

// =====================================================
// GET ALL BRANDS
// GET /api/brands
// =====================================================
const getBrands = async (req, res) => {
    try {
        const {
            company,
            search,
            isActive,
            page = 1,
            limit = 10,
        } = req.query;

        // -----------------------------
        // Build filter
        // -----------------------------
        const filter = {};

        // Company filter
        if (company) {
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
            if (
                isActive !== "true" &&
                isActive !== "false"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "isActive must be true or false",
                });
            }

            filter.isActive = isActive === "true";
        }

        // Search
        if (search && search.trim()) {
            const searchRegex = new RegExp(
                search.trim(),
                "i"
            );

            filter.$or = [
                { name: searchRegex },
                { code: searchRegex },
                { description: searchRegex },
            ];
        }

        // -----------------------------
        // Pagination
        // -----------------------------
        const currentPage = Math.max(
            parseInt(page, 10) || 1,
            1
        );

        const currentLimit = Math.min(
            Math.max(parseInt(limit, 10) || 10, 1),
            100
        );

        const skip =
            (currentPage - 1) * currentLimit;

        // -----------------------------
        // Query
        // -----------------------------
        const [brands, total] = await Promise.all([
            Brand.find(filter)
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "createdBy",
                    "name email"
                )
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(currentLimit),

            Brand.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(
            total / currentLimit
        );

        return res.status(200).json({
            success: true,
            count: brands.length,
            total,
            pagination: {
                page: currentPage,
                limit: currentLimit,
                totalPages,
                hasNextPage:
                    currentPage < totalPages,
                hasPreviousPage:
                    currentPage > 1,
            },
            brands,
        });
    } catch (error) {
        console.error("Get Brands Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch brands",
            error: error.message,
        });
    }
};

// =====================================================
// GET BRAND BY ID
// GET /api/brands/:id
// =====================================================
const getBrandById = async (req, res) => {
    try {
        const { id } = req.params;

        // -----------------------------
        // Validate ID
        // -----------------------------
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid brand ID",
            });
        }

        // -----------------------------
        // Find Brand
        // -----------------------------
        const brand = await Brand.findById(id)
            .populate(
                "company",
                "name legalName"
            )
            .populate(
                "createdBy",
                "name email"
            );

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: "Brand not found",
            });
        }

        return res.status(200).json({
            success: true,
            brand,
        });
    } catch (error) {
        console.error(
            "Get Brand By ID Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch brand",
            error: error.message,
        });
    }
};

// =====================================================
// UPDATE BRAND
// PUT /api/brands/:id
// =====================================================
const updateBrand = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            code,
            description,
            logo,
            website,
            isActive,
        } = req.body;

        // -----------------------------
        // Validate ID
        // -----------------------------
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid brand ID",
            });
        }

        // -----------------------------
        // Find Brand
        // -----------------------------
        const brand = await Brand.findById(id);

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: "Brand not found",
            });
        }

        // -----------------------------
        // Update Name
        // -----------------------------
        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Brand name cannot be empty",
                });
            }

            const normalizedName = name.trim();

            const duplicateName =
                await Brand.findOne({
                    company: brand.company,
                    name: normalizedName,
                    _id: { $ne: brand._id },
                });

            if (duplicateName) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Brand name already exists",
                });
            }

            brand.name = normalizedName;
        }

        // -----------------------------
        // Update Code
        // -----------------------------
        if (code !== undefined) {
            if (!code.trim()) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Brand code cannot be empty",
                });
            }

            const normalizedCode =
                code.trim().toUpperCase();

            const duplicateCode =
                await Brand.findOne({
                    company: brand.company,
                    code: normalizedCode,
                    _id: { $ne: brand._id },
                });

            if (duplicateCode) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Brand code already exists",
                });
            }

            brand.code = normalizedCode;
        }

        // -----------------------------
        // Update Description
        // -----------------------------
        if (description !== undefined) {
            brand.description =
                description?.trim() || "";
        }

        // -----------------------------
        // Update Logo
        // -----------------------------
        if (logo !== undefined) {
            brand.logo = logo?.trim() || "";
        }

        // -----------------------------
        // Update Website
        // -----------------------------
        if (website !== undefined) {
            brand.website =
                website?.trim() || "";
        }

        // -----------------------------
        // Update Active Status
        // -----------------------------
        if (isActive !== undefined) {
            if (typeof isActive !== "boolean") {
                return res.status(400).json({
                    success: false,
                    message:
                        "isActive must be boolean",
                });
            }

            brand.isActive = isActive;
        }

        // -----------------------------
        // Save
        // -----------------------------
        await brand.save();

        // -----------------------------
        // Populate
        // -----------------------------
        const updatedBrand =
            await Brand.findById(brand._id)
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "createdBy",
                    "name email"
                );

        return res.status(200).json({
            success: true,
            message: "Brand updated successfully",
            brand: updatedBrand,
        });
    } catch (error) {
        console.error("Update Brand Error:", error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message:
                    "Brand name or code already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update brand",
            error: error.message,
        });
    }
};

// =====================================================
// DELETE BRAND
// DELETE /api/brands/:id
// =====================================================
const deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;

        // -----------------------------
        // Validate ID
        // -----------------------------
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid brand ID",
            });
        }

        // -----------------------------
        // Find Brand
        // -----------------------------
        const brand = await Brand.findById(id);

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: "Brand not found",
            });
        }

        // -----------------------------
        // Product Dependency Check
        // -----------------------------
        const productCount =
            await Product.countDocuments({
                brand: brand._id,
            });

        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message:
                    `Cannot delete brand. ${productCount} product(s) are linked to this brand.`,
            });
        }

        // -----------------------------
        // Delete Brand
        // -----------------------------
        await Brand.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Brand deleted successfully",
        });
    } catch (error) {
        console.error("Delete Brand Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete brand",
            error: error.message,
        });
    }
};

// =====================================================
// EXPORT CONTROLLERS
// =====================================================
module.exports = {
    createBrand,
    getBrands,
    getBrandById,
    updateBrand,
    deleteBrand,
};