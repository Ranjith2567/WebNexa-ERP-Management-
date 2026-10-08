import React, { useEffect, useRef, useState } from "react";
import {
    FiSearch,
    FiX,
    FiLoader,
    FiChevronRight,
    FiFileText,
    FiUsers,
    FiPackage,
    FiShoppingCart,
    FiDollarSign,
    FiTruck,
    FiHome,
} from "react-icons/fi";

import searchService from "../../services/searchService";
import "../../styles/globalSearch.css";

const MODULE_ICONS = {
    companies: FiHome,
    branches: FiHome,
    users: FiUsers,
    employees: FiUsers,
    customers: FiUsers,
    suppliers: FiTruck,
    products: FiPackage,
    categories: FiPackage,
    brands: FiPackage,
    units: FiPackage,
    warehouses: FiHome,
    purchase_orders: FiShoppingCart,
    purchase_invoices: FiFileText,
    purchase_returns: FiFileText,
    sales_orders: FiShoppingCart,
    sales_invoices: FiFileText,
    sales_returns: FiFileText,
    quotations: FiFileText,
    expenses: FiDollarSign,
    accounts: FiDollarSign,
};

const getModuleIcon = (moduleName = "") => {
    const key = moduleName.toLowerCase().replace(/\s+/g, "_");

    return MODULE_ICONS[key] || FiFileText;
};

const getResultTitle = (result) => {
    return (
        result?.title ||
        result?.name ||
        result?.label ||
        result?.displayName ||
        result?.referenceNumber ||
        result?.code ||
        "Untitled"
    );
};

const getResultSubtitle = (result) => {
    return (
        result?.subtitle ||
        result?.email ||
        result?.phone ||
        result?.sku ||
        result?.code ||
        result?.description ||
        ""
    );
};

const GlobalSearch = ({ onResultClick }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [groupedResults, setGroupedResults] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    const searchRef = useRef(null);
    const debounceRef = useRef(null);

    const clearSearch = () => {
        setQuery("");
        setResults([]);
        setGroupedResults({});
        setPagination(null);
        setError("");
        setShowResults(false);
        setPage(1);
    };

    const performSearch = async (searchQuery, currentPage = 1) => {
        const trimmedQuery = searchQuery.trim();

        if (trimmedQuery.length < 2) {
            setResults([]);
            setGroupedResults({});
            setPagination(null);
            setError("");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setShowResults(true);

            const response = await searchService.search({
                q: trimmedQuery,
                page: currentPage,
                limit: 10,
                type: "all",
                sort: "relevance",
            });

            const data = response?.data || {};

            setResults(Array.isArray(data.results) ? data.results : []);
            setGroupedResults(
                data.groupedResults && typeof data.groupedResults === "object"
                    ? data.groupedResults
                    : {}
            );
            setPagination(data.pagination || null);
        } catch (err) {
            console.error("Global search error:", err);

            setResults([]);
            setGroupedResults({});
            setPagination(null);

            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    "Unable to search right now."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        clearTimeout(debounceRef.current);

        const trimmedQuery = query.trim();

        if (trimmedQuery.length < 2) {
            setResults([]);
            setGroupedResults({});
            setPagination(null);
            setError("");

            if (!trimmedQuery) {
                setShowResults(false);
            }

            return;
        }

        setShowResults(true);

        debounceRef.current = setTimeout(() => {
            setPage(1);
            performSearch(trimmedQuery, 1);
        }, 450);

        return () => clearTimeout(debounceRef.current);
    }, [query]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target)
            ) {
                setShowResults(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);

    const handleResultClick = (result) => {
        if (onResultClick) {
            onResultClick(result);
        }

        setShowResults(false);
    };

    const handlePrevious = () => {
        if (page <= 1 || loading) return;

        const nextPage = page - 1;

        setPage(nextPage);
        performSearch(query, nextPage);
    };

    const handleNext = () => {
        if (
            loading ||
            !pagination ||
            page >= (pagination.totalPages || 1)
        ) {
            return;
        }

        const nextPage = page + 1;

        setPage(nextPage);
        performSearch(query, nextPage);
    };

    const renderResult = (result, index, moduleName = "") => {
        const Icon = getModuleIcon(moduleName);

        const title = getResultTitle(result);
        const subtitle = getResultSubtitle(result);

        return (
            <button
                type="button"
                className="global-search-result"
                key={`${result?._id || result?.id || title}-${index}`}
                onClick={() => handleResultClick(result)}
            >
                <div className="global-search-result-icon">
                    <Icon />
                </div>

                <div className="global-search-result-content">
                    <div className="global-search-result-title">
                        {title}
                    </div>

                    {subtitle && (
                        <div className="global-search-result-subtitle">
                            {subtitle}
                        </div>
                    )}

                    {moduleName && (
                        <span className="global-search-result-module">
                            {moduleName}
                        </span>
                    )}
                </div>

                <FiChevronRight className="global-search-result-arrow" />
            </button>
        );
    };

    const renderGroupedResults = () => {
        const groups = Object.entries(groupedResults);

        if (!groups.length) {
            return null;
        }

        return (
            <div className="global-search-groups">
                {groups.map(([moduleName, moduleResults]) => {
                    if (!Array.isArray(moduleResults) || !moduleResults.length) {
                        return null;
                    }

                    return (
                        <div
                            className="global-search-group"
                            key={moduleName}
                        >
                            <div className="global-search-group-title">
                                <span>{moduleName}</span>

                                <span className="global-search-group-count">
                                    {moduleResults.length}
                                </span>
                            </div>

                            <div className="global-search-group-results">
                                {moduleResults
                                    .slice(0, 5)
                                    .map((result, index) =>
                                        renderResult(
                                            result,
                                            index,
                                            moduleName
                                        )
                                    )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="global-search-wrapper" ref={searchRef}>
            <div className="global-search-input-wrapper">
                <FiSearch className="global-search-icon" />

                <input
                    type="text"
                    value={query}
                    placeholder="Search anything..."
                    className="global-search-input"
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (query.trim().length >= 2) {
                            setShowResults(true);
                        }
                    }}
                />

                {loading && (
                    <FiLoader className="global-search-loader" />
                )}

                {!loading && query && (
                    <button
                        type="button"
                        className="global-search-clear"
                        onClick={clearSearch}
                        aria-label="Clear search"
                    >
                        <FiX />
                    </button>
                )}
            </div>

            {showResults && (
                <div className="global-search-dropdown">
                    {query.trim().length < 2 ? (
                        <div className="global-search-hint">
                            <FiSearch />
                            <span>Type at least 2 characters</span>
                        </div>
                    ) : loading ? (
                        <div className="global-search-status">
                            <FiLoader className="global-search-status-loader" />
                            <span>Searching...</span>
                        </div>
                    ) : error ? (
                        <div className="global-search-status error">
                            <span>{error}</span>
                        </div>
                    ) : results.length === 0 &&
                      Object.keys(groupedResults).length === 0 ? (
                        <div className="global-search-status">
                            <FiSearch />
                            <span>No results found</span>
                        </div>
                    ) : (
                        <>
                            {renderGroupedResults()}

                            {!Object.keys(groupedResults).length &&
                                results.length > 0 && (
                                    <div className="global-search-results-list">
                                        {results.map((result, index) =>
                                            renderResult(
                                                result,
                                                index,
                                                result?.module ||
                                                    result?.type ||
                                                    ""
                                            )
                                        )}
                                    </div>
                                )}

                            {pagination &&
                                (pagination.totalPages || 1) > 1 && (
                                    <div className="global-search-pagination">
                                        <button
                                            type="button"
                                            onClick={handlePrevious}
                                            disabled={page <= 1 || loading}
                                        >
                                            Previous
                                        </button>

                                        <span>
                                            Page {page} of{" "}
                                            {pagination.totalPages}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            disabled={
                                                loading ||
                                                page >=
                                                    pagination.totalPages
                                            }
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}

                            {pagination?.totalResults !== undefined && (
                                <div className="global-search-footer">
                                    {pagination.totalResults} result
                                    {pagination.totalResults !== 1
                                        ? "s"
                                        : ""}{" "}
                                    found
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;