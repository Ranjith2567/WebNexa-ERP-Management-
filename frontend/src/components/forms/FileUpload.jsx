import React, { useRef } from "react";
import { FiUpload, FiX, FiFile } from "react-icons/fi";

const FileUpload = ({
    label = "Upload File",
    name = "file",
    value = null,
    onChange,
    accept = "*/*",
    multiple = false,
    required = false,
    disabled = false,
    error = "",
    className = "",
    maxSize,
}) => {
    const inputRef = useRef(null);

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files || []);

        if (maxSize) {
            const invalidFile = files.find(
                (file) => file.size > maxSize
            );

            if (invalidFile) {
                if (onChange) {
                    onChange({
                        target: {
                            name,
                            value: null,
                            files: [],
                            error: `${invalidFile.name} exceeds the allowed file size.`,
                        },
                    });
                }

                event.target.value = "";
                return;
            }
        }

        if (onChange) {
            onChange({
                target: {
                    name,
                    value: multiple ? files : files[0] || null,
                    files,
                },
            });
        }
    };

    const handleRemove = () => {
        if (inputRef.current) {
            inputRef.current.value = "";
        }

        if (onChange) {
            onChange({
                target: {
                    name,
                    value: null,
                    files: [],
                },
            });
        }
    };

    const openFilePicker = () => {
        if (!disabled) {
            inputRef.current?.click();
        }
    };

    const selectedFiles = Array.isArray(value)
        ? value
        : value
        ? [value]
        : [];

    return (
        <div className={`form-file-group ${className}`}>
            {label && (
                <label className="form-file-label">
                    {label}
                    {required && (
                        <span className="required-mark">*</span>
                    )}
                </label>
            )}

            <input
                ref={inputRef}
                id={name}
                name={name}
                type="file"
                accept={accept}
                multiple={multiple}
                required={required && selectedFiles.length === 0}
                disabled={disabled}
                onChange={handleFileChange}
                className="form-file-hidden"
            />

            <div
                className={`form-file-dropzone ${
                    error ? "form-file-error" : ""
                } ${disabled ? "form-file-disabled" : ""}`}
                onClick={openFilePicker}
                role="button"
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(event) => {
                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {
                        openFilePicker();
                    }
                }}
            >
                <div className="form-file-icon">
                    <FiUpload />
                </div>

                <div className="form-file-content">
                    <strong>Click to upload</strong>
                    <span>
                        {multiple
                            ? "You can select multiple files"
                            : "Select a file from your device"}
                    </span>
                </div>
            </div>

            {selectedFiles.length > 0 && (
                <div className="form-file-list">
                    {selectedFiles.map((file, index) => (
                        <div
                            className="form-file-item"
                            key={`${file.name}-${index}`}
                        >
                            <div className="form-file-item-info">
                                <FiFile />

                                <div>
                                    <strong>{file.name}</strong>

                                    <span>
                                        {(
                                            file.size /
                                            (1024 * 1024)
                                        ).toFixed(2)}{" "}
                                        MB
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="form-file-remove"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    handleRemove();
                                }}
                                disabled={disabled}
                                aria-label={`Remove ${file.name}`}
                            >
                                <FiX />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <span className="form-file-error-text">
                    {error}
                </span>
            )}
        </div>
    );
};

export default FileUpload;