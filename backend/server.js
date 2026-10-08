const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// ===============================
// Database Connection
// ===============================
connectDB();

// ===============================
// Global Middleware
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// Auth Routes
// ===============================
const authRoutes = require("./routes/authRoutes");

app.use(
    "/api/auth",
    authRoutes
);

// ===============================
// Company Routes
// ===============================
const companyRoutes =
    require("./routes/companyRoutes");

app.use(
    "/api/companies",
    companyRoutes
);

// ===============================
// Branch Routes
// ===============================
const branchRoutes =
    require("./routes/branchRoutes");

app.use(
    "/api/branches",
    branchRoutes
);

// ===============================
// User / Employee Routes
// ===============================
const userRoutes =
    require("./routes/userRoutes");

app.use(
    "/api/users",
    userRoutes
);

// ===============================
// Department Routes
// ===============================
const departmentRoutes =
    require("./routes/departmentRoutes");

app.use(
    "/api/departments",
    departmentRoutes
);

// ===============================
// Designation Routes
// ===============================
const designationRoutes =
    require("./routes/designationRoutes");

app.use(
    "/api/designations",
    designationRoutes
);

// ===============================
// Category Routes
// ===============================
const categoryRoutes =
    require("./routes/categoryRoutes");

app.use(
    "/api/categories",
    categoryRoutes
);

// ===============================
// Brand Routes
// ===============================
const brandRoutes =
    require("./routes/brandRoutes");

app.use(
    "/api/brands",
    brandRoutes
);

// ===============================
// Unit Routes
// ===============================
const unitRoutes =
    require("./routes/unitRoutes");

app.use(
    "/api/units",
    unitRoutes
);

// ===============================
// Product Routes
// ===============================
const productRoutes =
    require("./routes/productRoutes");

app.use(
    "/api/products",
    productRoutes
);

// ===============================
// Stock Routes
// ===============================
const stockRoutes =
    require("./routes/stockRoutes");

app.use(
    "/api/stocks",
    stockRoutes
);

// ===============================
// Stock Movement Routes
// ===============================
const stockMovementRoutes =
    require("./routes/stockMovementRoutes");

app.use(
    "/api/stock-movements",
    stockMovementRoutes
);

// ===============================
// Stock Transfer Routes
// ===============================
const stockTransferRoutes =
    require("./routes/stockTransferRoutes");

app.use(
    "/api/stock-transfers",
    stockTransferRoutes
);

// ===============================
// Stock Adjustment Routes
// ===============================
const stockAdjustmentRoutes =
    require("./routes/stockAdjustmentRoutes");

app.use(
    "/api/stock-adjustments",
    stockAdjustmentRoutes
);

// ===============================
// Warehouse Routes
// ===============================
const warehouseRoutes =
    require("./routes/warehouseRoutes");

app.use(
    "/api/warehouses",
    warehouseRoutes
);

// ===============================
// Reorder Level Routes
// ===============================
const reorderLevelRoutes =
    require("./routes/reorderLevelRoutes");

app.use(
    "/api/reorder-levels",
    reorderLevelRoutes
);

// ===============================
// Stock Summary Routes
// ===============================
const stockSummaryRoutes =
    require("./routes/stockSummaryRoutes");

app.use(
    "/api/stock-summary",
    stockSummaryRoutes
);

// ===============================
// Supplier Routes
// ===============================
const supplierRoutes =
    require("./routes/supplierRoutes");

app.use(
    "/api/suppliers",
    supplierRoutes
);

// ===============================
// Purchase Order Routes
// ===============================
const purchaseOrderRoutes =
    require("./routes/purchaseOrderRoutes");

app.use(
    "/api/purchase-orders",
    purchaseOrderRoutes
);

// ===============================
// Goods Receipt Routes
// ===============================
const goodsReceiptRoutes =
    require("./routes/goodsReceiptRoutes");

app.use(
    "/api/goods-receipts",
    goodsReceiptRoutes
);

// ===============================
// Purchase Invoice Routes
// ===============================
const purchaseInvoiceRoutes =
    require("./routes/purchaseInvoiceRoutes");

app.use(
    "/api/purchase-invoices",
    purchaseInvoiceRoutes
);

// ===============================
// Purchase Payment Routes
// ===============================
const purchasePaymentRoutes =
    require("./routes/purchasePaymentRoutes");

app.use(
    "/api/purchase-payments",
    purchasePaymentRoutes
);

// ===============================
// Purchase Return Routes
// ===============================
const purchaseReturnRoutes =
    require("./routes/purchaseReturnRoutes");

app.use(
    "/api/purchase-returns",
    purchaseReturnRoutes
);

// ===============================
// Customer Routes
// ===============================
const customerRoutes =
    require("./routes/customerRoutes");

app.use(
    "/api/customers",
    customerRoutes
);

// ===============================
// Quotation Routes
// ===============================
const quotationRoutes =
    require("./routes/quotationRoutes");

app.use(
    "/api/quotations",
    quotationRoutes
);

// ===============================
// Sales Order Routes
// ===============================
const salesOrderRoutes =
    require("./routes/salesOrderRoutes");

app.use(
    "/api/sales-orders",
    salesOrderRoutes
);

// ===============================
// Sales Invoice Routes
// ===============================
const salesInvoiceRoutes =
    require("./routes/salesInvoiceRoutes");

app.use(
    "/api/sales-invoices",
    salesInvoiceRoutes
);

// ===============================
// Sales Payment Routes
// ===============================
const salesPaymentRoutes =
    require("./routes/salesPaymentRoutes");

app.use(
    "/api/sales-payments",
    salesPaymentRoutes
);

// ===============================
// Sales Return Routes
// ===============================
const salesReturnRoutes =
    require("./routes/salesReturnRoutes");

app.use(
    "/api/sales-returns",
    salesReturnRoutes
);

// ===============================
// Credit Note Routes
// ===============================
const creditNoteRoutes =
    require("./routes/creditNoteRoutes");

app.use(
    "/api/credit-notes",
    creditNoteRoutes
);

// ===============================
// Customer Credit Ledger Routes
// ===============================
const customerCreditLedgerRoutes =
    require("./routes/customerCreditLedgerRoutes");

app.use(
    "/api/customer-credit-ledger",
    customerCreditLedgerRoutes
);

// ===============================
// Expense Category Routes
// ===============================
const expenseCategoryRoutes =
    require("./routes/expenseCategoryRoutes");

app.use(
    "/api/expense-categories",
    expenseCategoryRoutes
);

// ===============================
// Expense Routes
// ===============================
const expenseRoutes =
    require("./routes/expenseRoutes");

app.use(
    "/api/expenses",
    expenseRoutes
);

// ===============================
// Account / Chart of Accounts Routes
// ===============================
const accountRoutes =
    require("./routes/accountRoutes");

app.use(
    "/api/accounts",
    accountRoutes
);

// ===============================
// Journal Entry / Accounting Routes
// ===============================
const journalEntryRoutes =
    require("./routes/journalEntryRoutes");

app.use(
    "/api/journal-entries",
    journalEntryRoutes
);

// ===============================
// Ledger Routes
// ===============================
const ledgerEntryRoutes =
    require("./routes/ledgerEntryRoutes");

app.use(
    "/api/ledger-entries",
    ledgerEntryRoutes
);

// ===============================
// Trial Balance Routes
// ===============================
const trialBalanceRoutes =
    require("./routes/trialBalanceRoutes");

app.use(
    "/api/trial-balance",
    trialBalanceRoutes
);

// ===============================
// Dashboard Routes
// ===============================
const dashboardRoutes =
    require("./routes/dashboardRoutes");

app.use(
    "/api/dashboard",
    dashboardRoutes
);

// ===============================
// Notification Routes
// ===============================
const notificationRoutes =
    require("./routes/notificationRoutes");

app.use(
    "/api/notifications",
    notificationRoutes
);

// ===============================
// Reports Routes
// ===============================
const reportRoutes =
    require("./routes/reportRoutes");

app.use(
    "/api/reports",
    reportRoutes
);

// ===============================
// Audit Log Routes
// ===============================
const auditLogRoutes =
    require("./routes/auditLogRoutes");

app.use(
    "/api/audit-logs",
    auditLogRoutes
);

// ===============================
// Approval Workflow Routes
// ===============================
const approvalRoutes =
    require("./routes/approvalRoutes");

app.use(
    "/api/approvals",
    approvalRoutes
);

// ===============================
// Transaction Test Route
// ===============================
const transactionTestRoutes =
    require("./routes/transactionTestRoutes");

app.use(
    "/api/transaction-test",
    transactionTestRoutes
);

// ===============================
// Global Search Routes
// #38 Global Search
// ===============================
const globalSearchRoutes =
    require("./routes/globalSearchRoutes");

app.use(
    "/api/search",
    globalSearchRoutes
);

// ===============================
// Document / File Management Routes
// #39 File / Document Management
// ===============================
const documentRoutes =
    require("./routes/documentRoutes");

app.use(
    "/api/documents",
    documentRoutes
);

// ===============================
// Barcode / QR Routes
// #40 Barcode / QR
// ===============================
const barcodeRoutes =
    require("./routes/barcodeRoutes");

app.use(
    "/api/barcode",
    barcodeRoutes
);

// ===============================
// Test / Health Check Route
// ===============================
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message:
            "WebNexa ERP Backend is running 🚀",
    });
});

// ===============================
// 404 Route
// ===============================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message:
            `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

// ===============================
// Global Error Handler
// #45 Validation / Error Hardening
// ===============================
app.use((err, req, res, next) => {
    console.error("Global Error:", err);

    // --------------------------------
    // Mongoose Validation Error
    // --------------------------------
    if (err.name === "ValidationError") {
        const errors = {};

        Object.keys(err.errors).forEach((field) => {
            errors[field] =
                err.errors[field].message;
        });

        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors,
        });
    }

    // --------------------------------
    // Mongoose Invalid ObjectId
    // --------------------------------
    if (err.name === "CastError") {
        return res.status(400).json({
            success: false,
            message:
                `Invalid ${err.path || "ID"} format`,
        });
    }

    // --------------------------------
    // MongoDB Duplicate Key Error
    // --------------------------------
    if (err.code === 11000) {
        const duplicateFields =
            Object.keys(
                err.keyValue || {}
            );

        return res.status(409).json({
            success: false,
            message:
                "Duplicate value already exists",
            fields: duplicateFields,
        });
    }

    // --------------------------------
    // JSON Payload Syntax Error
    // --------------------------------
    if (
        err instanceof SyntaxError &&
        err.status === 400 &&
        err.type === "entity.parse.failed"
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid JSON request body",
        });
    }

    // --------------------------------
    // Custom HTTP Error
    // --------------------------------
    const statusCode =
        Number.isInteger(err.status) &&
        err.status >= 400 &&
        err.status < 600
            ? err.status
            : 500;

    // --------------------------------
    // Final Error Response
    // --------------------------------
    return res.status(statusCode).json({
        success: false,
        message:
            statusCode === 500
                ? "Internal Server Error"
                : err.message ||
                  "Request failed",
    });
});

// ===============================
// Start Server
// ===============================
const PORT =
    process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `WebNexa ERP Server running on port ${PORT} 🚀`
    );
});