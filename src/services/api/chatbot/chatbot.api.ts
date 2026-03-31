import { api } from "../../../utils/axios";

export interface ChatbotResponse {
    success: boolean;
    message: string;
    data: {
        intent: "chat" | "search";
        reply?: string;           // present when intent === "chat"
        filters?: Record<string, any>;
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
