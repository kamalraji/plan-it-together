import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { 
  Event, 
  EventMode, 
  EventTemplate, 
  CreateEventDTO, 
  EventVisibility,
  Organization
} from '../../types';

interface EventFormProps {
  event?: Event;
  isEditing?: boolean;
}

export function EventForm({ event, isEditing = false }: EventFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'branding' | 'timeline' | 'details'>('basic');
  const [inviteLink, setInviteLink] = useState<string | null>(event?.inviteLink || null);

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<CreateEventDTO>({
    defaultValues: event ? {
      name: event.name,
      description: event.description,
      mode: event.mode,
      startDate: event.startDate.slice(0, 16), // Format for datetime-local input
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
      sponsors: event.sponsors || []
    } : {
      mode: EventMode.OFFLINE,
      visibility: EventVisibility.PUBLIC,
      branding: {},
      timeline: [],
      prizes: [],
      sponsors: []
    }
  });

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
      const response = await api.get('/events/templates');
      return response.data.templates as EventTemplate[];
    },
  });

  // Fetch user's organizations (Requirements 19.1)
  const { data: organizations } = useQuery({
    queryKey: ['user-organizations'],
    queryFn: async () => {
      const response = await api.get('/organizations/my-organizations');
      return response.data.organizations as Organization[];
    },
  });

  // Create/Update event mutation
  const eventMutation = useMutation({
    mutationFn: async (data: CreateEventDTO) => {
      if (isEditing && event) {
        const response = await api.put(`/events/${event.id}`, data);
        return response.data.event;
      } else {
        const response = await api.post('/events', data);
        return response.data.event;
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
      const response = await api.post(`/events/${event.id}/generate-invite-link`);
      const newInviteLink = response.data.inviteLink;
      setInviteLink(newInviteLink);
    } catch (error) {
      console.error('Failed to generate invite link:', error);
    }
  };

  const onSubmit = (data: CreateEventDTO) => {
    eventMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditing ? 'Update your event details' : 'Set up your event with customizable settings and branding'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Template Selection (Requirements 4.1) */}
          {!isEditing && templates && templates.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose a Template (Optional)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => applyTemplate(template)}
                  >
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        {template.category}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {template.defaultMode}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
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
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Name *
                    </label>
                    <input
                      type="text"
                      {...register('name', { required: 'Event name is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter event name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      {...register('description', { required: 'Description is required' })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Describe your event"
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>

                  {/* Organization Selection (Requirements 19.1) */}
                  {organizations && organizations.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organization (Optional)
                      </label>
                      <select
                        {...register('organizationId')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select an organization</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name} {org.verificationStatus === 'VERIFIED' && '✓'}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-sm text-gray-500">
                        Publishing under an organization will display their branding on your event page
                      </p>
                    </div>
                  )}

                  {/* Event Visibility (Requirements 19.3, 19.4, 19.5) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Visibility *
                    </label>
                    <div className="space-y-3">
                      {Object.values(EventVisibility).map((visibility) => (
                        <label key={visibility} className="flex items-start">
                          <input
                            type="radio"
                            value={visibility}
                            {...register('visibility', { required: 'Event visibility is required' })}
                            className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {visibility === EventVisibility.PUBLIC && 'Public'}
                              {visibility === EventVisibility.PRIVATE && 'Private'}
                              {visibility === EventVisibility.UNLISTED && 'Unlisted'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {visibility === EventVisibility.PUBLIC && 'Anyone can find and register for this event'}
                              {visibility === EventVisibility.PRIVATE && 'Only people with invite links can access this event'}
                              {visibility === EventVisibility.UNLISTED && 'Accessible via direct link but not searchable'}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.visibility && (
                      <p className="mt-1 text-sm text-red-600">{errors.visibility.message}</p>
                    )}
                  </div>

                  {/* Private Event Invite Link (Requirements 24.1) */}
                  {watchedVisibility === EventVisibility.PRIVATE && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Private Event Access</h4>
                      {isEditing && event ? (
                        <div>
                          {inviteLink ? (
                            <div>
                              <label className="block text-sm font-medium text-blue-800 mb-2">
                                Invite Link
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={inviteLink}
                                  readOnly
                                  className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-md text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => navigator.clipboard.writeText(inviteLink)}
                                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                                >
                                  Copy
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={generateInviteLink}
                                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                              >
                                Generate New Link
                              </button>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm text-blue-800 mb-2">
                                Generate an invite link to share with specific people
                              </p>
                              <button
                                type="button"
                                onClick={generateInviteLink}
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                              >
                                Generate Invite Link
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-blue-800">
                          An invite link will be generated after creating the event
                        </p>
                      )}
                    </div>
                  )}

                  {/* Event Mode Selection (Requirements 5.2, 5.3, 5.4) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            <div className="text-center">
                              <h3 className="font-medium text-gray-900">{mode}</h3>
                              <p className="text-sm text-gray-600 mt-1">
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        {...register('startDate', { required: 'Start date is required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      {errors.startDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        {...register('endDate', { required: 'End date is required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      {errors.endDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Capacity (Optional)
                      </label>
                      <input
                        type="number"
                        min="1"
                        {...register('capacity', { min: 1 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Maximum participants"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Registration Deadline (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        {...register('registrationDeadline')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Venue Configuration (Requirements 5.2) */}
                  {(watchedMode === EventMode.OFFLINE || watchedMode === EventMode.HYBRID) && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Venue Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Venue Name *
                          </label>
                          <input
                            type="text"
                            {...register('venue.name', { 
                              required: watchedMode === EventMode.OFFLINE || watchedMode === EventMode.HYBRID ? 'Venue name is required' : false 
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter venue name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address *
                          </label>
                          <input
                            type="text"
                            {...register('venue.address', { 
                              required: watchedMode === EventMode.OFFLINE || watchedMode === EventMode.HYBRID ? 'Address is required' : false 
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Street address"
                          />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              City *
                            </label>
                            <input
                              type="text"
                              {...register('venue.city', { 
                                required: watchedMode === EventMode.OFFLINE || watchedMode === EventMode.HYBRID ? 'City is required' : false 
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              State *
                            </label>
                            <input
                              type="text"
                              {...register('venue.state', { 
                                required: watchedMode === EventMode.OFFLINE || watchedMode === EventMode.HYBRID ? 'State is required' : false 
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Country *
                            </label>
                            <input
                              type="text"
                              {...register('venue.country', { 
                                required: watchedMode === EventMode.OFFLINE || watchedMode === EventMode.HYBRID ? 'Country is required' : false 
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Postal Code
                            </label>
                            <input
                              type="text"
                              {...register('venue.postalCode')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Virtual Configuration (Requirements 5.3) */}
                  {(watchedMode === EventMode.ONLINE || watchedMode === EventMode.HYBRID) && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Virtual Meeting Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Meeting URL *
                          </label>
                          <input
                            type="url"
                            {...register('virtualLinks.meetingUrl', { 
                              required: watchedMode === EventMode.ONLINE || watchedMode === EventMode.HYBRID ? 'Meeting URL is required' : false 
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="https://zoom.us/j/..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Meeting ID
                            </label>
                            <input
                              type="text"
                              {...register('virtualLinks.meetingId')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Meeting ID"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Password
                            </label>
                            <input
                              type="text"
                              {...register('virtualLinks.password')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Meeting password"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Platform
                          </label>
                          <select
                            {...register('virtualLinks.platform')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="zoom">Zoom</option>
                            <option value="teams">Microsoft Teams</option>
                            <option value="meet">Google Meet</option>
                            <option value="webex">Webex</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Instructions
                          </label>
                          <textarea
                            {...register('virtualLinks.instructions')}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Event Branding</h3>
                    <p className="text-gray-600 mb-6">
                      Customize your event's visual appearance and branding elements.
                      {watch('organizationId') && ' Organization branding will be automatically applied.'}
                    </p>
                  </div>

                  {/* Organization Branding Preview (Requirements 19.2) */}
                  {watch('organizationId') && organizations && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Organization Branding</h4>
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
                                <p className="text-sm font-medium text-gray-900">{selectedOrg.name}</p>
                                <p className="text-sm text-gray-600">
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo URL
                      </label>
                      <input
                        type="url"
                        {...register('branding.logoUrl')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Banner URL
                      </label>
                      <input
                        type="url"
                        {...register('branding.bannerUrl')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="https://example.com/banner.jpg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Color
                      </label>
                      <input
                        type="color"
                        {...register('branding.primaryColor')}
                        className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secondary Color
                      </label>
                      <input
                        type="color"
                        {...register('branding.secondaryColor')}
                        className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom CSS (Advanced)
                    </label>
                    <textarea
                      {...register('branding.customCss')}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                      placeholder="/* Custom CSS for your event page */"
                    />
                  </div>
                </div>
              )}

              {/* Timeline & Agenda Tab (Requirements 4.3) */}
              {activeTab === 'timeline' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Event Timeline</h3>
                    <p className="text-gray-600 mb-6">
                      Define the schedule and agenda for your event.
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium text-gray-900">Timeline Items</h4>
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
                        className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm hover:bg-indigo-700"
                      >
                        Add Timeline Item
                      </button>
                    </div>

                    <div className="space-y-4">
                      {timelineFields.map((field, index) => (
                        <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-4">
                            <h5 className="text-sm font-medium text-gray-900">Timeline Item {index + 1}</h5>
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
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title *
                              </label>
                              <input
                                type="text"
                                {...register(`timeline.${index}.title`, { required: 'Title is required' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Session title"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                              </label>
                              <select
                                {...register(`timeline.${index}.type`)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                <option value="session">Session</option>
                                <option value="break">Break</option>
                                <option value="networking">Networking</option>
                                <option value="presentation">Presentation</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Time *
                              </label>
                              <input
                                type="datetime-local"
                                {...register(`timeline.${index}.startTime`, { required: 'Start time is required' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Time *
                              </label>
                              <input
                                type="datetime-local"
                                {...register(`timeline.${index}.endTime`, { required: 'End time is required' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Speaker
                              </label>
                              <input
                                type="text"
                                {...register(`timeline.${index}.speaker`)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Speaker name"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location
                              </label>
                              <input
                                type="text"
                                {...register(`timeline.${index}.location`)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Room or virtual link"
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <textarea
                              {...register(`timeline.${index}.description`)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                      <h4 className="text-md font-medium text-gray-900">Prizes</h4>
                      <button
                        type="button"
                        onClick={() => appendPrize({
                          title: '',
                          description: '',
                          value: '',
                          position: prizeFields.length + 1,
                          category: ''
                        })}
                        className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm hover:bg-indigo-700"
                      >
                        Add Prize
                      </button>
                    </div>

                    <div className="space-y-4">
                      {prizeFields.map((field, index) => (
                        <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-4">
                            <h5 className="text-sm font-medium text-gray-900">Prize {index + 1}</h5>
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
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title *
                              </label>
                              <input
                                type="text"
                                {...register(`prizes.${index}.title`, { required: 'Prize title is required' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="First Place"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Value
                              </label>
                              <input
                                type="text"
                                {...register(`prizes.${index}.value`)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="$1000"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Position
                              </label>
                              <input
                                type="number"
                                min="1"
                                {...register(`prizes.${index}.position`, { required: 'Position is required', min: 1 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description *
                            </label>
                            <textarea
                              {...register(`prizes.${index}.description`, { required: 'Prize description is required' })}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                      <h4 className="text-md font-medium text-gray-900">Sponsors</h4>
                      <button
                        type="button"
                        onClick={() => appendSponsor({
                          name: '',
                          logoUrl: '',
                          website: '',
                          tier: 'bronze',
                          description: ''
                        })}
                        className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm hover:bg-indigo-700"
                      >
                        Add Sponsor
                      </button>
                    </div>

                    <div className="space-y-4">
                      {sponsorFields.map((field, index) => (
                        <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-4">
                            <h5 className="text-sm font-medium text-gray-900">Sponsor {index + 1}</h5>
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
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name *
                              </label>
                              <input
                                type="text"
                                {...register(`sponsors.${index}.name`, { required: 'Sponsor name is required' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Company name"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Logo URL *
                              </label>
                              <input
                                type="url"
                                {...register(`sponsors.${index}.logoUrl`, { required: 'Logo URL is required' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="https://example.com/logo.png"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tier
                              </label>
                              <select
                                {...register(`sponsors.${index}.tier`)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Website
                              </label>
                              <input
                                type="url"
                                {...register(`sponsors.${index}.website`)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="https://company.com"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <textarea
                                {...register(`sponsors.${index}.description`)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
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