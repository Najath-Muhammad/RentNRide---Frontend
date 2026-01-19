import { api } from "../../../utils/axios";

export interface Vehicle {
  _id: string;
  ownerId: { _id: string; name: string };
  brand: string;
  modelName: string;
  category: string;
  category2?: string;
  fuelType: string;
  seatingCapacity: number;
  doors?: number;
  pricePerDay: number;
  pickupAddress: string;
  regionalContact: string;
  vehicleImages: string[];
  rcNumber: string;
  rcExpiryDate: string;
  rcImage: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceExpiryDate: string;
  insuranceImage: string;
  isApproved: boolean;
  isRejected?: boolean;
  rejectionReason?: string;
  isActive: boolean;
  createdAt: string;
}

export const VehicleApi = {
  getVehicleById: async (vehicleId: string): Promise<Vehicle> => {
    const response = await api.get<Vehicle>(`/admin/vehicles/${vehicleId}`);
    return response.data;
  },
  approveVehicle: async (vehicleId: string): Promise<void> => {
    await api.patch(`/admin/vehicles/${vehicleId}/approve`);
  },
  blockVehicle: async (vehicleId: string): Promise<void> => {
    await api.patch(`/admin/vehicles/${vehicleId}/block`);
  },
  unblockVehicle: async (vehicleId: string): Promise<void> => {
    await api.patch(`/admin/vehicles/${vehicleId}/unblock`);
  },
};