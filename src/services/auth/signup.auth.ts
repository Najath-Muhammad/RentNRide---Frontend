import axios from "axios";
import type { SignupRequest } from "../../types/auth.types";
import { APIAuthRoutes } from "../../constants/route.constant";

export const AuthServices = async (formData: SignupRequest) => {
    const { data } = await axios.post(APIAuthRoutes.SIGNUP, {
        name: formData.name,
        email: formData.email,
        password: formData.password
    })

    return data
}