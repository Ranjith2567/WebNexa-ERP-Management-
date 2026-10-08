const express = require("express");

const {
    generateProductBarcode,
    generateProductQRCode,
    lookupProductByBarcode,
    lookupProductByQRCode,
} = require("../controllers/barcodeController");

const {
    protect,
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// GENERATE PRODUCT BARCODE
// =====================================================

router.get(
    "/product/:id",
    protect,
    generateProductBarcode
);


// =====================================================
// GENERATE PRODUCT QR CODE
// =====================================================

router.get(
    "/product/:id/qr",
    protect,
    generateProductQRCode
);


// =====================================================
// LOOKUP PRODUCT BY BARCODE
// =====================================================

router.get(
    "/lookup/barcode/:barcode",
    protect,
    lookupProductByBarcode
);


// =====================================================
// LOOKUP PRODUCT BY QR CODE
// =====================================================

router.post(
    "/lookup/qr",
    protect,
    lookupProductByQRCode
);


module.exports = router;