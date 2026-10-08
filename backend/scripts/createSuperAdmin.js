const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("../models/User");

dotenv.config();

const createSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Connected ✅");

        const existingAdmin = await User.findOne({
            email: "admin@webnexa.com",
        });

        if (existingAdmin) {
            console.log("Super Admin already exists ⚠️");
            process.exit(0);
        }

        const admin = await User.create({
            name: "WebNexa Super Admin",
            email: "admin@webnexa.com",
            phone: "9999999999",
            password: "Admin@123456",
            role: "SUPER_ADMIN",
            permissions: [
                "users.view",
                "users.create",
                "users.edit",
                "users.delete",

                "employees.view",
                "employees.create",
                "employees.edit",
                "employees.delete",

                "sales.view",
                "sales.create",
                "sales.edit",
                "sales.delete",

                "purchase.view",
                "purchase.create",
                "purchase.edit",
                "purchase.delete",

                "inventory.view",
                "inventory.create",
                "inventory.edit",
                "inventory.delete",

                "reports.view",
                "settings.view",
                "settings.edit",
            ],
        });

        console.log("=================================");
        console.log("SUPER ADMIN CREATED ✅");
        console.log("=================================");
        console.log("Name:", admin.name);
        console.log("Email:", admin.email);
        console.log("Role:", admin.role);
        console.log("=================================");

        process.exit(0);
    } catch (error) {
        console.error("Super Admin Creation Failed ❌");
        console.error(error.message);

        process.exit(1);
    }
};

createSuperAdmin();