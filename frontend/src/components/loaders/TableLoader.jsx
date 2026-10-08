import React from "react";

const TableLoader = ({ rows = 5, columns = 5 }) => {
    return (
        <div className="table-loader">
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div className="table-loader-row" key={rowIndex}>
                    {Array.from({ length: columns }).map(
                        (_, columnIndex) => (
                            <div
                                className="table-loader-cell"
                                key={columnIndex}
                            >
                                <span className="table-loader-skeleton"></span>
                            </div>
                        )
                    )}
                </div>
            ))}
        </div>
    );
};

export default TableLoader;