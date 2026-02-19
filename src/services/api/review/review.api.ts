import { api } from "../../../utils/axios";

export interface Review {
    _id: string;
    vehicleId: string;
    userId: {
        _id: string;
        name: string;
        email: string;
    };
    bookingId: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export interface CreateReviewPayload {
    vehicleId: string;
    bookingId: string;
    rating: number;
    comment: string;
}

export const ReviewApi = {
    createReview: async (payload: CreateReviewPayload): Promise<{ success: boolean; data: Review }> => {
        const response = await api.post<{ success: boolean; data: Review }>('/reviews', payload, {
            withCredentials: true
        });
        return response.data;
    },

    getVehicleReviews: async (vehicleId: string): Promise<{ success: boolean; data: Review[] }> => {
        const response = await api.get<{ success: boolean; data: Review[] }>(`/reviews/vehicle/${vehicleId}`);
        return response.data;
    },

    checkEligibility: async (vehicleId: string): Promise<{ success: boolean; data: { canReview: boolean; bookingId?: string } }> => {
        const response = await api.get<{ success: boolean; data: { canReview: boolean; bookingId?: string } }>(`/reviews/eligibility/${vehicleId}`, {
            withCredentials: true
        });
        return response.data;
    }
};
