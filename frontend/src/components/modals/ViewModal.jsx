import React from "react";
import { FiX } from "react-icons/fi";

const ViewModal = ({
    isOpen,
    title = "View Details",
    children,
    onClose,
    size = "medium",
}) => {
    if (!isOpen) return null;

    return (
        <div className="common-modal-overlay" onClick={onClose}>
            <div
                className={`common-view-modal common-view-modal-${size}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="common-view-modal-header">
                    <h3>{title}</h3>

                    <button
                        type="button"
                        className="common-modal-close"
                        onClick={onClose}
                    >
                        <FiX />
                    </button>
                </div>

                {/* Body */}
                <div className="common-view-modal-body">
                    {children}
                </div>

                {/* Footer */}
                <div className="common-view-modal-footer">
                    <button
                        type="button"
                        className="common-btn common-btn-secondary"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewModal;