import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Star, CheckCircle, ThumbsUp } from 'lucide-react';
import { VendorReview, CompletedBooking, formatCategory } from './types';
import { useToast } from '@/hooks/use-toast';

interface ReviewRatingUIProps {
  eventId?: string;
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
                        {review.booking.serviceListing.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                        {review.vendor.businessName}
                        {review.vendor.verificationStatus === 'VERIFIED' && (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {formatCategory(review.booking.serviceListing.category)}
                        </Badge>
                        <span>•</span>
                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                        {review.verifiedPurchase && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Verified Purchase</span>
                          </>
                        )}
                      </div>
                    </div>
                    <StarRating rating={review.rating} size="md" />
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-foreground mb-2">{review.title}</h4>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </div>

                  {/* Detailed Ratings */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-muted rounded-lg">
                    <div className="text-center">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Service Quality</p>
                      <StarRating rating={review.serviceQuality} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Communication</p>
                      <StarRating rating={review.communication} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Timeliness</p>
                      <StarRating rating={review.timeliness} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Value</p>
                      <StarRating rating={review.value} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <span className={review.wouldRecommend ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                        {review.wouldRecommend ? '✓ Would recommend' : '✗ Would not recommend'}
                      </span>
                      {review.helpful > 0 && (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          {review.helpful} found this helpful
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vendor Response */}
                  {review.vendorResponse && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center mb-2">
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Response from {review.vendor.businessName}</span>
                        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                          {new Date(review.vendorResponseAt!).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-blue-800 dark:text-blue-200">{review.vendorResponse}</p>
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
                        {booking.serviceListing.title}
                      </h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center gap-1">
                          <span className="font-medium text-foreground">Vendor:</span> {booking.vendor.businessName}
                          {booking.vendor.verificationStatus === 'VERIFIED' && (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          )}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Category:</span> {formatCategory(booking.serviceListing.category)}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Service Date:</span> {new Date(booking.serviceDate).toLocaleDateString()}
                        </p>
                        {booking.finalPrice && (
                          <p>
                            <span className="font-medium text-foreground">Final Price:</span> {booking.currency} {booking.finalPrice.toLocaleString()}
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewSubmitted: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ booking, open, onOpenChange, onReviewSubmitted }) => {
  const { toast } = useToast();
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

      toast({ title: 'Review submitted', description: 'Thank you for your feedback!' });
      onReviewSubmitted();
      onOpenChange(false);
    } catch (_error) {
      toast({ title: 'Error', description: 'Failed to submit review. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingInput: React.FC<{ label: string; field: string; value: number }> = ({ label, field, value }) => (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <StarRating rating={value} interactive onChange={(r) => handleRatingChange(field, r)} />
        <span className="text-sm text-muted-foreground">{value}/5</span>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Write Review</DialogTitle>
        </DialogHeader>

        {/* Service Summary */}
        <div className="bg-muted rounded-lg p-4 mb-4">
          <h3 className="font-medium text-foreground mb-1">{booking.serviceListing.title}</h3>
          <p className="text-sm text-muted-foreground">{booking.vendor.businessName}</p>
          <p className="text-sm text-muted-foreground">Service Date: {new Date(booking.serviceDate).toLocaleDateString()}</p>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          <RatingInput label="Overall Rating" field="rating" value={reviewData.rating} />

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
            <Label htmlFor="comment">Your Review *</Label>
            <Textarea
              id="comment"
              required
              rows={4}
              placeholder="Share details about your experience with this vendor..."
              value={reviewData.comment}
              onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
            />
          </div>

          {/* Detailed Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RatingInput label="Service Quality" field="serviceQuality" value={reviewData.serviceQuality} />
            <RatingInput label="Communication" field="communication" value={reviewData.communication} />
            <RatingInput label="Timeliness" field="timeliness" value={reviewData.timeliness} />
            <RatingInput label="Value for Money" field="value" value={reviewData.value} />
          </div>

          {/* Would Recommend */}
          <div className="space-y-2">
            <Label>Would you recommend this vendor?</Label>
            <RadioGroup
              value={reviewData.wouldRecommend ? 'yes' : 'no'}
              onValueChange={(v) => setReviewData(prev => ({ ...prev, wouldRecommend: v === 'yes' }))}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="recommend-yes" />
                <Label htmlFor="recommend-yes" className="cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="recommend-no" />
                <Label htmlFor="recommend-no" className="cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewRatingUI;
