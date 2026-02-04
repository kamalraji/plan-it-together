import React, { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, Building2, ShoppingBag } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Import marketplace components
import ServiceDiscoveryUI, { ServiceListingData } from '../../marketplace/ServiceDiscoveryUI';
import { PromoBanner } from '../../marketplace/PromoBanner';
import { CategoryStrip } from '../../marketplace/CategoryStrip';
import QuickComparePanel from '../../marketplace/QuickComparePanel';

/**
 * MarketplacePage - Flipkart/Amazon style marketplace
 */
export const MarketplacePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [compareServices, setCompareServices] = useState<ServiceListingData[]>([]);
  const [showComparePanel, setShowComparePanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  const urlParams = new URLSearchParams(location.search);
  const eventId = urlParams.get('eventId');

  const handleCompareToggle = useCallback((service: ServiceListingData, isSelected: boolean) => {
    setCompareServices(prev => {
      if (isSelected) {
        if (prev.length >= 4) return prev;
        return [...prev, service];
      } else {
        return prev.filter(s => s.id !== service.id);
      }
    });
  }, []);

  void handleCompareToggle;

  const handleRemoveFromCompare = useCallback((serviceId: string) => {
    setCompareServices(prev => prev.filter(s => s.id !== serviceId));
  }, []);

  const handleClearCompare = useCallback(() => {
    setCompareServices([]);
    setShowComparePanel(false);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled via the ServiceDiscoveryUI component
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sticky Header with Search */}
      <div className="sticky top-0 z-40 bg-primary shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center gap-3 sm:gap-4 h-14 sm:h-16">
            {/* Logo/Brand */}
            <div 
              className="flex items-center gap-2 cursor-pointer shrink-0" 
              onClick={() => navigate('/marketplace')}
            >
              <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
              <span className="text-lg sm:text-xl font-bold text-primary-foreground hidden sm:inline">
                Marketplace
              </span>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for services, vendors, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 sm:h-10 pl-10 pr-4 bg-card border-0 rounded-sm text-sm focus-visible:ring-2 focus-visible:ring-primary-foreground/20"
                />
              </div>
            </form>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/marketplace/vendor')}
                className="text-primary-foreground hover:bg-primary-foreground/10 hidden sm:flex gap-1.5"
              >
                <Building2 className="w-4 h-4" />
                <span className="hidden md:inline">Become a Seller</span>
              </Button>
              {compareServices.length > 0 && (
                <Button 
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowComparePanel(true)}
                  className="gap-1.5"
                >
                  Compare ({compareServices.length})
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-4">
        {/* Promo Banner Carousel */}
        <PromoBanner />

        {/* Category Strip */}
        <div className="bg-card rounded-lg p-3 shadow-sm border border-border/50">
          <CategoryStrip 
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Filters Sidebar - Desktop Only */}
          <aside className="hidden lg:block">
            <div className="bg-card rounded-lg p-4 shadow-sm border border-border/50 sticky top-20">
              <h3 className="font-semibold text-foreground mb-4">Filters</h3>
              
              {/* Price Range */}
              <div className="mb-4 pb-4 border-b border-border">
                <h4 className="text-sm font-medium text-foreground mb-2">Price Range</h4>
                <div className="space-y-2">
                  {['Under ₹5,000', '₹5,000 - ₹15,000', '₹15,000 - ₹50,000', 'Above ₹50,000'].map((range) => (
                    <label key={range} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                      <input type="checkbox" className="rounded border-border" />
                      {range}
                    </label>
                  ))}
                </div>
              </div>

              {/* Verified Only */}
              <div className="mb-4 pb-4 border-b border-border">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-border" />
                  <span className="text-foreground font-medium">Verified Vendors Only</span>
                </label>
              </div>

              {/* Rating */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Rating</h4>
                <div className="space-y-2">
                  {['4★ & above', '3★ & above', '2★ & above'].map((rating) => (
                    <label key={rating} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                      <input type="radio" name="rating" className="border-border" />
                      {rating}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="lg:col-span-3">
            <ServiceDiscoveryUI 
              eventId={eventId || undefined}
              searchQuery={searchQuery}
              categoryFilter={selectedCategory}
              displayMode="grid"
            />
          </main>
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
