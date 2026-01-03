import { Workspace, WorkspaceStatus } from '../../types';
import { Layers, GitBranch, ArrowLeft, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WorkspaceBreadcrumbs } from './WorkspaceBreadcrumbs';
import { WorkspaceHierarchyTree } from './WorkspaceHierarchyTree';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface WorkspaceHeaderProps {
  workspace: Workspace;
  orgSlug?: string;
  onInviteTeamMember?: () => void;
  onCreateTask?: () => void;
  onManageSettings?: () => void;
  onCreateSubWorkspace?: () => void;
}

export function WorkspaceHeader({
  workspace,
  orgSlug,
  onInviteTeamMember,
  onCreateTask,
  onManageSettings,
  onCreateSubWorkspace,
}: WorkspaceHeaderProps) {
  const eventManagementLink = orgSlug && workspace.eventId 
    ? `/${orgSlug}/eventmanagement/${workspace.eventId}` 
    : null;
  const getStatusColor = (status: WorkspaceStatus) => {
    switch (status) {
      case WorkspaceStatus.ACTIVE:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case WorkspaceStatus.PROVISIONING:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case WorkspaceStatus.WINDING_DOWN:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case WorkspaceStatus.DISSOLVED:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 sm:py-6">
          {/* Top Navigation Row */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* Back to Event Management */}
              {eventManagementLink && (
                <Link
                  to={eventManagementLink}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors shrink-0"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Event Management</span>
                  <span className="sm:hidden">Back</span>
                </Link>
              )}
              
              <div className="h-4 w-px bg-border hidden sm:block" />
              
              {/* Breadcrumbs */}
              <WorkspaceBreadcrumbs
                workspaceId={workspace.id}
                eventId={workspace.eventId}
              />
            </div>
            
            {/* Hierarchy Tree Popover */}
            {workspace.eventId && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors shrink-0"
                    title="View workspace hierarchy"
                  >
                    <GitBranch className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Hierarchy</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-80 max-h-[400px] overflow-auto p-0" 
                  align="end"
                >
                  <div className="px-3 py-2 border-b border-border">
                    <h4 className="text-sm font-medium">Workspace Hierarchy</h4>
                    <p className="text-xs text-muted-foreground">Click to navigate</p>
                  </div>
                  <WorkspaceHierarchyTree
                    eventId={workspace.eventId}
                    currentWorkspaceId={workspace.id}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Workspace Title and Status */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{workspace.name}</h1>
                <p className="text-sm text-muted-foreground mt-1">{workspace.description}</p>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  workspace.status,
                )}`}
              >
                {workspace.status.replace('_', ' ')}
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              {onCreateSubWorkspace && (
                <button
                  onClick={onCreateSubWorkspace}
                  className="inline-flex items-center px-3 py-2 border border-border text-sm leading-4 font-medium rounded-md text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Sub-Workspace
                </button>
              )}

              {onInviteTeamMember && (
                <button
                  onClick={onInviteTeamMember}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Invite Member
                </button>
              )}

              {onCreateTask && (
                <button
                  onClick={onCreateTask}
                  className="inline-flex items-center px-3 py-2 border border-border text-sm leading-4 font-medium rounded-md text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Create Task
                </button>
              )}

              {onManageSettings && (
                <button
                  onClick={onManageSettings}
                  className="inline-flex items-center px-3 py-2 border border-border text-sm leading-4 font-medium rounded-md text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Settings
                </button>
              )}
            </div>
          </div>

          {/* Event Context Card */}
          {workspace.event && (
            <div className="mt-4 bg-muted/50 rounded-xl p-4 border border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Event</p>
                    <p className="text-sm font-semibold text-foreground">{workspace.event.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Dates</p>
                    <p className="font-medium text-foreground">
                      {formatDate(workspace.event.startDate)} – {formatDate(workspace.event.endDate)}
                    </p>
                  </div>
                  {eventManagementLink && (
                    <Link
                      to={eventManagementLink}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                    >
                      Manage Event
                      <ArrowLeft className="h-3 w-3 rotate-180" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
