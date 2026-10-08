const mongoose = require("mongoose");

const Customer = require("../models/Customer");
const Company = require("../models/Company");
const Branch = require("../models/Branch");

// ======================================================
// Helper: Validate MongoDB ObjectId
// ======================================================
const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// ======================================================
// Helper: Generate Customer Code
// Example: CUS-000001
// ======================================================
const generateCustomerCode = async (companyId) => {
    const lastCustomer = await Customer.findOne({
        company: companyId,
    })
        .sort({ createdAt: -1 })
        .select("customerCode");

    if (!lastCustomer || !lastCustomer.customerCode) {
        return "CUS-000001";
    }

    const match = lastCustomer.customerCode.match(/CUS-(\d+)/);

    if (!match) {
        return "CUS-000001";
    }

    const lastNumber = parseInt(match[1], 10);

    return `CUS-${String(lastNumber + 1).padStart(6, "0")}`;
};

// ======================================================
// CREATE CUSTOMER
// POST /api/customers
// ======================================================
const createCustomer = async (req, res) => {
    try {
        const {
            company,
            branch,
            customerType,
            name,
            companyName,
            email,
            phone,
            alternatePhone,
            gstNumber,
            panNumber,
            billingAddress,
            shippingAddress,
            creditLimit,
            paymentTerms,
            openingBalance,
            notes,
        } = req.body;

        // ----------------------------------------------
        // Required fields
        // ----------------------------------------------
        if (!company) {
            return res.status(400).json({
                success: false,
                message: "Company is required.",
            });
        }

        if (!branch) {
            return res.status(400).json({
                success: false,
                message: "Branch is required.",
            });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Customer name is required.",
            });
        }

        if (!phone || !phone.trim()) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required.",
            });
        }

        // ----------------------------------------------
        // ObjectId validation
        // ----------------------------------------------
        if (!isValidObjectId(company)) {
            return res.status(400).json({
                success: false,
                message: "Invalid company ID.",
            });
        }

        if (!isValidObjectId(branch)) {
            return res.status(400).json({
                success: false,
                message: "Invalid branch ID.",
            });
        }

        // ----------------------------------------------
        // Check company
        // ----------------------------------------------
        const companyExists = await Company.findById(company);

        if (!companyExists) {
            return res.status(404).json({
                success: false,
                message: "Company not found.",
            });
        }

        if (companyExists.isActive === false) {
            return res.status(400).json({
                success: false,
                message: "Cannot create customer for an inactive company.",
            });
        }

        // ----------------------------------------------
        // Check branch
        // ----------------------------------------------
        const branchExists = await Branch.findOne({
            _id: branch,
            company,
        });

        if (!branchExists) {
            return res.status(404).json({
                success: false,
                message: "Branch not found for this company.",
            });
        }

        if (branchExists.isActive === false) {
            return res.status(400).json({
                success: false,
                message: "Cannot create customer for an inactive branch.",
            });
        }

        // ----------------------------------------------
        // Customer type validation
        // ----------------------------------------------
        if (
            customerType &&
            !["INDIVIDUAL", "BUSINESS"].includes(customerType)
        ) {
            return res.status(400).json({
                success: false,
                message: "Customer type must be INDIVIDUAL or BUSINESS.",
            });
        }

        // ----------------------------------------------
        // Business customer validation
        // ----------------------------------------------
        if (customerType === "BUSINESS" && !companyName?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Company name is required for business customers.",
            });
        }

        // ----------------------------------------------
        // Duplicate phone check
        // ----------------------------------------------
        const existingPhone = await Customer.findOne({
            company,
            phone: phone.trim(),
            isActive: true,
        });

        if (existingPhone) {
            return res.status(409).json({
                success: false,
                message: "A customer with this phone number already exists.",
                customer: {
                    id: existingPhone._id,
                    customerCode: existingPhone.customerCode,
                    name: existingPhone.name,
                },
            });
        }

        // ----------------------------------------------
        // Email duplicate check
        // ----------------------------------------------
        if (email && email.trim()) {
            const existingEmail = await Customer.findOne({
                company,
                email: email.trim().toLowerCase(),
                isActive: true,
            });

            if (existingEmail) {
                return res.status(409).json({
                    success: false,
                    message: "A customer with this email already exists.",
                    customer: {
                        id: existingEmail._id,
                        customerCode: existingEmail.customerCode,
                        name: existingEmail.name,
                    },
                });
            }
        }

        // ----------------------------------------------
        // GST validation for business customer
        // ----------------------------------------------
        if (
            customerType === "BUSINESS" &&
            gstNumber &&
            gstNumber.trim()
        ) {
            const existingGST = await Customer.findOne({
                company,
                gstNumber: gstNumber.trim().toUpperCase(),
                isActive: true,
            });

            if (existingGST) {
                return res.status(409).json({
                    success: false,
                    message: "A customer with this GST number already exists.",
                });
            }
        }

        // ----------------------------------------------
        // Generate customer code
        // ----------------------------------------------
        const customerCode = await generateCustomerCode(company);

        // ----------------------------------------------
        // Create customer
        // ----------------------------------------------
        const customer = await Customer.create({
            company,
            branch,
            customerCode,
            customerType: customerType || "INDIVIDUAL",
            name: name.trim(),
            companyName: companyName?.trim() || "",
            email: email?.trim().toLowerCase() || "",
            phone: phone.trim(),
            alternatePhone: alternatePhone?.trim() || "",
            gstNumber: gstNumber?.trim().toUpperCase() || "",
            panNumber: panNumber?.trim().toUpperCase() || "",
            billingAddress: billingAddress || {},
            shippingAddress: shippingAddress || {},
            creditLimit: Number(creditLimit || 0),
            paymentTerms: Number(paymentTerms || 0),
            openingBalance: Number(openingBalance || 0),
            notes: notes?.trim() || "",
            createdBy: req.user._id,
        });

        // ----------------------------------------------
        // Populate response
        // ----------------------------------------------
        await customer.populate([
            {
                path: "company",
                select: "name legalName",
            },
            {
                path: "branch",
                select: "name branchCode city state",
            },
            {
                path: "createdBy",
                select: "name email role",
            },
        ]);

        return res.status(201).json({
            success: true,
            message: "Customer created successfully.",
            customer,
        });
    } catch (error) {
        console.error("Create Customer Error:", error);

        // Duplicate key
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Customer with the same code already exists.",
            });
        }

        // Mongoose validation
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map((err) => err.message);

            return res.status(400).json({
                success: false,
                message: "Customer validation failed.",
                errors,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server error while creating customer.",
        });
    }
};

// ======================================================
// GET ALL CUSTOMERS
// GET /api/customers
// ======================================================
const getCustomers = async (req, res) => {
    try {
        const {
            company,
            branch,
            customerType,
            isActive,
            search,
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query;

        const filter = {};

        // ----------------------------------------------
        // Company filter
        // ----------------------------------------------
        if (company) {
            if (!isValidObjectId(company)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid company ID.",
                });
            }

            filter.company = company;
        }

        // ----------------------------------------------
        // Branch filter
        // ----------------------------------------------
        if (branch) {
            if (!isValidObjectId(branch)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid branch ID.",
                });
            }

            filter.branch = branch;
        }

        // ----------------------------------------------
        // Customer type
        // ----------------------------------------------
        if (customerType) {
            if (!["INDIVIDUAL", "BUSINESS"].includes(customerType)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid customer type.",
                });
            }

            filter.customerType = customerType;
        }

        // ----------------------------------------------
        // Active filter
        // ----------------------------------------------
        if (isActive !== undefined) {
            if (!["true", "false"].includes(String(isActive))) {
                return res.status(400).json({
                    success: false,
                    message: "isActive must be true or false.",
                });
            }

            filter.isActive = isActive === "true";
        }

        // ----------------------------------------------
        // Search
        // ----------------------------------------------
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), "i");

            filter.$or = [
                { customerCode: searchRegex },
                { name: searchRegex },
                { companyName: searchRegex },
                { email: searchRegex },
                { phone: searchRegex },
                { gstNumber: searchRegex },
                { panNumber: searchRegex },
            ];
        }

        // ----------------------------------------------
        // Pagination
        // ----------------------------------------------
        const currentPage = Math.max(parseInt(page, 10) || 1, 1);
        const perPage = Math.min(
            Math.max(parseInt(limit, 10) || 10, 1),
            100
        );

        const skip = (currentPage - 1) * perPage;

        // ----------------------------------------------
        // Sorting
        // ----------------------------------------------
        const allowedSortFields = [
            "createdAt",
            "updatedAt",
            "name",
            "customerCode",
            "phone",
            "customerType",
            "creditLimit",
        ];

        const finalSortBy = allowedSortFields.includes(sortBy)
            ? sortBy
            : "createdAt";

        const finalSortOrder = sortOrder === "asc" ? 1 : -1;

        const sort = {
            [finalSortBy]: finalSortOrder,
        };

        // ----------------------------------------------
        // Query
        // ----------------------------------------------
        const [customers, total] = await Promise.all([
            Customer.find(filter)
                .populate("company", "name legalName")
                .populate("branch", "name branchCode city state")
                .populate("createdBy", "name email role")
                .populate("updatedBy", "name email role")
                .sort(sort)
                .skip(skip)
                .limit(perPage),

            Customer.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / perPage);

        return res.status(200).json({
            success: true,
            message: "Customers fetched successfully.",
            customers,
            pagination: {
                total,
                page: currentPage,
                limit: perPage,
                totalPages,
                hasNextPage: currentPage < totalPages,
                hasPreviousPage: currentPage > 1,
            },
        });
    } catch (error) {
        console.error("Get Customers Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching customers.",
        });
    }
};

// ======================================================
// GET SINGLE CUSTOMER
// GET /api/customers/:id
// ======================================================
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID.",
            });
        }

        const customer = await Customer.findById(id)
            .populate("company", "name legalName email phone")
            .populate(
                "branch",
                "name branchCode email phone city state country"
            )
            .populate("createdBy", "name email role")
            .populate("updatedBy", "name email role");

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Customer fetched successfully.",
            customer,
        });
    } catch (error) {
        console.error("Get Customer Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching customer.",
        });
    }
};

// ======================================================
// UPDATE CUSTOMER
// PATCH /api/customers/:id
// ======================================================
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID.",
            });
        }

        const customer = await Customer.findById(id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found.",
            });
        }

        const {
            branch,
            customerType,
            name,
            companyName,
            email,
            phone,
            alternatePhone,
            gstNumber,
            panNumber,
            billingAddress,
            shippingAddress,
            creditLimit,
            paymentTerms,
            openingBalance,
            notes,
            isActive,
        } = req.body;

        // ----------------------------------------------
        // Branch update
        // ----------------------------------------------
        if (branch !== undefined) {
            if (!isValidObjectId(branch)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid branch ID.",
                });
            }

            const branchExists = await Branch.findOne({
                _id: branch,
                company: customer.company,
            });

            if (!branchExists) {
                return res.status(404).json({
                    success: false,
                    message: "Branch not found for this company.",
                });
            }

            if (branchExists.isActive === false) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot move customer to an inactive branch.",
                });
            }

            customer.branch = branch;
        }

        // ----------------------------------------------
        // Customer type
        // ----------------------------------------------
        if (customerType !== undefined) {
            if (!["INDIVIDUAL", "BUSINESS"].includes(customerType)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid customer type.",
                });
            }

            customer.customerType = customerType;
        }

        // ----------------------------------------------
        // Name
        // ----------------------------------------------
        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Customer name cannot be empty.",
                });
            }

            customer.name = name.trim();
        }

        // ----------------------------------------------
        // Company name
        // ----------------------------------------------
        if (companyName !== undefined) {
            customer.companyName = companyName.trim();
        }

        if (
            customer.customerType === "BUSINESS" &&
            !customer.companyName.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Company name is required for business customers.",
            });
        }

        // ----------------------------------------------
        // Phone
        // ----------------------------------------------
        if (phone !== undefined) {
            if (!phone.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number cannot be empty.",
                });
            }

            const duplicatePhone = await Customer.findOne({
                _id: { $ne: customer._id },
                company: customer.company,
                phone: phone.trim(),
                isActive: true,
            });

            if (duplicatePhone) {
                return res.status(409).json({
                    success: false,
                    message: "Another customer already uses this phone number.",
                });
            }

            customer.phone = phone.trim();
        }

        // ----------------------------------------------
        // Email
        // ----------------------------------------------
        if (email !== undefined) {
            const normalizedEmail = email.trim().toLowerCase();

            if (normalizedEmail) {
                const duplicateEmail = await Customer.findOne({
                    _id: { $ne: customer._id },
                    company: customer.company,
                    email: normalizedEmail,
                    isActive: true,
                });

                if (duplicateEmail) {
                    return res.status(409).json({
                        success: false,
                        message:
                            "Another customer already uses this email.",
                    });
                }
            }

            customer.email = normalizedEmail;
        }

        // ----------------------------------------------
        // Other fields
        // ----------------------------------------------
        if (alternatePhone !== undefined) {
            customer.alternatePhone = alternatePhone.trim();
        }

        if (gstNumber !== undefined) {
            const normalizedGST = gstNumber.trim().toUpperCase();

            if (normalizedGST) {
                const duplicateGST = await Customer.findOne({
                    _id: { $ne: customer._id },
                    company: customer.company,
                    gstNumber: normalizedGST,
                    isActive: true,
                });

                if (duplicateGST) {
                    return res.status(409).json({
                        success: false,
                        message:
                            "Another customer already uses this GST number.",
                    });
                }
            }

            customer.gstNumber = normalizedGST;
        }

        if (panNumber !== undefined) {
            customer.panNumber = panNumber.trim().toUpperCase();
        }

        if (billingAddress !== undefined) {
            customer.billingAddress = billingAddress;
        }

        if (shippingAddress !== undefined) {
            customer.shippingAddress = shippingAddress;
        }

        if (creditLimit !== undefined) {
            const value = Number(creditLimit);

            if (!Number.isFinite(value) || value < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid credit limit.",
                });
            }

            customer.creditLimit = value;
        }

        if (paymentTerms !== undefined) {
            const value = Number(paymentTerms);

            if (!Number.isFinite(value) || value < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid payment terms.",
                });
            }

            customer.paymentTerms = value;
        }

        if (openingBalance !== undefined) {
            const value = Number(openingBalance);

            if (!Number.isFinite(value)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid opening balance.",
                });
            }

            customer.openingBalance = value;
        }

        if (notes !== undefined) {
            customer.notes = notes.trim();
        }

        if (isActive !== undefined) {
            if (typeof isActive !== "boolean") {
                return res.status(400).json({
                    success: false,
                    message: "isActive must be true or false.",
                });
            }

            customer.isActive = isActive;
        }

        customer.updatedBy = req.user._id;

        await customer.save();

        await customer.populate([
            {
                path: "company",
                select: "name legalName",
            },
            {
                path: "branch",
                select: "name branchCode city state",
            },
            {
                path: "createdBy",
                select: "name email role",
            },
            {
                path: "updatedBy",
                select: "name email role",
            },
        ]);

        return res.status(200).json({
            success: true,
            message: "Customer updated successfully.",
            customer,
        });
    } catch (error) {
        console.error("Update Customer Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Customer with the same code already exists.",
            });
        }

        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map((err) => err.message);

            return res.status(400).json({
                success: false,
                message: "Customer validation failed.",
                errors,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server error while updating customer.",
        });
    }
};

// ======================================================
// DELETE CUSTOMER
// DELETE /api/customers/:id
//
// Professional ERP approach:
// We DON'T physically delete the customer.
// We deactivate it so future sales/history remain safe.
// ======================================================
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID.",
            });
        }

        const customer = await Customer.findById(id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found.",
            });
        }

        if (!customer.isActive) {
            return res.status(400).json({
                success: false,
                message: "Customer is already inactive.",
            });
        }

        // ----------------------------------------------
        // Soft delete
        // ----------------------------------------------
        customer.isActive = false;
        customer.updatedBy = req.user._id;

        await customer.save();

        return res.status(200).json({
            success: true,
            message:
                "Customer deactivated successfully. Customer history has been preserved.",
            customer: {
                id: customer._id,
                customerCode: customer.customerCode,
                name: customer.name,
                isActive: customer.isActive,
            },
        });
    } catch (error) {
        console.error("Delete Customer Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while deactivating customer.",
        });
    }
};

// ======================================================
// RESTORE CUSTOMER
// PATCH /api/customers/:id/restore
// ======================================================
const restoreCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID.",
            });
        }

        const customer = await Customer.findById(id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found.",
            });
        }

        if (customer.isActive) {
            return res.status(400).json({
                success: false,
                message: "Customer is already active.",
            });
        }

        customer.isActive = true;
        customer.updatedBy = req.user._id;

        await customer.save();

        return res.status(200).json({
            success: true,
            message: "Customer restored successfully.",
            customer,
        });
    } catch (error) {
        console.error("Restore Customer Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while restoring customer.",
        });
    }
};

// ======================================================
// EXPORTS
// ======================================================
module.exports = {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    restoreCustomer,
};