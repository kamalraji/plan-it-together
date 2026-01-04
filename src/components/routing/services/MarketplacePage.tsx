import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { Button } from '@/components/ui/button';
import { Search, Building2 } from 'lucide-react';

// Import existing marketplace components
import ServiceDiscoveryUI from '../../marketplace/ServiceDiscoveryUI';
import FeaturedServices from '../../marketplace/FeaturedServices';

/**
 * MarketplacePage provides a customer-facing marketplace interface for browsing and booking services.
 * 
 * Features:
 * - Service discovery with real Supabase data
 * - Browse verified vendors and their services
 * - Request quotes from vendors
 */
export const MarketplacePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'discover' | 'vendors'>('discover');

  // Extract eventId from URL params if present
  const urlParams = new URLSearchParams(location.search);
  const eventId = urlParams.get('eventId');
  const eventName = urlParams.get('eventName');

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
    <div className="px-4 sm:px-6 lg:px-8">
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

        {/* Hero CTA Section */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Organizer CTA */}
          <div className="bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
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
          <div className="bg-gradient-to-br from-secondary/15 via-secondary/10 to-secondary/5 rounded-xl p-6 border border-secondary/20 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-secondary/10 rounded-lg">
                <Building2 className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground mb-2">List Your Services & Products</h2>
                <p className="text-muted-foreground mb-4 text-sm">
                  Join our marketplace as a vendor and connect with event organizers looking for quality services.
                </p>
                <Button 
                  variant="secondary"
                  onClick={() => navigate('/dashboard/marketplace/vendor')}
                  className="w-full sm:w-auto"
                >
                  Vendor Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Featured Services Section */}
        <FeaturedServices />

        {/* Main Content */}
        <div className="bg-card rounded-lg border p-6">
          <ServiceDiscoveryUI eventId={eventId || undefined} />
        </div>

        {/* Help and Information */}
        <div className="mt-8 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-8 border border-border">
          <h3 className="text-xl font-semibold text-foreground mb-3">Discover Professional Services for Your Events</h3>
          <p className="text-muted-foreground mb-6">
            Browse our curated marketplace of verified vendors offering everything you need to make your events successful.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card/80 rounded-lg p-4 border border-border/50">
              <div className="text-2xl mb-2">🔍</div>
              <h4 className="font-semibold text-foreground mb-2">Smart Search</h4>
              <p className="text-sm text-muted-foreground">Find exactly what you need with intelligent filters for category, location, and budget.</p>
            </div>
            <div className="bg-card/80 rounded-lg p-4 border border-border/50">
              <div className="text-2xl mb-2">✅</div>
              <h4 className="font-semibold text-foreground mb-2">Verified Vendors</h4>
              <p className="text-sm text-muted-foreground">All vendors are verified and rated by previous customers for quality assurance.</p>
            </div>
            <div className="bg-card/80 rounded-lg p-4 border border-border/50">
              <div className="text-2xl mb-2">💬</div>
              <h4 className="font-semibold text-foreground mb-2">Direct Communication</h4>
              <p className="text-sm text-muted-foreground">Connect directly with vendors, request quotes, and coordinate service delivery.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;
