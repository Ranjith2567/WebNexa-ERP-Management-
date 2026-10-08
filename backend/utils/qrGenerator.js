const QRCode = require("qrcode");

const generateQRCode = async ({
    text,
}) => {
    if (!text) {
        throw new Error("QR code text is required");
    }

    const buffer = await QRCode.toBuffer(
        String(text),
        {
            type: "png",
            width: 500,
            margin: 2,
            errorCorrectionLevel: "M",
        }
    );

    return buffer;
};

module.exports = {
    generateQRCode,
};