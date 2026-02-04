import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  CalendarCheck, 
  Store, 
  Clock, 
  FileText, 
  CheckCircle,
  XCircle,
  DollarSign,
  MapPin,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Booking {
  id: string;
  vendor_id: string;
  service_id: string | null;
  event_name: string;
  event_date: string;
  event_location: string | null;
  guest_count: number | null;
  requirements: string | null;
  budget_min: number | null;
  budget_max: number | null;
  status: string;
  quoted_price: number | null;
  final_price: number | null;
  vendor_notes: string | null;
  created_at: string;
  vendor: {
    id: string;
    business_name: string;
    contact_email: string;
    contact_phone: string | null;
    city: string | null;
    state: string | null;
  };
  service: {
    id: string;
    name: string;
    category: string;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: string; icon: React.ReactNode }> = {
  PENDING: { 
    label: 'Pending', 
    variant: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    icon: <Clock className="h-3 w-3" />
  },
  REVIEWING: { 
    label: 'Under Review', 
    variant: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    icon: <FileText className="h-3 w-3" />
  },
  QUOTE_SENT: { 
    label: 'Quote Received', 
    variant: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    icon: <DollarSign className="h-3 w-3" />
  },
  ACCEPTED: { 
    label: 'Accepted', 
    variant: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: <CheckCircle className="h-3 w-3" />
  },
  DECLINED: { 
    label: 'Declined', 
    variant: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: <XCircle className="h-3 w-3" />
  },
  COMPLETED: { 
    label: 'Completed', 
    variant: 'bg-muted text-muted-foreground',
    icon: <CheckCircle className="h-3 w-3" />
  },
  CANCELLED: { 
    label: 'Cancelled', 
    variant: 'bg-muted text-muted-foreground',
    icon: <XCircle className="h-3 w-3" />
  },
};

const OrganizerBookingsManager: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch organizer's bookings
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['organizer-bookings', user?.id, statusFilter],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('vendor_bookings')
        .select(`
          *,
          vendor:vendors(id, business_name, contact_email, contact_phone, city, state),
          service:vendor_services(id, name, category)
        `)
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!user?.id,
  });

  // Accept quote mutation
  const acceptQuoteMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('vendor_bookings')
        .update({ 
          status: 'ACCEPTED',
          final_price: selectedBooking?.quoted_price,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .eq('organizer_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-bookings'] });
      toast.success('Quote accepted successfully');
      setShowDetailsModal(false);
    },
    onError: () => {
      toast.error('Failed to accept quote');
    },
  });

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('vendor_bookings')
        .update({ 
          status: 'CANCELLED',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .eq('organizer_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-bookings'] });
      toast.success('Booking cancelled');
      setShowDetailsModal(false);
    },
    onError: () => {
      toast.error('Failed to cancel booking');
    },
  });

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleAcceptQuote = () => {
    if (selectedBooking) {
      acceptQuoteMutation.mutate(selectedBooking.id);
    }
  };

  const handleCancelBooking = () => {
    if (selectedBooking && confirm('Are you sure you want to cancel this booking?')) {
      cancelMutation.mutate(selectedBooking.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-primary" />
                My Vendor Bookings
              </CardTitle>
              <CardDescription>
                Track and manage your quote requests to vendors
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {bookings && bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
                
                return (
                  <div
                    key={booking.id}
                    className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Store className="h-5 w-5 text-primary shrink-0" />
                          <h3 className="font-semibold text-foreground truncate">
                            {booking.vendor?.business_name || 'Unknown Vendor'}
                          </h3>
                          <Badge className={statusConfig.variant}>
                            {statusConfig.icon}
                            <span className="ml-1">{statusConfig.label}</span>
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarCheck className="h-4 w-4" />
                            <span>Event: {booking.event_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Date: {format(new Date(booking.event_date), 'PPP')}</span>
                          </div>
                          {booking.service && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <span>Service: {booking.service.name}</span>
                            </div>
                          )}
                          {booking.quoted_price && (
                            <div className="flex items-center gap-2 text-foreground font-medium">
                              <DollarSign className="h-4 w-4 text-emerald-600" />
                              <span>Quote: ₹{booking.quoted_price.toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        {booking.vendor_notes && booking.status === 'QUOTE_SENT' && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Vendor Notes:</p>
                            <p className="text-sm text-foreground">{booking.vendor_notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(booking)}
                        >
                          View Details
                        </Button>
                        {booking.status === 'QUOTE_SENT' && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => {
                              setSelectedBooking(booking);
                              handleAcceptQuote();
                            }}
                          >
                            Accept Quote
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No bookings found</h3>
              <p className="text-sm text-muted-foreground">
                {statusFilter === 'ALL'
                  ? "You haven't sent any quote requests to vendors yet."
                  : `No bookings with status "${STATUS_CONFIG[statusFilter]?.label}".`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              {/* Vendor Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Store className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {selectedBooking.vendor?.business_name}
                    </h3>
                    {selectedBooking.vendor?.city && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedBooking.vendor.city}, {selectedBooking.vendor.state}
                      </p>
                    )}
                  </div>
                  <Badge className={STATUS_CONFIG[selectedBooking.status]?.variant || 'bg-muted'}>
                    {STATUS_CONFIG[selectedBooking.status]?.label || selectedBooking.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Email:</span> {selectedBooking.vendor?.contact_email}
                  </p>
                  {selectedBooking.vendor?.contact_phone && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Phone:</span> {selectedBooking.vendor.contact_phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Event Details */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Event Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Event Name</p>
                    <p className="font-medium text-foreground">{selectedBooking.event_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Event Date</p>
                    <p className="font-medium text-foreground">
                      {format(new Date(selectedBooking.event_date), 'PPP')}
                    </p>
                  </div>
                  {selectedBooking.event_location && (
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="font-medium text-foreground">{selectedBooking.event_location}</p>
                    </div>
                  )}
                  {selectedBooking.guest_count && (
                    <div>
                      <p className="text-muted-foreground">Guest Count</p>
                      <p className="font-medium text-foreground">{selectedBooking.guest_count}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Service & Pricing */}
              {selectedBooking.service && (
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Service</h4>
                  <p className="text-sm text-foreground">
                    {selectedBooking.service.name} ({selectedBooking.service.category})
                  </p>
                </div>
              )}

              {/* Budget & Quote */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Pricing</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {(selectedBooking.budget_min || selectedBooking.budget_max) && (
                    <div>
                      <p className="text-muted-foreground">Your Budget</p>
                      <p className="font-medium text-foreground">
                        ₹{selectedBooking.budget_min?.toLocaleString()} - ₹{selectedBooking.budget_max?.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedBooking.quoted_price && (
                    <div>
                      <p className="text-muted-foreground">Vendor's Quote</p>
                      <p className="font-medium text-emerald-600 text-lg">
                        ₹{selectedBooking.quoted_price.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedBooking.final_price && (
                    <div>
                      <p className="text-muted-foreground">Final Price</p>
                      <p className="font-medium text-foreground">
                        ₹{selectedBooking.final_price.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Requirements */}
              {selectedBooking.requirements && (
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Your Requirements</h4>
                  <p className="text-sm text-muted-foreground">{selectedBooking.requirements}</p>
                </div>
              )}

              {/* Vendor Notes */}
              {selectedBooking.vendor_notes && (
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Vendor Notes</h4>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-foreground">{selectedBooking.vendor_notes}</p>
                  </div>
                </div>
              )}

              {/* Quote Received Alert */}
              {selectedBooking.status === 'QUOTE_SENT' && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-purple-800 dark:text-purple-300">Quote Received</p>
                      <p className="text-sm text-purple-700 dark:text-purple-400">
                        The vendor has sent you a quote of ₹{selectedBooking.quoted_price?.toLocaleString()}. 
                        Accept to confirm the booking.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedBooking?.status === 'QUOTE_SENT' && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleAcceptQuote}
                disabled={acceptQuoteMutation.isPending}
              >
                {acceptQuoteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Accept Quote
              </Button>
            )}
            {['PENDING', 'REVIEWING', 'QUOTE_SENT'].includes(selectedBooking?.status || '') && (
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleCancelBooking}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Cancel Booking
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrganizerBookingsManager;
