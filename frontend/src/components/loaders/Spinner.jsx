import React from "react";

const Spinner = ({ size = "medium" }) => {
    return (
        <span
            className={`common-spinner common-spinner-${size}`}
            aria-label="Loading"
        ></span>
    );
};

export default Spinner;