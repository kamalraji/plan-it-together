import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  CheckCircle2,
  Star,
  Calendar,
  DollarSign,
  ArrowLeft,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react';

interface Vendor {
  id: string;
  business_name: string;
  business_type: string;
  description: string | null;
  contact_email: string;
  contact_phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  categories: string[];
  portfolio_urls: string[];
  verification_status: string;
  verified_at: string | null;
  created_at: string;
}

interface VendorService {
  id: string;
  name: string;
  description: string | null;
  category: string;
  pricing_type: string;
  base_price: number | null;
  price_unit: string | null;
  availability: Record<string, boolean>;
  media_urls: string[];
  tags: string[];
  inclusions: string[];
  service_areas: string[];
  status: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'VENUE': 'Venue & Location',
  'CATERING': 'Catering',
  'PHOTOGRAPHY': 'Photography',
  'VIDEOGRAPHY': 'Videography',
  'ENTERTAINMENT': 'Entertainment',
  'DECORATION': 'Decoration',
  'AUDIO_VISUAL': 'Audio/Visual',
  'TRANSPORTATION': 'Transportation',
  'SECURITY': 'Security',
  'CLEANING': 'Cleaning',
  'EQUIPMENT_RENTAL': 'Equipment Rental',
  'PRINTING': 'Printing',
  'MARKETING': 'Marketing',
  'OTHER': 'Other',
};

const PRICING_LABELS: Record<string, string> = {
  'FIXED': 'Fixed Price',
  'HOURLY': 'Per Hour',
  'PER_PERSON': 'Per Person',
  'CUSTOM_QUOTE': 'Contact for Quote',
};

export const VendorPublicProfilePage: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();

  // Fetch verified vendor
  const { data: vendor, isLoading: vendorLoading, error: vendorError } = useQuery({
    queryKey: ['public-vendor', vendorId],
    queryFn: async () => {
      if (!vendorId) return null;
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .eq('verification_status', 'VERIFIED')
        .maybeSingle();
      if (error) throw error;
      return data as Vendor | null;
    },
    enabled: !!vendorId,
  });

  // Fetch vendor services
  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['public-vendor-services', vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const { data, error } = await supabase
        .from('vendor_services')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as VendorService[];
    },
    enabled: !!vendorId,
  });

  const isLoading = vendorLoading || servicesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (vendorError || !vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Vendor Not Found</h2>
            <p className="text-muted-foreground mb-6">
              This vendor profile doesn't exist or is not yet verified.
            </p>
            <Button asChild>
              <Link to="/marketplace">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse Marketplace
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const location = [vendor.city, vendor.state, vendor.country].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/marketplace">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Link>
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Vendor Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Logo/Avatar Placeholder */}
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
              <Building2 className="w-12 h-12 text-primary" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{vendor.business_name}</h1>
                <Badge className="gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </Badge>
              </div>

              {location && (
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{location}</span>
                </div>
              )}

              {vendor.description && (
                <p className="text-muted-foreground max-w-2xl">{vendor.description}</p>
              )}

              {/* Categories */}
              {vendor.categories && vendor.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {vendor.categories.map((cat) => (
                    <Badge key={cat} variant="secondary">
                      {CATEGORY_LABELS[cat] || cat}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Card */}
            <Card className="w-full md:w-72 shrink-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${vendor.contact_email}`} className="text-sm text-primary hover:underline">
                    {vendor.contact_email}
                  </a>
                </div>
                {vendor.contact_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${vendor.contact_phone}`} className="text-sm text-primary hover:underline">
                      {vendor.contact_phone}
                    </a>
                  </div>
                )}
                {vendor.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={vendor.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      Website <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                <Separator className="my-3" />
                <Button className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Request Quote
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Portfolio Section */}
        {vendor.portfolio_urls && vendor.portfolio_urls.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Portfolio</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {vendor.portfolio_urls.slice(0, 8).map((url, index) => (
                <div 
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden bg-muted border border-border"
                >
                  <img 
                    src={url} 
                    alt={`Portfolio ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services Section */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Services ({services.length})
          </h2>

          {services.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No services listed yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  {/* Service Image */}
                  {service.media_urls && service.media_urls.length > 0 ? (
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      <img 
                        src={service.media_urls[0]} 
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-lg flex items-center justify-center">
                      <Star className="w-12 h-12 text-primary/30" />
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-1">{service.name}</CardTitle>
                      <Badge variant="outline" className="shrink-0">
                        {CATEGORY_LABELS[service.category] || service.category}
                      </Badge>
                    </div>
                    {service.description && (
                      <CardDescription className="line-clamp-2">
                        {service.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Pricing */}
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      {service.pricing_type === 'CUSTOM_QUOTE' ? (
                        <span className="text-sm text-muted-foreground">Contact for pricing</span>
                      ) : (
                        <span className="font-semibold text-foreground">
                          ${service.base_price?.toLocaleString() || '0'}
                          <span className="font-normal text-muted-foreground text-sm">
                            {' '}{PRICING_LABELS[service.pricing_type] || ''}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Availability */}
                    {service.availability && Object.keys(service.availability).length > 0 && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {Object.entries(service.availability)
                            .filter(([_, available]) => available)
                            .map(([day]) => day.slice(0, 3))
                            .join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Inclusions */}
                    {service.inclusions && service.inclusions.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {service.inclusions.slice(0, 3).map((inclusion, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {inclusion}
                          </Badge>
                        ))}
                        {service.inclusions.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{service.inclusions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <Button className="w-full mt-3" variant="outline">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Verified Since */}
        {vendor.verified_at && (
          <div className="mt-12 text-center text-sm text-muted-foreground">
            Verified vendor since {new Date(vendor.verified_at).toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorPublicProfilePage;