import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, CheckCircle, MapPin, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { ServiceListing, formatPrice, formatCategory } from './types';

interface ServiceCardProps {
  service: ServiceListing;
  onBookService: (service: ServiceListing) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onBookService }) => {
  return (
    <Card className="border-border/60 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Service Image */}
          <div className="flex-shrink-0 lg:w-52">
            {service.media.length > 0 && service.media[0].type === 'IMAGE' ? (
              <img
                src={service.media[0].url}
                alt={service.title}
                className="w-full h-40 lg:h-full object-cover"
              />
            ) : (
              <div className="w-full h-40 lg:h-full bg-muted flex items-center justify-center">
                <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
              </div>
            )}
          </div>

          {/* Service Details */}
          <div className="flex-1 p-5">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-foreground truncate">
                    {service.title}
                  </h3>
                  {service.featured && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                      <Star className="h-3 w-3 mr-1 fill-current" /> Featured
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{service.description}</p>
                
                {/* Vendor Info */}
                <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
                  <Link 
                    to={`/vendor/${service.vendor.id}`}
                    className="flex items-center gap-1 hover:text-primary transition-colors group"
                  >
                    <span className="font-medium text-foreground group-hover:text-primary">
                      {service.vendor.businessName}
                    </span>
                    {service.vendor.verificationStatus === 'VERIFIED' && (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    )}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < Math.floor(service.vendor.rating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-1">
                      {service.vendor.rating.toFixed(1)} ({service.vendor.reviewCount})
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>~{service.vendor.responseTime}h</span>
                  </div>
                </div>

                {/* Service Category and Location */}
                <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
                  <Badge variant="outline" className="text-xs">
                    {formatCategory(service.category)}
                  </Badge>
                  <span className="text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 inline mr-1" />
                    {service.serviceArea.join(', ')}
                  </span>
                </div>

                {/* Inclusions */}
                {service.inclusions.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Includes:</span>{' '}
                    {service.inclusions.slice(0, 3).join(', ')}
                    {service.inclusions.length > 3 && ` +${service.inclusions.length - 3} more`}
                  </p>
                )}
              </div>

              {/* Pricing and Actions */}
              <div className="lg:text-right shrink-0">
                <div className="text-lg font-semibold text-foreground mb-3">
                  {formatPrice(service.pricing)}
                </div>
                <div className="flex lg:flex-col gap-2">
                  <Button
                    onClick={() => onBookService(service)}
                    size="sm"
                    className="flex-1 lg:w-full"
                  >
                    Request Quote
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 lg:w-full">
                    View Details
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
