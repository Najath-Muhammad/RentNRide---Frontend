import { api } from "../../../utils/axios";

export interface Transaction {
    _id: string;
    amount: number;
    transactionType: "credit" | "debit";
    description: string;
    date: string;
}

export interface Wallet {
    _id: string;
    userId: string;
    balance: number;
    transactionHistory: Transaction[];
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export const WalletApi = {
    getWallet: async (page = 1, limit = 5) => {
        const response = await api.get(`/wallet?page=${page}&limit=${limit}`);
        return response.data;
    },

    createFundingIntent: async (amount: number) => {
        const response = await api.post("/wallet/fund-intent", { amount });
        return response.data;
    }
};
