import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Event, Registration, RegistrationFormData, RegistrationStatus } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  event,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, any>>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    organization: '',
    dietaryRestrictions: '',
    emergencyContact: '',
    tshirtSize: 'M',
    experience: 'beginner',
    expectations: '',
  });

  // Fetch event capacity information
  const { data: capacityInfo, isLoading: capacityLoading } = useQuery<EventCapacityInfo>({
    queryKey: ['event-capacity', event.id],
    queryFn: async () => {
      const response = await api.get(`/events/${event.id}/capacity`);
      return response.data.data;
    },
  });

  // Check if user is already registered
  const { data: existingRegistration } = useQuery<Registration | null>({
    queryKey: ['user-registration', event.id],
    queryFn: async () => {
      try {
        const response = await api.get(`/registrations/user/me`);
        const registrations = response.data.data;
        return registrations.find((reg: Registration) => reg.eventId === event.id) || null;
      } catch (error) {
        return null;
      }
    },
  });

  // Registration mutation
  const registrationMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      const response = await api.post('/registrations', data);
      return response.data.data;
    },
    onSuccess: () => {
      toast({
        title: 'Registration submitted',
        description: 'We\'ve saved your spot. Check your email for details shortly.',
      });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard');
      }
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error?.message || 'Something went wrong. Please try again.',
      });
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    registrationMutation.mutate({
      eventId: event.id,
      formResponses: formData,
    });
  };

  // Show existing registration status
  if (existingRegistration) {
    return (
      <div className="max-w-md mx-auto rounded-2xl border border-border bg-card/90 shadow-md p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
            <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
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
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full rounded-full bg-primary text-primary-foreground px-4 py-2 font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto rounded-2xl border border-border bg-card/95 shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Register for {event.name}</h2>

        {/* Capacity Information */}
        {!capacityLoading && capacityInfo && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                {event.capacity ? (
                  <>
                    {capacityInfo.spotsRemaining !== null && capacityInfo.spotsRemaining > 0 ? (
                      <span className="text-foreground">
                        <strong>{capacityInfo.spotsRemaining}</strong> spots remaining out of {event.capacity}
                      </span>
                    ) : (
                      <span className="text-foreground">
                        Event is full. You'll be added to the waitlist.
                        <br />
                        <strong>{capacityInfo.waitlistCount}</strong> people currently on waitlist.
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-foreground">Unlimited capacity</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Registration Deadline */}
        {event.registrationDeadline && (
          <p className="text-sm text-muted-foreground">
            Registration closes: {new Date(event.registrationDeadline).toLocaleDateString()}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background/80"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background/80"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background/80"
            />
          </div>

          <div>
            <label htmlFor="organization" className="block text-sm font-medium text-foreground mb-1">
              Organization/Company
            </label>
            <input
              type="text"
              id="organization"
              name="organization"
              value={formData.organization}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background/80"
            />
          </div>
        </div>

        {/* Event-specific fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tshirtSize" className="block text-sm font-medium text-foreground mb-1">
              T-Shirt Size
            </label>
            <select
              id="tshirtSize"
              name="tshirtSize"
              value={formData.tshirtSize}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background/80"
            >
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
            </select>
          </div>

          <div>
            <label htmlFor="experience" className="block text-sm font-medium text-foreground mb-1">
              Experience Level
            </label>
            <select
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background/80"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="dietaryRestrictions" className="block text-sm font-medium text-foreground mb-1">
            Dietary Restrictions/Allergies
          </label>
          <textarea
            id="dietaryRestrictions"
            name="dietaryRestrictions"
            rows={2}
            value={formData.dietaryRestrictions}
            onChange={handleInputChange}
            placeholder="Please list any dietary restrictions or allergies..."
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background/80"
          />
        </div>

        <div>
          <label htmlFor="emergencyContact" className="block text-sm font-medium text-foreground mb-1">
            Emergency Contact
          </label>
          <input
            type="text"
            id="emergencyContact"
            name="emergencyContact"
            value={formData.emergencyContact}
            onChange={handleInputChange}
            placeholder="Name and phone number"
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background/80"
          />
        </div>

        <div>
          <label htmlFor="expectations" className="block text-sm font-medium text-foreground mb-1">
            What do you hope to learn or achieve at this event?
          </label>
          <textarea
            id="expectations"
            name="expectations"
            rows={3}
            value={formData.expectations}
            onChange={handleInputChange}
            placeholder="Tell us about your goals and expectations..."
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background/80"
          />
        </div>

        {/* Terms and Conditions */}
        <div className="bg-muted/40 p-4 rounded-md">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="terms"
              required
              className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border rounded"
            />
            <label htmlFor="terms" className="ml-2 text-sm text-muted-foreground">
              I agree to the event terms and conditions, and I understand that my information will be used
              for event management purposes. I consent to receive event-related communications.
            </label>
          </div>
        </div>

        {/* Error Display */}
        {registrationMutation.isError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-destructive mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-1">
                <p className="text-sm text-destructive">
                  {(registrationMutation.error as any)?.response?.data?.error?.message ||
                    'Registration failed. Please try again.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={registrationMutation.isPending}
            className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground px-6 py-3 rounded-full font-medium hover:from-primary hover:to-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {registrationMutation.isPending ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Registering...
              </div>
            ) : (
              'Register Now'
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-none rounded-full border border-border text-foreground px-6 py-3 font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-border focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};