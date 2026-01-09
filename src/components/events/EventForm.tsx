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
  EventCategory,
  Organization,
} from '../../types';
import { WorkspaceTemplateLibrary } from '@/components/workspace/WorkspaceTemplateLibrary';
import type { WorkspaceTemplate as WorkspaceWorkspaceTemplate } from '@/types/workspace-template';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

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
  const [selectedWorkspaceTemplate, setSelectedWorkspaceTemplate] = useState<WorkspaceWorkspaceTemplate | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(event?.inviteLink || null);
  
  // Collapsible section states
  const [openSections, setOpenSections] = useState({
    template: false,
    basic: true,
    venue: true,
    timeline: false,
    prizes: false,
    sponsors: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<CreateEventDTO>({
    defaultValues: event ? {
      name: event.name,
      description: event.description,
      mode: event.mode,
      startDate: event.startDate.slice(0, 16),
      endDate: event.endDate.slice(0, 16),
      capacity: event.capacity,
      registrationDeadline: event.registrationDeadline?.slice(0, 16),
      organizationId: event.organizationId,
      visibility: event.visibility,
      branding: event.branding,
      venue: event.venue,
      virtualLinks: event.virtualLinks,
      timeline: event.timeline || [],
      prizes: event.prizes || [],
      sponsors: event.sponsors || [],
      category: event.category,
    } : {
      mode: EventMode.OFFLINE,
      visibility: EventVisibility.PUBLIC,
      branding: {},
      timeline: [],
      prizes: [],
      sponsors: [],
      category: undefined,
    }
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

  const { data: templates } = useQuery({
    queryKey: ['event-templates'],
    queryFn: async () => {
      const response = await api.get('/events/templates');
      return response.data.templates as EventTemplate[];
    },
  });

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

  const generateLandingPageSlug = (name: string) => {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const randomSuffix = Math.random().toString(36).substring(2, 7);
    return `${base}-${randomSuffix}`;
  };

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
        category: data.category || null,
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

  const generateInviteLink = async () => {
    if (!event?.id) return;

    try {
      let token: string;

      if (typeof crypto !== 'undefined') {
        if (typeof crypto.randomUUID === 'function') {
          token = crypto.randomUUID();
        } else if (typeof crypto.getRandomValues === 'function') {
          const array = new Uint8Array(16);
          crypto.getRandomValues(array);
          token = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
        } else {
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

  const SectionHeader = ({ 
    title, 
    description, 
    isOpen, 
    onToggle,
    badge
  }: { 
    title: string; 
    description?: string; 
    isOpen: boolean; 
    onToggle: () => void;
    badge?: React.ReactNode;
  }) => (
    <CollapsibleTrigger asChild onClick={onToggle}>
      <div className="flex items-center justify-between w-full cursor-pointer py-4 px-6 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          {isOpen ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {badge}
      </div>
    </CollapsibleTrigger>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isEditing ? 'Update your event details' : 'Fill in the details below to create your event'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Template Selection */}
          {!isEditing && templates && templates.length > 0 && (
            <Card>
              <Collapsible open={openSections.template} onOpenChange={() => toggleSection('template')}>
                <SectionHeader
                  title="Choose a Template"
                  description="Start with a pre-configured template (optional)"
                  isOpen={openSections.template}
                  onToggle={() => toggleSection('template')}
                  badge={selectedTemplate && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {selectedTemplate.name}
                    </span>
                  )}
                />
                <CollapsibleContent>
                  <CardContent className="pt-0">
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
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}

          {/* Basic Details Section */}
          <Card>
            <Collapsible open={openSections.basic} onOpenChange={() => toggleSection('basic')}>
              <SectionHeader
                title="Basic Details"
                description="Event name, description, dates, and settings"
                isOpen={openSections.basic}
                onToggle={() => toggleSection('basic')}
              />
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-6">
                  {/* Event Name */}
                  <div>
                    <Label htmlFor="name">Event Name *</Label>
                    <Input
                      id="name"
                      {...register('name', { required: 'Event name is required' })}
                      placeholder="Enter event name"
                      className="mt-1.5"
                    />
                    {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      {...register('description', { required: 'Description is required' })}
                      rows={4}
                      placeholder="Describe your event"
                      className="mt-1.5"
                    />
                    {errors.description && <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>}
                  </div>

                  {/* Event Category */}
                  <div>
                    <Label htmlFor="category">Event Category *</Label>
                    <select
                      id="category"
                      {...register('category', { required: 'Event category is required' })}
                      className="mt-1.5 w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select a category</option>
                      {Object.values(EventCategory).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                    {errors.category && <p className="mt-1 text-sm text-destructive">{errors.category.message}</p>}
                  </div>

                  {/* Organization Selection */}
                  {organizations && organizations.length > 0 && (
                    <div>
                      <Label htmlFor="organizationId">Organization (Optional)</Label>
                      <select
                        id="organizationId"
                        {...register('organizationId')}
                        className="mt-1.5 w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select an organization</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name} {org.verificationStatus === 'VERIFIED' && '✓'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Event Mode */}
                  <div>
                    <Label>Event Mode *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      {Object.values(EventMode).map((mode) => (
                        <label key={mode} className="relative cursor-pointer">
                          <input
                            type="radio"
                            value={mode}
                            {...register('mode', { required: 'Event mode is required' })}
                            className="sr-only"
                          />
                          <div className={`border-2 rounded-lg p-4 transition-colors ${
                            watchedMode === mode
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-muted-foreground/40'
                          }`}>
                            <div className="text-center">
                              <h4 className="font-medium text-foreground">{mode}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {mode === EventMode.OFFLINE && 'In-person event'}
                                {mode === EventMode.ONLINE && 'Virtual event'}
                                {mode === EventMode.HYBRID && 'Both in-person & virtual'}
                              </p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Event Visibility */}
                  <div>
                    <Label>Event Visibility *</Label>
                    <div className="space-y-3 mt-2">
                      {Object.values(EventVisibility).map((visibility) => (
                        <label key={visibility} className="flex items-start cursor-pointer">
                          <input
                            type="radio"
                            value={visibility}
                            {...register('visibility', { required: 'Event visibility is required' })}
                            className="mt-1 h-4 w-4 text-primary focus:ring-ring border-input"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-foreground">
                              {visibility === EventVisibility.PUBLIC && 'Public'}
                              {visibility === EventVisibility.PRIVATE && 'Private'}
                              {visibility === EventVisibility.UNLISTED && 'Unlisted'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {visibility === EventVisibility.PUBLIC && 'Anyone can find and register'}
                              {visibility === EventVisibility.PRIVATE && 'Invite-only access'}
                              {visibility === EventVisibility.UNLISTED && 'Direct link only, not searchable'}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Private Event Invite Link */}
                  {watchedVisibility === EventVisibility.PRIVATE && isEditing && event && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-foreground mb-2">Private Event Access</h4>
                      {inviteLink ? (
                        <div className="flex items-center gap-2">
                          <Input value={inviteLink} readOnly className="flex-1" />
                          <Button type="button" size="sm" onClick={() => navigator.clipboard.writeText(inviteLink)}>
                            Copy
                          </Button>
                        </div>
                      ) : (
                        <Button type="button" size="sm" onClick={generateInviteLink}>
                          Generate Invite Link
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="startDate">Start Date & Time *</Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        {...register('startDate', { required: 'Start date is required' })}
                        className="mt-1.5"
                      />
                      {errors.startDate && <p className="mt-1 text-sm text-destructive">{errors.startDate.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date & Time *</Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        {...register('endDate', { required: 'End date is required' })}
                        className="mt-1.5"
                      />
                      {errors.endDate && <p className="mt-1 text-sm text-destructive">{errors.endDate.message}</p>}
                    </div>
                  </div>

                  {/* Capacity & Registration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="capacity">Capacity (Optional)</Label>
                      <Input
                        id="capacity"
                        type="number"
                        min="1"
                        {...register('capacity', { min: 1 })}
                        placeholder="Maximum participants"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="registrationDeadline">Registration Deadline (Optional)</Label>
                      <Input
                        id="registrationDeadline"
                        type="datetime-local"
                        {...register('registrationDeadline')}
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  {/* Workspace Template */}
                  {!isEditing && (
                    <div className="border border-dashed border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-medium text-foreground">Workspace Template (Optional)</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Pre-structure tasks, roles, and communication for this event.
                          </p>
                        </div>
                        {selectedWorkspaceTemplate && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            {selectedWorkspaceTemplate.name}
                          </span>
                        )}
                      </div>
                      <WorkspaceTemplateLibrary
                        onTemplateSelect={(tpl) => setSelectedWorkspaceTemplate(tpl)}
                        showActions
                        eventSize={watch('capacity')}
                      />
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Venue & Virtual Links Section */}
          {(watchedMode === EventMode.OFFLINE || watchedMode === EventMode.HYBRID || watchedMode === EventMode.ONLINE) && (
            <Card>
              <Collapsible open={openSections.venue} onOpenChange={() => toggleSection('venue')}>
                <SectionHeader
                  title={watchedMode === EventMode.ONLINE ? 'Virtual Meeting' : 'Venue & Location'}
                  description={watchedMode === EventMode.HYBRID ? 'Physical venue and virtual meeting details' : undefined}
                  isOpen={openSections.venue}
                  onToggle={() => toggleSection('venue')}
                />
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-6">
                    {/* Physical Venue */}
                    {(watchedMode === EventMode.OFFLINE || watchedMode === EventMode.HYBRID) && (
                      <div className="space-y-4">
                        {watchedMode === EventMode.HYBRID && (
                          <h4 className="font-medium text-foreground">Physical Venue</h4>
                        )}
                        <div>
                          <Label htmlFor="venue.name">Venue Name *</Label>
                          <Input
                            id="venue.name"
                            {...register('venue.name', { required: 'Venue name is required' })}
                            placeholder="Enter venue name"
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="venue.address">Address *</Label>
                          <Input
                            id="venue.address"
                            {...register('venue.address', { required: 'Address is required' })}
                            placeholder="Street address"
                            className="mt-1.5"
                          />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor="venue.city">City *</Label>
                            <Input id="venue.city" {...register('venue.city', { required: true })} className="mt-1.5" />
                          </div>
                          <div>
                            <Label htmlFor="venue.state">State *</Label>
                            <Input id="venue.state" {...register('venue.state', { required: true })} className="mt-1.5" />
                          </div>
                          <div>
                            <Label htmlFor="venue.country">Country *</Label>
                            <Input id="venue.country" {...register('venue.country', { required: true })} className="mt-1.5" />
                          </div>
                          <div>
                            <Label htmlFor="venue.postalCode">Postal Code</Label>
                            <Input id="venue.postalCode" {...register('venue.postalCode')} className="mt-1.5" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Virtual Links */}
                    {(watchedMode === EventMode.ONLINE || watchedMode === EventMode.HYBRID) && (
                      <div className="space-y-4">
                        {watchedMode === EventMode.HYBRID && (
                          <h4 className="font-medium text-foreground border-t pt-4">Virtual Meeting</h4>
                        )}
                        <div>
                          <Label htmlFor="virtualLinks.meetingUrl">Meeting URL *</Label>
                          <Input
                            id="virtualLinks.meetingUrl"
                            type="url"
                            {...register('virtualLinks.meetingUrl', { required: 'Meeting URL is required' })}
                            placeholder="https://zoom.us/j/..."
                            className="mt-1.5"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="virtualLinks.meetingId">Meeting ID</Label>
                            <Input id="virtualLinks.meetingId" {...register('virtualLinks.meetingId')} className="mt-1.5" />
                          </div>
                          <div>
                            <Label htmlFor="virtualLinks.password">Password</Label>
                            <Input id="virtualLinks.password" {...register('virtualLinks.password')} className="mt-1.5" />
                          </div>
                          <div>
                            <Label htmlFor="virtualLinks.platform">Platform</Label>
                            <select
                              id="virtualLinks.platform"
                              {...register('virtualLinks.platform')}
                              className="mt-1.5 w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="zoom">Zoom</option>
                              <option value="teams">Microsoft Teams</option>
                              <option value="meet">Google Meet</option>
                              <option value="webex">Webex</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="virtualLinks.instructions">Instructions</Label>
                          <Textarea
                            id="virtualLinks.instructions"
                            {...register('virtualLinks.instructions')}
                            rows={2}
                            placeholder="How to join the meeting..."
                            className="mt-1.5"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}

          {/* Timeline Section */}
          <Card>
            <Collapsible open={openSections.timeline} onOpenChange={() => toggleSection('timeline')}>
              <SectionHeader
                title="Timeline & Agenda"
                description="Schedule sessions, breaks, and activities"
                isOpen={openSections.timeline}
                onToggle={() => toggleSection('timeline')}
                badge={timelineFields.length > 0 && (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    {timelineFields.length} items
                  </span>
                )}
              />
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendTimeline({
                      title: '',
                      description: '',
                      startTime: '',
                      endTime: '',
                      type: 'session',
                      speaker: '',
                      location: ''
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Timeline Item
                  </Button>

                  {timelineFields.map((field, index) => (
                    <div key={field.id} className="border border-border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm text-foreground">Item {index + 1}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeTimeline(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Title *</Label>
                          <Input {...register(`timeline.${index}.title`, { required: true })} placeholder="Session title" className="mt-1" />
                        </div>
                        <div>
                          <Label>Type</Label>
                          <select {...register(`timeline.${index}.type`)} className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background">
                            <option value="session">Session</option>
                            <option value="break">Break</option>
                            <option value="networking">Networking</option>
                            <option value="presentation">Presentation</option>
                          </select>
                        </div>
                        <div>
                          <Label>Start Time *</Label>
                          <Input type="datetime-local" {...register(`timeline.${index}.startTime`, { required: true })} className="mt-1" />
                        </div>
                        <div>
                          <Label>End Time *</Label>
                          <Input type="datetime-local" {...register(`timeline.${index}.endTime`, { required: true })} className="mt-1" />
                        </div>
                        <div>
                          <Label>Speaker</Label>
                          <Input {...register(`timeline.${index}.speaker`)} placeholder="Speaker name" className="mt-1" />
                        </div>
                        <div>
                          <Label>Location</Label>
                          <Input {...register(`timeline.${index}.location`)} placeholder="Room or link" className="mt-1" />
                        </div>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea {...register(`timeline.${index}.description`)} rows={2} className="mt-1" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Prizes Section */}
          <Card>
            <Collapsible open={openSections.prizes} onOpenChange={() => toggleSection('prizes')}>
              <SectionHeader
                title="Prizes"
                description="Add competition prizes and awards"
                isOpen={openSections.prizes}
                onToggle={() => toggleSection('prizes')}
                badge={prizeFields.length > 0 && (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    {prizeFields.length} prizes
                  </span>
                )}
              />
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendPrize({
                      title: '',
                      description: '',
                      value: '',
                      position: prizeFields.length + 1,
                      category: ''
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Prize
                  </Button>

                  {prizeFields.map((field, index) => (
                    <div key={field.id} className="border border-border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm text-foreground">Prize {index + 1}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removePrize(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Title *</Label>
                          <Input {...register(`prizes.${index}.title`, { required: true })} placeholder="First Place" className="mt-1" />
                        </div>
                        <div>
                          <Label>Value</Label>
                          <Input {...register(`prizes.${index}.value`)} placeholder="$1000" className="mt-1" />
                        </div>
                        <div>
                          <Label>Position</Label>
                          <Input type="number" min="1" {...register(`prizes.${index}.position`)} className="mt-1" />
                        </div>
                      </div>
                      <div>
                        <Label>Description *</Label>
                        <Textarea {...register(`prizes.${index}.description`, { required: true })} rows={2} className="mt-1" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Sponsors Section */}
          <Card>
            <Collapsible open={openSections.sponsors} onOpenChange={() => toggleSection('sponsors')}>
              <SectionHeader
                title="Sponsors"
                description="Add event sponsors and partners"
                isOpen={openSections.sponsors}
                onToggle={() => toggleSection('sponsors')}
                badge={sponsorFields.length > 0 && (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    {sponsorFields.length} sponsors
                  </span>
                )}
              />
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendSponsor({
                      name: '',
                      logoUrl: '',
                      website: '',
                      tier: 'bronze',
                      description: ''
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sponsor
                  </Button>

                  {sponsorFields.map((field, index) => (
                    <div key={field.id} className="border border-border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm text-foreground">Sponsor {index + 1}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeSponsor(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Name *</Label>
                          <Input {...register(`sponsors.${index}.name`, { required: true })} placeholder="Company name" className="mt-1" />
                        </div>
                        <div>
                          <Label>Logo URL *</Label>
                          <Input type="url" {...register(`sponsors.${index}.logoUrl`, { required: true })} placeholder="https://..." className="mt-1" />
                        </div>
                        <div>
                          <Label>Tier</Label>
                          <select {...register(`sponsors.${index}.tier`)} className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background">
                            <option value="title">Title</option>
                            <option value="platinum">Platinum</option>
                            <option value="gold">Gold</option>
                            <option value="silver">Silver</option>
                            <option value="bronze">Bronze</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Website</Label>
                          <Input type="url" {...register(`sponsors.${index}.website`)} placeholder="https://..." className="mt-1" />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Input {...register(`sponsors.${index}.description`)} placeholder="Short description" className="mt-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={eventMutation.isPending}>
              {eventMutation.isPending
                ? (isEditing ? 'Updating...' : 'Creating...')
                : (isEditing ? 'Update Event' : 'Create Event')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
