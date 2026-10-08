const mongoose = require("mongoose");

const Warehouse = require("../models/Warehouse");
const Company = require("../models/Company");
const Branch = require("../models/Branch");
const User = require("../models/User");

// ======================================
// Create Warehouse
// ======================================
const createWarehouse = async (req, res) => {
    try {
        const {
            company,
            branch,
            name,
            code,
            description,
            address,
            manager,
            capacity,
            isMainWarehouse,
            isActive,
        } = req.body;

        if (!company || !branch || !name || !code) {
            return res.status(400).json({
                success: false,
                message:
                    "Company, branch, name and code are required",
            });
        }

        // Validate Company ID
        if (!mongoose.Types.ObjectId.isValid(company)) {
            return res.status(400).json({
                success: false,
                message: "Invalid company ID",
            });
        }

        // Validate Branch ID
        if (!mongoose.Types.ObjectId.isValid(branch)) {
            return res.status(400).json({
                success: false,
                message: "Invalid branch ID",
            });
        }

        // Check Company
        const companyExists = await Company.findById(company);

        if (!companyExists) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        // Check Branch
        const branchExists = await Branch.findOne({
            _id: branch,
            company,
        });

        if (!branchExists) {
            return res.status(400).json({
                success: false,
                message:
                    "Branch does not belong to the selected company",
            });
        }

        // Validate Manager
        if (manager) {
            if (!mongoose.Types.ObjectId.isValid(manager)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid manager ID",
                });
            }

            const managerExists = await User.findOne({
                _id: manager,
                company,
            });

            if (!managerExists) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Manager does not belong to the selected company",
                });
            }
        }

        // Duplicate name
        const duplicateName = await Warehouse.findOne({
            company,
            name: name.trim(),
        });

        if (duplicateName) {
            return res.status(409).json({
                success: false,
                message:
                    "Warehouse name already exists in this company",
            });
        }

        // Duplicate code
        const duplicateCode = await Warehouse.findOne({
            company,
            code: code.trim().toUpperCase(),
        });

        if (duplicateCode) {
            return res.status(409).json({
                success: false,
                message:
                    "Warehouse code already exists in this company",
            });
        }

        const warehouse = await Warehouse.create({
            company,
            branch,
            name: name.trim(),
            code: code.trim().toUpperCase(),
            description: description?.trim() || "",
            address: address || {},
            manager: manager || null,
            capacity: capacity ?? 0,
            isMainWarehouse: isMainWarehouse ?? false,
            isActive: isActive ?? true,
            createdBy: req.user._id,
        });

        const populatedWarehouse =
            await Warehouse.findById(warehouse._id)
                .populate("company", "name")
                .populate("branch", "name branchCode")
                .populate("manager", "name email employeeId")
                .populate("createdBy", "name email");

        res.status(201).json({
            success: true,
            message: "Warehouse created successfully",
            warehouse: populatedWarehouse,
        });
    } catch (error) {
        console.error(
            "Create Warehouse Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ======================================
// Get All Warehouses
// ======================================
const getWarehouses = async (req, res) => {
    try {
        const {
            search = "",
            company,
            branch,
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

        if (branch) {
            if (!mongoose.Types.ObjectId.isValid(branch)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid branch ID",
                });
            }

            filter.branch = branch;
        }

        if (isActive !== undefined) {
            filter.isActive = isActive === "true";
        }

        if (search.trim()) {
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
                {
                    "address.city": {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
            ];
        }

        const pageNumber = Math.max(
            parseInt(page) || 1,
            1
        );

        const limitNumber = Math.min(
            Math.max(parseInt(limit) || 10, 1),
            100
        );

        const skip =
            (pageNumber - 1) * limitNumber;

        const [warehouses, total] =
            await Promise.all([
                Warehouse.find(filter)
                    .populate("company", "name")
                    .populate(
                        "branch",
                        "name branchCode"
                    )
                    .populate(
                        "manager",
                        "name email employeeId"
                    )
                    .populate(
                        "createdBy",
                        "name email"
                    )
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limitNumber),

                Warehouse.countDocuments(filter),
            ]);

        res.status(200).json({
            success: true,
            count: warehouses.length,
            total,
            page: pageNumber,
            pages: Math.ceil(
                total / limitNumber
            ),
            warehouses,
        });
    } catch (error) {
        console.error(
            "Get Warehouses Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ======================================
// Get Warehouse By ID
// ======================================
const getWarehouseById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid warehouse ID",
            });
        }

        const warehouse =
            await Warehouse.findById(id)
                .populate("company", "name")
                .populate(
                    "branch",
                    "name branchCode"
                )
                .populate(
                    "manager",
                    "name email employeeId"
                )
                .populate(
                    "createdBy",
                    "name email"
                );

        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: "Warehouse not found",
            });
        }

        res.status(200).json({
            success: true,
            warehouse,
        });
    } catch (error) {
        console.error(
            "Get Warehouse Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ======================================
// Update Warehouse
// ======================================
const updateWarehouse = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid warehouse ID",
            });
        }

        const warehouse =
            await Warehouse.findById(id);

        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: "Warehouse not found",
            });
        }

        const {
            branch,
            name,
            code,
            description,
            address,
            manager,
            capacity,
            isMainWarehouse,
            isActive,
        } = req.body;

        // Branch validation
        if (branch) {
            if (!mongoose.Types.ObjectId.isValid(branch)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid branch ID",
                });
            }

            const branchExists =
                await Branch.findOne({
                    _id: branch,
                    company: warehouse.company,
                });

            if (!branchExists) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Branch does not belong to this company",
                });
            }

            warehouse.branch = branch;
        }

        // Name validation
        if (name !== undefined) {
            const duplicateName =
                await Warehouse.findOne({
                    company: warehouse.company,
                    name: name.trim(),
                    _id: { $ne: id },
                });

            if (duplicateName) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Warehouse name already exists in this company",
                });
            }

            warehouse.name = name.trim();
        }

        // Code validation
        if (code !== undefined) {
            const normalizedCode =
                code.trim().toUpperCase();

            const duplicateCode =
                await Warehouse.findOne({
                    company: warehouse.company,
                    code: normalizedCode,
                    _id: { $ne: id },
                });

            if (duplicateCode) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Warehouse code already exists in this company",
                });
            }

            warehouse.code = normalizedCode;
        }

        // Manager validation
        if (manager !== undefined) {
            if (manager === null || manager === "") {
                warehouse.manager = null;
            } else {
                if (
                    !mongoose.Types.ObjectId.isValid(
                        manager
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid manager ID",
                    });
                }

                const managerExists =
                    await User.findOne({
                        _id: manager,
                        company: warehouse.company,
                    });

                if (!managerExists) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Manager does not belong to this company",
                    });
                }

                warehouse.manager = manager;
            }
        }

        if (description !== undefined) {
            warehouse.description =
                description.trim();
        }

        if (address !== undefined) {
            warehouse.address = address;
        }

        if (capacity !== undefined) {
            warehouse.capacity = capacity;
        }

        if (isMainWarehouse !== undefined) {
            warehouse.isMainWarehouse =
                isMainWarehouse;
        }

        if (isActive !== undefined) {
            warehouse.isActive = isActive;
        }

        await warehouse.save();

        const updatedWarehouse =
            await Warehouse.findById(id)
                .populate("company", "name")
                .populate(
                    "branch",
                    "name branchCode"
                )
                .populate(
                    "manager",
                    "name email employeeId"
                )
                .populate(
                    "createdBy",
                    "name email"
                );

        res.status(200).json({
            success: true,
            message: "Warehouse updated successfully",
            warehouse: updatedWarehouse,
        });
    } catch (error) {
        console.error(
            "Update Warehouse Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ======================================
// Delete Warehouse
// ======================================
const deleteWarehouse = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid warehouse ID",
            });
        }

        const warehouse =
            await Warehouse.findById(id);

        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: "Warehouse not found",
            });
        }

        await Warehouse.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Warehouse deleted successfully",
        });
    } catch (error) {
        console.error(
            "Delete Warehouse Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createWarehouse,
    getWarehouses,
    getWarehouseById,
    updateWarehouse,
    deleteWarehouse,
};