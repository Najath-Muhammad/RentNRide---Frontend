import React, { useState, useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { UserVehicleApi, type Vehicle } from '../../services/api/user/vehicle.api';
import ImageCarousel from '../../components/vehicles/ImageCarousel';
import BookingSidebar from '../../components/vehicles/BookingSidebar';
import SpecsTable from '../../components/vehicles/SpecsTable';
import LegalSafety from '../../components/vehicles/LegalSafety';
import LocationMap from '../../components/vehicles/LocationMap';
import CustomerReviews from '../../components/vehicles/CustomerReviews';

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
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                {vehicle.brand} {vehicle.modelName}
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                {vehicle.category} • {vehicle.fuelType}
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
            <LocationMap address={vehicle.pickupAddress} />
            <CustomerReviews />
          </div>
          <div className="lg:col-span-1">
            <BookingSidebar 
              pricePerDay={vehicle.pricePerDay}
              vehicleId={vehicle._id || id}
              ownerId={vehicle.ownerId || vehicle.ownerId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;