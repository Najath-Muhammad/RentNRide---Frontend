import { api } from "../../../utils/axios";

export interface BookingPayload {
    vehicleId: string;
    ownerId: string;
    startDate: string;
    endDate: string;
    withFuel: boolean;
    pricePerDay: number;
    totalAmount: number;
}

export interface BookingResponse {
    success: boolean;
    message: string;
    data?: any;
}

export const BookingApi = {
    createBooking: async (payload: BookingPayload): Promise<BookingResponse> => {
        const response = await api.post<BookingResponse>('/bookings', payload, {
            withCredentials: true
        });
        return response.data;
    },

    getMyBookings: async (): Promise<{ success: boolean; data: any[] }> => {
        const response = await api.get<{ success: boolean; data: any[] }>('/booking/my-bookings', {
            withCredentials: true
        });
        return response.data;
    },

    getBookingDetails: async (id: string): Promise<{ success: boolean; data: any }> => {
        const response = await api.get<{ success: boolean; data: any }>(`/booking/${id}`, {
            withCredentials: true
        });
        return response.data;
    }
};