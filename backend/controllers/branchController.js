const Branch = require("../models/Branch");
const Company = require("../models/Company");
const User = require("../models/User");

// =====================================
// CREATE BRANCH
// =====================================
const createBranch = async (req, res) => {
    try {
        const {
            company,
            name,
            branchCode,
            email,
            phone,
            address,
            manager,
            isMainBranch,
        } = req.body;

        // Required fields
        if (!company || !name || !branchCode) {
            return res.status(400).json({
                success: false,
                message:
                    "Company, branch name and branch code are required",
            });
        }

        // Check company
        const existingCompany = await Company.findById(company);

        if (!existingCompany) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        // Check duplicate branch code
        const existingBranch = await Branch.findOne({
            company,
            branchCode: branchCode.trim().toUpperCase(),
        });

        if (existingBranch) {
            return res.status(409).json({
                success: false,
                message:
                    "Branch code already exists for this company",
            });
        }

        // Check manager if provided
        if (manager) {
            const managerUser = await User.findById(manager);

            if (!managerUser) {
                return res.status(404).json({
                    success: false,
                    message: "Branch manager not found",
                });
            }
        }

        // If this is main branch,
        // remove main status from existing branches
        if (isMainBranch === true) {
            await Branch.updateMany(
                { company },
                { $set: { isMainBranch: false } }
            );
        }

        const branch = await Branch.create({
            company,
            name: name.trim(),
            branchCode: branchCode.trim().toUpperCase(),
            email,
            phone,
            address,
            manager: manager || null,
            isMainBranch: isMainBranch || false,
            createdBy: req.user._id,
        });

        const populatedBranch = await Branch.findById(branch._id)
            .populate("company", "name legalName")
            .populate("manager", "name email role")
            .populate("createdBy", "name email");

        res.status(201).json({
            success: true,
            message: "Branch created successfully",
            branch: populatedBranch,
        });
    } catch (error) {
        console.error("Create Branch Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create branch",
            error: error.message,
        });
    }
};


// =====================================
// GET ALL BRANCHES
// =====================================
const getBranches = async (req, res) => {
    try {
        const { company } = req.query;

        const filter = {};

        if (company) {
            filter.company = company;
        }

        const branches = await Branch.find(filter)
            .populate("company", "name legalName")
            .populate("manager", "name email role")
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: branches.length,
            branches,
        });
    } catch (error) {
        console.error("Get Branches Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch branches",
            error: error.message,
        });
    }
};


// =====================================
// GET BRANCH BY ID
// =====================================
const getBranchById = async (req, res) => {
    try {
        const branch = await Branch.findById(req.params.id)
            .populate("company", "name legalName")
            .populate("manager", "name email role")
            .populate("createdBy", "name email");

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: "Branch not found",
            });
        }

        res.status(200).json({
            success: true,
            branch,
        });
    } catch (error) {
        console.error("Get Branch Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch branch",
            error: error.message,
        });
    }
};


// =====================================
// UPDATE BRANCH
// =====================================
const updateBranch = async (req, res) => {
    try {
        const branch = await Branch.findById(req.params.id);

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: "Branch not found",
            });
        }

        const {
            name,
            branchCode,
            email,
            phone,
            address,
            manager,
            isMainBranch,
            isActive,
        } = req.body;

        // =====================================
        // DEBUG LOGS
        // =====================================

        console.log("\n=====================================");
        console.log("UPDATE BRANCH REQUEST");
        console.log("=====================================");

        console.log("Branch ID:", req.params.id);

        console.log("Request Body:", req.body);

        console.log("Address Received:", address);

        console.log("Existing Branch Address:", branch.address);

        console.log("=====================================\n");


        // =====================================
        // CHECK DUPLICATE BRANCH CODE
        // =====================================

        if (branchCode !== undefined) {
            const formattedCode =
                branchCode.trim().toUpperCase();

            const duplicateBranch =
                await Branch.findOne({
                    company: branch.company,
                    branchCode: formattedCode,
                    _id: { $ne: branch._id },
                });

            if (duplicateBranch) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Branch code already exists for this company",
                });
            }

            branch.branchCode = formattedCode;
        }


        // =====================================
        // CHECK MANAGER
        // =====================================

        if (
            manager !== undefined &&
            manager !== null &&
            manager !== ""
        ) {
            const managerUser =
                await User.findById(manager);

            if (!managerUser) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Branch manager not found",
                });
            }

            branch.manager = manager;
        }


        // =====================================
        // UPDATE NAME
        // =====================================

        if (name !== undefined) {
            branch.name = name.trim();
        }


        // =====================================
        // UPDATE EMAIL
        // =====================================

        if (email !== undefined) {
            branch.email = email;
        }


        // =====================================
        // UPDATE PHONE
        // =====================================

        if (phone !== undefined) {
            branch.phone = phone;
        }


        // =====================================
        // UPDATE ADDRESS
        // =====================================

        if (address !== undefined) {
            console.log(
                "Updating Address With:",
                address
            );

            branch.address = address;
        }


        // =====================================
        // MAIN BRANCH HANDLING
        // =====================================

        if (isMainBranch === true) {
            await Branch.updateMany(
                {
                    company: branch.company,
                    _id: { $ne: branch._id },
                },
                {
                    $set: {
                        isMainBranch: false,
                    },
                }
            );

            branch.isMainBranch = true;
        } else if (isMainBranch === false) {
            branch.isMainBranch = false;
        }


        // =====================================
        // ACTIVE STATUS
        // =====================================

        if (isActive !== undefined) {
            branch.isActive = isActive;
        }


        // =====================================
        // BEFORE SAVE DEBUG
        // =====================================

        console.log("\n=====================================");
        console.log("BEFORE SAVE");
        console.log("=====================================");

        console.log(
            "Branch Address Before Save:",
            branch.address
        );

        console.log(
            "Branch Name:",
            branch.name
        );

        console.log(
            "Branch Code:",
            branch.branchCode
        );

        console.log(
            "Branch Email:",
            branch.email
        );

        console.log(
            "Branch Phone:",
            branch.phone
        );

        console.log(
            "Is Main Branch:",
            branch.isMainBranch
        );

        console.log(
            "Is Active:",
            branch.isActive
        );

        console.log("=====================================\n");


        // =====================================
        // SAVE
        // =====================================

        await branch.save();


        // =====================================
        // AFTER SAVE DEBUG
        // =====================================

        console.log("\n=====================================");
        console.log("AFTER SAVE");
        console.log("=====================================");

        console.log(
            "Saved Branch ID:",
            branch._id
        );

        console.log(
            "Saved Address:",
            branch.address
        );

        console.log(
            "Saved Branch Name:",
            branch.name
        );

        console.log(
            "Saved Branch Code:",
            branch.branchCode
        );

        console.log("=====================================\n");


        // =====================================
        // FETCH UPDATED BRANCH
        // =====================================

        const updatedBranch =
            await Branch.findById(branch._id)
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "manager",
                    "name email role"
                )
                .populate(
                    "createdBy",
                    "name email"
                );


        // =====================================
        // FINAL DATABASE RESULT DEBUG
        // =====================================

        console.log("\n=====================================");
        console.log("DATABASE RESULT");
        console.log("=====================================");

        console.log(
            "Updated Branch:",
            updatedBranch
        );

        console.log(
            "Database Address:",
            updatedBranch?.address
        );

        console.log("=====================================\n");


        // =====================================
        // RESPONSE
        // =====================================

        res.status(200).json({
            success: true,
            message: "Branch updated successfully",
            branch: updatedBranch,
        });

    } catch (error) {
        console.error(
            "\n====================================="
        );

        console.error(
            "UPDATE BRANCH ERROR"
        );

        console.error(
            "====================================="
        );

        console.error(error);

        console.error(
            "Error Message:",
            error.message
        );

        console.error(
            "Error Stack:",
            error.stack
        );

        console.error(
            "=====================================\n"
        );

        res.status(500).json({
            success: false,
            message: "Failed to update branch",
            error: error.message,
        });
    }
};


// =====================================
// DELETE BRANCH
// =====================================
const deleteBranch = async (req, res) => {
    try {
        const branch = await Branch.findById(req.params.id);

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: "Branch not found",
            });
        }

        await branch.deleteOne();

        res.status(200).json({
            success: true,
            message: "Branch deleted successfully",
        });
    } catch (error) {
        console.error("Delete Branch Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete branch",
            error: error.message,
        });
    }
};


// =====================================
// EXPORT
// =====================================

module.exports = {
    createBranch,
    getBranches,
    getBranchById,
    updateBranch,
    deleteBranch,
};