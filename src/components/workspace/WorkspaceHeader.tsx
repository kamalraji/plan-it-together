import { Workspace, WorkspaceStatus, WorkspaceType } from '../../types';
import { Layers, GitBranch, ArrowLeft, Calendar, Settings, ClipboardList, UserPlus, EllipsisVertical, Building2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WorkspaceBreadcrumbs } from './WorkspaceBreadcrumbs';
import { WorkspaceBreadcrumbsMobile } from './WorkspaceBreadcrumbsMobile';
import { WorkspaceHierarchyTree } from './WorkspaceHierarchyTree';
import { getCreateButtonLabel, canHaveChildren } from '@/lib/workspaceHierarchy';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  SimpleDropdown,
  SimpleDropdownContent,
  SimpleDropdownItem,
  SimpleDropdownTrigger,
} from '@/components/ui/simple-dropdown';

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
        return 'bg-muted text-foreground dark:bg-foreground/80 dark:text-muted-foreground/70';
      case WorkspaceStatus.ARCHIVED:
        return 'bg-muted text-muted-foreground dark:bg-foreground/80 dark:text-muted-foreground';
      default:
        return 'bg-muted text-foreground dark:bg-foreground/80 dark:text-muted-foreground/70';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get the creation button label based on workspace type
  const workspaceType = workspace.workspaceType || WorkspaceType.ROOT;
  const createButtonLabel = getCreateButtonLabel(workspaceType);
  const showCreateButton = canHaveChildren(workspaceType) && onCreateSubWorkspace;

  // Get appropriate icon for create button
  const getCreateIcon = () => {
    switch (workspaceType) {
      case WorkspaceType.ROOT:
        return Building2;
      case WorkspaceType.DEPARTMENT:
        return Users;
      default:
        return Layers;
    }
  };
  const CreateIcon = getCreateIcon();

  // Collect all available actions for mobile dropdown
  const actions = [
    onInviteTeamMember && {
      label: 'Invite Member',
      icon: UserPlus,
      action: onInviteTeamMember,
      primary: true,
    },
    onCreateTask && {
      label: 'Create Task',
      icon: ClipboardList,
      action: onCreateTask,
    },
    showCreateButton && {
      label: createButtonLabel,
      icon: CreateIcon,
      action: onCreateSubWorkspace,
    },
    onManageSettings && {
      label: 'Settings',
      icon: Settings,
      action: onManageSettings,
    },
  ].filter(Boolean) as Array<{
    label: string;
    icon: typeof UserPlus;
    action: () => void;
    primary?: boolean;
  }>;

  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="py-3 sm:py-6">
          {/* Top Navigation Row */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {/* Mobile Breadcrumbs - Collapsible dropdown */}
              <div className="xs:hidden">
                <WorkspaceBreadcrumbsMobile
                  workspaceId={workspace.id}
                  eventId={workspace.eventId}
                  orgSlug={orgSlug}
                />
              </div>
              {/* Desktop Breadcrumbs - Full path */}
              <div className="hidden xs:block min-w-0 flex-1">
                <WorkspaceBreadcrumbs
                  workspaceId={workspace.id}
                  eventId={workspace.eventId}
                  orgSlug={orgSlug}
                />
              </div>
            </div>
          </div>

          {/* Workspace Title and Status - Mobile Optimized */}
          <div className="flex items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">{workspace.name}</h1>
                {workspace.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">{workspace.description}</p>
                )}
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${getStatusColor(workspace.status)}`}
              >
                {workspace.status.replace('_', ' ')}
              </span>
            </div>

            {/* Action Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {/* Hierarchy Tree Popover */}
              {workspace.eventId && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="inline-flex items-center px-3 py-2 border border-border text-sm leading-4 font-medium rounded-md text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                      title="View workspace hierarchy"
                    >
                      <GitBranch className="w-4 h-4 mr-2" />
                      Hierarchy
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-72 sm:w-80 max-h-[400px] overflow-auto p-0" 
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

              {showCreateButton && (
                <button
                  onClick={onCreateSubWorkspace}
                  className="inline-flex items-center px-3 py-2 border border-border text-sm leading-4 font-medium rounded-md text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Create Sub-Workspace
                </button>
              )}

              {onManageSettings && (
                <button
                  onClick={onManageSettings}
                  className="inline-flex items-center px-3 py-2 border border-border text-sm leading-4 font-medium rounded-md text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </button>
              )}
            </div>

            {/* Mobile Actions Dropdown */}
            {actions.length > 0 && (
              <SimpleDropdown>
                <SimpleDropdownTrigger className="md:hidden flex items-center justify-center h-9 w-9 rounded-md border border-border bg-background hover:bg-muted transition-colors">
                  <EllipsisVertical className="h-5 w-5 text-muted-foreground" />
                  <span className="sr-only">Actions</span>
                </SimpleDropdownTrigger>
                <SimpleDropdownContent align="end" className="w-48">
                  {actions.map((action, index) => (
                    <SimpleDropdownItem
                      key={index}
                      onClick={action.action}
                      className="flex items-center gap-3 py-2.5 px-3"
                    >
                      <action.icon className={`h-4 w-4 ${action.primary ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-sm ${action.primary ? 'font-medium' : ''}`}>{action.label}</span>
                    </SimpleDropdownItem>
                  ))}
                </SimpleDropdownContent>
              </SimpleDropdown>
            )}
          </div>

          {/* Event Context Card - Mobile Optimized */}
          {workspace.event && (
            <div className="bg-muted/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Event</p>
                    <p className="text-sm font-semibold text-foreground truncate">{workspace.event.name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-muted-foreground">Dates</p>
                    <p className="text-xs sm:text-sm font-medium text-foreground">
                      {formatDate(workspace.event.startDate)} – {formatDate(workspace.event.endDate)}
                    </p>
                  </div>
                  {eventManagementLink && (
                    <Link
                      to={eventManagementLink}
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors shrink-0"
                    >
                      <span className="hidden sm:inline">Manage Event</span>
                      <span className="sm:hidden">Manage</span>
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
