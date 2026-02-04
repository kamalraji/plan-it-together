import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

interface VendorBooking {
  id: string;
  eventId: string;
  serviceListingId: string;
  vendorId: string;
  status: 'PENDING' | 'VENDOR_REVIEWING' | 'QUOTE_SENT' | 'QUOTE_ACCEPTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  serviceDate: string;
  finalPrice?: number;
  serviceListing: {
    id: string;
    title: string;
    category: string;
  };
  vendor: {
    id: string;
    businessName: string;
    contactInfo: {
      email: string;
      phone: string;
    };
  };
  deliverables: Deliverable[];
  messages: BookingMessage[];
}

interface Deliverable {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  completedAt?: string;
}

interface BookingMessage {
  id: string;
  senderId: string;
  senderType: 'ORGANIZER' | 'VENDOR';
  message: string;
  sentAt: string;
  attachments?: Array<{
    id: string;
    url: string;
    filename: string;
  }>;
}

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'DELIVERABLE' | 'MILESTONE' | 'COMMUNICATION' | 'SETUP';
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  vendorId?: string;
  bookingId?: string;
}

interface VendorCoordinationProps {
  eventId: string;
}

const VendorCoordination: React.FC<VendorCoordinationProps> = ({ eventId }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'communications' | 'deliverables'>('timeline');
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const queryClient = useQueryClient();

  // Fetch vendor bookings for this event
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['vendor-bookings', eventId],
    queryFn: async () => {
      const response = await api.get(`/marketplace/bookings/event/${eventId}`);
      return response.data.bookings as VendorBooking[];
    },
  });

  // Fetch integrated timeline
  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['vendor-timeline', eventId],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}/vendor-timeline`);
      return response.data.timeline as TimelineEvent[];
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ bookingId, message }: { bookingId: string; message: string }) => {
      await api.post(`/marketplace/bookings/${bookingId}/messages`, { message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-bookings', eventId] });
      setNewMessage('');
    },
  });

  // Update deliverable status mutation
  const updateDeliverableMutation = useMutation({
    mutationFn: async ({ deliverableId, status }: { deliverableId: string; status: string }) => {
      await api.patch(`/marketplace/deliverables/${deliverableId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-bookings', eventId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-timeline', eventId] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'DELIVERABLE':
        return 'D';
      case 'MILESTONE':
        return 'M';
      case 'COMMUNICATION':
        return 'C';
      case 'SETUP':
        return 'S';
      default:
        return 'T';
    }
  };

  const handleSendMessage = (bookingId: string) => {
    if (newMessage.trim()) {
      sendMessageMutation.mutate({ bookingId, message: newMessage });
    }
  };

  if (bookingsLoading || timelineLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const confirmedBookings = bookings?.filter(b => 
    ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status)
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Vendor Coordination
        </h3>
        <p className="text-sm text-muted-foreground">
          Manage vendor timelines, deliverables, and communications
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'timeline', name: 'Timeline' },
            { id: 'communications', name: 'Communications' },
            { id: 'deliverables', name: 'Deliverables' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-input'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          {timeline && timeline.length > 0 ? (
            <div className="space-y-4">
              {timeline.map((event) => (
                <div key={event.id} className="flex items-start space-x-4 p-4 bg-card border border-border rounded-lg">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${getStatusColor(event.status)}`}>
                      {getTimelineIcon(event.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-foreground">
                        {event.title}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.status.replace('_', ' ').toLowerCase()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span>Due: {new Date(event.date).toLocaleDateString()}</span>
                      {event.vendorId && (
                        <span>
                          Vendor: {confirmedBookings.find(b => b.vendorId === event.vendorId)?.vendor.businessName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No timeline events yet. Timeline will populate as vendors are confirmed.</p>
            </div>
          )}
        </div>
      )}

      {/* Communications Tab */}
      {activeTab === 'communications' && (
        <div className="space-y-6">
          {/* Vendor Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Vendor to Communicate With
            </label>
            <select
              value={selectedBooking || ''}
              onChange={(e) => setSelectedBooking(e.target.value || null)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring"
            >
              <option value="">Choose a vendor...</option>
              {confirmedBookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.vendor.businessName} - {booking.serviceListing.title}
                </option>
              ))}
            </select>
          </div>

          {/* Messages */}
          {selectedBooking && (
            <div className="space-y-4">
              {(() => {
                const booking = confirmedBookings.find(b => b.id === selectedBooking);
                if (!booking) return null;

                return (
                  <>
                    {/* Message History */}
                    <div className="bg-card border border-border rounded-lg p-4 max-h-96 overflow-y-auto">
                      <h4 className="font-medium text-foreground mb-4">
                        Messages with {booking.vendor.businessName}
                      </h4>
                      
                      {booking.messages.length > 0 ? (
                        <div className="space-y-3">
                          {booking.messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.senderType === 'ORGANIZER' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  message.senderType === 'ORGANIZER'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-muted text-foreground'
                                }`}
                              >
                                <p className="text-sm">{message.message}</p>
                                <p className={`text-xs mt-1 ${
                                  message.senderType === 'ORGANIZER' ? 'text-blue-100' : 'text-muted-foreground'
                                }`}>
                                  {new Date(message.sentAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSendMessage(selectedBooking);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleSendMessage(selectedBooking)}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Deliverables Tab */}
      {activeTab === 'deliverables' && (
        <div className="space-y-4">
          {confirmedBookings.length > 0 ? (
            confirmedBookings.map((booking) => (
              <div key={booking.id} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-foreground">
                    {booking.vendor.businessName}
                  </h4>
                  <span className="text-sm text-muted-foreground">
                    {booking.serviceListing.title}
                  </span>
                </div>

                {booking.deliverables.length > 0 ? (
                  <div className="space-y-3">
                    {booking.deliverables.map((deliverable) => (
                      <div key={deliverable.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <div className="flex-1">
                          <h5 className="font-medium text-foreground text-sm">
                            {deliverable.title}
                          </h5>
                          <p className="text-sm text-muted-foreground mt-1">
                            {deliverable.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {new Date(deliverable.dueDate).toLocaleDateString()}
                            {deliverable.completedAt && (
                              <span className="ml-2">
                                • Completed: {new Date(deliverable.completedAt).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deliverable.status)}`}>
                            {deliverable.status.replace('_', ' ').toLowerCase()}
                          </span>
                          {deliverable.status === 'PENDING' && (
                            <button
                              onClick={() => updateDeliverableMutation.mutate({ 
                                deliverableId: deliverable.id, 
                                status: 'IN_PROGRESS' 
                              })}
                              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                            >
                              Start
                            </button>
                          )}
                          {deliverable.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => updateDeliverableMutation.mutate({ 
                                deliverableId: deliverable.id, 
                                status: 'COMPLETED' 
                              })}
                              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No deliverables defined yet.</p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No confirmed vendor bookings yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VendorCoordination;