export const formatDate = (date, fallback = "-") => {
    if (!date) return fallback;

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return fallback;
    }

    return parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export const formatDateTime = (date, fallback = "-") => {
    if (!date) return fallback;

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return fallback;
    }

    return parsedDate.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const formatTime = (date, fallback = "-") => {
    if (!date) return fallback;

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return fallback;
    }

    return parsedDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const toDateInputValue = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "";
    }

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

export const isValidDate = (date) => {
    if (!date) return false;

    const parsedDate = new Date(date);

    return !Number.isNaN(parsedDate.getTime());
};

export const getCurrentDate = () => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};