import axios from "axios";
import { APIAuthRoutes } from "../../constants/route.constant";

export const AuthServices = async (formData: any) => {
    const { data } = await axios.post(APIAuthRoutes.SIGNUP, {
        name: formData.name,
        email: formData.email,
        password: formData.password
    })

    return data
}