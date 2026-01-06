import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  MapPin, 
  Image as ImageIcon, 
  ExternalLink,
  Heart,
  Scale,
  Clock,
  Star,
  Zap,
  Eye
} from 'lucide-react';
import { ServiceListingData } from './ServiceDiscoveryUI';
import { VendorTrustScore } from './VendorTrustScore';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  service: ServiceListingData;
  onBookService: (service: ServiceListingData) => void;
  onCompare?: (service: ServiceListingData, isSelected: boolean) => void;
  isComparing?: boolean;
  variant?: 'default' | 'compact' | 'featured';
}

const formatPrice = (basePrice: number | null, pricingType: string, priceUnit: string | null) => {
  if (!basePrice) {
    return 'Contact for pricing';
  }
  
  const formattedPrice = basePrice.toLocaleString();
  
  switch (pricingType) {
    case 'FIXED':
      return `$${formattedPrice}`;
    case 'HOURLY':
      return `$${formattedPrice}/hour`;
    case 'PER_PERSON':
      return `$${formattedPrice}/person`;
    case 'CUSTOM_QUOTE':
      return 'Custom Quote';
    default:
      return priceUnit ? `$${formattedPrice}/${priceUnit}` : `$${formattedPrice}`;
  }
};

const formatCategory = (category: string) => {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

export const ServiceCard: React.FC<ServiceCardProps> = ({ 
  service, 
  onBookService,
  onCompare,
  isComparing = false,
  variant = 'default'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const imageUrl = service.media_urls?.[0];
  const vendorLocation = [service.vendor?.city, service.vendor?.state]
    .filter(Boolean)
    .join(', ');

  // Mock trust metrics (in real app, these would come from the service data)
  const trustMetrics = {
    isVerified: service.vendor?.verification_status === 'VERIFIED',
    avgRating: 4.5, // Would come from actual data
    reviewCount: 12, // Would come from actual data
    responseTime: 'fast' as const,
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
  };

  const handleCompareToggle = (checked: boolean) => {
    onCompare?.(service, checked);
  };

  if (variant === 'compact') {
    return (
      <Card className="border-border/60 overflow-hidden hover:shadow-md transition-all group">
        <CardContent className="p-3">
          <div className="flex gap-3">
            {/* Compact Image */}
            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              {imageUrl ? (
                <img src={imageUrl} alt={service.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                </div>
              )}
            </div>

            {/* Compact Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="font-medium text-sm text-foreground truncate">{service.name}</h3>
                {trustMetrics.isVerified && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground truncate">{service.vendor?.business_name}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-semibold text-primary">
                  {formatPrice(service.base_price, service.pricing_type, service.price_unit)}
                </span>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                  View
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        'border-border/60 overflow-hidden transition-all duration-300',
        'hover:shadow-lg hover:border-primary/20',
        isComparing && 'ring-2 ring-primary/50 border-primary/50',
        variant === 'featured' && 'border-primary/30 bg-gradient-to-br from-primary/5 to-transparent'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Service Image with Overlay Actions */}
          <div className="relative flex-shrink-0 lg:w-56 overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={service.name}
                className={cn(
                  'w-full h-44 lg:h-full object-cover transition-transform duration-500',
                  isHovered && 'scale-110'
                )}
              />
            ) : (
              <div className="w-full h-44 lg:h-full bg-muted flex items-center justify-center">
                <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
              </div>
            )}

            {/* Image Overlay Actions */}
            <div className={cn(
              'absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent',
              'flex items-end justify-between p-3 transition-opacity duration-300',
              isHovered ? 'opacity-100' : 'opacity-0 lg:opacity-100'
            )}>
              <div className="flex gap-1.5">
                {onCompare && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCompareToggle(!isComparing); }}
                    className={cn(
                      'p-2 rounded-full backdrop-blur-sm transition-colors',
                      isComparing 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-white/20 text-white hover:bg-white/30'
                    )}
                    title="Compare"
                  >
                    <Scale className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleFavorite}
                  className={cn(
                    'p-2 rounded-full backdrop-blur-sm transition-colors',
                    isFavorited 
                      ? 'bg-rose-500 text-white' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  )}
                  title="Save to favorites"
                >
                  <Heart className={cn('w-4 h-4', isFavorited && 'fill-current')} />
                </button>
              </div>

              {/* Quick View Count */}
              <div className="flex items-center gap-1 text-xs text-white/80">
                <Eye className="w-3.5 h-3.5" />
                <span>1.2k views</span>
              </div>
            </div>

            {/* Featured Badge */}
            {variant === 'featured' && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Featured
                </Badge>
              </div>
            )}
          </div>

          {/* Service Details */}
          <div className="flex-1 p-5">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Title Row */}
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {service.name}
                  </h3>
                  {trustMetrics.isVerified && (
                    <Badge variant="outline" className="text-xs gap-1 border-emerald-500/50 text-emerald-600">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </Badge>
                  )}
                </div>

                {/* Description */}
                <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                  {service.description || 'No description available'}
                </p>
                
                {/* Vendor Info with Trust Score */}
                <div className="flex flex-wrap items-center gap-4 mb-3">
                  <Link 
                    to={`/vendor/${service.vendor?.id}`}
                    className="flex items-center gap-1.5 hover:text-primary transition-colors group/vendor"
                  >
                    <span className="text-sm font-medium text-foreground group-hover/vendor:text-primary">
                      {service.vendor?.business_name}
                    </span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover/vendor:opacity-100 transition-opacity" />
                  </Link>
                  
                  <VendorTrustScore metrics={trustMetrics} variant="badge" />
                </div>

                {/* Category, Location, Response Time */}
                <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                  <Badge variant="outline" className="text-xs">
                    {formatCategory(service.category)}
                  </Badge>
                  
                  {vendorLocation && (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {vendorLocation}
                    </span>
                  )}

                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-emerald-600 font-medium">Usually responds within 2 hours</span>
                  </span>
                </div>

                {/* Inclusions with Icons */}
                {service.inclusions && service.inclusions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {service.inclusions.slice(0, 4).map((inclusion, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        <span>{inclusion}</span>
                      </div>
                    ))}
                    {service.inclusions.length > 4 && (
                      <span className="text-xs text-primary px-2 py-1">
                        +{service.inclusions.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Tags */}
                {service.tags && service.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {service.tags.slice(0, 4).map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs font-normal">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing and Actions */}
              <div className="lg:text-right shrink-0 lg:ml-4">
                {/* Price Display */}
                <div className="mb-1">
                  <span className="text-xs text-muted-foreground">Starting from</span>
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {formatPrice(service.base_price, service.pricing_type, service.price_unit)}
                </div>
                
                {/* Urgency Indicator */}
                <div className="flex items-center gap-1 text-xs text-amber-600 mb-4 lg:justify-end">
                  <Zap className="w-3.5 h-3.5" />
                  <span>High demand this week</span>
                </div>

                {/* Action Buttons */}
                <div className="flex lg:flex-col gap-2">
                  <Button
                    onClick={() => onBookService(service)}
                    className="flex-1 lg:w-full gap-2"
                  >
                    Request Quote
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 lg:w-full"
                    asChild
                  >
                    <Link to={`/vendor/${service.vendor?.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
