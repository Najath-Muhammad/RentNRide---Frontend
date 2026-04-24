import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import { UserApi, type User, type PaginatedUsersResponse } from "../../services/api/admin/user.management.api"
import { SubscriptionApi } from "../../services/api/admin/subscription.api";

const UserManagementPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"Active" | "Blocked" | "">("");
  const [role, setRole] = useState<string>("");
  const [plans, setPlans] = useState<string[]>([]);

  const [users, setUsers] = useState<User[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    onConfirm: () => { },
  });

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await SubscriptionApi.getActivePlans();
        setPlans(res.map(p => p.name));
      } catch (err) {
        console.error("Failed to fetch plans", err);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 800);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data: PaginatedUsersResponse = await UserApi.getUsers({
        page,
        limit,
        search: debouncedSearch,
        status: status || undefined,
        role: role || undefined,
      });
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setUsers([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, status, role]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [status, role])

  const updateUserLocally = (id: string, updatedFields: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === id ? { ...u, ...updatedFields } : u))
    );
  };

  const deleteUserLocally = (id: string) => {
    setUsers((prev) => prev.filter((u) => u._id !== id));
    setTotalItems((prev) => prev - 1);
  };

  const handleBlockUser = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Block User',
      message: 'Are you sure you want to block this user? They will not be able to access their account.',
      type: 'warning',
      onConfirm: async () => {
        try {
          await UserApi.blockUser(id);
          updateUserLocally(id, { status: "Blocked" });
          closeModal();
        } catch (err) {
          console.error("Failed to block user:", err);
        }
      }
    });
  };

  const handleUnblockUser = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Unblock User',
      message: 'Are you sure you want to unblock this user? They will regain access to their account.',
      type: 'info',
      onConfirm: async () => {
        try {
          await UserApi.unblockUser(id);
          updateUserLocally(id, { status: "Active" });
          closeModal();
        } catch (err) {
          console.error("Failed to unblock user:", err);
        }
      }
    });
  };

  const handleMakePremium = async (id: string) => {
    try {
      await UserApi.makePremium(id);
      updateUserLocally(id, { role: "Premium" });
    } catch (err) {
      console.error("Failed to make user premium:", err);
    }
  };

  const handleMakeNormal = async (id: string) => {
    try {
      await UserApi.makeNormal(id);
      updateUserLocally(id, { role: "Normal" });
    } catch (err) {
      console.error("Failed to make user normal:", err);
    }
  };

  const handleDeleteUser = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await UserApi.deleteUser(id);
          deleteUserLocally(id);
          closeModal();
        } catch (err) {
          console.error("Failed to delete user:", err);
        }
      }
    });
  };

  const getUserActions = (user: { _id: string; role: string; status: string }) => {
    const actions = [];
    if (user.status === "Active") {
      actions.push({
        label: "Block",
        onClick: () => handleBlockUser(user._id),
        className: "text-red-600 border-red-200 hover:bg-red-50",
      });
    } else {
      actions.push({
        label: "Unblock",
        onClick: () => handleUnblockUser(user._id),
        className: "text-emerald-600 border-emerald-200 hover:bg-emerald-50",
      });
    }

    if (user.role === "Normal") {
      actions.push({
        label: "Make Premium",
        onClick: () => handleMakePremium(user._id),
        className: "text-purple-600 border-purple-200 hover:bg-purple-50",
      });
    } else {
      actions.push({
        label: "Make Normal",
        onClick: () => handleMakeNormal(user._id),
        className: "text-gray-600 border-gray-200 hover:bg-gray-50",
      });
    }

    actions.push({
      label: "Delete",
      onClick: () => handleDeleteUser(user._id),
      className: "text-red-600 border-red-200 hover:bg-red-50",
    });

    return actions;
  };

  const formattedUsers = users.map((user) => ({
    ...user,
    shortId: user?._id ? String(user._id).slice(-6) : "N/A",
    role: user.role === "Premium" && user.planName && user.planName !== "None" ? user.planName : user.role,
  }));

  const columns = [
    { key: "shortId", label: "ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "role", label: "Role / Plan" },
    { key: "status", label: "Status" },
  ] as const;

  const filters = [
    { key: "status", label: "Status", options: ["Active", "Blocked"] },
    { key: "role", label: "Role / Plan", options: ["Normal", "Premium", ...plans] },
  ];

  const activeFilters: Record<string, string> = {
    status: status || "All",
    role: role || "All",
  };

  const getModalColors = () => {
    switch (modalConfig.type) {
      case 'danger':
        return {
          icon: 'bg-red-100 text-red-600',
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        };
      case 'warning':
        return {
          icon: 'bg-yellow-100 text-yellow-600',
          button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
        };
      case 'info':
        return {
          icon: 'bg-blue-100 text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        };
    }
  };

  return (
    <AdminLayout activeItem="User Management">
      <AdminTable
        data={formattedUsers}
        columns={columns}
        title="User Management"
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Search by name, email, or phone..."
        filters={filters}
        activeFilters={activeFilters}
        onFilterChange={(key: string, value: string) => {
          if (key === "status") setStatus(value as "Active" | "Blocked" | "");
          if (key === "role") setRole(value);
        }}
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        actions={getUserActions}
        isLoading={isLoading}
      />
      {}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${getModalColors()?.icon || ''}`}>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="mt-4 text-center text-lg font-semibold text-gray-900">
                {modalConfig.title}
              </h3>
              <p className="mt-2 text-center text-sm text-gray-600">
                {modalConfig.message}
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={modalConfig.onConfirm}
                  className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${getModalColors()?.button || ''}`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default UserManagementPage;