import React, { useState, useEffect } from 'react';
import VehicleCard from './VehicleCard';
import { UserVehicleApi } from '../../services/api/user/vehicle.api';
import type { Vehicle, GridFilters } from '../../types/vehicle.types';
import { useAuthStore } from '../../stores/authStore';

const VehicleGrid: React.FC<{
  title?: string;
  initialRange?: number;
  minRange?: number;
  limit?: number;
  showRangeSelector?: boolean;
  showEmptyState?: boolean;
  filters?: GridFilters;
  range?: number;
  userLocation?: { lat: number; lon: number };
}> = ({
  title,
  initialRange = 10,
  minRange,
  limit = 8,
  showRangeSelector = true,
  showEmptyState = false,
  filters: externalFilters,
  range: externalRange,
  userLocation: externalLocation
}) => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [internalRange, setInternalRange] = useState(initialRange);
    const { coordinates: storeCoordinates } = useAuthStore();

    const activeRange = externalRange !== undefined ? externalRange : internalRange;
    const activeCoordinates = externalLocation || storeCoordinates;

    useEffect(() => {
      const fetchVehicles = async () => {
        setLoading(true);
        try {
          const res = await UserVehicleApi.getVehicles({
            lat: activeCoordinates?.lat,
            lon: activeCoordinates?.lon,
            range: activeRange,
            minRange: minRange,
            limit: limit,
            search: externalFilters?.search,
            category: externalFilters?.vehicleType,
            fuelType: externalFilters?.fuelType,
            transmission: externalFilters?.transmission,
            minPrice: externalFilters?.priceRange?.min ? parseInt(externalFilters.priceRange.min) : undefined,
            maxPrice: externalFilters?.priceRange?.max ? parseInt(externalFilters.priceRange.max) : undefined,
            sortBy: externalFilters?.sortBy
          });

          const vehicleArray = res.data?.data || [];
          setVehicles(vehicleArray);
        } catch (err) {
          console.error('Error fetching vehicles:', err);
          setVehicles([]);
        } finally {
          setLoading(false);
        }
      };

      fetchVehicles();
    }, [activeCoordinates, activeRange, externalFilters, limit, minRange]);

    if (loading) {
      return (
        <div className="flex justify-center items-center py-24 bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (vehicles.length === 0) {
      if (!showRangeSelector && !showEmptyState) return null;

      return (
        <section className="py-16 bg-transparent">
          <div className="container mx-auto px-4 text-center">
            {title && <h2 className="text-3xl font-bold mb-8 text-gray-900 text-left">{title}</h2>}
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 max-w-lg mx-auto mt-8">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Vehicles Found</h3>
              <p className="text-gray-500 font-medium">There are no vehicles available matching your current filters or within your selected {activeRange}km distance range.</p>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section id="explore" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">{title}</h2>
              {activeCoordinates && (
                <p className="text-sm text-gray-500 mt-2 font-medium">
                  Showing results within <span className="text-blue-600 font-bold">{activeRange}km</span>
                </p>
              )}
            </div>

            {showRangeSelector && (
              <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                {[10, 20, 50].map((r) => (
                  <button
                    key={r}
                    onClick={() => setInternalRange(r)}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeRange === r
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                      }`}
                  >
                    {r}km
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {vehicles.slice(0, limit).map((vehicle) => (
              <VehicleCard key={vehicle._id} vehicle={vehicle} />
            ))}
          </div>

          <div className="flex justify-center mt-12 space-x-2">
            {[1, 2, 3, 4, 5].map((page) => (
              <button
                key={page}
                className={`h-2 rounded-full transition-all duration-300 ${page === 1 ? 'bg-blue-600 w-8' : 'bg-gray-300 w-2 hover:bg-blue-300'
                  }`}
                aria-label={`Page ${page}`}
              />
            ))}
          </div>
        </div>
      </section>
    );
  };

export default VehicleGrid;