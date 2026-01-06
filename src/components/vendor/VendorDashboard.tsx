import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Store, 
  Package, 
  Star, 
  CheckCircle, 
  AlertCircle,
  Plus,
  BarChart3,
  MessageSquare,
  CalendarCheck,
  Settings,
  Images
} from 'lucide-react';

import VendorServiceManager from './VendorServiceManager';
import VendorReviewsManager from './VendorReviewsManager';
import VendorBookingManager from './VendorBookingManager';
import VendorProfileEditor from './VendorProfileEditor';
import VendorPortfolioGallery from './VendorPortfolioGallery';

interface VendorDashboardProps {
  userId?: string;
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({ userId }) => {
  const { user } = useAuth();
  const currentUserId = userId || user?.id;
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch vendor profile
  const { data: vendor, isLoading: vendorLoading, refetch: refetchVendor } = useQuery({
    queryKey: ['vendor-profile', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!currentUserId,
  });

  // Fetch vendor services count
  const { data: servicesData } = useQuery({
    queryKey: ['vendor-services-stats', vendor?.id],
    queryFn: async () => {
      if (!vendor?.id) return { count: 0, activeCount: 0 };
      
      const { data, error } = await supabase
        .from('vendor_services')
        .select('id, status')
        .eq('vendor_id', vendor.id);

      if (error) throw error;
      
      return {
        count: data?.length || 0,
        activeCount: data?.filter(s => s.status === 'ACTIVE').length || 0,
      };
    },
    enabled: !!vendor?.id,
  });

  // Fetch vendor reviews stats
  const { data: reviewsData } = useQuery({
    queryKey: ['vendor-reviews-stats', vendor?.id],
    queryFn: async () => {
      if (!vendor?.id) return { count: 0, averageRating: 0, pendingResponses: 0 };
      
      const { data, error } = await supabase
        .from('vendor_reviews')
        .select('rating, response_text')
        .eq('vendor_id', vendor.id);

      if (error) throw error;
      
      const ratings = data?.map(r => r.rating) || [];
      const avgRating = ratings.length > 0 
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
        : 0;
      const pendingResponses = data?.filter(r => !r.response_text).length || 0;
      
      return {
        count: data?.length || 0,
        averageRating: avgRating,
        pendingResponses,
      };
    },
    enabled: !!vendor?.id,
  });

  // Fetch booking stats
  const { data: bookingsData } = useQuery({
    queryKey: ['vendor-bookings-stats', vendor?.id],
    queryFn: async () => {
      if (!vendor?.id) return { total: 0, pending: 0 };
      
      const { data, error } = await supabase
        .from('vendor_bookings')
        .select('status')
        .eq('vendor_id', vendor.id);

      if (error) throw error;
      
      const pending = data?.filter(b => ['PENDING', 'REVIEWING'].includes(b.status)).length || 0;
      
      return {
        total: data?.length || 0,
        pending,
      };
    },
    enabled: !!vendor?.id,
  });

  if (vendorLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!vendor) {
    return <Navigate to="/marketplace/vendor/register" replace />;
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending Verification</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Suspended</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Profile Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Store className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">{vendor.business_name}</h2>
                <p className="text-muted-foreground text-sm">
                  {vendor.city && vendor.state ? `${vendor.city}, ${vendor.state}` : 'Location not set'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(vendor.verification_status)}
              <Button variant="outline" size="sm" onClick={() => setActiveTab('services')}>
                <Plus className="h-4 w-4 mr-1" />
                Add Service
              </Button>
            </div>
          </div>
          {vendor.description && (
            <p className="mt-4 text-sm text-muted-foreground">{vendor.description}</p>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Services</p>
                <p className="text-2xl font-bold text-foreground">
                  {servicesData?.activeCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold text-foreground">
                  {reviewsData?.averageRating.toFixed(1) || '0.0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
                <p className="text-2xl font-bold text-foreground">
                  {reviewsData?.count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <CalendarCheck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Bookings</p>
                <p className="text-2xl font-bold text-foreground">
                  {bookingsData?.pending || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => setActiveTab('bookings')}
            >
              <CalendarCheck className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">View Bookings</p>
                <p className="text-xs text-muted-foreground">Manage incoming requests</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => setActiveTab('services')}
            >
              <Package className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Manage Services</p>
                <p className="text-xs text-muted-foreground">Add or edit your listings</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => setActiveTab('reviews')}
            >
              <Star className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">View Reviews</p>
                <p className="text-xs text-muted-foreground">Respond to feedback</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => setActiveTab('profile')}
            >
              <Settings className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Edit Profile</p>
                <p className="text-xs text-muted-foreground">Update business info</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Alert */}
      {vendor.verification_status === 'PENDING' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Verification Pending</p>
              <p className="text-sm text-yellow-700">
                Your vendor profile is under review. You'll be notified once it's approved.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {vendor.verification_status === 'VERIFIED' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Verified Vendor</p>
              <p className="text-sm text-green-700">
                Your profile is verified and visible to customers in the marketplace.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-2">
            <CalendarCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Bookings</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Services</span>
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="gap-2">
            <Images className="h-4 w-4" />
            <span className="hidden sm:inline">Portfolio</span>
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-2">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Reviews</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="bookings" className="mt-6">
          <VendorBookingManager vendorId={vendor.id} />
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          <VendorServiceManager vendorId={vendor.id} />
        </TabsContent>

        <TabsContent value="portfolio" className="mt-6">
          <VendorPortfolioGallery vendorId={vendor.id} />
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <VendorReviewsManager vendorId={vendor.id} />
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <VendorProfileEditor vendor={vendor} onUpdate={() => refetchVendor()} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorDashboard;