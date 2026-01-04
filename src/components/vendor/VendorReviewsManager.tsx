import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Star, 
  MessageSquare, 
  Send, 
  
  CheckCircle,
  Filter
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VendorReviewsManagerProps {
  vendorId: string;
}

const VendorReviewsManager: React.FC<VendorReviewsManagerProps> = ({ vendorId }) => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'responded'>('all');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  // Fetch reviews
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['vendor-reviews-management', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_reviews')
        .select(`
          *,
          reviewer:user_profiles!vendor_reviews_reviewer_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!vendorId,
  });

  // Response mutation
  const responseMutation = useMutation({
    mutationFn: async ({ reviewId, response }: { reviewId: string; response: string }) => {
      const { error } = await supabase
        .from('vendor_reviews')
        .update({ 
          response_text: response,
          response_at: new Date().toISOString()
        })
        .eq('id', reviewId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-reviews-management', vendorId] });
      toast.success('Response submitted successfully');
      setRespondingTo(null);
      setResponseText('');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit response: ${error.message}`);
    },
  });

  const handleSubmitResponse = (reviewId: string) => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }
    responseMutation.mutate({ reviewId, response: responseText });
  };

  const filteredReviews = reviews?.filter((review) => {
    if (filter === 'pending') return !review.response_text;
    if (filter === 'responded') return !!review.response_text;
    return true;
  });

  const stats = {
    total: reviews?.length || 0,
    pending: reviews?.filter(r => !r.response_text).length || 0,
    responded: reviews?.filter(r => !!r.response_text).length || 0,
    averageRating: reviews?.length 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0',
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Reviews</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              {stats.averageRating}
            </div>
            <div className="text-sm text-muted-foreground">Average Rating</div>
          </CardContent>
        </Card>
        <Card className={stats.pending > 0 ? 'border-yellow-200' : ''}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Awaiting Response</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.responded}</div>
            <div className="text-sm text-muted-foreground">Responded</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter:</span>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reviews ({stats.total})</SelectItem>
            <SelectItem value="pending">Awaiting Response ({stats.pending})</SelectItem>
            <SelectItem value="responded">Responded ({stats.responded})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      {filteredReviews && filteredReviews.length > 0 ? (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id} className={!review.response_text ? 'border-yellow-200' : ''}>
              <CardContent className="p-5">
                {/* Review Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(review.reviewer as any)?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-foreground">
                        {(review.reviewer as any)?.full_name || 'Anonymous'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(review.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating)}
                    {review.is_verified_booking && (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Review Content */}
                {review.title && (
                  <h4 className="font-medium text-foreground mb-2">{review.title}</h4>
                )}
                {review.review_text && (
                  <p className="text-muted-foreground mb-4">{review.review_text}</p>
                )}

                {/* Vendor Response */}
                {review.response_text ? (
                  <div className="bg-muted/50 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Your Response</span>
                      <span className="text-xs text-muted-foreground">
                        {review.response_at && format(new Date(review.response_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.response_text}</p>
                  </div>
                ) : respondingTo === review.id ? (
                  <div className="mt-4 space-y-3">
                    <Textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Write your response to this review..."
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRespondingTo(null);
                          setResponseText('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSubmitResponse(review.id)}
                        disabled={responseMutation.isPending}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Submit Response
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setRespondingTo(review.id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Respond to Review
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Star className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {filter === 'all' ? 'No reviews yet' : `No ${filter} reviews`}
            </h3>
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? "You'll see customer reviews here once they start coming in."
                : 'Try changing the filter to see other reviews.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VendorReviewsManager;