import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star, MapPin, ArrowRight, BadgeCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface FeaturedVendor {
  id: string;
  business_name: string;
  description: string | null;
  city: string | null;
  state: string | null;
  categories: string[] | null;
  avg_rating: number;
  review_count: number;
}

export const FeaturedServices: React.FC = () => {
  const navigate = useNavigate();

  const { data: featuredVendors, isLoading } = useQuery({
    queryKey: ['featured-vendors'],
    queryFn: async () => {
      // Fetch verified vendors with their average ratings
      const { data: vendors, error: vendorsError } = await supabase
        .from('vendors')
        .select('id, business_name, description, city, state, categories')
        .eq('verification_status', 'VERIFIED')
        .limit(20);

      if (vendorsError) throw vendorsError;
      if (!vendors || vendors.length === 0) return [];

      // Fetch ratings for these vendors
      const vendorIds = vendors.map(v => v.id);
      const { data: reviews, error: reviewsError } = await supabase
        .from('vendor_reviews')
        .select('vendor_id, rating')
        .in('vendor_id', vendorIds);

      if (reviewsError) throw reviewsError;

      // Calculate average ratings
      const ratingMap: Record<string, { total: number; count: number }> = {};
      reviews?.forEach(review => {
        if (!ratingMap[review.vendor_id]) {
          ratingMap[review.vendor_id] = { total: 0, count: 0 };
        }
        ratingMap[review.vendor_id].total += review.rating;
        ratingMap[review.vendor_id].count += 1;
      });

      // Map vendors with ratings and sort by rating
      const vendorsWithRatings: FeaturedVendor[] = vendors.map(vendor => ({
        ...vendor,
        avg_rating: ratingMap[vendor.id] 
          ? ratingMap[vendor.id].total / ratingMap[vendor.id].count 
          : 0,
        review_count: ratingMap[vendor.id]?.count || 0,
      }));

      // Sort by rating (highest first), then by review count
      return vendorsWithRatings
        .sort((a, b) => {
          if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
          return b.review_count - a.review_count;
        })
        .slice(0, 6);
    },
  });

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!featuredVendors || featuredVendors.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Featured Vendors</h2>
          <p className="text-sm text-muted-foreground">Top-rated service providers</p>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/marketplace/vendor/browse')}
          className="gap-1"
        >
          View All <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {featuredVendors.map(vendor => (
          <Card 
            key={vendor.id}
            className="group cursor-pointer hover:shadow-lg transition-all hover:border-primary/30"
            onClick={() => navigate(`/vendor/${vendor.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {vendor.business_name}
                    </h3>
                    <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                  </div>
                  {(vendor.city || vendor.state) && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{[vendor.city, vendor.state].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>
                {vendor.avg_rating > 0 && (
                  <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md">
                    <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                    <span className="text-sm font-medium text-primary">
                      {vendor.avg_rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {vendor.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {vendor.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {vendor.categories?.slice(0, 2).map(category => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
                {vendor.review_count > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {vendor.review_count} review{vendor.review_count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FeaturedServices;
