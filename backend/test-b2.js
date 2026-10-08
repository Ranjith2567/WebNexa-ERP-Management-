require("dotenv").config();

const b2Client = require("./config/b2");

const {
    HeadBucketCommand,
} = require("@aws-sdk/client-s3");

async function testB2Connection() {
    try {
        await b2Client.send(
            new HeadBucketCommand({
                Bucket: process.env.B2_BUCKET_NAME,
            })
        );

        console.log("✅ Backblaze B2 Connected Successfully");
        console.log(`📦 Bucket: ${process.env.B2_BUCKET_NAME}`);
    } catch (error) {
        console.error("❌ B2 Connection Failed");
        console.error(error.message);
    }
}

testB2Connection();