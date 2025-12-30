import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

interface VendorReview {
  id: string;
  vendorId: string;
  bookingId: string;
  organizerId: string;
  rating: number;
  title: string;
  comment: string;
  serviceQuality: number;
  communication: number;
  timeliness: number;
  value: number;
  wouldRecommend: boolean;
  vendorResponse?: string;
  vendorResponseAt?: string;
  verifiedPurchase: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
  vendor: {
    id: string;
    businessName: string;
    verificationStatus: string;
  };
  booking: {
    id: string;
    serviceListing: {
      title: string;
      category: string;
    };
  };
}

interface CompletedBooking {
  id: string;
  serviceListing: {
    id: string;
    title: string;
    category: string;
  };
  vendor: {
    id: string;
    businessName: string;
    verificationStatus: string;
  };
  serviceDate: string;
  finalPrice?: number;
  currency: string;
  hasReview: boolean;
}

interface ReviewRatingUIProps {
  eventId?: string;
}

const ReviewRatingUI: React.FC<ReviewRatingUIProps> = ({ eventId }) => {
  const [activeTab, setActiveTab] = useState<'my-reviews' | 'pending-reviews'>('my-reviews');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CompletedBooking | null>(null);

  // Fetch existing reviews
  const { data: reviews, isLoading: reviewsLoading, refetch: refetchReviews } = useQuery({
    queryKey: ['organizer-reviews', eventId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (eventId) params.append('eventId', eventId);

      const response = await api.get(`/marketplace/reviews/organizer?${params.toString()}`);
      return response.data.reviews as VendorReview[];
    },
  });

  // Fetch completed bookings without reviews
  const { data: pendingReviews, isLoading: pendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ['pending-reviews', eventId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (eventId) params.append('eventId', eventId);
      params.append('status', 'COMPLETED');
      params.append('withoutReview', 'true');

      const response = await api.get(`/marketplace/bookings/organizer?${params.toString()}`);
      return response.data.bookings as CompletedBooking[];
    },
  });

  const handleWriteReview = (booking: CompletedBooking) => {
    setSelectedBooking(booking);
    setShowReviewModal(true);
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`${sizeClass} ${
              i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'my-reviews', name: 'My Reviews', count: reviews?.length || 0 },
            { id: 'pending-reviews', name: 'Pending Reviews', count: pendingReviews?.length || 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
              {tab.count > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* My Reviews Tab */}
      {activeTab === 'my-reviews' && (
        <div className="space-y-4">
          {reviewsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : reviews && reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {review.booking.serviceListing.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {review.vendor.businessName}
                      {review.vendor.verificationStatus === 'VERIFIED' && (
                        <svg className="inline ml-1 w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{review.booking.serviceListing.category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</span>
                      <span>•</span>
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      {review.verifiedPurchase && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 font-medium">Verified Purchase</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {renderStars(review.rating, 'md')}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                  <p className="text-gray-700">{review.comment}</p>
                </div>

                {/* Detailed Ratings */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">Service Quality</p>
                    {renderStars(review.serviceQuality)}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">Communication</p>
                    {renderStars(review.communication)}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">Timeliness</p>
                    {renderStars(review.timeliness)}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">Value</p>
                    {renderStars(review.value)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className={`text-sm ${review.wouldRecommend ? 'text-green-600' : 'text-red-600'}`}>
                      {review.wouldRecommend ? '✓ Would recommend' : '✗ Would not recommend'}
                    </span>
                    {review.helpful > 0 && (
                      <span className="text-sm text-gray-500">
                        {review.helpful} found this helpful
                      </span>
                    )}
                  </div>
                </div>

                {/* Vendor Response */}
                {review.vendorResponse && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="text-sm font-medium text-blue-900">Response from {review.vendor.businessName}</span>
                      <span className="ml-2 text-xs text-blue-600">
                        {new Date(review.vendorResponseAt!).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-blue-800">{review.vendorResponse}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600">You haven't written any reviews for vendors yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Pending Reviews Tab */}
      {activeTab === 'pending-reviews' && (
        <div className="space-y-4">
          {pendingLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : pendingReviews && pendingReviews.length > 0 ? (
            pendingReviews.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {booking.serviceListing.title}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Vendor:</span> {booking.vendor.businessName}
                        {booking.vendor.verificationStatus === 'VERIFIED' && (
                          <svg className="inline ml-1 w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </p>
                      <p>
                        <span className="font-medium">Category:</span> {booking.serviceListing.category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p>
                        <span className="font-medium">Service Date:</span> {new Date(booking.serviceDate).toLocaleDateString()}
                      </p>
                      {booking.finalPrice && (
                        <p>
                          <span className="font-medium">Final Price:</span> {booking.currency} {booking.finalPrice.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ml-6">
                    <button
                      onClick={() => handleWriteReview(booking)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Write Review
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending reviews</h3>
              <p className="text-gray-600">All your completed bookings have been reviewed.</p>
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedBooking && (
        <ReviewModal
          booking={selectedBooking}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedBooking(null);
          }}
          onReviewSubmitted={() => {
            refetchReviews();
            refetchPending();
          }}
        />
      )}
    </div>
  );
};

// Review Modal Component
interface ReviewModalProps {
  booking: CompletedBooking;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ booking, onClose, onReviewSubmitted }) => {
  const [reviewData, setReviewData] = useState({
    rating: 5,
    title: '',
    comment: '',
    serviceQuality: 5,
    communication: 5,
    timeliness: 5,
    value: 5,
    wouldRecommend: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingChange = (field: string, rating: number) => {
    setReviewData(prev => ({ ...prev, [field]: rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post('/marketplace/reviews', {
        bookingId: booking.id,
        vendorId: booking.vendor.id,
        ...reviewData
      });

      alert('Review submitted successfully!');
      onReviewSubmitted();
      onClose();
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRatingInput = (label: string, field: string, value: number) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => handleRatingChange(field, rating)}
            className={`w-8 h-8 ${
              rating <= value ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400 transition-colors`}
          >
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">{value}/5</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Write Review</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Service Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">{booking.serviceListing.title}</h3>
            <p className="text-sm text-gray-600">{booking.vendor.businessName}</p>
            <p className="text-sm text-gray-600">Service Date: {new Date(booking.serviceDate).toLocaleDateString()}</p>
          </div>

          {/* Review Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Overall Rating */}
            {renderRatingInput('Overall Rating', 'rating', reviewData.rating)}

            {/* Review Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Title *
              </label>
              <input
                type="text"
                required
                placeholder="Summarize your experience..."
                value={reviewData.title}
                onChange={(e) => setReviewData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Review Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Share details about your experience with this vendor..."
                value={reviewData.comment}
                onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Detailed Ratings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderRatingInput('Service Quality', 'serviceQuality', reviewData.serviceQuality)}
              {renderRatingInput('Communication', 'communication', reviewData.communication)}
              {renderRatingInput('Timeliness', 'timeliness', reviewData.timeliness)}
              {renderRatingInput('Value for Money', 'value', reviewData.value)}
            </div>

            {/* Would Recommend */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Would you recommend this vendor?
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={reviewData.wouldRecommend}
                    onChange={() => setReviewData(prev => ({ ...prev, wouldRecommend: true }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!reviewData.wouldRecommend}
                    onChange={() => setReviewData(prev => ({ ...prev, wouldRecommend: false }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">No</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewRatingUI;