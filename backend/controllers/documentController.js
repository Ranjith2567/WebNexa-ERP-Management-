const crypto = require("crypto");
const path = require("path");

const Document = require("../models/documentModel");

const {
    uploadToB2,
    generateSignedUrl,
    deleteFromB2,
} = require("../services/b2Service");


// =====================================================
// UPLOAD DOCUMENT
// =====================================================

const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "File is required",
            });
        }

        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const {
            company,
            branch,
            entityType,
            entityId,
            description,
            isPublic,
        } = req.body;

        if (!company || !branch || !entityType) {
            return res.status(400).json({
                success: false,
                message: "Company, branch and entityType are required",
            });
        }

        const originalName = path.basename(
            req.file.originalname
        );

        const extension = path.extname(originalName);

        const uniqueName =
            `${crypto.randomUUID()}${extension}`;

        const storageKey =
            `documents/${entityType.toLowerCase()}/${uniqueName}`;

        await uploadToB2({
            buffer: req.file.buffer,
            fileName: storageKey,
            mimeType: req.file.mimetype,
        });

        const document = await Document.create({
            company,
            branch,
            originalName,
            fileName: uniqueName,
            storageKey,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            entityType,
            entityId: entityId || null,
            description: description || "",
            isPublic:
                isPublic === "true" ||
                isPublic === true,
            uploadedBy: req.user._id,
        });

        return res.status(201).json({
            success: true,
            message: "Document uploaded successfully",
            data: document,
        });

    } catch (error) {
        console.error(
            "Upload Document Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to upload document",
            error: error.message,
        });
    }
};


// =====================================================
// LIST DOCUMENTS
// =====================================================

const listDocuments = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const {
            company,
            branch,
            entityType,
            entityId,
            page = 1,
            limit = 10,
        } = req.query;

        const currentPage = Math.max(
            parseInt(page, 10) || 1,
            1
        );

        const currentLimit = Math.min(
            Math.max(
                parseInt(limit, 10) || 10,
                1
            ),
            50
        );

        const skip =
            (currentPage - 1) * currentLimit;

        const filter = {};

        if (company) {
            filter.company = company;
        }

        if (branch) {
            filter.branch = branch;
        }

        if (entityType) {
            filter.entityType =
                entityType.toUpperCase();
        }

        if (entityId) {
            filter.entityId = entityId;
        }

        const totalDocuments =
            await Document.countDocuments(filter);

        const documents =
            await Document.find(filter)
                .populate(
                    "uploadedBy",
                    "name email"
                )
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(currentLimit)
                .lean();

        const totalPages = Math.ceil(
            totalDocuments / currentLimit
        );

        return res.status(200).json({
            success: true,
            message: "Documents fetched successfully",
            data: documents,
            pagination: {
                currentPage,
                limit: currentLimit,
                totalDocuments,
                totalPages,
                hasNextPage:
                    currentPage < totalPages,
                hasPreviousPage:
                    currentPage > 1,
            },
        });

    } catch (error) {
        console.error(
            "List Documents Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch documents",
            error: error.message,
        });
    }
};


// =====================================================
// GET SINGLE DOCUMENT
// =====================================================

const getDocumentById = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const { id } = req.params;

        const document =
            await Document.findById(id)
                .populate(
                    "uploadedBy",
                    "name email"
                )
                .lean();

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Document fetched successfully",
            data: document,
        });

    } catch (error) {
        console.error(
            "Get Document Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch document",
            error: error.message,
        });
    }
};


// =====================================================
// GENERATE DOCUMENT DOWNLOAD URL
// =====================================================

const getDocumentDownloadUrl = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const { id } = req.params;

        const document =
            await Document.findById(id).lean();

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        const signedUrl =
            await generateSignedUrl({
                fileName: document.storageKey,
                expiresIn: 300,
            });

        return res.status(200).json({
            success: true,
            message:
                "Document download URL generated successfully",
            data: {
                documentId: document._id,
                originalName:
                    document.originalName,
                mimeType: document.mimeType,
                fileSize: document.fileSize,
                expiresIn: 300,
                url: signedUrl,
            },
        });

    } catch (error) {
        console.error(
            "Get Document Download URL Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to generate document download URL",
            error: error.message,
        });
    }
};


// =====================================================
// DELETE DOCUMENT
// =====================================================

const deleteDocument = async (req, res) => {
    try {
        // Auth user check
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const { id } = req.params;

        // Find document
        const document =
            await Document.findById(id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        // Delete actual file from B2
        await deleteFromB2({
            fileName: document.storageKey,
        });

        // Delete metadata from MongoDB
        await Document.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message:
                "Document deleted successfully",
            data: {
                documentId: document._id,
                originalName:
                    document.originalName,
                storageKey:
                    document.storageKey,
            },
        });

    } catch (error) {
        console.error(
            "Delete Document Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete document",
            error: error.message,
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    uploadDocument,
    listDocuments,
    getDocumentById,
    getDocumentDownloadUrl,
    deleteDocument,
};