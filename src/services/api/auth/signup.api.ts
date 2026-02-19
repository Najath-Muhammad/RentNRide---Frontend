import { api } from "../../../utils/axios";
import { APIAuthRoutes } from "../../../constants/route.constant";
import type { User } from "../../../types/auth.types";

export interface SignupPayload {
    name: string;
    email: string;
    password: string;
}

export interface SignupResponse {
    success: boolean;
    message: string;
}

export interface GoogleLoginPayload {
    credential: string;
}

export interface AuthResponse {
    success: boolean;
    data: {
        user: User;
    };
    message?: string;
}

export const AuthApi = {
    signup: async (payload: SignupPayload): Promise<SignupResponse> => {
        const response = await api.post<SignupResponse>(APIAuthRoutes.SIGNUP, payload);
        return response.data;
    },

    googleLogin: async (payload: GoogleLoginPayload): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>(APIAuthRoutes.GOOGLE, payload, {
            withCredentials: true,
        });
        return response.data;
    },
};