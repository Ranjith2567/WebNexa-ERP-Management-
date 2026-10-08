import React from "react";

const DateInput = ({
    label,
    name,
    value = "",
    onChange,
    min,
    max,
    required = false,
    disabled = false,
    error = "",
    className = "",
    ...props
}) => {
    return (
        <div className={`form-date-group ${className}`}>
            {label && (
                <label htmlFor={name} className="form-date-label">
                    {label}
                    {required && <span className="required-mark">*</span>}
                </label>
            )}

            <input
                id={name}
                name={name}
                type="date"
                value={value}
                onChange={onChange}
                min={min}
                max={max}
                required={required}
                disabled={disabled}
                className={`form-date ${
                    error ? "form-date-error" : ""
                }`}
                {...props}
            />

            {error && (
                <span className="form-date-error-text">
                    {error}
                </span>
            )}
        </div>
    );
};

export default DateInput;