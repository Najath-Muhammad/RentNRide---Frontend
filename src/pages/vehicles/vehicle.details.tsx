import React, { useState, useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { UserVehicleApi } from '../../services/api/user/vehicle.api';
import type { Vehicle } from '../../types/vehicle.types';
import ImageCarousel from '../../components/vehicles/ImageCarousel';
import BookingSidebar from '../../components/vehicles/BookingSidebar';
import SpecsTable from '../../components/vehicles/SpecsTable';
import LegalSafety from '../../components/vehicles/LegalSafety';
import LocationMap from '../../components/vehicles/LocationMap';
import CustomerReviews from '../../components/vehicles/CustomerReviews';

import Navbar from '../../components/user/Navbar';

const VehicleDetails: React.FC = () => {
  const { id } = useParams({ from: '/vehicles/$id' });
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await UserVehicleApi.getVehicleById(id);
        setVehicle(res.data);
      } catch (err) {
        console.error('Error fetching vehicle:', err);
        setVehicle(null);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [id]);

  if (loading) {
    return <div className="text-center py-20 text-xl">Loading vehicle details...</div>;
  }

  if (!vehicle) {
    return <div className="text-center py-20 text-red-600 text-xl">Vehicle not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar /> {}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {}
          <div className="lg:col-span-3 space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                {vehicle.brand} {vehicle.modelName}
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                {(typeof vehicle.category === 'object' && vehicle.category) ? (vehicle.category as { name: string }).name : vehicle.category} • {(typeof vehicle.fuelType === 'object' && vehicle.fuelType) ? (vehicle.fuelType as { name: string }).name : vehicle.fuelType}
              </p>
            </div>

            <ImageCarousel
              images={vehicle.vehicleImages}
              brand={vehicle.brand}
              model={vehicle.modelName}
            />

            <div className="bg-white rounded-lg p-8 shadow">
              <h2 className="text-2xl font-bold mb-6">Vehicle Information</h2>
              <SpecsTable vehicle={vehicle} />
            </div>

            <LegalSafety vehicle={vehicle} />
            <LocationMap address={vehicle.pickupAddress} location={vehicle.location} />
            <CustomerReviews vehicleId={vehicle._id} />
          </div>
          <div className="lg:col-span-1">
            <BookingSidebar
              pricePerDay={vehicle.pricePerDay}
              vehicleId={typeof vehicle._id === 'object' ? (vehicle._id as { _id?: string })?._id : (vehicle._id || id)}
              ownerId={typeof vehicle.ownerId === 'object' ? (vehicle.ownerId as { _id?: string })?._id : vehicle.ownerId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;