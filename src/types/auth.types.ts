export interface SignupRequest {
    name: string;
    email: string;
    password: string;
}

export interface SignupFormState extends SignupRequest {
    confirmPassword: string;
}

export interface LoginFormData {
    email: string;
    password: string;
}

export type User = {
    id: string;
    email: string;
    name?: string;
    role?: string;
};

export type AuthState = {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    location: string;
    coordinates?: { lat: number; lon: number };
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setLocation: (location: string) => void;
    setCoordinates: (coords: { lat: number; lon: number } | undefined) => void;
    logout?: () => void;
};

export interface FormErrors {
    email: string;
    password: string;
    general: string;
}
