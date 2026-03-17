import { api } from "../../../utils/axios";

export interface ChatbotResponse {
    success: boolean;
    message: string;
    data: {
        filters: Record<string, any>;
        vehicles: any[];
        total: number;
    };
}

export const ChatbotApi = {
    searchVehiclesViaChat: async (message: string): Promise<ChatbotResponse> => {
        const response = await api.post("/chatbot", { message });
        return response.data;
    }
};
