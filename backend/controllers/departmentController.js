const Department = require("../models/Department");
const User = require("../models/User");
const Company = require("../models/Company");
const Branch = require("../models/Branch");

// ==========================================
// CREATE DEPARTMENT
// ==========================================
const createDepartment = async (req, res) => {
    try {
        const {
            company,
            branch,
            name,
            code,
            description,
            head,
            isActive,
        } = req.body;

        // Required fields
        if (!company || !name || !code) {
            return res.status(400).json({
                success: false,
                message:
                    "Company, name and code are required",
            });
        }

        // Check company
        const companyExists =
            await Company.findById(company);

        if (!companyExists) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        // Check branch belongs to company
        if (branch) {
            const branchExists =
                await Branch.findOne({
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
        }

        // Check department head belongs to company
        if (head) {
            const headExists =
                await User.findOne({
                    _id: head,
                    company,
                });

            if (!headExists) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Department head does not belong to the selected company",
                });
            }
        }

        // Check duplicate department
        const existingDepartment =
            await Department.findOne({
                company,
                $or: [
                    {
                        name: name.trim(),
                    },
                    {
                        code: code
                            .trim()
                            .toUpperCase(),
                    },
                ],
            });

        if (existingDepartment) {
            return res.status(409).json({
                success: false,
                message:
                    "Department name or code already exists",
            });
        }

        // Create department
        const department =
            await Department.create({
                company,
                branch: branch || null,
                name: name.trim(),
                code: code.trim().toUpperCase(),
                description: description || "",
                head: head || null,
                isActive:
                    isActive !== undefined
                        ? isActive
                        : true,
                createdBy: req.user._id,
            });

        // Populate response
        const populatedDepartment =
            await Department.findById(
                department._id
            )
                .populate("company", "name")
                .populate(
                    "branch",
                    "name branchCode"
                )
                .populate(
                    "head",
                    "name email employeeId designation"
                )
                .populate(
                    "createdBy",
                    "name email"
                );

        return res.status(201).json({
            success: true,
            message:
                "Department created successfully",
            department:
                populatedDepartment,
        });
    } catch (error) {
        console.error(
            "Create Department Error:",
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Department name or code already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to create department",
            error: error.message,
        });
    }
};

// ==========================================
// GET ALL DEPARTMENTS
// ==========================================
const getDepartments = async (req, res) => {
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

        // Company filter
        if (company) {
            filter.company = company;
        }

        // Branch filter
        if (branch) {
            filter.branch = branch;
        }

        // Active status filter
        if (isActive !== undefined) {
            filter.isActive =
                isActive === "true";
        }

        // Search
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
            ];
        }

        // Pagination
        const currentPage = Math.max(
            parseInt(page, 10) || 1,
            1
        );

        const itemsPerPage = Math.min(
            Math.max(
                parseInt(limit, 10) || 10,
                1
            ),
            100
        );

        const skip =
            (currentPage - 1) *
            itemsPerPage;

        // Total count
        const totalDepartments =
            await Department.countDocuments(
                filter
            );

        // Get departments
        const departments =
            await Department.find(filter)
                .populate("company", "name")
                .populate(
                    "branch",
                    "name branchCode"
                )
                .populate(
                    "head",
                    "name email employeeId designation"
                )
                .populate(
                    "createdBy",
                    "name email"
                )
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(itemsPerPage);

        const totalPages = Math.ceil(
            totalDepartments /
                itemsPerPage
        );

        return res.status(200).json({
            success: true,

            pagination: {
                totalDepartments,
                currentPage,
                itemsPerPage,
                totalPages,
                hasNextPage:
                    currentPage <
                    totalPages,
                hasPreviousPage:
                    currentPage > 1,
            },

            departments,
        });
    } catch (error) {
        console.error(
            "Get Departments Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch departments",
            error: error.message,
        });
    }
};

// ==========================================
// GET DEPARTMENT BY ID
// ==========================================
const getDepartmentById = async (
    req,
    res
) => {
    try {
        const department =
            await Department.findById(
                req.params.id
            )
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "branch",
                    "name branchCode"
                )
                .populate(
                    "head",
                    "name email phone employeeId designation"
                )
                .populate(
                    "createdBy",
                    "name email"
                );

        if (!department) {
            return res.status(404).json({
                success: false,
                message:
                    "Department not found",
            });
        }

        return res.status(200).json({
            success: true,
            department,
        });
    } catch (error) {
        console.error(
            "Get Department Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch department",
            error: error.message,
        });
    }
};

// ==========================================
// UPDATE DEPARTMENT
// ==========================================
const updateDepartment = async (
    req,
    res
) => {
    try {
        const department =
            await Department.findById(
                req.params.id
            );

        if (!department) {
            return res.status(404).json({
                success: false,
                message:
                    "Department not found",
            });
        }

        const {
            branch,
            name,
            code,
            description,
            head,
            isActive,
        } = req.body;

        // ==============================
        // BRANCH UPDATE
        // ==============================
        if (branch !== undefined) {
            if (branch) {
                const branchExists =
                    await Branch.findOne({
                        _id: branch,
                        company:
                            department.company,
                    });

                if (!branchExists) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Branch does not belong to department company",
                    });
                }
            }

            department.branch =
                branch || null;
        }

        // ==============================
        // NAME UPDATE
        // ==============================
        if (name !== undefined) {
            department.name =
                name.trim();
        }

        // ==============================
        // CODE UPDATE
        // ==============================
        if (code !== undefined) {
            department.code =
                code.trim().toUpperCase();
        }

        // ==============================
        // DESCRIPTION UPDATE
        // ==============================
        if (description !== undefined) {
            department.description =
                description;
        }

        // ==============================
        // HEAD UPDATE
        // ==============================
        if (head !== undefined) {
            if (head) {
                const headExists =
                    await User.findOne({
                        _id: head,
                        company:
                            department.company,
                    });

                if (!headExists) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Department head does not belong to the company",
                    });
                }
            }

            department.head =
                head || null;
        }

        // ==============================
        // ACTIVE STATUS
        // ==============================
        if (isActive !== undefined) {
            department.isActive =
                isActive;
        }

        await department.save();

        // Populate updated department
        const updatedDepartment =
            await Department.findById(
                department._id
            )
                .populate("company", "name")
                .populate(
                    "branch",
                    "name branchCode"
                )
                .populate(
                    "head",
                    "name email employeeId designation"
                )
                .populate(
                    "createdBy",
                    "name email"
                );

        return res.status(200).json({
            success: true,
            message:
                "Department updated successfully",
            department:
                updatedDepartment,
        });
    } catch (error) {
        console.error(
            "Update Department Error:",
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Department name or code already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to update department",
            error: error.message,
        });
    }
};

// ==========================================
// DELETE DEPARTMENT
// ==========================================
const deleteDepartment = async (
    req,
    res
) => {
    try {
        // Find department
        const department =
            await Department.findById(
                req.params.id
            );

        if (!department) {
            return res.status(404).json({
                success: false,
                message:
                    "Department not found",
            });
        }

        // ==========================================
        // CHECK ASSIGNED EMPLOYEES
        // ==========================================
        // User.department is now an ObjectId
        // reference to Department.
        const employeeCount =
            await User.countDocuments({
                company: department.company,
                department: department._id,
            });

        // Prevent deletion if employees exist
        if (employeeCount > 0) {
            return res.status(400).json({
                success: false,
                message:
                    `Cannot delete department. ${employeeCount} employee(s) are assigned to it.`,
            });
        }

        // Delete department
        await department.deleteOne();

        return res.status(200).json({
            success: true,
            message:
                "Department deleted successfully",
        });
    } catch (error) {
        console.error(
            "Delete Department Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete department",
            error: error.message,
        });
    }
};

// ==========================================
// EXPORT
// ==========================================
module.exports = {
    createDepartment,
    getDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment,
};