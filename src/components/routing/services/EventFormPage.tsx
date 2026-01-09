import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { XMarkIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/looseClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
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
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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
import { AfCard } from '@/components/attendflow/AfCard';

// Section header component for collapsible sections
const SectionHeader: React.FC<{
  title: string;
  description: string;
  isOpen: boolean;
}> = ({ title, description, isOpen }) => (
  <div className="flex items-center justify-between w-full py-4">
    <div className="flex-1">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    {isOpen ? (
      <ChevronDownIcon className="h-5 w-5 text-muted-foreground transition-transform" />
    ) : (
      <ChevronRightIcon className="h-5 w-5 text-muted-foreground transition-transform" />
    )}
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
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    registrationDeadline: z.string().optional(),
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
    schedule: true,
    branding: false,
    cta: false,
  });

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      description: '',
      mode: 'ONLINE',
      organizationId: '',
      capacity: '',
      startDate: '',
      endDate: '',
      registrationDeadline: '',
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

        reset({
          name: data.name ?? '',
          description: data.description ?? '',
          mode: data.mode ?? 'ONLINE',
          organizationId: data.organization_id ?? '',
          capacity: data.capacity != null ? String(data.capacity) : '',
          startDate: data.start_date ? new Date(data.start_date).toISOString().slice(0, 16) : '',
          endDate: data.end_date ? new Date(data.end_date).toISOString().slice(0, 16) : '',
          registrationDeadline: '',
          primaryColor: (data.branding as any)?.primaryColor ?? '#2563eb',
          logoUrl: (data.branding as any)?.logoUrl ?? '',
          heroSubtitle: (data.branding as any)?.heroSubtitle ?? '',
          bannerUrl: (data.branding as any)?.bannerUrl ?? '',
          primaryCtaLabel: (data.branding as any)?.primaryCtaLabel ?? '',
          secondaryCtaLabel: (data.branding as any)?.secondaryCtaLabel ?? '',
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

  const pageTitle = mode === 'create' ? 'Create your event' : 'Edit event details';
  const pageSubtitle =
    mode === 'create'
      ? 'Fill in the details below to create your event.'
      : 'Update your event information.';

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

      const payload: any = {
        name: values.name.trim(),
        description: values.description.trim(),
        mode: values.mode,
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

  const pageActions = [
    {
      label: 'Cancel',
      action: () => navigate(listPath),
      icon: XMarkIcon,
      variant: 'secondary' as const,
    },
    {
      label: mode === 'create' ? 'Save & continue to workspace' : 'Save changes',
      action: () => {
        const formEl = document.getElementById('event-form') as HTMLFormElement | null;
        if (formEl) {
          if (typeof formEl.requestSubmit === 'function') {
            formEl.requestSubmit();
          } else {
            formEl.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          }
        }
      },
      icon: CheckIcon,
      variant: 'primary' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background af-grid-bg px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader title={pageTitle} subtitle={pageSubtitle} actions={pageActions} />

        <AfCard className="p-5 sm:p-6">
          {isLoadingEvent ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading event...</div>
          ) : (
            <Form {...form}>
              <form
                id="event-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
              >
                {serverError && (
                  <Alert variant="destructive" className="mb-4">
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
                )}

                {/* Basic Information Section */}
                <Collapsible
                  open={openSections.basic}
                  onOpenChange={() => toggleSection('basic')}
                  className="border border-border rounded-xl"
                >
                  <CollapsibleTrigger className="w-full px-4 hover:bg-muted/50 rounded-t-xl transition-colors">
                    <SectionHeader
                      title="Basic Information"
                      description="Name, organization, description, and format"
                      isOpen={openSections.basic}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-6 space-y-6">
                    <FormItem>
                      <FormLabel>Organization</FormLabel>
                      <FormDescription>
                        Creating this event under your current organization.
                      </FormDescription>
                      <div className="mt-1 flex h-12 w-full items-center rounded-xl border-2 border-border bg-muted/50 px-4 py-2 text-sm">
                        {isLoadingOrganizations ? (
                          <span className="text-muted-foreground">Loading...</span>
                        ) : currentOrganization ? (
                          <span className="font-medium">{currentOrganization.name}</span>
                        ) : (
                          <span className="text-muted-foreground">No organization found</span>
                        )}
                      </div>
                    </FormItem>

                    <FormField
                      control={control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event name *</FormLabel>
                          <FormDescription>
                            This appears on your landing page and emails — keep it short and clear.
                          </FormDescription>
                          <FormControl>
                            <Input type="text" placeholder="e.g. Campus DevFest 2025" {...field} />
                          </FormControl>
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
                          <FormDescription>
                            A quick overview that helps attendees understand who this event is for.
                          </FormDescription>
                          <FormControl>
                            <Textarea
                              rows={4}
                              placeholder="Share what makes this event special"
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
                        name="mode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event mode *</FormLabel>
                            <FormDescription>
                              Choose how people will join — online, in-person, or a mix of both.
                            </FormDescription>
                            <FormControl>
                              <select
                                className="mt-1 w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm shadow-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                {...field}
                              >
                                <option value="ONLINE">Online</option>
                                <option value="OFFLINE">Offline</option>
                                <option value="HYBRID">Hybrid</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Capacity</FormLabel>
                            <FormDescription>
                              Optional: set a soft cap to help us track registrations.
                            </FormDescription>
                            <FormControl>
                              <Input type="number" placeholder="e.g. 150" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Schedule Section */}
                <Collapsible
                  open={openSections.schedule}
                  onOpenChange={() => toggleSection('schedule')}
                  className="border border-border rounded-xl"
                >
                  <CollapsibleTrigger className="w-full px-4 hover:bg-muted/50 rounded-t-xl transition-colors">
                    <SectionHeader
                      title="Date & Schedule"
                      description="When your event starts and ends"
                      isOpen={openSections.schedule}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-6 space-y-6">
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
                                        'w-full justify-start text-left font-normal',
                                        !dateValue && 'text-muted-foreground',
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {dateValue ? (
                                        format(dateValue, 'PPP p')
                                      ) : (
                                        <span>Select when your event kicks off</span>
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
                                We'll store this in your local timezone and display it clearly for
                                attendees.
                              </FormDescription>
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
                                        'w-full justify-start text-left font-normal',
                                        !dateValue && 'text-muted-foreground',
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {dateValue ? (
                                        format(dateValue, 'PPP p')
                                      ) : (
                                        <span>When should things wrap up?</span>
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
                                Must be after your start time so attendees don't get confused.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

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
                                        'w-full justify-start text-left font-normal',
                                        !dateValue && 'text-muted-foreground',
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {dateValue ? (
                                        format(dateValue, 'PPP p')
                                      ) : (
                                        <span>Optional: last moment people can sign up</span>
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
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Branding Section */}
                <Collapsible
                  open={openSections.branding}
                  onOpenChange={() => toggleSection('branding')}
                  className="border border-border rounded-xl"
                >
                  <CollapsibleTrigger className="w-full px-4 hover:bg-muted/50 rounded-t-xl transition-colors">
                    <SectionHeader
                      title="Branding"
                      description="Visual identity for your event page"
                      isOpen={openSections.branding}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-6 space-y-6">
                    <FormField
                      control={control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary color</FormLabel>
                          <FormControl>
                            <Input
                              type="color"
                              className="h-10 w-24 cursor-pointer px-2 py-1"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            We'll use this as the accent for buttons and highlights on your event
                            page.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional: paste a direct image URL and we'll show it in the header of
                            your event page.
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
                              placeholder="One line that helps people instantly get the vibe"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Short and friendly works best here — think of it as the elevator pitch
                            under your title.
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
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional: use a wide image and we'll handle the rest for the top of your
                            landing page.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>

                {/* CTA Section */}
                <Collapsible
                  open={openSections.cta}
                  onOpenChange={() => toggleSection('cta')}
                  className="border border-border rounded-xl"
                >
                  <CollapsibleTrigger className="w-full px-4 hover:bg-muted/50 rounded-t-xl transition-colors">
                    <SectionHeader
                      title="Call to Action"
                      description="Button labels for your event page"
                      isOpen={openSections.cta}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-6 space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={control}
                        name="primaryCtaLabel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary button label</FormLabel>
                            <FormControl>
                              <Input type="text" placeholder="Register now" {...field} />
                            </FormControl>
                            <FormDescription>
                              This is the main call-to-action visitors will see on your event hero.
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
                                placeholder="Learn more (optional)"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Optional: a softer action that can point to a schedule, FAQ, or extra
                              details.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-border pt-6 mt-4">
                  <Button type="button" variant="ghost" onClick={() => navigate(listPath)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    disabled={isSubmitting || myOrganizations.length === 0}
                  >
                    {isSubmitting
                      ? 'Saving...'
                      : mode === 'create'
                        ? 'Save & continue to workspace'
                        : 'Save changes'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </AfCard>

        <div className="mt-6 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Need Help?</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {mode === 'create'
              ? 'Fill in the required fields to create your event. After saving, you will be guided to create a workspace before publishing.'
              : 'Update your event information. Changes will be reflected immediately after saving.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventFormPage;
