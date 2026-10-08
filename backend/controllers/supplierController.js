const mongoose = require("mongoose");
const Supplier = require("../models/Supplier");
const Company = require("../models/Company");
const Branch = require("../models/Branch");

// =====================================================
// CREATE SUPPLIER
// =====================================================
const createSupplier = async (req, res) => {
    try {
        const {
            company,
            branch,
            supplierCode,
            name,
            companyName,
            email,
            phone,
            alternatePhone,
            gstNumber,
            panNumber,
            paymentTerms,
            creditLimit,
            address,
            bankDetails,
            notes,
            isActive,
        } = req.body;

        // Required fields
        if (!company || !branch || !supplierCode || !name || !phone) {
            return res.status(400).json({
                success: false,
                message:
                    "Company, branch, supplier code, supplier name and phone are required",
            });
        }

        // ObjectId validation
        if (
            !mongoose.Types.ObjectId.isValid(company) ||
            !mongoose.Types.ObjectId.isValid(branch)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid company or branch ID",
            });
        }

        // Check company
        const existingCompany = await Company.findById(company);

        if (!existingCompany) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        if (!existingCompany.isActive) {
            return res.status(400).json({
                success: false,
                message: "Company is inactive",
            });
        }

        // Check branch
        const existingBranch = await Branch.findOne({
            _id: branch,
            company,
        });

        if (!existingBranch) {
            return res.status(400).json({
                success: false,
                message: "Branch does not belong to the selected company",
            });
        }

        if (!existingBranch.isActive) {
            return res.status(400).json({
                success: false,
                message: "Branch is inactive",
            });
        }

        // Normalize values
        const normalizedCode = supplierCode.trim().toUpperCase();
        const normalizedName = name.trim();

        // Duplicate supplier code
        const existingCode = await Supplier.findOne({
            company,
            supplierCode: normalizedCode,
        });

        if (existingCode) {
            return res.status(409).json({
                success: false,
                message: "Supplier code already exists in this company",
            });
        }

        // Duplicate supplier name
        const existingName = await Supplier.findOne({
            company,
            name: normalizedName,
        });

        if (existingName) {
            return res.status(409).json({
                success: false,
                message: "Supplier name already exists in this company",
            });
        }

        // Validate email
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid email address",
                });
            }
        }

        // Validate payment terms
        if (paymentTerms !== undefined && Number(paymentTerms) < 0) {
            return res.status(400).json({
                success: false,
                message: "Payment terms cannot be negative",
            });
        }

        // Validate credit limit
        if (creditLimit !== undefined && Number(creditLimit) < 0) {
            return res.status(400).json({
                success: false,
                message: "Credit limit cannot be negative",
            });
        }

        const supplier = await Supplier.create({
            company,
            branch,
            supplierCode: normalizedCode,
            name: normalizedName,
            companyName: companyName?.trim() || "",
            email: email?.trim().toLowerCase() || "",
            phone: phone.trim(),
            alternatePhone: alternatePhone?.trim() || "",
            gstNumber: gstNumber?.trim().toUpperCase() || "",
            panNumber: panNumber?.trim().toUpperCase() || "",
            paymentTerms: paymentTerms || 0,
            creditLimit: creditLimit || 0,
            address: address || {},
            bankDetails: bankDetails || {},
            notes: notes?.trim() || "",
            isActive: isActive !== undefined ? isActive : true,
            createdBy: req.user._id,
        });

        const populatedSupplier = await Supplier.findById(
            supplier._id
        )
            .populate("company", "name legalName")
            .populate("branch", "name branchCode")
            .populate("createdBy", "name email role");

        return res.status(201).json({
            success: true,
            message: "Supplier created successfully",
            data: populatedSupplier,
        });
    } catch (error) {
        console.error("Create Supplier Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Supplier code or name already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create supplier",
            error: error.message,
        });
    }
};

// =====================================================
// GET ALL SUPPLIERS
// =====================================================
const getSuppliers = async (req, res) => {
    try {
        const {
            company,
            branch,
            isActive,
            search,
            page = 1,
            limit = 20,
        } = req.query;

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

        // Branch filter
        if (branch) {
            if (!mongoose.Types.ObjectId.isValid(branch)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid branch ID",
                });
            }

            filter.branch = branch;
        }

        // Active filter
        if (isActive !== undefined) {
            if (isActive !== "true" && isActive !== "false") {
                return res.status(400).json({
                    success: false,
                    message: "isActive must be true or false",
                });
            }

            filter.isActive = isActive === "true";
        }

        // Search
        if (search?.trim()) {
            const searchRegex = new RegExp(search.trim(), "i");

            filter.$or = [
                { supplierCode: searchRegex },
                { name: searchRegex },
                { companyName: searchRegex },
                { email: searchRegex },
                { phone: searchRegex },
                { gstNumber: searchRegex },
                { panNumber: searchRegex },
            ];
        }

        const pageNumber = Math.max(parseInt(page) || 1, 1);
        const limitNumber = Math.min(
            Math.max(parseInt(limit) || 20, 1),
            100
        );

        const skip = (pageNumber - 1) * limitNumber;

        const [suppliers, total] = await Promise.all([
            Supplier.find(filter)
                .populate("company", "name legalName")
                .populate("branch", "name branchCode")
                .populate("createdBy", "name email role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber),

            Supplier.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            count: suppliers.length,
            total,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
            },
            data: suppliers,
        });
    } catch (error) {
        console.error("Get Suppliers Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch suppliers",
            error: error.message,
        });
    }
};

// =====================================================
// GET SUPPLIER BY ID
// =====================================================
const getSupplierById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid supplier ID",
            });
        }

        const supplier = await Supplier.findById(id)
            .populate("company", "name legalName")
            .populate("branch", "name branchCode")
            .populate("createdBy", "name email role");

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: supplier,
        });
    } catch (error) {
        console.error("Get Supplier Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch supplier",
            error: error.message,
        });
    }
};

// =====================================================
// UPDATE SUPPLIER
// =====================================================
const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid supplier ID",
            });
        }

        const supplier = await Supplier.findById(id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found",
            });
        }

        const {
            company,
            branch,
            supplierCode,
            name,
            companyName,
            email,
            phone,
            alternatePhone,
            gstNumber,
            panNumber,
            paymentTerms,
            creditLimit,
            address,
            bankDetails,
            notes,
            isActive,
        } = req.body;

        const finalCompany = company || supplier.company;
        const finalBranch = branch || supplier.branch;

        // Validate company
        if (!mongoose.Types.ObjectId.isValid(finalCompany)) {
            return res.status(400).json({
                success: false,
                message: "Invalid company ID",
            });
        }

        const existingCompany = await Company.findById(finalCompany);

        if (!existingCompany) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        // Validate branch
        if (!mongoose.Types.ObjectId.isValid(finalBranch)) {
            return res.status(400).json({
                success: false,
                message: "Invalid branch ID",
            });
        }

        const existingBranch = await Branch.findOne({
            _id: finalBranch,
            company: finalCompany,
        });

        if (!existingBranch) {
            return res.status(400).json({
                success: false,
                message: "Branch does not belong to the selected company",
            });
        }

        const finalCode = supplierCode
            ? supplierCode.trim().toUpperCase()
            : supplier.supplierCode;

        const finalName = name ? name.trim() : supplier.name;

        // Duplicate code
        const duplicateCode = await Supplier.findOne({
            _id: { $ne: id },
            company: finalCompany,
            supplierCode: finalCode,
        });

        if (duplicateCode) {
            return res.status(409).json({
                success: false,
                message: "Supplier code already exists in this company",
            });
        }

        // Duplicate name
        const duplicateName = await Supplier.findOne({
            _id: { $ne: id },
            company: finalCompany,
            name: finalName,
        });

        if (duplicateName) {
            return res.status(409).json({
                success: false,
                message: "Supplier name already exists in this company",
            });
        }

        if (email !== undefined && email !== "") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid email address",
                });
            }
        }

        if (
            paymentTerms !== undefined &&
            Number(paymentTerms) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment terms cannot be negative",
            });
        }

        if (
            creditLimit !== undefined &&
            Number(creditLimit) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Credit limit cannot be negative",
            });
        }

        // Apply updates
        supplier.company = finalCompany;
        supplier.branch = finalBranch;
        supplier.supplierCode = finalCode;
        supplier.name = finalName;

        if (companyName !== undefined)
            supplier.companyName = companyName.trim();

        if (email !== undefined)
            supplier.email = email.trim().toLowerCase();

        if (phone !== undefined)
            supplier.phone = phone.trim();

        if (alternatePhone !== undefined)
            supplier.alternatePhone = alternatePhone.trim();

        if (gstNumber !== undefined)
            supplier.gstNumber = gstNumber.trim().toUpperCase();

        if (panNumber !== undefined)
            supplier.panNumber = panNumber.trim().toUpperCase();

        if (paymentTerms !== undefined)
            supplier.paymentTerms = Number(paymentTerms);

        if (creditLimit !== undefined)
            supplier.creditLimit = Number(creditLimit);

        if (address !== undefined)
            supplier.address = address;

        if (bankDetails !== undefined)
            supplier.bankDetails = bankDetails;

        if (notes !== undefined)
            supplier.notes = notes.trim();

        if (isActive !== undefined)
            supplier.isActive = isActive;

        await supplier.save();

        const updatedSupplier = await Supplier.findById(id)
            .populate("company", "name legalName")
            .populate("branch", "name branchCode")
            .populate("createdBy", "name email role");

        return res.status(200).json({
            success: true,
            message: "Supplier updated successfully",
            data: updatedSupplier,
        });
    } catch (error) {
        console.error("Update Supplier Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Supplier code or name already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update supplier",
            error: error.message,
        });
    }
};

// =====================================================
// DELETE SUPPLIER
// =====================================================
const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid supplier ID",
            });
        }

        const supplier = await Supplier.findById(id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found",
            });
        }

        /*
         * Later, before hard delete, we will check:
         * Purchase Orders
         * Purchase Invoices
         * Purchase Returns
         *
         * For now supplier can be deleted.
         */

        await Supplier.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Supplier deleted successfully",
        });
    } catch (error) {
        console.error("Delete Supplier Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete supplier",
            error: error.message,
        });
    }
};

module.exports = {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier,
};