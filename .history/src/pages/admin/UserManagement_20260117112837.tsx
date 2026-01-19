import React, { useState, useEffect } from "react";
import { AdminSidebar } from "../../components/admin/AdminSidebar";
import AdminTable from "../../components/admin/AdminTable";
import { UserApi, type User, type PaginatedUsersResponse } from "../../services/api/admin/user.management.api"
import ConfirmationModal from "../../components/common/ConfirmationModal";

const UserManagementPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"Active" | "Blocked" | "">("");
  const [role, setRole] = useState<"Normal" | "Premium" | "">("");

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
      console.log('users', data.users)
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

  const getUserActions = (user: User) => {
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
  }));

  const columns = [
    { key: "shortId", label: "ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
  ] as const;

  const filters = [
    { key: "status", label: "Status", options: ["Active", "Blocked"] },
    { key: "role", label: "Role", options: ["Normal", "Premium"] },
  ] as const;

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
          onFilterChange={(key: string, value: string) => {
            if (key === "status") setStatus(value as "Active" | "Blocked" | "");
            if (key === "role") setRole(value as "Normal" | "Premium" | "");
          }}
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setPage}
          actions={getUserActions}
          isLoading={isLoading}
        />
      </div>

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
};

export default UserManagementPage;
