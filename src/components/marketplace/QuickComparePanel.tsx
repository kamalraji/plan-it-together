import React from 'react';
import { X, Scale, Star, MapPin, DollarSign, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useNavigate } from 'react-router-dom';
import { ServiceListingData } from './ServiceDiscoveryUI';

interface QuickComparePanelProps {
  services: ServiceListingData[];
  onRemove: (serviceId: string) => void;
  onClear: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatPrice = (basePrice: number | null, pricingType: string) => {
  if (!basePrice) return 'Quote';
  const formattedPrice = basePrice.toLocaleString();
  
  switch (pricingType) {
    case 'HOURLY': return `$${formattedPrice}/hr`;
    case 'PER_PERSON': return `$${formattedPrice}/pp`;
    default: return `$${formattedPrice}`;
  }
};

export const QuickComparePanel: React.FC<QuickComparePanelProps> = ({
  services,
  onRemove,
  onClear,
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();

  if (services.length === 0) return null;

  return (
    <>
      {/* Floating Compare Button */}
      {!open && services.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => onOpenChange(true)}
            size="lg"
            className="shadow-lg gap-2 animate-pulse hover:animate-none"
          >
            <Scale className="w-5 h-5" />
            Compare ({services.length})
          </Button>
        </div>
      )}

      {/* Compare Sheet */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[70vh] sm:h-[60vh]">
          <SheetHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              Compare Services ({services.length})
            </SheetTitle>
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear All
            </Button>
          </SheetHeader>

          <div className="mt-6 overflow-x-auto">
            <div className="inline-flex gap-4 min-w-full pb-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="relative w-72 flex-shrink-0 rounded-xl border bg-card p-4"
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => onRemove(service.id)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-muted hover:bg-destructive/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>

                  {/* Service Image */}
                  {service.media_urls?.[0] && (
                    <img
                      src={service.media_urls[0]}
                      alt={service.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}

                  {/* Service Info */}
                  <h3 className="font-semibold text-foreground mb-1 pr-6 line-clamp-1">
                    {service.name}
                  </h3>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    {service.vendor?.verification_status === 'VERIFIED' && (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    <span className="line-clamp-1">{service.vendor?.business_name}</span>
                  </div>

                  {/* Comparison Metrics */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" />
                        Price
                      </span>
                      <span className="font-medium text-foreground">
                        {formatPrice(service.base_price, service.pricing_type)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        Location
                      </span>
                      <span className="text-foreground text-right max-w-[60%] truncate">
                        {service.vendor?.city || service.service_areas?.[0] || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5" />
                        Status
                      </span>
                      <Badge variant={service.vendor?.verification_status === 'VERIFIED' ? 'default' : 'secondary'} className="text-xs">
                        {service.vendor?.verification_status === 'VERIFIED' ? 'Verified' : 'Pending'}
                      </Badge>
                    </div>
                  </div>

                  {/* Inclusions */}
                  {service.inclusions && service.inclusions.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-1">Includes:</p>
                      <div className="flex flex-wrap gap-1">
                        {service.inclusions.slice(0, 3).map((item, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                        {service.inclusions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{service.inclusions.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      Request Quote
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/vendor/${service.vendor?.id}`)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Row */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-muted/50 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {services.length} service{services.length !== 1 ? 's' : ''} selected for comparison
              </p>
              <Button onClick={() => onOpenChange(false)}>
                Done Comparing
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default QuickComparePanel;
