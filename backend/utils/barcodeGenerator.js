const bwipjs = require("bwip-js");

const generateBarcode = async ({
    text,
    type = "code128",
}) => {
    if (!text) {
        throw new Error("Barcode text is required");
    }

    const buffer = await bwipjs.toBuffer({
        bcid: type,
        text: String(text),
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: "center",
    });

    return buffer;
};

module.exports = {
    generateBarcode,
};