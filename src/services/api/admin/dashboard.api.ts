import { api } from "../../../utils/axios";

export interface DashboardStats {
    totalUsers: number;
    totalVehicles: number;
    totalBookings: number;
    totalRevenue: number;
    activeBookings: number;
    availableVehicles: number;
    bookingsTrend: { date: string; count: number }[];
    revenueTrend: { date: string; amount: number }[];
    vehicleUsage: { name: string; count: number }[];
    bookingStatus: { completed: number; pending: number; cancelled: number };
    recentBookings: {
        _id: string;
        userName: string;
        vehicleName: string;
        date: string;
        status: string;
        paymentStatus: string;
    }[];
}

export const AdminDashboardApi = {
    getDashboardStats: async (params?: { startDate?: string; endDate?: string }): Promise<{ success: boolean; data: DashboardStats }> => {
        const response = await api.get('/admin/dashboard', { params });
        return response.data;
    }
};
