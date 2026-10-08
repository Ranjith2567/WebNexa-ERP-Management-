import React from "react";

const Textarea = ({
    label,
    name,
    value = "",
    onChange,
    placeholder = "",
    rows = 4,
    required = false,
    disabled = false,
    error = "",
    className = "",
    ...props
}) => {
    return (
        <div className={`form-textarea-group ${className}`}>
            {label && (
                <label htmlFor={name} className="form-textarea-label">
                    {label}
                    {required && <span className="required-mark">*</span>}
                </label>
            )}

            <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                required={required}
                disabled={disabled}
                className={`form-textarea ${
                    error ? "form-textarea-error" : ""
                }`}
                {...props}
            />

            {error && (
                <span className="form-textarea-error-text">
                    {error}
                </span>
            )}
        </div>
    );
};

export default Textarea;