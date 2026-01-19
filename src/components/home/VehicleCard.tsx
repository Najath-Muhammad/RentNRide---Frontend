// src/components/vehicles/VehicleCard.tsx
import React from 'react';
import { Link } from '@tanstack/react-router'; // ← Correct import

interface Vehicle {
  _id: string;
  brand: string;
  modelName: string;
  pricePerDay: number;
  vehicleImages: string[];
  category?: string;
}

interface VehicleCardProps {
  vehicle: Vehicle;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle }) => {
  return (
    <Link
      to="/vehicles/$id"
      params={{ id: vehicle._id }}
      className="block group"
    >
      <div className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-lg transition-all border border-gray-100 h-full flex flex-col">
        <div className="relative overflow-hidden aspect-[4/3]">
          <img
            src={vehicle.vehicleImages[0] || '/placeholder.jpg'}
            alt={`${vehicle.brand} ${vehicle.modelName}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
        <div className="p-5 flex flex-col flex-grow">
          <div className="mb-4">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">{vehicle.category || 'Standard'}</p>
            <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">{vehicle.brand} {vehicle.modelName}</h3>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Daily Rate</p>
              <p className="text-gray-900 font-bold text-lg">
                ₹{vehicle.pricePerDay.toLocaleString('en-IN')}
              </p>
            </div>
            <span className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VehicleCard;