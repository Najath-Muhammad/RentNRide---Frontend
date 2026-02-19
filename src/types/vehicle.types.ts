export interface Vehicle {
    ownerId: string;
    _id: string;
    brand: string;
    modelName: string;
    category: string | { name: string; _id: string };
    fuelType: string | { name: string; _id: string };
    seatingCapacity: number;
    pricePerDay: number;
    pickupAddress: string;
    vehicleImages: string[];
    isApproved: boolean;
    isRejected?: boolean;
    rejectionReason?: string;
    isActive: boolean;
    createdAt: string;
    doors?: number;
    regionalContact: string;
    rcNumber: string;
    rcExpiryDate: string;
    rcImage: string;
    insuranceProvider: string;
    insurancePolicyNumber: string;
    insuranceExpiryDate: string;
    insuranceImage: string;
    category2?: string;
    location?: {
        type: string;
        coordinates: number[];
    };
}

export interface PaginatedVehiclesResponse {
    success: boolean;
    data: {
        data: Vehicle[];
        total: number;
        page: number;
        totalPages: number;
    };
}

export interface SearchFilters {
    search: string;
    vehicleType: string[];
    fuelType: string[];
    transmission: string[];
    priceRange: { min: string; max: string };
    sortBy: string;
}

export type GridFilters = Partial<SearchFilters>;
