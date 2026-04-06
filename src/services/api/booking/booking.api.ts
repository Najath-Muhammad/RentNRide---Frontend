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

export interface Booking {
    _id: string;
    bookingId: string;
    vehicleId: {
        _id: string;
        brand: string;
        modelName: string;
        vehicleImages: string[];
        images?: string[];
    };
    ownerId: {
        name: string;
        email: string;
    };
    startDate: string;
    endDate: string;
    withFuel?: boolean;
    totalAmount: number;
    bookingStatus: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled' | 'rejected';
    paymentStatus: string;
    cancelledBy?: 'user' | 'owner' | 'system';
    cancellationReason?: string;
}

export interface PaginatedBookings {
    data: Booking[];
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
}

export interface BookingResponse {
    success: boolean;
    message: string;
    data?: Booking | Booking[] | PaginatedBookings;
}

export const BookingApi = {
    createBooking: async (payload: BookingPayload): Promise<BookingResponse> => {
        const response = await api.post<BookingResponse>('/bookings', payload, {
            withCredentials: true
        });
        return response.data;
    },

    getMyBookings: async (): Promise<{ success: boolean; data: Booking[] }> => {
        const response = await api.get<{ success: boolean; data: PaginatedBookings | Booking[] }>('/bookings/user', {
            withCredentials: true
        });

        // Handle paginated response structure from backend
        let bookings: Booking[] = [];
        const responseData = response.data.data;

        if (responseData) {
            if (Array.isArray(responseData)) {
                bookings = responseData;
            } else if ('data' in responseData && Array.isArray(responseData.data)) {
                bookings = responseData.data;
            }
        }

        return {
            success: response.data.success,
            data: bookings
        };
    },

    getBookingDetails: async (id: string): Promise<{ success: boolean; data: Booking }> => {
        const response = await api.get<{ success: boolean; data: Booking }>(`/booking/${id}`, {
            withCredentials: true
        });
        return response.data;
    },

    cancelBooking: async (bookingId: string, reason?: string): Promise<{ success: boolean; data: Booking }> => {
        const response = await api.patch<{ success: boolean; data: Booking }>(`/bookings/${bookingId}/cancel`, { reason }, {
            withCredentials: true
        });
        return response.data;
    }
};