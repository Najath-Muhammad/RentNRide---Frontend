import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { CheckCircle, MessageCircle, CalendarCheck, Loader2, CalendarX } from 'lucide-react';
import { BookingApi } from '../../services/api/booking/booking.api';
import { api } from '../../utils/axios';
import { AxiosError } from 'axios';

interface BookingSidebarProps {
  pricePerDay?: number;
  vehicleId?: string;
  ownerId?: string;
}

interface BookedRange {
  startDate: string;
  endDate: string;
}

// Returns all YYYY-MM-DD strings in [start, end] inclusive
function expandRange(start: string, end: string): Set<string> {
  const dates = new Set<string>();
  const cur = new Date(start);
  const last = new Date(end);
  cur.setHours(0, 0, 0, 0);
  last.setHours(0, 0, 0, 0);
  while (cur <= last) {
    dates.add(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

// Returns true if [pickupDate, returnDate] overlaps any booked range
function rangeOverlapsBooked(pickup: string, ret: string, bookedRanges: BookedRange[]): boolean {
  const p = new Date(pickup);
  const r = new Date(ret);
  return bookedRanges.some((b) => {
    const bs = new Date(b.startDate);
    const be = new Date(b.endDate);
    return p < be && r > bs;
  });
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

  // Booked dates state
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [bookedDatesSet, setBookedDatesSet] = useState<Set<string>>(new Set());

  // Fetch booked dates when vehicleId is available
  useEffect(() => {
    if (!vehicleId) return;
    setLoadingDates(true);
    api.get(`/bookings/vehicle/${vehicleId}/booked-dates`)
      .then((res) => {
        const ranges: BookedRange[] = res.data.data || [];
        setBookedRanges(ranges);
        // Pre-expand all booked dates for quick lookup in the UI
        const all = new Set<string>();
        ranges.forEach((r) => {
          expandRange(
            new Date(r.startDate).toISOString().split('T')[0],
            new Date(r.endDate).toISOString().split('T')[0]
          ).forEach((d) => all.add(d));
        });
        setBookedDatesSet(all);
      })
      .catch(() => {
        // non-fatal — just show no blocked dates
      })
      .finally(() => setLoadingDates(false));
  }, [vehicleId]);

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

    // Check overlap with booked ranges
    if (rangeOverlapsBooked(pickupDate, returnDate, bookedRanges)) {
      setError('Your selected dates overlap with an existing booking. Please choose different dates.');
      setDays(1);
      return;
    }

    const diffDays = Math.ceil((returnD.getTime() - pickup.getTime()) / (1000 * 3600 * 24));
    setDays(Math.max(1, diffDays));
    setError(null);
  }, [pickupDate, returnDate, bookedRanges]);

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
      console.log('Booking created successfully:', response.data);
      setShowSuccessModal(true);
      setTimeout(() => navigate({ to: '/user/my-bookings' }), 3000);
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

  // Returns minimum allowed date for the return date input
  const returnDateMin = pickupDate || new Date().toISOString().split('T')[0];

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
          {/* Pickup Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-1 transition-colors ${
                pickupDate && bookedDatesSet.has(pickupDate)
                  ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'
              }`}
              value={pickupDate}
              onChange={(e) => {
                setPickupDate(e.target.value);
                // Reset return date if it's now before pickup
                if (returnDate && e.target.value > returnDate) setReturnDate('');
              }}
            />
            {pickupDate && bookedDatesSet.has(pickupDate) && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <CalendarX className="w-3 h-3" /> This date is already booked
              </p>
            )}
          </div>

          {/* Return Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
            <input
              type="date"
              min={returnDateMin}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-1 transition-colors ${
                returnDate && bookedDatesSet.has(returnDate)
                  ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'
              }`}
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
            />
            {returnDate && bookedDatesSet.has(returnDate) && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <CalendarX className="w-3 h-3" /> This date is already booked
              </p>
            )}
          </div>

          {/* Booked dates legend */}
          {!loadingDates && bookedRanges.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1.5">
                <CalendarX className="w-3.5 h-3.5" /> Already Booked Periods
              </p>
              <ul className="space-y-1">
                {bookedRanges.map((r, i) => (
                  <li key={i} className="text-xs text-red-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    {new Date(r.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {' → '}
                    {new Date(r.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {loadingDates && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking availability...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Fuel Option */}
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

          {/* Pricing */}
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
            className={`w-full py-4 rounded-lg font-semibold text-lg transition ${
              !pickupDate || !returnDate || !!error || isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isSubmitting ? 'Processing...' : 'Book Now'}
          </button>
        </div>
      </div>

      {/* Success Modal */}
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