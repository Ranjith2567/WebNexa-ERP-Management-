const express = require("express");

const {
    createCreditNote,
    getCreditNotes,
    getCreditNoteById,
    cancelCreditNote,
    deleteCreditNote,
} = require("../controllers/creditNoteController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// ===============================
// Authentication
// ===============================
router.use(protect);

// ===============================
// Authorization
// ===============================
router.use(authorizeRoles("SUPER_ADMIN"));

// ===============================
// Credit Note Routes
// ===============================

// Create Credit Note
router.post("/", createCreditNote);

// Get all Credit Notes
router.get("/", getCreditNotes);

// Get Credit Note by ID
router.get("/:id", getCreditNoteById);

// Cancel Credit Note
router.patch("/:id/cancel", cancelCreditNote);

// Delete protection
router.delete("/:id", deleteCreditNote);

module.exports = router;