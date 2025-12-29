import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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

type EventFormValues = z.infer<typeof eventSchema>;

/**
 * EventFormPage provides AWS-style form layout for creating and editing events.
 */
export const EventFormPage: React.FC<EventFormPageProps> = ({ mode }) => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { listPath } = useEventManagementPaths();
  const { data: myOrganizations = [], isLoading: isLoadingOrganizations } =
    useMyMemberOrganizations();
  const [submitIntent, setSubmitIntent] = useState<'draft' | 'publish'>('publish');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(mode === 'edit');
  const [serverError, setServerError] = useState<string | null>(null);
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);

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
    },
  });

  const {
    handleSubmit,
    reset,
    control,
    watch,
  } = form;

  useEffect(() => {
    const loadEvent = async () => {
      if (mode !== 'edit' || !eventId) return;
      try {
        setIsLoadingEvent(true);
        const { data, error } = await supabase
          .from('events')
          .select('id, name, description, mode, start_date, end_date, capacity, visibility, status, created_at, updated_at, organization_id, branding')
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

  const pageTitle = mode === 'create' ? 'Create New Event' : 'Edit Event';
  const pageSubtitle =
    mode === 'create'
      ? 'Fill in the details to create your event'
      : 'Update your event information';

  const onSubmit = async (values: EventFormValues) => {
    if (isSubmitting) return;

    setServerError(null);

    try {
      setIsSubmitting(true);
      const status = submitIntent === 'draft' ? 'DRAFT' : 'PUBLISHED';

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
        status,
        branding: {
          primaryColor: values.primaryColor,
          logoUrl: values.logoUrl || undefined,
          heroSubtitle: values.heroSubtitle?.trim() || undefined,
          bannerUrl: values.bannerUrl || undefined,
          primaryCtaLabel: values.primaryCtaLabel?.trim() || undefined,
          secondaryCtaLabel: values.secondaryCtaLabel?.trim() || undefined,
        },
      };

      let error;
      if (mode === 'create') {
        ({ error } = await supabase.from('events').insert(payload));
      } else {
        ({ error } = await supabase.from('events').update(payload).eq('id', eventId));
      }

      if (error) throw error;

      toast({
        title:
          mode === 'create'
            ? submitIntent === 'draft'
              ? 'Draft saved'
              : 'Event created'
            : 'Event updated',
        description:
          mode === 'create'
            ? submitIntent === 'draft'
              ? 'Your event draft has been saved.'
              : 'Your event has been created successfully.'
            : 'Your changes have been saved.',
      });

      navigate(listPath);
    } catch (err: any) {
      console.error('Failed to save event', err);
      const rawMessage = err?.message || 'Please try again.';

      // Surface the exact Supabase error so we can properly debug issues
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
      label: mode === 'create' ? 'Create Event' : 'Save Changes',
      action: () => {
        const formEl = document.getElementById('event-form') as HTMLFormElement | null;
        if (formEl) {
          setSubmitIntent('publish');
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
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PageHeader title={pageTitle} subtitle={pageSubtitle} actions={pageActions} />

        <div className="mt-6 rounded-2xl border border-border bg-card/60 p-6 shadow-soft">
          {isLoadingEvent ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading event...</div>
          ) : (
            <Form {...form}>
              <form
                id="event-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-8"
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
                              const { error } = await supabase.functions.invoke('self-approve-organizer');
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
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-foreground">Basic Information</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <FormField
                      control={control}
                      name="organizationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization *</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={isLoadingOrganizations || myOrganizations.length === 0 || isSubmitting}
                              {...field}
                            >
                              <option value="">
                                {isLoadingOrganizations
                                  ? 'Loading organizations...'
                                  : myOrganizations.length === 0
                                    ? 'No organizations available'
                                    : 'Select an organization'}
                              </option>
                              {myOrganizations.map((org: any) => (
                                <option key={org.id} value={org.id}>
                                  {org.name}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Name *</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="Enter event name" {...field} />
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
                          <FormControl>
                            <Textarea rows={4} placeholder="Describe your event" {...field} />
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
                            <FormLabel>Event Mode *</FormLabel>
                            <FormControl>
                              <select
                                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm shadow-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter capacity (optional)"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>Leave blank if there is no fixed capacity.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="mb-4 text-lg font-semibold text-foreground">Date and Time</h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={control}
                      name="startDate"
                      render={({ field }) => {
                        const dateValue = field.value ? new Date(field.value) : undefined;
                        return (
                          <FormItem>
                            <FormLabel>Start Date *</FormLabel>
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
                                      <span>Select start date & time</span>
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
                            <FormDescription>Times are saved using your current timezone.</FormDescription>
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
                            <FormLabel>End Date *</FormLabel>
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
                                      <span>Select end date & time</span>
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
                            <FormDescription>Must be after the start date.</FormDescription>
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
                            <FormLabel>Registration Deadline</FormLabel>
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
                                      <span>Select registration deadline (optional)</span>
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
                              Optional: registrations will be closed after this time.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="mb-4 text-lg font-semibold text-foreground">Branding</h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-6">
                      <FormField
                        control={control}
                        name="primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Color</FormLabel>
                            <FormControl>
                              <Input
                                type="color"
                                className="h-10 w-24 cursor-pointer px-2 py-1"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              This color will be used as the accent for your event branding.
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
                              Optional: link to an image that will appear on your public event page.
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
                            <FormLabel>Hero Subtitle</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="Short tagline shown under the event name"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Optional short sentence to make your landing hero more compelling.
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
                            <FormLabel>Hero Banner Image URL</FormLabel>
                            <FormControl>
                              <Input
                                type="url"
                                placeholder="https://example.com/hero-banner.jpg"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Optional background image for the top section of your public event page.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="primaryCtaLabel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Button Label</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="Register now"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Text for the main call-to-action button on your landing page.
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
                            <FormLabel>Secondary Button Label</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="Learn more (optional)"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Optional secondary action shown next to the main button.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      {(() => {
                        const primaryColor = watch('primaryColor') || '#2563eb';
                        const logoUrl = watch('logoUrl');
                        const name = watch('name') || 'Your event name';
                        const heroSubtitle = watch('heroSubtitle');
                        const primaryCtaLabel = watch('primaryCtaLabel') || 'Register now';

                        return (
                          <div
                            className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border bg-card shadow-sm"
                            style={{ borderColor: primaryColor }}
                            aria-label="Event landing preview"
                          >
                            <div
                              className="p-4 text-white"
                              style={{
                                backgroundColor: primaryColor,
                              }}
                            >
                              <p className="text-xs font-medium opacity-80">Landing preview</p>
                              <div className="mt-3 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background/10 overflow-hidden">
                                  {logoUrl ? (
                                    <img
                                      src={logoUrl}
                                      alt="Event logo preview"
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <span className="text-xs font-semibold opacity-80">Logo</span>
                                  )}
                                </div>
                                <div>
                                  <p className="text-base font-semibold">{name}</p>
                                  <p className="text-xs opacity-90">
                                    {heroSubtitle || 'Add a short subtitle to describe your event at a glance.'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 flex items-center justify-between bg-card">
                              <div className="space-y-1">
                                <div className="h-2 w-24 rounded-full bg-muted" />
                                <div className="h-2 w-32 rounded-full bg-muted" />
                              </div>
                              <div
                                className="rounded-full px-3 py-1 text-xs font-medium text-primary-foreground"
                                style={{ backgroundColor: primaryColor }}
                              >
                                {primaryCtaLabel}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate('../list')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="outline"
                    onClick={() => setSubmitIntent('draft')}
                    disabled={isSubmitting || myOrganizations.length === 0}
                  >
                    Save as draft
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    onClick={() => setSubmitIntent('publish')}
                    disabled={isSubmitting || myOrganizations.length === 0}
                  >
                    {isSubmitting
                      ? mode === 'create'
                        ? 'Creating...'
                        : 'Saving...'
                      : mode === 'create'
                        ? 'Create event'
                        : 'Save changes'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Need Help?</h4>
          <p className="text-sm text-blue-700">
            {mode === 'create'
              ? 'Fill in the required fields to create your event. You can save as draft and continue editing later.'
              : 'Update your event information. Changes will be reflected immediately after saving.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventFormPage;
