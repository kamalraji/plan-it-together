import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, FileText, MessageSquare } from 'lucide-react';
import { BookingStatus, getStatusText, formatCategory } from './types';
import { useToast } from '@/hooks/use-toast';

interface BookingManagementUIProps {
  eventId?: string;
}

// Database booking type matching vendor_bookings table
interface DatabaseBooking {
  id: string;
  vendor_id: string;
  service_id: string | null;
  organizer_id: string;
  event_id: string | null;
  event_name: string;
  event_date: string;
  event_location: string | null;
  guest_count: number | null;
  requirements: string | null;
  budget_min: number | null;
  budget_max: number | null;
  quoted_price: number | null;
  final_price: number | null;
  status: string;
  organizer_name: string;
  organizer_email: string;
  organizer_phone: string | null;
  vendor_notes: string | null;
  created_at: string;
  updated_at: string;
  vendors?: {
    id: string;
    business_name: string;
    verification_status: string;
  };
  vendor_services?: {
    id: string;
    name: string;
    category: string;
    base_price: number | null;
    pricing_type: string;
  } | null;
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'PENDING':
    case 'VENDOR_REVIEWING':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'QUOTE_SENT':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'QUOTE_ACCEPTED':
    case 'CONFIRMED':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'IN_PROGRESS':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    case 'COMPLETED':
      return 'bg-muted text-muted-foreground';
    case 'CANCELLED':
    case 'DISPUTED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const BookingManagementUI: React.FC<BookingManagementUIProps> = ({ eventId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Fetch bookings from vendor_bookings table
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['organizer-bookings', eventId, statusFilter],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('vendor_bookings')
        .select(`
          *,
          vendors (id, business_name, verification_status),
          vendor_services (id, name, category, base_price, pricing_type)
        `)
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      if (statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching bookings:', error);
        return [];
      }

      return (data || []) as DatabaseBooking[];
    },
  });

  // Accept quote mutation
  const acceptQuoteMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('vendor_bookings')
        .update({ status: 'QUOTE_ACCEPTED', updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-bookings'] });
      toast({ title: 'Quote accepted', description: 'The quote has been accepted successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to accept quote. Please try again.', variant: 'destructive' });
    },
  });

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('vendor_bookings')
        .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-bookings'] });
      toast({ title: 'Booking cancelled', description: 'The booking has been cancelled.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to cancel booking. Please try again.', variant: 'destructive' });
    },
  });

  const handleAcceptQuote = (bookingId: string) => {
    acceptQuoteMutation.mutate(bookingId);
  };

  const handleCancelBooking = (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    cancelBookingMutation.mutate(bookingId);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-border/60">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-medium text-foreground">My Bookings</h2>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground whitespace-nowrap">Filter by status:</Label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {Object.values(BookingStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusText(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : bookings && bookings.length > 0 ? (
          bookings.map((booking) => (
            <Card key={booking.id} className="border-border/60">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-foreground truncate">
                        {booking.vendor_services?.name || booking.event_name}
                      </h3>
                      <Badge className={getStatusVariant(booking.status)}>
                        {getStatusText(booking.status as BookingStatus)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Vendor:</span> {booking.vendors?.business_name}
                          {booking.vendors?.verification_status === 'verified' && (
                            <CheckCircle className="inline ml-1 h-4 w-4 text-emerald-500" />
                          )}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Event Date:</span> {new Date(booking.event_date).toLocaleDateString()}
                        </p>
                        {booking.vendor_services?.category && (
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Category:</span> {formatCategory(booking.vendor_services.category)}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        {(booking.budget_min || booking.budget_max) && (
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Budget:</span> ₹{booking.budget_min?.toLocaleString()} - ₹{booking.budget_max?.toLocaleString()}
                          </p>
                        )}
                        {booking.quoted_price && (
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Quoted:</span> ₹{booking.quoted_price.toLocaleString()}
                          </p>
                        )}
                        {booking.final_price && (
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Final:</span> ₹{booking.final_price.toLocaleString()}
                          </p>
                        )}
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Created:</span> {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {booking.requirements && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-foreground mb-1">Requirements:</p>
                        <p className="text-sm text-muted-foreground">{booking.requirements}</p>
                      </div>
                    )}

                    {booking.vendor_notes && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Vendor Notes
                        </p>
                        <p className="text-sm text-muted-foreground">{booking.vendor_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2 shrink-0">
                    {booking.status === 'QUOTE_SENT' && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleAcceptQuote(booking.id)}
                        disabled={acceptQuoteMutation.isPending}
                      >
                        Accept Quote
                      </Button>
                    )}

                    {['PENDING', 'VENDOR_REVIEWING', 'QUOTE_SENT'].includes(booking.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancelBookingMutation.isPending}
                      >
                        Cancel
                      </Button>
                    )}

                    {booking.status === 'COMPLETED' && (
                      <Button size="sm">
                        Leave Review
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No bookings found</h3>
            <p className="text-muted-foreground">
              {statusFilter === 'ALL' 
                ? "You haven't made any service bookings yet."
                : `No bookings with status "${getStatusText(statusFilter as BookingStatus)}".`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingManagementUI;
