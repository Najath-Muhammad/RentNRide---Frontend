import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { VehicleApi, type Vehicle } from '../../services/api/admin/vehicle.details.api';

const VehicleDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { email } = (location.state || {}) as { email?: string };
  const vehicleId = email;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchVehicle = useCallback(async () => {
    if (!vehicleId) {
      setError('No vehicle ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await VehicleApi.getVehicleById(vehicleId);
      setVehicle(data);
    } catch (err: unknown) {
      console.error('Error fetching vehicle:', err);
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'Failed to load vehicle details');
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  // Action handlers
  const handleApprove = async () => {
    if (!vehicleId) return;
    try {
      await VehicleApi.approveVehicle(vehicleId);
      await fetchVehicle(); // refresh
    } catch (err) {
      console.error('Error approving vehicle:', err);
      alert('Failed to approve vehicle');
    }
  };

  const handleBlock = async () => {
    if (!vehicleId) return;
    try {
      await VehicleApi.blockVehicle(vehicleId);
      await fetchVehicle();
    } catch (err) {
      console.error('Error blocking vehicle:', err);
      alert('Failed to block vehicle');
    }
  };

  const handleUnblock = async () => {
    if (!vehicleId) return;
    try {
      await VehicleApi.unblockVehicle(vehicleId);
      await fetchVehicle();
    } catch (err) {
      console.error('Error unblocking vehicle:', err);
      alert('Failed to unblock vehicle');
    }
  };

  // Image carousel helpers
  const nextImage = () => {
    if (!vehicle?.vehicleImages?.length) return;
    setCurrentImageIndex((prev) =>
      prev === vehicle.vehicleImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (!vehicle?.vehicleImages?.length) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? vehicle.vehicleImages.length - 1 : prev - 1
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center ml-64">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-gray-300 border-t-emerald-600 rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Loading vehicle details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error / Not found
  if (error || !vehicle) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center ml-64">
          <div className="text-center">
            <p className="text-xl text-red-600">{error || 'Vehicle not found'}</p>
            <button
              onClick={() => navigate({ to: '/admin/vehicle-management' })}
              className="mt-6 px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Back to Vehicles
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 ml-64 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm mb-6 sticky top-0 z-10">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Vehicle Details</h2>
              <button
                onClick={() => navigate({ to: '/admin/vehicle-management' })}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Rejection reason alert */}
          {vehicle.isRejected && vehicle.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Vehicle Rejected</h3>
              <p className="text-red-700">{vehicle.rejectionReason}</p>
            </div>
          )}

          {/* Main content */}
          <div className="space-y-6">
            {/* Image Gallery */}
            <section className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="relative">
                <img
                  src={vehicle.vehicleImages[currentImageIndex]}
                  alt={`${vehicle.brand} ${vehicle.modelName}`}
                  className="w-full h-80 sm:h-[28rem] object-cover"
                />

                {vehicle.vehicleImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 bg-black/40 px-4 py-2 rounded-full">
                      {vehicle.vehicleImages.map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/60'
                            }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {vehicle.vehicleImages.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 p-4 bg-gray-50">
                  {vehicle.vehicleImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Vehicle image ${idx + 1}`}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-full aspect-video object-cover rounded cursor-pointer transition-all border-2 ${idx === currentImageIndex
                        ? 'border-emerald-500 opacity-100'
                        : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Basic Information */}
            <section className="bg-white rounded-xl shadow-sm p-6 md:p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <InfoItem label="Vehicle ID" value={vehicle._id} />
                <InfoItem label="Brand" value={vehicle.brand} />
                <InfoItem label="Model" value={vehicle.modelName} />
                <InfoItem label="Category" value={vehicle.category} />
                {vehicle.category2 && <InfoItem label="Sub Category" value={vehicle.category2} />}
                <InfoItem label="Fuel Type" value={vehicle.fuelType} />
                <InfoItem label="Seating" value={`${vehicle.seatingCapacity} seats`} />
                {vehicle.doors && <InfoItem label="Doors" value={vehicle.doors.toString()} />}
                <div className="col-span-full">
                  <p className="text-sm text-gray-500 mb-1">Price Per Day</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    ₹{vehicle.pricePerDay.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </section>

            {/* Action Buttons - Sticky bottom */}
            <div className="bg-white rounded-xl shadow-sm p-6 sticky bottom-0 border-t z-10">
              <div className="flex flex-wrap gap-4 justify-end">
                <button
                  onClick={() => navigate({ to: '/admin/vehicle-management' })}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Close
                </button>

                {!vehicle.isApproved && !vehicle.isRejected && (
                  <button
                    onClick={handleApprove}
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                  >
                    Approve Vehicle
                  </button>
                )}

                {!vehicle.isRejected && (
                  vehicle.isActive ? (
                    <button
                      onClick={handleBlock}
                      className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                    >
                      Block Vehicle
                    </button>
                  ) : (
                    <button
                      onClick={handleUnblock}
                      className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                    >
                      Unblock Vehicle
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Small helper component for cleaner markup
const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-gray-900 font-medium">{value}</p>
  </div>
);

export default VehicleDetailsPage;