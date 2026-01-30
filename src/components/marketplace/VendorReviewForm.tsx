import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Star, Loader2, MessageSquarePlus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const reviewFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  review_text: z.string().min(20, 'Review must be at least 20 characters').max(1000),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

interface VendorReviewFormProps {
  vendorId: string;
  vendorName: string;
  eventId?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export const VendorReviewForm: React.FC<VendorReviewFormProps> = ({
  vendorId,
  vendorName,
  eventId,
  trigger,
  onSuccess,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
  });

  const onSubmit = async (data: ReviewFormData) => {
    if (!user) {
      toast.error('Please log in to leave a review');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('vendor_reviews').insert({
        vendor_id: vendorId,
        reviewer_id: user.id,
        event_id: eventId || null,
        rating,
        title: data.title,
        review_text: data.review_text,
        is_verified_booking: !!eventId,
      });

      if (error) throw error;

      toast.success('Review submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['vendor-reviews', vendorId] });
      reset();
      setRating(0);
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('You have already reviewed this vendor for this event');
      } else {
        toast.error(error.message || 'Failed to submit review');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            Write a Review
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review {vendorName}</DialogTitle>
          <DialogDescription>
            Share your experience working with this vendor
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Review Title *</Label>
            <Input
              id="title"
              placeholder="Summarize your experience"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review_text">Your Review *</Label>
            <Textarea
              id="review_text"
              placeholder="Share details about your experience with this vendor..."
              className="min-h-[120px]"
              {...register('review_text')}
            />
            {errors.review_text && (
              <p className="text-sm text-destructive">{errors.review_text.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VendorReviewForm;
