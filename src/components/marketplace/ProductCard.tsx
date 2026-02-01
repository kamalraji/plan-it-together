import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, BadgeCheck, Image as ImageIcon, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ServiceListingData } from './ServiceDiscoveryUI';

interface ProductCardProps {
  service: ServiceListingData;
  onBookService: (service: ServiceListingData) => void;
}

const formatPrice = (basePrice: number | null, pricingType: string, _priceUnit: string | null) => {
  if (!basePrice) return 'Get Quote';
  const formatted = basePrice.toLocaleString('en-IN');
  switch (pricingType) {
    case 'HOURLY': return `₹${formatted}/hr`;
    case 'PER_PERSON': return `₹${formatted}/person`;
    case 'CUSTOM_QUOTE': return 'Get Quote';
    default: return `₹${formatted}`;
  }
};

const formatCategory = (category: string) => {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

export const ProductCard: React.FC<ProductCardProps> = ({ service, onBookService }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageUrl = service.media_urls?.[0];
  const isVerified = service.vendor?.verification_status === 'VERIFIED';

  // Mock rating data
  const rating = 4.2 + Math.random() * 0.7;
  const reviewCount = Math.floor(Math.random() * 200) + 10;

  return (
    <div className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={service.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => { e.preventDefault(); setIsFavorited(!isFavorited); }}
          className="absolute top-2 right-2 p-2 rounded-full bg-card/90 shadow-sm hover:bg-card transition-colors"
        >
          <Heart className={cn('w-4 h-4', isFavorited ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground')} />
        </button>

        {/* Sponsored/Featured Badge */}
        {Math.random() > 0.7 && (
          <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] px-1.5 py-0.5">
            <Zap className="w-3 h-3 mr-0.5" />
            Deal
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Vendor Name */}
        <div className="flex items-center gap-1 mb-1">
          <Link 
            to={`/vendor/${service.vendor?.id}`}
            className="text-xs text-primary hover:underline font-medium truncate"
          >
            {service.vendor?.business_name}
          </Link>
          {isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
        </div>

        {/* Service Name */}
        <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-1.5 min-h-[40px] group-hover:text-primary transition-colors">
          {service.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex items-center gap-0.5 bg-emerald-600 text-white text-xs px-1.5 py-0.5 rounded">
            <span className="font-medium">{rating.toFixed(1)}</span>
            <Star className="w-3 h-3 fill-current" />
          </div>
          <span className="text-xs text-muted-foreground">({reviewCount})</span>
          {isVerified && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-200 text-blue-600 ml-auto">
              Assured
            </Badge>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-foreground">
            {formatPrice(service.base_price, service.pricing_type, service.price_unit)}
          </span>
          {service.base_price && (
            <>
              <span className="text-xs text-muted-foreground line-through">
                ₹{Math.floor(service.base_price * 1.2).toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-emerald-600 font-medium">20% off</span>
            </>
          )}
        </div>

        {/* Category Tag */}
        <div className="mt-2 pt-2 border-t border-border/50">
          <span className="text-[11px] text-muted-foreground">
            {formatCategory(service.category)}
          </span>
        </div>
      </div>

      {/* Quick Action on Hover */}
      <div className="px-3 pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onBookService(service)}
          className="w-full py-2 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Request Quote
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
