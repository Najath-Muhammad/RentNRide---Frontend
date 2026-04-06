import { api } from "../../../utils/axios";

export interface INotification {
    _id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    metadata?: Record<string, unknown>;
    isRead: boolean;
    createdAt: string;
}

export const NotificationApi = {
    getNotifications: async () => {
        const response = await api.get('/notifications');
        return response.data;
    },

    markAsRead: async (id: string) => {
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data;
    },

    deleteNotification: async (id: string) => {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    }
};
