import { api } from "../../../utils/axios";

export interface ChatbotResponse {
    success: boolean;
    message: string;
    data: {
        intent: "chat" | "search";
        reply?: string
        filters?: Record<string, unknown>;
        vehicles: unknown[];
        total: number;
    };
}

export const ChatbotApi = {
    searchVehiclesViaChat: async (message: string): Promise<ChatbotResponse> => {
        const response = await api.post("/chatbot", { message });
        return response.data;
    }
};
