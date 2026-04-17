import React from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminDashboard from "./admin.dashboard";

const DashboardPage: React.FC = () => {
  return (
    <AdminLayout activeItem="Dashboard">
      <AdminDashboard />
    </AdminLayout>
  );
};

export default DashboardPage;