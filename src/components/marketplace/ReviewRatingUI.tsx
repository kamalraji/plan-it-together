import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Star, CheckCircle, ThumbsUp } from 'lucide-react';
import { formatCategory } from './types';
import { useToast } from '@/hooks/use-toast';

interface ReviewRatingUIProps {
  eventId?: string;
}

interface DatabaseReview {
  id: string;
  vendor_id: string;
  reviewer_id: string;
  event_id: string | null;
  rating: number;
  title: string | null;
  review_text: string | null;
  response_text: string | null;
  response_at: string | null;
  is_verified_booking: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  vendors?: {
    id: string;
    business_name: string;
    verification_status: string;
  };
}

interface CompletedBooking {
  id: string;
  vendor_id: string;
  event_name: string;
  event_date: string;
  final_price: number | null;
  status: string;
  vendors?: {
    id: string;
    business_name: string;
    verification_status: string;
  };
  vendor_services?: {
    id: string;
    name: string;
    category: string;
  } | null;
}

// Star Rating Component
const StarRating: React.FC<{
  rating: number;
  size?: 'sm' | 'md';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}> = ({ rating, size = 'sm', interactive = false, onChange }) => {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(i)}
          className={interactive ? 'hover:scale-110 transition-transform' : ''}
        >
          <Star
            className={`${sizeClass} ${
              i <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
      {!interactive && <span className="ml-1 text-sm text-muted-foreground">{rating.toFixed(1)}</span>}
    </div>
  );
};

const ReviewRatingUI: React.FC<ReviewRatingUIProps> = ({ eventId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'my-reviews' | 'pending-reviews'>('my-reviews');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CompletedBooking | null>(null);

  // Fetch user's reviews from vendor_reviews table
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['organizer-reviews', eventId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('vendor_reviews')
        .select(`
          *,
          vendors (id, business_name, verification_status)
        `)
        .eq('reviewer_id', user.id)
        .order('created_at', { ascending: false });

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reviews:', error);
        return [];
      }

      return (data || []) as DatabaseReview[];
    },
  });

  // Fetch completed bookings without reviews
  const { data: pendingReviews, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-reviews', eventId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get completed bookings
      let query = supabase
        .from('vendor_bookings')
        .select(`
          id,
          vendor_id,
          event_name,
          event_date,
          final_price,
          status,
          vendors (id, business_name, verification_status),
          vendor_services (id, name, category)
        `)
        .eq('organizer_id', user.id)
        .eq('status', 'COMPLETED');

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data: bookings, error } = await query;

      if (error) {
        console.error('Error fetching completed bookings:', error);
        return [];
      }

      // Get existing reviews to filter out already-reviewed bookings
      const { data: existingReviews } = await supabase
        .from('vendor_reviews')
        .select('vendor_id, event_id')
        .eq('reviewer_id', user.id);

      const reviewedVendorEvents = new Set(
        (existingReviews || []).map(r => `${r.vendor_id}-${r.event_id}`)
      );

      // Filter out bookings that already have reviews
      const pendingBookings = (bookings || []).filter(b => 
        !reviewedVendorEvents.has(`${b.vendor_id}-${eventId}`)
      );

      return pendingBookings as CompletedBooking[];
    },
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: {
      vendorId: string;
      rating: number;
      title: string;
      reviewText: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('vendor_reviews')
        .insert({
          vendor_id: reviewData.vendorId,
          reviewer_id: user.id,
          event_id: eventId || null,
          rating: reviewData.rating,
          title: reviewData.title,
          review_text: reviewData.reviewText,
          is_verified_booking: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
      toast({ title: 'Review submitted', description: 'Thank you for your feedback!' });
      setShowReviewModal(false);
      setSelectedBooking(null);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to submit review. Please try again.', variant: 'destructive' });
    },
  });


  const handleWriteReview = (booking: CompletedBooking) => {
    setSelectedBooking(booking);
    setShowReviewModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'my-reviews' | 'pending-reviews')}>
        <TabsList>
          <TabsTrigger value="my-reviews" className="gap-2">
            My Reviews
            {(reviews?.length || 0) > 0 && (
              <Badge variant="secondary" className="text-xs">{reviews?.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending-reviews" className="gap-2">
            Pending Reviews
            {(pendingReviews?.length || 0) > 0 && (
              <Badge variant="secondary" className="text-xs">{pendingReviews?.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* My Reviews Tab */}
        <TabsContent value="my-reviews" className="mt-6 space-y-4">
          {reviewsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reviews && reviews.length > 0 ? (
            reviews.map((review) => (
              <Card key={review.id} className="border-border/60">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {review.vendors?.business_name || 'Vendor'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {review.is_verified_booking && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Verified Purchase
                          </span>
                        )}
                        <span>•</span>
                        <span>{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size="md" />
                  </div>

                  <div className="mb-4">
                    {review.title && (
                      <h4 className="font-medium text-foreground mb-2">{review.title}</h4>
                    )}
                    {review.review_text && (
                      <p className="text-muted-foreground">{review.review_text}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      {review.helpful_count > 0 && (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          {review.helpful_count} found this helpful
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vendor Response */}
                  {review.response_text && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center mb-2">
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Response from vendor</span>
                        {review.response_at && (
                          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                            {new Date(review.response_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-blue-800 dark:text-blue-200">{review.response_text}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Star className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No reviews yet</h3>
              <p className="text-muted-foreground">You haven't written any reviews for vendors yet.</p>
            </div>
          )}
        </TabsContent>

        {/* Pending Reviews Tab */}
        <TabsContent value="pending-reviews" className="mt-6 space-y-4">
          {pendingLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : pendingReviews && pendingReviews.length > 0 ? (
            pendingReviews.map((booking) => (
              <Card key={booking.id} className="border-border/60">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {booking.vendor_services?.name || booking.event_name}
                      </h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center gap-1">
                          <span className="font-medium text-foreground">Vendor:</span> {booking.vendors?.business_name}
                          {booking.vendors?.verification_status === 'verified' && (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          )}
                        </p>
                        {booking.vendor_services?.category && (
                          <p>
                            <span className="font-medium text-foreground">Category:</span> {formatCategory(booking.vendor_services.category)}
                          </p>
                        )}
                        <p>
                          <span className="font-medium text-foreground">Service Date:</span> {new Date(booking.event_date).toLocaleDateString()}
                        </p>
                        {booking.final_price && (
                          <p>
                            <span className="font-medium text-foreground">Final Price:</span> ₹{booking.final_price.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button onClick={() => handleWriteReview(booking)}>
                      Write Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No pending reviews</h3>
              <p className="text-muted-foreground">All your completed bookings have been reviewed.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Modal */}
      {showReviewModal && selectedBooking && (
        <ReviewModal
          booking={selectedBooking}
          open={showReviewModal}
          onOpenChange={(open) => {
            setShowReviewModal(open);
            if (!open) setSelectedBooking(null);
          }}
          onSubmit={(data) => submitReviewMutation.mutate(data)}
          isSubmitting={submitReviewMutation.isPending}
        />
      )}
    </div>
  );
};

// Review Modal Component
interface ReviewModalProps {
  booking: CompletedBooking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { vendorId: string; rating: number; title: string; reviewText: string }) => void;
  isSubmitting: boolean;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ booking, open, onOpenChange, onSubmit, isSubmitting }) => {
  const [reviewData, setReviewData] = useState({
    rating: 5,
    title: '',
    reviewText: '',
  });

  const handleRatingChange = (rating: number) => {
    setReviewData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      vendorId: booking.vendor_id,
      rating: reviewData.rating,
      title: reviewData.title,
      reviewText: reviewData.reviewText,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Write Review</DialogTitle>
        </DialogHeader>

        {/* Service Summary */}
        <div className="bg-muted rounded-lg p-4 mb-4">
          <h3 className="font-medium text-foreground mb-1">
            {booking.vendor_services?.name || booking.event_name}
          </h3>
          <p className="text-sm text-muted-foreground">{booking.vendors?.business_name}</p>
          <p className="text-sm text-muted-foreground">Service Date: {new Date(booking.event_date).toLocaleDateString()}</p>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          <div className="space-y-2">
            <Label className="text-sm">Overall Rating</Label>
            <div className="flex items-center gap-2">
              <StarRating rating={reviewData.rating} interactive onChange={handleRatingChange} />
              <span className="text-sm text-muted-foreground">{reviewData.rating}/5</span>
            </div>
          </div>

          {/* Review Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Review Title *</Label>
            <Input
              id="title"
              required
              placeholder="Summarize your experience..."
              value={reviewData.title}
              onChange={(e) => setReviewData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          {/* Review Comment */}
          <div className="space-y-2">
            <Label htmlFor="reviewText">Your Review *</Label>
            <Textarea
              id="reviewText"
              required
              rows={4}
              placeholder="Share details about your experience with this vendor..."
              value={reviewData.reviewText}
              onChange={(e) => setReviewData(prev => ({ ...prev, reviewText: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Review
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewRatingUI;
