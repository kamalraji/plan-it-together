import React, { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { PageHeader } from '../PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useCurrentOrganization } from '@/components/organization/OrganizationContext';
import { useOrganizationEvents } from '@/hooks/useOrganization';

const workspaceCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .nonempty({ message: 'Workspace name is required' })
    .max(100, { message: 'Workspace name must be under 100 characters' }),
  eventId: z
    .string()
    .trim()
    .nonempty({ message: 'An associated event is required' }),
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

  const organizationCtx = isOrgContext ? useCurrentOrganization() : null;
  const organizationId = organizationCtx?.organization?.id as string | undefined;
  const { data: orgEvents } = useOrganizationEvents(organizationId || '', undefined);

  const [formValues, setFormValues] = useState({
    name: '',
    eventId: eventIdFromQuery,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const canManageWorkspaces =
    !isOrgContext || (user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ORGANIZER);

  const handleChange = (field: keyof typeof formValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormValues((prev) => ({ ...prev, [field]: e.target.value }));
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageWorkspaces) return;

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
      const payload = {
        name: parseResult.data.name,
        eventId: parseResult.data.eventId,
        orgSlug: isOrgContext ? orgSlugCandidate : undefined,
      };

      const response = await api.post('/workspaces', payload);
      const created = response.data?.workspace ?? response.data;

      toast({
        title: 'Workspace created',
        description: 'Your workspace has been created successfully.',
      });

      const baseWorkspacePath = isOrgContext && orgSlugCandidate
        ? `/${orgSlugCandidate}/workspaces`
        : '/dashboard/workspaces';

      if (created?.id) {
        navigate(`${baseWorkspacePath}/${created.id}`, { replace: true });
      } else {
        navigate(`${baseWorkspacePath}/list`, { replace: true });
      }
    } catch (error: any) {
      console.error('Failed to create workspace', error);
      toast({
        title: 'Failed to create workspace',
        description: error?.response?.data?.message ?? 'Please try again.',
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="workspace-name">
              Workspace name
            </label>
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
            {isOrgContext && orgEvents && orgEvents.length > 0 ? (
              <select
                id="event-id"
                value={formValues.eventId}
                onChange={handleChange('eventId')}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select an event</option>
                {orgEvents.map((event: any) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
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
            {eventIdFromQuery && !isOrgContext && (
              <p className="mt-1 text-xs text-gray-500">
                Prefilled from URL query parameter <code>eventId</code>.
              </p>
            )}
            {formErrors.eventId && (
              <p className="mt-1 text-xs text-red-600">{formErrors.eventId}</p>
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
