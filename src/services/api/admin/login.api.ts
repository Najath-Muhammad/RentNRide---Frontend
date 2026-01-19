import { ADMINRoutes } from "../../../constants/route.constant";
import { api } from "../../../utils/axios";


export const LoginApi = {
    adminLogin: async (email: string, password: string) => {
        const response = await api.post(ADMINRoutes.LOGIN, {
            email: email,
            password: password
        })
        return response
    },
    logout: async () => {
        const response = await api.post(ADMINRoutes.LOGOUT, {}, { withCredentials: true });
        return response.data;
    }
}