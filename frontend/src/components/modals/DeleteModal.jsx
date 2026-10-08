import React from "react";
import { FiAlertTriangle, FiTrash2, FiX } from "react-icons/fi";

const DeleteModal = ({
    isOpen,
    title = "Delete Item",
    message = "Are you sure you want to delete this item?",
    itemName = "",
    confirmText = "Delete",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    loading = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="common-modal-overlay" onClick={onCancel}>
            <div
                className="common-delete-modal"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    type="button"
                    className="common-modal-close"
                    onClick={onCancel}
                    disabled={loading}
                >
                    <FiX />
                </button>

                {/* Icon */}
                <div className="common-delete-icon">
                    <FiTrash2 />
                </div>

                {/* Content */}
                <div className="common-delete-content">
                    <h3>{title}</h3>

                    <p>{message}</p>

                    {itemName && (
                        <div className="common-delete-item">
                            <span>Selected item</span>
                            <strong>{itemName}</strong>
                        </div>
                    )}

                    <small>
                        This action cannot be undone.
                    </small>
                </div>

                {/* Actions */}
                <div className="common-delete-actions">
                    <button
                        type="button"
                        className="common-btn common-btn-secondary"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        className="common-btn common-btn-danger"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            "Deleting..."
                        ) : (
                            <>
                                <FiTrash2 />
                                {confirmText}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;