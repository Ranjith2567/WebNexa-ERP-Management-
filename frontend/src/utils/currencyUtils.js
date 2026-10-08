export const formatCurrency = (
    value,
    currency = "INR",
    locale = "en-IN"
) => {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency,
        }).format(0);
    }

    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

export const formatIndianCurrency = (value) => {
    return formatCurrency(value, "INR", "en-IN");
};

export const formatCompactCurrency = (
    value,
    currency = "INR",
    locale = "en-IN"
) => {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return formatCurrency(0, currency, locale);
    }

    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(amount);
};

export const parseCurrency = (value) => {
    if (value === null || value === undefined || value === "") {
        return 0;
    }

    const cleanedValue = String(value)
        .replace(/[^\d.-]/g, "")
        .trim();

    const number = Number(cleanedValue);

    return Number.isFinite(number) ? number : 0;
};