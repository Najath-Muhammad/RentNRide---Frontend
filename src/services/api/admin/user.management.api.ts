import { api } from "../../../utils/axios";
import { ADMINRoutes } from "../../../constants/route.constant";

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "Normal" | "Premium";
  status: "Active" | "Blocked";
}

export interface PaginatedUsersResponse {
  users: User[];
  totalPages: number;
  total: number;
  currentPage?: number;
}

interface ApiUsersWrapper {
  users: User[];
  totalPages: number;
  total: number;
}

interface ApiUserListResponse {
  success: boolean;
  data: {
    users: ApiUsersWrapper;
  };
}

export const UserApi = {
  getUsers: async (params: {page?: number;limit?: number;search?: string;status?: string;role?: string;}): Promise<PaginatedUsersResponse> => {
    const response = await api.get<ApiUserListResponse>(ADMINRoutes.USER.GET_USERS, {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        search: params.search || undefined,
        status: params.status || undefined,
        role: params.role || undefined,
      },
    });
    const usersData = response.data.data.users;
    const normalizedUsers = usersData.users.map((user) => ({
      ...user,
      phone: user.phone || "N/A",
      role: user.role.toLowerCase() === "premium" ? "Premium" : "Normal",
      status: user.status.toLowerCase() === "active" ? "Active" : "Blocked",
    })) as User[];

    return {
      users: normalizedUsers,
      totalPages: usersData.totalPages || 1,
      total: usersData.total || 0,
      currentPage: params.page,
    };
  },
  blockUser: async (userId: string): Promise<void> => {
    await api.patch(`/admin/users/${userId}/block`);
  },
  unblockUser: async (userId: string): Promise<void> => {
    await api.patch(`/admin/users/${userId}/unblock`);
  },
  makePremium: async (userId: string): Promise<void> => {
    await api.patch(`/admin/users/${userId}/premium`);
  },
  makeNormal: async (userId: string): Promise<void> => {
    await api.patch(`/admin/users/${userId}/normal`);
  },
  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/admin/users/delete/${userId}`);
  },
};