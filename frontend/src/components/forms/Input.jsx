import React from "react";

const Input = ({
    label,
    name,
    type = "text",
    value = "",
    onChange,
    placeholder = "",
    required = false,
    disabled = false,
    error = "",
    className = "",
    ...props
}) => {
    return (
        <div className={`form-input-group ${className}`}>
            {label && (
                <label htmlFor={name} className="form-input-label">
                    {label}
                    {required && <span className="required-mark">*</span>}
                </label>
            )}

            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className={`form-input ${error ? "form-input-error" : ""}`}
                {...props}
            />

            {error && <span className="form-input-error-text">{error}</span>}
        </div>
    );
};

export default Input;