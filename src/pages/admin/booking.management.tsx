import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminTable from '../../components/admin/AdminTable';
import { BookingManagementApi, type Booking, type PaginatedBookingsResponse } from '../../services/api/admin/booking.management.api';
import { XCircle } from 'lucide-react';
import { AxiosError } from 'axios';

const BookingManagement: React.FC = () => {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [debouncedSearch, setDebouncedSearch] = useState(search);

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 800);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchBookings = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const data: PaginatedBookingsResponse = await BookingManagementApi.getAllBookings({
                page,
                limit,
                status: status || undefined,
                search: debouncedSearch
            });
            setBookings(data.data);
            setTotalPages(data.totalPages);
            setTotalItems(data.total);
        } catch (err) {
            console.error("Failed to fetch bookings:", err);
            setBookings([]);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, debouncedSearch, status]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const openCancelModal = (booking: Booking) => {
        setSelectedBooking(booking);
        setCancelReason('');
        setShowCancelModal(true);
    };

    const handleCancelBooking = async () => {
        if (!selectedBooking) return;

        setCancelling(true);
        try {
            await BookingManagementApi.cancelBooking(selectedBooking._id, cancelReason);
            await fetchBookings();
            setShowCancelModal(false);
        } catch (err) {
            let message = 'Failed to cancel booking';
            if (err instanceof AxiosError && err.response?.data?.message) {
                message = err.response.data.message;
            } else if (err instanceof Error) {
                message = err.message;
            }
            alert(message);
        } finally {
            setCancelling(false);
        }
    };

    const columns = [
        { key: 'bookingId', label: 'Booking ID' },
        { key: 'vehicle', label: 'Vehicle' },
        { key: 'user', label: 'Customer' },
        { key: 'dates', label: 'Dates' },
        { key: 'amount', label: 'Amount' },
        { key: 'status', label: 'Status' },
    ];

    const formattedBookings = bookings.map(b => ({
        _id: b._id,
        bookingId: b.bookingId,
        vehicle: (
            <div className="flex flex-col">
                <span className="font-medium text-gray-900">{b.vehicleId?.brand} {b.vehicleId?.modelName}</span>
                <span className="text-xs text-gray-500">Owner: {b.ownerId?.name}</span>
            </div>
        ),
        user: (
            <div className="flex flex-col">
                <span className="font-medium text-gray-900">{b.userId?.name}</span>
                <span className="text-xs text-gray-500">{b.userId?.email}</span>
            </div>
        ),
        dates: (
            <div className="text-sm text-gray-700">
                <div>From: {new Date(b.startDate).toLocaleDateString()}</div>
                <div>To: {new Date(b.endDate).toLocaleDateString()}</div>
                <div className="mt-1 font-medium text-blue-600">
                    ⛽ {b.withFuel ? 'With Fuel' : 'Without Fuel'}
                </div>
            </div>
        ),
        amount: <span className="font-semibold text-gray-900">₹{b.totalAmount.toLocaleString()}</span>,
        status: (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.bookingStatus === 'confirmed' ? 'bg-green-100 text-green-800' :
                b.bookingStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    b.bookingStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                        b.bookingStatus === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                }`}>
                {b.bookingStatus.charAt(0).toUpperCase() + b.bookingStatus.slice(1)}
            </span>
        ),
        rawStatus: b.bookingStatus
    }));

    const getActions = (item: typeof formattedBookings[0]) => {
        const actions = [];

        if (item.rawStatus === 'pending' || item.rawStatus === 'confirmed') {
            const booking = bookings.find(b => b._id === item._id);
            if (booking) {
                actions.push({
                    label: 'Cancel',
                    onClick: () => openCancelModal(booking),
                    className: 'text-red-600 hover:bg-red-50'
                });
            }
        }

        return actions;
    };

    const filters = [
        { key: "status", label: "Status", options: ["pending", "confirmed", "ongoing", "completed", "cancelled"] }
    ];

    return (
        <AdminLayout activeItem="Booking Management">
            <AdminTable
                data={formattedBookings}
                columns={columns}
                title="Booking Management"
                searchValue={search}
                onSearch={setSearch}
                searchPlaceholder="Search by Booking ID..."
                filters={filters}
                activeFilters={{ status: status || 'All' }}
                onFilterChange={(key, value) => {
                    if (key === 'status') setStatus(value);
                }}
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={setPage}
                actions={getActions}
                isLoading={isLoading}
            />
            {}
            {
                showCancelModal && selectedBooking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center gap-3 mb-4 text-red-600">
                                <XCircle className="w-8 h-8" />
                                <h2 className="text-xl font-bold text-gray-900">Cancel Booking</h2>
                            </div>

                            <p className="text-gray-600 text-sm mb-4">
                                Are you sure you want to cancel booking <span className="font-semibold">{selectedBooking.bookingId}</span>?
                                This action will refund the user if applicable.
                            </p>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Reason</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    rows={3}
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="e.g. Invalid documents, Payment issue..."
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Keep Booking
                                </button>
                                <button
                                    onClick={handleCancelBooking}
                                    disabled={cancelling}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition flex items-center gap-2"
                                >
                                    {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </AdminLayout >
    );
};

export default BookingManagement;
