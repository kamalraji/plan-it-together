import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { StarIcon, MapPinIcon, ClockIcon, CheckCircleIcon, XCircleIcon, ShieldCheckIcon, CalendarIcon } from '@heroicons/react/24/solid';

interface Vendor {
  id: string;
  business_name: string;
  description: string | null;
  contact_email: string;
  contact_phone: string | null;
  website: string | null;
  verification_status: string;
  rating: number;
  review_count: number;
  response_time_hours: number;
  portfolio_images: string[] | null;
}

interface Service {
  id: string;
  vendor_id: string | null;
  name: string;
  description: string | null;
  category: string | null;
  base_price: number;
  currency: string;
  pricing_type: string | null;
  location: string | null;
  photos: string[] | null;
  rating: number;
  review_count: number;
  inclusions: string[] | null;
  exclusions: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  vendor?: Vendor;
}

export const ServiceDetailPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [showCalendar, setShowCalendar] = useState(false);

  const { data: service, isLoading, error } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      if (!serviceId) throw new Error('Service ID is required');

      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (serviceError) throw serviceError;
      if (!serviceData) throw new Error('Service not found');

      // Fetch vendor details if vendor_id exists
      if (serviceData.vendor_id) {
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', serviceData.vendor_id)
          .single();

        if (!vendorError && vendorData) {
          return { ...serviceData, vendor: vendorData } as Service;
        }
      }

      return serviceData as Service;
    },
    enabled: !!serviceId,
  });

  const formatPrice = (service: Service) => {
    const price = service.base_price;
    
    switch (service.pricing_type) {
      case 'FIXED':
        return `$${price.toLocaleString()}`;
      case 'HOURLY':
        return `$${price.toLocaleString()}/hour`;
      case 'PER_PERSON':
        return `$${price.toLocaleString()}/person`;
      case 'CUSTOM_QUOTE':
        return 'Custom Quote';
      default:
        return 'Contact for pricing';
    }
  };

  const handleBookNow = () => {
    if (!selectedDate) {
      setShowCalendar(true);
      return;
    }
    // Navigate to booking page with selected date
    const dateParam = selectedDate.toISOString().split('T')[0];
    navigate(`/marketplace/bookings/new?serviceId=${serviceId}&date=${dateParam}`);
  };

  const handleContactVendor = () => {
    if (service?.vendor?.contact_email) {
      window.location.href = `mailto:${service.vendor.contact_email}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Not Found</h2>
          <p className="text-gray-600 mb-8">The service you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/marketplace/services')}>
            Browse All Services
          </Button>
        </div>
      </div>
    );
  }

  const photos = service.photos && service.photos.length > 0 
    ? service.photos 
    : ['https://images.unsplash.com/photo-1540575467063-178a50c2df87'];

  return (
    <div className="min-h-screen bg-background">
      {/* Header with breadcrumb */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <button onClick={() => navigate('/marketplace')} className="hover:text-primary">
              Marketplace
            </button>
            <span>/</span>
            <button onClick={() => navigate('/marketplace/services')} className="hover:text-primary">
              Services
            </button>
            <span>/</span>
            <span className="text-foreground">{service.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Photos and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                  <img
                    src={photos[selectedPhoto]}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {photos.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 p-4">
                    {photos.map((photo: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedPhoto(idx)}
                        className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                          selectedPhoto === idx ? 'border-primary' : 'border-transparent hover:border-muted'
                        }`}
                      >
                        <img src={photo} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Details Tabs */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {service.is_featured && (
                        <Badge variant="default">Featured</Badge>
                      )}
                      <Badge variant="outline">{service.category}</Badge>
                    </div>
                    <CardTitle className="text-2xl mb-2">{service.name}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="h-4 w-4" />
                        <span>{service.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <StarIcon className="h-4 w-4 text-yellow-500" />
                        <span>{service.rating.toFixed(1)} ({service.review_count} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">{formatPrice(service)}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="description">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="inclusions">What's Included</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="description" className="space-y-4 mt-4">
                    <p className="text-muted-foreground">{service.description}</p>
                  </TabsContent>
                  
                  <TabsContent value="inclusions" className="space-y-4 mt-4">
                    {service.inclusions && service.inclusions.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          Included
                        </h4>
                        <ul className="space-y-2">
                          {service.inclusions.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {service.exclusions && service.exclusions.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <XCircleIcon className="h-5 w-5 text-red-500" />
                          Not Included
                        </h4>
                        <ul className="space-y-2">
                          {service.exclusions.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <XCircleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="reviews" className="space-y-4 mt-4">
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Reviews feature coming soon</p>
                      <p className="text-sm mt-2">{service.review_count} verified reviews</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Vendor Info and Booking */}
          <div className="space-y-6">
            {/* Vendor Info Card */}
            {service.vendor && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    About the Vendor
                    {service.vendor.verification_status === 'VERIFIED' && (
                      <ShieldCheckIcon className="h-5 w-5 text-green-500" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{service.vendor.business_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{service.vendor.business_name}</h4>
                      {service.vendor.verification_status === 'VERIFIED' && (
                        <Badge variant="outline" className="text-xs">Verified Vendor</Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {service.vendor.description}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Rating</span>
                      <div className="flex items-center gap-1">
                        <StarIcon className="h-4 w-4 text-yellow-500" />
                        <span className="font-semibold">{service.vendor.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Reviews</span>
                      <span className="font-semibold">{service.vendor.review_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Response Time</span>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        <span className="font-semibold">{service.vendor.response_time_hours}h</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(`/marketplace/vendors/${service.vendor_id}`)}
                  >
                    View Vendor Profile
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Booking Card */}
            <Card>
              <CardHeader>
                <CardTitle>Book This Service</CardTitle>
                <CardDescription>
                  Select your preferred date and request a booking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Selection */}
                <div>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    onClick={() => setShowCalendar(!showCalendar)}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    }) : 'Select Date'}
                  </Button>
                  
                  {showCalendar && (
                    <div className="mt-2 border rounded-lg p-3 bg-card">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setShowCalendar(false);
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={handleBookNow}
                    disabled={!selectedDate}
                  >
                    {selectedDate ? 'Request Booking' : 'Select Date to Continue'}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleContactVendor}>
                    Contact Vendor
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                  No payment required until vendor confirms availability
                </p>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>Our marketplace support team is here to help with your booking.</p>
                <Button variant="link" className="p-0 h-auto text-xs" onClick={() => navigate('/help')}>
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};