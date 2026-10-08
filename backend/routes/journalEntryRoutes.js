const express = require("express");

const {
    createJournalEntry,
    getJournalEntries,
    getJournalEntryById,
    updateJournalEntry,
    postJournalEntry,
    cancelJournalEntry,
    deleteJournalEntry,
} = require("../controllers/journalEntryController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// Authentication & Authorization
// =====================================================

router.use(protect);
router.use(authorizeRoles("SUPER_ADMIN"));

// =====================================================
// Journal Entry Routes
// =====================================================

// Create Journal Entry
router.post("/", createJournalEntry);

// Get All Journal Entries
router.get("/", getJournalEntries);

// Get Journal Entry By ID
router.get("/:id", getJournalEntryById);

// Update DRAFT Journal Entry
router.patch("/:id", updateJournalEntry);

// Post DRAFT Journal Entry
router.patch("/:id/post", postJournalEntry);

// Cancel Journal Entry
router.patch("/:id/cancel", cancelJournalEntry);

// Delete DRAFT Journal Entry
router.delete("/:id", deleteJournalEntry);

module.exports = router;