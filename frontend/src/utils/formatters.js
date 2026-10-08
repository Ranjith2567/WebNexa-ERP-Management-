export const formatText = (value, fallback = "-") => {
    if (value === null || value === undefined || value === "") {
        return fallback;
    }

    return String(value).trim();
};

export const capitalize = (value, fallback = "-") => {
    if (!value) return fallback;

    const text = String(value).trim();

    return text.charAt(0).toUpperCase() + text.slice(1);
};

export const capitalizeWords = (value, fallback = "-") => {
    if (!value) return fallback;

    return String(value)
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

export const formatStatus = (status, fallback = "-") => {
    if (!status) return fallback;

    return String(status)
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatNumber = (value, decimals = 2) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "0";
    }

    return number.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
};

export const formatInteger = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "0";
    }

    return number.toLocaleString("en-IN", {
        maximumFractionDigits: 0,
    });
};

export const truncateText = (value, maxLength = 50, fallback = "-") => {
    if (!value) return fallback;

    const text = String(value);

    if (text.length <= maxLength) {
        return text;
    }

    return `${text.substring(0, maxLength).trim()}...`;
};

export const formatFileSize = (bytes) => {
    const size = Number(bytes);

    if (!Number.isFinite(size) || size <= 0) {
        return "0 Bytes";
    }

    const units = ["Bytes", "KB", "MB", "GB"];

    const index = Math.min(
        Math.floor(Math.log(size) / Math.log(1024)),
        units.length - 1
    );

    return `${(size / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
};