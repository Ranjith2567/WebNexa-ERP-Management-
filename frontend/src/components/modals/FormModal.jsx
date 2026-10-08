import React from "react";
import { FiX } from "react-icons/fi";

const FormModal = ({
    isOpen,
    title = "Form",
    children,
    onClose,
    onSubmit,
    submitText = "Save",
    cancelText = "Cancel",
    loading = false,
    size = "medium",
}) => {
    if (!isOpen) return null;

    return (
        <div className="common-modal-overlay" onClick={onClose}>
            <div
                className={`common-form-modal common-form-modal-${size}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="common-form-modal-header">
                    <h3>{title}</h3>

                    <button
                        type="button"
                        className="common-modal-close"
                        onClick={onClose}
                        disabled={loading}
                    >
                        <FiX />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={onSubmit}>
                    <div className="common-form-modal-body">
                        {children}
                    </div>

                    {/* Footer */}
                    <div className="common-form-modal-footer">
                        <button
                            type="button"
                            className="common-btn common-btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            {cancelText}
                        </button>

                        <button
                            type="submit"
                            className="common-btn common-btn-primary"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : submitText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormModal;