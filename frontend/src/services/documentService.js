import api from "./api";

// =====================================================
// UPLOAD DOCUMENT
// =====================================================

export const uploadDocument = async (formData) => {
    const response = await api.post(
        "/documents/upload",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data;
};


// =====================================================
// GET DOCUMENTS
// =====================================================

export const getDocuments = async (params = {}) => {
    const response = await api.get(
        "/documents",
        {
            params,
        }
    );

    return response.data;
};


// =====================================================
// GET SINGLE DOCUMENT
// =====================================================

export const getDocumentById = async (id) => {
    const response = await api.get(
        `/documents/${id}`
    );

    return response.data;
};


// =====================================================
// GET DOCUMENT DOWNLOAD URL
// =====================================================

export const getDocumentDownloadUrl = async (id) => {
    const response = await api.get(
        `/documents/${id}/download`
    );

    return response.data;
};


// =====================================================
// DELETE DOCUMENT
// =====================================================

export const deleteDocument = async (id) => {
    const response = await api.delete(
        `/documents/${id}`
    );

    return response.data;
};


// =====================================================
// EXPORT
// =====================================================

export default {
    uploadDocument,
    getDocuments,
    getDocumentById,
    getDocumentDownloadUrl,
    deleteDocument,
};