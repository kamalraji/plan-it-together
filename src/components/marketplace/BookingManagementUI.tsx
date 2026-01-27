import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, FileText, MessageSquare } from 'lucide-react';
import { BookingStatus, BookingRequest, getStatusText, formatCategory } from './types';
import { useToast } from '@/hooks/use-toast';

interface BookingManagementUIProps {
  eventId?: string;
}

const getStatusVariant = (status: BookingStatus) => {
  switch (status) {
    case BookingStatus.PENDING:
    case BookingStatus.VENDOR_REVIEWING:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case BookingStatus.QUOTE_SENT:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case BookingStatus.QUOTE_ACCEPTED:
    case BookingStatus.CONFIRMED:
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    case BookingStatus.IN_PROGRESS:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    case BookingStatus.COMPLETED:
      return 'bg-muted text-muted-foreground';
    case BookingStatus.CANCELLED:
    case BookingStatus.DISPUTED:
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const BookingManagementUI: React.FC<BookingManagementUIProps> = ({ eventId }) => {
  const { toast } = useToast();
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

  const handleAcceptQuote = async (bookingId: string) => {
    try {
      await api.patch(`/marketplace/bookings/${bookingId}/accept-quote`);
      toast({ title: 'Quote accepted', description: 'The quote has been accepted successfully.' });
      refetch();
    } catch (error) {
      console.error('Failed to accept quote:', error);
      toast({ title: 'Error', description: 'Failed to accept quote. Please try again.', variant: 'destructive' });
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await api.patch(`/marketplace/bookings/${bookingId}/cancel`);
      toast({ title: 'Booking cancelled', description: 'The booking has been cancelled.' });
      refetch();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      toast({ title: 'Error', description: 'Failed to cancel booking. Please try again.', variant: 'destructive' });
    }
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
                onValueChange={(value) => setStatusFilter(value as BookingStatus | 'ALL')}
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
                        {booking.serviceListing.title}
                      </h3>
                      <Badge className={getStatusVariant(booking.status)}>
                        {getStatusText(booking.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Vendor:</span> {booking.vendor.businessName}
                          {booking.vendor.verificationStatus === 'VERIFIED' && (
                            <CheckCircle className="inline ml-1 h-4 w-4 text-emerald-500" />
                          )}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Service Date:</span> {new Date(booking.serviceDate).toLocaleDateString()}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Category:</span> {formatCategory(booking.serviceListing.category)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        {booking.budgetRange && (
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Budget:</span> {booking.serviceListing.pricing.currency} {booking.budgetRange.min.toLocaleString()} - {booking.budgetRange.max.toLocaleString()}
                          </p>
                        )}
                        {booking.quotedPrice && (
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Quoted:</span> {booking.serviceListing.pricing.currency} {booking.quotedPrice.toLocaleString()}
                          </p>
                        )}
                        {booking.finalPrice && (
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Final:</span> {booking.serviceListing.pricing.currency} {booking.finalPrice.toLocaleString()}
                          </p>
                        )}
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Created:</span> {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-foreground mb-1">Requirements:</p>
                      <p className="text-sm text-muted-foreground">{booking.requirements}</p>
                    </div>

                    {booking.additionalNotes && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-foreground mb-1">Additional Notes:</p>
                        <p className="text-sm text-muted-foreground">{booking.additionalNotes}</p>
                      </div>
                    )}

                    {/* Messages Preview */}
                    {booking.messages.length > 0 && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Recent Messages ({booking.messages.length})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">
                            {booking.messages[booking.messages.length - 1].senderType === 'ORGANIZER' ? 'You' : booking.vendor.businessName}:
                          </span>{' '}
                          {booking.messages[booking.messages.length - 1].message.length > 100
                            ? `${booking.messages[booking.messages.length - 1].message.substring(0, 100)}...`
                            : booking.messages[booking.messages.length - 1].message
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowMessageModal(true);
                      }}
                    >
                      View Messages
                    </Button>

                    {booking.status === BookingStatus.QUOTE_SENT && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleAcceptQuote(booking.id)}
                      >
                        Accept Quote
                      </Button>
                    )}

                    {[BookingStatus.PENDING, BookingStatus.VENDOR_REVIEWING, BookingStatus.QUOTE_SENT].includes(booking.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Cancel
                      </Button>
                    )}

                    {booking.status === BookingStatus.COMPLETED && (
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

      {/* Message Modal */}
      {showMessageModal && selectedBooking && (
        <MessageModal
          booking={selectedBooking}
          open={showMessageModal}
          onOpenChange={(open) => {
            setShowMessageModal(open);
            if (!open) setSelectedBooking(null);
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMessageSent: () => void;
}

const MessageModal: React.FC<MessageModalProps> = ({ booking, open, onOpenChange, onMessageSent }) => {
  const { toast } = useToast();
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
      toast({ title: 'Message sent', description: 'Your message has been sent.' });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({ title: 'Error', description: 'Failed to send message. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{booking.serviceListing.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{booking.vendor.businessName}</p>
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-[300px]">
          {booking.messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
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
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    message.senderType === 'ORGANIZER' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {new Date(message.sentAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex gap-3 pt-4 border-t border-border">
          <Input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isSubmitting || !newMessage.trim()}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingManagementUI;
