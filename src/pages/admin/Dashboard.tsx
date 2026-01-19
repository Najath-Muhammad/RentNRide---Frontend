import React from "react";
import { AdminSidebar } from "../../components/admin/AdminSidebar";
import { useAuthStore } from "../../stores/authStore";

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore.getState()
  console.log(user)

  return (
    <div>
      <AdminSidebar activeItem="Dashboard" />
    </div>
  );
};

export default DashboardPage;