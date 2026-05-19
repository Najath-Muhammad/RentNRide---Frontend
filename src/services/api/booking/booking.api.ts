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
        _id?: string;
        name: string;
        email: string;
    };
    userId?: {
        _id?: string;
        name: string;
        email: string;
    };
    startDate: string;
    endDate: string;
    withFuel?: boolean;
    totalAmount: number;
    pricePerDay?: number;
    advancePaid?: number;
    bookingStatus:
        | 'pending' | 'confirmed' | 'ongoing' | 'completed'
        | 'cancelled' | 'cancel_requested' | 'rejected' | 'no_show'
        | 'requested' | 'approved' | 'advance_authorized' | 'ride_started'
        | 'payment_captured' | 'overdue' | 'extended';
    paymentStatus: string;
    cancelledBy?: 'user' | 'owner' | 'system' | 'admin';
    cancellationReason?: string;
    cancelledAt?: string;
    refundAmount?: number;
    refundStatus?: 'pending' | 'processed' | 'failed';
    cancellationCharge?: number;
    // Return tracking
    expectedReturnDate?: string;
    actualReturnDate?: string;
    returnStatus?: 'pending' | 'returned' | 'overdue' | 'extended';
    // Extension
    extensionRequested?: boolean;
    extensionApproved?: boolean;
    extensionRejected?: boolean;
    extensionReason?: string;
    extendedTill?: string;
    extensionRequestedAt?: string;
    // Late fees
    extraHours?: number;
    extraDays?: number;
    lateFee?: number;
    overtimeCharge?: number;
    pendingDues?: number;
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

    getOwnerBookings: async (): Promise<{ success: boolean; data: Booking[] }> => {
        const response = await api.get<{ success: boolean; data: PaginatedBookings | Booking[] }>('/bookings/owner', {
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
    },

    returnVehicle: async (bookingId: string): Promise<{ success: boolean; data: Booking }> => {
        const response = await api.patch<{ success: boolean; data: Booking }>(`/bookings/${bookingId}/return`, {}, {
            withCredentials: true
        });
        return response.data;
    },

    requestExtension: async (bookingId: string, newReturnDate: string, reason?: string): Promise<{ success: boolean; data: Booking }> => {
        const response = await api.patch<{ success: boolean; data: Booking }>(`/bookings/${bookingId}/request-extension`, { newReturnDate, reason }, {
            withCredentials: true
        });
        return response.data;
    },

    approveExtension: async (bookingId: string, approved: boolean): Promise<{ success: boolean; data: Booking }> => {
        const response = await api.patch<{ success: boolean; data: Booking }>(`/bookings/${bookingId}/approve-extension`, { approved }, {
            withCredentials: true
        });
        return response.data;
    },

    getOverdueBookings: async (): Promise<{ success: boolean; data: Booking[] }> => {
        const response = await api.get<{ success: boolean; data: Booking[] }>('/bookings/owner/overdue', { withCredentials: true });
        return response.data;
    },

    getPendingExtensions: async (): Promise<{ success: boolean; data: Booking[] }> => {
        const response = await api.get<{ success: boolean; data: Booking[] }>('/bookings/owner/pending-extensions', { withCredentials: true });
        return response.data;
    },

    getRunningOvertimeFee: async (bookingId: string): Promise<{ success: boolean; data: { extraHours: number; extraDays: number; lateFee: number; isOverGrace: boolean } }> => {
        const response = await api.get(`/bookings/${bookingId}/overtime-fee`, { withCredentials: true });
        return response.data;
    },
};