const express = require("express");

const {
    getSalesReport,
    getPurchaseReport,
    getInventoryReport,
    getExpenseReport,

    exportSalesReportExcel,
    exportPurchaseReportExcel,
    exportInventoryReportExcel,
    exportExpenseReportExcel,

    exportSalesReportPDF,
    exportPurchaseReportPDF,
    exportInventoryReportPDF,
    exportExpenseReportPDF,
} = require("../controllers/reportController");

const {
    protect,
} = require("../middleware/authMiddleware");

const {
    authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// AUTHENTICATION
// =====================================================

router.use(protect);

// =====================================================
// AUTHORIZATION
// =====================================================

router.use(
    authorizeRoles("SUPER_ADMIN")
);

// =====================================================
// SALES REPORT
// =====================================================

router.get(
    "/sales",
    getSalesReport
);

// =====================================================
// PURCHASE REPORT
// =====================================================

router.get(
    "/purchases",
    getPurchaseReport
);

// =====================================================
// INVENTORY / STOCK REPORT
// =====================================================

router.get(
    "/inventory",
    getInventoryReport
);

// =====================================================
// EXPENSE REPORT
// =====================================================

router.get(
    "/expenses",
    getExpenseReport
);

// =====================================================
// EXCEL EXPORT REPORTS
// =====================================================

// SALES EXCEL
router.get(
    "/sales/excel",
    exportSalesReportExcel
);

// PURCHASE EXCEL
router.get(
    "/purchases/excel",
    exportPurchaseReportExcel
);

// INVENTORY EXCEL
router.get(
    "/inventory/excel",
    exportInventoryReportExcel
);

// EXPENSE EXCEL
router.get(
    "/expenses/excel",
    exportExpenseReportExcel
);

// =====================================================
// PDF EXPORT REPORTS
// =====================================================

// SALES PDF
router.get(
    "/sales/pdf",
    exportSalesReportPDF
);

// PURCHASE PDF
router.get(
    "/purchases/pdf",
    exportPurchaseReportPDF
);

// INVENTORY PDF
router.get(
    "/inventory/pdf",
    exportInventoryReportPDF
);

// EXPENSE PDF
router.get(
    "/expenses/pdf",
    exportExpenseReportPDF
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;