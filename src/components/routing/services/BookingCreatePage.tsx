import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, CalendarIcon, Loader2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ServiceWithVendor {
  id: string;
  name: string;
  base_price: number | null;
  vendor: {
    id: string;
    business_name: string;
    contact_email: string | null;
  } | null;
}

export const BookingCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  const serviceId = searchParams.get('serviceId');
  const dateParam = searchParams.get('date');
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    dateParam ? new Date(dateParam) : undefined
  );
  const [notes, setNotes] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Fetch service details
  const { data: service, isLoading: serviceLoading } = useQuery({
    queryKey: ['service-booking', serviceId],
    queryFn: async (): Promise<ServiceWithVendor | null> => {
      if (!serviceId) return null;
      
      // First fetch the service
      const serviceQuery = supabase
        .from('services')
        .select('id, name, base_price, vendor_id')
        .eq('id', serviceId)
        .single();
      
      const { data: serviceData, error: serviceError } = await serviceQuery;
      if (serviceError) throw serviceError;
      if (!serviceData) return null;
      
      // Then fetch the vendor if there's a vendor_id
      let vendorData = null;
      if (serviceData.vendor_id) {
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id, business_name, contact_email')
          .eq('id', serviceData.vendor_id)
          .single();
        vendorData = vendor;
      }
      
      return {
        id: serviceData.id,
        name: serviceData.name,
        base_price: serviceData.base_price,
        vendor: vendorData,
      };
    },
    enabled: !!serviceId,
  });

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user-booking'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, email, phone')
        .eq('id', user.id)
        .single();
      
      return { ...user, profile };
    },
  });

  // Pre-fill contact info from user profile
  React.useEffect(() => {
    if (currentUser?.profile) {
      setContactName(currentUser.profile.full_name || '');
      setContactEmail(currentUser.profile.email || currentUser.email || '');
      setContactPhone(currentUser.profile.phone || '');
    }
  }, [currentUser]);

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!serviceId || !selectedDate || !currentUser) {
        throw new Error('Missing required data');
      }

      const { error } = await supabase
        .from('bookings')
        .insert({
          service_id: serviceId,
          vendor_id: service?.vendor?.id || null,
          user_id: currentUser.id,
          event_date: selectedDate.toISOString(),
          status: 'PENDING',
          notes: notes.trim() || null,
          contact_name: contactName.trim(),
          contact_email: contactEmail.trim(),
          contact_phone: contactPhone.trim() || null,
        });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setBookingSuccess(true);
      toast.success('Booking request submitted successfully!');
    },
    onError: (error) => {
      console.error('Booking failed:', error);
      toast.error('Failed to create booking. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }
    if (!contactName.trim() || !contactEmail.trim()) {
      toast.error('Please fill in your contact details');
      return;
    }
    
    createBookingMutation.mutate();
  };

  if (serviceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!serviceId || !service) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Service not found or no service specified.</p>
            <Button variant="outline" onClick={() => navigate('/marketplace')} className="mt-4">
              Browse Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-success mx-auto" />
            <h2 className="text-2xl font-bold">Booking Submitted!</h2>
            <p className="text-muted-foreground">
              Your booking request for <strong>{service.name}</strong> has been submitted. 
              The vendor will review your request and get back to you soon.
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <Button variant="outline" onClick={() => navigate('/marketplace/bookings')}>
                View My Bookings
              </Button>
              <Button onClick={() => navigate('/marketplace')}>
                Browse More Services
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Book Service</CardTitle>
          <CardDescription>
            Complete the form below to request a booking for {service.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Service Summary */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-lg">{service.name}</h3>
            <p className="text-sm text-muted-foreground">{service.vendor?.business_name}</p>
            {service.base_price && (
              <p className="text-sm font-medium mt-2">
                Starting at ${service.base_price.toLocaleString()}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label>Event Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : 'Select a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Contact Information</h4>
              
              <div className="space-y-2">
                <Label htmlFor="contactName">Full Name *</Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone (optional)</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requirements or questions for the vendor..."
                rows={4}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createBookingMutation.isPending}
                className="flex-1"
              >
                {createBookingMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Booking Request'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingCreatePage;
