import React from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useCurrentOrganization } from '@/components/organization/OrganizationContext';

import { OrgPageWrapper } from '@/components/organization/OrgPageWrapper';
import { PageHeader } from '../PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Star,
  Plus,
  ExternalLink,
  Eye,
  MousePointerClick,
} from 'lucide-react';

// Import marketplace components
import ServiceDiscoveryUI from '@/components/marketplace/ServiceDiscoveryUI';
import BookingManagementUI from '@/components/marketplace/BookingManagementUI';
import ReviewRatingUI from '@/components/marketplace/ReviewRatingUI';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const VALID_TABS = ['overview', 'discover', 'bookings', 'reviews', 'analytics'] as const;
type TabValue = typeof VALID_TABS[number];

/**
 * OrgMarketplacePage - Organization-scoped marketplace dashboard
 * 
 * Features:
 * - Organization products management
 * - Service discovery for events
 * - Booking management
 * - Reviews and ratings
 */
export const OrgMarketplacePage: React.FC = () => {
  const organization = useCurrentOrganization();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const tabFromUrl = searchParams.get('tab') as TabValue | null;
  const activeTab = tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'overview';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  // Fetch organization products
  const { data: products = [] } = useQuery({
    queryKey: ['org-products', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_products')
        .select('*')
        .eq('organization_id', organization?.id)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organization?.id,
  });

  // Calculate metrics
  const activeProducts = products.filter(p => p.status === 'ACTIVE').length;
  const totalImpressions = products.reduce((sum, p) => sum + (p.impression_count || 0), 0);
  const totalClicks = products.reduce((sum, p) => sum + (p.click_count || 0), 0);
  const featuredProducts = products.filter(p => p.is_featured).length;

  const metrics = [
    { 
      label: 'Active Products', 
      value: activeProducts, 
      icon: Package, 
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-100',
    },
    { 
      label: 'Total Views', 
      value: totalImpressions, 
      icon: Eye, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
    },
    { 
      label: 'Total Clicks', 
      value: totalClicks, 
      icon: MousePointerClick, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-100',
    },
    { 
      label: 'Featured', 
      value: featuredProducts, 
      icon: Star, 
      color: 'text-amber-500',
      bgColor: 'bg-amber-100',
    },
  ];


  return (
    <OrgPageWrapper>
      <div className="space-y-6 sm:space-y-8">
        <PageHeader
          title="Marketplace"
          subtitle={`Manage products and discover services for ${organization?.name}`}
          actions={[
            {
              label: 'Add Product',
              action: () => navigate(`/${organization?.slug}/settings/story`),
              variant: 'primary' as const,
            },
          ]}
        />

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Organization Products */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Your Products</CardTitle>
                  <CardDescription>Products listed by your organization</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/${organization?.slug}/settings/story`}>
                    Manage <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p className="mb-4">No products listed yet</p>
                    <Button asChild>
                      <Link to={`/${organization?.slug}/settings/story`}>
                        <Plus className="mr-2 h-4 w-4" /> Add First Product
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.slice(0, 6).map((product) => (
                      <div
                        key={product.id}
                        className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-foreground line-clamp-1">{product.name}</h4>
                          {product.is_featured && (
                            <Badge variant="secondary" className="ml-2 shrink-0">
                              <Star className="h-3 w-3 mr-1" /> Featured
                            </Badge>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" /> {product.impression_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointerClick className="h-3.5 w-3.5" /> {product.click_count || 0}
                          </span>
                          {product.price && (
                            <span className="font-medium text-foreground">{product.price}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {products.length > 6 && (
                  <div className="mt-4 text-center">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/${organization?.slug}/settings/story`}>
                        View all {products.length} products →
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discover">
            <Card>
              <CardHeader>
                <CardTitle>Discover Services</CardTitle>
                <CardDescription>Find vendors and services for your events</CardDescription>
              </CardHeader>
              <CardContent>
                <ServiceDiscoveryUI />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>My Bookings</CardTitle>
                <CardDescription>Manage your service bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <BookingManagementUI />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metrics.map((metric) => (
                <Card key={metric.label} className="border-border/60">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                        <metric.icon className={`h-5 w-5 ${metric.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                        <p className="text-xs text-muted-foreground">{metric.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>
            <Card>
              <CardHeader>
                <CardTitle>Product Performance</CardTitle>
                <CardDescription>Detailed analytics for your marketplace products</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">More detailed analytics coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Reviews & Ratings</CardTitle>
                <CardDescription>Rate your experiences with vendors</CardDescription>
              </CardHeader>
              <CardContent>
                <ReviewRatingUI />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </OrgPageWrapper>
  );
};

export default OrgMarketplacePage;
