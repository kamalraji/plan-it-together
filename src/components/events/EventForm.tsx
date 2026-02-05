import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { supabase } from '@/integrations/supabase/looseClient';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentOrganization } from '@/components/organization/OrganizationContext';
import {
  Event,
  EventMode,
  EventTemplate,
  CreateEventDTO,
  EventVisibility,
  Organization,
} from '../../types';
import { WorkspaceTemplateLibrary, LibraryTemplate } from '@/components/workspace/WorkspaceTemplateLibrary';
import { getEventFormDefaults, getEmptyEventFormDefaults } from '@/lib/event-form-utils';

interface EventFormProps {
  event?: Event;
  isEditing?: boolean;
}

export function EventForm({ event, isEditing = false }: EventFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const organizationContext = useCurrentOrganization();
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null);
  const [selectedWorkspaceTemplate, setSelectedWorkspaceTemplate] = useState<LibraryTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'branding' | 'timeline' | 'details'>('basic');
  const [inviteLink, setInviteLink] = useState<string | null>(event?.inviteLink || null);

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<CreateEventDTO>({
    defaultValues: event 
      ? getEventFormDefaults(event) 
      : getEmptyEventFormDefaults(EventMode.OFFLINE, EventVisibility.PUBLIC)
  });

  useEffect(() => {
    if (!isEditing && organizationContext && !event) {
      setValue('organizationId', (organizationContext as any).id);
    }
  }, [isEditing, organizationContext, event, setValue]);

  const { fields: timelineFields, append: appendTimeline, remove: removeTimeline } = useFieldArray({
    control,
    name: 'timeline'
  });

  const { fields: prizeFields, append: appendPrize, remove: removePrize } = useFieldArray({
    control,
    name: 'prizes'
  });

  const { fields: sponsorFields, append: appendSponsor, remove: removeSponsor } = useFieldArray({
    control,
    name: 'sponsors'
  });

  const watchedMode = watch('mode');
  const watchedVisibility = watch('visibility');

  // Fetch event templates (Requirements 4.1)
  const { data: templates } = useQuery({
    queryKey: ['event-templates'],
    queryFn: async () => {
      // Templates are currently served from the legacy API
      const response = await api.get('/events/templates');
      return response.data.templates as EventTemplate[];
    },
  });

  // Fetch user's organizations via memberships, so they only see orgs they belong to
  const { data: organizations } = useQuery({
    queryKey: ['user-organizations'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const userSession = session?.session;

      if (!userSession?.user) {
        return [] as Organization[];
      }

      const { data, error } = await supabase
        .from('organization_memberships')
        .select('organizations ( id, name, category, verification_status )')
        .eq('user_id', userSession.user.id)
        .eq('status', 'ACTIVE');

      if (error) {
        throw error;
      }

      return (data || [])
        .map((row: any) => row.organizations)
        .filter(Boolean)
        .map((org: any) => ({
          id: org.id,
          name: org.name,
          description: '',
          category: org.category,
          verificationStatus: org.verification_status,
          branding: {},
          socialLinks: {},
          pageUrl: '',
          followerCount: 0,
          eventCount: 0,
          createdAt: '',
          updatedAt: '',
        })) as Organization[];
    },
  });

  // Helper to generate a unique, slug-like landing page URL
  const generateLandingPageSlug = (name: string) => {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const randomSuffix = Math.random().toString(36).substring(2, 7);
    return `${base}-${randomSuffix}`;
  };

  // Create/Update event mutation using Lovable Cloud
  const eventMutation = useMutation({
    mutationFn: async (data: CreateEventDTO) => {
      if (!user) {
        throw new Error('You must be logged in to manage events.');
      }

      const payload: any = {
        name: data.name,
        description: data.description,
        mode: data.mode,
        start_date: data.startDate,
        end_date: data.endDate,
        capacity: data.capacity,
        registration_deadline: data.registrationDeadline,
        organization_id: data.organizationId || null,
        visibility: data.visibility,
        branding: {
          ...(data.branding || {}),
          workspaceTemplateId: selectedWorkspaceTemplate?.id,
        } as any,
        venue: (data.venue || null) as any,
        virtual_links: (data.virtualLinks || null) as any,
      };

      if (isEditing && event) {
        const { data: updated, error } = await supabase
          .from('events')
          .update(payload)
          .eq('id', event.id)
          .select('*')
          .single();

        if (error) throw error;
        return updated;
      } else {
        const insertPayload: any = {
          ...(payload as any),
          organizer_id: user.id,
          landing_page_url: generateLandingPageSlug(data.name),
        };

        const { data: created, error } = await supabase
          .from('events')
          .insert(insertPayload)
          .select('*')
          .single();

        if (error) throw error;
        return created;
      }
    },
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: ['organizer-events'] });
      navigate(`/events/${newEvent.id}`);
    },
  });

  // Apply template when selected (Requirements 4.1)
  const applyTemplate = (template: EventTemplate) => {
    setSelectedTemplate(template);
    setValue('mode', template.defaultMode);
    if (template.suggestedCapacity) {
      setValue('capacity', template.suggestedCapacity);
    }
    if (template.timeline) {
      setValue('timeline', template.timeline);
    }
    if (template.branding) {
      setValue('branding', { ...watch('branding'), ...template.branding });
    }
  };

  // Generate invite link for private events (Requirements 24.1)
  const generateInviteLink = async () => {
    if (!event?.id) return;

    try {
      let token: string;

      if (typeof crypto !== 'undefined') {
        if (typeof crypto.randomUUID === 'function') {
          // Use UUID v4 for 128-bit entropy when available
          token = crypto.randomUUID();
        } else if (typeof crypto.getRandomValues === 'function') {
          // Fallback: 16 random bytes encoded as hex (128 bits)
          const array = new Uint8Array(16);
          crypto.getRandomValues(array);
          token = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
        } else {
          // Absolute fallback if crypto is unavailable (older browsers)
          token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        }
      } else {
        token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      }

      const { data: updated, error } = await supabase
        .from('events')
        .update({ invite_link: token })
        .eq('id', event.id)
        .select('invite_link')
        .single();

      if (error) throw error;
      setInviteLink(updated.invite_link);
    } catch (error) {
      console.error('Failed to generate invite link:', error);
    }
  };

  const onSubmit = (data: CreateEventDTO) => {
    eventMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isEditing ? 'Update your event details' : 'Set up your event with customizable settings and branding'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Template Selection (Requirements 4.1) */}
          {!isEditing && templates && templates.length > 0 && (
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Choose a Template (Optional)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-foreground/40'
                }`}
                onClick={() => applyTemplate(template)}
              >
                <h3 className="font-medium text-foreground">{template.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-xs bg-muted text-foreground px-2 py-1 rounded">
                    {template.category}
                  </span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {template.defaultMode}
                  </span>
                </div>
              </div>
            ))}
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="bg-card rounded-lg shadow border border-border">
            <div className="border-b border-border">
              <nav className="-mb-px flex space-x-8 px-6">
                {[
                  { key: 'basic', label: 'Basic Details' },
                  { key: 'branding', label: 'Branding' },
                  { key: 'timeline', label: 'Timeline & Agenda' },
                  { key: 'details', label: 'Additional Details' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.key
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Basic Details Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Event Name *
                    </label>
                    <input
                      type="text"
                      {...register('name', { required: 'Event name is required' })}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Enter event name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Description *
                    </label>
                    <textarea
                      {...register('description', { required: 'Description is required' })}
                      rows={4}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Describe your event"
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>
                    )}
                  </div>

                  {/* Organization Selection (Requirements 19.1) */}
                  {organizations && organizations.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Organization (Optional)
                      </label>
                      <select
                        {...register('organizationId')}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="">Select an organization</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name} {org.verificationStatus === 'VERIFIED' && '✓'}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Publishing under an organization will display their branding on your event page
                      </p>
                    </div>
                  )}

                  {/* Workspace Template Selection (Workspace templates into event creation) */}
                  {!isEditing && (
                    <div className="border border-dashed border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-medium text-foreground">Workspace template (optional)</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Choose a workspace template to pre-structure tasks, roles, and communication for this event.
                          </p>
                        </div>
                        {selectedWorkspaceTemplate && (
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                            {selectedWorkspaceTemplate.name}
                          </span>
                        )}
                      </div>


                      <div className="mt-4">
                        <WorkspaceTemplateLibrary
                          onTemplateSelect={(tpl) => setSelectedWorkspaceTemplate(tpl)}
                          showActions
                          eventSize={watch('capacity')}
                        />
                      </div>
                    </div>
                  )}

                  {/* Event Visibility (Requirements 19.3, 19.4, 19.5) */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Event Visibility *
                    </label>
                    <div className="space-y-3">
                      {Object.values(EventVisibility).map((visibility) => (
                        <label key={visibility} className="flex items-start">
                          <input
                            type="radio"
                            value={visibility}
                            {...register('visibility', { required: 'Event visibility is required' })}
                            className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-foreground">
                              {visibility === EventVisibility.PUBLIC && 'Public'}
                              {visibility === EventVisibility.PRIVATE && 'Private'}
                              {visibility === EventVisibility.UNLISTED && 'Unlisted'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {visibility === EventVisibility.PUBLIC && 'Anyone can find and register for this event'}
                              {visibility === EventVisibility.PRIVATE && 'Only people with invite links can access this event'}
                              {visibility === EventVisibility.UNLISTED && 'Accessible via direct link but not searchable'}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.visibility && (
                      <p className="mt-1 text-sm text-destructive">{errors.visibility.message}</p>
                    )}
                  </div>

                  {/* Private Event Invite Link (Requirements 24.1) */}
                  {watchedVisibility === EventVisibility.PRIVATE && (
                    <div className="bg-info/10 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-info mb-2">Private Event Access</h4>
                      {isEditing && event ? (
                        <div>
                          {inviteLink ? (
                            <div>
                              <label className="block text-sm font-medium text-info mb-2">
                                Invite Link
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={inviteLink}
                                  readOnly
                                  className="flex-1 px-3 py-2 bg-background border border-info/40 rounded-md text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => navigator.clipboard.writeText(inviteLink)}
                                  className="px-3 py-2 bg-info text-info-foreground text-sm rounded-md hover:bg-info/90"
                                >
                                  Copy
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={generateInviteLink}
                                className="mt-2 text-sm text-info hover:text-info/80"
                              >
                                Generate New Link
                              </button>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm text-info mb-2">
                                Generate an invite link to share with specific people
                              </p>
                              <button
                                type="button"
                                onClick={generateInviteLink}
                                className="px-4 py-2 bg-info text-info-foreground text-sm rounded-md hover:bg-info/90"
                              >
                                Generate Invite Link
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-info">
                          An invite link will be generated after creating the event
                        </p>
                      )}
                    </div>
                  )}

                  {/* Event Mode Selection (Requirements 5.2, 5.3, 5.4) */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Event Mode *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.values(EventMode).map((mode) => (
                        <label key={mode} className="relative">
                          <input
                            type="radio"
                            value={mode}
                            {...register('mode', { required: 'Event mode is required' })}
                            className="sr-only"
                          />
                          <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                            watchedMode === mode
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            <div className="text-center">
                              <h3 className="font-medium text-foreground">{mode}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {mode === EventMode.OFFLINE && 'In-person event at a physical venue'}
                                {mode === EventMode.ONLINE && 'Virtual event with online participation'}
                                {mode === EventMode.HYBRID && 'Both in-person and virtual participation'}
                              </p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Start Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        {...register('startDate', { required: 'Start date is required' })}
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                      {errors.startDate && (
                        <p className="mt-1 text-sm text-destructive">{errors.startDate.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        End Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        {...register('endDate', { required: 'End date is required' })}
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                      {errors.endDate && (
                        <p className="mt-1 text-sm text-destructive">{errors.endDate.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Capacity (Optional)
                      </label>
                      <input
                        type="number"
                        min="1"
                        {...register('capacity', { min: 1 })}
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Maximum participants"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Registration Deadline (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        {...register('registrationDeadline')}
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Venue Configuration (Requirements 5.2) */}
                  {(watchedMode === EventMode.OFFLINE || watchedMode === EventMode.HYBRID) && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-foreground mb-4">Venue Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Venue Name *
                          </label>
                          <input
                            type="text"
                            {...register('venue.name', { 
                              required: watchedMode === EventMode.OFFLINE || watchedMode === EventMode.HYBRID ? 'Venue name is required' : false 
                            })}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="Enter venue name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Address *
                          </label>
                          <input
                            type="text"
                            {...register('venue.address', { 
                              required: watchedMode === EventMode.OFFLINE || watchedMode === EventMode.HYBRID ? 'Address is required' : false 
                            })}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="Street address"
                          />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              City *
                            </label>
                            <input
                              type="text"
                              {...register('venue.city', { 
                                required: watchedMode === EventMode.OFFLINE || watchedMode === EventMode.HYBRID ? 'City is required' : false 
                              })}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              State *
                            </label>
                            <input
                              type="text"
                              {...register('venue.state', { 
                                required: watchedMode === EventMode.OFFLINE || watchedMode === EventMode.HYBRID ? 'State is required' : false 
                              })}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Country *
                            </label>
                            <input
                              type="text"
                              {...register('venue.country', { 
                                required: watchedMode === EventMode.OFFLINE || watchedMode === EventMode.HYBRID ? 'Country is required' : false 
                              })}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Postal Code
                            </label>
                            <input
                              type="text"
                              {...register('venue.postalCode')}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Virtual Configuration (Requirements 5.3) */}
                  {(watchedMode === EventMode.ONLINE || watchedMode === EventMode.HYBRID) && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-foreground mb-4">Virtual Meeting Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Meeting URL *
                          </label>
                          <input
                            type="url"
                            {...register('virtualLinks.meetingUrl', { 
                              required: watchedMode === EventMode.ONLINE || watchedMode === EventMode.HYBRID ? 'Meeting URL is required' : false 
                            })}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="https://zoom.us/j/..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Meeting ID
                            </label>
                            <input
                              type="text"
                              {...register('virtualLinks.meetingId')}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                              placeholder="Meeting ID"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Password
                            </label>
                            <input
                              type="text"
                              {...register('virtualLinks.password')}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                              placeholder="Meeting password"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Platform
                          </label>
                          <select
                            {...register('virtualLinks.platform')}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                          >
                            <option value="zoom">Zoom</option>
                            <option value="teams">Microsoft Teams</option>
                            <option value="meet">Google Meet</option>
                            <option value="webex">Webex</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Instructions
                          </label>
                          <textarea
                            {...register('virtualLinks.instructions')}
                            rows={3}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="Additional instructions for participants"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Branding Tab (Requirements 4.2, 19.2) */}
              {activeTab === 'branding' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-4">Event Branding</h3>
                    <p className="text-muted-foreground mb-6">
                      Customize your event's visual appearance and branding elements.
                      {watch('organizationId') && ' Organization branding will be automatically applied.'}
                    </p>
                  </div>

                  {/* Organization Branding Preview (Requirements 19.2) */}
                  {watch('organizationId') && organizations && (
                    <div className="bg-muted/50 border border-border rounded-lg p-4">
                      <h4 className="text-sm font-medium text-foreground mb-2">Organization Branding</h4>
                      {(() => {
                        const selectedOrg = organizations.find(org => org.id === watch('organizationId'));
                        if (selectedOrg) {
                          return (
                            <div className="flex items-center space-x-4">
                              {selectedOrg.branding?.logoUrl && (
                                <img
                                  src={selectedOrg.branding.logoUrl}
                                  alt={selectedOrg.name}
                                  className="h-12 w-12 object-contain"
                                />
                              )}
                              <div>
                                <p className="text-sm font-medium text-foreground">{selectedOrg.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  This organization's branding will be displayed on your event page
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Logo URL
                      </label>
                      <input
                        type="url"
                        {...register('branding.logoUrl')}
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Banner URL
                      </label>
                      <input
                        type="url"
                        {...register('branding.bannerUrl')}
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="https://example.com/banner.jpg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Primary Color
                      </label>
                      <input
                        type="color"
                        {...register('branding.primaryColor')}
                        className="w-full h-10 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Secondary Color
                      </label>
                      <input
                        type="color"
                        {...register('branding.secondaryColor')}
                        className="w-full h-10 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Custom CSS (Advanced)
                    </label>
                    <textarea
                      {...register('branding.customCss')}
                      rows={6}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
                      placeholder="/* Custom CSS for your event page */"
                    />
                  </div>
                </div>
              )}

              {/* Timeline & Agenda Tab (Requirements 4.3) */}
              {activeTab === 'timeline' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-4">Event Timeline</h3>
                    <p className="text-muted-foreground mb-6">
                      Define the schedule and agenda for your event.
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium text-foreground">Timeline Items</h4>
                      <button
                        type="button"
                        onClick={() => appendTimeline({
                          title: '',
                          description: '',
                          startTime: '',
                          endTime: '',
                          type: 'session',
                          speaker: '',
                          location: ''
                        })}
                        className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm hover:bg-primary/90"
                      >
                        Add Timeline Item
                      </button>
                    </div>

                    <div className="space-y-4">
                      {timelineFields.map((field, index) => (
                        <div key={field.id} className="border border-border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-4">
                            <h5 className="text-sm font-medium text-foreground">Timeline Item {index + 1}</h5>
                            <button
                              type="button"
                              onClick={() => removeTimeline(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Title *
                              </label>
                              <input
                                type="text"
                                {...register(`timeline.${index}.title`, { required: 'Title is required' })}
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                placeholder="Session title"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Type
                              </label>
                              <select
                                {...register(`timeline.${index}.type`)}
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                              >
                                <option value="session">Session</option>
                                <option value="break">Break</option>
                                <option value="networking">Networking</option>
                                <option value="presentation">Presentation</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Start Time *
                              </label>
                              <input
                                type="datetime-local"
                                {...register(`timeline.${index}.startTime`, { required: 'Start time is required' })}
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                End Time *
                              </label>
                              <input
                                type="datetime-local"
                                {...register(`timeline.${index}.endTime`, { required: 'End time is required' })}
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Speaker
                              </label>
                              <input
                                type="text"
                                {...register(`timeline.${index}.speaker`)}
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                placeholder="Speaker name"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Location
                              </label>
                              <input
                                type="text"
                                {...register(`timeline.${index}.location`)}
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                placeholder="Room or virtual link"
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-foreground mb-1">
                              Description
                            </label>
                            <textarea
                              {...register(`timeline.${index}.description`)}
                              rows={2}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                              placeholder="Session description"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Details Tab (Requirements 4.5) */}
              {activeTab === 'details' && (
                <div className="space-y-8">
                  {/* Prizes Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium text-foreground">Prizes</h4>
                      <button
                        type="button"
                        onClick={() => appendPrize({
                          title: '',
                          description: '',
                          value: '',
                          position: prizeFields.length + 1,
                          category: ''
                        })}
                        className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm hover:bg-primary/90"
                      >
                        Add Prize
                      </button>
                    </div>

                    <div className="space-y-4">
                      {prizeFields.map((field, index) => (
                        <div key={field.id} className="border border-border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-4">
                            <h5 className="text-sm font-medium text-foreground">Prize {index + 1}</h5>
                            <button
                              type="button"
                              onClick={() => removePrize(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Title *
                              </label>
                              <input
                                type="text"
                                {...register(`prizes.${index}.title`, { required: 'Prize title is required' })}
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                placeholder="First Place"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Value
                              </label>
                              <input
                                type="text"
                                {...register(`prizes.${index}.value`)}
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                placeholder="$1000"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Position
                              </label>
                              <input
                                type="number"
                                min="1"
                                {...register(`prizes.${index}.position`, { required: 'Position is required', min: 1 })}
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-foreground mb-1">
                              Description *
                            </label>
                            <textarea
                              {...register(`prizes.${index}.description`, { required: 'Prize description is required' })}
                              rows={2}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                              placeholder="Prize description"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sponsors Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium text-foreground">Sponsors</h4>
                      <button
                        type="button"
                        onClick={() => appendSponsor({
                          name: '',
                          logoUrl: '',
                          website: '',
                          tier: 'bronze',
                          description: ''
                        })}
                        className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm hover:bg-primary/90"
                      >
                        Add Sponsor
                      </button>
                    </div>

                    <div className="space-y-4">
                      {sponsorFields.map((field, index) => (
                        <div key={field.id} className="border border-border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-4">
                            <h5 className="text-sm font-medium text-foreground">Sponsor {index + 1}</h5>
                            <button
                              type="button"
                              onClick={() => removeSponsor(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Name *
                              </label>
                              <input
                                type="text"
                                {...register(`sponsors.${index}.name`, { required: 'Sponsor name is required' })}
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                placeholder="Company name"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Logo URL *
                              </label>
                              <input
                                type="url"
                                {...register(`sponsors.${index}.logoUrl`, { required: 'Logo URL is required' })}
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                placeholder="https://example.com/logo.png"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Tier
                              </label>
                              <select
                                {...register(`sponsors.${index}.tier`)}
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                              >
                                <option value="title">Title</option>
                                <option value="platinum">Platinum</option>
                                <option value="gold">Gold</option>
                                <option value="silver">Silver</option>
                                <option value="bronze">Bronze</option>
                              </select>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Website
                              </label>
                              <input
                                type="url"
                                {...register(`sponsors.${index}.website`)}
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                placeholder="https://company.com"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Description
                              </label>
                              <textarea
                                {...register(`sponsors.${index}.description`)}
                                rows={2}
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                placeholder="Sponsor description"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={eventMutation.isPending}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {eventMutation.isPending 
                ? (isEditing ? 'Updating...' : 'Creating...') 
                : (isEditing ? 'Update Event' : 'Create Event')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}