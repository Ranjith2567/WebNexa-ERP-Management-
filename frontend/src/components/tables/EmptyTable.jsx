import React from "react";
import { FiInbox } from "react-icons/fi";

const EmptyTable = ({
    message = "No records found.",
}) => {
    return (
        <div className="common-empty-table">
            <div className="common-empty-table-icon">
                <FiInbox />
            </div>

            <p>{message}</p>
        </div>
    );
};

export default EmptyTable;