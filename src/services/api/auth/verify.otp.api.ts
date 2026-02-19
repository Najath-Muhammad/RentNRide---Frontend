import { api } from "../../../utils/axios";
import { APIAuthRoutes } from "../../../constants/route.constant";
import type { User } from "../../../types/auth.types";

export interface VerifyOtpPayload {
    otp: string;
    email: string;
}

export interface VerifyOtpResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
    };
}

export interface ResendOtpPayload {
    email: string;
}

export interface ResendOtpResponse {
    success: boolean;
    message: string;
}

export const AuthApi = {
    verifyOtp: async (payload: VerifyOtpPayload): Promise<VerifyOtpResponse> => {
        const response = await api.post<VerifyOtpResponse>(APIAuthRoutes.VERIFY_OTP, payload);
        return response.data;
    },

    verifyOtpForgot: async (payload: VerifyOtpPayload): Promise<VerifyOtpResponse> => {
        const response = await api.post<VerifyOtpResponse>("/auth/verify-otp-forgot", payload);
        return response.data;
    },

    resendOtp: async (payload: ResendOtpPayload): Promise<ResendOtpResponse> => {
        const response = await api.post<ResendOtpResponse>(APIAuthRoutes.RESEND_OTP, payload);
        return response.data;
    },
};
