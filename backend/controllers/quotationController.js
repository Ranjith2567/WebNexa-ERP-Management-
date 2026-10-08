const mongoose = require("mongoose");

const Quotation = require("../models/Quotation");
const Company = require("../models/Company");
const Branch = require("../models/Branch");
const Customer = require("../models/Customer");
const Product = require("../models/Product");

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const roundMoney = (value) => {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

const generateQuotationNumber = async (companyId) => {
    const lastQuotation = await Quotation.findOne({
        company: companyId,
    })
        .sort({ createdAt: -1 })
        .select("quotationNumber");

    if (!lastQuotation) {
        return "QUO-000001";
    }

    const match = lastQuotation.quotationNumber?.match(/(\d+)$/);

    if (!match) {
        return "QUO-000001";
    }

    const nextNumber = Number(match[1]) + 1;

    return `QUO-${String(nextNumber).padStart(6, "0")}`;
};

// CREATE QUOTATION
const createQuotation = async (req, res) => {
    try {
        const {
            company,
            branch,
            quotationDate,
            validUntil,
            customer,
            salesPerson,
            items,
            notes,
            termsAndConditions,
            status,
        } = req.body;

        if (!company || !isValidObjectId(company)) {
            return res.status(400).json({
                success: false,
                message: "Valid company is required.",
            });
        }

        if (!branch || !isValidObjectId(branch)) {
            return res.status(400).json({
                success: false,
                message: "Valid branch is required.",
            });
        }

        if (!customer || !isValidObjectId(customer)) {
            return res.status(400).json({
                success: false,
                message: "Valid customer is required.",
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one quotation item is required.",
            });
        }

        const companyDoc = await Company.findById(company);

        if (!companyDoc) {
            return res.status(404).json({
                success: false,
                message: "Company not found.",
            });
        }

        if (!companyDoc.isActive) {
            return res.status(400).json({
                success: false,
                message: "Company is inactive.",
            });
        }

        const branchDoc = await Branch.findOne({
            _id: branch,
            company,
        });

        if (!branchDoc) {
            return res.status(404).json({
                success: false,
                message: "Branch not found for this company.",
            });
        }

        if (!branchDoc.isActive) {
            return res.status(400).json({
                success: false,
                message: "Branch is inactive.",
            });
        }

        const customerDoc = await Customer.findOne({
            _id: customer,
            company,
            isActive: true,
        });

        if (!customerDoc) {
            return res.status(404).json({
                success: false,
                message: "Active customer not found for this company.",
            });
        }

        if (validUntil && quotationDate) {
            const startDate = new Date(quotationDate);
            const endDate = new Date(validUntil);

            if (
                Number.isNaN(startDate.getTime()) ||
                Number.isNaN(endDate.getTime())
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid quotation date or valid until date.",
                });
            }

            if (endDate < startDate) {
                return res.status(400).json({
                    success: false,
                    message: "Valid until date cannot be before quotation date.",
                });
            }
        }

        const processedItems = [];

        let subtotal = 0;
        let discountAmount = 0;
        let taxableAmount = 0;
        let taxAmount = 0;
        let totalAmount = 0;

        const usedProducts = new Set();

        for (const item of items) {
            if (!item.product || !isValidObjectId(item.product)) {
                return res.status(400).json({
                    success: false,
                    message: "Each item must have a valid product.",
                });
            }

            if (usedProducts.has(String(item.product))) {
                return res.status(400).json({
                    success: false,
                    message: "Duplicate products are not allowed in quotation.",
                });
            }

            usedProducts.add(String(item.product));

            const product = await Product.findOne({
                _id: item.product,
                company,
            });

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.product}`,
                });
            }

            if (!product.isActive) {
                return res.status(400).json({
                    success: false,
                    message: `Product ${product.name} is inactive.`,
                });
            }

            const quantity = Number(item.quantity);
            const unitPrice =
                item.unitPrice !== undefined
                    ? Number(item.unitPrice)
                    : Number(product.sellingPrice);

            const discountPercent = Number(item.discountPercent || 0);
            const taxPercent = Number(item.taxPercent || 0);

            if (!Number.isFinite(quantity) || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid quantity for product ${product.name}.`,
                });
            }

            if (!Number.isFinite(unitPrice) || unitPrice < 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid unit price for product ${product.name}.`,
                });
            }

            if (
                !Number.isFinite(discountPercent) ||
                discountPercent < 0 ||
                discountPercent > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid discount for product ${product.name}.`,
                });
            }

            if (
                !Number.isFinite(taxPercent) ||
                taxPercent < 0 ||
                taxPercent > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid tax for product ${product.name}.`,
                });
            }

            const grossAmount = roundMoney(quantity * unitPrice);

            const itemDiscount = roundMoney(
                grossAmount * (discountPercent / 100)
            );

            const itemTaxableAmount = roundMoney(
                grossAmount - itemDiscount
            );

            const itemTax = roundMoney(
                itemTaxableAmount * (taxPercent / 100)
            );

            const lineTotal = roundMoney(
                itemTaxableAmount + itemTax
            );

            subtotal = roundMoney(subtotal + grossAmount);
            discountAmount = roundMoney(
                discountAmount + itemDiscount
            );
            taxableAmount = roundMoney(
                taxableAmount + itemTaxableAmount
            );
            taxAmount = roundMoney(taxAmount + itemTax);
            totalAmount = roundMoney(totalAmount + lineTotal);

            processedItems.push({
                product: product._id,
                description:
                    item.description || product.name || "",
                quantity,
                unitPrice,
                discountPercent,
                taxPercent,
                discountAmount: itemDiscount,
                taxableAmount: itemTaxableAmount,
                taxAmount: itemTax,
                lineTotal,
            });
        }

        let quotationNumber = await generateQuotationNumber(company);

        let existingQuotation = await Quotation.findOne({
            company,
            quotationNumber,
        });

        if (existingQuotation) {
            quotationNumber = `QUO-${Date.now()}`;
        }

        const quotation = await Quotation.create({
            company,
            branch,
            quotationNumber,
            quotationDate: quotationDate || new Date(),
            validUntil,
            customer,
            salesPerson: salesPerson || null,
            items: processedItems,
            subtotal,
            discountAmount,
            taxableAmount,
            taxAmount,
            totalAmount,
            notes: notes || "",
            termsAndConditions: termsAndConditions || "",
            status: status || "DRAFT",
            createdBy: req.user._id,
        });

        await quotation.populate([
            {
                path: "company",
                select: "name legalName",
            },
            {
                path: "branch",
                select: "name branchCode",
            },
            {
                path: "customer",
                select: "customerCode name companyName email phone",
            },
            {
                path: "salesPerson",
                select: "name email role",
            },
            {
                path: "items.product",
                select: "name sku barcode sellingPrice tax",
            },
            {
                path: "createdBy",
                select: "name email role",
            },
        ]);

        return res.status(201).json({
            success: true,
            message: "Quotation created successfully.",
            quotation,
        });
    } catch (error) {
        console.error("Create quotation error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Quotation number already exists.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create quotation.",
            error: error.message,
        });
    }
};

// GET ALL QUOTATIONS
const getQuotations = async (req, res) => {
    try {
        const {
            company,
            branch,
            customer,
            status,
            search,
            page = 1,
            limit = 10,
        } = req.query;

        const filter = {};

        if (company) {
            if (!isValidObjectId(company)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid company ID.",
                });
            }

            filter.company = company;
        }

        if (branch) {
            if (!isValidObjectId(branch)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid branch ID.",
                });
            }

            filter.branch = branch;
        }

        if (customer) {
            if (!isValidObjectId(customer)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid customer ID.",
                });
            }

            filter.customer = customer;
        }

        if (status) {
            filter.status = status.toUpperCase();
        }

        if (search && search.trim()) {
            filter.$or = [
                {
                    quotationNumber: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
            ];
        }

        const pageNumber = Math.max(Number(page) || 1, 1);
        const limitNumber = Math.min(
            Math.max(Number(limit) || 10, 1),
            100
        );

        const skip = (pageNumber - 1) * limitNumber;

        const [quotations, total] = await Promise.all([
            Quotation.find(filter)
                .populate("company", "name legalName")
                .populate("branch", "name branchCode")
                .populate(
                    "customer",
                    "customerCode name companyName email phone"
                )
                .populate("salesPerson", "name email role")
                .populate("items.product", "name sku barcode")
                .populate("createdBy", "name email role")
                .populate("updatedBy", "name email role")
                .sort({ quotationDate: -1, createdAt: -1 })
                .skip(skip)
                .limit(limitNumber),

            Quotation.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            message: "Quotations fetched successfully.",
            quotations,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
                hasNextPage:
                    pageNumber < Math.ceil(total / limitNumber),
                hasPreviousPage: pageNumber > 1,
            },
        });
    } catch (error) {
        console.error("Get quotations error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch quotations.",
            error: error.message,
        });
    }
};

// GET SINGLE QUOTATION
const getQuotationById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quotation ID.",
            });
        }

        const quotation = await Quotation.findById(id)
            .populate("company", "name legalName email phone")
            .populate("branch", "name branchCode email phone")
            .populate(
                "customer",
                "customerCode name companyName email phone"
            )
            .populate("salesPerson", "name email role")
            .populate(
                "items.product",
                "name sku barcode sellingPrice tax"
            )
            .populate("createdBy", "name email role")
            .populate("updatedBy", "name email role");

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Quotation fetched successfully.",
            quotation,
        });
    } catch (error) {
        console.error("Get quotation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch quotation.",
            error: error.message,
        });
    }
};

// UPDATE QUOTATION
const updateQuotation = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quotation ID.",
            });
        }

        const quotation = await Quotation.findById(id);

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found.",
            });
        }

        if (
            ["ACCEPTED", "CANCELLED"].includes(
                quotation.status
            )
        ) {
            return res.status(400).json({
                success: false,
                message: `Quotation cannot be updated after ${quotation.status.toLowerCase()}.`,
            });
        }

        const allowedFields = [
            "quotationDate",
            "validUntil",
            "customer",
            "salesPerson",
            "notes",
            "termsAndConditions",
            "status",
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                quotation[field] = req.body[field];
            }
        }

        if (req.body.items !== undefined) {
            if (
                !Array.isArray(req.body.items) ||
                req.body.items.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "At least one quotation item is required.",
                });
            }

            const processedItems = [];

            let subtotal = 0;
            let discountAmount = 0;
            let taxableAmount = 0;
            let taxAmount = 0;
            let totalAmount = 0;

            const usedProducts = new Set();

            for (const item of req.body.items) {
                if (
                    !item.product ||
                    !isValidObjectId(item.product)
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Each item must have a valid product.",
                    });
                }

                if (usedProducts.has(String(item.product))) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Duplicate products are not allowed in quotation.",
                    });
                }

                usedProducts.add(String(item.product));

                const product = await Product.findOne({
                    _id: item.product,
                    company: quotation.company,
                });

                if (!product) {
                    return res.status(404).json({
                        success: false,
                        message: `Product not found: ${item.product}`,
                    });
                }

                if (!product.isActive) {
                    return res.status(400).json({
                        success: false,
                        message: `Product ${product.name} is inactive.`,
                    });
                }

                const quantity = Number(item.quantity);
                const unitPrice =
                    item.unitPrice !== undefined
                        ? Number(item.unitPrice)
                        : Number(product.sellingPrice);

                const discountPercent = Number(
                    item.discountPercent || 0
                );

                const taxPercent = Number(
                    item.taxPercent || 0
                );

                if (!Number.isFinite(quantity) || quantity <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid quantity for product ${product.name}.`,
                    });
                }

                if (!Number.isFinite(unitPrice) || unitPrice < 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid unit price for product ${product.name}.`,
                    });
                }

                const grossAmount = roundMoney(
                    quantity * unitPrice
                );

                const itemDiscount = roundMoney(
                    grossAmount * (discountPercent / 100)
                );

                const itemTaxableAmount = roundMoney(
                    grossAmount - itemDiscount
                );

                const itemTax = roundMoney(
                    itemTaxableAmount * (taxPercent / 100)
                );

                const lineTotal = roundMoney(
                    itemTaxableAmount + itemTax
                );

                subtotal = roundMoney(
                    subtotal + grossAmount
                );

                discountAmount = roundMoney(
                    discountAmount + itemDiscount
                );

                taxableAmount = roundMoney(
                    taxableAmount + itemTaxableAmount
                );

                taxAmount = roundMoney(
                    taxAmount + itemTax
                );

                totalAmount = roundMoney(
                    totalAmount + lineTotal
                );

                processedItems.push({
                    product: product._id,
                    description:
                        item.description || product.name || "",
                    quantity,
                    unitPrice,
                    discountPercent,
                    taxPercent,
                    discountAmount: itemDiscount,
                    taxableAmount: itemTaxableAmount,
                    taxAmount: itemTax,
                    lineTotal,
                });
            }

            quotation.items = processedItems;
            quotation.subtotal = subtotal;
            quotation.discountAmount = discountAmount;
            quotation.taxableAmount = taxableAmount;
            quotation.taxAmount = taxAmount;
            quotation.totalAmount = totalAmount;
        }

        quotation.updatedBy = req.user._id;

        await quotation.save();

        await quotation.populate([
            {
                path: "company",
                select: "name legalName",
            },
            {
                path: "branch",
                select: "name branchCode",
            },
            {
                path: "customer",
                select: "customerCode name companyName email phone",
            },
            {
                path: "salesPerson",
                select: "name email role",
            },
            {
                path: "items.product",
                select: "name sku barcode sellingPrice tax",
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
            message: "Quotation updated successfully.",
            quotation,
        });
    } catch (error) {
        console.error("Update quotation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update quotation.",
            error: error.message,
        });
    }
};

// UPDATE STATUS
const updateQuotationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quotation ID.",
            });
        }

        const allowedStatuses = [
            "DRAFT",
            "SENT",
            "ACCEPTED",
            "REJECTED",
            "EXPIRED",
            "CANCELLED",
        ];

        const newStatus = String(status || "").toUpperCase();

        if (!allowedStatuses.includes(newStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quotation status.",
            });
        }

        const quotation = await Quotation.findById(id);

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found.",
            });
        }

        if (quotation.status === "CANCELLED") {
            return res.status(400).json({
                success: false,
                message: "Cancelled quotation cannot be changed.",
            });
        }

        quotation.status = newStatus;
        quotation.updatedBy = req.user._id;

        await quotation.save();

        await quotation.populate([
            {
                path: "customer",
                select: "customerCode name companyName email phone",
            },
            {
                path: "updatedBy",
                select: "name email role",
            },
        ]);

        return res.status(200).json({
            success: true,
            message: "Quotation status updated successfully.",
            quotation,
        });
    } catch (error) {
        console.error("Update quotation status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update quotation status.",
            error: error.message,
        });
    }
};

// DELETE QUOTATION
const deleteQuotation = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quotation ID.",
            });
        }

        const quotation = await Quotation.findById(id);

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found.",
            });
        }

        if (
            !["DRAFT", "REJECTED", "CANCELLED"].includes(
                quotation.status
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only draft, rejected, or cancelled quotations can be deleted.",
            });
        }

        await quotation.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Quotation deleted successfully.",
        });
    } catch (error) {
        console.error("Delete quotation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete quotation.",
            error: error.message,
        });
    }
};

module.exports = {
    createQuotation,
    getQuotations,
    getQuotationById,
    updateQuotation,
    updateQuotationStatus,
    deleteQuotation,
};