import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, CheckCircle2, ThumbsUp } from 'lucide-react';
import { format } from 'date-fns';
import { VendorReviewForm } from './VendorReviewForm';
import { SupportHelpdesk } from '@/components/illustrations';

interface Review {
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
}

interface VendorReviewsProps {
  vendorId: string;
  vendorName: string;
}

const StarRating: React.FC<{ rating: number; size?: 'sm' | 'md' }> = ({ rating, size = 'sm' }) => {
  const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starSize} ${
            star <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
};

export const VendorReviews: React.FC<VendorReviewsProps> = ({ vendorId, vendorName }) => {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['vendor-reviews', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_reviews')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
  });

  // Calculate average rating and distribution
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage: reviews.length > 0
      ? (reviews.filter((r) => r.rating === rating).length / reviews.length) * 100
      : 0,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Reviews & Ratings</CardTitle>
            <VendorReviewForm vendorId={vendorId} vendorName={vendorName} />
          </div>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8 flex flex-col items-center">
              <SupportHelpdesk size="xs" showBackground={false} />
              <p className="text-muted-foreground mt-3">No reviews yet</p>
              <p className="text-sm text-muted-foreground">Be the first to review this vendor</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Average Rating */}
              <div className="text-center">
                <div className="text-5xl font-bold text-foreground mb-2">
                  {averageRating.toFixed(1)}
                </div>
                <StarRating rating={Math.round(averageRating)} size="md" />
                <p className="text-sm text-muted-foreground mt-2">
                  Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="md:col-span-2 space-y-2">
                {ratingDistribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm w-3">{rating}</span>
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Reviews */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <StarRating rating={review.rating} />
                      {review.is_verified_booking && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified Booking
                        </Badge>
                      )}
                    </div>
                    {review.title && (
                      <h4 className="font-semibold text-foreground mb-1">{review.title}</h4>
                    )}
                    {review.review_text && (
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {review.review_text}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>{format(new Date(review.created_at), 'MMM d, yyyy')}</span>
                      {review.helpful_count > 0 && (
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {review.helpful_count} found this helpful
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vendor Response */}
                {review.response_text && (
                  <>
                    <Separator className="my-4" />
                    <div className="pl-4 border-l-2 border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">Vendor Response</Badge>
                        {review.response_at && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(review.response_at), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{review.response_text}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorReviews;
