import { api } from "../../../utils/axios";

export interface SubscriptionPlan {
    _id: string;
    name: string;
    description?: string;
    price: number;
    durationDays: number;
    vehicleLimit: number;
    features: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UserSubscription {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
    };
    planId: SubscriptionPlan;
    startDate: string;
    endDate: string;
    status: 'active' | 'expired' | 'cancelled';
    cancelledAt?: string;
    cancelReason?: string;
    createdAt: string;
}

export interface PaginatedPlans {
    data: SubscriptionPlan[];
    total: number;
    page: number;
    totalPages: number;
}

export interface PaginatedUserSubscriptions {
    data: UserSubscription[];
    total: number;
    page: number;
    totalPages: number;
}

export const SubscriptionApi = {
    getAllPlans: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedPlans> => {
        const response = await api.get<{ success: boolean; data: PaginatedPlans }>('/admin/subscription-plans', { params });
        return response.data.data;
    },

    getActivePlans: async (): Promise<SubscriptionPlan[]> => {
        const response = await api.get<{ success: boolean; data: SubscriptionPlan[] }>('/admin/subscription-plans/active');
        return response.data.data;
    },

    getPlanById: async (id: string): Promise<SubscriptionPlan> => {
        const response = await api.get<{ success: boolean; data: SubscriptionPlan }>(`/admin/subscription-plans/${id}`);
        return response.data.data;
    },

    createPlan: async (data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
        const response = await api.post<{ success: boolean; data: SubscriptionPlan }>('/admin/subscription-plans', data);
        return response.data.data;
    },

    updatePlan: async (id: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
        const response = await api.put<{ success: boolean; data: SubscriptionPlan }>(`/admin/subscription-plans/${id}`, data);
        return response.data.data;
    },

    togglePlanStatus: async (id: string): Promise<SubscriptionPlan> => {
        const response = await api.patch<{ success: boolean; data: SubscriptionPlan }>(`/admin/subscription-plans/${id}/toggle`);
        return response.data.data;
    },

    getAllUserSubscriptions: async (params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<PaginatedUserSubscriptions> => {
        const response = await api.get<{ success: boolean; data: PaginatedUserSubscriptions }>('/admin/user-subscriptions', { params });
        return response.data.data;
    },

    assignSubscription: async (userId: string, planId: string): Promise<UserSubscription> => {
        const response = await api.post<{ success: boolean; data: UserSubscription }>('/admin/user-subscriptions/assign', { userId, planId });
        return response.data.data;
    },

    cancelUserSubscription: async (id: string, reason?: string): Promise<UserSubscription> => {
        const response = await api.patch<{ success: boolean; data: UserSubscription }>(`/admin/user-subscriptions/${id}/cancel`, { reason });
        return response.data.data;
    },

    getMySubscription: async (): Promise<UserSubscription | null> => {
        const response = await api.get<{ success: boolean; data: UserSubscription | null }>('/subscriptions/my');
        return response.data.data;
    },

    getMySubscriptionHistory: async (params?: { page?: number; limit?: number }): Promise<PaginatedUserSubscriptions> => {
        const response = await api.get<{ success: boolean; data: PaginatedUserSubscriptions }>('/subscriptions/my/history', { params });
        return response.data.data;
    },

    getPublicPlans: async (): Promise<SubscriptionPlan[]> => {
        const response = await api.get<{ success: boolean; data: SubscriptionPlan[] }>('/subscriptions/plans');
        return response.data.data;
    },

    selfSubscribe: async (planId: string): Promise<UserSubscription> => {
        const response = await api.post<{ success: boolean; data: UserSubscription }>('/subscriptions/subscribe', { planId });
        return response.data.data;
    },

    verifySubscriptionPayment: async (paymentIntentId: string): Promise<UserSubscription> => {
        const response = await api.post<{ success: boolean; data: UserSubscription }>(
            "/subscriptions/verify-payment",
            { paymentIntentId }
        );
        return response.data.data;
    }
};
