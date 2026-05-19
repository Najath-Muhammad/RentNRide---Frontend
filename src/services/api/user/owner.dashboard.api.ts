import { api } from "../../../utils/axios";

export interface OwnerDashboardStats {
  totalRevenue: number;
  totalBookings: number;
  totalCancelled: number;
  totalVehicles: number;
  activeVehicles: number;
  earningsThisMonth: number;
  pendingPayments: number;
}

export const OwnerDashboardApi = {
  getStats: async (): Promise<OwnerDashboardStats> => {
    const response = await api.get<{ success: boolean; data: OwnerDashboardStats }>(
      "/bookings/owner/dashboard"
    );
    return response.data.data;
  },
};
