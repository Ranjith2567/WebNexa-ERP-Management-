const mongoose = require("mongoose");
const dotenv = require("dotenv");

const User = require("../models/User");
const Designation = require("../models/Designation");

dotenv.config();

const migrateEmployeeDesignations = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Connected Successfully ✅");

        const users =
            await User.collection
                .find({
                    designation: {
                        $type: "string",
                    },
                })
                .toArray();

        console.log(
            `Found ${users.length} employee(s) with old designation data.`
        );

        let migrated = 0;
        let cleared = 0;

        for (const user of users) {
            const designationName =
                user.designation?.trim();

            if (!designationName) {
                await User.collection.updateOne(
                    { _id: user._id },
                    { $set: { designation: null } }
                );

                cleared++;
                continue;
            }

            const designation =
                await Designation.findOne({
                    company: user.company,
                    name: {
                        $regex: `^${designationName}$`,
                        $options: "i",
                    },
                }).select("_id");

            if (designation) {
                await User.collection.updateOne(
                    { _id: user._id },
                    {
                        $set: {
                            designation: designation._id,
                        },
                    }
                );

                console.log(
                    `✅ ${user.name} → ${designationName}`
                );

                migrated++;
            } else {
                await User.collection.updateOne(
                    { _id: user._id },
                    { $set: { designation: null } }
                );

                console.log(
                    `⚠️ ${user.name}: Designation "${designationName}" not found. Set to null.`
                );

                cleared++;
            }
        }

        console.log("\n=================================");
        console.log("Designation Migration Completed");
        console.log("=================================");
        console.log(`Migrated: ${migrated}`);
        console.log(`Cleared: ${cleared}`);

        process.exit(0);
    } catch (error) {
        console.error("Designation Migration Error ❌");
        console.error(error);

        process.exit(1);
    }
};

migrateEmployeeDesignations();