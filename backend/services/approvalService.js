const mongoose = require("mongoose");
const ApprovalRequest = require("../models/ApprovalRequest");
const User = require("../models/User");

const {
    createApprovalAuditLog,
    createRejectionAuditLog,
} = require("./auditLogService");

const {
    createNotification,
} = require("./notificationService");

/*
|--------------------------------------------------------------------------
| Approval Module Handlers
|--------------------------------------------------------------------------
|
| Module-specific approval actions can be registered here.
|
| Example:
|
| PURCHASE_RETURN
|   - onFinalApprove
|   - afterFinalApprove
|   - onReject
|   - afterReject
|
| The actual Purchase Return logic will be registered
| from purchaseReturnController.js.
|
*/

const approvalHandlers = new Map();

/*
|--------------------------------------------------------------------------
| Register Approval Handler
|--------------------------------------------------------------------------
*/

const registerApprovalHandler = (
    module,
    {
        onFinalApprove = null,
        afterFinalApprove = null,
        onReject = null,
        afterReject = null,
    } = {}
) => {
    if (!module) {
        throw new Error(
            "Approval handler module is required."
        );
    }

    approvalHandlers.set(module, {
        onFinalApprove,
        afterFinalApprove,
        onReject,
        afterReject,
    });

    console.log(
        `Approval handler registered for module: ${module}`
    );
};

/*
|--------------------------------------------------------------------------
| Get Approval Handler
|--------------------------------------------------------------------------
*/

const getApprovalHandler = (module) => {
    return approvalHandlers.get(module) || null;
};

/*
|--------------------------------------------------------------------------
| Transaction Helper
|--------------------------------------------------------------------------
*/

const withTransaction = async (callback) => {
    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            result = await callback(session);
        });

        return result;
    } finally {
        await session.endSession();
    }
};

/*
|--------------------------------------------------------------------------
| Validate Approval Step
|--------------------------------------------------------------------------
*/

const isApproverAllowed = (step, user) => {
    if (!step || !user) {
        return false;
    }

    /*
    |--------------------------------------------------------------------------
    | Direct User Approval
    |--------------------------------------------------------------------------
    */

    if (
        step.approverType === "USER" &&
        step.approverUser &&
        step.approverUser.toString() ===
            user._id.toString()
    ) {
        return true;
    }

    /*
    |--------------------------------------------------------------------------
    | Role Based Approval
    |--------------------------------------------------------------------------
    */

    if (
        step.approverType === "ROLE" &&
        step.approverRole &&
        user.role === step.approverRole
    ) {
        return true;
    }

    return false;
};

/*
|--------------------------------------------------------------------------
| Create Approval Request
|--------------------------------------------------------------------------
*/

const createApprovalRequest = async ({
    req = null,
    company,
    branch = null,
    module,
    referenceType,
    referenceId,
    referenceNumber = "",
    title,
    description = "",
    requestedBy,
    steps = [],
    metadata = {},
}) => {
    try {
        /*
        |--------------------------------------------------------------------------
        | Basic Validation
        |--------------------------------------------------------------------------
        */

        if (!company) {
            throw new Error(
                "Company is required."
            );
        }

        if (!module) {
            throw new Error(
                "Approval module is required."
            );
        }

        if (!referenceType) {
            throw new Error(
                "Reference type is required."
            );
        }

        if (!referenceId) {
            throw new Error(
                "Reference ID is required."
            );
        }

        if (!title) {
            throw new Error(
                "Approval title is required."
            );
        }

        if (!requestedBy) {
            throw new Error(
                "Requested by user is required."
            );
        }

        if (
            !Array.isArray(steps) ||
            steps.length === 0
        ) {
            throw new Error(
                "At least one approval step is required."
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Validate & Normalize Steps
        |--------------------------------------------------------------------------
        */

        const normalizedSteps = steps.map(
            (step, index) => {
                const level = Number(
                    step.level || index + 1
                );

                if (
                    !["ROLE", "USER"].includes(
                        step.approverType
                    )
                ) {
                    throw new Error(
                        `Invalid approver type at level ${level}.`
                    );
                }

                if (
                    step.approverType === "ROLE" &&
                    !step.approverRole
                ) {
                    throw new Error(
                        `Approver role is required at level ${level}.`
                    );
                }

                if (
                    step.approverType === "USER" &&
                    !step.approverUser
                ) {
                    throw new Error(
                        `Approver user is required at level ${level}.`
                    );
                }

                return {
                    level,

                    approverType:
                        step.approverType,

                    approverRole:
                        step.approverType ===
                        "ROLE"
                            ? step.approverRole
                            : null,

                    approverUser:
                        step.approverType ===
                        "USER"
                            ? step.approverUser
                            : null,

                    status:
                        level === 1
                            ? "PENDING"
                            : "SKIPPED",

                    actedBy: null,
                    actedAt: null,
                    comments: "",
                };
            }
        );

        normalizedSteps.sort(
            (a, b) => a.level - b.level
        );

        /*
        |--------------------------------------------------------------------------
        | Validate Level Sequence
        |--------------------------------------------------------------------------
        */

        normalizedSteps.forEach(
            (step, index) => {
                const expectedLevel =
                    index + 1;

                if (
                    step.level !==
                    expectedLevel
                ) {
                    throw new Error(
                        "Approval levels must be sequential starting from level 1."
                    );
                }
            }
        );

        /*
        |--------------------------------------------------------------------------
        | Prevent Duplicate Active Approval
        |--------------------------------------------------------------------------
        */

        const existingRequest =
            await ApprovalRequest.findOne({
                company,
                module,
                referenceType,
                referenceId,
                status: "PENDING",
            });

        if (existingRequest) {
            throw new Error(
                "An active approval request already exists for this record."
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Create Approval Request
        |--------------------------------------------------------------------------
        */

        const approvalRequest =
            await ApprovalRequest.create({
                company,
                branch,
                module,
                referenceType,
                referenceId,
                referenceNumber,
                title,
                description,
                requestedBy,
                requestedAt: new Date(),
                currentLevel: 1,
                totalLevels:
                    normalizedSteps.length,
                status: "PENDING",
                steps: normalizedSteps,
                metadata,
                createdBy: requestedBy,
                updatedBy: requestedBy,
            });

        /*
        |--------------------------------------------------------------------------
        | Notify First Approver
        |--------------------------------------------------------------------------
        */

        const firstStep =
            normalizedSteps[0];

        let recipients = [];

        if (
            firstStep.approverType ===
                "USER" &&
            firstStep.approverUser
        ) {
            recipients.push(
                firstStep.approverUser
            );
        } else if (
            firstStep.approverType ===
                "ROLE" &&
            firstStep.approverRole
        ) {
            const roleUsers =
                await User.find({
                    company,
                    role: firstStep.approverRole,
                    isActive: true,
                }).select("_id");

            recipients = roleUsers.map(
                (user) => user._id
            );
        }

        for (const recipient of recipients) {
            await createNotification({
                company,
                branch,
                recipient,
                type: "SYSTEM",
                title: "Approval Required",
                message: `${title} requires your approval.`,
                priority: "HIGH",
                referenceType: "OTHER",
                referenceId:
                    approvalRequest._id,
                metadata: {
                    approvalRequestId:
                        approvalRequest._id,

                    module,

                    referenceType,

                    referenceId,

                    referenceNumber,

                    level: 1,
                },
                createdBy: requestedBy,
            });
        }

        return approvalRequest;
    } catch (error) {
        console.error(
            "Create Approval Request Error:",
            error.message
        );

        throw error;
    }
};

/*
|--------------------------------------------------------------------------
| Approve Request
|--------------------------------------------------------------------------
*/

const approveApprovalRequest = async ({
    req = null,
    approvalRequestId,
    user,
    comments = "",
}) => {
    try {
        /*
        |--------------------------------------------------------------------------
        | Basic Validation
        |--------------------------------------------------------------------------
        */

        if (!approvalRequestId) {
            throw new Error(
                "Approval request ID is required."
            );
        }

        if (!user) {
            throw new Error(
                "Authenticated user is required."
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Approval Transaction
        |--------------------------------------------------------------------------
        */

        const result =
            await withTransaction(
                async (session) => {
                    const approvalRequest =
                        await ApprovalRequest.findById(
                            approvalRequestId
                        ).session(session);

                    if (!approvalRequest) {
                        throw new Error(
                            "Approval request not found."
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Check Status
                    |--------------------------------------------------------------------------
                    */

                    if (
                        approvalRequest.status !==
                        "PENDING"
                    ) {
                        throw new Error(
                            `Approval request is already ${approvalRequest.status.toLowerCase()}.`
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Find Current Step
                    |--------------------------------------------------------------------------
                    */

                    const currentStep =
                        approvalRequest.steps.find(
                            (step) =>
                                step.level ===
                                approvalRequest.currentLevel
                        );

                    if (!currentStep) {
                        throw new Error(
                            "Current approval step not found."
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Validate Approver
                    |--------------------------------------------------------------------------
                    */

                    if (
                        !isApproverAllowed(
                            currentStep,
                            user
                        )
                    ) {
                        throw new Error(
                            "You are not authorized to approve this request."
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Capture Old Values
                    |--------------------------------------------------------------------------
                    */

                    const oldValues = {
                        status:
                            approvalRequest.status,

                        currentLevel:
                            approvalRequest.currentLevel,

                        steps:
                            approvalRequest.steps.map(
                                (step) =>
                                    step.toObject()
                            ),
                    };

                    /*
                    |--------------------------------------------------------------------------
                    | Mark Current Step Approved
                    |--------------------------------------------------------------------------
                    */

                    currentStep.status =
                        "APPROVED";

                    currentStep.actedBy =
                        user._id;

                    currentStep.actedAt =
                        new Date();

                    currentStep.comments =
                        comments || "";

                    /*
                    |--------------------------------------------------------------------------
                    | Find Next Step
                    |--------------------------------------------------------------------------
                    */

                    const nextStep =
                        approvalRequest.steps.find(
                            (step) =>
                                step.level >
                                    approvalRequest.currentLevel &&
                                step.status ===
                                    "SKIPPED"
                        );

                    /*
                    |--------------------------------------------------------------------------
                    | More Approval Levels Remaining
                    |--------------------------------------------------------------------------
                    */

                    if (nextStep) {
                        nextStep.status =
                            "PENDING";

                        approvalRequest.currentLevel =
                            nextStep.level;

                        approvalRequest.updatedBy =
                            user._id;

                        await approvalRequest.save({
                            session,
                        });

                        return {
                            approvalRequest,

                            completed: false,

                            nextStep,

                            oldValues,

                            moduleActionResult:
                                null,
                        };
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | FINAL APPROVAL
                    |--------------------------------------------------------------------------
                    */

                    /*
                    |----------------------------------------------------------------------
                    | Get Module Handler
                    |----------------------------------------------------------------------
                    */

                    const handler =
                        getApprovalHandler(
                            approvalRequest.module
                        );

                    let moduleActionResult =
                        null;

                    /*
                    |----------------------------------------------------------------------
                    | Execute Module Final Approval
                    |----------------------------------------------------------------------
                    |
                    | This happens BEFORE the ApprovalRequest transaction commits.
                    |
                    | Example:
                    |
                    | PURCHASE_RETURN
                    |   - decrease stock
                    |   - change PurchaseReturn status
                    |   - update approval info
                    |
                    */

                    if (
                        handler &&
                        typeof handler.onFinalApprove ===
                            "function"
                    ) {
                        moduleActionResult =
                            await handler.onFinalApprove(
                                {
                                    req,

                                    user,

                                    session,

                                    approvalRequest,

                                    comments,
                                }
                            );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Mark Approval Request Approved
                    |--------------------------------------------------------------------------
                    */

                    approvalRequest.status =
                        "APPROVED";

                    approvalRequest.approvedBy =
                        user._id;

                    approvalRequest.approvedAt =
                        new Date();

                    approvalRequest.updatedBy =
                        user._id;

                    await approvalRequest.save({
                        session,
                    });

                    /*
                    |--------------------------------------------------------------------------
                    | Return Final Result
                    |--------------------------------------------------------------------------
                    */

                    return {
                        approvalRequest,

                        completed: true,

                        nextStep: null,

                        oldValues,

                        moduleActionResult,
                    };
                }
            );

        /*
        |--------------------------------------------------------------------------
        | Generic Approval Audit Log
        |--------------------------------------------------------------------------
        */

        await createApprovalAuditLog({
            req,

            company:
                result.approvalRequest.company,

            branch:
                result.approvalRequest.branch,

            user: user._id,

            module:
                result.approvalRequest.module,

            referenceType:
                result.approvalRequest.referenceType,

            referenceId:
                result.approvalRequest.referenceId,

            referenceNumber:
                result.approvalRequest.referenceNumber,

            description: result.completed
                ? `Approval request ${result.approvalRequest.referenceNumber} fully approved.`
                : `Approval request ${result.approvalRequest.referenceNumber} approved at level ${result.approvalRequest.currentLevel}.`,

            oldValues:
                result.oldValues,

            newValues: {
                status:
                    result.approvalRequest.status,

                currentLevel:
                    result.approvalRequest.currentLevel,

                approvedBy:
                    result.approvalRequest.approvedBy,

                approvedAt:
                    result.approvalRequest.approvedAt,
            },

            metadata: {
                event: result.completed
                    ? "FINAL_APPROVED"
                    : "LEVEL_APPROVED",

                approvalRequestId:
                    result.approvalRequest
                        ._id,

                level: result.completed
                    ? result.approvalRequest
                          .totalLevels
                    : result.approvalRequest
                          .currentLevel,
            },
        });

        /*
        |--------------------------------------------------------------------------
        | Module After-Final-Approval Hook
        |--------------------------------------------------------------------------
        |
        | This executes AFTER MongoDB transaction has committed.
        |
        | Good place for:
        |   - notifications
        |   - module-specific audit
        |   - logs
        |
        */

        if (
            result.completed &&
            result.moduleActionResult
        ) {
            const handler =
                getApprovalHandler(
                    result.approvalRequest
                        .module
                );

            if (
                handler &&
                typeof handler.afterFinalApprove ===
                    "function"
            ) {
                try {
                    await handler.afterFinalApprove(
                        {
                            req,

                            user,

                            approvalRequest:
                                result.approvalRequest,

                            moduleActionResult:
                                result.moduleActionResult,
                        }
                    );
                } catch (hookError) {
                    /*
                    |----------------------------------------------------------------------
                    | Important
                    |----------------------------------------------------------------------
                    |
                    | Business transaction already committed.
                    | So notification/audit hook failure should NOT
                    | make the approval appear failed.
                    |
                    */

                    console.error(
                        "After Final Approval Hook Error:",
                        hookError.message
                    );
                }
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Notify Next Approver
        |--------------------------------------------------------------------------
        */

        if (
            !result.completed &&
            result.nextStep
        ) {
            let recipients = [];

            /*
            |--------------------------------------------------------------------------
            | USER Approver
            |--------------------------------------------------------------------------
            */

            if (
                result.nextStep
                    .approverType ===
                    "USER" &&
                result.nextStep.approverUser
            ) {
                recipients.push(
                    result.nextStep
                        .approverUser
                );
            }

            /*
            |--------------------------------------------------------------------------
            | ROLE Approver
            |--------------------------------------------------------------------------
            */

            if (
                result.nextStep
                    .approverType ===
                    "ROLE" &&
                result.nextStep.approverRole
            ) {
                const roleUsers =
                    await User.find({
                        company:
                            result
                                .approvalRequest
                                .company,

                        role:
                            result.nextStep
                                .approverRole,

                        isActive: true,
                    }).select("_id");

                recipients =
                    roleUsers.map(
                        (u) => u._id
                    );
            }

            /*
            |--------------------------------------------------------------------------
            | Send Notifications
            |--------------------------------------------------------------------------
            */

            for (const recipient of recipients) {
                await createNotification({
                    company:
                        result
                            .approvalRequest
                            .company,

                    branch:
                        result
                            .approvalRequest
                            .branch,

                    recipient,

                    type: "SYSTEM",

                    title:
                        "Approval Required",

                    message: `${result.approvalRequest.title} requires your approval.`,

                    priority: "HIGH",

                    referenceType:
                        "OTHER",

                    referenceId:
                        result
                            .approvalRequest
                            ._id,

                    metadata: {
                        approvalRequestId:
                            result
                                .approvalRequest
                                ._id,

                        module:
                            result
                                .approvalRequest
                                .module,

                        referenceType:
                            result
                                .approvalRequest
                                .referenceType,

                        referenceId:
                            result
                                .approvalRequest
                                .referenceId,

                        referenceNumber:
                            result
                                .approvalRequest
                                .referenceNumber,

                        level:
                            result.nextStep
                                .level,
                    },

                    createdBy:
                        user._id,
                });
            }
        }

        return result.approvalRequest;
    } catch (error) {
        console.error(
            "Approve Approval Request Error:",
            error.message
        );

        throw error;
    }
};

/*
|--------------------------------------------------------------------------
| Reject Request
|--------------------------------------------------------------------------
*/

const rejectApprovalRequest = async ({
    req = null,
    approvalRequestId,
    user,
    reason,
}) => {
    try {
        /*
        |--------------------------------------------------------------------------
        | Basic Validation
        |--------------------------------------------------------------------------
        */

        if (!approvalRequestId) {
            throw new Error(
                "Approval request ID is required."
            );
        }

        if (!user) {
            throw new Error(
                "Authenticated user is required."
            );
        }

        if (
            !reason ||
            !reason.trim()
        ) {
            throw new Error(
                "Rejection reason is required."
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Rejection Transaction
        |--------------------------------------------------------------------------
        */

        const result =
            await withTransaction(
                async (session) => {
                    const approvalRequest =
                        await ApprovalRequest.findById(
                            approvalRequestId
                        ).session(session);

                    if (!approvalRequest) {
                        throw new Error(
                            "Approval request not found."
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Check Status
                    |--------------------------------------------------------------------------
                    */

                    if (
                        approvalRequest.status !==
                        "PENDING"
                    ) {
                        throw new Error(
                            `Approval request is already ${approvalRequest.status.toLowerCase()}.`
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Current Step
                    |--------------------------------------------------------------------------
                    */

                    const currentStep =
                        approvalRequest.steps.find(
                            (step) =>
                                step.level ===
                                approvalRequest.currentLevel
                        );

                    if (!currentStep) {
                        throw new Error(
                            "Current approval step not found."
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Validate Approver
                    |--------------------------------------------------------------------------
                    */

                    if (
                        !isApproverAllowed(
                            currentStep,
                            user
                        )
                    ) {
                        throw new Error(
                            "You are not authorized to reject this request."
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Old Values
                    |--------------------------------------------------------------------------
                    */

                    const oldValues = {
                        status:
                            approvalRequest.status,

                        currentLevel:
                            approvalRequest.currentLevel,

                        rejectionReason:
                            approvalRequest.rejectionReason,
                    };

                    /*
                    |--------------------------------------------------------------------------
                    | Mark Current Step Rejected
                    |--------------------------------------------------------------------------
                    */

                    currentStep.status =
                        "REJECTED";

                    currentStep.actedBy =
                        user._id;

                    currentStep.actedAt =
                        new Date();

                    currentStep.comments =
                        reason.trim();

                    /*
                    |--------------------------------------------------------------------------
                    | Module Rejection Handler
                    |--------------------------------------------------------------------------
                    */

                    const handler =
                        getApprovalHandler(
                            approvalRequest.module
                        );

                    let moduleActionResult =
                        null;

                    /*
                    |----------------------------------------------------------------------
                    | Execute module rejection action
                    |----------------------------------------------------------------------
                    |
                    | Example:
                    |
                    | PURCHASE_RETURN
                    |   PurchaseReturn.status = REJECTED
                    |   rejectionReason = reason
                    |
                    */

                    if (
                        handler &&
                        typeof handler.onReject ===
                            "function"
                    ) {
                        moduleActionResult =
                            await handler.onReject(
                                {
                                    req,

                                    user,

                                    session,

                                    approvalRequest,

                                    reason:
                                        reason.trim(),
                                }
                            );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Mark Approval Request Rejected
                    |--------------------------------------------------------------------------
                    */

                    approvalRequest.status =
                        "REJECTED";

                    approvalRequest.rejectedBy =
                        user._id;

                    approvalRequest.rejectedAt =
                        new Date();

                    approvalRequest.rejectionReason =
                        reason.trim();

                    approvalRequest.updatedBy =
                        user._id;

                    await approvalRequest.save({
                        session,
                    });

                    return {
                        approvalRequest,

                        oldValues,

                        moduleActionResult,
                    };
                }
            );

        /*
        |--------------------------------------------------------------------------
        | Generic Rejection Audit Log
        |--------------------------------------------------------------------------
        */

        await createRejectionAuditLog({
            req,

            company:
                result.approvalRequest.company,

            branch:
                result.approvalRequest.branch,

            user: user._id,

            module:
                result.approvalRequest.module,

            referenceType:
                result.approvalRequest.referenceType,

            referenceId:
                result.approvalRequest.referenceId,

            referenceNumber:
                result.approvalRequest
                    .referenceNumber,

            description:
                `Approval request ${result.approvalRequest.referenceNumber} rejected.`,

            oldValues:
                result.oldValues,

            newValues: {
                status:
                    result.approvalRequest.status,

                rejectedBy:
                    result.approvalRequest
                        .rejectedBy,

                rejectedAt:
                    result.approvalRequest
                        .rejectedAt,

                rejectionReason:
                    result.approvalRequest
                        .rejectionReason,
            },

            metadata: {
                event: "REJECTED",

                approvalRequestId:
                    result.approvalRequest
                        ._id,

                level:
                    result.approvalRequest
                        .currentLevel,

                rejectionReason:
                    reason.trim(),
            },
        });

        /*
        |--------------------------------------------------------------------------
        | Module After-Rejection Hook
        |--------------------------------------------------------------------------
        */

        if (
            result.moduleActionResult
        ) {
            const handler =
                getApprovalHandler(
                    result.approvalRequest
                        .module
                );

            if (
                handler &&
                typeof handler.afterReject ===
                    "function"
            ) {
                try {
                    await handler.afterReject(
                        {
                            req,

                            user,

                            approvalRequest:
                                result.approvalRequest,

                            moduleActionResult:
                                result.moduleActionResult,

                            reason:
                                reason.trim(),
                        }
                    );
                } catch (hookError) {
                    console.error(
                        "After Rejection Hook Error:",
                        hookError.message
                    );
                }
            }
        }

        return result.approvalRequest;
    } catch (error) {
        console.error(
            "Reject Approval Request Error:",
            error.message
        );

        throw error;
    }
};

/*
|--------------------------------------------------------------------------
| Cancel Request
|--------------------------------------------------------------------------
*/

const cancelApprovalRequest = async ({
    req = null,
    approvalRequestId,
    user,
    reason,
}) => {
    try {
        if (!approvalRequestId) {
            throw new Error(
                "Approval request ID is required."
            );
        }

        if (!user) {
            throw new Error(
                "Authenticated user is required."
            );
        }

        const approvalRequest =
            await ApprovalRequest.findById(
                approvalRequestId
            );

        if (!approvalRequest) {
            throw new Error(
                "Approval request not found."
            );
        }

        if (
            approvalRequest.status !==
            "PENDING"
        ) {
            throw new Error(
                "Only pending requests can be cancelled."
            );
        }

        if (
            approvalRequest.requestedBy.toString() !==
            user._id.toString()
        ) {
            throw new Error(
                "Only the requester can cancel this approval request."
            );
        }

        approvalRequest.status =
            "CANCELLED";

        approvalRequest.cancelledBy =
            user._id;

        approvalRequest.cancelledAt =
            new Date();

        approvalRequest.cancellationReason =
            reason?.trim() || "";

        approvalRequest.updatedBy =
            user._id;

        await approvalRequest.save();

        return approvalRequest;
    } catch (error) {
        console.error(
            "Cancel Approval Request Error:",
            error.message
        );

        throw error;
    }
};

/*
|--------------------------------------------------------------------------
| Module Exports
|--------------------------------------------------------------------------
*/

module.exports = {
    createApprovalRequest,

    approveApprovalRequest,

    rejectApprovalRequest,

    cancelApprovalRequest,

    isApproverAllowed,

    registerApprovalHandler,

    getApprovalHandler,
};