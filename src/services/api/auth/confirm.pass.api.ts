import { api } from "../../../utils/axios";
import { APIAuthRoutes } from "../../../constants/route.constant";
import type { AxiosError } from "axios";

export interface ResetPasswordPayload {
  email: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message?: string;
}

export const AuthApi = {
  resetPassword: async (payload: ResetPasswordPayload): Promise<ResetPasswordResponse> => {
    try {
      const response = await api.post<ResetPasswordResponse>(
        APIAuthRoutes.RESET_PASSWORD,
        payload
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      throw axiosError;
    }
  },
};