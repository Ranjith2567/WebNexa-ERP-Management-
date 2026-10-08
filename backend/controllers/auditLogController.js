const mongoose = require("mongoose");
const AuditLog = require("../models/AuditLog");

// ========================================
// HELPERS
// ========================================

const isValidObjectId = (id) =>
    mongoose.Types.ObjectId.isValid(id);

const getUserCompany = (req) => {
    return (
        req.user?.company?._id ||
        req.user?.company ||
        null
    );
};

// ========================================
// GET AUDIT LOGS
// ========================================

const getAuditLogs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            action,
            module,
            user,
            status,
            referenceType,
            referenceId,
            branch,
            search,
            startDate,
            endDate,
        } = req.query;

        // -----------------------------------
        // Company
        // -----------------------------------

        const company = getUserCompany(req);

        if (!company) {
            return res.status(400).json({
                success: false,
                message:
                    "Company is not assigned to the authenticated user.",
            });
        }

        if (!isValidObjectId(company)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid company ID associated with authenticated user.",
            });
        }

        const query = {
            company,
        };

        // -----------------------------------
        // Action Filter
        // -----------------------------------

        if (action) {
            query.action = action;
        }

        // -----------------------------------
        // Module Filter
        // -----------------------------------

        if (module) {
            query.module = module;
        }

        // -----------------------------------
        // User Filter
        // -----------------------------------

        if (user) {
            if (!isValidObjectId(user)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid user ID.",
                });
            }

            query.user = user;
        }

        // -----------------------------------
        // Status Filter
        // -----------------------------------

        if (status) {
            query.status = status;
        }

        // -----------------------------------
        // Reference Type
        // -----------------------------------

        if (referenceType) {
            query.referenceType = referenceType;
        }

        // -----------------------------------
        // Reference ID
        // -----------------------------------

        if (referenceId) {
            if (!isValidObjectId(referenceId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid reference ID.",
                });
            }

            query.referenceId = referenceId;
        }

        // -----------------------------------
        // Branch
        // -----------------------------------

        if (branch) {
            if (!isValidObjectId(branch)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid branch ID.",
                });
            }

            query.branch = branch;
        }

        // -----------------------------------
        // Date Filter
        // -----------------------------------

        if (startDate || endDate) {
            query.createdAt = {};

            if (startDate) {
                const start = new Date(
                    `${startDate}T00:00:00.000Z`
                );

                if (Number.isNaN(start.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid start date.",
                    });
                }

                query.createdAt.$gte = start;
            }

            if (endDate) {
                const end = new Date(
                    `${endDate}T23:59:59.999Z`
                );

                if (Number.isNaN(end.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid end date.",
                    });
                }

                query.createdAt.$lte = end;
            }
        }

        // -----------------------------------
        // Search
        // -----------------------------------

        if (search && search.trim()) {
            const searchText = search.trim();

            query.$or = [
                {
                    description: {
                        $regex: searchText,
                        $options: "i",
                    },
                },
                {
                    referenceNumber: {
                        $regex: searchText,
                        $options: "i",
                    },
                },
            ];
        }

        // -----------------------------------
        // Pagination
        // -----------------------------------

        const currentPage = Math.max(
            Number(page) || 1,
            1
        );

        const pageLimit = Math.min(
            Math.max(Number(limit) || 20, 1),
            100
        );

        const skip =
            (currentPage - 1) * pageLimit;

        // -----------------------------------
        // Fetch Logs
        // -----------------------------------

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .populate(
                    "user",
                    "name email role"
                )
                .populate(
                    "branch",
                    "name branchCode"
                )
                .populate(
                    "company",
                    "name legalName"
                )
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(pageLimit)
                .lean(),

            AuditLog.countDocuments(query),
        ]);

        return res.status(200).json({
            success: true,
            count: logs.length,
            total,
            page: currentPage,
            limit: pageLimit,
            totalPages:
                total === 0
                    ? 0
                    : Math.ceil(
                          total / pageLimit
                      ),
            data: logs,
        });
    } catch (error) {
        console.error(
            "Get Audit Logs Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch audit logs.",
            error: error.message,
        });
    }
};

// ========================================
// GET SINGLE AUDIT LOG
// ========================================

const getAuditLogById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid audit log ID.",
            });
        }

        const company = getUserCompany(req);

        if (!company) {
            return res.status(400).json({
                success: false,
                message:
                    "Company is not assigned to the authenticated user.",
            });
        }

        if (!isValidObjectId(company)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid company ID associated with authenticated user.",
            });
        }

        const auditLog =
            await AuditLog.findOne({
                _id: id,
                company,
            })
                .populate(
                    "user",
                    "name email role"
                )
                .populate(
                    "branch",
                    "name branchCode"
                )
                .populate(
                    "company",
                    "name legalName"
                )
                .lean();

        if (!auditLog) {
            return res.status(404).json({
                success: false,
                message:
                    "Audit log not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: auditLog,
        });
    } catch (error) {
        console.error(
            "Get Audit Log Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch audit log.",
            error: error.message,
        });
    }
};

// ========================================
// AUDIT LOG COUNT
// ========================================

const getAuditLogCount = async (req, res) => {
    try {
        const {
            action,
            module,
            user,
            status,
            startDate,
            endDate,
        } = req.query;

        const company = getUserCompany(req);

        if (!company) {
            return res.status(400).json({
                success: false,
                message:
                    "Company is not assigned to the authenticated user.",
            });
        }

        if (!isValidObjectId(company)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid company ID associated with authenticated user.",
            });
        }

        const query = {
            company,
        };

        // -----------------------------------
        // Filters
        // -----------------------------------

        if (action) {
            query.action = action;
        }

        if (module) {
            query.module = module;
        }

        if (user) {
            if (!isValidObjectId(user)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid user ID.",
                });
            }

            query.user = user;
        }

        if (status) {
            query.status = status;
        }

        // -----------------------------------
        // Date Filter
        // -----------------------------------

        if (startDate || endDate) {
            query.createdAt = {};

            if (startDate) {
                const start = new Date(
                    `${startDate}T00:00:00.000Z`
                );

                if (Number.isNaN(start.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid start date.",
                    });
                }

                query.createdAt.$gte = start;
            }

            if (endDate) {
                const end = new Date(
                    `${endDate}T23:59:59.999Z`
                );

                if (Number.isNaN(end.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid end date.",
                    });
                }

                query.createdAt.$lte = end;
            }
        }

        const count =
            await AuditLog.countDocuments(
                query
            );

        return res.status(200).json({
            success: true,
            count,
        });
    } catch (error) {
        console.error(
            "Audit Log Count Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to count audit logs.",
            error: error.message,
        });
    }
};

// ========================================
// EXPORTS
// ========================================

module.exports = {
    getAuditLogs,
    getAuditLogById,
    getAuditLogCount,
};