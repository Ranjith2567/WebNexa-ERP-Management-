import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    FiPlus,
    FiSearch,
    FiEye,
    FiEdit2,
    FiTrash2,
    FiRefreshCw,
    FiFileText,
    FiChevronLeft,
    FiChevronRight,
} from "react-icons/fi";

import api from "../../services/api";
import "../../styles/quotations.css";

function Quotations() {
    const navigate = useNavigate();

    const [quotations, setQuotations] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [customers, setCustomers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadingFilters, setLoadingFilters] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [companyFilter, setCompanyFilter] = useState("");
    const [branchFilter, setBranchFilter] = useState("");
    const [customerFilter, setCustomerFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
    });

    const [deleteModal, setDeleteModal] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const statuses = [
        "DRAFT",
        "SENT",
        "ACCEPTED",
        "REJECTED",
        "EXPIRED",
        "CANCELLED",
    ];

    const getId = (item) => item?._id || item?.id || "";

    const getCompanyName = (company) => {
        if (!company) return "-";
        return company.name || company.legalName || "-";
    };

    const getBranchName = (branch) => {
        if (!branch) return "-";
        return branch.name || "-";
    };

    const getCustomerName = (customer) => {
        if (!customer) return "-";

        return (
            customer.name ||
            customer.companyName ||
            customer.customerCode ||
            "-"
        );
    };

    const formatDate = (date) => {
        if (!date) return "-";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "-";
        }

        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatAmount = (amount) => {
        const value = Number(amount || 0);

        return value.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        });
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "DRAFT":
                return "quotation-status draft";

            case "SENT":
                return "quotation-status sent";

            case "ACCEPTED":
                return "quotation-status accepted";

            case "REJECTED":
                return "quotation-status rejected";

            case "EXPIRED":
                return "quotation-status expired";

            case "CANCELLED":
                return "quotation-status cancelled";

            default:
                return "quotation-status";
        }
    };

    const fetchFilters = async () => {
        try {
            setLoadingFilters(true);

            const [companiesResponse, branchesResponse, customersResponse] =
                await Promise.all([
                    api.get("/companies"),
                    api.get("/branches"),
                    api.get("/customers"),
                ]);

            const companiesData =
                companiesResponse.data?.companies ||
                companiesResponse.data?.data ||
                [];

            const branchesData =
                branchesResponse.data?.branches ||
                branchesResponse.data?.data ||
                [];

            const customersData =
                customersResponse.data?.customers ||
                customersResponse.data?.data ||
                [];

            setCompanies(
                Array.isArray(companiesData) ? companiesData : []
            );

            setBranches(
                Array.isArray(branchesData) ? branchesData : []
            );

            setCustomers(
                Array.isArray(customersData) ? customersData : []
            );
        } catch (err) {
            console.error("Quotation filters error:", err);

            setError(
                err.response?.data?.message ||
                    "Failed to load quotation filters."
            );
        } finally {
            setLoadingFilters(false);
        }
    };

    const fetchQuotations = async (currentPage = page) => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page: currentPage,
                limit: 10,
            };

            if (search.trim()) {
                params.search = search.trim();
            }

            if (companyFilter) {
                params.company = companyFilter;
            }

            if (branchFilter) {
                params.branch = branchFilter;
            }

            if (customerFilter) {
                params.customer = customerFilter;
            }

            if (statusFilter) {
                params.status = statusFilter;
            }

            const response = await api.get("/quotations", {
                params,
            });

            const data =
                response.data?.quotations ||
                response.data?.data ||
                [];

            setQuotations(Array.isArray(data) ? data : []);

            setPagination(
                response.data?.pagination || {
                    total: data.length,
                    page: currentPage,
                    limit: 10,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPreviousPage: currentPage > 1,
                }
            );
        } catch (err) {
            console.error("Fetch quotations error:", err);

            setError(
                err.response?.data?.message ||
                    "Failed to fetch quotations."
            );

            setQuotations([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFilters();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchQuotations(page);
        }, 300);

        return () => clearTimeout(timer);
    }, [
        page,
        search,
        companyFilter,
        branchFilter,
        customerFilter,
        statusFilter,
    ]);

    const filteredBranches = companyFilter
        ? branches.filter(
              (branch) =>
                  String(
                      branch.company?._id ||
                          branch.company ||
                          ""
                  ) === String(companyFilter)
          )
        : branches;

    const filteredCustomers = customerFilter
        ? customers
        : companyFilter
        ? customers.filter(
              (customer) =>
                  String(
                      customer.company?._id ||
                          customer.company ||
                          ""
                  ) === String(companyFilter)
          )
        : customers;

    const handleCompanyFilter = (value) => {
        setCompanyFilter(value);
        setBranchFilter("");
        setCustomerFilter("");
        setPage(1);
    };

    const handleBranchFilter = (value) => {
        setBranchFilter(value);
        setCustomerFilter("");
        setPage(1);
    };

    const handleClearFilters = () => {
        setSearch("");
        setCompanyFilter("");
        setBranchFilter("");
        setCustomerFilter("");
        setStatusFilter("");
        setPage(1);
    };

    const handleDeleteClick = (quotation) => {
        setSelectedQuotation(quotation);
        setDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!selectedQuotation) return;

        try {
            setDeleting(true);
            setError("");

            await api.delete(
                `/quotations/${getId(selectedQuotation)}`
            );

            setDeleteModal(false);
            setSelectedQuotation(null);

            await fetchQuotations(page);
        } catch (err) {
            console.error("Delete quotation error:", err);

            setError(
                err.response?.data?.message ||
                    "Failed to delete quotation."
            );
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="quotations-page">
            <div className="quotations-header">
                <div>
                    <div className="quotations-title-row">
                        <div className="quotations-title-icon">
                            <FiFileText />
                        </div>

                        <div>
                            <h1>Quotations</h1>
                            <p>
                                Manage customer quotations and pricing
                                proposals.
                            </p>
                        </div>
                    </div>
                </div>

                <Link
                    to="/sales/quotations/create"
                    className="quotation-add-btn"
                >
                    <FiPlus />
                    New Quotation
                </Link>
            </div>

            {error && (
                <div className="quotation-error">
                    {error}
                </div>
            )}

            <div className="quotation-filters-card">
                <div className="quotation-search-box">
                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Search quotation number..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>

                <select
                    value={companyFilter}
                    onChange={(e) =>
                        handleCompanyFilter(e.target.value)
                    }
                    disabled={loadingFilters}
                >
                    <option value="">All Companies</option>

                    {companies.map((company) => (
                        <option
                            key={getId(company)}
                            value={getId(company)}
                        >
                            {getCompanyName(company)}
                        </option>
                    ))}
                </select>

                <select
                    value={branchFilter}
                    onChange={(e) =>
                        handleBranchFilter(e.target.value)
                    }
                    disabled={loadingFilters}
                >
                    <option value="">All Branches</option>

                    {filteredBranches.map((branch) => (
                        <option
                            key={getId(branch)}
                            value={getId(branch)}
                        >
                            {getBranchName(branch)}
                        </option>
                    ))}
                </select>

                <select
                    value={customerFilter}
                    onChange={(e) => {
                        setCustomerFilter(e.target.value);
                        setPage(1);
                    }}
                    disabled={loadingFilters}
                >
                    <option value="">All Customers</option>

                    {filteredCustomers.map((customer) => (
                        <option
                            key={getId(customer)}
                            value={getId(customer)}
                        >
                            {getCustomerName(customer)}
                        </option>
                    ))}
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">All Status</option>

                    {statuses.map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    className="quotation-clear-btn"
                    onClick={handleClearFilters}
                    title="Clear filters"
                >
                    <FiRefreshCw />
                </button>
            </div>

            <div className="quotations-summary">
                <div>
                    <span>Total Quotations</span>
                    <strong>{pagination.total || 0}</strong>
                </div>

                <div>
                    <span>Current Page</span>
                    <strong>
                        {pagination.page || 1}
                    </strong>
                </div>

                <div>
                    <span>Total Pages</span>
                    <strong>
                        {pagination.totalPages || 1}
                    </strong>
                </div>
            </div>

            <div className="quotations-card">
                {loading ? (
                    <div className="quotation-loader">
                        <div className="quotation-spinner"></div>
                        <p>Loading quotations...</p>
                    </div>
                ) : quotations.length === 0 ? (
                    <div className="quotation-empty">
                        <FiFileText />

                        <h3>No quotations found</h3>

                        <p>
                            Create your first quotation to get
                            started.
                        </p>

                        <Link
                            to="/sales/quotations/create"
                            className="quotation-empty-btn"
                        >
                            <FiPlus />
                            Create Quotation
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="quotations-table-wrapper">
                            <table className="quotations-table">
                                <thead>
                                    <tr>
                                        <th>Quotation</th>
                                        <th>Company</th>
                                        <th>Branch</th>
                                        <th>Customer</th>
                                        <th>Date</th>
                                        <th>Valid Until</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {quotations.map(
                                        (quotation) => {
                                            const quotationId =
                                                getId(
                                                    quotation
                                                );

                                            const canDelete =
                                                [
                                                    "DRAFT",
                                                    "REJECTED",
                                                    "CANCELLED",
                                                ].includes(
                                                    quotation.status
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        quotationId
                                                    }
                                                >
                                                    <td>
                                                        <div className="quotation-number">
                                                            {
                                                                quotation.quotationNumber
                                                            }
                                                        </div>

                                                        <div className="quotation-item-count">
                                                            {quotation
                                                                .items
                                                                ?.length ||
                                                                0}{" "}
                                                            item
                                                            {quotation
                                                                .items
                                                                ?.length ===
                                                            1
                                                                ? ""
                                                                : "s"}
                                                        </div>
                                                    </td>

                                                    <td>
                                                        {getCompanyName(
                                                            quotation.company
                                                        )}
                                                    </td>

                                                    <td>
                                                        {getBranchName(
                                                            quotation.branch
                                                        )}
                                                    </td>

                                                    <td>
                                                        <div className="quotation-customer-name">
                                                            {getCustomerName(
                                                                quotation.customer
                                                            )}
                                                        </div>

                                                        {quotation
                                                            .customer
                                                            ?.customerCode && (
                                                            <div className="quotation-customer-code">
                                                                {
                                                                    quotation
                                                                        .customer
                                                                        .customerCode
                                                                }
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td>
                                                        {formatDate(
                                                            quotation.quotationDate
                                                        )}
                                                    </td>

                                                    <td>
                                                        {formatDate(
                                                            quotation.validUntil
                                                        )}
                                                    </td>

                                                    <td>
                                                        <strong className="quotation-total">
                                                            {formatAmount(
                                                                quotation.totalAmount
                                                            )}
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={getStatusClass(
                                                                quotation.status
                                                            )}
                                                        >
                                                            {
                                                                quotation.status
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <div className="quotation-actions">
                                                            <button
                                                                type="button"
                                                                className="quotation-action-btn view"
                                                                title="View quotation"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/sales/quotations/${quotationId}`
                                                                    )
                                                                }
                                                            >
                                                                <FiEye />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="quotation-action-btn edit"
                                                                title="Edit quotation"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/sales/quotations/${quotationId}/edit`
                                                                    )
                                                                }
                                                            >
                                                                <FiEdit2 />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="quotation-action-btn delete"
                                                                title={
                                                                    canDelete
                                                                        ? "Delete quotation"
                                                                        : "Only draft, rejected, or cancelled quotations can be deleted"
                                                                }
                                                                disabled={
                                                                    !canDelete
                                                                }
                                                                onClick={() =>
                                                                    handleDeleteClick(
                                                                        quotation
                                                                    )
                                                                }
                                                            >
                                                                <FiTrash2 />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="quotation-pagination">
                            <button
                                type="button"
                                disabled={
                                    !pagination.hasPreviousPage
                                }
                                onClick={() =>
                                    setPage(
                                        (previous) =>
                                            Math.max(
                                                previous - 1,
                                                1
                                            )
                                    )
                                }
                            >
                                <FiChevronLeft />
                                Previous
                            </button>

                            <span>
                                Page{" "}
                                <strong>
                                    {pagination.page || 1}
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {pagination.totalPages || 1}
                                </strong>
                            </span>

                            <button
                                type="button"
                                disabled={
                                    !pagination.hasNextPage
                                }
                                onClick={() =>
                                    setPage(
                                        (previous) =>
                                            previous + 1
                                    )
                                }
                            >
                                Next
                                <FiChevronRight />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {deleteModal && selectedQuotation && (
                <div className="quotation-modal-overlay">
                    <div className="quotation-delete-modal">
                        <div className="quotation-delete-icon">
                            <FiTrash2 />
                        </div>

                        <h2>Delete Quotation?</h2>

                        <p>
                            Are you sure you want to delete{" "}
                            <strong>
                                {
                                    selectedQuotation.quotationNumber
                                }
                            </strong>
                            ?
                        </p>

                        <div className="quotation-modal-actions">
                            <button
                                type="button"
                                className="quotation-cancel-btn"
                                onClick={() => {
                                    setDeleteModal(false);
                                    setSelectedQuotation(null);
                                }}
                                disabled={deleting}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="quotation-confirm-delete-btn"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting
                                    ? "Deleting..."
                                    : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Quotations;