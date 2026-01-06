import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '../PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Store,
  Building2,
  Calendar,
  TrendingUp,
  Star,
  ArrowRight,
  Users,
  ShoppingBag,
  Sparkles,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

/**
 * MarketplaceServiceDashboard provides the service landing page for Marketplace.
 * Features quick actions, live metrics, and service information for discovery.
 */
export const MarketplaceServiceDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Fetch live marketplace stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['marketplace-dashboard-stats'],
    queryFn: async () => {
      const [vendorsResult, servicesResult, bookingsResult] = await Promise.all([
        supabase.from('vendors').select('id', { count: 'exact' }).eq('verification_status', 'VERIFIED'),
        supabase.from('vendor_services').select('id', { count: 'exact' }).eq('status', 'ACTIVE'),
        supabase.from('vendor_bookings').select('id', { count: 'exact' }),
      ]);

      return {
        vendorCount: vendorsResult.count || 0,
        serviceCount: servicesResult.count || 0,
        bookingCount: bookingsResult.count || 0,
      };
    },
  });

  // Fetch recent vendors
  const { data: recentVendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ['recent-verified-vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, business_name, categories, city, state')
        .eq('verification_status', 'VERIFIED')
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      return data;
    },
  });

  const quickActions = [
    {
      title: 'Browse Marketplace',
      description: 'Discover services from verified vendors',
      href: '/marketplace/marketplace',
      icon: Store,
      gradient: 'from-primary/20 to-primary/5',
      iconColor: 'text-primary',
      primary: true,
    },
    {
      title: 'Vendor Dashboard',
      description: 'Manage your services and bookings',
      href: '/marketplace/vendor',
      icon: Building2,
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'My Bookings',
      description: 'Track your service requests',
      href: '/marketplace/bookings',
      icon: Calendar,
      gradient: 'from-violet-500/20 to-violet-500/5',
      iconColor: 'text-violet-600',
    },
    {
      title: 'Analytics',
      description: 'Performance insights',
      href: '/marketplace/analytics',
      icon: TrendingUp,
      gradient: 'from-amber-500/20 to-amber-500/5',
      iconColor: 'text-amber-600',
    },
  ];

  const pageActions = [
    {
      label: 'Visit Marketplace',
      action: () => navigate('/marketplace/marketplace'),
      variant: 'primary' as const,
    },
    {
      label: 'Become a Vendor',
      action: () => navigate('/marketplace/vendor/register'),
      variant: 'secondary' as const,
    },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Marketplace"
          subtitle="Discover and book services from verified vendors"
          actions={pageActions}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-xl">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{stats?.vendorCount || 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Verified Vendors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <ShoppingBag className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{stats?.serviceCount || 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Active Services</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-violet-500/20 rounded-xl">
                  <Calendar className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{stats?.bookingCount || 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.href}
                  className={`group block p-5 rounded-xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-gradient-to-br ${action.gradient} ${
                    action.primary
                      ? 'border-primary/30 hover:border-primary/50'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-lg ${action.primary ? 'bg-primary/20' : 'bg-background/50'}`}>
                      <Icon className={`w-5 h-5 ${action.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold mb-1 group-hover:text-primary transition-colors ${
                        action.primary ? 'text-primary' : 'text-foreground'
                      }`}>
                        {action.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Vendors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Recently Verified Vendors
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace/vendor/browse')} className="gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {vendorsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            ) : recentVendors && recentVendors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentVendors.map((vendor) => (
                  <Link
                    key={vendor.id}
                    to={`/vendor/${vendor.id}`}
                    className="group p-4 rounded-lg border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {vendor.business_name}
                      </h4>
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    </div>
                    {(vendor.city || vendor.state) && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {[vendor.city, vendor.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {vendor.categories?.slice(0, 2).map((cat, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No verified vendors yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Value Propositions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground">Verified Quality</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                All vendors go through a verification process to ensure quality and reliability.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-emerald-600" />
                </div>
                <h4 className="font-semibold text-foreground">Fast Response</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Get quotes and responses from vendors quickly with our streamlined booking system.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <h4 className="font-semibold text-foreground">Trusted Reviews</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Make informed decisions with authentic reviews from verified customers.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden">
          <CardContent className="p-8 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium text-primary">For Event Vendors</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                Grow Your Business with EventHub
              </h3>
              <p className="text-muted-foreground mb-6">
                Join our marketplace and connect with thousands of event organizers looking for quality services like yours.
                Get discovered, manage bookings, and grow your client base.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => navigate('/marketplace/vendor/register')} size="lg" className="gap-2">
                  <Zap className="w-4 h-4" />
                  Become a Vendor
                </Button>
                <Button variant="outline" onClick={() => navigate('/marketplace/marketplace')} size="lg">
                  Explore Marketplace
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
