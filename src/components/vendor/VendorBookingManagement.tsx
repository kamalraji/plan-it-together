import React, { useState, useEffect } from 'react';

interface BookingRequest {
  id: string;
  eventId: string;
  eventName: string;
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  serviceListingId: string;
  serviceTitle: string;
  status: 'PENDING' | 'VENDOR_REVIEWING' | 'QUOTE_SENT' | 'QUOTE_ACCEPTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  serviceDate: Date;
  requirements: string;
  budgetRange?: {
    min: number;
    max: number;
  };
  quotedPrice?: number;
  finalPrice?: number;
  additionalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface BookingMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  senderType: 'ORGANIZER' | 'VENDOR';
  message: string;
  sentAt: Date;
}

interface VendorBookingManagementProps {
  vendorId: string;
}

const VendorBookingManagement: React.FC<VendorBookingManagementProps> = ({ vendorId }) => {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [quotedPrice, setQuotedPrice] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'completed'>('all');

  useEffect(() => {
    fetchBookings();
  }, [vendorId]);

  useEffect(() => {
    if (selectedBooking) {
      fetchMessages(selectedBooking.id);
    }
  }, [selectedBooking]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/vendors/${vendorId}/bookings`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/messages`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.data);
    } catch (err: any) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string, quotedPrice?: number) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status,
          ...(quotedPrice && { quotedPrice })
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }

      await fetchBookings();
      if (selectedBooking?.id === bookingId) {
        const updatedBooking = bookings.find(b => b.id === bookingId);
        if (updatedBooking) {
          setSelectedBooking({ ...updatedBooking, status: status as any, quotedPrice });
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const sendMessage = async () => {
    if (!selectedBooking || !newMessage.trim()) return;

    try {
      const response = await fetch(`/api/bookings/${selectedBooking.id}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage('');
      await fetchMessages(selectedBooking.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'VENDOR_REVIEWING':
        return 'bg-yellow-100 text-yellow-800';
      case 'QUOTE_SENT':
        return 'bg-blue-100 text-blue-800';
      case 'QUOTE_ACCEPTED':
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      case 'DISPUTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFilteredBookings = () => {
    switch (activeTab) {
      case 'pending':
        return bookings.filter(b => ['PENDING', 'VENDOR_REVIEWING', 'QUOTE_SENT'].includes(b.status));
      case 'active':
        return bookings.filter(b => ['QUOTE_ACCEPTED', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status));
      case 'completed':
        return bookings.filter(b => ['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(b.status));
      default:
        return bookings;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading bookings</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchBookings}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
          <p className="mt-1 text-gray-600">
            Manage your service bookings and communicate with organizers
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'all', name: 'All Bookings', count: bookings.length },
            { id: 'pending', name: 'Pending', count: bookings.filter(b => ['PENDING', 'VENDOR_REVIEWING', 'QUOTE_SENT'].includes(b.status)).length },
            { id: 'active', name: 'Active', count: bookings.filter(b => ['QUOTE_ACCEPTED', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)).length },
            { id: 'completed', name: 'Completed', count: bookings.filter(b => ['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(b.status)).length },
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
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bookings List */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Bookings
              </h3>
              
              {getFilteredBookings().length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No bookings found for this category.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getFilteredBookings().map((booking) => (
                    <div
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        selectedBooking?.id === booking.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{booking.serviceTitle}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{booking.eventName}</p>
                      <p className="text-sm text-gray-500">{booking.organizerName}</p>
                      <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                        <span>{new Date(booking.serviceDate).toLocaleDateString()}</span>
                        {booking.budgetRange && (
                          <span>${booking.budgetRange.min} - ${booking.budgetRange.max}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="lg:col-span-2">
          {selectedBooking ? (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{selectedBooking.serviceTitle}</h3>
                    <p className="text-sm text-gray-600">{selectedBooking.eventName}</p>
                  </div>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Booking Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Event Details</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Event:</span> {selectedBooking.eventName}</p>
                      <p><span className="font-medium">Date:</span> {new Date(selectedBooking.serviceDate).toLocaleDateString()}</p>
                      <p><span className="font-medium">Organizer:</span> {selectedBooking.organizerName}</p>
                      <p><span className="font-medium">Email:</span> {selectedBooking.organizerEmail}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Pricing</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      {selectedBooking.budgetRange && (
                        <p><span className="font-medium">Budget Range:</span> ${selectedBooking.budgetRange.min} - ${selectedBooking.budgetRange.max}</p>
                      )}
                      {selectedBooking.quotedPrice && (
                        <p><span className="font-medium">Quoted Price:</span> ${selectedBooking.quotedPrice}</p>
                      )}
                      {selectedBooking.finalPrice && (
                        <p><span className="font-medium">Final Price:</span> ${selectedBooking.finalPrice}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Requirements</h4>
                  <p className="text-sm text-gray-600">{selectedBooking.requirements}</p>
                  {selectedBooking.additionalNotes && (
                    <>
                      <h4 className="text-sm font-medium text-gray-900 mt-4 mb-2">Additional Notes</h4>
                      <p className="text-sm text-gray-600">{selectedBooking.additionalNotes}</p>
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                {selectedBooking.status === 'PENDING' && (
                  <div className="flex space-x-3 mb-6">
                    <button
                      onClick={() => updateBookingStatus(selectedBooking.id, 'VENDOR_REVIEWING')}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                    >
                      Start Review
                    </button>
                    <button
                      onClick={() => updateBookingStatus(selectedBooking.id, 'CANCELLED')}
                      className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700"
                    >
                      Decline
                    </button>
                  </div>
                )}

                {selectedBooking.status === 'VENDOR_REVIEWING' && (
                  <div className="mb-6">
                    <div className="flex items-end space-x-3">
                      <div className="flex-1">
                        <label htmlFor="quotedPrice" className="block text-sm font-medium text-gray-700">
                          Quote Price ($)
                        </label>
                        <input
                          type="number"
                          id="quotedPrice"
                          value={quotedPrice}
                          onChange={(e) => setQuotedPrice(e.target.value ? parseFloat(e.target.value) : '')}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter your quote"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <button
                        onClick={() => quotedPrice && updateBookingStatus(selectedBooking.id, 'QUOTE_SENT', quotedPrice as number)}
                        disabled={!quotedPrice}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Send Quote
                      </button>
                    </div>
                  </div>
                )}

                {selectedBooking.status === 'QUOTE_ACCEPTED' && (
                  <div className="flex space-x-3 mb-6">
                    <button
                      onClick={() => updateBookingStatus(selectedBooking.id, 'CONFIRMED')}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                    >
                      Confirm Booking
                    </button>
                  </div>
                )}

                {selectedBooking.status === 'CONFIRMED' && (
                  <div className="flex space-x-3 mb-6">
                    <button
                      onClick={() => updateBookingStatus(selectedBooking.id, 'IN_PROGRESS')}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                    >
                      Start Work
                    </button>
                  </div>
                )}

                {selectedBooking.status === 'IN_PROGRESS' && (
                  <div className="flex space-x-3 mb-6">
                    <button
                      onClick={() => updateBookingStatus(selectedBooking.id, 'COMPLETED')}
                      className="px-4 py-2 bg-green-600 text-white text-white text-sm font-medium rounded-md hover:bg-green-700"
                    >
                      Mark Complete
                    </button>
                  </div>
                )}

                {/* Messages */}
                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Messages</h4>
                  
                  <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderType === 'VENDOR' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderType === 'VENDOR'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <p className={`text-xs mt-1 ${
                            message.senderType === 'VENDOR' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {message.senderName} • {new Date(message.sentAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Type your message..."
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Select a booking</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose a booking from the list to view details and manage it.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorBookingManagement;