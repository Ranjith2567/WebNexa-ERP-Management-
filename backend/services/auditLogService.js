const AuditLog = require("../models/AuditLog");

const createAuditLog = async ({
    req = null,

    company,
    branch = null,
    user = null,

    action,
    module,

    referenceType = "OTHER",
    referenceId = null,
    referenceNumber = "",

    description,

    oldValues = null,
    newValues = null,

    metadata = {},

    status = "SUCCESS",
    errorMessage = "",
}) => {
    try {
        if (!company) {
            throw new Error("Company is required for audit log");
        }

        if (!action) {
            throw new Error("Audit action is required");
        }

        if (!module) {
            throw new Error("Audit module is required");
        }

        if (!description) {
            throw new Error("Audit description is required");
        }

        // -----------------------------------
        // Get user automatically from request
        // -----------------------------------

        const auditUser = user || req?.user?._id || null;

        // -----------------------------------
        // Get branch automatically
        // -----------------------------------

        const auditBranch =
            branch ||
            req?.user?.branch ||
            null;

        // -----------------------------------
        // Get IP Address
        // -----------------------------------

        let ipAddress = "";

        if (req) {
            ipAddress =
                req.headers?.["x-forwarded-for"] ||
                req.socket?.remoteAddress ||
                req.ip ||
                "";

            if (typeof ipAddress === "string") {
                ipAddress = ipAddress.split(",")[0].trim();
            }
        }

        // -----------------------------------
        // Get User Agent
        // -----------------------------------

        const userAgent =
            req?.headers?.["user-agent"] || "";

        // -----------------------------------
        // Create Audit Log
        // -----------------------------------

        const auditLog = await AuditLog.create({
            company,
            branch: auditBranch,
            user: auditUser,

            action,
            module,

            referenceType,
            referenceId,
            referenceNumber,

            description,

            oldValues,
            newValues,

            metadata,

            ipAddress,
            userAgent,

            status,
            errorMessage,
        });

        return auditLog;
    } catch (error) {
        console.error(
            "Create Audit Log Error:",
            error.message
        );

        // -----------------------------------
        // Audit logging should NOT break
        // the main ERP transaction
        // -----------------------------------

        return null;
    }
};


// ========================================
// SUCCESS AUDIT
// ========================================

const createSuccessAuditLog = async (params = {}) => {
    return createAuditLog({
        ...params,
        status: "SUCCESS",
        errorMessage: "",
    });
};


// ========================================
// FAILED AUDIT
// ========================================

const createFailedAuditLog = async (params = {}) => {
    return createAuditLog({
        ...params,
        status: "FAILED",
    });
};


// ========================================
// UPDATE AUDIT HELPER
// ========================================

const createUpdateAuditLog = async ({
    req = null,

    company,
    branch = null,
    user = null,

    module,

    referenceType = "OTHER",
    referenceId = null,
    referenceNumber = "",

    description = "Record updated",

    oldValues = null,
    newValues = null,

    metadata = {},
}) => {
    return createSuccessAuditLog({
        req,

        company,
        branch,
        user,

        action: "UPDATE",
        module,

        referenceType,
        referenceId,
        referenceNumber,

        description,

        oldValues,
        newValues,

        metadata,
    });
};


// ========================================
// CREATE AUDIT HELPER
// ========================================

const createCreateAuditLog = async ({
    req = null,

    company,
    branch = null,
    user = null,

    module,

    referenceType = "OTHER",
    referenceId = null,
    referenceNumber = "",

    description = "Record created",

    newValues = null,

    metadata = {},
}) => {
    return createSuccessAuditLog({
        req,

        company,
        branch,
        user,

        action: "CREATE",
        module,

        referenceType,
        referenceId,
        referenceNumber,

        description,

        oldValues: null,
        newValues,

        metadata,
    });
};


// ========================================
// DELETE AUDIT HELPER
// ========================================

const createDeleteAuditLog = async ({
    req = null,

    company,
    branch = null,
    user = null,

    module,

    referenceType = "OTHER",
    referenceId = null,
    referenceNumber = "",

    description = "Record deleted",

    oldValues = null,

    metadata = {},
}) => {
    return createSuccessAuditLog({
        req,

        company,
        branch,
        user,

        action: "DELETE",
        module,

        referenceType,
        referenceId,
        referenceNumber,

        description,

        oldValues,
        newValues: null,

        metadata,
    });
};


// ========================================
// APPROVAL AUDIT HELPER
// ========================================

const createApprovalAuditLog = async ({
    req = null,

    company,
    branch = null,
    user = null,

    module,

    referenceType = "OTHER",
    referenceId = null,
    referenceNumber = "",

    description = "Record approved",

    oldValues = null,
    newValues = null,

    metadata = {},
}) => {
    return createSuccessAuditLog({
        req,

        company,
        branch,
        user,

        action: "APPROVE",
        module,

        referenceType,
        referenceId,
        referenceNumber,

        description,

        oldValues,
        newValues,

        metadata,
    });
};


// ========================================
// REJECTION AUDIT HELPER
// ========================================

const createRejectionAuditLog = async ({
    req = null,

    company,
    branch = null,
    user = null,

    module,

    referenceType = "OTHER",
    referenceId = null,
    referenceNumber = "",

    description = "Record rejected",

    oldValues = null,
    newValues = null,

    metadata = {},
}) => {
    return createSuccessAuditLog({
        req,

        company,
        branch,
        user,

        action: "REJECT",
        module,

        referenceType,
        referenceId,
        referenceNumber,

        description,

        oldValues,
        newValues,

        metadata,
    });
};


// ========================================
// PAYMENT AUDIT HELPER
// ========================================

const createPaymentAuditLog = async ({
    req = null,

    company,
    branch = null,
    user = null,

    module,

    referenceType = "OTHER",
    referenceId = null,
    referenceNumber = "",

    description = "Payment recorded",

    oldValues = null,
    newValues = null,

    metadata = {},
}) => {
    return createSuccessAuditLog({
        req,

        company,
        branch,
        user,

        action: "PAYMENT",
        module,

        referenceType,
        referenceId,
        referenceNumber,

        description,

        oldValues,
        newValues,

        metadata,
    });
};


// ========================================
// STOCK AUDIT HELPER
// ========================================

const createStockAuditLog = async ({
    req = null,

    company,
    branch = null,
    user = null,

    action = "STOCK_OUT",

    module = "STOCK",

    referenceType = "STOCK",
    referenceId = null,
    referenceNumber = "",

    description = "Stock movement recorded",

    oldValues = null,
    newValues = null,

    metadata = {},
}) => {
    return createSuccessAuditLog({
        req,

        company,
        branch,
        user,

        action,
        module,

        referenceType,
        referenceId,
        referenceNumber,

        description,

        oldValues,
        newValues,

        metadata,
    });
};


module.exports = {
    createAuditLog,

    createSuccessAuditLog,
    createFailedAuditLog,

    createCreateAuditLog,
    createUpdateAuditLog,
    createDeleteAuditLog,

    createApprovalAuditLog,
    createRejectionAuditLog,

    createPaymentAuditLog,
    createStockAuditLog,
};