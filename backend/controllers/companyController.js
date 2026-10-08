const mongoose = require("mongoose");

const Company = require("../models/Company");
const User = require("../models/User");
const Branch = require("../models/Branch");
const Department = require("../models/Department");
const Designation = require("../models/Designation");

// =====================================================
// CREATE COMPANY
// =====================================================
const createCompany = async (req, res) => {
    try {
        const {
            name,
            legalName,
            email,
            phone,
            gstNumber,
            panNumber,
            address,
            logo,
            currency,
            financialYearStart,
            timezone,
            taxEnabled,
            isActive,
        } = req.body;

        // =====================================
        // REQUIRED FIELD
        // =====================================
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Company name is required",
            });
        }

        const normalizedName = name.trim();

        // =====================================
        // DUPLICATE COMPANY NAME
        // =====================================
        const existingCompany =
            await Company.findOne({
                name: normalizedName,
            });

        if (existingCompany) {
            return res.status(409).json({
                success: false,
                message: "Company already exists",
            });
        }

        // =====================================
        // CREATE COMPANY
        // =====================================
        const company = await Company.create({
            name: normalizedName,
            legalName:
                legalName?.trim() || "",
            email:
                email?.trim().toLowerCase() || "",
            phone:
                phone?.trim() || "",
            gstNumber:
                gstNumber?.trim().toUpperCase() || "",
            panNumber:
                panNumber?.trim().toUpperCase() || "",
            address,
            logo:
                logo?.trim() || "",
            currency:
                currency || "INR",
            financialYearStart:
                financialYearStart || "04-01",
            timezone:
                timezone || "Asia/Kolkata",
            taxEnabled:
                taxEnabled !== undefined
                    ? taxEnabled
                    : true,
            isActive:
                isActive !== undefined
                    ? isActive
                    : true,
            createdBy: req.user._id,
        });

        // =====================================
        // POPULATE CREATED BY
        // =====================================
        const populatedCompany =
            await Company.findById(
                company._id
            ).populate(
                "createdBy",
                "name email role"
            );

        res.status(201).json({
            success: true,
            message:
                "Company created successfully",
            company: populatedCompany,
        });
    } catch (error) {
        console.error(
            "Create Company Error:",
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Company with this name already exists",
            });
        }

        res.status(500).json({
            success: false,
            message:
                "Failed to create company",
            error: error.message,
        });
    }
};

// =====================================================
// GET ALL COMPANIES
// SEARCH + FILTER + PAGINATION
// =====================================================
const getCompanies = async (req, res) => {
    try {
        const {
            search = "",
            isActive,
            page = 1,
            limit = 10,
        } = req.query;

        const filter = {};

        // =====================================
        // ACTIVE FILTER
        // =====================================
        if (isActive !== undefined) {
            filter.isActive =
                isActive === "true";
        }

        // =====================================
        // SEARCH
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
                    legalName: {
                        $regex: searchText,
                        $options: "i",
                    },
                },
                {
                    email: {
                        $regex: searchText,
                        $options: "i",
                    },
                },
                {
                    phone: {
                        $regex: searchText,
                        $options: "i",
                    },
                },
                {
                    gstNumber: {
                        $regex: searchText,
                        $options: "i",
                    },
                },
                {
                    panNumber: {
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
        const totalCompanies =
            await Company.countDocuments(
                filter
            );

        // =====================================
        // GET COMPANIES
        // =====================================
        const companies =
            await Company.find(filter)
                .populate(
                    "createdBy",
                    "name email role"
                )
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limitNumber);

        const totalPages =
            Math.ceil(
                totalCompanies /
                    limitNumber
            );

        // =====================================
        // RESPONSE
        // =====================================
        res.status(200).json({
            success: true,

            pagination: {
                totalCompanies,
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
                search: search || "",
                isActive:
                    isActive !== undefined
                        ? isActive ===
                          "true"
                        : null,
            },

            count: companies.length,

            companies,
        });
    } catch (error) {
        console.error(
            "Get Companies Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch companies",
            error: error.message,
        });
    }
};

// =====================================================
// GET SINGLE COMPANY
// =====================================================
const getCompanyById = async (
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
                message: "Invalid company ID",
            });
        }

        // =====================================
        // FIND COMPANY
        // =====================================
        const company =
            await Company.findById(id)
                .populate(
                    "createdBy",
                    "name email role"
                );

        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        res.status(200).json({
            success: true,
            company,
        });
    } catch (error) {
        console.error(
            "Get Company Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch company",
            error: error.message,
        });
    }
};

// =====================================================
// UPDATE COMPANY
// =====================================================
const updateCompany = async (
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
                message: "Invalid company ID",
            });
        }

        // =====================================
        // FIND COMPANY
        // =====================================
        const company =
            await Company.findById(id);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        const {
            name,
            legalName,
            email,
            phone,
            gstNumber,
            panNumber,
            address,
            logo,
            currency,
            financialYearStart,
            timezone,
            taxEnabled,
            isActive,
        } = req.body;

        // =====================================
        // UPDATE NAME
        // =====================================
        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Company name cannot be empty",
                });
            }

            const normalizedName =
                name.trim();

            const existingCompany =
                await Company.findOne({
                    name: normalizedName,
                    _id: {
                        $ne: company._id,
                    },
                });

            if (existingCompany) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Company with this name already exists",
                });
            }

            company.name =
                normalizedName;
        }

        // =====================================
        // OTHER FIELDS
        // =====================================
        if (legalName !== undefined) {
            company.legalName =
                legalName.trim();
        }

        if (email !== undefined) {
            company.email =
                email.trim().toLowerCase();
        }

        if (phone !== undefined) {
            company.phone =
                phone.trim();
        }

        if (gstNumber !== undefined) {
            company.gstNumber =
                gstNumber
                    .trim()
                    .toUpperCase();
        }

        if (panNumber !== undefined) {
            company.panNumber =
                panNumber
                    .trim()
                    .toUpperCase();
        }

        if (address !== undefined) {
            company.address =
                address;
        }

        if (logo !== undefined) {
            company.logo =
                logo.trim();
        }

        if (currency !== undefined) {
            company.currency =
                currency;
        }

        if (
            financialYearStart !==
            undefined
        ) {
            company.financialYearStart =
                financialYearStart;
        }

        if (timezone !== undefined) {
            company.timezone =
                timezone;
        }

        if (taxEnabled !== undefined) {
            company.taxEnabled =
                taxEnabled;
        }

        if (isActive !== undefined) {
            company.isActive =
                isActive;
        }

        // =====================================
        // SAVE
        // =====================================
        await company.save();

        // =====================================
        // POPULATE
        // =====================================
        const updatedCompany =
            await Company.findById(
                company._id
            ).populate(
                "createdBy",
                "name email role"
            );

        res.status(200).json({
            success: true,
            message:
                "Company updated successfully",
            company: updatedCompany,
        });
    } catch (error) {
        console.error(
            "Update Company Error:",
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Company with this name already exists",
            });
        }

        res.status(500).json({
            success: false,
            message:
                "Failed to update company",
            error: error.message,
        });
    }
};

// =====================================================
// DELETE COMPANY
// =====================================================
const deleteCompany = async (
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
                message: "Invalid company ID",
            });
        }

        // =====================================
        // FIND COMPANY
        // =====================================
        const company =
            await Company.findById(id);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        // =====================================
        // CHECK EMPLOYEE DEPENDENCY
        // =====================================
        const employeeCount =
            await User.countDocuments({
                company: company._id,
            });

        if (employeeCount > 0) {
            return res.status(400).json({
                success: false,
                message:
                    `Cannot delete company. ${employeeCount} employee(s) are linked to this company.`,
            });
        }

        // =====================================
        // CHECK BRANCH DEPENDENCY
        // =====================================
        const branchCount =
            await Branch.countDocuments({
                company: company._id,
            });

        if (branchCount > 0) {
            return res.status(400).json({
                success: false,
                message:
                    `Cannot delete company. ${branchCount} branch(es) are linked to this company.`,
            });
        }

        // =====================================
        // CHECK DEPARTMENT DEPENDENCY
        // =====================================
        const departmentCount =
            await Department.countDocuments({
                company: company._id,
            });

        if (departmentCount > 0) {
            return res.status(400).json({
                success: false,
                message:
                    `Cannot delete company. ${departmentCount} department(s) are linked to this company.`,
            });
        }

        // =====================================
        // CHECK DESIGNATION DEPENDENCY
        // =====================================
        const designationCount =
            await Designation.countDocuments({
                company: company._id,
            });

        if (designationCount > 0) {
            return res.status(400).json({
                success: false,
                message:
                    `Cannot delete company. ${designationCount} designation(s) are linked to this company.`,
            });
        }

        // =====================================
        // DELETE COMPANY
        // =====================================
        await Company.findByIdAndDelete(
            company._id
        );

        res.status(200).json({
            success: true,
            message:
                "Company deleted successfully",
        });
    } catch (error) {
        console.error(
            "Delete Company Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to delete company",
            error: error.message,
        });
    }
};

// =====================================================
// EXPORT
// =====================================================
module.exports = {
    createCompany,
    getCompanies,
    getCompanyById,
    updateCompany,
    deleteCompany,
};