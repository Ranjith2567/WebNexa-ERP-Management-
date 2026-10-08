const express = require("express");

const {
    createApproval,
    getApprovals,
    getApprovalById,
    approveApproval,
    rejectApproval,
    cancelApproval,
} = require("../controllers/approvalController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Approval Routes
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    protect,
    createApproval
);

router.get(
    "/",
    protect,
    getApprovals
);

router.get(
    "/:id",
    protect,
    getApprovalById
);

router.post(
    "/:id/approve",
    protect,
    approveApproval
);

router.post(
    "/:id/reject",
    protect,
    rejectApproval
);

router.post(
    "/:id/cancel",
    protect,
    cancelApproval
);

module.exports = router;