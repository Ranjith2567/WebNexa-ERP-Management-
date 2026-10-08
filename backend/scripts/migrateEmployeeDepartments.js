const mongoose = require("mongoose");
const dotenv = require("dotenv");

const User = require("../models/User");
const Department = require("../models/Department");

dotenv.config();

const migrateEmployeeDepartments = async () => {
    try {
        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log(
            "MongoDB Connected Successfully ✅"
        );

        // Find users whose department is still stored as String
        const users =
            await User.collection
                .find({
                    department: {
                        $type: "string",
                    },
                })
                .toArray();

        console.log(
            `Found ${users.length} employee(s) with old department data.`
        );

        let migrated = 0;
        let cleared = 0;

        for (const user of users) {
            const departmentName =
                user.department?.trim();

            if (!departmentName) {
                await User.collection.updateOne(
                    {
                        _id: user._id,
                    },
                    {
                        $set: {
                            department: null,
                        },
                    }
                );

                cleared++;
                continue;
            }

            const department =
                await Department.findOne({
                    company: user.company,
                    name: {
                        $regex: `^${departmentName}$`,
                        $options: "i",
                    },
                }).select("_id");

            if (department) {
                await User.collection.updateOne(
                    {
                        _id: user._id,
                    },
                    {
                        $set: {
                            department:
                                department._id,
                        },
                    }
                );

                console.log(
                    `✅ ${user.name} → ${departmentName}`
                );

                migrated++;
            } else {
                await User.collection.updateOne(
                    {
                        _id: user._id,
                    },
                    {
                        $set: {
                            department: null,
                        },
                    }
                );

                console.log(
                    `⚠️ ${user.name}: Department "${departmentName}" not found. Set to null.`
                );

                cleared++;
            }
        }

        console.log(
            "\n================================="
        );
        console.log(
            "Department Migration Completed"
        );
        console.log(
            "================================="
        );
        console.log(
            `Migrated: ${migrated}`
        );
        console.log(
            `Cleared: ${cleared}`
        );

        process.exit(0);
    } catch (error) {
        console.error(
            "Migration Error ❌"
        );
        console.error(error);

        process.exit(1);
    }
};

migrateEmployeeDepartments();