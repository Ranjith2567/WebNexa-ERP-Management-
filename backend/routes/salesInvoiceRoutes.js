const express = require("express");

const {
    createSalesInvoice,
    getSalesInvoices,
    getSalesInvoiceById,
    updateSalesInvoice,
    updateSalesInvoiceStatus,
    deleteSalesInvoice,
} = require("../controllers/salesInvoiceController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

router.use(protect);

/*
|--------------------------------------------------------------------------
| Sales Invoice access
|--------------------------------------------------------------------------
|
| For now SUPER_ADMIN only.
| Later we can change this to permission-based:
| sales.view / sales.create / sales.edit etc.
|
*/

router.use(authorizeRoles("SUPER_ADMIN"));

/*
|--------------------------------------------------------------------------
| Create Invoice
|--------------------------------------------------------------------------
|
| POST /api/sales-invoices
|
*/

router.post("/", createSalesInvoice);

/*
|--------------------------------------------------------------------------
| Get All Invoices
|--------------------------------------------------------------------------
|
| GET /api/sales-invoices
|
*/

router.get("/", getSalesInvoices);

/*
|--------------------------------------------------------------------------
| Get Invoice By ID
|--------------------------------------------------------------------------
|
| GET /api/sales-invoices/:id
|
*/

router.get("/:id", getSalesInvoiceById);

/*
|--------------------------------------------------------------------------
| Update Invoice
|--------------------------------------------------------------------------
|
| PATCH /api/sales-invoices/:id
|
*/

router.patch("/:id", updateSalesInvoice);

/*
|--------------------------------------------------------------------------
| Update Invoice Status
|--------------------------------------------------------------------------
|
| PATCH /api/sales-invoices/:id/status
|
*/

router.patch(
    "/:id/status",
    updateSalesInvoiceStatus
);

/*
|--------------------------------------------------------------------------
| Delete Invoice
|--------------------------------------------------------------------------
|
| DELETE /api/sales-invoices/:id
|
*/

router.delete(
    "/:id",
    deleteSalesInvoice
);

module.exports = router;