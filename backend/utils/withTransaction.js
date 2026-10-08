const mongoose = require("mongoose");

const withTransaction = async (callback) => {
    const session = await mongoose.startSession();

    try {
        console.log("TRANSACTION START");
        console.log("MongoDB Host:", mongoose.connection.host);
        console.log("MongoDB Name:", mongoose.connection.name);
        console.log("MongoDB Topology:", mongoose.connection.getClient().topology?.description?.type);

        session.startTransaction();

        console.log("TRANSACTION STARTED");

        const result = await callback(session);

        console.log("CALLBACK COMPLETED");

        await session.commitTransaction();

        console.log("TRANSACTION COMMITTED");

        return result;
    } catch (error) {
        console.error("TRANSACTION ERROR:", error);

        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        throw error;
    } finally {
        await session.endSession();
    }
};

module.exports = {
    withTransaction,
};