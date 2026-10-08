import { useState } from "react";

const usePagination = (initialPage = 1, initialLimit = 10) => {
    const [page, setPage] = useState(initialPage);
    const [limit, setLimit] = useState(initialLimit);

    const totalPages = (total = 0) => {
        return Math.max(1, Math.ceil(total / limit));
    };

    const nextPage = (total = 0) => {
        setPage((currentPage) =>
            currentPage < totalPages(total)
                ? currentPage + 1
                : currentPage
        );
    };

    const previousPage = () => {
        setPage((currentPage) =>
            currentPage > 1
                ? currentPage - 1
                : currentPage
        );
    };

    const goToPage = (newPage, total = 0) => {
        const maxPage = totalPages(total);

        const validPage = Math.min(
            Math.max(1, newPage),
            maxPage
        );

        setPage(validPage);
    };

    const resetPagination = () => {
        setPage(1);
    };

    return {
        page,
        limit,
        setPage,
        setLimit,
        totalPages,
        nextPage,
        previousPage,
        goToPage,
        resetPagination,
    };
};

export default usePagination;