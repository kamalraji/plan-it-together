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
      const value = e.target.value;
      setFormValues((prev) => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: '' }));
      }
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
      // Check if a root workspace already exists for this event
      const { data: existingRoot, error: checkError } = await supabase
        .from('workspaces')
        .select('id, name')
        .eq('event_id', parseResult.data.eventId)
        .is('parent_workspace_id', null)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingRoot) {
        setFormErrors({
          eventId: `This event already has a root workspace "${existingRoot.name}". Each event can only have one root workspace.`,
        });
        setSubmitting(false);
        return;
      }

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
          <div className="mt-6 rounded-lg border border-dashed border-border bg-muted p-6 text-sm text-muted-foreground">
            You are signed in, but your current role does not allow creating or deleting workspaces in the
            organizer console. Please contact an organizer or admin if you believe this is an error.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title={isOrgContext ? 'Create Organization Workspace' : 'Create Workspace'}
          subtitle={
            isOrgContext
              ? 'Set up a new workspace scoped to this organization and event.'
              : 'Set up a new collaboration workspace for your event team.'
          }
        />

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Workspace Name Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1" htmlFor="workspace-name">
              Workspace name <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Use a short, descriptive name your team will recognize (e.g., "Registration ops" or "Speaker coordination").
            </p>
            <input
              id="workspace-name"
              type="text"
              value={formValues.name}
              onChange={handleChange('name')}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              placeholder="Backstage crew, Registration ops..."
            />
            {formErrors.name && (
              <p className="mt-1 text-xs text-destructive">{formErrors.name}</p>
            )}
          </div>

          {/* Event Selection Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1" htmlFor="event-id">
              Associated event <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Every workspace belongs to a single event so tasks, team members, and reports stay in sync.
            </p>
            {isOrgContext ? (
              <>
                <select
                  id="event-id"
                  value={formValues.eventId}
                  onChange={handleChange('eventId')}
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
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
                  <div className="mt-2 flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
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
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                placeholder="Paste or confirm event ID"
              />
            )}
            {isOrgContext && selectedEvent && (
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(selectedEvent.start_date).toLocaleDateString()} · {selectedEvent.mode} · {selectedEvent.status}
              </p>
            )}
            {eventIdFromQuery && !isOrgContext && (
              <p className="mt-1 text-xs text-muted-foreground">
                Prefilled from URL query parameter <code className="bg-muted px-1 rounded">eventId</code>.
              </p>
            )}
            {formErrors.eventId && (
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-xs text-destructive">{formErrors.eventId}</p>
                <button
                  type="button"
                  onClick={() => navigate(eventCreatePath)}
                  className="inline-flex items-center rounded-md bg-destructive px-2.5 py-1 text-[11px] font-semibold text-destructive-foreground shadow-sm hover:bg-destructive/90"
                >
                  Create event
                </button>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-foreground">
            <p className="font-semibold mb-1">Next: manage your team and tasks</p>
            <p className="text-muted-foreground">
              Once this workspace is created, you can invite collaborators, assign roles, and track tasks
              directly from the workspace dashboard.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
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
