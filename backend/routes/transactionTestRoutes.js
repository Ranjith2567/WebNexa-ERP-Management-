const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/", async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const db = mongoose.connection.db;

        await db.collection("transaction_test").insertOne(
            {
                message: "Transaction works",
                createdAt: new Date(),
            },
            { session }
        );

        await session.commitTransaction();

        res.json({
            success: true,
            message: "MongoDB transaction is working ✅",
        });
    } catch (error) {
        await session.abortTransaction();

        console.error("Transaction Test Error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    } finally {
        await session.endSession();
    }
});

module.exports = router;