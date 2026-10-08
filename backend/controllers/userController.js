const mongoose = require("mongoose");
const path = require("path");
const crypto = require("crypto");

const User = require("../models/User");
const Company = require("../models/Company");
const Branch = require("../models/Branch");
const Department = require("../models/Department");
const Designation = require("../models/Designation");
const {
    uploadToB2,
    generateSignedUrl,
    deleteFromB2,
} = require("../services/b2Service");

// =====================================
// GENERATE EMPLOYEE ID
// =====================================
const generateEmployeeId = async () => {
    const lastEmployee = await User.findOne({
        employeeId: { $ne: null },
    })
        .sort({ createdAt: -1 })
        .select("employeeId");

    if (!lastEmployee || !lastEmployee.employeeId) {
        return "EMP-0001";
    }

    const lastNumber = parseInt(
        lastEmployee.employeeId.replace("EMP-", ""),
        10
    );

    const nextNumber = lastNumber + 1;

    return `EMP-${String(nextNumber).padStart(4, "0")}`;
};

// =====================================
// VALIDATE DEPARTMENT
// =====================================
const validateDepartment = async (
    departmentId,
    companyId,
    branchId = null
) => {
    if (!departmentId) {
        return null;
    }

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        const error = new Error("Invalid department ID");
        error.status = 400;
        throw error;
    }

    const department = await Department.findOne({
        _id: departmentId,
        company: companyId,
        isActive: true,
    });

    if (!department) {
        const error = new Error(
            "Department not found or department does not belong to this company"
        );
        error.status = 404;
        throw error;
    }

    // If department belongs to a specific branch,
    // employee branch must match it.
    if (
        department.branch &&
        branchId &&
        department.branch.toString() !== branchId.toString()
    ) {
        const error = new Error(
            "Department does not belong to the selected branch"
        );
        error.status = 400;
        throw error;
    }

    return department;
};

// =====================================
// VALIDATE DESIGNATION
// =====================================
const validateDesignation = async (
    designationId,
    companyId
) => {
    if (!designationId) {
        return null;
    }

    // Check valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(designationId)) {
        const error = new Error("Invalid designation ID");
        error.status = 400;
        throw error;
    }

    // Check designation exists, belongs to company
    // and is active
    const designation = await Designation.findOne({
        _id: designationId,
        company: companyId,
        isActive: true,
    });

    if (!designation) {
        const error = new Error(
            "Designation not found or designation does not belong to this company"
        );
        error.status = 404;
        throw error;
    }

    return designation;
};

// =====================================
// CREATE EMPLOYEE
// =====================================
const createEmployee = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            password,
            company,
            branch,
            role,
            permissions,
            department,
            designation,
            joiningDate,
            dateOfBirth,
            gender,
            address,
        } = req.body;

        // =====================================
        // REQUIRED FIELDS
        // =====================================
        if (
            !name ||
            !email ||
            !password ||
            !company ||
            !branch
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email, password, company and branch are required",
            });
        }

        // =====================================
        // CHECK COMPANY
        // =====================================
        if (!mongoose.Types.ObjectId.isValid(company)) {
            return res.status(400).json({
                success: false,
                message: "Invalid company ID",
            });
        }

        const existingCompany =
            await Company.findById(company);

        if (!existingCompany) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        // =====================================
        // CHECK BRANCH
        // =====================================
        if (!mongoose.Types.ObjectId.isValid(branch)) {
            return res.status(400).json({
                success: false,
                message: "Invalid branch ID",
            });
        }

        const existingBranch =
            await Branch.findOne({
                _id: branch,
                company: company,
                isActive: true,
            });

        if (!existingBranch) {
            return res.status(404).json({
                success: false,
                message:
                    "Branch not found or branch does not belong to this company",
            });
        }

        // =====================================
        // CHECK DEPARTMENT
        // =====================================
        if (department) {
            await validateDepartment(
                department,
                company,
                branch
            );
        }

        // =====================================
        // CHECK DESIGNATION
        // =====================================
        if (designation) {
            await validateDesignation(
                designation,
                company
            );
        }

        // =====================================
        // CHECK DUPLICATE EMAIL
        // =====================================
        const existingUser =
            await User.findOne({
                email: email.toLowerCase(),
            });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered",
            });
        }

        // =====================================
        // GENERATE EMPLOYEE ID
        // =====================================
        const employeeId =
            await generateEmployeeId();

        // =====================================
        // CREATE EMPLOYEE
        // =====================================
        const employee =
            await User.create({
                name,
                email: email.toLowerCase(),
                phone,
                password,
                employeeId,
                company,
                branch,
                role: role || "EMPLOYEE",
                permissions: permissions || [],
                department: department || null,
                designation: designation || null,
                joiningDate,
                dateOfBirth,
                gender,
                address,
            });

        // =====================================
        // POPULATE RESPONSE
        // =====================================
        const populatedEmployee =
            await User.findById(employee._id)
                .select("-password")
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "branch",
                    "name branchCode"
                )
                .populate(
                    "department",
                    "name code description head"
                )
                .populate(
                    "designation",
                    "name code description level isActive"
                );

        res.status(201).json({
            success: true,
            message:
                "Employee created successfully",
            employee: populatedEmployee,
        });
    } catch (error) {
        console.error(
            "Create Employee Error:",
            error
        );

        res.status(error.status || 500).json({
            success: false,
            message:
                error.message ||
                "Failed to create employee",
        });
    }
};

// =====================================
// GET ALL EMPLOYEES
// SEARCH + PAGINATION + FILTERS
// =====================================
const getEmployees = async (req, res) => {
    try {
        const {
            search = "",
            company,
            branch,
            role,
            department,
            designation,
            isActive,
            page = 1,
            limit = 10,
        } = req.query;

        // =====================================
        // BUILD FILTER
        // =====================================
        const filter = {};

        // =====================================
        // COMPANY
        // =====================================
        if (company) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    company
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid company ID",
                });
            }

            filter.company = company;
        }

        // =====================================
        // BRANCH
        // =====================================
        if (branch) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    branch
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid branch ID",
                });
            }

            filter.branch = branch;
        }

        // =====================================
        // ROLE
        // =====================================
        if (role) {
            filter.role = role;
        }

        // =====================================
        // DEPARTMENT
        // =====================================
        if (department) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    department
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid department ID",
                });
            }

            filter.department = department;
        }

        // =====================================
        // DESIGNATION
        // =====================================
        if (designation) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    designation
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid designation ID",
                });
            }

            filter.designation = designation;
        }

        // =====================================
        // ACTIVE / INACTIVE
        // =====================================
        if (isActive !== undefined) {
            filter.isActive =
                isActive === "true";
        }

        // =====================================
        // SEARCH
        // Name / Email / Employee ID / Phone
        // Department Name / Designation Name
        // =====================================
        if (search.trim()) {
            const searchText =
                search.trim();

            // -------------------------------------
            // FIND MATCHING DEPARTMENTS
            // -------------------------------------
            const matchingDepartments =
                await Department.find({
                    name: {
                        $regex: searchText,
                        $options: "i",
                    },
                    ...(company
                        ? { company }
                        : {}),
                }).select("_id");

            const departmentIds =
                matchingDepartments.map(
                    (dept) => dept._id
                );

            // -------------------------------------
            // FIND MATCHING DESIGNATIONS
            // -------------------------------------
            const matchingDesignations =
                await Designation.find({
                    $or: [
                        {
                            name: {
                                $regex: searchText,
                                $options: "i",
                            },
                        },
                        {
                            code: {
                                $regex: searchText,
                                $options: "i",
                            },
                        },
                    ],
                    ...(company
                        ? { company }
                        : {}),
                }).select("_id");

            const designationIds =
                matchingDesignations.map(
                    (designation) =>
                        designation._id
                );

            // -------------------------------------
            // MAIN SEARCH
            // -------------------------------------
            filter.$or = [
                {
                    name: {
                        $regex: searchText,
                        $options: "i",
                    },
                },
                {
                    email: {
                        $regex: searchText,
                        $options: "i",
                    },
                },
                {
                    employeeId: {
                        $regex: searchText,
                        $options: "i",
                    },
                },
                {
                    phone: {
                        $regex: searchText,
                        $options: "i",
                    },
                },
            ];

            // Department search
            if (departmentIds.length > 0) {
                filter.$or.push({
                    department: {
                        $in: departmentIds,
                    },
                });
            }

            // Designation search
            if (designationIds.length > 0) {
                filter.$or.push({
                    designation: {
                        $in: designationIds,
                    },
                });
            }
        }

        // =====================================
        // PAGINATION
        // =====================================
        const currentPage = Math.max(
            parseInt(page, 10) || 1,
            1
        );

        const itemsPerPage = Math.min(
            Math.max(
                parseInt(limit, 10) || 10,
                1
            ),
            100
        );

        const skip =
            (currentPage - 1) *
            itemsPerPage;

        // =====================================
        // TOTAL EMPLOYEE COUNT
        // =====================================
        const totalEmployees =
            await User.countDocuments(filter);

        // =====================================
        // FETCH EMPLOYEES
        // =====================================
        const employees =
            await User.find(filter)
                .select("-password")
                .populate(
                    "company",
                    "name"
                )
                .populate(
                    "branch",
                    "name branchCode"
                )
                .populate(
                    "department",
                    "name code description head"
                )
                .populate(
                    "designation",
                    "name code description level isActive"
                )
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(itemsPerPage);

        // =====================================
        // TOTAL PAGES
        // =====================================
        const totalPages =
            Math.ceil(
                totalEmployees /
                    itemsPerPage
            );

        // =====================================
        // RESPONSE
        // =====================================
        res.status(200).json({
            success: true,

            pagination: {
                totalEmployees,
                currentPage,
                itemsPerPage,
                totalPages,

                hasNextPage:
                    currentPage <
                    totalPages,

                hasPreviousPage:
                    currentPage > 1,
            },

            filters: {
                search,

                company:
                    company || null,

                branch:
                    branch || null,

                role:
                    role || null,

                department:
                    department || null,

                designation:
                    designation || null,

                isActive:
                    isActive !== undefined
                        ? isActive ===
                          "true"
                        : null,
            },

            employees,
        });
    } catch (error) {
        console.error(
            "Get Employees Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch employees",
            error: error.message,
        });
    }
};

// =====================================
// GET EMPLOYEE BY ID
// =====================================
const getEmployeeById = async (
    req,
    res
) => {
    try {
        // =====================================
        // VALIDATE ID
        // =====================================
        if (
            !mongoose.Types.ObjectId.isValid(
                req.params.id
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid employee ID",
            });
        }

        const employee =
            await User.findById(
                req.params.id
            )
                .select("-password")
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "branch",
                    "name branchCode"
                )
                .populate(
                    "department",
                    "name code description head"
                )
                .populate(
                    "designation",
                    "name code description level isActive"
                );

        if (!employee) {
            return res.status(404).json({
                success: false,
                message:
                    "Employee not found",
            });
        }

        res.status(200).json({
            success: true,
            employee,
        });
    } catch (error) {
        console.error(
            "Get Employee Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch employee",
            error: error.message,
        });
    }
};

// =====================================
// UPDATE EMPLOYEE
// =====================================
const updateEmployee = async (
    req,
    res
) => {
    try {
        // =====================================
        // VALIDATE EMPLOYEE ID
        // =====================================
        if (
            !mongoose.Types.ObjectId.isValid(
                req.params.id
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid employee ID",
            });
        }

        const employee =
            await User.findById(
                req.params.id
            );

        if (!employee) {
            return res.status(404).json({
                success: false,
                message:
                    "Employee not found",
            });
        }

        const {
            name,
            email,
            phone,
            company,
            branch,
            role,
            permissions,
            department,
            designation,
            joiningDate,
            dateOfBirth,
            gender,
            address,
            profileImage,
            isActive,
        } = req.body;

        // =====================================
        // EMAIL UPDATE
        // =====================================
        if (email !== undefined) {
            const normalizedEmail =
                email.toLowerCase();

            const existingUser =
                await User.findOne({
                    email: normalizedEmail,
                    _id: {
                        $ne: employee._id,
                    },
                });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Email already registered by another user",
                });
            }

            employee.email =
                normalizedEmail;
        }

        // =====================================
        // DETERMINE FINAL COMPANY
        // =====================================
        const finalCompany =
            company !== undefined
                ? company
                : employee.company;

        // =====================================
        // COMPANY UPDATE
        // =====================================
        if (company !== undefined) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    company
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid company ID",
                });
            }

            const existingCompany =
                await Company.findById(
                    company
                );

            if (!existingCompany) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Company not found",
                });
            }

            employee.company = company;
        }

        // =====================================
        // DETERMINE FINAL BRANCH
        // =====================================
        const finalBranch =
            branch !== undefined
                ? branch
                : employee.branch;

        // =====================================
        // BRANCH UPDATE
        // =====================================
        if (branch !== undefined) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    branch
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid branch ID",
                });
            }

            const existingBranch =
                await Branch.findOne({
                    _id: branch,
                    company:
                        finalCompany,
                    isActive: true,
                });

            if (!existingBranch) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Branch not found or branch does not belong to this company",
                });
            }

            employee.branch = branch;
        }

        // =====================================
        // DEPARTMENT UPDATE
        // =====================================
        if (department !== undefined) {
            if (
                department === null ||
                department === ""
            ) {
                employee.department = null;
            } else {
                await validateDepartment(
                    department,
                    finalCompany,
                    finalBranch
                );

                employee.department =
                    department;
            }
        }

        // =====================================
        // DESIGNATION UPDATE
        // =====================================
        if (designation !== undefined) {
            if (
                designation === null ||
                designation === ""
            ) {
                employee.designation = null;
            } else {
                await validateDesignation(
                    designation,
                    finalCompany
                );

                employee.designation =
                    designation;
            }
        }

        // =====================================
        // BASIC DETAILS
        // =====================================
        if (name !== undefined) {
            employee.name = name;
        }

        if (phone !== undefined) {
            employee.phone = phone;
        }

        if (role !== undefined) {
            employee.role = role;
        }

        if (permissions !== undefined) {
            employee.permissions =
                permissions;
        }

        if (joiningDate !== undefined) {
            employee.joiningDate =
                joiningDate;
        }

        if (dateOfBirth !== undefined) {
            employee.dateOfBirth =
                dateOfBirth;
        }

        if (gender !== undefined) {
            employee.gender = gender;
        }

        if (address !== undefined) {
            employee.address = address;
        }

        if (profileImage !== undefined) {
            employee.profileImage =
                profileImage;
        }

        if (isActive !== undefined) {
            employee.isActive =
                isActive;
        }

        // =====================================
        // SAVE
        // =====================================
        await employee.save();

        // =====================================
        // POPULATE UPDATED EMPLOYEE
        // =====================================
        const updatedEmployee =
            await User.findById(
                employee._id
            )
                .select("-password")
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "branch",
                    "name branchCode"
                )
                .populate(
                    "department",
                    "name code description head"
                )
                .populate(
                    "designation",
                    "name code description level isActive"
                );

        res.status(200).json({
            success: true,
            message:
                "Employee updated successfully",
            employee:
                updatedEmployee,
        });
    } catch (error) {
        console.error(
            "Update Employee Error:",
            error
        );

        res.status(error.status || 500).json({
            success: false,
            message:
                error.message ||
                "Failed to update employee",
        });
    }
};
// =====================================
// GET MY PROFILE
// =====================================
const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select("-password -resetPasswordToken -resetPasswordExpires")
            .populate(
                "company",
                "name legalName"
            )
            .populate(
                "branch",
                "name branchCode"
            )
            .populate(
                "department",
                "name code description head"
            )
            .populate(
                "designation",
                "name code description level isActive"
            );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            user,
        });
    } catch (error) {
        console.error(
            "Get My Profile Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch profile",
        });
    }
};
// =====================================
// UPDATE MY PROFILE
// =====================================
const updateMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const {
            name,
            phone,
            address,
            profileImage,
            gender,
            dateOfBirth,
        } = req.body;

        // =====================================
        // BASIC DETAILS
        // =====================================
        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Name cannot be empty",
                });
            }

            user.name = name.trim();
        }

        if (phone !== undefined) {
            user.phone = phone.trim();
        }

        // =====================================
        // ADDRESS
        // =====================================
        if (address !== undefined) {
            if (
                typeof address !== "object" ||
                address === null
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid address format",
                });
            }

            user.address = {
                ...user.address?.toObject?.(),
                ...address,
            };
        }

        // =====================================
        // PROFILE IMAGE
        // =====================================
        if (profileImage !== undefined) {
            user.profileImage =
                profileImage;
        }

        // =====================================
        // GENDER
        // =====================================
        if (gender !== undefined) {
            if (
                !["MALE", "FEMALE", "OTHER", ""].includes(
                    gender
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid gender",
                });
            }

            user.gender = gender;
        }

        // =====================================
        // DATE OF BIRTH
        // =====================================
        if (dateOfBirth !== undefined) {
            if (
                dateOfBirth !== null &&
                isNaN(Date.parse(dateOfBirth))
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid date of birth",
                });
            }

            user.dateOfBirth =
                dateOfBirth;
        }

        // =====================================
        // SAVE
        // =====================================
        await user.save();

        // =====================================
        // POPULATE RESPONSE
        // =====================================
        const updatedUser =
            await User.findById(user._id)
                .select(
                    "-password -resetPasswordToken -resetPasswordExpires"
                )
                .populate(
                    "company",
                    "name legalName"
                )
                .populate(
                    "branch",
                    "name branchCode"
                )
                .populate(
                    "department",
                    "name code description head"
                )
                .populate(
                    "designation",
                    "name code description level isActive"
                );

        return res.status(200).json({
            success: true,
            message:
                "Profile updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error(
            "Update My Profile Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update profile",
            error: error.message,
        });
    }
};
const bcrypt = require("bcryptjs");

// =====================================
// CHANGE MY PASSWORD
// =====================================
const changeMyPassword = async (req, res) => {
    try {
        const {
            currentPassword,
            newPassword,
        } = req.body;

        // =====================================
        // REQUIRED FIELDS
        // =====================================
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Current password and new password are required",
            });
        }

        // =====================================
        // PASSWORD LENGTH
        // =====================================
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must be at least 6 characters",
            });
        }

        // =====================================
        // GET USER WITH PASSWORD
        // =====================================
        const user = await User.findById(
            req.user._id
        ).select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // =====================================
        // VERIFY CURRENT PASSWORD
        // =====================================
        const isMatch =
            await bcrypt.compare(
                currentPassword,
                user.password
            );

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message:
                    "Current password is incorrect",
            });
        }

        // =====================================
        // PREVENT SAME PASSWORD
        // =====================================
        const isSamePassword =
            await bcrypt.compare(
                newPassword,
                user.password
            );

        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must be different from current password",
            });
        }

        // =====================================
        // UPDATE PASSWORD
        // User pre-save hook will hash it
        // =====================================
        user.password = newPassword;

        await user.save();

        return res.status(200).json({
            success: true,
            message:
                "Password changed successfully",
        });
    } catch (error) {
        console.error(
            "Change Password Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to change password",
        });
    }
};
const uploadMyProfileImage = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Profile image is required",
            });
        }

        const allowedMimeTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                message:
                    "Only JPG, PNG and WEBP images are allowed",
            });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const extension =
            path.extname(req.file.originalname)
                .toLowerCase();

        const uniqueName =
            `${crypto.randomUUID()}${extension}`;

        const storageKey =
            `profile-images/${user._id}/${uniqueName}`;

        // Upload new image
        await uploadToB2({
            buffer: req.file.buffer,
            fileName: storageKey,
            mimeType: req.file.mimetype,
        });

        // Delete old profile image from B2
        if (
            user.profileImage &&
            user.profileImage.startsWith("profile-images/")
        ) {
            try {
                await deleteFromB2({
                    fileName: user.profileImage,
                });
            } catch (deleteError) {
                console.error(
                    "Old Profile Image Delete Error:",
                    deleteError
                );
            }
        }

        // Store B2 storage key
        user.profileImage = storageKey;

        await user.save();

        // Generate temporary signed URL
        const signedUrl =
            await generateSignedUrl({
                fileName: storageKey,
                expiresIn: 300,
            });

        return res.status(200).json({
            success: true,
            message: "Profile image uploaded successfully",
            data: {
                profileImage: storageKey,
                url: signedUrl,
                expiresIn: 300,
            },
        });

    } catch (error) {
        console.error(
            "Upload Profile Image Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to upload profile image",
            error: error.message,
        });
    }
};
// =====================================
// DELETE EMPLOYEE
// =====================================
const deleteEmployee = async (
    req,
    res
) => {
    try {
        // =====================================
        // VALIDATE EMPLOYEE ID
        // =====================================
        if (
            !mongoose.Types.ObjectId.isValid(
                req.params.id
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid employee ID",
            });
        }

        const employee =
            await User.findById(
                req.params.id
            );

        if (!employee) {
            return res.status(404).json({
                success: false,
                message:
                    "Employee not found",
            });
        }

        await employee.deleteOne();

        res.status(200).json({
            success: true,
            message:
                "Employee deleted successfully",
        });
    } catch (error) {
        console.error(
            "Delete Employee Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to delete employee",
            error: error.message,
        });
    }
};

// =====================================
// EXPORT
// =====================================
module.exports = {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    getMyProfile,
    updateMyProfile,
    changeMyPassword,
    uploadMyProfileImage,
};