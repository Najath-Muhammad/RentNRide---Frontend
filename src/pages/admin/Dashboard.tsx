import React from "react";
import { AdminSidebar } from "../../components/admin/AdminSidebar";
import AdminDashboard from "./admin.dashboard";

const DashboardPage: React.FC = () => {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AdminSidebar activeItem="Dashboard" />
      <div className="flex-1 overflow-x-hidden ml-64">
        <AdminDashboard />
      </div>
    </div>
  );
};

export default DashboardPage;