import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { CheckCircle, MessageCircle, CalendarCheck } from 'lucide-react';
import { BookingApi } from '../../services/api/booking/booking.api';
import { AxiosError } from 'axios';

interface BookingSidebarProps {
  pricePerDay?: number;
  vehicleId?: string;
  ownerId?: string;
}

const BookingSidebar: React.FC<BookingSidebarProps> = ({
  pricePerDay = 0,
  vehicleId,
  ownerId
}) => {
  const navigate = useNavigate();
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [fuelOption, setFuelOption] = useState('Without Fuel');
  const [days, setDays] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!pickupDate || !returnDate) {
      setDays(1);
      setError(null);
      return;
    }

    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    pickup.setHours(0, 0, 0, 0);
    returnD.setHours(0, 0, 0, 0);

    if (returnD < pickup) {
      setError('Return date cannot be before pickup date');
      setDays(1);
      return;
    }

    const diffDays = Math.ceil((returnD.getTime() - pickup.getTime()) / (1000 * 3600 * 24));
    setDays(Math.max(1, diffDays));
    setError(null);
  }, [pickupDate, returnDate]);

  const total = pricePerDay * days;

  const handleBookNow = async () => {
    if (!pickupDate || !returnDate || error) {
      setError('Please select valid dates');
      return;
    }

    if (!vehicleId || !ownerId) {
      setError('Vehicle information is missing');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const bookingData = {
        vehicleId,
        ownerId,
        startDate: new Date(pickupDate).toISOString(),
        endDate: new Date(returnDate).toISOString(),
        withFuel: fuelOption === 'With Fuel',
        pricePerDay,
        totalAmount: total,
      };

      const response = await BookingApi.createBooking(bookingData);

      setShowSuccessModal(true);

      setTimeout(() => {
        navigate({ to: '/user/my-bookings' });
      }, 3000);
    } catch (err: unknown) {
      console.error('Booking failed:', err);
      let errorMessage = 'Booking failed. Please try again.';

      if (err instanceof AxiosError) {
        errorMessage = err.response?.data?.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!pricePerDay || pricePerDay <= 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
        <p className="text-center text-gray-500">Loading price...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
        <div className="text-3xl font-bold text-gray-900 mb-1">
          ₹{pricePerDay.toLocaleString('en-IN')}
          <span className="text-lg font-normal text-gray-600">/Day</span>
        </div>
        <p className="text-sm text-gray-600 mb-6">{fuelOption}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-emerald-500 focus:ring-emerald-500"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
            <input
              type="date"
              min={pickupDate || new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-emerald-500 focus:ring-emerald-500"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Option</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-emerald-500"
              value={fuelOption}
              onChange={(e) => setFuelOption(e.target.value)}
            >
              <option>With Fuel</option>
              <option>Without Fuel</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Duration</span>
              <span>{days} day{days > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold">
              <span>Total</span>
              <span className="text-emerald-600">₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={handleBookNow}
            disabled={!pickupDate || !returnDate || !!error || isSubmitting}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition ${!pickupDate || !returnDate || !!error || isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
          >
            {isSubmitting ? 'Processing...' : 'Book Now'}
          </button>
        </div>
      </div>
      {}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full text-center animate-fade-in shadow-2xl">
            <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Sent!</h2>
            <p className="text-gray-600 mb-6 font-medium">
              Your booking request has been sent to the owner for confirmation. You will be notified once they respond.
            </p>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6 overflow-hidden">
              <div className="bg-emerald-600 h-1.5 rounded-full animate-progress"></div>
            </div>
            <button
              onClick={() => navigate({ to: '/user/my-bookings' })}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md active:scale-[0.98] mb-3"
            >
              <CalendarCheck className="w-4 h-4" />
              Go to Booking History
            </button>
            <button
              onClick={() => navigate({ to: '/user/chat' })}
              className="w-full flex items-center justify-center gap-2 bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-semibold py-3 rounded-xl transition-all active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4" />
              Chat with Owner
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingSidebar;