const {
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const {
    getSignedUrl,
} = require("@aws-sdk/s3-request-presigner");

const b2Client = require("../config/b2");


// =====================================================
// UPLOAD FILE TO BACKBLAZE B2
// =====================================================

const uploadToB2 = async ({
    buffer,
    fileName,
    mimeType,
}) => {
    const command = new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: mimeType,
    });

    await b2Client.send(command);

    return {
        storageKey: fileName,
        bucket: process.env.B2_BUCKET_NAME,
    };
};


// =====================================================
// GENERATE SIGNED DOWNLOAD URL
// =====================================================

const generateSignedUrl = async ({
    fileName,
    expiresIn = 300,
}) => {
    const command = new GetObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: fileName,
    });

    const signedUrl = await getSignedUrl(
        b2Client,
        command,
        {
            expiresIn,
        }
    );

    return signedUrl;
};


// =====================================================
// DELETE FILE FROM BACKBLAZE B2
// =====================================================

const deleteFromB2 = async ({
    fileName,
}) => {
    const command = new DeleteObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: fileName,
    });

    await b2Client.send(command);

    return true;
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    uploadToB2,
    generateSignedUrl,
    deleteFromB2,
};