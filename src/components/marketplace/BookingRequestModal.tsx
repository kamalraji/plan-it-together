import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ServiceListingData } from './ServiceDiscoveryUI';

interface BookingRequestModalProps {
  service: ServiceListingData;
  eventId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export const BookingRequestModal: React.FC<BookingRequestModalProps> = ({ 
  service, 
  eventId: _eventId, 
  open, 
  onOpenChange
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [bookingData, setBookingData] = useState({
    serviceDate: '',
    requirements: '',
    budgetMin: '',
    budgetMax: '',
    additionalNotes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to request a quote.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Navigate to the vendor's profile with the quote request form
      const params = new URLSearchParams({
        requestQuote: 'true',
        serviceId: service.id,
        ...(bookingData.serviceDate && { eventDate: bookingData.serviceDate }),
      });
      
      navigate(`/vendor/${service.vendor?.id}?${params.toString()}`);
      onOpenChange(false);
      toast({
        title: 'Redirecting',
        description: 'You can complete your quote request on the vendor page.',
      });
    } catch (error) {
      console.error('Failed to process request:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Quote</DialogTitle>
          <DialogDescription>
            Get a custom quote for this service from {service.vendor?.business_name}
          </DialogDescription>
        </DialogHeader>

        {/* Service Summary */}
        <div className="bg-muted rounded-lg p-4 mb-4">
          <h3 className="font-medium text-foreground mb-1">{service.name}</h3>
          <p className="text-sm text-muted-foreground mb-1">{service.vendor?.business_name}</p>
          <p className="text-sm text-muted-foreground">
            {formatPrice(service.base_price, service.pricing_type, service.price_unit)}
          </p>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serviceDate">Service Date *</Label>
            <Input
              id="serviceDate"
              type="date"
              required
              value={bookingData.serviceDate}
              onChange={(e) => setBookingData(prev => ({ ...prev, serviceDate: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements *</Label>
            <Textarea
              id="requirements"
              required
              rows={4}
              placeholder="Describe your specific requirements for this service..."
              value={bookingData.requirements}
              onChange={(e) => setBookingData(prev => ({ ...prev, requirements: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budgetMin">Budget Range (Min)</Label>
              <Input
                id="budgetMin"
                type="number"
                placeholder="0"
                value={bookingData.budgetMin}
                onChange={(e) => setBookingData(prev => ({ ...prev, budgetMin: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetMax">Budget Range (Max)</Label>
              <Input
                id="budgetMax"
                type="number"
                placeholder="0"
                value={bookingData.budgetMax}
                onChange={(e) => setBookingData(prev => ({ ...prev, budgetMax: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Additional Notes</Label>
            <Textarea
              id="additionalNotes"
              rows={3}
              placeholder="Any additional information or special requests..."
              value={bookingData.additionalNotes}
              onChange={(e) => setBookingData(prev => ({ ...prev, additionalNotes: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSubmitting ? 'Processing...' : 'Continue to Vendor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
