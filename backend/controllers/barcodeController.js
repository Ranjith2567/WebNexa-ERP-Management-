const Product = require("../models/Product");

const {
    generateBarcode,
} = require("../utils/barcodeGenerator");

const {
    generateQRCode,
} = require("../utils/qrGenerator");


// =====================================================
// GENERATE PRODUCT BARCODE
// =====================================================

const generateProductBarcode = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id)
            .select("name sku barcode")
            .lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        if (!product.barcode) {
            return res.status(400).json({
                success: false,
                message: "Product barcode is not available",
            });
        }

        const buffer = await generateBarcode({
            text: product.barcode,
        });

        res.set({
            "Content-Type": "image/png",
            "Content-Disposition":
                `inline; filename="${product.barcode}.png"`,
        });

        return res.send(buffer);

    } catch (error) {
        console.error(
            "Generate Product Barcode Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to generate product barcode",
            error: error.message,
        });
    }
};


// =====================================================
// GENERATE PRODUCT QR CODE
// =====================================================

const generateProductQRCode = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id)
            .select("name sku barcode")
            .lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const qrData = JSON.stringify({
            type: "PRODUCT",
            productId: product._id,
            name: product.name,
            sku: product.sku,
            barcode: product.barcode || null,
        });

        const buffer = await generateQRCode({
            text: qrData,
        });

        res.set({
            "Content-Type": "image/png",
            "Content-Disposition":
                `inline; filename="${product.sku || product._id}-qr.png"`,
        });

        return res.send(buffer);

    } catch (error) {
        console.error(
            "Generate Product QR Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to generate product QR code",
            error: error.message,
        });
    }
};


// =====================================================
// LOOKUP PRODUCT BY BARCODE
// =====================================================

const lookupProductByBarcode = async (req, res) => {
    try {
        const { barcode } = req.params;

        if (!barcode || !barcode.trim()) {
            return res.status(400).json({
                success: false,
                message: "Barcode is required",
            });
        }

        const product = await Product.findOne({
            barcode: barcode.trim(),
        }).lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found for this barcode",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product found successfully",
            data: product,
        });

    } catch (error) {
        console.error(
            "Lookup Product By Barcode Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to lookup product by barcode",
            error: error.message,
        });
    }
};


// =====================================================
// LOOKUP PRODUCT BY QR CODE
// =====================================================

const lookupProductByQRCode = async (req, res) => {
    try {
        const { value } = req.body;

        if (!value || !String(value).trim()) {
            return res.status(400).json({
                success: false,
                message: "QR code value is required",
            });
        }

        const qrValue = String(value).trim();

        let qrData = null;

        // -------------------------------------------------
        // Try parsing QR JSON
        // -------------------------------------------------

        try {
            qrData = JSON.parse(qrValue);
        } catch (parseError) {
            qrData = null;
        }

        // -------------------------------------------------
        // Validate QR type
        // -------------------------------------------------

        if (
            qrData &&
            qrData.type &&
            qrData.type !== "PRODUCT"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product QR code",
            });
        }

        let product = null;

        // -------------------------------------------------
        // Search by Product ID
        // -------------------------------------------------

        if (
            qrData &&
            qrData.productId
        ) {
            product =
                await Product.findById(
                    qrData.productId
                ).lean();
        }

        // -------------------------------------------------
        // Search by Barcode
        // -------------------------------------------------

        if (
            !product &&
            qrData &&
            qrData.barcode
        ) {
            product =
                await Product.findOne({
                    barcode: qrData.barcode,
                }).lean();
        }

        // -------------------------------------------------
        // Search by SKU
        // -------------------------------------------------

        if (
            !product &&
            qrData &&
            qrData.sku
        ) {
            product =
                await Product.findOne({
                    sku: qrData.sku,
                }).lean();
        }

        // -------------------------------------------------
        // Fallback:
        // QR value itself may be a barcode
        // -------------------------------------------------

        if (!product) {
            product =
                await Product.findOne({
                    barcode: qrValue,
                }).lean();
        }

        // -------------------------------------------------
        // Product not found
        // -------------------------------------------------

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found for this QR code",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product found successfully",
            data: product,
        });

    } catch (error) {
        console.error(
            "Lookup Product By QR Code Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to lookup product by QR code",
            error: error.message,
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    generateProductBarcode,
    generateProductQRCode,
    lookupProductByBarcode,
    lookupProductByQRCode,
};