import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

interface BookingRequest {
  id: string;
  eventId: string;
  serviceListingId: string;
  organizerId: string;
  vendorId: string;
  status: BookingStatus;
  serviceDate: string;
  requirements: string;
  budgetRange?: {
    min: number;
    max: number;
  };
  quotedPrice?: number;
  finalPrice?: number;
  additionalNotes?: string;
  messages: BookingMessage[];
  serviceListing: {
    id: string;
    title: string;
    category: string;
    pricing: {
      type: string;
      basePrice?: number;
      currency: string;
    };
  };
  vendor: {
    id: string;
    businessName: string;
    verificationStatus: string;
    rating: number;
    reviewCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

enum BookingStatus {
  PENDING = 'PENDING',
  VENDOR_REVIEWING = 'VENDOR_REVIEWING',
  QUOTE_SENT = 'QUOTE_SENT',
  QUOTE_ACCEPTED = 'QUOTE_ACCEPTED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED'
}

interface BookingMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderType: 'ORGANIZER' | 'VENDOR';
  message: string;
  sentAt: string;
}

interface BookingManagementUIProps {
  eventId?: string;
}

const BookingManagementUI: React.FC<BookingManagementUIProps> = ({ eventId }) => {
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [showMessageModal, setShowMessageModal] = useState(false);

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['organizer-bookings', eventId, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (eventId) params.append('eventId', eventId);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const response = await api.get(`/marketplace/bookings/organizer?${params.toString()}`);
      return response.data.bookings as BookingRequest[];
    },
  });

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING:
      case BookingStatus.VENDOR_REVIEWING:
        return 'bg-yellow-100 text-yellow-800';
      case BookingStatus.QUOTE_SENT:
        return 'bg-blue-100 text-blue-800';
      case BookingStatus.QUOTE_ACCEPTED:
      case BookingStatus.CONFIRMED:
        return 'bg-green-100 text-green-800';
      case BookingStatus.IN_PROGRESS:
        return 'bg-purple-100 text-purple-800';
      case BookingStatus.COMPLETED:
        return 'bg-gray-100 text-gray-800';
      case BookingStatus.CANCELLED:
      case BookingStatus.DISPUTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: BookingStatus) => {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleAcceptQuote = async (bookingId: string) => {
    try {
      await api.patch(`/marketplace/bookings/${bookingId}/accept-quote`);
      refetch();
    } catch (error) {
      console.error('Failed to accept quote:', error);
      alert('Failed to accept quote. Please try again.');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await api.patch(`/marketplace/bookings/${bookingId}/cancel`);
      refetch();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">My Bookings</h2>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'ALL')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              {Object.values(BookingStatus).map((status) => (
                <option key={status} value={status}>
                  {getStatusText(status)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : bookings && bookings.length > 0 ? (
          bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {booking.serviceListing.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Vendor:</span> {booking.vendor.businessName}
                        {booking.vendor.verificationStatus === 'VERIFIED' && (
                          <svg className="inline ml-1 w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Service Date:</span> {new Date(booking.serviceDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Category:</span> {booking.serviceListing.category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>
                    <div>
                      {booking.budgetRange && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Budget Range:</span> {booking.serviceListing.pricing.currency} {booking.budgetRange.min.toLocaleString()} - {booking.budgetRange.max.toLocaleString()}
                        </p>
                      )}
                      {booking.quotedPrice && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Quoted Price:</span> {booking.serviceListing.pricing.currency} {booking.quotedPrice.toLocaleString()}
                        </p>
                      )}
                      {booking.finalPrice && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Final Price:</span> {booking.serviceListing.pricing.currency} {booking.finalPrice.toLocaleString()}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Created:</span> {new Date(booking.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Requirements:</p>
                    <p className="text-sm text-gray-600">{booking.requirements}</p>
                  </div>

                  {booking.additionalNotes && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Additional Notes:</p>
                      <p className="text-sm text-gray-600">{booking.additionalNotes}</p>
                    </div>
                  )}

                  {/* Messages Preview */}
                  {booking.messages.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Recent Messages ({booking.messages.length})
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">
                            {booking.messages[booking.messages.length - 1].senderType === 'ORGANIZER' ? 'You' : booking.vendor.businessName}:
                          </span>
                          <span className="ml-2">
                            {booking.messages[booking.messages.length - 1].message.length > 100
                              ? `${booking.messages[booking.messages.length - 1].message.substring(0, 100)}...`
                              : booking.messages[booking.messages.length - 1].message
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="ml-6 flex flex-col space-y-2">
                  <button
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowMessageModal(true);
                    }}
                    className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    View Messages
                  </button>

                  {booking.status === BookingStatus.QUOTE_SENT && (
                    <button
                      onClick={() => handleAcceptQuote(booking.id)}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Accept Quote
                    </button>
                  )}

                  {[BookingStatus.PENDING, BookingStatus.VENDOR_REVIEWING, BookingStatus.QUOTE_SENT].includes(booking.status) && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="px-4 py-2 text-sm border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
                    >
                      Cancel
                    </button>
                  )}

                  {booking.status === BookingStatus.COMPLETED && (
                    <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      Leave Review
                    </button>
                  )}
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">
              {statusFilter === 'ALL' 
                ? "You haven't made any service bookings yet."
                : `No bookings with status "${getStatusText(statusFilter as BookingStatus)}".`
              }
            </p>
          </div>
        )}
      </div>

      {/* Message Modal */}
      {showMessageModal && selectedBooking && (
        <MessageModal
          booking={selectedBooking}
          onClose={() => {
            setShowMessageModal(false);
            setSelectedBooking(null);
          }}
          onMessageSent={() => refetch()}
        />
      )}
    </div>
  );
};

// Message Modal Component
interface MessageModalProps {
  booking: BookingRequest;
  onClose: () => void;
  onMessageSent: () => void;
}

const MessageModal: React.FC<MessageModalProps> = ({ booking, onClose, onMessageSent }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post(`/marketplace/bookings/${booking.id}/messages`, {
        message: newMessage.trim()
      });

      setNewMessage('');
      onMessageSent();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{booking.serviceListing.title}</h2>
              <p className="text-sm text-gray-600">{booking.vendor.businessName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {booking.messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            booking.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderType === 'ORGANIZER' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderType === 'ORGANIZER'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    message.senderType === 'ORGANIZER' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(message.sentAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="p-6 border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingManagementUI;