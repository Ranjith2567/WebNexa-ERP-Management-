export const isRequired = (value) => {
    if (value === null || value === undefined) {
        return false;
    }

    return String(value).trim().length > 0;
};

export const isValidEmail = (email) => {
    if (!email) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(String(email).trim());
};

export const isValidPhone = (phone) => {
    if (!phone) return false;

    const phoneRegex = /^[6-9]\d{9}$/;

    return phoneRegex.test(String(phone).replace(/\s+/g, ""));
};

export const isValidPincode = (pincode) => {
    if (!pincode) return false;

    const pincodeRegex = /^\d{6}$/;

    return pincodeRegex.test(String(pincode).trim());
};

export const isValidNumber = (value) => {
    if (value === "" || value === null || value === undefined) {
        return false;
    }

    return Number.isFinite(Number(value));
};

export const isPositiveNumber = (value) => {
    if (!isValidNumber(value)) return false;

    return Number(value) > 0;
};

export const isNonNegativeNumber = (value) => {
    if (!isValidNumber(value)) return false;

    return Number(value) >= 0;
};

export const isValidUrl = (url) => {
    if (!url) return false;

    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

export const isValidPassword = (password, minLength = 6) => {
    if (!password) return false;

    return String(password).length >= minLength;
};

export const validateRequiredFields = (data = {}, fields = []) => {
    const errors = {};

    fields.forEach((field) => {
        if (!isRequired(data[field])) {
            errors[field] = `${field} is required`;
        }
    });

    return errors;
};