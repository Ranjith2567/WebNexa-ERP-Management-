import { Outlet } from "react-router-dom";

import Sidebar from "../components/common/Sidebar";
import Topbar from "../components/common/Topbar";

import "../styles/main-layout.css";

function MainLayout() {
  return (
    <div className="main-layout">
      <Sidebar />

      <div className="main-content">
        <Topbar />

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;