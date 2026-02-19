import React, { useEffect, useState, useCallback } from 'react';
import { Star } from 'lucide-react';
import { ReviewApi, type Review } from '../../services/api/review/review.api';
import { useAuthStore } from '../../stores/authStore';

interface CustomerReviewsProps {
  vehicleId: string;
}

const CustomerReviews: React.FC<CustomerReviewsProps> = ({ vehicleId }) => {
  const { isAuthenticated } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch reviews
      const reviewsRes = await ReviewApi.getVehicleReviews(vehicleId);
      if (reviewsRes.success) {
        setReviews(reviewsRes.data);
      }

      // Check eligibility if logged in
      if (isAuthenticated) {
        const eligibilityRes = await ReviewApi.checkEligibility(vehicleId);
        if (eligibilityRes.success) {
          setCanReview(eligibilityRes.data.canReview);
          if (eligibilityRes.data.bookingId) {
            setBookingId(eligibilityRes.data.bookingId);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching reviews data:", error);
    } finally {
      setLoading(false);
    }
  }, [vehicleId, isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) return;

    try {
      setSubmitting(true);
      const res = await ReviewApi.createReview({
        vehicleId,
        bookingId,
        rating,
        comment
      });

      if (res.success) {
        // Refresh reviews and hide form
        await fetchData();
        setShowForm(false);
        setComment('');
        setRating(5);
        // After submitting, user shouldn't theoretically review again immediately for same booking
        setCanReview(false);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  if (loading) {
    return <div className="p-6 bg-white rounded-lg shadow animate-pulse h-64"></div>;
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customer Reviews</h2>
        {canReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
        <div className="text-4xl font-bold text-gray-900">{averageRating}</div>
        <div>
          <div className="flex text-yellow-500 mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${parseFloat(averageRating) >= star ? 'fill-current' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 font-medium">
            Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold mb-4">Share your experience</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${rating >= star ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Tell us about your trip..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {submitting ? 'Submitting...' : 'Post Review'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2 bg-white text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-center text-gray-500 py-8 italic">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {review.userId.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{review.userId.name}</h4>
                    <span className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed pl-[52px]">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default CustomerReviews;