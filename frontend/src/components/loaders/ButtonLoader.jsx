import React from "react";
import Spinner from "./Spinner";

const ButtonLoader = ({
    text = "Processing...",
    size = "small",
}) => {
    return (
        <span className="button-loader">
            <Spinner size={size} />
            <span>{text}</span>
        </span>
    );
};

export default ButtonLoader;