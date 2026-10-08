import React from "react";

const TableHeader = ({
    title,
    subtitle = "",
    actions = null,
}) => {
    return (
        <div className="common-table-header">
            <div>
                <h3>{title}</h3>

                {subtitle && (
                    <p>{subtitle}</p>
                )}
            </div>

            {actions && (
                <div className="common-table-header-actions">
                    {actions}
                </div>
            )}
        </div>
    );
};

export default TableHeader;