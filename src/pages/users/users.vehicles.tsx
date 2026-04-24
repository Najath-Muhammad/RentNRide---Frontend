// src/pages/MyVehicles.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Car, Plus, Edit, Trash2, MapPin, Fuel, Users, Eye, EyeOff, Loader2, AlertCircle, ShieldAlert, FileWarning } from 'lucide-react';
import { UserVehicleApi } from '../../services/api/user/vehicle.api';
import type { Vehicle } from '../../types/vehicle.types';
import { useAuthStore } from '../../stores/authStore';
import Navbar from '../../components/user/Navbar';

const MyVehicles: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal state
  const [modal, setModal] = useState<{ show: boolean; type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }>({
    show: false,
    type: 'info',
    title: '',
    message: ''
  });

  const showModal = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setModal({ show: true, type, title, message });
  };

  const closeModal = () => {
    setModal({ ...modal, show: false });
  };


  useEffect(() => {
    fetchMyVehicles();
  }, []);

  const fetchMyVehicles = async () => {
    try {
      setLoading(true);
      const response = await UserVehicleApi.getMyVehicles();
      console.log('My vehicles response:', response);
      setVehicles(response.data.vehicles || []);
    } catch (error: unknown) {
      console.error('Failed to fetch vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

  const initiateDelete = (id: string) => {
    setVehicleToDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (!vehicleToDelete) return;
    const id = vehicleToDelete;

    try {
      setDeletingId(id);
      await UserVehicleApi.deleteVehicle(id);
      setVehicles(vehicles.filter(v => v._id !== id));
    } catch (error) {
      console.error('Delete failed:', error);
      showModal('error', 'Delete Failed', 'Failed to delete vehicle. Please try again.');
    } finally {
      setDeletingId(null);
      setVehicleToDelete(null);
    }
  };

  // ── Document expiry helpers ───────────────────────────────────────────
  const isDocumentExpired = (dateStr: string | undefined): boolean => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const getExpiredDocs = (vehicle: Vehicle): string[] => {
    const expired: string[] = [];
    if (isDocumentExpired(vehicle.rcExpiryDate)) expired.push('RC');
    if (isDocumentExpired(vehicle.insuranceExpiryDate)) expired.push('Insurance');
    return expired;
  };

  const getStatusConfig = (vehicle: Vehicle) => {
    const expiredDocs = getExpiredDocs(vehicle);

    if (expiredDocs.length > 0 && vehicle.isApproved && !vehicle.isRejected) {
      return {
        label: 'Expired Docs',
        color: 'bg-amber-100 text-amber-800',
        icon: ShieldAlert,
        expiredDocs,
      };
    }
    if (vehicle.isRejected) {
      return {
        label: 'Rejected',
        color: 'bg-red-100 text-red-800',
        icon: AlertCircle,
        expiredDocs: [],
      };
    }
    if (!vehicle.isApproved) {
      return {
        label: 'Pending Approval',
        color: 'bg-orange-100 text-orange-800',
        icon: null,
        expiredDocs: [],
      };
    }
    if (!vehicle.isActive) {
      return {
        label: 'Hidden',
        color: 'bg-gray-100 text-gray-800',
        icon: EyeOff,
        expiredDocs: [],
      };
    }
    return {
      label: 'Listed',
      color: 'bg-green-100 text-green-800',
      icon: Eye,
      expiredDocs: [],
    };
  };

  const stats = {
    total: vehicles.length,
    listed: vehicles.filter(v => v.isApproved && v.isActive && getExpiredDocs(v).length === 0).length,
    pending: vehicles.filter(v => !v.isApproved && !v.isRejected).length,
    rejected: vehicles.filter(v => v.isRejected).length,
    hidden: vehicles.filter(v => v.isApproved && !v.isActive && getExpiredDocs(v).length === 0).length,
    expiredDocs: vehicles.filter(v => v.isApproved && !v.isRejected && getExpiredDocs(v).length > 0).length,
  };

  const { user } = useAuthStore();

  const handleAddNewVehicle = () => {
    if (user?.role === 'user' && vehicles.length >= 5) {
      showModal('warning', 'Vehicle Limit Reached', 'Standard users can only list up to 5 vehicles. Please upgrade to Premium to add more.');
      return;
    }
    navigate({ to: '/vehicles/vehicle_listing' });
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

      {/* Expired documents site-wide banner */}
      {stats.expiredDocs > 0 && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-amber-800">
              {stats.expiredDocs} of your vehicle{stats.expiredDocs > 1 ? 's have' : ' has'} expired RC or Insurance documents.
              {' '}These vehicles are still visible to you but <span className="font-bold underline">are not shown to renters</span> until updated.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">My Vehicles</h1>
            <p className="text-gray-500 mt-2 font-medium">Manage and track your rental fleet performance</p>
          </div>
          <button
            onClick={handleAddNewVehicle}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add New Vehicle
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-10">
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
          {stats.expiredDocs > 0 && (
            <div className="bg-amber-50 rounded-2xl shadow-card p-5 border border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-amber-700 text-xs font-bold uppercase tracking-wide">Expired</p>
                <FileWarning className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-bold text-amber-700">{stats.expiredDocs}</p>
            </div>
          )}
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
              const hasExpiredDocs = status.expiredDocs.length > 0;

              return (
                <div
                  key={vehicle._id}
                  className={`bg-white rounded-2xl shadow-card overflow-hidden border transition-all duration-300 group flex flex-col h-full ${hasExpiredDocs
                    ? 'border-amber-300 ring-1 ring-amber-200'
                    : 'border-gray-100 hover:shadow-lg'
                    }`}
                >
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
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1 opacity-80">
                        {typeof vehicle.category === 'object' && vehicle.category ? vehicle.category.name : vehicle.category}
                      </p>
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
                          <span>{typeof vehicle.fuelType === 'object' && vehicle.fuelType ? vehicle.fuelType.name : vehicle.fuelType}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>{vehicle.seatingCapacity} seats</span>
                        </div>
                      </div>
                    </div >

                    <div className="mt-auto space-y-4">
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <span className="text-gray-500 text-xs font-bold uppercase">Daily Rate</span>
                        <span className="text-xl font-bold text-gray-900">₹{vehicle.pricePerDay.toLocaleString('en-IN')}</span>
                      </div>

                      {/* Expired document warning */}
                      {hasExpiredDocs && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-amber-800 mb-0.5">Document(s) Expired</p>
                            <p className="text-xs text-amber-700">
                              {status.expiredDocs.join(' & ')} {status.expiredDocs.length === 1 ? 'certificate has' : 'certificates have'} expired.
                              Update via Edit to relist this vehicle.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className={`grid gap-2 ${vehicle.isApproved && !vehicle.isRejected ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        <button
                          onClick={() => navigate({ to: `/vehicles/edit/${vehicle._id}` })}
                          className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2.5 rounded-lg text-sm font-bold transition-colors"
                        >
                          {vehicle.isRejected ? (
                            <>
                              <Plus className="w-4 h-4" />
                              Reapply
                            </>
                          ) : (
                            <>
                              <Edit className="w-4 h-4" />
                              Edit
                            </>
                          )}
                        </button>



                        {(vehicle.isRejected || !vehicle.isApproved) && (
                          <button
                            onClick={() => initiateDelete(vehicle._id)}
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
                          onClick={() => initiateDelete(vehicle._id)}
                          disabled={deletingId === vehicle._id}
                          className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-600 py-1 text-xs font-medium transition-colors"
                        >
                          Delete Listing
                        </button>
                      )}
                    </div>
                    {
                      vehicle.isRejected && vehicle.rejectionReason && (
                        <div className="mt-3 p-3 bg-red-50/50 border border-red-100 rounded-lg">
                          <p className="text-xs font-bold text-red-700 mb-0.5">Rejected:</p>
                          <p className="text-xs text-red-600 leading-relaxed">{vehicle.rejectionReason}</p>
                        </div>
                      )
                    }
                  </div >
                </div >
              );
            })}
          </div >
        )}
      </div >

      {/* Delete Confirmation Modal */}
      {vehicleToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !deletingId && setVehicleToDelete(null)}
          />

          <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform animate-in zoom-in-95 duration-300">
            <div className="h-2 bg-gradient-to-r from-red-400 via-red-500 to-rose-500" />

            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Vehicle</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Are you sure you want to permanently delete this vehicle? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setVehicleToDelete(null)}
                  disabled={!!deletingId}
                  className="flex-1 px-6 py-3.5 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={!!deletingId}
                  className="flex-1 px-6 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-95 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deletingId && <Loader2 className="w-5 h-5 animate-spin" />}
                  {deletingId ? 'Deleting...' : 'Delete Vehicle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Super Cool Modal */}
      {modal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform animate-in zoom-in-95 duration-300">
            {/* Gradient Header */}
            <div className={`h-2 ${modal.type === 'success' ? 'bg-gradient-to-r from-green-400 via-green-500 to-emerald-500' :
              modal.type === 'error' ? 'bg-gradient-to-r from-red-400 via-red-500 to-rose-500' :
                modal.type === 'warning' ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600' :
                  'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600'
              }`} />

            <div className="p-8">
              {/* Icon */}
              <div className="flex items-center justify-center mb-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${modal.type === 'success' ? 'bg-green-50' :
                  modal.type === 'error' ? 'bg-red-50' :
                    modal.type === 'warning' ? 'bg-orange-50' :
                      'bg-blue-50'
                  }`}>
                  {modal.type === 'success' && (
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {modal.type === 'error' && (
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {modal.type === 'warning' && (
                    <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  {modal.type === 'info' && (
                    <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {modal.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {modal.message}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={closeModal}
                className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 ${modal.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' :
                  modal.type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600' :
                    modal.type === 'warning' ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700' :
                      'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                  }`}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default MyVehicles;