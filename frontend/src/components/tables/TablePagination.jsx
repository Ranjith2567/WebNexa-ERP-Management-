import React from "react";
import {
    FiChevronLeft,
    FiChevronRight,
} from "react-icons/fi";

const TablePagination = ({
    page = 1,
    totalPages = 1,
    total = 0,
    onPrevious,
    onNext,
    disabled = false,
}) => {
    return (
        <div className="common-table-pagination">
            <div className="common-table-pagination-info">
                Showing page <strong>{page}</strong> of{" "}
                <strong>{totalPages}</strong>
                {total > 0 && (
                    <span> · {total} records</span>
                )}
            </div>

            <div className="common-table-pagination-buttons">
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={
                        disabled || page <= 1
                    }
                >
                    <FiChevronLeft />
                    Previous
                </button>

                <button
                    type="button"
                    onClick={onNext}
                    disabled={
                        disabled ||
                        page >= totalPages
                    }
                >
                    Next
                    <FiChevronRight />
                </button>
            </div>
        </div>
    );
};

export default TablePagination;