import { api } from '../../../utils/axios';

export interface ChatParticipant {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
}

export interface ChatVehicle {
    _id: string;
    brand: string;
    modelName: string;
    vehicleImages: string[];
}

export interface ChatBooking {
    _id?: string;
    bookingId?: string;
    startDate?: string;
    endDate?: string;
    totalAmount?: number;
    advancePaid?: number;
    bookingStatus?: string;
}

export interface Message {
    _id: string;
    conversationId: string;
    senderId: ChatParticipant;
    receiverId: ChatParticipant;
    content: string;
    messageType: 'text' | 'booking_request' | 'booking_action';
    bookingId?: ChatBooking;
    bookingAction?: 'approved' | 'rejected';
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Conversation {
    _id: string;
    participants: ChatParticipant[];
    vehicleId?: ChatVehicle;
    lastMessage?: Message;
    lastMessageAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedMessages {
    data: Message[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const ChatApi = {
    getConversations: async (): Promise<{ success: boolean; data: Conversation[] }> => {
        const response = await api.get<{ success: boolean; data: Conversation[] }>(
            '/chat/conversations',
            { withCredentials: true }
        );
        return response.data;
    },

    getOrCreateConversation: async (
        otherUserId: string,
        vehicleId?: string
    ): Promise<{ success: boolean; data: Conversation }> => {
        const response = await api.post<{ success: boolean; data: Conversation }>(
            '/chat/conversations',
            { otherUserId, vehicleId },
            { withCredentials: true }
        );
        return response.data;
    },

    getMessages: async (
        conversationId: string,
        page = 1,
        limit = 50
    ): Promise<{ success: boolean; data: PaginatedMessages }> => {
        const response = await api.get<{ success: boolean; data: PaginatedMessages }>(
            `/chat/conversations/${conversationId}/messages`,
            { params: { page, limit }, withCredentials: true }
        );
        return response.data;
    },

    sendMessage: async (payload: {
        conversationId?: string;
        receiverId: string;
        content: string;
        vehicleId?: string;
        messageType?: string;
        bookingId?: string;
    }): Promise<{ success: boolean; data: Message }> => {
        const response = await api.post<{ success: boolean; data: Message }>(
            '/chat/messages',
            payload,
            { withCredentials: true }
        );
        return response.data;
    },

    handleBookingAction: async (
        conversationId: string,
        bookingId: string,
        action: 'approved' | 'rejected'
    ): Promise<{ success: boolean; data: Message }> => {
        const response = await api.patch<{ success: boolean; data: Message }>(
            `/chat/conversations/${conversationId}/booking-action`,
            { bookingId, action },
            { withCredentials: true }
        );
        return response.data;
    },
};
