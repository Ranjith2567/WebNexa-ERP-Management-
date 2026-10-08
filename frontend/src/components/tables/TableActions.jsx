import React from "react";
import {
    FiEye,
    FiEdit2,
    FiTrash2,
} from "react-icons/fi";

const TableActions = ({
    onView,
    onEdit,
    onDelete,
    showView = true,
    showEdit = true,
    showDelete = true,
}) => {
    return (
        <div className="common-table-actions">
            {showView && onView && (
                <button
                    type="button"
                    className="common-table-action view"
                    onClick={onView}
                    title="View"
                >
                    <FiEye />
                </button>
            )}

            {showEdit && onEdit && (
                <button
                    type="button"
                    className="common-table-action edit"
                    onClick={onEdit}
                    title="Edit"
                >
                    <FiEdit2 />
                </button>
            )}

            {showDelete && onDelete && (
                <button
                    type="button"
                    className="common-table-action delete"
                    onClick={onDelete}
                    title="Delete"
                >
                    <FiTrash2 />
                </button>
            )}
        </div>
    );
};

export default TableActions;