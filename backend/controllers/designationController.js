const mongoose = require("mongoose");

const Designation = require("../models/Designation");
const Company = require("../models/Company");
const User = require("../models/User");

// =====================================================
// CREATE DESIGNATION
// =====================================================
const createDesignation = async (req, res) => {
    try {
        const {
            company,
            name,
            code,
            description,
            level,
            isActive,
        } = req.body;

        // =====================================
        // REQUIRED FIELDS
        // =====================================
        if (!company || !name || !code) {
            return res.status(400).json({
                success: false,
                message:
                    "Company, name and code are required",
            });
        }

        // =====================================
        // VALIDATE COMPANY ID
        // =====================================
        if (
            !mongoose.Types.ObjectId.isValid(
                company
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid company ID",
            });
        }

        // =====================================
        // CHECK COMPANY
        // =====================================
        const existingCompany =
            await Company.findById(company);

        if (!existingCompany) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        // =====================================
        // NORMALIZE DATA
        // =====================================
        const normalizedName =
            name.trim();

        const normalizedCode =
            code.trim().toUpperCase();

        // =====================================
        // CHECK DUPLICATE NAME
        // =====================================
        const existingName =
            await Designation.findOne({
                company,
                name: normalizedName,
            });

        if (existingName) {
            return res.status(400).json({
                success: false,
                message:
                    "Designation with this name already exists",
            });
        }

        // =====================================
        // CHECK DUPLICATE CODE
        // =====================================
        const existingCode =
            await Designation.findOne({
                company,
                code: normalizedCode,
            });

        if (existingCode) {
            return res.status(400).json({
                success: false,
                message:
                    "Designation with this code already exists",
            });
        }

        // =====================================
        // CREATE DESIGNATION
        // =====================================
        const designation =
            await Designation.create({
                company,

                name: normalizedName,

                code: normalizedCode,

                description:
                    description?.trim() || "",

                level:
                    level !== undefined
                        ? level
                        : 1,

                isActive:
                    isActive !== undefined
                        ? isActive
                        : true,

                createdBy: req.user._id,
            });

        // =====================================
        // POPULATE RESPONSE
        // =====================================
        const populatedDesignation =
            await Designation.findById(
                designation._id
            ).populate(
                "company",
                "name legalName"
            );

        res.status(201).json({
            success: true,
            message:
                "Designation created successfully",

            designation:
                populatedDesignation,
        });
    } catch (error) {
        console.error(
            "Create Designation Error:",
            error
        );

        // =====================================
        // MONGODB DUPLICATE KEY
        // =====================================
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message:
                    "Designation name or code already exists",
            });
        }

        res.status(500).json({
            success: false,
            message:
                "Failed to create designation",
            error: error.message,
        });
    }
};

// =====================================================
// GET ALL DESIGNATIONS
// SEARCH + FILTER + PAGINATION
// =====================================================
const getDesignations = async (
    req,
    res
) => {
    try {
        const {
            search = "",
            company,
            isActive,
            page = 1,
            limit = 10,
        } = req.query;

        // =====================================
        // BUILD FILTER
        // =====================================
        const filter = {};

        // =====================================
        // COMPANY FILTER
        // =====================================
        if (company) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    company
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid company ID",
                });
            }

            filter.company = company;
        }

        // =====================================
        // ACTIVE / INACTIVE FILTER
        // =====================================
        if (isActive !== undefined) {
            filter.isActive =
                isActive === "true";
        }

        // =====================================
        // SEARCH
        // NAME + CODE
        // =====================================
        if (search.trim()) {
            const searchText =
                search.trim();

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
            ];
        }

        // =====================================
        // PAGINATION
        // =====================================
        const pageNumber = Math.max(
            parseInt(page, 10) || 1,
            1
        );

        const limitNumber = Math.min(
            Math.max(
                parseInt(limit, 10) || 10,
                1
            ),
            100
        );

        const skip =
            (pageNumber - 1) *
            limitNumber;

        // =====================================
        // TOTAL COUNT
        // =====================================
        const totalDesignations =
            await Designation.countDocuments(
                filter
            );

        // =====================================
        // FETCH DESIGNATIONS
        // =====================================
        const designations =
            await Designation.find(filter)
                .populate(
                    "company",
                    "name legalName"
                )
                .sort({
                    level: 1,
                    name: 1,
                })
                .skip(skip)
                .limit(limitNumber);

        // =====================================
        // TOTAL PAGES
        // =====================================
        const totalPages =
            Math.ceil(
                totalDesignations /
                    limitNumber
            );

        // =====================================
        // RESPONSE
        // =====================================
        res.status(200).json({
            success: true,

            pagination: {
                totalDesignations,
                currentPage: pageNumber,
                itemsPerPage: limitNumber,
                totalPages,

                hasNextPage:
                    pageNumber <
                    totalPages,

                hasPreviousPage:
                    pageNumber > 1,
            },

            filters: {
                search:
                    search || "",

                company:
                    company || null,

                isActive:
                    isActive !== undefined
                        ? isActive ===
                          "true"
                        : null,
            },

            count:
                designations.length,

            designations,
        });
    } catch (error) {
        console.error(
            "Get Designations Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch designations",
            error: error.message,
        });
    }
};

// =====================================================
// GET DESIGNATION BY ID
// =====================================================
const getDesignationById = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        // =====================================
        // VALIDATE ID
        // =====================================
        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid designation ID",
            });
        }

        // =====================================
        // FIND DESIGNATION
        // =====================================
        const designation =
            await Designation.findById(id)
                .populate(
                    "company",
                    "name legalName"
                );

        if (!designation) {
            return res.status(404).json({
                success: false,
                message:
                    "Designation not found",
            });
        }

        // =====================================
        // RESPONSE
        // =====================================
        res.status(200).json({
            success: true,
            designation,
        });
    } catch (error) {
        console.error(
            "Get Designation Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch designation",
            error: error.message,
        });
    }
};

// =====================================================
// UPDATE DESIGNATION
// =====================================================
const updateDesignation = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        // =====================================
        // VALIDATE ID
        // =====================================
        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid designation ID",
            });
        }

        // =====================================
        // FIND DESIGNATION
        // =====================================
        const designation =
            await Designation.findById(id);

        if (!designation) {
            return res.status(404).json({
                success: false,
                message:
                    "Designation not found",
            });
        }

        const {
            name,
            code,
            description,
            level,
            isActive,
        } = req.body;

        // =====================================
        // UPDATE NAME
        // =====================================
        if (name !== undefined) {
            const normalizedName =
                name.trim();

            if (!normalizedName) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Designation name cannot be empty",
                });
            }

            const existingName =
                await Designation.findOne({
                    company:
                        designation.company,

                    name:
                        normalizedName,

                    _id: {
                        $ne:
                            designation._id,
                    },
                });

            if (existingName) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Designation with this name already exists",
                });
            }

            designation.name =
                normalizedName;
        }

        // =====================================
        // UPDATE CODE
        // =====================================
        if (code !== undefined) {
            const normalizedCode =
                code.trim().toUpperCase();

            if (!normalizedCode) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Designation code cannot be empty",
                });
            }

            const existingCode =
                await Designation.findOne({
                    company:
                        designation.company,

                    code:
                        normalizedCode,

                    _id: {
                        $ne:
                            designation._id,
                    },
                });

            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Designation with this code already exists",
                });
            }

            designation.code =
                normalizedCode;
        }

        // =====================================
        // UPDATE DESCRIPTION
        // =====================================
        if (description !== undefined) {
            designation.description =
                description.trim();
        }

        // =====================================
        // UPDATE LEVEL
        // =====================================
        if (level !== undefined) {
            designation.level =
                level;
        }

        // =====================================
        // UPDATE ACTIVE STATUS
        // =====================================
        if (isActive !== undefined) {
            designation.isActive =
                isActive;
        }

        // =====================================
        // SAVE
        // =====================================
        await designation.save();

        // =====================================
        // POPULATE UPDATED DESIGNATION
        // =====================================
        const updatedDesignation =
            await Designation.findById(
                designation._id
            ).populate(
                "company",
                "name legalName"
            );

        // =====================================
        // RESPONSE
        // =====================================
        res.status(200).json({
            success: true,
            message:
                "Designation updated successfully",

            designation:
                updatedDesignation,
        });
    } catch (error) {
        console.error(
            "Update Designation Error:",
            error
        );

        // =====================================
        // MONGODB DUPLICATE KEY
        // =====================================
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message:
                    "Designation name or code already exists",
            });
        }

        res.status(500).json({
            success: false,
            message:
                "Failed to update designation",
            error: error.message,
        });
    }
};

// =====================================================
// DELETE DESIGNATION
// =====================================================
const deleteDesignation = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        // =====================================
        // VALIDATE ID
        // =====================================
        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid designation ID",
            });
        }

        // =====================================
        // FIND DESIGNATION
        // =====================================
        const designation =
            await Designation.findById(id);

        if (!designation) {
            return res.status(404).json({
                success: false,
                message:
                    "Designation not found",
            });
        }

        // =====================================
        // CHECK EMPLOYEE DEPENDENCY
        // =====================================
        // IMPORTANT:
        // User.designation is now ObjectId
        // referencing Designation.
        const employeeCount =
            await User.countDocuments({
                company:
                    designation.company,

                designation:
                    designation._id,
            });

        // =====================================
        // BLOCK DELETE IF ASSIGNED
        // =====================================
        if (employeeCount > 0) {
            return res.status(400).json({
                success: false,
                message:
                    `Cannot delete designation. ${employeeCount} employee(s) are assigned to it.`,
            });
        }

        // =====================================
        // DELETE DESIGNATION
        // =====================================
        await Designation.findByIdAndDelete(
            id
        );

        // =====================================
        // RESPONSE
        // =====================================
        res.status(200).json({
            success: true,
            message:
                "Designation deleted successfully",
        });
    } catch (error) {
        console.error(
            "Delete Designation Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to delete designation",
            error: error.message,
        });
    }
};

// =====================================================
// EXPORT
// =====================================================
module.exports = {
    createDesignation,
    getDesignations,
    getDesignationById,
    updateDesignation,
    deleteDesignation,
};