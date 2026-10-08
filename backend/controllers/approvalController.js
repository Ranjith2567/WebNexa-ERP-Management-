const mongoose = require("mongoose");
const ApprovalRequest = require("../models/ApprovalRequest");

const {
    createApprovalRequest,
    approveApprovalRequest,
    rejectApprovalRequest,
    cancelApprovalRequest,
} = require("../services/approvalService");

/*
|--------------------------------------------------------------------------
| Create Approval Request
|--------------------------------------------------------------------------
*/

const createApproval = async (req, res) => {
    try {
        const {
            module,
            referenceType,
            referenceId,
            referenceNumber,
            title,
            description,
            steps,
            metadata,
        } = req.body;

        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */

        if (!module) {
            return res.status(400).json({
                success: false,
                message: "Module is required.",
            });
        }

        if (!referenceType) {
            return res.status(400).json({
                success: false,
                message: "Reference type is required.",
            });
        }

        if (
            !referenceId ||
            !mongoose.Types.ObjectId.isValid(referenceId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid reference ID is required.",
            });
        }

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Approval title is required.",
            });
        }

        if (!Array.isArray(steps) || steps.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "At least one approval step is required.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Create Approval Request
        |--------------------------------------------------------------------------
        */

        const approvalRequest =
            await createApprovalRequest({
                req,

                company:
                    req.user.company,

                branch:
                    req.user.branch || null,

                module,

                referenceType,

                referenceId,

                referenceNumber:
                    referenceNumber || "",

                title,

                description:
                    description || "",

                requestedBy:
                    req.user._id,

                steps,

                metadata:
                    metadata || {},
            });

        return res.status(201).json({
            success: true,

            message:
                "Approval request created successfully.",

            data: approvalRequest,
        });
    } catch (error) {
        console.error(
            "Create Approval Controller Error:",
            error
        );

        return res.status(400).json({
            success: false,

            message:
                error.message ||
                "Failed to create approval request.",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Get Approval Requests
|--------------------------------------------------------------------------
*/

const getApprovals = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            module,
            status,
            requestedBy,
            referenceType,
            referenceId,
            search,
        } = req.query;

        /*
        |--------------------------------------------------------------------------
        | Company Validation
        |--------------------------------------------------------------------------
        */

        const company =
            req.user.company;

        if (!company) {
            return res.status(400).json({
                success: false,

                message:
                    "Company is not assigned to the authenticated user.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Base Query
        |--------------------------------------------------------------------------
        */

        const query = {
            company,
        };

        /*
        |--------------------------------------------------------------------------
        | Module Filter
        |--------------------------------------------------------------------------
        */

        if (module) {
            query.module = module;
        }

        /*
        |--------------------------------------------------------------------------
        | Status Filter
        |--------------------------------------------------------------------------
        */

        if (status) {
            query.status = status;
        }

        /*
        |--------------------------------------------------------------------------
        | Requested By Filter
        |--------------------------------------------------------------------------
        */

        if (requestedBy) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    requestedBy
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid requestedBy ID.",
                });
            }

            query.requestedBy =
                requestedBy;
        }

        /*
        |--------------------------------------------------------------------------
        | Reference Type Filter
        |--------------------------------------------------------------------------
        */

        if (referenceType) {
            query.referenceType =
                referenceType;
        }

        /*
        |--------------------------------------------------------------------------
        | Reference ID Filter
        |--------------------------------------------------------------------------
        */

        if (referenceId) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    referenceId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid reference ID.",
                });
            }

            query.referenceId =
                referenceId;
        }

        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        if (
            search &&
            search.trim()
        ) {
            const searchText =
                search.trim();

            query.$or = [
                {
                    title: {
                        $regex:
                            searchText,
                        $options: "i",
                    },
                },

                {
                    referenceNumber: {
                        $regex:
                            searchText,
                        $options: "i",
                    },
                },

                {
                    description: {
                        $regex:
                            searchText,
                        $options: "i",
                    },
                },
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Pagination
        |--------------------------------------------------------------------------
        */

        const currentPage =
            Math.max(
                Number(page) || 1,
                1
            );

        const pageLimit =
            Math.min(
                Math.max(
                    Number(limit) || 20,
                    1
                ),
                100
            );

        const skip =
            (currentPage - 1) *
            pageLimit;

        /*
        |--------------------------------------------------------------------------
        | Fetch Data
        |--------------------------------------------------------------------------
        */

        const [
            approvals,
            total,
        ] = await Promise.all([
            ApprovalRequest.find(
                query
            )
                .populate(
                    "requestedBy",
                    "name email role"
                )
                .populate(
                    "approvedBy",
                    "name email role"
                )
                .populate(
                    "rejectedBy",
                    "name email role"
                )
                .populate(
                    "cancelledBy",
                    "name email role"
                )
                .populate(
                    "createdBy",
                    "name email role"
                )
                .populate(
                    "updatedBy",
                    "name email role"
                )
                .populate(
                    "steps.approverUser",
                    "name email role"
                )
                .populate(
                    "steps.actedBy",
                    "name email role"
                )
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(pageLimit)
                .lean(),

            ApprovalRequest.countDocuments(
                query
            ),
        ]);

        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({
            success: true,

            count:
                approvals.length,

            total,

            page:
                currentPage,

            limit:
                pageLimit,

            totalPages:
                total === 0
                    ? 0
                    : Math.ceil(
                          total /
                              pageLimit
                      ),

            data:
                approvals,
        });
    } catch (error) {
        console.error(
            "Get Approvals Error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to fetch approval requests.",

            error:
                error.message,
        });
    }
};

/*
|--------------------------------------------------------------------------
| Get Approval By ID
|--------------------------------------------------------------------------
*/

const getApprovalById = async (
    req,
    res
) => {
    try {
        const {
            id,
        } = req.params;

        /*
        |--------------------------------------------------------------------------
        | Validate ID
        |--------------------------------------------------------------------------
        */

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                success: false,

                message:
                    "Invalid approval request ID.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Find Approval
        |--------------------------------------------------------------------------
        */

        const approvalRequest =
            await ApprovalRequest.findOne({
                _id: id,

                company:
                    req.user.company,
            })
                .populate(
                    "requestedBy",
                    "name email role"
                )
                .populate(
                    "approvedBy",
                    "name email role"
                )
                .populate(
                    "rejectedBy",
                    "name email role"
                )
                .populate(
                    "cancelledBy",
                    "name email role"
                )
                .populate(
                    "createdBy",
                    "name email role"
                )
                .populate(
                    "updatedBy",
                    "name email role"
                )
                .populate(
                    "steps.approverUser",
                    "name email role"
                )
                .populate(
                    "steps.actedBy",
                    "name email role"
                )
                .lean();

        /*
        |--------------------------------------------------------------------------
        | Not Found
        |--------------------------------------------------------------------------
        */

        if (!approvalRequest) {
            return res.status(404).json({
                success: false,

                message:
                    "Approval request not found.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({
            success: true,

            data:
                approvalRequest,
        });
    } catch (error) {
        console.error(
            "Get Approval By ID Error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to fetch approval request.",

            error:
                error.message,
        });
    }
};

/*
|--------------------------------------------------------------------------
| Approve Approval Request
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Purchase Return processing is NOT done here directly.
|
| approvalService.js handles:
|
| Final Approval
|       ↓
| getApprovalHandler()
|       ↓
| PURCHASE_RETURN
|       ↓
| onFinalApprove()
|
| This prevents duplicate stock deduction.
|
|--------------------------------------------------------------------------
*/

const approveApproval = async (
    req,
    res
) => {
    try {
        const {
            id,
        } = req.params;

        const {
            comments = "",
        } = req.body;

        /*
        |--------------------------------------------------------------------------
        | Validate ID
        |--------------------------------------------------------------------------
        */

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                success: false,

                message:
                    "Invalid approval request ID.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Check Approval Exists
        |--------------------------------------------------------------------------
        */

        const approvalRequest =
            await ApprovalRequest.findOne({
                _id: id,

                company:
                    req.user.company,
            }).select("_id");

        if (!approvalRequest) {
            return res.status(404).json({
                success: false,

                message:
                    "Approval request not found.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Approve
        |--------------------------------------------------------------------------
        */

        const result =
            await approveApprovalRequest({
                req,

                approvalRequestId:
                    id,

                user:
                    req.user,

                comments,
            });

        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({
            success: true,

            message:
                result.status ===
                "APPROVED"
                    ? "Approval request fully approved."
                    : "Approval level approved successfully.",

            data:
                result,
        });
    } catch (error) {
        console.error(
            "Approve Approval Controller Error:",
            error
        );

        return res.status(400).json({
            success: false,

            message:
                error.message ||
                "Failed to approve approval request.",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Reject Approval Request
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Purchase Return rejection is NOT handled directly here.
|
| approvalService.js handles:
|
| Reject
|   ↓
| getApprovalHandler()
|   ↓
| PURCHASE_RETURN
|   ↓
| onReject()
|
|--------------------------------------------------------------------------
*/

const rejectApproval = async (
    req,
    res
) => {
    try {
        const {
            id,
        } = req.params;

        const {
            reason,
        } = req.body;

        /*
        |--------------------------------------------------------------------------
        | Validate ID
        |--------------------------------------------------------------------------
        */

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                success: false,

                message:
                    "Invalid approval request ID.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Validate Reason
        |--------------------------------------------------------------------------
        */

        if (
            !reason ||
            !reason.trim()
        ) {
            return res.status(400).json({
                success: false,

                message:
                    "Rejection reason is required.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Check Approval Exists
        |--------------------------------------------------------------------------
        */

        const approvalRequest =
            await ApprovalRequest.findOne({
                _id: id,

                company:
                    req.user.company,
            }).select("_id");

        if (!approvalRequest) {
            return res.status(404).json({
                success: false,

                message:
                    "Approval request not found.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Reject
        |--------------------------------------------------------------------------
        */

        const result =
            await rejectApprovalRequest({
                req,

                approvalRequestId:
                    id,

                user:
                    req.user,

                reason:
                    reason.trim(),
            });

        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({
            success: true,

            message:
                "Approval request rejected successfully.",

            data:
                result,
        });
    } catch (error) {
        console.error(
            "Reject Approval Controller Error:",
            error
        );

        return res.status(400).json({
            success: false,

            message:
                error.message ||
                "Failed to reject approval request.",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Cancel Approval Request
|--------------------------------------------------------------------------
*/

const cancelApproval = async (
    req,
    res
) => {
    try {
        const {
            id,
        } = req.params;

        const {
            reason = "",
        } = req.body;

        /*
        |--------------------------------------------------------------------------
        | Validate ID
        |--------------------------------------------------------------------------
        */

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                success: false,

                message:
                    "Invalid approval request ID.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Check Approval Exists
        |--------------------------------------------------------------------------
        */

        const approvalRequest =
            await ApprovalRequest.findOne({
                _id: id,

                company:
                    req.user.company,
            }).select("_id");

        if (!approvalRequest) {
            return res.status(404).json({
                success: false,

                message:
                    "Approval request not found.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Cancel
        |--------------------------------------------------------------------------
        */

        const result =
            await cancelApprovalRequest({
                req,

                approvalRequestId:
                    id,

                user:
                    req.user,

                reason:
                    reason.trim(),
            });

        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({
            success: true,

            message:
                "Approval request cancelled successfully.",

            data:
                result,
        });
    } catch (error) {
        console.error(
            "Cancel Approval Controller Error:",
            error
        );

        return res.status(400).json({
            success: false,

            message:
                error.message ||
                "Failed to cancel approval request.",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
    createApproval,

    getApprovals,

    getApprovalById,

    approveApproval,

    rejectApproval,

    cancelApproval,
};