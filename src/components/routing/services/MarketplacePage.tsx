import React, { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { Button } from '@/components/ui/button';
import { Search, Building2, Sparkles, TrendingUp, Users } from 'lucide-react';

// Import existing and new marketplace components
import ServiceDiscoveryUI, { ServiceListingData } from '../../marketplace/ServiceDiscoveryUI';
import FeaturedServices from '../../marketplace/FeaturedServices';
import TrendingCategories from '../../marketplace/TrendingCategories';
import QuickComparePanel from '../../marketplace/QuickComparePanel';

/**
 * MarketplacePage provides a customer-facing marketplace interface for browsing and booking services.
 * 
 * Features:
 * - Service discovery with real Supabase data
 * - Browse verified vendors and their services
 * - Request quotes from vendors
 * - Quick compare functionality
 * - Trending categories
 * - AI recommendations (future)
 */
export const MarketplacePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'discover' | 'vendors'>('discover');
  const [compareServices, setCompareServices] = useState<ServiceListingData[]>([]);
  const [showComparePanel, setShowComparePanel] = useState(false);

  // Extract eventId from URL params if present
  const urlParams = new URLSearchParams(location.search);
  const eventId = urlParams.get('eventId');
  const eventName = urlParams.get('eventName');

  // Handle compare toggle - will be passed to ServiceDiscoveryUI when it supports comparison
  const handleCompareToggle = useCallback((service: ServiceListingData, isSelected: boolean) => {
    setCompareServices(prev => {
      if (isSelected) {
        // Max 4 services for comparison
        if (prev.length >= 4) return prev;
        return [...prev, service];
      } else {
        return prev.filter(s => s.id !== service.id);
      }
    });
  }, []);

  // Keep handleCompareToggle for future integration with ServiceDiscoveryUI
  void handleCompareToggle;

  const handleRemoveFromCompare = useCallback((serviceId: string) => {
    setCompareServices(prev => prev.filter(s => s.id !== serviceId));
  }, []);

  const handleClearCompare = useCallback(() => {
    setCompareServices([]);
    setShowComparePanel(false);
  }, []);

  const pageActions = [
    {
      label: 'Browse Services',
      action: () => setActiveView('discover'),
      variant: 'primary' as const,
    },
    {
      label: 'View Vendors',
      action: () => navigate('/marketplace/vendor/browse'),
      variant: 'secondary' as const,
    },
  ];

  const tabs = [
    { id: 'discover', label: 'Discover Services' },
    { id: 'vendors', label: 'Browse Vendors' },
  ];

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Marketplace', href: '/marketplace' },
  ];

  const handleTabChange = (tabId: string) => {
    if (tabId === 'vendors') {
      navigate('/marketplace/vendor/browse');
    } else {
      setActiveView(tabId as 'discover');
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <PageHeader
          title={eventId ? `Marketplace - ${eventName || 'Event'}` : 'Service Marketplace'}
          subtitle={eventId 
            ? `Discover and book services for ${eventName || 'your event'} from verified vendors`
            : 'Discover and book services from verified vendors'
          }
          breadcrumbs={breadcrumbs}
          actions={pageActions}
          tabs={tabs.map(tab => ({
            id: tab.id,
            label: tab.label,
            current: activeView === tab.id,
            onClick: () => handleTabChange(tab.id),
          }))}
        />

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">150+</p>
                <p className="text-xs text-muted-foreground">Verified Vendors</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl p-4 border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">500+</p>
                <p className="text-xs text-muted-foreground">Services Available</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl p-4 border border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">98%</p>
                <p className="text-xs text-muted-foreground">Satisfaction Rate</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 rounded-xl p-4 border border-violet-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-500/20 rounded-lg">
                <Users className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">2.5K+</p>
                <p className="text-xs text-muted-foreground">Events Served</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero CTA Section */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Organizer CTA */}
          <div className="bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20 hover:shadow-lg hover:border-primary/40 transition-all group">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground mb-2">Find Services for Your Event</h2>
                <p className="text-muted-foreground mb-4 text-sm">
                  Discover verified vendors offering venues, catering, photography, and more for your next event.
                </p>
                <Button 
                  onClick={() => setActiveView('discover')}
                  className="w-full sm:w-auto"
                >
                  Browse Services
                </Button>
              </div>
            </div>
          </div>

          {/* Vendor CTA */}
          <div className="bg-gradient-to-br from-secondary/15 via-secondary/10 to-secondary/5 rounded-xl p-6 border border-secondary/20 hover:shadow-lg hover:border-secondary/40 transition-all group">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
                <Building2 className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground mb-2">List Your Services & Products</h2>
                <p className="text-muted-foreground mb-4 text-sm">
                  Join our marketplace as a vendor and connect with event organizers looking for quality services.
                </p>
                <Button 
                  variant="secondary"
                  onClick={() => navigate('/marketplace/vendor')}
                  className="w-full sm:w-auto"
                >
                  Vendor Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Trending Categories */}
        <TrendingCategories />
        
        {/* Featured Services Section */}
        <FeaturedServices />

        {/* Main Content */}
        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">All Services</h2>
              <p className="text-sm text-muted-foreground">Browse and compare services from verified vendors</p>
            </div>
            {compareServices.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setShowComparePanel(true)}
                className="gap-2"
              >
                Compare ({compareServices.length}/4)
              </Button>
            )}
          </div>
          <ServiceDiscoveryUI 
            eventId={eventId || undefined}
          />
        </div>

        {/* Help and Information */}
        <div className="mt-8 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-8 border border-border">
          <h3 className="text-xl font-semibold text-foreground mb-3">Discover Professional Services for Your Events</h3>
          <p className="text-muted-foreground mb-6">
            Browse our curated marketplace of verified vendors offering everything you need to make your events successful.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card/80 rounded-lg p-4 border border-border/50 hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">🔍</div>
              <h4 className="font-semibold text-foreground mb-2">Smart Search</h4>
              <p className="text-sm text-muted-foreground">Find exactly what you need with intelligent filters for category, location, and budget.</p>
            </div>
            <div className="bg-card/80 rounded-lg p-4 border border-border/50 hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">✅</div>
              <h4 className="font-semibold text-foreground mb-2">Verified Vendors</h4>
              <p className="text-sm text-muted-foreground">All vendors are verified and rated by previous customers for quality assurance.</p>
            </div>
            <div className="bg-card/80 rounded-lg p-4 border border-border/50 hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">💬</div>
              <h4 className="font-semibold text-foreground mb-2">Direct Communication</h4>
              <p className="text-sm text-muted-foreground">Connect directly with vendors, request quotes, and coordinate service delivery.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Compare Panel */}
      <QuickComparePanel
        services={compareServices}
        onRemove={handleRemoveFromCompare}
        onClear={handleClearCompare}
        open={showComparePanel}
        onOpenChange={setShowComparePanel}
      />
    </div>
  );
};

export default MarketplacePage;
