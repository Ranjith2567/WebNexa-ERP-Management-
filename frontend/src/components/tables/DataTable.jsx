import React from "react";
import EmptyTable from "./EmptyTable";

const DataTable = ({
    columns = [],
    data = [],
    loading = false,
    emptyMessage = "No records found.",
    rowKey = "_id",
}) => {
    if (loading) {
        return (
            <div className="common-table-wrapper">
                <div className="common-table-loading">
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className="common-table-wrapper">
            <table className="common-table">
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column.key}>
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length}>
                                <EmptyTable message={emptyMessage} />
                            </td>
                        </tr>
                    ) : (
                        data.map((row, index) => (
                            <tr
                                key={
                                    row[rowKey] ??
                                    row.id ??
                                    index
                                }
                            >
                                {columns.map((column) => (
                                    <td key={column.key}>
                                        {column.render
                                            ? column.render(
                                                  row,
                                                  index
                                              )
                                            : row[column.key] ?? "-"}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;