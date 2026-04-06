import { api } from "../../../utils/axios";

export interface Booking {
    _id: string;
    bookingId: string;
    vehicleId: {
        _id: string;
        brand: string;
        modelName: string;
        vehicleImages: string[];
    };
    userId: {
        _id: string;
        name: string;
        email: string;
    };
    ownerId: {
        _id: string;
        name: string;
        email: string;
    };
    startDate: string;
    endDate: string;
    withFuel?: boolean;
    totalAmount: number;
    bookingStatus: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
    updatedAt: string;
}

export interface GetBookingsParams {
    page: number;
    limit: number;
    status?: string;
    search?: string;
}

export interface PaginatedBookingsResponse {
    data: Booking[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const BookingManagementApi = {
    getAllBookings: async (params: GetBookingsParams): Promise<PaginatedBookingsResponse> => {
        const response = await api.get<{ success: boolean; data: PaginatedBookingsResponse }>('/admin/bookings', {
            params,
            withCredentials: true
        });
        return response.data.data;
    },

    cancelBooking: async (bookingId: string, reason: string) => {
        const response = await api.patch<{ success: boolean; data: Booking }>(`/admin/bookings/${bookingId}/cancel`, {
            reason
        }, {
            withCredentials: true
        });
        return response.data;
    }
};
