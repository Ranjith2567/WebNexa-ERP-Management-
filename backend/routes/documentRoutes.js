const express = require("express");

const multer = require("multer");

const {
    uploadDocument,
    listDocuments,
    getDocumentById,
    getDocumentDownloadUrl,
    deleteDocument,
} = require("../controllers/documentController");

const {
    protect,
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// MULTER CONFIGURATION
// =====================================================

// Store uploaded file temporarily in memory

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
});


// =====================================================
// UPLOAD DOCUMENT
// =====================================================

router.post(
    "/upload",
    protect,
    upload.single("file"),
    uploadDocument
);


// =====================================================
// LIST DOCUMENTS
// =====================================================

router.get(
    "/",
    protect,
    listDocuments
);


// =====================================================
// GET DOCUMENT DOWNLOAD URL
// =====================================================

// IMPORTANT:
// This route must come BEFORE "/:id"

router.get(
    "/:id/download",
    protect,
    getDocumentDownloadUrl
);


// =====================================================
// DELETE DOCUMENT
// =====================================================

router.delete(
    "/:id",
    protect,
    deleteDocument
);


// =====================================================
// GET SINGLE DOCUMENT
// =====================================================

router.get(
    "/:id",
    protect,
    getDocumentById
);


module.exports = router;