import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

/* =========================
   AUTH
========================= */
import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

/* =========================
   MAIN
========================= */
import Dashboard from "../pages/dashboard/Dashboard";
import Company from "../pages/company/Company";
import Branch from "../pages/branch/Branch";
import Customers from "../pages/customer/Customers";

/* =========================
   USERS
========================= */
import Users from "../pages/users/Users";

/* =========================
   EMPLOYEES
========================= */
import Employees from "../pages/employees/Employees";

/* =========================
   DEPARTMENTS
========================= */
import Departments from "../pages/departments/Departments";

/* =========================
   DESIGNATIONS
========================= */
import Designations from "../pages/designations/Designations";

/* =========================
   INVENTORY
========================= */
import Categories from "../pages/inventory/Categories";
import Brands from "../pages/inventory/Brands";
import Units from "../pages/inventory/Units";
import Warehouses from "../pages/inventory/Warehouses";
import Products from "../pages/inventory/Products";
import Stock from "../pages/inventory/Stock";
import StockMovements from "../pages/inventory/StockMovements";
import StockAdjustments from "../pages/inventory/StockAdjustments";
import StockTransfers from "../pages/inventory/StockTransfers";
import StockSummary from "../pages/inventory/StockSummary";

/* =========================
   SALES
========================= */

/* Sales Orders */
import SalesOrders from "../pages/sales/SalesOrders";
import CreateSalesOrder from "../pages/sales/CreateSalesOrder";
import SalesOrderView from "../pages/sales/SalesOrderView";
import EditSalesOrder from "../pages/sales/EditSalesOrder";

/* Quotations */
import Quotations from "../pages/sales/Quotations";
import CreateQuotation from "../pages/sales/CreateQuotation";
import QuotationView from "../pages/sales/QuotationView";
import EditQuotation from "../pages/sales/EditQuotation";

/* Sales Invoices */
import SalesInvoices from "../pages/sales/SalesInvoices";
import CreateSalesInvoice from "../pages/sales/CreateSalesInvoice";
import SalesInvoiceView from "../pages/sales/SalesInvoiceView";
import EditSalesInvoice from "../pages/sales/EditSalesInvoice";

/* Sales Payments */
import SalesPayments from "../pages/sales/SalesPayments";
import CreateSalesPayment from "../pages/sales/CreateSalesPayment";
import SalesPaymentView from "../pages/sales/SalesPaymentView";

/* Sales Returns */
import SalesReturns from "../pages/sales/SalesReturns";
import CreateSalesReturn from "../pages/sales/CreateSalesReturn";
import SalesReturnView from "../pages/sales/SalesReturnView";

/* =========================
   PURCHASES
========================= */
import Suppliers from "../pages/purchases/Suppliers";
import PurchaseOrders from "../pages/purchases/PurchaseOrders";
import GoodsReceipts from "../pages/purchases/GoodsReceipts";
import PurchaseInvoices from "../pages/purchases/PurchaseInvoices";
import PurchasePayments from "../pages/purchases/PurchasePayments";
import PurchaseReturns from "../pages/purchases/PurchaseReturns";

/* =========================
   FINANCE
========================= */
import Account from "../pages/finance/Account";
import ExpenseCategories from "../pages/finance/ExpenseCategories";
import Expenses from "../pages/finance/Expenses";
import JournalEntries from "../pages/finance/JournalEntries";
import Ledger from "../pages/finance/Ledger";
import TrialBalance from "../pages/finance/TrialBalance";
import CreditNotes from "../pages/finance/CreditNotes";
import CustomerCreditLedger from "../pages/finance/CustomerCreditLedger";
import ApprovalManagement from "../pages/finance/ApprovalManagement";

/* =========================
   REPORTS
========================= */
import Reports from "../pages/reports/Reports";

/* =========================
   DOCUMENTS
========================= */
import Documents from "../pages/documents/Documents";

/* =========================
   AUDIT LOGS
========================= */
import AuditLogs from "../pages/audit-logs/AuditLogs";

/* =========================
   NOTIFICATIONS
========================= */
import Notifications from "../pages/notifications/Notifications";

/* =========================
   SETTINGS
========================= */
import Settings from "../pages/settings/Settings";

/* =========================
   ROUTE PROTECTION
========================= */
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../layouts/MainLayout";


function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
            PUBLIC ROUTES
        ====================================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />


        {/* =====================================================
            PROTECTED ROUTES
        ====================================================== */}

        <Route element={<ProtectedRoute />}>

          <Route element={<MainLayout />}>

            {/* =================================================
                MAIN
            ================================================== */}

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/company"
              element={<Company />}
            />

            <Route
              path="/branches"
              element={<Branch />}
            />

            <Route
              path="/customers"
              element={<Customers />}
            />

            <Route
              path="/users"
              element={<Users />}
            />

            <Route
              path="/employees"
              element={<Employees />}
            />

            <Route
              path="/departments"
              element={<Departments />}
            />

            <Route
              path="/designations"
              element={<Designations />}
            />


            {/* =================================================
                INVENTORY
            ================================================== */}

            <Route
              path="/inventory/categories"
              element={<Categories />}
            />

            <Route
              path="/inventory/brands"
              element={<Brands />}
            />

            <Route
              path="/inventory/units"
              element={<Units />}
            />

            <Route
              path="/inventory/warehouses"
              element={<Warehouses />}
            />

            <Route
              path="/inventory/products"
              element={<Products />}
            />

            <Route
              path="/inventory/stock"
              element={<Stock />}
            />

            <Route
              path="/inventory/stock-movements"
              element={<StockMovements />}
            />

            <Route
              path="/inventory/stock-adjustments"
              element={<StockAdjustments />}
            />

            <Route
              path="/inventory/stock-transfers"
              element={<StockTransfers />}
            />

            <Route
              path="/inventory/stock-summary"
              element={<StockSummary />}
            />


            {/* =================================================
                SALES
            ================================================== */}

            {/* -------------------------
                SALES ORDERS
            -------------------------- */}

            <Route
              path="/sales/orders"
              element={<SalesOrders />}
            />

            <Route
              path="/sales/orders/create"
              element={<CreateSalesOrder />}
            />

            <Route
              path="/sales/orders/:id"
              element={<SalesOrderView />}
            />

            <Route
              path="/sales/orders/:id/edit"
              element={<EditSalesOrder />}
            />


            {/* -------------------------
                QUOTATIONS
            -------------------------- */}

            <Route
              path="/sales/quotations"
              element={<Quotations />}
            />

            <Route
              path="/sales/quotations/create"
              element={<CreateQuotation />}
            />

            <Route
              path="/sales/quotations/:id"
              element={<QuotationView />}
            />

            <Route
              path="/sales/quotations/:id/edit"
              element={<EditQuotation />}
            />


            {/* -------------------------
                SALES INVOICES
            -------------------------- */}

            <Route
              path="/sales/invoices"
              element={<SalesInvoices />}
            />

            <Route
              path="/sales/invoices/create"
              element={<CreateSalesInvoice />}
            />

            <Route
              path="/sales/invoices/:id"
              element={<SalesInvoiceView />}
            />

            <Route
              path="/sales/invoices/:id/edit"
              element={<EditSalesInvoice />}
            />


            {/* -------------------------
                SALES PAYMENTS
            -------------------------- */}

            <Route
              path="/sales/payments"
              element={<SalesPayments />}
            />

            <Route
              path="/sales/payments/create"
              element={<CreateSalesPayment />}
            />

            <Route
              path="/sales/payments/:id"
              element={<SalesPaymentView />}
            />


            {/* -------------------------
                SALES RETURNS
            -------------------------- */}

            <Route
              path="/sales/returns"
              element={<SalesReturns />}
            />

            <Route
              path="/sales/returns/create"
              element={<CreateSalesReturn />}
            />

            <Route
              path="/sales/returns/:id"
              element={<SalesReturnView />}
            />


            {/* =================================================
                PURCHASES
            ================================================== */}

            <Route
              path="/purchases/suppliers"
              element={<Suppliers />}
            />

            <Route
              path="/purchases/orders"
              element={<PurchaseOrders />}
            />

            <Route
              path="/purchases/goods-receipts"
              element={<GoodsReceipts />}
            />

            <Route
              path="/purchases/invoices"
              element={<PurchaseInvoices />}
            />

            <Route
              path="/purchases/payments"
              element={<PurchasePayments />}
            />

            <Route
              path="/purchases/returns"
              element={<PurchaseReturns />}
            />


            {/* =================================================
                FINANCE
            ================================================== */}

            <Route
              path="/finance/accounts"
              element={<Account />}
            />

            <Route
              path="/finance/expense-categories"
              element={<ExpenseCategories />}
            />

            <Route
              path="/finance/expenses"
              element={<Expenses />}
            />

            <Route
              path="/finance/journal-entries"
              element={<JournalEntries />}
            />

            <Route
              path="/finance/ledger"
              element={<Ledger />}
            />

            <Route
              path="/finance/trial-balance"
              element={<TrialBalance />}
            />

            <Route
              path="/finance/credit-notes"
              element={<CreditNotes />}
            />

            <Route
              path="/finance/customer-credit-ledger"
              element={<CustomerCreditLedger />}
            />

            <Route
              path="/finance/approvals"
              element={<ApprovalManagement />}
            />


            {/* =================================================
                REPORTS
            ================================================== */}

            <Route
              path="/reports"
              element={<Reports />}
            />


            {/* =================================================
                DOCUMENTS
            ================================================== */}

            <Route
              path="/documents"
              element={<Documents />}
            />


            {/* =================================================
                AUDIT LOGS
            ================================================== */}

            <Route
              path="/audit-logs"
              element={<AuditLogs />}
            />


            {/* =================================================
                NOTIFICATIONS
            ================================================== */}

            <Route
              path="/notifications"
              element={<Notifications />}
            />


            {/* =================================================
                SETTINGS
            ================================================== */}

            <Route
              path="/settings"
              element={<Settings />}
            />

          </Route>
        </Route>


        {/* =====================================================
            DEFAULT ROUTE
        ====================================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />


        {/* =====================================================
            UNKNOWN ROUTES
        ====================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}


export default AppRoutes;