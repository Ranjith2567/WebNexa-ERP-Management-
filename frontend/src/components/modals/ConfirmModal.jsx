import React from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";

const ConfirmModal = ({
    isOpen,
    title = "Confirm Action",
    message = "Are you sure you want to continue?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    loading = false,
    danger = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="common-modal-overlay" onClick={onCancel}>
            <div
                className="common-confirm-modal"
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
                <div
                    className={`common-confirm-icon ${
                        danger ? "danger" : ""
                    }`}
                >
                    <FiAlertTriangle />
                </div>

                {/* Content */}
                <div className="common-confirm-content">
                    <h3>{title}</h3>
                    <p>{message}</p>
                </div>

                {/* Actions */}
                <div className="common-confirm-actions">
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
                        className={`common-btn ${
                            danger
                                ? "common-btn-danger"
                                : "common-btn-primary"
                        }`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;