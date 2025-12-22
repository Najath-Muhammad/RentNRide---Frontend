import React, { useState, useEffect } from "react";
import { AdminSidebar } from "../../components/admin/AdminSidebar";
import AdminTable from "../../components/admin/AdminTable";
import { api } from "../../utils/axios";
import { ADMINRoutes } from "../../constants/route.constant";

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "Normal" | "Premium";
  status: "Active" | "Blocked";
}

const UserManagementPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  

  const [list, setList] = useState<User[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1); 
    }, 1000)
    return () => clearTimeout(timer)
  }, [search])

 
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const res = await api.get(ADMINRoutes.USER.GET_USERS, {
        params: { 
          page, 
          limit, 
          search: debouncedSearch, 
          status: status || undefined, 
          role: role || undefined 
        },
      })
  
      //console.log('Full API response:', res.data)
      const usersWrapper = res.data.users;
  
      const mappedUsers: User[] = usersWrapper.users.map((user: any) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "N/A",
        role: user.role === "premium" ? "Premium" : "Normal",
        status: user.status === "active" || user.status === "Active" ? "Active" : "Blocked",
      }));
  
      setList(mappedUsers);
      setTotalPages(usersWrapper.totalPages || 1);
      setTotalItems(usersWrapper.total || 0);
  
    } catch (err) {
      console.error("Failed to fetch users", err);
      setList([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, debouncedSearch, status, role]);

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [status, role]);

  const updateUserLocally = (id: string, updatedFields: Partial<User>) => {
    setList((prev) =>
      prev.map((u) => (u._id === id ? { ...u, ...updatedFields } : u))
    );
  };

  const deleteUserLocally = (id: string) => {
    setList((prev) => prev.filter((u) => u._id !== id));
  };


  const handleBlockUser = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}/block`);
      updateUserLocally(id, { status: "Blocked" });
    } catch (err) {
      console.error("Failed to block user:", err);
    }
  };

  const handleUnblockUser = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}/unblock`);
      updateUserLocally(id, { status: "Active" });
    } catch (err) {
      console.error("Failed to unblock user:", err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }
    
    try {
      await api.delete(`/admin/users/delete/${id}`);
      deleteUserLocally(id);
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  const handleMakePremium = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}/premium`);
      updateUserLocally(id, { role: "Premium" });
    } catch (err) {
      console.error("Failed to make user premium:", err);
    }
  };

  const handleMakeNormal = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}/normal`);
      updateUserLocally(id, { role: "Normal" });
    } catch (err) {
      console.error("Failed to make user normal:", err);
    }
  };

  // Action generator
  const getUserActions = (user: User) => {
    const actions = [];

    if (user.status === "Active") {
      actions.push({
        label: "Block",
        onClick: handleBlockUser,
        className: "text-red-600 border-red-200 hover:bg-red-50",
      });
    } else {
      actions.push({
        label: "Unblock",
        onClick: handleUnblockUser,
        className: "text-emerald-600 border-emerald-200 hover:bg-emerald-50",
      });
    }

    if (user.role === "Normal") {
      actions.push({
        label: "Make Premium",
        onClick: handleMakePremium,
        className: "text-purple-600 border-purple-200 hover:bg-purple-50",
      });
    } else {
      actions.push({
        label: "Make Normal",
        onClick: handleMakeNormal,
        className: "text-gray-600 border-gray-200 hover:bg-gray-50",
      });
    }

    actions.push({
      label: "Delete",
      onClick: handleDeleteUser,
      className: "text-red-600 border-red-200 hover:bg-red-50",
    });

    return actions;
  };

  // Format for table
  const formattedUsers = list.map((user) => ({
    ...user,
    shortId: user._id.slice(-6),
    phone: user.phone || "N/A",
  }));

  const columns = [
    { key: "shortId", label: "ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
  ];

  const filters = [
    { key: "status", label: "Status", options: ["Active", "Blocked"] },
    { key: "role", label: "Role", options: ["Normal", "Premium"] },
  ];

  // Track active filters for display
  const activeFilters: Record<string, string> = {
    status: status || "All",
    role: role || "All",
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar activeItem="User Management" />


      <div className="ml-64 flex-1">
        <AdminTable
          data={formattedUsers}
          columns={columns}
          title="User Management"
          searchValue={search}
          onSearch={setSearch}
          searchPlaceholder="Search by name, email, or phone..."
          filters={filters}
          activeFilters={activeFilters}
          onFilterChange={(key, value) => {
            if (key === "status") setStatus(value);
            if (key === "role") setRole(value);
          }}
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setPage}
          actions={(item) => getUserActions(item)}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default UserManagementPage;