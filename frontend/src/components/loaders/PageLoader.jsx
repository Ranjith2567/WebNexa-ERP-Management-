import React from "react";

const PageLoader = ({ text = "Loading..." }) => {
    return (
        <div className="page-loader">
            <div className="page-loader-spinner"></div>
            <span>{text}</span>
        </div>
    );
};

export default PageLoader;