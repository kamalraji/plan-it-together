import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  Users, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface VendorBookingManagerProps {
  vendorId: string;
}

type BookingStatus = 'PENDING' | 'REVIEWING' | 'QUOTE_SENT' | 'QUOTE_ACCEPTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DECLINED';

interface Booking {
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
  status: BookingStatus;
  organizer_name: string;
  organizer_email: string;
  organizer_phone: string | null;
  vendor_notes: string | null;
  created_at: string;
  updated_at: string;
  vendor_services?: {
    name: string;
    category: string;
  } | null;
}

const VendorBookingManager: React.FC<VendorBookingManagerProps> = ({ vendorId }) => {
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [quotedPrice, setQuotedPrice] = useState<string>('');
  const [vendorNotes, setVendorNotes] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['vendor-bookings', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_bookings')
        .select(`
          *,
          vendor_services (
            name,
            category
          )
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!vendorId,
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ 
      bookingId, 
      updates 
    }: { 
      bookingId: string; 
      updates: Partial<Booking>;
    }) => {
      const { error } = await supabase
        .from('vendor_bookings')
        .update(updates)
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-bookings', vendorId] });
      toast.success('Booking updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update booking');
      console.error(error);
    },
  });

  const getStatusBadge = (status: BookingStatus) => {
    const styles: Record<BookingStatus, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      REVIEWING: 'bg-blue-100 text-blue-800',
      QUOTE_SENT: 'bg-purple-100 text-purple-800',
      QUOTE_ACCEPTED: 'bg-green-100 text-green-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-muted text-muted-foreground',
      DECLINED: 'bg-red-100 text-red-800',
    };
    return <Badge className={styles[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const handleStatusUpdate = (bookingId: string, status: BookingStatus) => {
    updateBookingMutation.mutate({ 
      bookingId, 
      updates: { status } 
    });
    if (selectedBooking?.id === bookingId) {
      setSelectedBooking({ ...selectedBooking, status });
    }
  };

  const handleSendQuote = (bookingId: string) => {
    if (!quotedPrice) {
      toast.error('Please enter a quote price');
      return;
    }
    updateBookingMutation.mutate({
      bookingId,
      updates: {
        status: 'QUOTE_SENT',
        quoted_price: parseFloat(quotedPrice),
        vendor_notes: vendorNotes || null,
      },
    });
    setQuotedPrice('');
    setVendorNotes('');
  };

  const filterBookings = (status: string) => {
    if (!bookings) return [];
    if (status === 'all') return bookings;
    if (status === 'pending') return bookings.filter(b => ['PENDING', 'REVIEWING'].includes(b.status));
    if (status === 'active') return bookings.filter(b => ['QUOTE_SENT', 'QUOTE_ACCEPTED', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status));
    if (status === 'completed') return bookings.filter(b => ['COMPLETED', 'CANCELLED', 'DECLINED'].includes(b.status));
    return bookings;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  const filteredBookings = filterBookings(activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Booking Requests</h2>
        <p className="text-sm text-muted-foreground">Manage incoming quote requests and bookings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All ({bookings?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({bookings?.filter(b => ['PENDING', 'REVIEWING'].includes(b.status)).length || 0})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({bookings?.filter(b => ['QUOTE_SENT', 'QUOTE_ACCEPTED', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)).length || 0})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({bookings?.filter(b => ['COMPLETED', 'CANCELLED', 'DECLINED'].includes(b.status)).length || 0})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bookings List */}
        <div className="space-y-3">
          {filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No bookings found</p>
              </CardContent>
            </Card>
          ) : (
            filteredBookings.map((booking) => (
              <Card 
                key={booking.id}
                className={`cursor-pointer transition-colors hover:border-primary ${
                  selectedBooking?.id === booking.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setSelectedBooking(booking)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-foreground truncate">{booking.event_name}</h4>
                    {getStatusBadge(booking.status)}
                  </div>
                  {booking.vendor_services && (
                    <p className="text-sm text-muted-foreground mb-1">{booking.vendor_services.name}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{booking.organizer_name}</p>
                  <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(booking.event_date), 'MMM d, yyyy')}
                    </span>
                    {booking.budget_min && booking.budget_max && (
                      <span>${booking.budget_min} - ${booking.budget_max}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Booking Details */}
        <div className="lg:col-span-2">
          {selectedBooking ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedBooking.event_name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedBooking.vendor_services?.name || 'General Inquiry'}
                    </p>
                  </div>
                  {getStatusBadge(selectedBooking.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {selectedBooking.organizer_name}
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {selectedBooking.organizer_email}
                      </p>
                      {selectedBooking.organizer_phone && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {selectedBooking.organizer_phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Event Details</h4>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(selectedBooking.event_date), 'MMMM d, yyyy')}
                      </p>
                      {selectedBooking.event_location && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {selectedBooking.event_location}
                        </p>
                      )}
                      {selectedBooking.guest_count && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {selectedBooking.guest_count} guests
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Budget */}
                {(selectedBooking.budget_min || selectedBooking.budget_max) && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Budget Range</h4>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      ${selectedBooking.budget_min || 0} - ${selectedBooking.budget_max || 'Open'}
                    </p>
                  </div>
                )}

                {/* Requirements */}
                {selectedBooking.requirements && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Requirements</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {selectedBooking.requirements}
                    </p>
                  </div>
                )}

                {/* Quoted Price Display */}
                {selectedBooking.quoted_price && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Quoted Price</h4>
                    <p className="text-lg font-semibold text-primary">${selectedBooking.quoted_price}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 border-t">
                  {selectedBooking.status === 'PENDING' && (
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => handleStatusUpdate(selectedBooking.id, 'REVIEWING')}
                        className="flex-1"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Start Review
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => handleStatusUpdate(selectedBooking.id, 'DECLINED')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  )}

                  {selectedBooking.status === 'REVIEWING' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground">Quote Price ($)</label>
                        <Input
                          type="number"
                          placeholder="Enter your quote"
                          value={quotedPrice}
                          onChange={(e) => setQuotedPrice(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Notes for Organizer</label>
                        <Textarea
                          placeholder="Add any notes or details about your quote..."
                          value={vendorNotes}
                          onChange={(e) => setVendorNotes(e.target.value)}
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => handleSendQuote(selectedBooking.id)}
                          className="flex-1"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Quote
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => handleStatusUpdate(selectedBooking.id, 'DECLINED')}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedBooking.status === 'QUOTE_ACCEPTED' && (
                    <Button 
                      onClick={() => handleStatusUpdate(selectedBooking.id, 'CONFIRMED')}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Booking
                    </Button>
                  )}

                  {selectedBooking.status === 'CONFIRMED' && (
                    <Button 
                      onClick={() => handleStatusUpdate(selectedBooking.id, 'IN_PROGRESS')}
                      className="w-full"
                    >
                      Start Work
                    </Button>
                  )}

                  {selectedBooking.status === 'IN_PROGRESS' && (
                    <Button 
                      onClick={() => handleStatusUpdate(selectedBooking.id, 'COMPLETED')}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Completed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Select a booking to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorBookingManager;
