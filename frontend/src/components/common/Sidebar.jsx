import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import {
    FiHome,
    FiBriefcase,
    FiGitBranch,
    FiUsers,
    FiUser,
    FiPackage,
    FiShoppingCart,
    FiCreditCard,
    FiBarChart2,
    FiBell,
    FiSettings,
    FiLogOut,
    FiFileText,
    FiChevronDown,
    FiFilePlus,
    FiList,
    FiRefreshCw,
    FiCornerUpLeft,
    FiLayers,
    FiTag,
    FiBox,
    FiDatabase,
    FiRepeat,
    FiSliders,
    FiTruck,
    FiBook,
    FiClipboard,
    FiDollarSign,
    FiFile,
    FiActivity,
} from "react-icons/fi";

import "../../styles/sidebar.css";

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const [salesOpen, setSalesOpen] = useState(false);
    const [inventoryOpen, setInventoryOpen] = useState(false);
    const [purchasesOpen, setPurchasesOpen] = useState(false);
    const [financeOpen, setFinanceOpen] = useState(false);

    /* =========================
        MAIN MENU
    ========================= */

    const menuItems = [
        {
            name: "Dashboard",
            path: "/dashboard",
            icon: <FiHome />,
        },
        {
            name: "Company",
            path: "/company",
            icon: <FiBriefcase />,
        },
        {
            name: "Branches",
            path: "/branches",
            icon: <FiGitBranch />,
        },
        {
            name: "Customers",
            path: "/customers",
            icon: <FiUsers />,
        },
        {
            name: "Users",
            path: "/users",
            icon: <FiUsers />,
        },
        {
            name: "Employees",
            path: "/employees",
            icon: <FiUser />,
        },
        {
            name: "Departments",
            path: "/departments",
            icon: <FiLayers />,
        },
        {
            name: "Designations",
            path: "/designations",
            icon: <FiBriefcase />,
        },
    ];

    /* =========================
        INVENTORY SUBMENU
    ========================= */

    const inventoryItems = [
        {
            name: "Categories",
            path: "/inventory/categories",
            icon: <FiLayers />,
        },
        {
            name: "Brands",
            path: "/inventory/brands",
            icon: <FiTag />,
        },
        {
            name: "Units",
            path: "/inventory/units",
            icon: <FiBox />,
        },
        {
            name: "Warehouses",
            path: "/inventory/warehouses",
            icon: <FiDatabase />,
        },
        {
            name: "Products",
            path: "/inventory/products",
            icon: <FiPackage />,
        },
        {
            name: "Stock",
            path: "/inventory/stock",
            icon: <FiBox />,
        },
        {
            name: "Stock Movements",
            path: "/inventory/stock-movements",
            icon: <FiRepeat />,
        },
        {
            name: "Stock Adjustments",
            path: "/inventory/stock-adjustments",
            icon: <FiSliders />,
        },
        {
            name: "Stock Transfers",
            path: "/inventory/stock-transfers",
            icon: <FiRefreshCw />,
        },
        {
            name: "Stock Summary",
            path: "/inventory/stock-summary",
            icon: <FiBarChart2 />,
        },
    ];

    /* =========================
        SALES SUBMENU
    ========================= */

    const salesItems = [
        {
            name: "Sales Orders",
            path: "/sales/orders",
            icon: <FiList />,
        },
        {
            name: "Quotations",
            path: "/sales/quotations",
            icon: <FiFileText />,
        },
        {
            name: "Sales Invoices",
            path: "/sales/invoices",
            icon: <FiFilePlus />,
        },
        {
            name: "Sales Payments",
            path: "/sales/payments",
            icon: <FiRefreshCw />,
        },
        {
            name: "Sales Returns",
            path: "/sales/returns",
            icon: <FiCornerUpLeft />,
        },
    ];

    /* =========================
        PURCHASES SUBMENU
    ========================= */

    const purchaseItems = [
        {
            name: "Suppliers",
            path: "/purchases/suppliers",
            icon: <FiTruck />,
        },
        {
            name: "Purchase Orders",
            path: "/purchases/orders",
            icon: <FiFileText />,
        },
        {
            name: "Goods Receipts",
            path: "/purchases/goods-receipts",
            icon: <FiPackage />,
        },
        {
            name: "Purchase Invoices",
            path: "/purchases/invoices",
            icon: <FiFileText />,
        },
        {
            name: "Purchase Payments",
            path: "/purchases/payments",
            icon: <FiCreditCard />,
        },
        {
            name: "Purchase Returns",
            path: "/purchases/returns",
            icon: <FiCornerUpLeft />,
        },
    ];

    /* =========================
        FINANCE SUBMENU
    ========================= */

    const financeItems = [
        {
            name: "Accounts",
            path: "/finance/accounts",
            icon: <FiCreditCard />,
        },
        {
            name: "Expense Categories",
            path: "/finance/expense-categories",
            icon: <FiLayers />,
        },
        {
            name: "Expenses",
            path: "/finance/expenses",
            icon: <FiDollarSign />,
        },
        {
            name: "Journal Entries",
            path: "/finance/journal-entries",
            icon: <FiFileText />,
        },
        {
            name: "Ledger",
            path: "/finance/ledger",
            icon: <FiBook />,
        },
        {
            name: "Trial Balance",
            path: "/finance/trial-balance",
            icon: <FiBarChart2 />,
        },
        {
            name: "Credit Notes",
            path: "/finance/credit-notes",
            icon: <FiFilePlus />,
        },
        {
            name: "Customer Credit Ledger",
            path: "/finance/customer-credit-ledger",
            icon: <FiBook />,
        },
        {
            name: "Approvals",
            path: "/finance/approvals",
            icon: <FiClipboard />,
        },
    ];

    /* =========================
        REMAINING MENU
    ========================= */

    const remainingMenuItems = [
        {
            name: "Reports",
            path: "/reports",
            icon: <FiBarChart2 />,
        },
        {
            name: "Documents",
            path: "/documents",
            icon: <FiFile />,
        },
        {
            name: "Audit Logs",
            path: "/audit-logs",
            icon: <FiActivity />,
        },
        {
            name: "Notifications",
            path: "/notifications",
            icon: <FiBell />,
        },
        {
            name: "Settings",
            path: "/settings",
            icon: <FiSettings />,
        },
    ];

    /* =========================
        ACTIVE ROUTES
    ========================= */

    const isSalesActive =
        location.pathname.startsWith("/sales");

    const isInventoryActive =
        location.pathname.startsWith("/inventory");

    const isPurchasesActive =
        location.pathname.startsWith("/purchases");

    const isFinanceActive =
        location.pathname.startsWith("/finance");

    /* =========================
        AUTO OPEN ACTIVE DROPDOWN
    ========================= */

    useEffect(() => {
        setSalesOpen(isSalesActive);
        setInventoryOpen(isInventoryActive);
        setPurchasesOpen(isPurchasesActive);
        setFinanceOpen(isFinanceActive);
    }, [
        isSalesActive,
        isInventoryActive,
        isPurchasesActive,
        isFinanceActive,
    ]);

    /* =========================
        MAIN MENU CLICK
    ========================= */

    const handleMainMenuClick = () => {
        setSalesOpen(false);
        setInventoryOpen(false);
        setPurchasesOpen(false);
        setFinanceOpen(false);
    };

    /* =========================
        INVENTORY TOGGLE
    ========================= */

    const handleInventoryToggle = () => {
        setInventoryOpen((prev) => !prev);
        setSalesOpen(false);
        setPurchasesOpen(false);
        setFinanceOpen(false);
    };

    /* =========================
        SALES TOGGLE
    ========================= */

    const handleSalesToggle = () => {
        setSalesOpen((prev) => !prev);
        setInventoryOpen(false);
        setPurchasesOpen(false);
        setFinanceOpen(false);
    };

    /* =========================
        PURCHASES TOGGLE
    ========================= */

    const handlePurchasesToggle = () => {
        setPurchasesOpen((prev) => !prev);
        setInventoryOpen(false);
        setSalesOpen(false);
        setFinanceOpen(false);
    };

    /* =========================
        FINANCE TOGGLE
    ========================= */

    const handleFinanceToggle = () => {
        setFinanceOpen((prev) => !prev);
        setInventoryOpen(false);
        setSalesOpen(false);
        setPurchasesOpen(false);
    };

    /* =========================
        LOGOUT
    ========================= */

    const handleLogout = () => {
        /*
         * Clear authentication/session data.
         * Keep this limited to ERP authentication-related keys.
         */
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("companyId");
        localStorage.removeItem("branchId");

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        navigate("/login", { replace: true });
    };

    return (
        <aside className="sidebar">

            {/* =========================
                LOGO
            ========================= */}

            <div className="sidebar-logo">

                <div className="sidebar-logo-mark">
                    W
                </div>

                <div className="sidebar-logo-text">
                    <h2>WebNexa</h2>
                    <span>ERP</span>
                </div>

            </div>


            {/* =========================
                NAVIGATION
            ========================= */}

            <nav className="sidebar-nav">

                <p className="sidebar-section-title">
                    MAIN MENU
                </p>


                {/* =========================
                    MAIN MENU ITEMS
                ========================= */}

                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={handleMainMenuClick}
                        className={({ isActive }) =>
                            `sidebar-link ${
                                isActive ? "active" : ""
                            }`
                        }
                    >

                        <span className="sidebar-icon">
                            {item.icon}
                        </span>

                        <span className="sidebar-link-text">
                            {item.name}
                        </span>

                    </NavLink>
                ))}


                {/* =========================
                    INVENTORY DROPDOWN
                ========================= */}

                <button
                    type="button"
                    className={`sidebar-link sidebar-dropdown-button ${
                        isInventoryActive
                            ? "inventory-parent-active"
                            : ""
                    }`}
                    onClick={handleInventoryToggle}
                >

                    <span className="sidebar-icon">
                        <FiPackage />
                    </span>

                    <span className="sidebar-link-text">
                        Inventory
                    </span>

                    <span
                        className={`sidebar-dropdown-arrow ${
                            inventoryOpen ? "open" : ""
                        }`}
                    >
                        <FiChevronDown />
                    </span>

                </button>


                {/* =========================
                    INVENTORY SUBMENU
                ========================= */}

                <div
                    className={`sidebar-submenu ${
                        inventoryOpen
                            ? "sidebar-submenu-open"
                            : ""
                    }`}
                >

                    {inventoryItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `sidebar-submenu-link ${
                                    isActive ? "active" : ""
                                }`
                            }
                        >

                            <span className="sidebar-submenu-icon">
                                {item.icon}
                            </span>

                            <span className="sidebar-submenu-text">
                                {item.name}
                            </span>

                        </NavLink>
                    ))}

                </div>


                {/* =========================
                    SALES DROPDOWN
                ========================= */}

                <button
                    type="button"
                    className={`sidebar-link sidebar-dropdown-button ${
                        isSalesActive
                            ? "sales-parent-active"
                            : ""
                    }`}
                    onClick={handleSalesToggle}
                >

                    <span className="sidebar-icon">
                        <FiDollarSign />
                    </span>

                    <span className="sidebar-link-text">
                        Sales
                    </span>

                    <span
                        className={`sidebar-dropdown-arrow ${
                            salesOpen ? "open" : ""
                        }`}
                    >
                        <FiChevronDown />
                    </span>

                </button>


                {/* =========================
                    SALES SUBMENU
                ========================= */}

                <div
                    className={`sidebar-submenu ${
                        salesOpen
                            ? "sidebar-submenu-open"
                            : ""
                    }`}
                >

                    {salesItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `sidebar-submenu-link ${
                                    isActive ? "active" : ""
                                }`
                            }
                        >

                            <span className="sidebar-submenu-icon">
                                {item.icon}
                            </span>

                            <span className="sidebar-submenu-text">
                                {item.name}
                            </span>

                        </NavLink>
                    ))}

                </div>


                {/* =========================
                    PURCHASES DROPDOWN
                ========================= */}

                <button
                    type="button"
                    className={`sidebar-link sidebar-dropdown-button ${
                        isPurchasesActive
                            ? "purchases-parent-active"
                            : ""
                    }`}
                    onClick={handlePurchasesToggle}
                >

                    <span className="sidebar-icon">
                        <FiShoppingCart />
                    </span>

                    <span className="sidebar-link-text">
                        Purchases
                    </span>

                    <span
                        className={`sidebar-dropdown-arrow ${
                            purchasesOpen ? "open" : ""
                        }`}
                    >
                        <FiChevronDown />
                    </span>

                </button>


                {/* =========================
                    PURCHASES SUBMENU
                ========================= */}

                <div
                    className={`sidebar-submenu ${
                        purchasesOpen
                            ? "sidebar-submenu-open"
                            : ""
                    }`}
                >

                    {purchaseItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `sidebar-submenu-link ${
                                    isActive ? "active" : ""
                                }`
                            }
                        >

                            <span className="sidebar-submenu-icon">
                                {item.icon}
                            </span>

                            <span className="sidebar-submenu-text">
                                {item.name}
                            </span>

                        </NavLink>
                    ))}

                </div>


                {/* =========================
                    FINANCE DROPDOWN
                ========================= */}

                <button
                    type="button"
                    className={`sidebar-link sidebar-dropdown-button ${
                        isFinanceActive
                            ? "finance-parent-active"
                            : ""
                    }`}
                    onClick={handleFinanceToggle}
                >

                    <span className="sidebar-icon">
                        <FiCreditCard />
                    </span>

                    <span className="sidebar-link-text">
                        Finance
                    </span>

                    <span
                        className={`sidebar-dropdown-arrow ${
                            financeOpen ? "open" : ""
                        }`}
                    >
                        <FiChevronDown />
                    </span>

                </button>


                {/* =========================
                    FINANCE SUBMENU
                ========================= */}

                <div
                    className={`sidebar-submenu ${
                        financeOpen
                            ? "sidebar-submenu-open"
                            : ""
                    }`}
                >

                    {financeItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `sidebar-submenu-link ${
                                    isActive ? "active" : ""
                                }`
                            }
                        >

                            <span className="sidebar-submenu-icon">
                                {item.icon}
                            </span>

                            <span className="sidebar-submenu-text">
                                {item.name}
                            </span>

                        </NavLink>
                    ))}

                </div>


                {/* =========================
                    REMAINING MENU
                ========================= */}

                {remainingMenuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={handleMainMenuClick}
                        className={({ isActive }) =>
                            `sidebar-link ${
                                isActive ? "active" : ""
                            }`
                        }
                    >

                        <span className="sidebar-icon">
                            {item.icon}
                        </span>

                        <span className="sidebar-link-text">
                            {item.name}
                        </span>

                    </NavLink>
                ))}

            </nav>


            {/* =========================
                LOGOUT
            ========================= */}

            <div className="sidebar-bottom">

                <button
                    className="sidebar-logout"
                    type="button"
                    onClick={handleLogout}
                >

                    <span className="sidebar-icon">
                        <FiLogOut />
                    </span>

                    <span className="sidebar-link-text">
                        Logout
                    </span>

                </button>

            </div>

        </aside>
    );
}

export default Sidebar;