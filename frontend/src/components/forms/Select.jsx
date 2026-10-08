import React from "react";

const Select = ({
    label,
    name,
    value = "",
    onChange,
    options = [],
    placeholder = "Select an option",
    required = false,
    disabled = false,
    error = "",
    className = "",
    ...props
}) => {
    return (
        <div className={`form-select-group ${className}`}>
            {label && (
                <label htmlFor={name} className="form-select-label">
                    {label}
                    {required && <span className="required-mark">*</span>}
                </label>
            )}

            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                disabled={disabled}
                className={`form-select ${error ? "form-select-error" : ""}`}
                {...props}
            >
                <option value="" disabled>
                    {placeholder}
                </option>

                {options.map((option, index) => {
                    const optionValue =
                        typeof option === "object"
                            ? option.value
                            : option;

                    const optionLabel =
                        typeof option === "object"
                            ? option.label
                            : option;

                    return (
                        <option
                            key={`${optionValue}-${index}`}
                            value={optionValue}
                        >
                            {optionLabel}
                        </option>
                    );
                })}
            </select>

            {error && (
                <span className="form-select-error-text">
                    {error}
                </span>
            )}
        </div>
    );
};

export default Select;