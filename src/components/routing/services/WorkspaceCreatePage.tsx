import React, { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { PageHeader } from '../PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, WorkspaceRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useCurrentOrganization } from '@/components/organization/OrganizationContext';
import { useOrganizationEvents } from '@/hooks/useOrganization';
import { getWorkspaceRoleLabel } from '@/lib/workspaceHierarchy';
import { ENHANCED_WORKSPACE_TEMPLATES, EnhancedWorkspaceTemplate } from '@/lib/workspaceTemplates';
import { WorkspaceTemplateSelector } from '@/components/workspace/WorkspaceTemplateSelector';
import { useWorkspaceProvisioning } from '@/hooks/useWorkspaceProvisioning';
import { Shield, Layers } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

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
  const [selectedTemplate, setSelectedTemplate] = useState<EnhancedWorkspaceTemplate>(ENHANCED_WORKSPACE_TEMPLATES[0]);
  const [templateSectionOpen, setTemplateSectionOpen] = useState(true);

  const { provisionWorkspaceAsync, isPending } = useWorkspaceProvisioning();

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

    try {
      const result = await provisionWorkspaceAsync({
        name: parseResult.data.name,
        eventId: parseResult.data.eventId,
        userId: user.id,
        template: selectedTemplate,
        organizationId,
      });

      toast({
        title: 'Workspace created',
        description: selectedTemplate.id !== 'blank'
          ? `Created with "${selectedTemplate.name}" template. ${result.departments.length} departments, ${result.committees.length} committees.`
          : 'Your workspace has been created successfully. You are now the Workspace Owner.',
      });

      const baseWorkspacePath = isOrgContext && orgSlugCandidate
        ? `/${orgSlugCandidate}/workspaces`
        : '/dashboard/workspaces';

      navigate(`${baseWorkspacePath}/${result.rootWorkspace.id}`, { replace: true });
    } catch (error: any) {
      console.error('Failed to create workspace', error);
      if (error?.message?.includes('already has a root workspace')) {
        setFormErrors({
          eventId: error.message,
        });
      } else {
        toast({
          title: 'Failed to create workspace',
          description: error?.message ?? 'Please try again.',
          variant: 'destructive',
        });
      }
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
      <div className="max-w-3xl mx-auto">
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
            <Label htmlFor="workspace-name" className="text-sm font-medium">
              Workspace name <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Use a short, descriptive name your team will recognize (e.g., "Tech Conference 2026" or "Annual Gala").
            </p>
            <input
              id="workspace-name"
              type="text"
              value={formValues.name}
              onChange={handleChange('name')}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              placeholder="Tech Conference 2026, Annual Fundraiser..."
            />
            {formErrors.name && (
              <p className="mt-1 text-xs text-destructive">{formErrors.name}</p>
            )}
          </div>

          {/* Event Selection Field */}
          <div>
            <Label htmlFor="event-id" className="text-sm font-medium">
              Associated event <span className="text-destructive">*</span>
            </Label>
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(eventCreatePath)}
                      className="ml-3 h-7 text-xs"
                    >
                      Create event
                    </Button>
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
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => navigate(eventCreatePath)}
                  className="h-7 text-xs"
                >
                  Create event
                </Button>
              </div>
            )}
          </div>

          {/* Template Selection Section */}
          <Collapsible open={templateSectionOpen} onOpenChange={setTemplateSectionOpen}>
            <div className="rounded-lg border border-border bg-card">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors rounded-t-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Layers className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Workspace Template</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedTemplate.id === 'blank'
                          ? 'Starting from scratch'
                          : `${selectedTemplate.name} - ${selectedTemplate.structure.departments.length} departments`}
                      </p>
                    </div>
                  </div>
                  {templateSectionOpen ? (
                    <ChevronUpIcon className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border px-4 py-4">
                  <p className="text-xs text-muted-foreground mb-4">
                    Choose a template to automatically create departments, committees, tasks, and milestones. 
                    You can customize everything after creation.
                  </p>
                  <WorkspaceTemplateSelector
                    selectedTemplate={selectedTemplate}
                    onSelectTemplate={setSelectedTemplate}
                    isApplying={isPending}
                  />
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Role Assignment Preview */}
          <div className="rounded-md border border-border bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Your Role Assignment</span>
            </div>
            <p className="text-xs text-muted-foreground">
              As the creator of this root workspace, you will be assigned the{' '}
              <span className="font-semibold text-foreground">{getWorkspaceRoleLabel(WorkspaceRole.WORKSPACE_OWNER)}</span>{' '}
              role with full control over the workspace hierarchy.
            </p>
          </div>

          {/* Info Card */}
          <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-foreground">
            <p className="font-semibold mb-1">What happens next?</p>
            <p className="text-muted-foreground">
              {selectedTemplate.id === 'blank'
                ? 'After creation, you can manually add departments, committees, and invite team members from the workspace dashboard.'
                : `We'll automatically create ${selectedTemplate.structure.departments.length} departments, their committees, ${selectedTemplate.structure.tasks.length} starter tasks, and ${selectedTemplate.structure.milestones.length} milestones. You can then invite team members and customize everything.`}
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending ? 'Creating workspace…' : 'Create workspace'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkspaceCreatePage;