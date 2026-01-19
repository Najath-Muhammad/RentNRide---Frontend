import { useState, useEffect, useCallback } from 'react';
import AdminTable from '../../components/admin/AdminTable';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { VehicleApi, type VehicleListItem, type VehicleStats } from '../../services/api/admin/vehicle.management.api'; // ← adjust path as needed
import ConfirmationModal from '../../components/common/ConfirmationModal';

const mockOwnerNames: Record<string, string> = {
  '69298eb111f3269be35d5c92': 'John Doe',
  '69326d6c68c401d566e72d7a': 'Jane Smith',
};

const AdminVehicleControl: React.FC = () => {
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [stats, setStats] = useState<VehicleStats>({
    totalVehicles: 0,
    pendingApproval: 0,
    approved: 0,
    blocked: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({
    category: '',
    status: '',
    fuelType: '',
  });
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [vehicleToReject, setVehicleToReject] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleListItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Confirmation Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    onConfirm: () => { },
  });

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await VehicleApi.getVehicles({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        category: activeFilters.category || undefined,
        status: activeFilters.status || undefined,
        fuelType: activeFilters.fuelType || undefined,
      });

      setVehicles(data.data);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setVehicles([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, activeFilters]);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await VehicleApi.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching vehicle stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleFilterChange = (filterKey: string, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const getVehicleStatus = (vehicle: VehicleListItem): string => {
    if (vehicle.isRejected) return 'Rejected';
    if (!vehicle.isApproved) return 'Pending Approval';
    if (!vehicle.isActive) return 'Blocked';
    return 'Approved';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Pending Approval':
        return 'bg-orange-100 text-orange-800';
      case 'Blocked':
        return 'bg-red-100 text-red-800';
      case 'Rejected':
        return 'bg-red-100 text-red-900 font-bold';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Action handlers using the new API service
  const handleApprove = async (id: string) => {
    try {
      await VehicleApi.approveVehicle(id);
      fetchVehicles();
      fetchStats();
    } catch (error) {
      console.error('Error approving vehicle:', error);
      alert('Failed to approve vehicle');
    }
  };

  const openRejectModal = (id: string) => {
    setVehicleToReject(id);
    setShowRejectModal(true);
    setRejectionReason('');
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setVehicleToReject(null);
    setRejectionReason('');
  };

  const handleReject = async () => {
    if (!vehicleToReject || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      await VehicleApi.rejectVehicle(vehicleToReject, rejectionReason.trim());
      fetchVehicles();
      fetchStats();
      closeRejectModal();
    } catch (error: unknown) {
      console.error('Error rejecting vehicle:', error);
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(message || 'Failed to reject vehicle');
    }
  };

  const handleBlock = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Block Vehicle',
      message: 'Are you sure you want to block this vehicle?',
      type: 'warning',
      onConfirm: async () => {
        try {
          await VehicleApi.blockVehicle(id);
          fetchVehicles();
          fetchStats();
          closeModal();
        } catch (error) {
          console.error('Error blocking vehicle:', error);
          alert('Failed to block vehicle');
        }
      }
    });
  };

  const handleUnblock = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Unblock Vehicle',
      message: 'Are you sure you want to unblock this vehicle?',
      type: 'info',
      onConfirm: async () => {
        try {
          await VehicleApi.unblockVehicle(id);
          fetchVehicles();
          fetchStats();
          closeModal();
        } catch (error) {
          console.error('Error unblocking vehicle:', error);
          alert('Failed to unblock vehicle');
        }
      }
    });
  };

  const handleViewDetails = async (id: string) => {
    try {
      const vehicle = await VehicleApi.getVehicleById(id);
      setSelectedVehicle(vehicle);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      alert('Could not load vehicle details');
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedVehicle(null);
  };

  // Table columns & data preparation
  const columns = [
    { key: 'vehicleId', label: 'Vehicle ID' },
    { key: 'brand', label: 'Name & Model' },
    { key: 'category', label: 'Category' },
    { key: 'fuelType', label: 'Fuel Type' },
    { key: 'ownerName', label: 'Owner Name' },
    { key: 'status', label: 'Status' },
    { key: 'pricePerDay', label: 'Price Per Day' },
    { key: 'pickupAddress', label: 'Location' },
  ];

  const tableData = vehicles.map((vehicle) => ({
    _id: vehicle._id,
    vehicleId: vehicle._id.slice(-6).toUpperCase(),
    brand: `${vehicle.brand} ${vehicle.modelName}`,
    category: vehicle.category,
    fuelType: vehicle.fuelType,
    ownerName: mockOwnerNames[vehicle.ownerId] || 'Unknown Owner',
    status: (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(getVehicleStatus(vehicle))}`}>
        {getVehicleStatus(vehicle)}
      </span>
    ),
    pricePerDay: `₹ ${vehicle.pricePerDay.toLocaleString()}`,
    pickupAddress: vehicle.pickupAddress || 'N/A',
  }));

  const filters = [
    {
      key: 'category',
      label: 'Category',
      options: ['Car', 'Bike', 'SUV', 'Sedan', 'Hatchback', 'Luxury'],
    },
    {
      key: 'status',
      label: 'Status',
      options: ['Pending Approval', 'Approved', 'Blocked', 'Rejected'],
    },
    {
      key: 'fuelType',
      label: 'Fuel Type',
      options: ['Petrol', 'Diesel', 'Electric', 'Hybrid'],
    },
  ];

  const getActions = (item: { _id: string }) => {
    const vehicle = vehicles.find((v) => v._id === item._id);
    if (!vehicle) return [];

    const actions = [
      {
        label: 'View Details',
        onClick: () => handleViewDetails(vehicle._id),
        className: 'text-blue-600',
      },
    ];

    if (!vehicle.isApproved && !vehicle.isRejected) {
      actions.push(
        {
          label: 'Approve',
          onClick: () => handleApprove(vehicle._id),
          className: 'text-emerald-600',
        },
        {
          label: 'Reject',
          onClick: async () => openRejectModal(vehicle._id),
          className: 'text-red-600',
        }
      );
    }

    if (!vehicle.isRejected && vehicle.isApproved) {
      if (vehicle.isActive) {
        actions.push({
          label: 'Block',
          onClick: async () => handleBlock(vehicle._id),
          className: 'text-red-600',
        });
      } else {
        actions.push({
          label: 'Unblock',
          onClick: async () => handleUnblock(vehicle._id),
          className: 'text-emerald-600',
        });
      }
    }

    return actions;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar activeItem="Vehicle Management" />
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        {/* Stats Cards */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Vehicles</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalVehicles}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Pending Approval</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingApproval}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Approved</h3>
              <p className="text-3xl font-bold text-emerald-600">{stats.approved}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Blocked</h3>
              <p className="text-3xl font-bold text-red-600">{stats.blocked}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Rejected</h3>
              <p className="text-3xl font-bold text-red-700">{stats.rejected}</p>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <AdminTable
          data={tableData}
          columns={columns}
          title="Vehicle List"
          searchValue={searchValue}
          onSearch={handleSearch}
          searchPlaceholder="Search Vehicle Name/Model"
          filters={filters}
          onFilterChange={handleFilterChange}
          activeFilters={activeFilters}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          actions={getActions}
          isLoading={isLoading}
        />
      </div>

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Reject Vehicle</h2>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a detailed reason for rejection..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={closeRejectModal}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Vehicle Details</h2>
              <button
                onClick={closeDetailsModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-light"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selectedVehicle.isRejected && selectedVehicle.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-red-900 mb-2">Rejection Reason</h3>
                  <p className="text-sm text-red-700">{selectedVehicle.rejectionReason}</p>
                </div>
              )}

              {selectedVehicle.vehicleImages && selectedVehicle.vehicleImages.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Vehicle Images</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedVehicle.vehicleImages.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Vehicle ${idx + 1}`}
                        className="w-full h-40 object-cover rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Vehicle ID</p>
                    <p className="text-sm font-medium text-gray-900">{selectedVehicle._id.slice(-6).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Brand</p>
                    <p className="text-sm font-medium text-gray-900">{selectedVehicle.brand}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Model Name</p>
                    <p className="text-sm font-medium text-gray-900">{selectedVehicle.modelName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm font-medium text-gray-900">{selectedVehicle.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fuel Type</p>
                    <p className="text-sm font-medium text-gray-900">{selectedVehicle.fuelType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Seating Capacity</p>
                    <p className="text-sm font-medium text-gray-900">{selectedVehicle.seatingCapacity} seats</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Doors</p>
                    <p className="text-sm font-medium text-gray-900">{selectedVehicle.doors || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Price Per Day</p>
                    <p className="text-sm font-medium text-gray-900">₹ {selectedVehicle.pricePerDay.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Owner Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Owner Name</p>
                    <p className="text-sm font-medium text-gray-900">
                      {mockOwnerNames[selectedVehicle.ownerId] || 'Unknown Owner'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Regional Contact</p>
                    <p className="text-sm font-medium text-gray-900">{selectedVehicle.regionalContact}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Pickup Address</p>
                    <p className="text-sm font-medium text-gray-900">{selectedVehicle.pickupAddress}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">RC Details</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">RC Number</p>
                    <p className="text-sm font-medium text-gray-900">{selectedVehicle.rcNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">RC Expiry Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedVehicle.rcExpiryDate).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedVehicle.rcImage && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-2">RC Document</p>
                      <img
                        src={selectedVehicle.rcImage}
                        alt="RC Document"
                        className="w-full h-48 object-contain border border-gray-200 rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Insurance Details</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Insurance Provider</p>
                    <p className="text-sm font-medium text-gray-900">{selectedVehicle.insuranceProvider}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Policy Number</p>
                    <p className="text-sm font-medium text-gray-900">{selectedVehicle.insurancePolicyNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Insurance Expiry Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedVehicle.insuranceExpiryDate).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedVehicle.insuranceImage && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-2">Insurance Document</p>
                      <img
                        src={selectedVehicle.insuranceImage}
                        alt="Insurance Document"
                        className="w-full h-48 object-contain border border-gray-200 rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Status</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Approval Status</p>
                    <p className={`text-sm font-medium ${selectedVehicle.isRejected ? 'text-red-600' :
                      selectedVehicle.isApproved ? 'text-emerald-600' : 'text-orange-600'
                      }`}>
                      {selectedVehicle.isRejected ? 'Rejected' :
                        selectedVehicle.isApproved ? 'Approved' : 'Pending Approval'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Active Status</p>
                    <p className={`text-sm font-medium ${selectedVehicle.isActive ? 'text-emerald-600' : 'text-red-600'}`}>
                      {selectedVehicle.isActive ? 'Active' : 'Blocked'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created At</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedVehicle.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              {!selectedVehicle.isApproved && !selectedVehicle.isRejected && (
                <>
                  <button
                    onClick={() => {
                      handleApprove(selectedVehicle._id);
                      closeDetailsModal();
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Approve Vehicle
                  </button>
                  <button
                    onClick={() => {
                      closeDetailsModal();
                      openRejectModal(selectedVehicle._id);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reject Vehicle
                  </button>
                </>
              )}
              {selectedVehicle.isActive && selectedVehicle.isApproved && !selectedVehicle.isRejected && (
                <button
                  onClick={() => {
                    handleBlock(selectedVehicle._id);
                    closeDetailsModal();
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Block Vehicle
                </button>
              )}
              {!selectedVehicle.isActive && selectedVehicle.isApproved && !selectedVehicle.isRejected && (
                <button
                  onClick={() => {
                    handleUnblock(selectedVehicle._id);
                    closeDetailsModal();
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Unblock Vehicle
                </button>
              )}
              <button
                onClick={closeDetailsModal}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generic Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
};

export default AdminVehicleControl;
