import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { XMarkIcon, CheckIcon, ChevronDownIcon, SparklesIcon, CalendarDaysIcon, PaintBrushIcon, CursorArrowRaysIcon, MapPinIcon, VideoCameraIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/looseClient';
import { useToast } from '@/hooks/use-toast';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEventManagementPaths } from '@/hooks/useEventManagementPaths';
import { useMyMemberOrganizations } from '@/hooks/useOrganization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Common timezones list
const commonTimezones = [
  { value: 'Asia/Kolkata', label: '(UTC+05:30) India Standard Time' },
  { value: 'Asia/Dubai', label: '(UTC+04:00) Gulf Standard Time' },
  { value: 'Asia/Singapore', label: '(UTC+08:00) Singapore Time' },
  { value: 'Asia/Tokyo', label: '(UTC+09:00) Japan Standard Time' },
  { value: 'Asia/Shanghai', label: '(UTC+08:00) China Standard Time' },
  { value: 'Europe/London', label: '(UTC+00:00) Greenwich Mean Time' },
  { value: 'Europe/Paris', label: '(UTC+01:00) Central European Time' },
  { value: 'Europe/Berlin', label: '(UTC+01:00) Central European Time' },
  { value: 'America/New_York', label: '(UTC-05:00) Eastern Time' },
  { value: 'America/Chicago', label: '(UTC-06:00) Central Time' },
  { value: 'America/Denver', label: '(UTC-07:00) Mountain Time' },
  { value: 'America/Los_Angeles', label: '(UTC-08:00) Pacific Time' },
  { value: 'Australia/Sydney', label: '(UTC+11:00) Australian Eastern Time' },
  { value: 'Pacific/Auckland', label: '(UTC+13:00) New Zealand Time' },
];

// Registration types
const registrationTypes = [
  { value: 'OPEN', label: '🌐 Open Registration', description: 'Anyone can register' },
  { value: 'INVITE_ONLY', label: '🔒 Invite Only', description: 'Only invited users can register' },
  { value: 'APPROVAL_REQUIRED', label: '✋ Approval Required', description: 'Registrations require manual approval' },
];

// Accessibility features
const accessibilityOptions = [
  { id: 'wheelchair', label: '♿ Wheelchair Accessible' },
  { id: 'sign_language', label: '🤟 Sign Language Interpretation' },
  { id: 'closed_captions', label: '📝 Closed Captioning' },
  { id: 'parking', label: '🅿️ Parking Available' },
  { id: 'public_transport', label: '🚇 Public Transport Access' },
  { id: 'hearing_loop', label: '🔊 Hearing Loop' },
  { id: 'braille', label: '⠿ Braille Materials' },
];

// Category display config
const categoryLabels: Record<string, string> = {
  HACKATHON: '💻 Hackathon',
  BOOTCAMP: '🎓 Bootcamp',
  WORKSHOP: '🔧 Workshop',
  CONFERENCE: '🎤 Conference',
  MEETUP: '👥 Meetup',
  STARTUP_PITCH: '🚀 Startup Pitch',
  HIRING_CHALLENGE: '💼 Hiring Challenge',
  WEBINAR: '🖥️ Webinar',
  COMPETITION: '🏆 Competition',
  SEMINAR: '📚 Seminar',
  SYMPOSIUM: '🎓 Symposium',
  CULTURAL_FEST: '🎭 Cultural Fest',
  SPORTS_EVENT: '⚽ Sports Event',
  ORIENTATION: '🎯 Orientation',
  ALUMNI_MEET: '🤝 Alumni Meet',
  CAREER_FAIR: '💼 Career Fair',
  LECTURE: '📖 Lecture',
  QUIZ: '❓ Quiz',
  DEBATE: '🗣️ Debate',
  PRODUCT_LAUNCH: '🎉 Product Launch',
  TOWN_HALL: '🏛️ Town Hall',
  TEAM_BUILDING: '🏗️ Team Building',
  TRAINING: '📋 Training',
  AWARDS_CEREMONY: '🏅 Awards Ceremony',
  OFFSITE: '✈️ Offsite',
  NETWORKING: '🔗 Networking',
  TRADE_SHOW: '🏪 Trade Show',
  EXPO: '🎪 Expo',
  SUMMIT: '⛰️ Summit',
  PANEL_DISCUSSION: '💬 Panel Discussion',
  DEMO_DAY: '🎬 Demo Day',
  FUNDRAISER: '💰 Fundraiser',
  GALA: '🌟 Gala',
  CHARITY_EVENT: '❤️ Charity Event',
  VOLUNTEER_DRIVE: '🙋 Volunteer Drive',
  AWARENESS_CAMPAIGN: '📢 Awareness Campaign',
  CONCERT: '🎵 Concert',
  EXHIBITION: '🖼️ Exhibition',
  FESTIVAL: '🎊 Festival',
  SOCIAL_GATHERING: '🎈 Social Gathering',
  OTHER: '📌 Other',
};

const virtualPlatforms = [
  { value: 'zoom', label: '📹 Zoom' },
  { value: 'teams', label: '💼 Microsoft Teams' },
  { value: 'meet', label: '📞 Google Meet' },
  { value: 'webex', label: '🎥 Webex' },
  { value: 'other', label: '🔗 Other' },
];

// Modern section header with icon
const SectionHeader: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  isOpen: boolean;
  stepNumber: number;
  isConditional?: boolean;
}> = ({ title, description, icon: Icon, isOpen, stepNumber, isConditional }) => (
  <div className="flex items-center gap-4 w-full py-4 px-2">
    <div className={cn(
      "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
      isOpen 
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
        : "bg-muted text-muted-foreground"
    )}>
      <Icon className="h-5 w-5" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-xs font-medium px-2 py-0.5 rounded-full transition-colors",
          isOpen ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          Step {stepNumber}
        </span>
        {isConditional && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/50 text-accent-foreground">
            Conditional
          </span>
        )}
      </div>
      <h3 className="text-base font-semibold text-foreground mt-0.5">{title}</h3>
      <p className="text-sm text-muted-foreground truncate">{description}</p>
    </div>
    <div className={cn(
      "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
      isOpen ? "bg-primary/10 rotate-0" : "bg-transparent -rotate-90"
    )}>
      <ChevronDownIcon className={cn(
        "h-5 w-5 transition-transform duration-300",
        isOpen ? "text-primary" : "text-muted-foreground"
      )} />
    </div>
  </div>
);

interface EventFormPageProps {
  mode: 'create' | 'edit';
}

const eventSchema = z
  .object({
    name: z.string().trim().min(1, 'Event name is required'),
    description: z.string().trim().min(1, 'Description is required'),
    mode: z.enum(['ONLINE', 'OFFLINE', 'HYBRID'], { required_error: 'Mode is required' }),
    category: z.string().optional(),
    organizationId: z.string().min(1, 'Organization is required'),
    capacity: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true;
          const num = Number(val);
          return !Number.isNaN(num) && num > 0;
        },
        { message: 'Capacity must be a positive number' },
      ),
    // Registration settings
    registrationType: z.enum(['OPEN', 'INVITE_ONLY', 'APPROVAL_REQUIRED']).optional(),
    isFreeEvent: z.boolean().optional(),
    allowWaitlist: z.boolean().optional(),
    tags: z.string().optional(),
    // SEO fields (new)
    metaDescription: z.string().max(160, 'Meta description must be 160 characters or less').optional(),
    customSlug: z.string().optional(),
    // Accessibility fields (new)
    accessibilityLanguage: z.string().optional(),
    ageRestrictionEnabled: z.boolean().optional(),
    minAge: z.number().min(0).max(120).optional().nullable(),
    maxAge: z.number().min(0).max(120).optional().nullable(),
    // Schedule
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    registrationDeadline: z.string().optional(),
    timezone: z.string().min(1, 'Timezone is required'),
    // Organizer contact
    contactEmail: z.string().email('Valid email required').optional().or(z.literal('')),
    contactPhone: z.string().optional(),
    supportUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    eventWebsite: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    // Venue fields (for OFFLINE/HYBRID)
    venueName: z.string().optional(),
    venueAddress: z.string().optional(),
    venueCity: z.string().optional(),
    venueState: z.string().optional(),
    venueCountry: z.string().optional(),
    venuePostalCode: z.string().optional(),
    venueCapacity: z.string().optional(),
    accessibilityFeatures: z.array(z.string()).optional(),
    accessibilityNotes: z.string().optional(),
    // Virtual fields (for ONLINE/HYBRID)
    virtualPlatform: z.string().optional(),
    virtualMeetingUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    virtualMeetingId: z.string().optional(),
    virtualPassword: z.string().optional(),
    virtualInstructions: z.string().optional(),
    // Branding
    primaryColor: z.string().optional(),
    logoUrl: z.string().url('Logo URL must be a valid URL').optional().or(z.literal('')),
    heroSubtitle: z.string().trim().optional(),
    bannerUrl: z.string().url('Banner URL must be a valid URL').optional().or(z.literal('')),
    primaryCtaLabel: z.string().trim().optional(),
    secondaryCtaLabel: z.string().trim().optional(),
    canvasState: z.any().optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    },
  );

export type EventFormValues = z.infer<typeof eventSchema>;

/**
 * EventFormPage provides a single-page form with collapsible sections for creating and editing events.
 */
export const EventFormPage: React.FC<EventFormPageProps> = ({ mode }) => {
  const { eventId, orgSlug } = useParams<{ eventId?: string; orgSlug?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { listPath } = useEventManagementPaths();
  const { data: myOrganizations = [], isLoading: isLoadingOrganizations } =
    useMyMemberOrganizations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(mode === 'edit');
  const [serverError, setServerError] = useState<string | null>(null);
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    schedule: false,
    organizer: false,
    venue: false,
    virtual: false,
    branding: false,
    cta: false,
  });

  // Detect browser timezone
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      description: '',
      mode: 'ONLINE',
      category: '',
      organizationId: '',
      capacity: '',
      // Registration settings
      registrationType: 'OPEN',
      isFreeEvent: true,
      allowWaitlist: false,
      tags: '',
      // SEO defaults
      metaDescription: '',
      customSlug: '',
      // Accessibility defaults
      accessibilityLanguage: 'en',
      ageRestrictionEnabled: false,
      minAge: null,
      maxAge: null,
      // Schedule
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      timezone: browserTimezone || 'Asia/Kolkata',
      // Organizer contact
      contactEmail: '',
      contactPhone: '',
      supportUrl: '',
      eventWebsite: '',
      // Venue defaults
      venueName: '',
      venueAddress: '',
      venueCity: '',
      venueState: '',
      venueCountry: '',
      venuePostalCode: '',
      venueCapacity: '',
      accessibilityFeatures: [],
      accessibilityNotes: '',
      // Virtual defaults
      virtualPlatform: '',
      virtualMeetingUrl: '',
      virtualMeetingId: '',
      virtualPassword: '',
      virtualInstructions: '',
      // Branding defaults
      primaryColor: '#2563eb',
      logoUrl: '',
      heroSubtitle: '',
      bannerUrl: '',
      primaryCtaLabel: '',
      secondaryCtaLabel: '',
      canvasState: undefined,
    },
  });

  const { handleSubmit, reset, control } = form;
  
  // Watch mode to conditionally show venue/virtual sections
  const selectedMode = useWatch({ control, name: 'mode' });
  const showVenueSection = selectedMode === 'OFFLINE' || selectedMode === 'HYBRID';
  const showVirtualSection = selectedMode === 'ONLINE' || selectedMode === 'HYBRID';

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Find current organization from URL slug
  const currentOrganization = myOrganizations.find((org: any) => org.slug === orgSlug);

  // Auto-set organization when available
  useEffect(() => {
    if (mode === 'create' && currentOrganization && !form.getValues('organizationId')) {
      form.setValue('organizationId', currentOrganization.id);
    }
  }, [currentOrganization, mode, form]);

  useEffect(() => {
    const loadEvent = async () => {
      if (mode !== 'edit' || !eventId) return;
      try {
        setIsLoadingEvent(true);
        const { data, error } = await supabase
          .from('events')
          .select(
            'id, name, description, mode, start_date, end_date, capacity, visibility, status, created_at, updated_at, organization_id, branding, canvas_state',
          )
          .eq('id', eventId)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          toast({
            title: 'Event not found',
            description: 'The requested event could not be found.',
            variant: 'destructive',
          });
          navigate('../list');
          return;
        }

        const branding = data.branding as any;
        reset({
          name: data.name ?? '',
          description: data.description ?? '',
          mode: data.mode ?? 'ONLINE',
          category: (data as any).category ?? '',
          organizationId: data.organization_id ?? '',
          capacity: data.capacity != null ? String(data.capacity) : '',
          // Registration settings - try new location first, fall back to legacy
          registrationType: branding?.ticketing?.registrationType ?? branding?.registration?.type ?? 'OPEN',
          isFreeEvent: branding?.ticketing?.isFree ?? branding?.registration?.isFree ?? true,
          allowWaitlist: branding?.ticketing?.allowWaitlist ?? branding?.registration?.allowWaitlist ?? false,
          // Tags & SEO - try new location first
          tags: (branding?.seo?.tags ?? branding?.tags ?? []).join(', '),
          metaDescription: branding?.seo?.metaDescription ?? '',
          customSlug: branding?.seo?.customSlug ?? '',
          // Accessibility - try new location first, fall back to venue
          accessibilityLanguage: branding?.accessibility?.language ?? 'en',
          ageRestrictionEnabled: branding?.accessibility?.ageRestriction?.enabled ?? false,
          minAge: branding?.accessibility?.ageRestriction?.minAge ?? null,
          maxAge: branding?.accessibility?.ageRestriction?.maxAge ?? null,
          // Schedule
          startDate: data.start_date ? new Date(data.start_date).toISOString().slice(0, 16) : '',
          endDate: data.end_date ? new Date(data.end_date).toISOString().slice(0, 16) : '',
          registrationDeadline: branding?.registrationDeadline ?? '',
          timezone: branding?.timezone ?? browserTimezone ?? 'Asia/Kolkata',
          // Organizer contact
          contactEmail: branding?.contact?.email ?? '',
          contactPhone: branding?.contact?.phone ?? '',
          supportUrl: branding?.contact?.supportUrl ?? '',
          eventWebsite: branding?.contact?.eventWebsite ?? '',
          // Venue fields
          venueName: branding?.venue?.name ?? '',
          venueAddress: branding?.venue?.address ?? '',
          venueCity: branding?.venue?.city ?? '',
          venueState: branding?.venue?.state ?? '',
          venueCountry: branding?.venue?.country ?? '',
          venuePostalCode: branding?.venue?.postalCode ?? '',
          venueCapacity: branding?.venue?.capacity != null ? String(branding.venue.capacity) : '',
          accessibilityFeatures: branding?.accessibility?.features ?? branding?.venue?.accessibilityFeatures ?? [],
          accessibilityNotes: branding?.accessibility?.notes ?? branding?.venue?.accessibilityNotes ?? '',
          // Virtual fields
          virtualPlatform: branding?.virtualLinks?.platform ?? '',
          virtualMeetingUrl: branding?.virtualLinks?.meetingUrl ?? '',
          virtualMeetingId: branding?.virtualLinks?.meetingId ?? '',
          virtualPassword: branding?.virtualLinks?.password ?? '',
          virtualInstructions: branding?.virtualLinks?.instructions ?? '',
          // Branding
          primaryColor: branding?.primaryColor ?? '#2563eb',
          logoUrl: branding?.logoUrl ?? '',
          heroSubtitle: branding?.heroSubtitle ?? '',
          bannerUrl: branding?.bannerUrl ?? '',
          primaryCtaLabel: branding?.primaryCtaLabel ?? '',
          secondaryCtaLabel: branding?.secondaryCtaLabel ?? '',
          canvasState: (data as any).canvas_state ?? undefined,
        });
      } catch (err: any) {
        console.error('Failed to load event', err);
        toast({
          title: 'Failed to load event',
          description: err?.message || 'Please try again.',
          variant: 'destructive',
        });
        navigate('../list');
      } finally {
        setIsLoadingEvent(false);
      }
    };

    loadEvent();
  }, [mode, eventId, navigate, reset, toast]);

  const pageTitle = mode === 'create' ? 'Create Event' : 'Edit Event';

  const onSubmit = async (values: EventFormValues) => {
    if (isSubmitting) return;

    setServerError(null);

    try {
      setIsSubmitting(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        throw new Error('You must be logged in to create events.');
      }

      if (mode === 'create' && values.organizationId) {
        const { data: membership, error: membershipError } = await supabase
          .from('organization_memberships')
          .select('status, role')
          .eq('user_id', user.id)
          .eq('organization_id', values.organizationId)
          .maybeSingle();

        if (membershipError) throw membershipError;

        if (
          !membership ||
          membership.status !== 'ACTIVE' ||
          !['OWNER', 'ADMIN', 'ORGANIZER'].includes(membership.role)
        ) {
          throw new Error('You must be an active organizer for this organization to create events.');
        }
      }

      // Build venue object if applicable
      const venueData = (values.mode === 'OFFLINE' || values.mode === 'HYBRID') && values.venueName
        ? {
            name: values.venueName.trim(),
            address: values.venueAddress?.trim() || '',
            city: values.venueCity?.trim() || '',
            state: values.venueState?.trim() || '',
            country: values.venueCountry?.trim() || '',
            postalCode: values.venuePostalCode?.trim() || '',
            capacity: values.venueCapacity ? Number(values.venueCapacity) : undefined,
            accessibilityFeatures: values.accessibilityFeatures || [],
            accessibilityNotes: values.accessibilityNotes?.trim() || undefined,
          }
        : undefined;

      // Build virtual links object if applicable
      const virtualLinksData = (values.mode === 'ONLINE' || values.mode === 'HYBRID') && values.virtualMeetingUrl
        ? {
            platform: values.virtualPlatform || 'other',
            meetingUrl: values.virtualMeetingUrl,
            meetingId: values.virtualMeetingId?.trim() || undefined,
            password: values.virtualPassword || undefined,
            instructions: values.virtualInstructions?.trim() || undefined,
          }
        : undefined;

      // Build contact object
      const contactData = values.contactEmail
        ? {
            email: values.contactEmail.trim(),
            phone: values.contactPhone?.trim() || undefined,
            supportUrl: values.supportUrl || undefined,
            eventWebsite: values.eventWebsite || undefined,
          }
        : undefined;

      // Build registration settings (save to both legacy and canonical locations)
      const registrationData = {
        type: values.registrationType || 'OPEN',
        isFree: values.isFreeEvent ?? true,
        allowWaitlist: values.allowWaitlist ?? false,
      };

      // Canonical ticketing data (for settings panels)
      const ticketingData = {
        registrationType: values.registrationType || 'OPEN',
        isFree: values.isFreeEvent ?? true,
        allowWaitlist: values.allowWaitlist ?? false,
      };

      // Parse tags
      const tagsArray = values.tags
        ? values.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
        : [];

      // SEO data (canonical location)
      const seoData = {
        tags: tagsArray,
        metaDescription: values.metaDescription?.trim() || '',
        customSlug: values.customSlug?.trim() || '',
      };

      // Accessibility data (canonical location)
      const accessibilityData = {
        features: values.accessibilityFeatures || [],
        notes: values.accessibilityNotes?.trim() || '',
        language: values.accessibilityLanguage || 'en',
        ageRestriction: {
          enabled: values.ageRestrictionEnabled ?? false,
          minAge: values.minAge ?? null,
          maxAge: values.maxAge ?? null,
        },
      };

      const payload: any = {
        name: values.name.trim(),
        description: values.description.trim(),
        mode: values.mode,
        category: values.category || null,
        start_date: values.startDate,
        end_date: values.endDate,
        capacity:
          values.capacity && values.capacity.trim() !== '' ? Number(values.capacity) : null,
        organization_id: values.organizationId,
        visibility: 'PUBLIC',
        branding: {
          primaryColor: values.primaryColor,
          logoUrl: values.logoUrl || undefined,
          heroSubtitle: values.heroSubtitle?.trim() || undefined,
          bannerUrl: values.bannerUrl || undefined,
          primaryCtaLabel: values.primaryCtaLabel?.trim() || undefined,
          secondaryCtaLabel: values.secondaryCtaLabel?.trim() || undefined,
          venue: venueData,
          virtualLinks: virtualLinksData,
          contact: contactData,
          // Legacy location (for backwards compatibility)
          registration: registrationData,
          tags: tagsArray.length > 0 ? tagsArray : undefined,
          // Canonical locations (for settings panels)
          ticketing: ticketingData,
          seo: seoData,
          accessibility: accessibilityData,
          timezone: values.timezone,
          registrationDeadline: values.registrationDeadline || undefined,
        },
        owner_id: user.id,
        canvas_state: values.canvasState ?? null,
      };

      let createdEventId: string | undefined;

      if (mode === 'create') {
        payload.status = 'DRAFT';

        const { data, error } = await supabase
          .from('events')
          .insert(payload)
          .select('id')
          .maybeSingle();

        if (error) throw error;
        createdEventId = data?.id as string | undefined;
      } else {
        const { error } = await supabase.from('events').update(payload).eq('id', eventId);
        if (error) throw error;
      }

      toast({
        title: mode === 'create' ? 'Event draft saved' : 'Event updated',
        description:
          mode === 'create'
            ? 'Your event has been saved as a draft. Next, create a workspace to manage and publish it.'
            : 'Your changes have been saved.',
      });

      if (mode === 'create') {
        const currentPath = location.pathname;
        const orgSlugCandidate = currentPath.split('/')[1];
        const isOrgContext = !!orgSlugCandidate && orgSlugCandidate !== 'dashboard';
        const baseWorkspacePath = isOrgContext
          ? `/${orgSlugCandidate}/workspaces`
          : '/dashboard/workspaces';

        if (createdEventId) {
          navigate(`${baseWorkspacePath}/create?eventId=${createdEventId}`);
        } else {
          navigate(listPath);
        }
      } else {
        navigate(listPath);
      }
    } catch (err: any) {
      console.error('Failed to save event', err);
      const rawMessage = err?.message || 'Please try again.';

      const message = rawMessage;

      setServerError(message);
      toast({
        title: 'Failed to save event',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <SparklesIcon className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {mode === 'create' 
                  ? 'Fill in the details to create your event' 
                  : 'Update your event information'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(listPath)}
              className="gap-2"
            >
              <XMarkIcon className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                const formEl = document.getElementById('event-form') as HTMLFormElement | null;
                if (formEl) {
                  if (typeof formEl.requestSubmit === 'function') {
                    formEl.requestSubmit();
                  } else {
                    formEl.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                  }
                }
              }}
              disabled={isSubmitting || myOrganizations.length === 0}
              className="gap-2 shadow-lg shadow-primary/25"
            >
              <CheckIcon className="h-4 w-4" />
              {isSubmitting
                ? 'Saving...'
                : mode === 'create'
                  ? 'Save & Continue'
                  : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        {isLoadingEvent ? (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            </div>
            <p className="text-sm text-muted-foreground">Loading event...</p>
          </div>
        ) : (
          <Form {...form}>
            <form
              id="event-form"
              onSubmit={handleSubmit(onSubmit)}
              className="divide-y divide-border/50"
              noValidate
            >
              {serverError && (
                <div className="p-4 sm:p-6">
                  <Alert variant="destructive">
                    <AlertTitle>Failed to save event</AlertTitle>
                    <AlertDescription>
                      <p>{serverError}</p>
                      {serverError.includes('organizer/admin permissions') && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-3 border-destructive text-destructive hover:bg-destructive/10"
                          disabled={isRequestingAccess}
                          onClick={async () => {
                            if (isRequestingAccess) return;
                            setIsRequestingAccess(true);
                            try {
                              const { error } = await supabase.functions.invoke(
                                'self-approve-organizer',
                              );
                              if (error) throw error;
                              toast({
                                title: 'Organizer access requested',
                                description:
                                  'We have recorded your request to become an organizer. Try again after your access updates.',
                              });
                            } catch (err: any) {
                              toast({
                                title: 'Failed to request organizer access',
                                description: err?.message || 'Please try again.',
                                variant: 'destructive',
                              });
                            } finally {
                              setIsRequestingAccess(false);
                            }
                          }}
                        >
                          {isRequestingAccess ? 'Requesting…' : 'Request organizer access'}
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Basic Information Section */}
              <Collapsible
                open={openSections.basic}
                onOpenChange={() => toggleSection('basic')}
              >
                <CollapsibleTrigger className="w-full hover:bg-muted/30 transition-colors">
                  <SectionHeader
                    title="Basic Information"
                    description="Name, organization, description, and format"
                    icon={SparklesIcon}
                    isOpen={openSections.basic}
                    stepNumber={1}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 sm:px-6 pb-6 space-y-6 border-l-2 border-primary/20 ml-7 mr-4">
                    {/* Organization Display */}
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Creating under</p>
                          {isLoadingOrganizations ? (
                            <p className="text-sm text-muted-foreground">Loading...</p>
                          ) : currentOrganization ? (
                            <p className="font-medium text-foreground">{currentOrganization.name}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">No organization found</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event name *</FormLabel>
                          <FormControl>
                            <Input 
                              type="text" 
                              placeholder="e.g. Campus DevFest 2025" 
                              className="h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            This appears on your landing page and emails — keep it short and clear.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={4}
                              placeholder="Share what makes this event special"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            A quick overview that helps attendees understand who this event is for.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={control}
                        name="mode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event mode *</FormLabel>
                            <FormControl>
                              <select
                                className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                {...field}
                              >
                                <option value="ONLINE">🌐 Online</option>
                                <option value="OFFLINE">📍 In-Person</option>
                                <option value="HYBRID">🔄 Hybrid</option>
                              </select>
                            </FormControl>
                            <FormDescription>
                              Choose how people will join.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event category</FormLabel>
                            <FormControl>
                              <select
                                className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                {...field}
                              >
                                <option value="">Select category...</option>
                                {Object.entries(categoryLabels).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </select>
                            </FormControl>
                            <FormDescription>
                              Helps attendees discover your event.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={control}
                        name="capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Capacity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="e.g. 150" 
                                className="h-11"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Optional: set a soft cap.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="registrationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registration type</FormLabel>
                            <FormControl>
                              <select
                                className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                {...field}
                              >
                                {registrationTypes.map((type) => (
                                  <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                              </select>
                            </FormControl>
                            <FormDescription>
                              How attendees can register.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={control}
                        name="isFreeEvent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Free event</FormLabel>
                              <FormDescription>
                                Toggle off if this is a paid event.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="allowWaitlist"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable waitlist</FormLabel>
                              <FormDescription>
                                Allow waitlist when capacity is reached.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags / Keywords</FormLabel>
                          <FormControl>
                            <Input 
                              type="text" 
                              placeholder="e.g. tech, hackathon, students, AI"
                              className="h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Comma-separated tags for SEO and event discovery.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* SEO Fields */}
                    <div className="pt-4 border-t border-border/50">
                      <p className="text-sm font-medium text-foreground mb-4">🔍 Search Engine Optimization</p>
                      
                      <div className="space-y-6">
                        <FormField
                          control={control}
                          name="metaDescription"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel>Meta Description</FormLabel>
                                <span className="text-xs text-muted-foreground">{field.value?.length || 0}/160</span>
                              </div>
                              <FormControl>
                                <Textarea
                                  rows={2}
                                  placeholder="A brief description for search engines..."
                                  maxLength={160}
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Appears in search results and social shares.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={control}
                          name="customSlug"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Custom URL Slug</FormLabel>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground whitespace-nowrap">/events/</span>
                                <FormControl>
                                  <Input
                                    type="text"
                                    placeholder="my-event-name"
                                    className="h-11"
                                    {...field}
                                    onChange={(e) => {
                                      // Auto-slugify the input
                                      const slugified = e.target.value
                                        .toLowerCase()
                                        .replace(/[^\w\s-]/g, '')
                                        .replace(/\s+/g, '-')
                                        .replace(/-+/g, '-');
                                      field.onChange(slugified);
                                    }}
                                  />
                                </FormControl>
                              </div>
                              <FormDescription>
                                Leave blank to auto-generate from event name.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Schedule Section */}
              <Collapsible
                open={openSections.schedule}
                onOpenChange={() => toggleSection('schedule')}
              >
                <CollapsibleTrigger className="w-full hover:bg-muted/30 transition-colors">
                  <SectionHeader
                    title="Date & Schedule"
                    description="When your event starts and ends"
                    icon={CalendarDaysIcon}
                    isOpen={openSections.schedule}
                    stepNumber={2}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 sm:px-6 pb-6 space-y-6 border-l-2 border-primary/20 ml-7 mr-4">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={control}
                        name="startDate"
                        render={({ field }) => {
                          const dateValue = field.value ? new Date(field.value) : undefined;
                          return (
                            <FormItem>
                              <FormLabel>Start date & time *</FormLabel>
                              <FormControl>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className={cn(
                                        'w-full h-11 justify-start text-left font-normal',
                                        !dateValue && 'text-muted-foreground',
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {dateValue ? (
                                        format(dateValue, 'PPP p')
                                      ) : (
                                        <span>Select start date</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={dateValue}
                                      onSelect={(date) => {
                                        if (!date) {
                                          field.onChange('');
                                          return;
                                        }
                                        const formatted = format(date, "yyyy-MM-dd'T'HH:mm");
                                        field.onChange(formatted);
                                      }}
                                      initialFocus
                                      className={cn('p-3 pointer-events-auto')}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        control={control}
                        name="endDate"
                        render={({ field }) => {
                          const dateValue = field.value ? new Date(field.value) : undefined;
                          return (
                            <FormItem>
                              <FormLabel>End date & time *</FormLabel>
                              <FormControl>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className={cn(
                                        'w-full h-11 justify-start text-left font-normal',
                                        !dateValue && 'text-muted-foreground',
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {dateValue ? (
                                        format(dateValue, 'PPP p')
                                      ) : (
                                        <span>Select end date</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={dateValue}
                                      onSelect={(date) => {
                                        if (!date) {
                                          field.onChange('');
                                          return;
                                        }
                                        const formatted = format(date, "yyyy-MM-dd'T'HH:mm");
                                        field.onChange(formatted);
                                      }}
                                      initialFocus
                                      className={cn('p-3 pointer-events-auto')}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>

                    <FormField
                      control={control}
                      name="registrationDeadline"
                      render={({ field }) => {
                        const dateValue = field.value ? new Date(field.value) : undefined;
                        return (
                          <FormItem>
                            <FormLabel>Registration deadline</FormLabel>
                            <FormControl>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                      'w-full h-11 justify-start text-left font-normal',
                                      !dateValue && 'text-muted-foreground',
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateValue ? (
                                      format(dateValue, 'PPP p')
                                    ) : (
                                      <span>Optional: set registration cutoff</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={dateValue}
                                    onSelect={(date) => {
                                      if (!date) {
                                        field.onChange('');
                                        return;
                                      }
                                      const formatted = format(date, "yyyy-MM-dd'T'HH:mm");
                                      field.onChange(formatted);
                                    }}
                                    initialFocus
                                    className={cn('p-3 pointer-events-auto')}
                                  />
                                </PopoverContent>
                              </Popover>
                            </FormControl>
                            <FormDescription>
                              If set, registrations will automatically close after this time.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                          );
                      }}
                    />

                    <FormField
                      control={control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timezone *</FormLabel>
                          <FormControl>
                            <select
                              className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              {...field}
                            >
                              {commonTimezones.map((tz) => (
                                <option key={tz.value} value={tz.value}>{tz.label}</option>
                              ))}
                            </select>
                          </FormControl>
                          <FormDescription>
                            All event times will be displayed in this timezone.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Organizer & Contact Section */}
              <Collapsible
                open={openSections.organizer}
                onOpenChange={() => toggleSection('organizer')}
              >
                <CollapsibleTrigger className="w-full hover:bg-muted/30 transition-colors">
                  <SectionHeader
                    title="Organizer & Contact"
                    description="Contact information for attendee inquiries"
                    icon={UserCircleIcon}
                    isOpen={openSections.organizer}
                    stepNumber={3}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 sm:px-6 pb-6 space-y-6 border-l-2 border-primary/20 ml-7 mr-4">
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
                      <p className="text-sm text-muted-foreground">
                        📧 Attendees will use this information to reach out with questions.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="organizer@example.com"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Primary contact for attendee inquiries.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact phone</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="+91 98765 43210"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Optional phone number for urgent queries.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={control}
                        name="supportUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Support / FAQ URL</FormLabel>
                            <FormControl>
                              <Input
                                type="url"
                                placeholder="https://yoursite.com/support"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Link to help center or FAQ page.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="eventWebsite"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event website</FormLabel>
                            <FormControl>
                              <Input
                                type="url"
                                placeholder="https://yourevent.com"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              External website for more information.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Location & Venue Section - Conditional */}
              {showVenueSection && (
                <Collapsible
                  open={openSections.venue}
                  onOpenChange={() => toggleSection('venue')}
                >
                  <CollapsibleTrigger className="w-full hover:bg-muted/30 transition-colors">
                    <SectionHeader
                      title="Location & Venue"
                      description="Physical venue details for in-person attendance"
                      icon={MapPinIcon}
                      isOpen={openSections.venue}
                      stepNumber={3}
                      isConditional
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 sm:px-6 pb-6 space-y-6 border-l-2 border-accent/30 ml-7 mr-4">
                      <div className="rounded-xl border border-border/50 bg-accent/5 p-4">
                        <p className="text-sm text-muted-foreground">
                          📍 These details will be shown to attendees for your <span className="font-medium text-foreground">{selectedMode === 'HYBRID' ? 'in-person' : 'offline'}</span> event.
                        </p>
                      </div>

                      <FormField
                        control={control}
                        name="venueName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Venue name</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="e.g. Tech Hub Convention Center"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Name of the venue or building.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="venueAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street address</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="123 Main Street, Suite 100"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={control}
                          name="venueCity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="e.g. Chennai"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={control}
                          name="venueState"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State / Province</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="e.g. Tamil Nadu"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={control}
                          name="venueCountry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="e.g. India"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={control}
                          name="venuePostalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal code</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="e.g. 600001"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={control}
                        name="venueCapacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Venue capacity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g. 500"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Maximum attendees the venue can accommodate.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Accessibility Features */}
                      <div className="space-y-4">
                        <FormLabel className="text-base font-medium">Accessibility features</FormLabel>
                        <FormDescription className="-mt-2">
                          Select all accessibility features available at the venue.
                        </FormDescription>
                        <FormField
                          control={control}
                          name="accessibilityFeatures"
                          render={({ field }) => (
                            <FormItem>
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {accessibilityOptions.map((option) => (
                                  <div
                                    key={option.id}
                                    className="flex items-center space-x-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30"
                                  >
                                    <Checkbox
                                      id={option.id}
                                      checked={field.value?.includes(option.id)}
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || [];
                                        if (checked) {
                                          field.onChange([...currentValue, option.id]);
                                        } else {
                                          field.onChange(currentValue.filter((v: string) => v !== option.id));
                                        }
                                      }}
                                    />
                                    <label
                                      htmlFor={option.id}
                                      className="text-sm font-medium leading-none cursor-pointer"
                                    >
                                      {option.label}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={control}
                        name="accessibilityNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accessibility notes</FormLabel>
                            <FormControl>
                              <Textarea
                                rows={3}
                                placeholder="Additional accessibility information, e.g., entrance location for wheelchair users..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Any additional details about venue accessibility.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Event Language */}
                      <FormField
                        control={control}
                        name="accessibilityLanguage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Language</FormLabel>
                            <FormControl>
                              <select
                                className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                {...field}
                              >
                                <option value="en">English</option>
                                <option value="hi">Hindi</option>
                                <option value="ta">Tamil</option>
                                <option value="te">Telugu</option>
                                <option value="kn">Kannada</option>
                                <option value="ml">Malayalam</option>
                                <option value="mr">Marathi</option>
                                <option value="bn">Bengali</option>
                                <option value="gu">Gujarati</option>
                                <option value="pa">Punjabi</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                                <option value="zh">Chinese</option>
                                <option value="ja">Japanese</option>
                                <option value="ar">Arabic</option>
                              </select>
                            </FormControl>
                            <FormDescription>
                              Primary language for the event.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Age Restriction */}
                      <div className="space-y-4 pt-4 border-t border-border/50">
                        <FormField
                          control={control}
                          name="ageRestrictionEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Age Restriction</FormLabel>
                                <FormDescription>
                                  Set minimum or maximum age requirements
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {form.watch('ageRestrictionEnabled') && (
                          <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
                            <FormField
                              control={control}
                              name="minAge"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Minimum Age</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="120"
                                      placeholder="No minimum"
                                      className="h-11"
                                      value={field.value ?? ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        field.onChange(val === '' ? null : parseInt(val));
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={control}
                              name="maxAge"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Maximum Age</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="120"
                                      placeholder="No maximum"
                                      className="h-11"
                                      value={field.value ?? ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        field.onChange(val === '' ? null : parseInt(val));
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Virtual Platform Section - Conditional */}
              {showVirtualSection && (
                <Collapsible
                  open={openSections.virtual}
                  onOpenChange={() => toggleSection('virtual')}
                >
                  <CollapsibleTrigger className="w-full hover:bg-muted/30 transition-colors">
                    <SectionHeader
                      title="Virtual Platform"
                      description="Online meeting details for virtual attendance"
                      icon={VideoCameraIcon}
                      isOpen={openSections.virtual}
                      stepNumber={showVenueSection ? 4 : 3}
                      isConditional
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 sm:px-6 pb-6 space-y-6 border-l-2 border-accent/30 ml-7 mr-4">
                      <div className="rounded-xl border border-border/50 bg-accent/5 p-4">
                        <p className="text-sm text-muted-foreground">
                          🎥 These details will be shared with attendees joining <span className="font-medium text-foreground">online</span>.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={control}
                          name="virtualPlatform"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Platform</FormLabel>
                              <FormControl>
                                <select
                                  className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  {...field}
                                >
                                  <option value="">Select platform...</option>
                                  {virtualPlatforms.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                  ))}
                                </select>
                              </FormControl>
                              <FormDescription>
                                Video conferencing platform you'll use.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={control}
                          name="virtualMeetingId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meeting ID</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="e.g. 123 456 7890"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Optional meeting ID or room code.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={control}
                        name="virtualMeetingUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meeting URL</FormLabel>
                            <FormControl>
                              <Input
                                type="url"
                                placeholder="https://zoom.us/j/123456789"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              The link attendees will use to join.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={control}
                          name="virtualPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meeting password</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="Optional password"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Password required to join (if any).
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={control}
                        name="virtualInstructions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Joining instructions</FormLabel>
                            <FormControl>
                              <Textarea
                                rows={3}
                                placeholder="Any additional instructions for joining the virtual session..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Tips or requirements for attendees (e.g., download app beforehand).
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Branding Section */}
              <Collapsible
                open={openSections.branding}
                onOpenChange={() => toggleSection('branding')}
              >
                <CollapsibleTrigger className="w-full hover:bg-muted/30 transition-colors">
                  <SectionHeader
                    title="Branding"
                    description="Visual identity for your event page"
                    icon={PaintBrushIcon}
                    isOpen={openSections.branding}
                    stepNumber={showVenueSection && showVirtualSection ? 5 : (showVenueSection || showVirtualSection ? 4 : 3)}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 sm:px-6 pb-6 space-y-6 border-l-2 border-primary/20 ml-7 mr-4">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={control}
                        name="primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary color</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="color"
                                  className="h-11 w-16 cursor-pointer p-1"
                                  {...field}
                                />
                                <Input
                                  type="text"
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="#2563eb"
                                  className="h-11 flex-1 font-mono text-sm"
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Accent color for buttons and highlights.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="heroSubtitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hero subtitle</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="A catchy tagline"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Short elevator pitch under your title.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://example.com/logo.png"
                              className="h-11"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional: paste a direct image URL for the header.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="bannerUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hero banner image URL</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://example.com/hero-banner.jpg"
                              className="h-11"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional: wide image for the top of your landing page.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* CTA Section */}
              <Collapsible
                open={openSections.cta}
                onOpenChange={() => toggleSection('cta')}
              >
                <CollapsibleTrigger className="w-full hover:bg-muted/30 transition-colors">
                  <SectionHeader
                    title="Call to Action"
                    description="Button labels for your event page"
                    icon={CursorArrowRaysIcon}
                    isOpen={openSections.cta}
                    stepNumber={4}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 sm:px-6 pb-6 space-y-6 border-l-2 border-primary/20 ml-7 mr-4">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={control}
                        name="primaryCtaLabel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary button label</FormLabel>
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder="Register now" 
                                className="h-11"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Main call-to-action on your event hero.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="secondaryCtaLabel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secondary button label</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="Learn more"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Optional: softer action for schedule, FAQ, etc.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Form Actions - Sticky Footer */}
              <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border/50 p-4 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground hidden sm:block">
                    {mode === 'create' 
                      ? 'Fill required fields to continue' 
                      : 'Changes save immediately'}
                  </p>
                  <div className="flex items-center gap-3 ml-auto">
                    <Button type="button" variant="ghost" onClick={() => navigate(listPath)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || myOrganizations.length === 0}
                      className="min-w-[140px] shadow-lg shadow-primary/25"
                    >
                      {isSubmitting
                        ? 'Saving...'
                        : mode === 'create'
                          ? 'Save & Continue'
                          : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default EventFormPage;
