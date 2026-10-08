import React from "react";

const FormField = ({
    label,
    name,
    children,
    required = false,
    error = "",
    hint = "",
    className = "",
}) => {
    return (
        <div className={`form-field ${className}`}>
            {label && (
                <label
                    htmlFor={name}
                    className="form-field-label"
                >
                    {label}

                    {required && (
                        <span className="required-mark">*</span>
                    )}
                </label>
            )}

            <div className="form-field-control">
                {children}
            </div>

            {hint && !error && (
                <span className="form-field-hint">
                    {hint}
                </span>
            )}

            {error && (
                <span className="form-field-error">
                    {error}
                </span>
            )}
        </div>
    );
};

export default FormField;