import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VendorBooking {
  id: string;
  vendor_id: string;
  event_id: string | null;
  event_name: string;
  event_date: string;
  status: string;
  requirements: string | null;
  quoted_price: number | null;
  final_price: number | null;
  vendor_notes: string | null;
  vendors?: {
    id: string;
    business_name: string;
    contact_email: string;
    contact_phone: string | null;
  };
  vendor_services?: {
    id: string;
    name: string;
    category: string;
  } | null;
}

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'DELIVERABLE' | 'MILESTONE' | 'COMMUNICATION' | 'BOOKING';
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  vendorName?: string;
  bookingId?: string;
}

interface VendorCoordinationProps {
  eventId: string;
}

const VendorCoordination: React.FC<VendorCoordinationProps> = ({ eventId }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'communications' | 'bookings'>('timeline');
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const queryClient = useQueryClient();

  // Fetch vendor bookings for this event
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['vendor-coordination-bookings', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_bookings')
        .select(`
          *,
          vendors (id, business_name, contact_email, contact_phone),
          vendor_services (id, name, category)
        `)
        .eq('event_id', eventId)
        .in('status', ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'QUOTE_ACCEPTED'])
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error fetching bookings:', error);
        return [];
      }

      return (data || []) as VendorBooking[];
    },
  });

  // Build timeline from bookings and milestones
  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['vendor-timeline', eventId],
    queryFn: async () => {
      const events: TimelineEvent[] = [];

      // Add booking events to timeline
      if (bookings) {
        bookings.forEach((booking) => {
          events.push({
            id: `booking-${booking.id}`,
            title: booking.vendor_services?.name || `Service from ${booking.vendors?.business_name}`,
            description: booking.requirements || 'No requirements specified',
            date: booking.event_date,
            type: 'BOOKING',
            status: booking.status === 'COMPLETED' ? 'COMPLETED' : 
                   booking.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'UPCOMING',
            vendorName: booking.vendors?.business_name,
            bookingId: booking.id,
          });
        });
      }

      // Fetch workspace milestones if available
      const { data: milestones } = await supabase
        .from('workspace_milestones')
        .select('id, title, description, due_date, status')
        .order('due_date', { ascending: true })
        .limit(20);

      if (milestones) {
        milestones.forEach(m => {
          events.push({
            id: m.id,
            title: m.title,
            description: m.description || '',
            date: m.due_date || new Date().toISOString(),
            type: 'MILESTONE',
            status: m.status === 'COMPLETED' ? 'COMPLETED' : 
                   m.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'UPCOMING',
          });
        });
      }

      // Sort by date
      return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },
    enabled: !!bookings,
  });

  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { error } = await supabase
        .from('vendor_bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-coordination-bookings', eventId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-timeline', eventId] });
      toast.success('Status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  // Add vendor note mutation
  const addNoteMutation = useMutation({
    mutationFn: async ({ bookingId, notes }: { bookingId: string; notes: string }) => {
      const { error } = await supabase
        .from('vendor_bookings')
        .update({ vendor_notes: notes, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-coordination-bookings', eventId] });
      setNewMessage('');
      toast.success('Notes added');
    },
    onError: () => {
      toast.error('Failed to add notes');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'UPCOMING':
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'BOOKING':
        return '📦';
      case 'MILESTONE':
        return '🎯';
      case 'COMMUNICATION':
        return '💬';
      default:
        return '📋';
    }
  };

  const handleAddNote = (bookingId: string) => {
    if (newMessage.trim()) {
      addNoteMutation.mutate({ bookingId, notes: newMessage.trim() });
    }
  };

  if (bookingsLoading || timelineLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const confirmedBookings = bookings || [];

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
            { id: 'bookings', name: 'Active Bookings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
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
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getStatusColor(event.status)}`}>
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
                      <span>📅 {event.date ? new Date(event.date).toLocaleDateString() : 'TBD'}</span>
                      {event.vendorName && (
                        <span>🏢 {event.vendorName}</span>
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
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring bg-background"
            >
              <option value="">Choose a vendor...</option>
              {confirmedBookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.vendors?.business_name} - {booking.vendor_services?.name || booking.event_name}
                </option>
              ))}
            </select>
          </div>

          {/* Contact Info & Notes */}
          {selectedBooking && (
            <div className="space-y-4">
              {(() => {
                const booking = confirmedBookings.find(b => b.id === selectedBooking);
                if (!booking) return null;

                return (
                  <>
                    {/* Contact Info */}
                    <div className="bg-card border border-border rounded-lg p-4">
                      <h4 className="font-medium text-foreground mb-3">
                        Contact: {booking.vendors?.business_name}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Email:</span>{' '}
                          <a href={`mailto:${booking.vendors?.contact_email}`} className="text-primary hover:underline">
                            {booking.vendors?.contact_email}
                          </a>
                        </p>
                        {booking.vendors?.contact_phone && (
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Phone:</span>{' '}
                            <a href={`tel:${booking.vendors?.contact_phone}`} className="text-primary hover:underline">
                              {booking.vendors?.contact_phone}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Current Notes */}
                    {booking.vendor_notes && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-foreground mb-2">Current Notes:</h5>
                        <p className="text-sm text-muted-foreground">{booking.vendor_notes}</p>
                      </div>
                    )}

                    {/* Add Notes Input */}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Add notes about this booking..."
                        className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring bg-background"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddNote(selectedBooking);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleAddNote(selectedBooking)}
                        disabled={!newMessage.trim() || addNoteMutation.isPending}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                      >
                        {addNoteMutation.isPending ? 'Saving...' : 'Save Notes'}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {confirmedBookings.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No confirmed vendor bookings yet. Communications will be available once vendors are confirmed.</p>
            </div>
          )}
        </div>
      )}

      {/* Active Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {confirmedBookings.length > 0 ? (
            confirmedBookings.map((booking) => (
              <div key={booking.id} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-foreground">
                    {booking.vendors?.business_name}
                  </h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status === 'COMPLETED' ? 'COMPLETED' : booking.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'UPCOMING')}`}>
                    {booking.status.replace('_', ' ').toLowerCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Service:</span> {booking.vendor_services?.name || 'General Service'}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Event Date:</span> {new Date(booking.event_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    {booking.final_price && (
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Final Price:</span> ₹{booking.final_price.toLocaleString()}
                      </p>
                    )}
                    {booking.requirements && (
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Requirements:</span> {booking.requirements}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Update Buttons */}
                <div className="flex gap-2">
                  {booking.status === 'QUOTE_ACCEPTED' && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ bookingId: booking.id, status: 'CONFIRMED' })}
                      className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                    >
                      Confirm Booking
                    </button>
                  )}
                  {booking.status === 'CONFIRMED' && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ bookingId: booking.id, status: 'IN_PROGRESS' })}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Start Work
                    </button>
                  )}
                  {booking.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ bookingId: booking.id, status: 'COMPLETED' })}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
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
