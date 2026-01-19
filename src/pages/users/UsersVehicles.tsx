// src/pages/MyVehicles.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Car, Plus, Edit, Trash2, MapPin, Fuel, Users, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { UserVehicleApi } from '../../services/api/user/vehicle.api';
import Navbar from '../../components/user/Navbar';

interface Vehicle {
  _id: string;
  brand: string;
  modelName: string;
  category: string;
  fuelType: string;
  seatingCapacity: number;
  pricePerDay: number;
  pickupAddress: string;
  vehicleImages: string[];
  isApproved: boolean;
  isRejected?: boolean;
  rejectionReason?: string;
  isActive: boolean;
  createdAt: string;
}

const MyVehicles: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMyVehicles();
  }, []);

  const fetchMyVehicles = async () => {
    try {
      setLoading(true);
      const response = await UserVehicleApi.getMyVehicles();
      console.log('My vehicles response:', response);
      setVehicles(response.vehicles || []);
    } catch (error: unknown) {
      console.error('Failed to fetch vehicles:', error);
      // Optional: show toast notification
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this vehicle?')) return;

    try {
      setDeletingId(id);
      await UserVehicleApi.deleteVehicle(id);
      setVehicles(vehicles.filter(v => v._id !== id));
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete vehicle. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      setTogglingId(id);
      await UserVehicleApi.toggleActive(id, !currentActive);
      setVehicles(vehicles.map(v =>
        v._id === id ? { ...v, isActive: !currentActive } : v
      ));
    } catch (error) {
      console.error('Toggle failed:', error);
      alert('Failed to update listing status');
    } finally {
      setTogglingId(null);
    }
  };

  const getStatusConfig = (vehicle: Vehicle) => {
    if (vehicle.isRejected) {
      return {
        label: 'Rejected',
        color: 'bg-red-100 text-red-800',
        icon: AlertCircle,
      };
    }
    if (!vehicle.isApproved) {
      return {
        label: 'Pending Approval',
        color: 'bg-orange-100 text-orange-800',
        icon: null,
      };
    }
    if (!vehicle.isActive) {
      return {
        label: 'Hidden',
        color: 'bg-gray-100 text-gray-800',
        icon: EyeOff,
      };
    }
    return {
      label: 'Listed',
      color: 'bg-green-100 text-green-800',
      icon: Eye,
    };
  };

  const stats = {
    total: vehicles.length,
    listed: vehicles.filter(v => v.isApproved && v.isActive).length,
    pending: vehicles.filter(v => !v.isApproved && !v.isRejected).length,
    rejected: vehicles.filter(v => v.isRejected).length,
    hidden: vehicles.filter(v => v.isApproved && !v.isActive).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar /> {/* Ensure Navbar is present if not already in layout wrap */}

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">My Vehicles</h1>
            <p className="text-gray-500 mt-2 font-medium">Manage and track your rental fleet performance</p>
          </div>
          <button
            onClick={() => navigate({ to: '/vehicles/vehicle_listing' })}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add New Vehicle
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          <div className="bg-white rounded-2xl shadow-card p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Total</p>
              <Car className="w-5 h-5 text-blue-100" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Listed</p>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.listed}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Pending</p>
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Hidden</p>
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.hidden}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Rejected</p>
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.rejected}</p>
          </div>
        </div>

        {/* Vehicle Grid */}
        {vehicles.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-card p-16 text-center border border-gray-100 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Car className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No vehicles listed yet</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Start earning by adding your first vehicle to the rental fleet. It only takes a few minutes.
            </p>
            <button
              onClick={() => navigate({ to: '/vehicles/vehicle_listing' })}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-full font-bold transition-all shadow-lg shadow-blue-600/20 hover:-translate-y-1"
            >
              <Plus className="w-5 h-5" />
              list Your First Vehicle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vehicles.map((vehicle) => {
              const status = getStatusConfig(vehicle);

              return (
                <div key={vehicle._id} className="bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 group flex flex-col h-full">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    <img
                      src={vehicle.vehicleImages[0] || '/placeholder-car.jpg'}
                      alt={`${vehicle.brand} ${vehicle.modelName}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.color} shadow-sm backdrop-blur-md bg-opacity-90`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <div className="mb-4">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1 opacity-80">{vehicle.category}</p>
                      <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                        {vehicle.brand} {vehicle.modelName}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mt-3 mb-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[150px]">{vehicle.pickupAddress}</span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Fuel className="w-3.5 h-3.5" />
                          <span>{vehicle.fuelType}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>{vehicle.seatingCapacity} seats</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto space-y-4">
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <span className="text-gray-500 text-xs font-bold uppercase">Daily Rate</span>
                        <span className="text-xl font-bold text-gray-900">₹{vehicle.pricePerDay.toLocaleString('en-IN')}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => navigate({ to: `/vehicles/edit/${vehicle._id}` })}
                          className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2.5 rounded-lg text-sm font-bold transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>

                        {vehicle.isApproved && !vehicle.isRejected && (
                          <button
                            onClick={() => handleToggleActive(vehicle._id, vehicle.isActive)}
                            disabled={togglingId === vehicle._id}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors ${vehicle.isActive
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                              }`}
                          >
                            {togglingId === vehicle._id ? <Loader2 className="w-4 h-4 animate-spin" /> : (vehicle.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />)}
                            {vehicle.isActive ? 'Hide' : 'Show'}
                          </button>
                        )}

                        {(vehicle.isRejected || !vehicle.isApproved) && (
                          <button
                            onClick={() => handleDelete(vehicle._id)}
                            disabled={deletingId === vehicle._id}
                            className="flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 py-2.5 rounded-lg text-sm font-bold transition-colors col-span-1"
                          >
                            {deletingId === vehicle._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Delete
                          </button>
                        )}
                      </div>

                      {vehicle.isApproved && !vehicle.isRejected && (
                        <button
                          onClick={() => handleDelete(vehicle._id)}
                          disabled={deletingId === vehicle._id}
                          className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-600 py-1 text-xs font-medium transition-colors"
                        >
                          Delete Listing
                        </button>
                      )}
                    </div>

                    {/* Show rejection reason if rejected */}
                    {vehicle.isRejected && vehicle.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50/50 border border-red-100 rounded-lg">
                        <p className="text-xs font-bold text-red-700 mb-0.5">Rejected:</p>
                        <p className="text-xs text-red-600 leading-relaxed">{vehicle.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyVehicles;