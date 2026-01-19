import { api } from "../../../utils/axios";

export interface Vehicle {
    ownerId: any;
    _id: string;
    brand: string;
    modelName: string;
    category: string;
    fuelType: string;
    seatingCapacity: number;
    pricePerDay: number;
    pickupAddress: string;
    vehicleImages: string[];
    isApproved: boolean;
    isRejected?: boolean;
    rejectionReason?: string;
    isActive: boolean;
    createdAt: string;
    doors?: number;
    regionalContact: string;
    rcNumber: string;
    rcExpiryDate: string;
    rcImage: string;
    insuranceProvider: string;
    insurancePolicyNumber: string;
    insuranceExpiryDate: string;
    insuranceImage: string;
}

export interface PaginatedVehiclesResponse {
    success: boolean;
    data: {
        data: Vehicle[];
        total: number;
        page: number;
        totalPages: number;
    };
}

export const UserVehicleApi = {
    getVehicles: async (params?: { page?: number; limit?: number; lat?: number; lon?: number; range?: number }): Promise<PaginatedVehiclesResponse> => {
        const response = await api.get<PaginatedVehiclesResponse>('/vehicles', {
            params,
            _skipAuthRefresh: true
        });
        return response.data;
    },

    getMyVehicles: async (): Promise<{ success: boolean; vehicles: Vehicle[] }> => {
        const response = await api.get<{ success: boolean; vehicles: Vehicle[] }>('/vehicles/my-vehicles', {
            withCredentials: true
        });
        return response.data;
    },

    getVehicleById: async (id: string): Promise<{ success: boolean; data: Vehicle }> => {
        const response = await api.get<{ success: boolean; data: Vehicle }>(`/vehicles/${id}`);
        return response.data;
    },

    createVehicle: async (payload: any): Promise<{
        message: string; success: boolean
    }> => {
        const response = await api.post<{ success: boolean; message: string }>('vehicles/createVehicle', payload);
        return response.data;
    },

    updateVehicle: async (id: string, payload: any): Promise<{ success: boolean }> => {
        const response = await api.patch<{ success: boolean }>(`/vehicles/${id}`, payload, {
            withCredentials: true
        });
        return response.data;
    },

    deleteVehicle: async (id: string): Promise<{ success: boolean }> => {
        const response = await api.delete<{ success: boolean }>(`/vehicles/${id}`, {
            withCredentials: true
        });
        return response.data;
    },

    toggleActive: async (id: string, isActive: boolean): Promise<{ success: boolean }> => {
        const response = await api.patch<{ success: boolean }>(
            `/owner/vehicles/${id}/toggle-active`,
            { isActive },
            { withCredentials: true }
        );
        return response.data;
    },
};
