import { api } from "../../../utils/axios";
import { APIAuthRoutes } from "../../../constants/route.constant";
import type { AxiosError } from "axios";

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message?: string;
}

export const AuthApiForgot = {
  requestPasswordResetOTP: async (
    payload: ForgotPasswordPayload
  ): Promise<ForgotPasswordResponse> => {
    try {
      const response = await api.post<ForgotPasswordResponse>(
        APIAuthRoutes.FORGOT_PASSWORD,
        payload
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      throw axiosError;
    }
  },
};