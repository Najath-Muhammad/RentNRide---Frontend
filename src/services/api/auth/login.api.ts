import { api } from "../../../utils/axios";
import { APIAuthRoutes } from "../../../constants/route.constant";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface GoogleLoginPayload {
  credential: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data: {
    user: AuthUser;
    expiresIn?: number;
  };
}

export const AuthApi = {
  loginWithEmail: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(APIAuthRoutes.LOGIN, credentials, {
      withCredentials: true,
    });
    return response.data;
  },
  loginWithGoogle: async (payload: GoogleLoginPayload): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(APIAuthRoutes.GOOGLE, payload, {
      withCredentials: true,
    });
    return response.data;
  },
  logout: async (): Promise<{ success: boolean }> => {
    const response = await api.post(APIAuthRoutes.LOGOUT, {}, { withCredentials: true });
    return response.data;
  },
  getCurrentUser: async (): Promise<{ success: boolean; message: string; data: { user: AuthUser } }> => {
    const response = await api.get<{ success: boolean; message: string; data: { user: AuthUser } }>(APIAuthRoutes.ME);
    return response.data;
  },
};