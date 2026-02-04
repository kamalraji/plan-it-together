import React, { useState, useMemo, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/looseClient';
import { Event, Registration, RegistrationStatus } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { usePrimaryOrganization } from '@/hooks/usePrimaryOrganization';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TicketTierSelector, type TicketSelection } from '@/components/events/registration/TicketTierSelector';
import { OrderSummary } from '@/components/events/registration/OrderSummary';
import { AttendeeDetailsForm, type AttendeeDetails } from './AttendeeDetailsForm';

interface RegistrationFormProps {
  event: Event;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface EventCapacityInfo {
  totalRegistrations: number;
  confirmedRegistrations: number;
  waitlistCount: number;
  spotsRemaining: number | null;
}

type RegistrationStep = 'tickets' | 'details' | 'review';

const STEPS: { key: RegistrationStep; label: string }[] = [
  { key: 'tickets', label: 'Select Tickets' },
  { key: 'details', label: 'Attendee Details' },
  { key: 'review', label: 'Review & Confirm' },
];

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  event,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: primaryOrg } = usePrimaryOrganization();
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('tickets');
  
  // Ticket selection state
  const [ticketSelection, setTicketSelection] = useState<TicketSelection | null>(null);
  const [promoCodeId, setPromoCodeId] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  
  // Attendee details state
  const [attendees, setAttendees] = useState<AttendeeDetails[]>([
    { name: user?.name || '', email: user?.email || '', phone: '' }
  ]);
  
  // Terms acceptance
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Check if event has ticket tiers (paid event)
  const { data: hasTiers } = useQuery({
    queryKey: ['event-has-tiers', event.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('ticket_tiers')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .eq('is_active', true);
      
      if (error) throw error;
      return (count || 0) > 0;
    },
  });

  // Fetch event capacity information (for free events)
  const { data: capacityInfo, isLoading: capacityLoading } = useQuery<EventCapacityInfo>({
    queryKey: ['event-capacity', event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select('status')
        .eq('event_id', event.id);
      
      if (error) throw error;
      
      const registrations = data || [];
      const confirmed = registrations.filter((r: { status: string }) => r.status === 'CONFIRMED').length;
      const waitlisted = registrations.filter((r: { status: string }) => r.status === 'WAITLISTED').length;
      
      return {
        totalRegistrations: registrations.length,
        confirmedRegistrations: confirmed,
        waitlistCount: waitlisted,
        spotsRemaining: event.capacity ? event.capacity - confirmed : null,
      };
    },
    enabled: !hasTiers,
  });

  // Check if user is already registered
  const { data: existingRegistration } = useQuery<Registration | null>({
    queryKey: ['user-registration', event.id, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Registration | null;
    },
    enabled: !!user?.id,
  });

  // Handle ticket selection change
  const handleSelectionChange = useCallback((
    selection: TicketSelection | null, 
    promoId: string | null, 
    discount: number
  ) => {
    setTicketSelection(selection);
    setPromoCodeId(promoId);
    setDiscountAmount(discount);
    
    // Update attendees array to match quantity
    if (selection) {
      setAttendees(prev => {
        const newAttendees = [...prev];
        while (newAttendees.length < selection.quantity) {
          newAttendees.push({ name: '', email: '', phone: '' });
        }
        while (newAttendees.length > selection.quantity) {
          newAttendees.pop();
        }
        return newAttendees;
      });
    }
  }, []);

  // Handle attendee update
  const handleAttendeeChange = useCallback((index: number, details: AttendeeDetails) => {
    setAttendees(prev => {
      const updated = [...prev];
      updated[index] = details;
      return updated;
    });
  }, []);

  // Step validation
  const canProceedFromTickets = useMemo(() => {
    if (!hasTiers) return true; // Free event, no tier selection needed
    return ticketSelection !== null;
  }, [hasTiers, ticketSelection]);

  const canProceedFromDetails = useMemo(() => {
    return attendees.every(a => a.name.trim() && a.email.trim());
  }, [attendees]);

  const canSubmit = useMemo(() => {
    return termsAccepted && canProceedFromDetails;
  }, [termsAccepted, canProceedFromDetails]);

  // Navigation
  const goToStep = (step: RegistrationStep) => setCurrentStep(step);
  
  const goNext = () => {
    if (currentStep === 'tickets') {
      if (!hasTiers) {
        // Skip tickets for free events
        setCurrentStep('details');
      } else if (canProceedFromTickets) {
        setCurrentStep('details');
      }
    } else if (currentStep === 'details' && canProceedFromDetails) {
      setCurrentStep('review');
    }
  };

  const goBack = () => {
    if (currentStep === 'review') {
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      if (hasTiers) {
        setCurrentStep('tickets');
      }
    }
  };

  // Registration mutation
  const registrationMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('You must be logged in to register');

      // Prepare registration data
      const registrationData: Record<string, unknown> = {
        event_id: event.id,
        user_id: user.id,
        status: 'PENDING',
        form_responses: { attendees },
      };

      // Add ticket tier data if applicable
      if (ticketSelection) {
        registrationData.ticket_tier_id = ticketSelection.tierId;
        registrationData.quantity = ticketSelection.quantity;
        registrationData.subtotal = ticketSelection.unitPrice * ticketSelection.quantity;
        registrationData.discount_amount = discountAmount;
        registrationData.total_amount = (ticketSelection.unitPrice * ticketSelection.quantity) - discountAmount;
        
        if (promoCodeId) {
          registrationData.promo_code_id = promoCodeId;
        }

        // Call atomic increment function to reserve tickets
        const { data: incrementResult, error: incrementError } = await supabase
          .rpc('increment_sold_count', {
            p_tier_id: ticketSelection.tierId,
            p_quantity: ticketSelection.quantity,
          });

        if (incrementError) throw incrementError;
        if (!incrementResult) {
          throw new Error('Sorry, these tickets just sold out. Please select a different tier.');
        }
      }

      // Insert registration
      const { error } = await supabase
        .from('registrations')
        .insert(registrationData);

      if (error) {
        // If registration fails and we incremented, we should decrement
        if (ticketSelection) {
          await supabase.rpc('decrement_sold_count', {
            p_tier_id: ticketSelection.tierId,
            p_quantity: ticketSelection.quantity,
          });
        }
        throw error;
      }

      return true;
    },
    onSuccess: () => {
      toast({
        title: 'Registration successful!',
        description: 'Check your email for confirmation details.',
      });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(primaryOrg?.slug ? `/${primaryOrg.slug}/dashboard` : '/dashboard');
      }
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error.message || 'Something went wrong. Please try again.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (canSubmit) {
      registrationMutation.mutate();
    }
  };

  // Show existing registration status
  if (existingRegistration) {
    return (
      <div className="max-w-md mx-auto rounded-2xl border border-border bg-card/90 shadow-md p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {existingRegistration.status === RegistrationStatus.CONFIRMED && 'Registration Confirmed'}
            {existingRegistration.status === RegistrationStatus.WAITLISTED && "You're on the Waitlist"}
            {existingRegistration.status === RegistrationStatus.PENDING && 'Registration Pending'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {existingRegistration.status === RegistrationStatus.CONFIRMED &&
              "You're all set! Check your email for event details and your QR code."}
            {existingRegistration.status === RegistrationStatus.WAITLISTED &&
              "We'll notify you if a spot becomes available."}
            {existingRegistration.status === RegistrationStatus.PENDING &&
              'Your registration is being processed.'}
          </p>
          <Button
            onClick={() => navigate(primaryOrg?.slug ? `/${primaryOrg.slug}/dashboard` : '/dashboard')}
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Get current step index
  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);
  const effectiveSteps = hasTiers ? STEPS : STEPS.filter(s => s.key !== 'tickets');

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2">
          {effectiveSteps.map((step, index) => {
            const stepIndex = STEPS.findIndex(s => s.key === step.key);
            const isActive = step.key === currentStep;
            const isCompleted = currentStepIndex > stepIndex;
            
            return (
              <React.Fragment key={step.key}>
                {index > 0 && (
                  <div className={cn(
                    "h-0.5 w-8 sm:w-12",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )} />
                )}
                <button
                  type="button"
                  onClick={() => isCompleted && goToStep(step.key)}
                  disabled={!isCompleted}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    isActive && "bg-primary text-primary-foreground",
                    isCompleted && !isActive && "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground"
                  )}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{index + 1}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Ticket Selection */}
        {currentStep === 'tickets' && hasTiers && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold">Select Your Tickets</h2>
              <p className="text-muted-foreground">Choose the ticket type and quantity</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <TicketTierSelector
                eventId={event.id}
                onSelectionChange={handleSelectionChange}
              />
              <OrderSummary
                selection={ticketSelection}
                discountAmount={discountAmount}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={goNext}
                disabled={!canProceedFromTickets}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Attendee Details */}
        {currentStep === 'details' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold">Attendee Details</h2>
              <p className="text-muted-foreground">
                {attendees.length === 1 
                  ? 'Enter your details'
                  : `Enter details for all ${attendees.length} attendees`}
              </p>
            </div>

            {/* Capacity info for free events */}
            {!hasTiers && !capacityLoading && capacityInfo && (
              <Card className="bg-accent/10 border-accent/30">
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 text-sm">
                    {event.capacity ? (
                      capacityInfo.spotsRemaining !== null && capacityInfo.spotsRemaining > 0 ? (
                        <span>
                          <strong>{capacityInfo.spotsRemaining}</strong> spots remaining out of {event.capacity}
                        </span>
                      ) : (
                        <span>
                          Event is full. You'll be added to the waitlist.
                          <br />
                          <strong>{capacityInfo.waitlistCount}</strong> people currently on waitlist.
                        </span>
                      )
                    ) : (
                      <span>Unlimited capacity</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {attendees.map((attendee, index) => (
                <AttendeeDetailsForm
                  key={index}
                  index={index}
                  values={attendee}
                  onChange={(details) => handleAttendeeChange(index, details)}
                  isPrimary={index === 0}
                />
              ))}
            </div>

            <div className="flex justify-between">
              {hasTiers && (
                <Button type="button" variant="outline" onClick={goBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              {onCancel && !hasTiers && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                type="button"
                onClick={goNext}
                disabled={!canProceedFromDetails}
                className={!hasTiers && !onCancel ? 'ml-auto' : ''}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {currentStep === 'review' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold">Review Your Registration</h2>
              <p className="text-muted-foreground">Confirm your details before submitting</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Attendee summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Attendee Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {attendees.map((attendee, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium">{attendee.name}</p>
                      <p className="text-sm text-muted-foreground">{attendee.email}</p>
                      {attendee.phone && (
                        <p className="text-sm text-muted-foreground">{attendee.phone}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Order summary */}
              {ticketSelection ? (
                <OrderSummary
                  selection={ticketSelection}
                  discountAmount={discountAmount}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Event</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-sm text-muted-foreground">Free Registration</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="bg-muted/40 p-4 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  className="mt-0.5"
                />
                <span className="text-sm text-muted-foreground">
                  I agree to the event terms and conditions, and I understand that my information will be used
                  for event management purposes. I consent to receive event-related communications.
                </span>
              </label>
            </div>

            {/* Error Display */}
            {registrationMutation.isError && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-md p-4">
                <p className="text-sm text-destructive">
                  {registrationMutation.error?.message || 'Registration failed. Please try again.'}
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={goBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit || registrationMutation.isPending}
                className="min-w-[160px]"
              >
                {registrationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
