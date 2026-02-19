import { api } from "../../../utils/axios";

export interface UserProfile {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    createdAt: string;
    profilePhoto: string | null;
    googleId?: string;
}

export interface SubscriptionStatus {
    plan: 'free' | 'premium';
    expiresAt: string | null;
}

export const ProfileApi = {
    getProfile: async (): Promise<{ success: boolean; user: UserProfile }> => {
        const response = await api.get<{ success: boolean; data: { user: UserProfile } }>('/user/profile');
        return { success: response.data.success, user: response.data.data.user };
    },

    updateProfile: async (data: { name: string; phone: string }): Promise<{ success: boolean; message: string }> => {
        const response = await api.patch<{ success: boolean; message: string }>('/user/profile', data);
        return response.data;
    },

    updateProfilePhoto: async (photoUrl: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.patch<{ success: boolean; message: string }>('/user/profile/photo', { profilePhoto: photoUrl });
        return response.data;
    },

    changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> => {
        const response = await api.patch<{ success: boolean; message: string }>('/auth/change-password', {
            old_password: data.currentPassword,
            new_password: data.newPassword
        });
        return response.data;
    },

    getSubscriptionStatus: async (): Promise<{ success: boolean; subscription: SubscriptionStatus }> => {
        const response = await api.get<{ success: boolean; data: { subscription: SubscriptionStatus } }>('/user/subscription');
        return { success: response.data.success, subscription: response.data.data.subscription };
    },

    upgradeToPremium: async (): Promise<{ success: boolean; message: string }> => {
        const response = await api.post<{ success: boolean; message: string }>('/user/subscription/upgrade', {});
        return response.data;
    }
};
