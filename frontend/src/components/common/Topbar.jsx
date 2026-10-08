import {
  FiMenu,
  FiBell,
  FiMoon,
  FiSun,
  FiUser,
  FiChevronDown,
  FiLogOut,
  FiSettings,
} from "react-icons/fi";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import GlobalSearch from "../common/GlobalSearch";
import { useTheme } from "../../context/ThemeContext";

import "../../styles/topbar.css";


function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);

  /* =========================
      THEME
  ========================= */

  const { theme, toggleTheme } = useTheme();

  /* =========================
      USER DATA
  ========================= */

  const storedUser = useMemo(() => {
    try {
      const user = localStorage.getItem("user");

      if (!user) {
        return null;
      }

      return JSON.parse(user);
    } catch (error) {
      console.error("Failed to parse stored user:", error);
      return null;
    }
  }, []);

  /* =========================
      USER DETAILS
  ========================= */

  const userName =
    storedUser?.name ||
    storedUser?.fullName ||
    storedUser?.username ||
    "WebNexa Admin";

  const userEmail =
    storedUser?.email ||
    "admin@webnexa.com";

  const userRole =
    storedUser?.role ||
    "SUPER ADMIN";


  /* =========================
      PAGE INFORMATION
  ========================= */

  const pageInfo = useMemo(() => {
    const path = location.pathname;

    const pageMap = [
      {
        match: "/dashboard",
        title: "Dashboard",
        subtitle: "Overview & analytics",
      },
      {
        match: "/company",
        title: "Company",
        subtitle: "Manage company information",
      },
      {
        match: "/branches",
        title: "Branches",
        subtitle: "Manage company branches",
      },
      {
        match: "/customers",
        title: "Customers",
        subtitle: "Manage customers",
      },
      {
        match: "/users",
        title: "Users",
        subtitle: "Manage system users",
      },
      {
        match: "/employees",
        title: "Employees",
        subtitle: "Manage employees",
      },
      {
        match: "/departments",
        title: "Departments",
        subtitle: "Manage departments",
      },
      {
        match: "/designations",
        title: "Designations",
        subtitle: "Manage designations",
      },

      /* =========================
          INVENTORY
      ========================= */

      {
        match: "/inventory/categories",
        title: "Categories",
        subtitle: "Manage product categories",
      },
      {
        match: "/inventory/brands",
        title: "Brands",
        subtitle: "Manage product brands",
      },
      {
        match: "/inventory/units",
        title: "Units",
        subtitle: "Manage inventory units",
      },
      {
        match: "/inventory/warehouses",
        title: "Warehouses",
        subtitle: "Manage inventory warehouses",
      },
      {
        match: "/inventory/products",
        title: "Products",
        subtitle: "Manage products",
      },
      {
        match: "/inventory/stock",
        title: "Stock",
        subtitle: "View current stock",
      },
      {
        match: "/inventory/stock-movements",
        title: "Stock Movements",
        subtitle: "Track stock movements",
      },
      {
        match: "/inventory/stock-adjustments",
        title: "Stock Adjustments",
        subtitle: "Manage stock adjustments",
      },
      {
        match: "/inventory/stock-transfers",
        title: "Stock Transfers",
        subtitle: "Manage stock transfers",
      },
      {
        match: "/inventory/stock-summary",
        title: "Stock Summary",
        subtitle: "Inventory overview",
      },

      /* =========================
          SALES
      ========================= */

      {
        match: "/sales/orders",
        title: "Sales Orders",
        subtitle: "Manage sales orders",
      },
      {
        match: "/sales/quotations",
        title: "Quotations",
        subtitle: "Manage sales quotations",
      },
      {
        match: "/sales/invoices",
        title: "Sales Invoices",
        subtitle: "Manage sales invoices",
      },
      {
        match: "/sales/payments",
        title: "Sales Payments",
        subtitle: "Manage sales payments",
      },
      {
        match: "/sales/returns",
        title: "Sales Returns",
        subtitle: "Manage sales returns",
      },

      /* =========================
          PURCHASES
      ========================= */

      {
        match: "/purchases/suppliers",
        title: "Suppliers",
        subtitle: "Manage suppliers",
      },
      {
        match: "/purchases/orders",
        title: "Purchase Orders",
        subtitle: "Manage purchase orders",
      },
      {
        match: "/purchases/goods-receipts",
        title: "Goods Receipts",
        subtitle: "Manage goods receipts",
      },
      {
        match: "/purchases/invoices",
        title: "Purchase Invoices",
        subtitle: "Manage purchase invoices",
      },
      {
        match: "/purchases/payments",
        title: "Purchase Payments",
        subtitle: "Manage purchase payments",
      },
      {
        match: "/purchases/returns",
        title: "Purchase Returns",
        subtitle: "Manage purchase returns",
      },

      /* =========================
          FINANCE
      ========================= */

      {
        match: "/finance/accounts",
        title: "Accounts",
        subtitle: "Manage accounts",
      },
      {
        match: "/finance/expense-categories",
        title: "Expense Categories",
        subtitle: "Manage expense categories",
      },
      {
        match: "/finance/expenses",
        title: "Expenses",
        subtitle: "Manage expenses",
      },
      {
        match: "/finance/journal-entries",
        title: "Journal Entries",
        subtitle: "Manage journal entries",
      },
      {
        match: "/finance/ledger",
        title: "Ledger",
        subtitle: "View ledger entries",
      },
      {
        match: "/finance/trial-balance",
        title: "Trial Balance",
        subtitle: "View trial balance",
      },
      {
        match: "/finance/credit-notes",
        title: "Credit Notes",
        subtitle: "Manage credit notes",
      },
      {
        match: "/finance/customer-credit-ledger",
        title: "Customer Credit Ledger",
        subtitle: "Manage customer credit ledger",
      },
      {
        match: "/finance/approvals",
        title: "Approvals",
        subtitle: "Manage approval requests",
      },

      /* =========================
          SYSTEM
      ========================= */

      {
        match: "/reports",
        title: "Reports",
        subtitle: "View business reports",
      },
      {
        match: "/documents",
        title: "Documents",
        subtitle: "Manage business documents",
      },
      {
        match: "/audit-logs",
        title: "Audit Logs",
        subtitle: "Track system activities",
      },
      {
        match: "/notifications",
        title: "Notifications",
        subtitle: "View system notifications",
      },
      {
        match: "/settings",
        title: "Settings",
        subtitle: "Manage system settings",
      },
    ];

    const matchedPage = pageMap.find((page) =>
      path.startsWith(page.match)
    );

    return (
      matchedPage || {
        title: "WebNexa ERP",
        subtitle: "Enterprise resource planning",
      }
    );
  }, [location.pathname]);


  /* =========================
      CLOSE PROFILE ON ROUTE
  ========================= */

  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);


  /* =========================
      LOGOUT
  ========================= */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("companyId");
    localStorage.removeItem("branchId");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    setProfileOpen(false);

    navigate("/login", {
      replace: true,
    });
  };


  /* =========================
      PROFILE
  ========================= */

  const handleProfile = () => {
    setProfileOpen(false);
    navigate("/settings");
  };


  /* =========================
      NOTIFICATIONS
  ========================= */

  const handleNotifications = () => {
    navigate("/notifications");
  };


  /* =========================
      GLOBAL SEARCH RESULT
  ========================= */

  const handleSearchResultClick = (result) => {
    if (!result) {
      return;
    }

    const resultId =
      result.id ||
      result._id ||
      result.entityId;

    const module = String(
      result.module ||
      result.type ||
      result.entityType ||
      ""
    )
      .toLowerCase()
      .replace(/[\s_-]/g, "");

    if (!module) {
      return;
    }

    const routeMap = {
      company: "/company",

      branch: "/branches",
      branches: "/branches",

      user: "/users",
      users: "/users",

      employee: "/employees",
      employees: "/employees",

      department: "/departments",
      departments: "/departments",

      designation: "/designations",
      designations: "/designations",

      category: "/inventory/categories",
      categories: "/inventory/categories",

      brand: "/inventory/brands",
      brands: "/inventory/brands",

      unit: "/inventory/units",
      units: "/inventory/units",

      product: "/inventory/products",
      products: "/inventory/products",

      warehouse: "/inventory/warehouses",
      warehouses: "/inventory/warehouses",

      stock: "/inventory/stock",

      stockmovement: "/inventory/stock-movements",
      stockmovements: "/inventory/stock-movements",

      stockadjustment: "/inventory/stock-adjustments",
      stockadjustments: "/inventory/stock-adjustments",

      stocktransfer: "/inventory/stock-transfers",
      stocktransfers: "/inventory/stock-transfers",

      supplier: "/purchases/suppliers",
      suppliers: "/purchases/suppliers",

      purchaseorder: "/purchases/orders",
      purchaseorders: "/purchases/orders",

      goodsreceipt: "/purchases/goods-receipts",
      goodsreceipts: "/purchases/goods-receipts",

      purchaseinvoice: "/purchases/invoices",
      purchaseinvoices: "/purchases/invoices",

      purchasepayment: "/purchases/payments",
      purchasepayments: "/purchases/payments",

      purchasereturn: "/purchases/returns",
      purchasereturns: "/purchases/returns",

      customer: "/customers",
      customers: "/customers",

      quotation: "/sales/quotations",
      quotations: "/sales/quotations",

      salesorder: "/sales/orders",
      salesorders: "/sales/orders",

      salesinvoice: "/sales/invoices",
      salesinvoices: "/sales/invoices",

      salespayment: "/sales/payments",
      salespayments: "/sales/payments",

      salesreturn: "/sales/returns",
      salesreturns: "/sales/returns",

      account: "/finance/accounts",
      accounts: "/finance/accounts",

      expensecategory: "/finance/expense-categories",
      expensecategories: "/finance/expense-categories",

      expense: "/finance/expenses",
      expenses: "/finance/expenses",

      journalentry: "/finance/journal-entries",
      journalentries: "/finance/journal-entries",

      ledger: "/finance/ledger",
      ledgerentries: "/finance/ledger",

      trialbalance: "/finance/trial-balance",

      creditnote: "/finance/credit-notes",
      creditnotes: "/finance/credit-notes",

      customercreditledger: "/finance/customer-credit-ledger",

      approval: "/finance/approvals",
      approvals: "/finance/approvals",
    };

    const baseRoute = routeMap[module];

    if (!baseRoute) {
      return;
    }

    const detailModules = [
      "salesorder",
      "salesorders",
      "quotation",
      "quotations",
      "salesinvoice",
      "salesinvoices",
      "salespayment",
      "salespayments",
      "salesreturn",
      "salesreturns",
    ];

    if (
      resultId &&
      detailModules.includes(module)
    ) {
      navigate(`${baseRoute}/${resultId}`);
    } else {
      navigate(baseRoute);
    }
  };


  return (
    <header className="topbar">

      {/* =========================
          LEFT
      ========================= */}

      <div className="topbar-left">

        <button
          className="topbar-menu-btn"
          type="button"
          title="Menu"
        >
          <FiMenu />
        </button>

        <div className="topbar-page-info">
          <h1>{pageInfo.title}</h1>
          <span>{pageInfo.subtitle}</span>
        </div>

      </div>


      {/* =========================
          RIGHT
      ========================= */}

      <div className="topbar-right">

        {/* =========================
            GLOBAL SEARCH
        ========================= */}

        <div className="topbar-search-wrapper">
          <GlobalSearch
            onResultClick={handleSearchResultClick}
          />
        </div>


        {/* =========================
            THEME
        ========================= */}

        <button
          type="button"
          className="topbar-icon-btn"
          onClick={toggleTheme}
          title={
            theme === "dark"
              ? "Switch to light theme"
              : "Switch to dark theme"
          }
        >
          {theme === "dark" ? (
            <FiSun />
          ) : (
            <FiMoon />
          )}
        </button>


        {/* =========================
            NOTIFICATIONS
        ========================= */}

        <button
          type="button"
          className="topbar-icon-btn notification-btn"
          title="Notifications"
          onClick={handleNotifications}
        >
          <FiBell />

          <span className="notification-count">
            3
          </span>
        </button>


        {/* =========================
            PROFILE
        ========================= */}

        <div className="topbar-profile-wrapper">

          <button
            type="button"
            className="topbar-profile"
            onClick={() =>
              setProfileOpen((prev) => !prev)
            }
          >

            <div className="profile-avatar">
              <FiUser />
            </div>

            <div className="profile-info">
              <strong>{userName}</strong>

              <span>
                {String(userRole).replace(/_/g, " ")}
              </span>
            </div>

            <FiChevronDown
              className={`profile-arrow ${
                profileOpen ? "rotate" : ""
              }`}
            />

          </button>


          {/* =========================
              PROFILE DROPDOWN
          ========================= */}

          {profileOpen && (
            <div className="profile-dropdown">

              <div className="dropdown-user">

                <div className="profile-avatar large">
                  <FiUser />
                </div>

                <div>
                  <strong>{userName}</strong>
                  <span>{userEmail}</span>
                </div>

              </div>


              <div className="dropdown-divider" />


              {/* PROFILE */}

              <button
                type="button"
                className="dropdown-item"
                onClick={handleProfile}
              >
                <FiUser />
                <span>My Profile</span>
              </button>


              {/* SETTINGS */}

              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/settings");
                }}
              >
                <FiSettings />
                <span>Settings</span>
              </button>


              {/* LOGOUT */}

              <button
                type="button"
                className="dropdown-item logout-item"
                onClick={handleLogout}
              >
                <FiLogOut />
                <span>Logout</span>
              </button>

            </div>
          )}

        </div>

      </div>

    </header>
  );
}

export default Topbar;