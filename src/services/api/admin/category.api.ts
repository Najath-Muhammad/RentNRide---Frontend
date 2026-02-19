import { api } from "../../../utils/axios";

export interface SubCategory {
    _id?: string;
    name: string;
    isActive?: boolean;
}

export interface Category {
    _id: string;
    name: string;
    description?: string;
    subCategories: SubCategory[];
    isActive: boolean;
}

export interface FuelType {
    _id: string;
    name: string;
    description?: string;
    isActive: boolean;
}

export const CategoryApi = {
    // Category Methods
    getAllCategories: async (params?: { page?: number; limit?: number; search?: string }): Promise<{ data: Category[]; total: number; page: number; totalPages: number }> => {
        const response = await api.get<{ success: boolean; data: { data: Category[]; total: number; page: number; totalPages: number } }>("/admin/categories", { params });
        return response.data.data;
    },

    createCategory: async (data: Partial<Category>): Promise<Category> => {
        const response = await api.post<{ success: boolean; data: Category }>("/admin/categories", data);
        return response.data.data;
    },

    updateCategory: async (id: string, data: Partial<Category>): Promise<Category> => {
        const response = await api.put<{ success: boolean; data: Category }>(`/admin/categories/${id}`, data);
        return response.data.data;
    },

    toggleCategoryStatus: async (id: string): Promise<Category> => {
        const response = await api.patch<{ success: boolean; data: Category }>(`/admin/categories/${id}/toggle`);
        return response.data.data;
    },

    // Fuel Type Methods
    getAllFuelTypes: async (): Promise<FuelType[]> => {
        const response = await api.get<{ success: boolean; data: FuelType[] }>("/admin/fuel-types");
        return response.data.data;
    },

    createFuelType: async (data: Partial<FuelType>): Promise<FuelType> => {
        const response = await api.post<{ success: boolean; data: FuelType }>("/admin/fuel-types", data);
        return response.data.data;
    },

    updateFuelType: async (id: string, data: Partial<FuelType>): Promise<FuelType> => {
        const response = await api.put<{ success: boolean; data: FuelType }>(`/admin/fuel-types/${id}`, data);
        return response.data.data;
    },

    toggleFuelTypeStatus: async (id: string): Promise<FuelType> => {
        const response = await api.patch<{ success: boolean; data: FuelType }>(`/admin/fuel-types/${id}/toggle`);
        return response.data.data;
    },
};
