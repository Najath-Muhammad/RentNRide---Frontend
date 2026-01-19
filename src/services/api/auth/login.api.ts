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
  // ... add other user fields
}

export interface LoginResponse {
  data: any;
  success: boolean;
  message?: string;
  user: AuthUser;
  // token?: string; // if using JWT instead of cookies
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
  getCurrentUser: async (): Promise<{ user: AuthUser; success: boolean }> => {
    const response = await api.get<{ user: AuthUser; success: boolean }>(APIAuthRoutes.ME);
    return response.data;
  },
};