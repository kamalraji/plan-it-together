import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/looseClient';
import { useCurrentOrganization } from '@/components/organization/OrganizationContext';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface EventFormPageProps {
  mode: 'create' | 'edit';
}

const eventSchema = z
  .object({
    name: z.string().trim().min(1, 'Event name is required'),
    description: z.string().trim().min(1, 'Description is required'),
    mode: z.enum(['ONLINE', 'OFFLINE', 'HYBRID'], { required_error: 'Mode is required' }),
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
  const organization = useCurrentOrganization();
  const { toast } = useToast();
  const [submitIntent, setSubmitIntent] = useState<'draft' | 'publish'>('publish');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(mode === 'edit');
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      description: '',
      mode: 'ONLINE',
      capacity: '',
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      primaryColor: '#2563eb',
      logoUrl: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
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
          capacity: data.capacity != null ? String(data.capacity) : '',
          startDate: data.start_date ? new Date(data.start_date).toISOString().slice(0, 16) : '',
          endDate: data.end_date ? new Date(data.end_date).toISOString().slice(0, 16) : '',
          registrationDeadline: '',
          primaryColor: (data.branding as any)?.primaryColor ?? '#2563eb',
          logoUrl: (data.branding as any)?.logoUrl ?? '',
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
        organization_id: organization?.id ?? null,
        visibility: 'PUBLIC',
        status,
      };

      if (values.primaryColor || values.logoUrl) {
        payload.branding = {
          primaryColor: values.primaryColor,
          logoUrl: values.logoUrl || undefined,
        };
      }

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

      navigate('../list');
    } catch (err: any) {
      console.error('Failed to save event', err);
      const message = err?.message || 'Please try again.';
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
      action: () => navigate('../list'),
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

        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          {isLoadingEvent ? (
            <div className="py-12 text-center text-gray-500 text-sm">Loading event...</div>
          ) : (
            <form
              id="event-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
              noValidate
            >
              {serverError && (
                <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-2">
                  {serverError}
                </div>
              )}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="event-name" className="block text-sm font-medium text-gray-700 mb-2">
                      Event Name *
                    </label>
                    <input
                      type="text"
                      id="event-name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter event name"
                      {...register('name')}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="event-description"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Description *
                    </label>
                    <textarea
                      id="event-description"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe your event"
                      {...register('description')}
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="event-mode" className="block text-sm font-medium text-gray-700 mb-2">
                        Event Mode *
                      </label>
                      <select
                        id="event-mode"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        {...register('mode')}
                      >
                        <option value="ONLINE">Online</option>
                        <option value="OFFLINE">Offline</option>
                        <option value="HYBRID">Hybrid</option>
                      </select>
                      {errors.mode && (
                        <p className="mt-1 text-sm text-red-600">{errors.mode.message}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="event-capacity"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Capacity
                      </label>
                      <input
                        type="number"
                        id="event-capacity"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter capacity (optional)"
                        {...register('capacity')}
                      />
                      {errors.capacity && (
                        <p className="mt-1 text-sm text-red-600">{errors.capacity.message as string}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Date and Time</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="datetime-local"
                      id="start-date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      {...register('startDate')}
                    />
                    {errors.startDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="datetime-local"
                      id="end-date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      {...register('endDate')}
                    />
                    {errors.endDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="registration-deadline"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Registration Deadline
                    </label>
                    <input
                      type="datetime-local"
                      id="registration-deadline"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      {...register('registrationDeadline')}
                    />
                    {errors.registrationDeadline && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.registrationDeadline.message as string}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Branding</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label
                      htmlFor="primary-color"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Primary Color
                    </label>
                    <input
                      type="color"
                      id="primary-color"
                      className="h-10 w-20 border border-gray-300 rounded-md"
                      {...register('primaryColor')}
                    />
                    {errors.primaryColor && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.primaryColor.message as string}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="logo-url" className="block text-sm font-medium text-gray-700 mb-2">
                      Logo URL
                    </label>
                    <input
                      type="url"
                      id="logo-url"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/logo.png"
                      {...register('logoUrl')}
                    />
                    {errors.logoUrl && (
                      <p className="mt-1 text-sm text-red-600">{errors.logoUrl.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('../list')}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={() => setSubmitIntent('draft')}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  onClick={() => setSubmitIntent('publish')}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
                >
                  {isSubmitting
                    ? mode === 'create'
                      ? 'Creating...'
                      : 'Saving...'
                    : mode === 'create'
                      ? 'Create Event'
                      : 'Save Changes'}
                </button>
              </div>
            </form>
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
