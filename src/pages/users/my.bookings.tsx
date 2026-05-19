import React, { useEffect, useState } from 'react';
import { BookingApi, type Booking } from '../../services/api/booking/booking.api';
import { AxiosError } from 'axios';
import Navbar from '../../components/user/Navbar';
import { Loader2, Calendar, AlertCircle, Clock, CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { ChatApi } from '../../services/api/chat/chat.api';
import { ReviewApi } from '../../services/api/review/review.api';
import { Star } from 'lucide-react';

const MyBookings: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [chattingId, setChattingId] = useState<string | null>(null);
    const navigate = useNavigate();

    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewBooking, setReviewBooking] = useState<{ bookingId: string, vehicleId: string, vehicleName: string } | null>(null);
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

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
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await BookingApi.getMyBookings();
            if (response.success && response.data) {
                setBookings(response.data);
            }
        } catch (err) {
            console.error('Error fetching bookings:', err);
            const error = err as Error;
            setError(error.message || 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
    const [cancelReason, setCancelReason] = useState<string>('Change of plans');

    const handleCancelClick = (booking: Booking) => {
        setBookingToCancel(booking);
        setCancelReason('Change of plans');
    };

    const handleConfirmCancel = async () => {
        if (!bookingToCancel) return;

        try {
            setCancellingId(bookingToCancel._id);
            await BookingApi.cancelBooking(bookingToCancel._id, cancelReason);

            setBookings(prev => prev.map(b =>
                b._id === bookingToCancel._id ? { ...b, bookingStatus: 'cancel_requested' } : b
            ));
            
            showModal('success', 'Cancellation Requested', 'Your cancellation has been processed.');
        } catch (err) {
            const error = err as Error;
            showModal('error', 'Cancellation Failed', error.message || 'Failed to cancel booking');
        } finally {
            setCancellingId(null);
            setBookingToCancel(null);
        }
    };

    const handleChatWithOwner = async (booking: Booking) => {
        const ownerId = typeof booking.ownerId === 'object' ? (booking.ownerId as { _id?: string })?._id : booking.ownerId;
        const vehicleId = typeof booking.vehicleId === 'object' ? (booking.vehicleId as { _id?: string })?._id : booking.vehicleId;

        if (!ownerId) {
            showModal('error', 'Cannot Open Chat', 'Owner information is not available for this booking.');
            return;
        }

        try {
            setChattingId(booking._id);
            await ChatApi.getOrCreateConversation(ownerId, vehicleId);
            navigate({ to: '/user/chat' });
        } catch (err) {
            console.error('Failed to open chat:', err);
            showModal('error', 'Chat Failed', 'Unable to open chat with owner. Please try again.');
        } finally {
            setChattingId(null);
        }
    };

    const openReviewModal = (booking: Booking) => {
        setReviewBooking({
            bookingId: booking._id,
            vehicleId: booking.vehicleId._id,
            vehicleName: `${booking.vehicleId.brand} ${booking.vehicleId.modelName}`
        });
        setRating(0);
        setReviewText('');
        setShowReviewModal(true);
    };

    const handleSubmitReview = async () => {
        if (!reviewBooking || rating === 0) {
            showModal('warning', 'Rating Required', 'Please select a rating');
            return;
        }
        if (!reviewText.trim()) {
            showModal('warning', 'Comment Required', 'Please describe your experience');
            return;
        }

        try {
            setSubmittingReview(true);
            await ReviewApi.createReview({
                vehicleId: reviewBooking.vehicleId,
                bookingId: reviewBooking.bookingId,
                rating,
                comment: reviewText
            });
            setShowReviewModal(false);
            setReviewBooking(null);
            showModal('success', 'Review Submitted', 'Review submitted successfully!');
            // Optional: Mark this booking as reviewed in local state if supported
        } catch (err) {
            console.error('Review submission failed:', err);
            const error = err as AxiosError<{ message: string }>;
            showModal('error', 'Submission Failed', error.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    const getStatusColor = (status: string, cancelledBy?: string) => {
        if (status === 'cancelled' && cancelledBy === 'system') {
            return 'text-orange-600 bg-orange-50 border-orange-200';
        }
        switch (status) {
            case 'approved':
            case 'advance_authorized':
            case 'confirmed':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'requested':
            case 'pending':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'cancelled':
                return 'text-red-600 bg-red-50 border-red-200';
            case 'cancel_requested':
                return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'completed':
            case 'payment_captured':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'ride_started':
            case 'ongoing':
                return 'text-purple-600 bg-purple-50 border-purple-200';
            case 'rejected':
            case 'no_show':
                return 'text-red-600 bg-red-50 border-red-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusLabel = (status: string, cancelledBy?: string) => {
        if (status === 'cancelled' && cancelledBy === 'system') return 'Expired';
        if (status === 'advance_authorized') return 'Authorized';
        if (status === 'payment_captured') return 'Paid';
        if (status === 'ride_started') return 'In Progress';
        if (status === 'cancel_requested') return 'Cancel Pending';
        return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    };

    const getStatusIcon = (status: string, cancelledBy?: string) => {
        switch (status) {
            case 'approved':
            case 'advance_authorized':
            case 'confirmed':
                return <CheckCircle className="w-4 h-4" />;
            case 'requested':
            case 'pending':
                return <Clock className="w-4 h-4" />;
            case 'cancelled':
            case 'cancel_requested':
                if (cancelledBy === 'system') return <AlertCircle className="w-4 h-4" />;
                return <XCircle className="w-4 h-4" />;
            case 'completed':
            case 'payment_captured':
                return <CheckCircle className="w-4 h-4" />;
            case 'rejected':
            case 'no_show':
                return <XCircle className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">Loading your bookings...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center p-4 h-[calc(100vh-80px)]">
                    <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h3>
                        <p className="text-gray-500 mb-6">{error}</p>
                        <button
                            onClick={fetchBookings}
                            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
                        <p className="text-gray-500 mt-2">Manage and track all your vehicle bookings</p>
                    </div>

                    {bookings.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No bookings yet</h3>
                            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                                You haven't made any bookings yet. Browse our collection of vehicles and start your journey!
                            </p>
                            <button
                                onClick={() => navigate({ to: '/vehicles/search' })}
                                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                            >
                                Browse Vehicles
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {bookings.map((booking) => (
                                <div
                                    key={booking._id}
                                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100"
                                >
                                    <div className="flex flex-col md:flex-row">
                                        {/* Image Section */}
                                        <div className="md:w-1/3 h-48 md:h-auto relative bg-gray-100">
                                            {(booking.vehicleId?.vehicleImages?.[0] || booking.vehicleId?.images?.[0]) ? (
                                                <img
                                                    src={booking.vehicleId.vehicleImages?.[0] || booking.vehicleId.images?.[0]}
                                                    alt={`${booking.vehicleId.brand} ${booking.vehicleId.modelName}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    No Image
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.bookingStatus, booking.cancelledBy)}`}>
                                                    {getStatusIcon(booking.bookingStatus, booking.cancelledBy)}
                                                    {getStatusLabel(booking.bookingStatus, booking.cancelledBy)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Details Section */}
                                        <div className="p-6 md:w-2/3 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <p className="text-xs font-semibold text-blue-600 mb-1">BOOKING ID: {booking.bookingId}</p>
                                                        <h3 className="text-xl font-bold text-gray-900">
                                                            {booking.vehicleId?.brand} {booking.vehicleId?.modelName}
                                                        </h3>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-500">Total Amount</p>
                                                        <p className="text-xl font-bold text-gray-900">₹{booking.totalAmount?.toLocaleString()}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                                    <div className="bg-gray-50 p-3 rounded-xl">
                                                        <p className="text-xs text-gray-500 mb-1">Pick-up Date</p>
                                                        <div className="flex items-center gap-2 font-semibold text-gray-900">
                                                            <Calendar className="w-4 h-4 text-blue-600" />
                                                            {new Date(booking.startDate).toLocaleDateString(undefined, {
                                                                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 p-3 rounded-xl">
                                                        <p className="text-xs text-gray-500 mb-1">Drop-off Date</p>
                                                        <div className="flex items-center gap-2 font-semibold text-gray-900">
                                                            <Calendar className="w-4 h-4 text-blue-600" />
                                                            {new Date(booking.endDate).toLocaleDateString(undefined, {
                                                                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 p-3 rounded-xl">
                                                        <p className="text-xs text-gray-500 mb-1">Fuel Option</p>
                                                        <div className="flex items-center gap-2 font-semibold text-gray-900">
                                                            <span className="text-blue-600 text-lg">⛽</span>
                                                            {booking.withFuel ? 'With Fuel' : 'Without Fuel'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Cancellation / Refund note */}
                                                {(booking.bookingStatus === 'cancelled' || booking.bookingStatus === 'cancel_requested') && (
                                                    <div className="mt-3 flex flex-col gap-2 text-xs text-gray-600 bg-orange-50 border border-orange-100 rounded-lg px-4 py-3">
                                                        <div className="flex items-start gap-2">
                                                            <AlertCircle className="w-4 h-4 flex-shrink-0 text-orange-500 mt-0.5" />
                                                            <div>
                                                                <span className="font-semibold block mb-0.5">Cancellation Reason:</span>
                                                                <span>{booking.cancellationReason || 'No reason provided'}</span>
                                                            </div>
                                                        </div>
                                                        {booking.refundAmount !== undefined && booking.advancePaid && booking.advancePaid > 0 ? (
                                                            <div className="border-t border-orange-200/60 pt-2 mt-1 flex justify-between">
                                                                <span>Refund Status: <strong className="capitalize">{booking.refundStatus || 'pending'}</strong></span>
                                                                <span className="font-semibold text-green-700">Refund: ₹{booking.refundAmount.toLocaleString()}</span>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                                                    Owner: <span className="font-medium text-gray-900">{booking.ownerId?.name || 'Unknown'}</span>
                                                </div>

                                                <div className="flex items-center gap-3 flex-wrap">
                                                    {/* Chat with Owner — visible on active/pending/confirmed bookings */}
                                                    {!['cancelled', 'rejected'].includes(booking.bookingStatus) && (
                                                        <button
                                                            onClick={() => handleChatWithOwner(booking)}
                                                            disabled={chattingId === booking._id}
                                                            className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                                        >
                                                            {chattingId === booking._id
                                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                                : <MessageCircle className="w-4 h-4" />}
                                                            {chattingId === booking._id ? 'Opening...' : 'Chat with Owner'}
                                                        </button>
                                                    )}
                                                    {['requested', 'approved', 'advance_authorized', 'pending', 'confirmed'].includes(booking.bookingStatus) && new Date(booking.startDate) > new Date() && (
                                                        <button
                                                            onClick={() => handleCancelClick(booking)}
                                                            disabled={cancellingId === booking._id}
                                                            className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                        >
                                                            {cancellingId === booking._id ? 'Cancelling...' : 'Cancel Booking'}
                                                        </button>
                                                    )}
                                                    {['completed', 'ride_started', 'payment_captured'].includes(booking.bookingStatus) && (
                                                        <button
                                                            onClick={() => openReviewModal(booking)}
                                                            className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                                                        >
                                                            <Star className="w-4 h-4" />
                                                            Rate Vehicle
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Cancel Booking Confirmation Modal */}
            {bookingToCancel && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => !cancellingId && setBookingToCancel(null)}
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
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Cancel Booking</h3>
                                    <p className="text-gray-600 leading-relaxed text-sm">
                                        Are you sure you want to cancel this booking? Please review our cancellation policy below.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="mb-6 bg-gray-50 p-4 rounded-xl text-sm border border-gray-100">
                                <h4 className="font-bold text-gray-900 mb-2">Cancellation Policy</h4>
                                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                                    <li>More than 48h before pickup: <span className="font-semibold text-green-600">100% Refund</span></li>
                                    <li>24h to 48h before pickup: <span className="font-semibold text-orange-600">50% Refund</span></li>
                                    <li>Less than 24h before pickup: <span className="font-semibold text-red-600">No Refund</span></li>
                                </ul>
                                
                                {(() => {
                                    const hoursUntilPickup = (new Date(bookingToCancel.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60);
                                    const advance = bookingToCancel.advancePaid || 0;
                                    let estimatedRefund = 0;
                                    if (hoursUntilPickup > 48) estimatedRefund = advance;
                                    else if (hoursUntilPickup > 24) estimatedRefund = advance * 0.5;
                                    
                                    return advance > 0 ? (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <p className="flex justify-between items-center text-gray-800">
                                                <span>Advance Paid:</span>
                                                <span className="font-semibold">₹{advance.toLocaleString()}</span>
                                            </p>
                                            <p className="flex justify-between items-center mt-1 text-gray-800">
                                                <span>Estimated Refund:</span>
                                                <span className={`font-bold ${estimatedRefund > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    ₹{estimatedRefund.toLocaleString()}
                                                </span>
                                            </p>
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                            
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Reason</label>
                                <select 
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                >
                                    <option value="Change of plans">Change of plans</option>
                                    <option value="Found another vehicle">Found another vehicle</option>
                                    <option value="Price issue">Price issue</option>
                                    <option value="Booking mistake">Booking mistake</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setBookingToCancel(null)}
                                    disabled={!!cancellingId}
                                    className="flex-1 px-6 py-3.5 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Keep Booking
                                </button>
                                <button
                                    onClick={handleConfirmCancel}
                                    disabled={!!cancellingId}
                                    className="flex-1 px-6 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-95 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {cancellingId && <Loader2 className="w-5 h-5 animate-spin" />}
                                    {cancellingId ? 'Cancelling...' : 'Yes, Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {
                showReviewModal && reviewBooking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-scale-in">
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Rate your trip</h3>
                                <p className="text-gray-500 text-sm mb-6">
                                    How was your experience with <strong>{reviewBooking.vehicleName}</strong>?
                                </p>

                                <div className="flex justify-center gap-2 mb-6">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            className={`p-1 transition-all hover:scale-110 ${rating >= star ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                                }`}
                                        >
                                            <Star className={`w-8 h-8 ${rating >= star ? 'fill-yellow-400' : ''}`} />
                                        </button>
                                    ))}
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Describe your experience
                                    </label>
                                    <textarea
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                        placeholder="Tell us what you liked or didn't like..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none h-32 text-sm"
                                    ></textarea>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowReviewModal(false)}
                                        className="flex-1 px-4 py-2.5 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmitReview}
                                        disabled={submittingReview}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Super Cool Modal */}
            {modal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform animate-in zoom-in-95 duration-300">
                        <div className={`h-2 ${modal.type === 'success' ? 'bg-gradient-to-r from-green-400 via-green-500 to-emerald-500' :
                            modal.type === 'error' ? 'bg-gradient-to-r from-red-400 via-red-500 to-rose-500' :
                                modal.type === 'warning' ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600' :
                                    'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600'
                            }`} />
                        <div className="p-8">
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
                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">{modal.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{modal.message}</p>
                            </div>
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

export default MyBookings;
