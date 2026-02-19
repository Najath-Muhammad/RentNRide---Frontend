import { api } from "../../../utils/axios";

export interface VehicleListItem {
  _id: string;
  ownerId: string | { name: string; _id: string };
  brand: string;
  modelName: string;
  category: string | { name: string };
  category2?: string;
  fuelType: string | { name: string };
  seatingCapacity: number;
  doors?: number;
  pricePerDay: number;
  pickupAddress: string;
  regionalContact: string;
  vehicleImages: string[];
  rcNumber: string;
  rcExpiryDate: string;
  rcImage: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceExpiryDate: string;
  insuranceImage: string;
  isApproved: boolean;
  isRejected?: boolean;
  rejectionReason?: string;
  isActive: boolean;
  createdAt: string;
}

export interface VehicleStats {
  totalVehicles: number;
  pendingApproval: number;
  approved: number;
  blocked: number;
  rejected: number;
}

export interface PaginatedVehiclesResponse {
  data: VehicleListItem[];
  totalPages: number;
  total: number;
  currentPage?: number;
}

export const VehicleApi = {
  getVehicles: async (params: {
    page?: number; limit?: number; search?: string; category?: string; status?: string; fuelType?: string;
  }): Promise<PaginatedVehiclesResponse> => {
    const response = await api.get<{
      success: boolean;
      data: PaginatedVehiclesResponse;
    }>("/admin/vehicles", {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        search: params.search || undefined,
        category: params.category || undefined,
        status: params.status || undefined,
        fuelType: params.fuelType || undefined,
      },
    });

    return response.data.data;
  },
  getStats: async (): Promise<VehicleStats> => {
    const response = await api.get<{ success: boolean; data: VehicleStats }>("/admin/vehicles/stats");
    return response.data.data;
  },
  approveVehicle: async (vehicleId: string): Promise<void> => {
    await api.patch(`/admin/vehicles/${vehicleId}/approve`);
  },
  rejectVehicle: async (vehicleId: string, reason: string): Promise<void> => {
    await api.patch(`/admin/vehicles/${vehicleId}/reject`, { reason });
  },
  blockVehicle: async (vehicleId: string): Promise<void> => {
    await api.patch(`/admin/vehicles/${vehicleId}/block`);
  },
  unblockVehicle: async (vehicleId: string): Promise<void> => {
    await api.patch(`/admin/vehicles/${vehicleId}/unblock`);
  },
  getVehicleById: async (vehicleId: string): Promise<VehicleListItem> => {
    const response = await api.get<{ success: boolean; data: VehicleListItem }>(
      `/admin/vehicles/${vehicleId}`
    );
    return response.data.data;
  },
};