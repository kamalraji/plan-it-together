import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ActionButton } from '@/components/ui/action-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Mail, Send } from 'lucide-react';

const quoteFormSchema = z.object({
  senderName: z.string().min(2, 'Name must be at least 2 characters'),
  senderEmail: z.string().email('Please enter a valid email'),
  senderPhone: z.string().optional(),
  eventType: z.string().optional(),
  eventDate: z.string().optional(),
  guestCount: z.coerce.number().optional(),
  budget: z.string().optional(),
  message: z.string().min(10, 'Please provide more details (at least 10 characters)'),
});

type QuoteFormData = z.infer<typeof quoteFormSchema>;

interface VendorService {
  id: string;
  name: string;
}

interface RequestQuoteFormProps {
  vendorName: string;
  vendorEmail: string;
  services?: VendorService[];
  trigger?: React.ReactNode;
}

const EVENT_TYPES = [
  'Corporate Event',
  'Wedding',
  'Birthday Party',
  'Conference',
  'Trade Show',
  'Concert',
  'Festival',
  'Workshop',
  'Seminar',
  'Networking Event',
  'Product Launch',
  'Other',
];

const BUDGET_RANGES = [
  'Under $1,000',
  '$1,000 - $5,000',
  '$5,000 - $10,000',
  '$10,000 - $25,000',
  '$25,000 - $50,000',
  '$50,000+',
  'Flexible / Not Sure',
];

export const RequestQuoteForm: React.FC<RequestQuoteFormProps> = ({
  vendorName,
  vendorEmail,
  services = [],
  trigger,
}) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      senderName: '',
      senderEmail: user?.email || '',
      senderPhone: '',
      eventType: '',
      eventDate: '',
      guestCount: undefined,
      budget: '',
      message: '',
    },
  });

  const toggleService = (serviceName: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceName)
        ? prev.filter((s) => s !== serviceName)
        : [...prev, serviceName]
    );
  };

  const onSubmit = async (data: QuoteFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('send-quote-request', {
        body: {
          vendorEmail,
          vendorName,
          senderName: data.senderName,
          senderEmail: data.senderEmail,
          senderPhone: data.senderPhone,
          eventDate: data.eventDate,
          eventType: data.eventType,
          guestCount: data.guestCount,
          budget: data.budget,
          message: data.message,
          serviceNames: selectedServices,
        },
      });

      if (error) throw error;

      toast.success('Quote request sent successfully!', {
        description: `${vendorName} will receive your inquiry and respond soon.`,
      });
      reset();
      setSelectedServices([]);
      setOpen(false);
    } catch (error: any) {
      console.error('Failed to send quote request:', error);
      toast.error('Failed to send quote request', {
        description: error.message || 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full">
            <Mail className="w-4 h-4 mr-2" />
            Request Quote
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request a Quote from {vendorName}</DialogTitle>
          <DialogDescription>
            Fill out the form below and the vendor will respond to your inquiry.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="senderName">Your Name *</Label>
              <Input
                id="senderName"
                placeholder="John Doe"
                {...register('senderName')}
              />
              {errors.senderName && (
                <p className="text-sm text-destructive">{errors.senderName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderEmail">Email *</Label>
              <Input
                id="senderEmail"
                type="email"
                placeholder="john@example.com"
                {...register('senderEmail')}
              />
              {errors.senderEmail && (
                <p className="text-sm text-destructive">{errors.senderEmail.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="senderPhone">Phone (Optional)</Label>
            <Input
              id="senderPhone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              {...register('senderPhone')}
            />
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type</Label>
              <Select onValueChange={(val) => setValue('eventType', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date</Label>
              <Input id="eventDate" type="date" {...register('eventDate')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guestCount">Expected Guests</Label>
              <Input
                id="guestCount"
                type="number"
                placeholder="100"
                {...register('guestCount')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget Range</Label>
              <Select onValueChange={(val) => setValue('budget', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_RANGES.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Services Selection */}
          {services.length > 0 && (
            <div className="space-y-2">
              <Label>Services Interested In</Label>
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-lg border">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={service.id}
                      checked={selectedServices.includes(service.name)}
                      onCheckedChange={() => toggleService(service.name)}
                    />
                    <label
                      htmlFor={service.id}
                      className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {service.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Describe your event and requirements in detail..."
              className="min-h-[120px]"
              {...register('message')}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>

          <ActionButton 
            type="submit" 
            className="w-full" 
            isLoading={isSubmitting}
            loadingText="Sending..."
            icon={<Send className="w-4 h-4" />}
          >
            Send Quote Request
          </ActionButton>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RequestQuoteForm;
