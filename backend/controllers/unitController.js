const mongoose = require("mongoose");
const Unit = require("../models/Unit");
const Product = require("../models/Product");

// ===============================
// Create Unit
// ===============================
const createUnit = async (req, res, next) => {
    try {
        const {
            company,
            name,
            code,
            symbol,
            description,
            isActive,
        } = req.body;

        if (!company) {
            return res.status(400).json({
                success: false,
                message: "Company is required",
            });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Unit name is required",
            });
        }

        if (!code || !code.trim()) {
            return res.status(400).json({
                success: false,
                message: "Unit code is required",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(company)) {
            return res.status(400).json({
                success: false,
                message: "Invalid company ID",
            });
        }

        const normalizedName = name.trim();
        const normalizedCode = code.trim().toUpperCase();

        const existingCode = await Unit.findOne({
            company,
            code: normalizedCode,
        });

        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: "Unit code already exists",
            });
        }

        const existingName = await Unit.findOne({
            company,
            name: normalizedName,
        });

        if (existingName) {
            return res.status(400).json({
                success: false,
                message: "Unit name already exists",
            });
        }

        const unit = await Unit.create({
            company,
            name: normalizedName,
            code: normalizedCode,
            symbol: symbol?.trim() || "",
            description: description?.trim() || "",
            isActive:
                typeof isActive === "boolean"
                    ? isActive
                    : true,
            createdBy: req.user._id,
        });

        await unit.populate([
            {
                path: "company",
                select: "name legalName",
            },
            {
                path: "createdBy",
                select: "name email",
            },
        ]);

        res.status(201).json({
            success: true,
            message: "Unit created successfully",
            unit,
        });
    } catch (error) {
        next(error);
    }
};

// ===============================
// Get All Units
// ===============================
const getUnits = async (req, res, next) => {
    try {
        const {
            company,
            search,
            isActive,
            page = 1,
            limit = 10,
        } = req.query;

        const filter = {};

        if (company) {
            if (!mongoose.Types.ObjectId.isValid(company)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid company ID",
                });
            }

            filter.company = company;
        }

        if (search) {
            const searchRegex = new RegExp(
                search.trim(),
                "i"
            );

            filter.$or = [
                { name: searchRegex },
                { code: searchRegex },
                { symbol: searchRegex },
                { description: searchRegex },
            ];
        }

        if (isActive !== undefined) {
            filter.isActive = isActive === "true";
        }

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

        const [units, total] = await Promise.all([
            Unit.find(filter)
                .populate("company", "name legalName")
                .populate("createdBy", "name email")
                .sort({ name: 1 })
                .skip(skip)
                .limit(currentLimit),

            Unit.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            count: units.length,
            pagination: {
                page: currentPage,
                limit: currentLimit,
                total,
                pages: Math.ceil(
                    total / currentLimit
                ),
            },
            units,
        });
    } catch (error) {
        next(error);
    }
};

// ===============================
// Get Unit By ID
// ===============================
const getUnitById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid unit ID",
            });
        }

        const unit = await Unit.findById(id)
            .populate(
                "company",
                "name legalName"
            )
            .populate(
                "createdBy",
                "name email"
            );

        if (!unit) {
            return res.status(404).json({
                success: false,
                message: "Unit not found",
            });
        }

        res.status(200).json({
            success: true,
            unit,
        });
    } catch (error) {
        next(error);
    }
};

// ===============================
// Update Unit
// ===============================
const updateUnit = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid unit ID",
            });
        }

        const unit = await Unit.findById(id);

        if (!unit) {
            return res.status(404).json({
                success: false,
                message: "Unit not found",
            });
        }

        const {
            name,
            code,
            symbol,
            description,
            isActive,
        } = req.body;

        if (name !== undefined) {
            const normalizedName = name.trim();

            if (!normalizedName) {
                return res.status(400).json({
                    success: false,
                    message: "Unit name cannot be empty",
                });
            }

            const duplicateName =
                await Unit.findOne({
                    company: unit.company,
                    name: normalizedName,
                    _id: { $ne: id },
                });

            if (duplicateName) {
                return res.status(400).json({
                    success: false,
                    message: "Unit name already exists",
                });
            }

            unit.name = normalizedName;
        }

        if (code !== undefined) {
            const normalizedCode =
                code.trim().toUpperCase();

            if (!normalizedCode) {
                return res.status(400).json({
                    success: false,
                    message: "Unit code cannot be empty",
                });
            }

            const duplicateCode =
                await Unit.findOne({
                    company: unit.company,
                    code: normalizedCode,
                    _id: { $ne: id },
                });

            if (duplicateCode) {
                return res.status(400).json({
                    success: false,
                    message: "Unit code already exists",
                });
            }

            unit.code = normalizedCode;
        }

        if (symbol !== undefined) {
            unit.symbol = symbol.trim();
        }

        if (description !== undefined) {
            unit.description =
                description.trim();
        }

        if (isActive !== undefined) {
            unit.isActive = isActive;
        }

        await unit.save();

        await unit.populate([
            {
                path: "company",
                select: "name legalName",
            },
            {
                path: "createdBy",
                select: "name email",
            },
        ]);

        res.status(200).json({
            success: true,
            message: "Unit updated successfully",
            unit,
        });
    } catch (error) {
        next(error);
    }
};

// ===============================
// Delete Unit
// ===============================
const deleteUnit = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid unit ID",
            });
        }

        const unit = await Unit.findById(id);

        if (!unit) {
            return res.status(404).json({
                success: false,
                message: "Unit not found",
            });
        }

        const productCount =
            await Product.countDocuments({
                unit: unit._id,
            });

        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message:
                    `Cannot delete unit. ${productCount} product(s) are linked to this unit.`,
            });
        }

        await unit.deleteOne();

        res.status(200).json({
            success: true,
            message: "Unit deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createUnit,
    getUnits,
    getUnitById,
    updateUnit,
    deleteUnit,
};