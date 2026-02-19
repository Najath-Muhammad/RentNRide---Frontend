import { api } from "../../../utils/axios";

import type { Vehicle, PaginatedVehiclesResponse } from "../../../types/vehicle.types";

import type { AxiosRequestConfig } from 'axios';

export const UserVehicleApi = {
    getVehicles: async (params?: {
        page?: number;
        limit?: number;
        lat?: number;
        lon?: number;
        range?: number;
        minRange?: number;
        search?: string;
        category?: string[];
        fuelType?: string[];
        transmission?: string[];
        minPrice?: number;
        maxPrice?: number;
        sortBy?: string;
    }): Promise<PaginatedVehiclesResponse> => {
        const config: AxiosRequestConfig = {
            params,
            _skipAuthRefresh: true
        };
        const response = await api.get<PaginatedVehiclesResponse>('/vehicles', config);
        return response.data;
    },

    getMyVehicles: async (): Promise<{
        success: boolean; data: { vehicles: Vehicle[] }
    }> => {
        const response = await api.get<{ success: boolean; data: { vehicles: Vehicle[] } }>('/vehicles/my-vehicles', {
            withCredentials: true
        });
        return response.data;
    },

    getVehicleById: async (id: string): Promise<{ success: boolean; data: Vehicle }> => {
        const response = await api.get<{ success: boolean; data: Vehicle }>(`/vehicles/${id}`);
        return response.data;
    },

    createVehicle: async (payload: Partial<Vehicle>): Promise<{
        message: string; success: boolean
    }> => {
        const response = await api.post<{ success: boolean; message: string }>('vehicles/createVehicle', payload);
        return response.data;
    },

    updateVehicle: async (id: string, payload: Partial<Vehicle>): Promise<{ success: boolean }> => {
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
