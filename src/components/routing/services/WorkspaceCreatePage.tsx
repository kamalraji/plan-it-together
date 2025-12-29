import React, { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { PageHeader } from '../PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentOrganization } from '@/components/organization/OrganizationContext';
import { useOrganizationEvents } from '@/hooks/useOrganization';

const workspaceCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { message: 'Workspace name must be at least 3 characters' })
    .max(60, { message: 'Workspace name must be under 60 characters' })
    .regex(/^[A-Za-z0-9 ,.\-]+$/, {
      message: 'Use only letters, numbers, spaces, and basic punctuation in the workspace name',
    }),
  eventId: z
    .string()
    .trim()
    .nonempty({ message: 'An associated event is required to keep workspaces tied to a single event' }),
});

export const WorkspaceCreatePage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const currentPath = location.pathname;
  const orgSlugCandidate = currentPath.split('/')[1];
  const isOrgContext = !!orgSlugCandidate && orgSlugCandidate !== 'dashboard';
  const eventIdFromQuery = searchParams.get('eventId') || '';

  const organization = isOrgContext ? useCurrentOrganization() : null;
  const organizationId = organization?.id as string | undefined;
  const { data: orgEvents, isLoading: orgEventsLoading } = useOrganizationEvents(organizationId || '', undefined);

  const [formValues, setFormValues] = useState({
    name: '',
    eventId: eventIdFromQuery,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const selectedEvent = isOrgContext && orgEvents
     ? (orgEvents as any[]).find((event) => event.id === formValues.eventId)
     : null;
 
   const canManageWorkspaces =
     !isOrgContext || (user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ORGANIZER);
 
   const eventCreatePath = isOrgContext && orgSlugCandidate
     ? `/${orgSlugCandidate}/eventmanagement/create`
     : '/dashboard/eventmanagement/create';

  const handleChange = (field: keyof typeof formValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormValues((prev) => ({ ...prev, [field]: e.target.value }));
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageWorkspaces || !user) return;

    const parseResult = workspaceCreateSchema.safeParse(formValues);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      parseResult.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });
      setFormErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          event_id: parseResult.data.eventId,
          name: parseResult.data.name,
          organizer_id: user.id,
        })
        .select('id')
        .maybeSingle();

      if (error) throw error;

      const createdId = data?.id as string | undefined;

      toast({
        title: 'Workspace created',
        description: 'Your workspace has been created successfully.',
      });

      const baseWorkspacePath = isOrgContext && orgSlugCandidate
        ? `/${orgSlugCandidate}/workspaces`
        : '/dashboard/workspaces';

      if (createdId) {
        navigate(`${baseWorkspacePath}/${createdId}`, { replace: true });
      } else {
        navigate(`${baseWorkspacePath}/list`, { replace: true });
      }
    } catch (error: any) {
      console.error('Failed to create workspace', error);
      toast({
        title: 'Failed to create workspace',
        description: error?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManageWorkspaces) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          <PageHeader
            title="Workspace creation restricted"
            subtitle="Only organizers and workspace admins can create workspaces in this organization."
          />
          <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-700">
            You are signed in, but your current role does not allow creating or deleting workspaces in the
            organizer console. Please contact an organizer or admin if you believe this is an error.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <PageHeader
           title={isOrgContext ? 'Create Organization Workspace' : 'Create Workspace'}
           subtitle={
             isOrgContext
               ? 'Set up a new workspace scoped to this organization and event.'
               : 'Set up a new collaboration workspace for your event team.'
           }
         />
 
         {Object.keys(formErrors).length > 0 && (
           <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
             <p className="font-semibold mb-1">Please fix the following before continuing:</p>
             <ul className="list-disc list-inside space-y-0.5">
               {Object.entries(formErrors).map(([field, message]) => (
                 <li key={field}>{message}</li>
               ))}
             </ul>
           </div>
         )}
 
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="workspace-name">
               Workspace name
             </label>
             <p className="text-xs text-gray-500 mb-2">
               Use a short, descriptive name your team will recognize (for example, 
               <span className="font-medium">"Registration ops"</span> or 
               <span className="font-medium">"Speaker coordination"</span>).
             </p>
             <input
              id="workspace-name"
              type="text"
              value={formValues.name}
              onChange={handleChange('name')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Backstage crew, Registration ops..."
            />
            {formErrors.name && (
              <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
            )}
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="event-id">
               Associated event
             </label>
             <p className="text-xs text-gray-500 mb-2">
               Every workspace belongs to a single event so tasks, team members, and reports stay in sync.
             </p>
            {isOrgContext ? (
              <>
                <select
                  id="event-id"
                  value={formValues.eventId}
                  onChange={handleChange('eventId')}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {orgEventsLoading && <option value="">Loading events…</option>}
                  {!orgEventsLoading && (!orgEvents || orgEvents.length === 0) && (
                    <option value="" disabled>
                      No events available – create an event first
                    </option>
                  )}
                  {!orgEventsLoading && orgEvents && orgEvents.length > 0 && (
                    <>
                      <option value="">Select an event</option>
                      {orgEvents.map((event: any) => (
                        <option key={event.id} value={event.id}>
                          {event.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {!orgEventsLoading && (!orgEvents || orgEvents.length === 0) && (
                  <div className="mt-2 flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <span>
                      No events found for this organization. Create an event before creating a workspace.
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(eventCreatePath)}
                      className="ml-3 inline-flex items-center rounded-md bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-amber-700"
                    >
                      Create event
                    </button>
                  </div>
                )}
              </>
            ) : (
              <input
                id="event-id"
                type="text"
                value={formValues.eventId}
                onChange={handleChange('eventId')}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Paste or confirm event ID"
              />
            )}
            {isOrgContext && selectedEvent && (
              <p className="mt-1 text-xs text-gray-600">
                {new Date(selectedEvent.start_date).toLocaleDateString()} · {selectedEvent.mode} · {selectedEvent.status}
              </p>
            )}
            {eventIdFromQuery && !isOrgContext && (
              <p className="mt-1 text-xs text-gray-500">
                Prefilled from URL query parameter <code>eventId</code>.
              </p>
            )}
            {formErrors.eventId && (
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-xs text-red-600">{formErrors.eventId}</p>
                <button
                  type="button"
                  onClick={() => navigate(eventCreatePath)}
                  className="inline-flex items-center rounded-md bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-red-700"
                >
                  Create event
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating…' : 'Create workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkspaceCreatePage;
