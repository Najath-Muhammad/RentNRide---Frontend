
export const APIAuthRoutes = {
    LOGIN:"/auth/login",
    SIGNUP:"/auth/signup",
    VERIFY_OTP:"/auth/verify-otp",
    RESEND_OTP:"/auth/resend-otp",
    GOOGLE:"/auth/google",
    LOGOUT:'/auth/logout',
    ME:'/auth/me',
    FORGOT_PASSWORD:"/auth/forgot-password",
    RESET_PASSWORD:"/auth/reset-password",
} as const

export const ADMINRoutes = {
    LOGIN:'/admin/login/',
    LOGOUT:'/admin/logout',
    USER:{
        GET_USERS:"/admin/users",
    }
}
