import React, { useState } from 'react';
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { PageHeader } from '../PageHeader';
import { Workspace, WorkspaceStatus } from '../../../types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { ConfirmationDialog, useConfirmation } from '@/components/ui/confirmation-dialog';
import { EmptyState, SearchEmptyState } from '@/components/ui/empty-state';
import { TeamCollaboration } from '@/components/illustrations';

/**
 * WorkspaceListPage provides AWS-style resource list interface for workspaces.
 * Features:
 * - Table view with filtering, sorting, and search
 * - Bulk actions for workspace management
 * - Status-based filtering and organization
 * - Quick actions for common workspace operations
 */
export const WorkspaceListPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { confirm, dialogProps } = useConfirmation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkspaceStatus | 'all'>('all');
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([]);

  const currentPath = location.pathname;
  const orgSlugCandidate = currentPath.split('/')[1];
  const isOrgContext = !!orgSlugCandidate && orgSlugCandidate !== 'dashboard';
  const eventId = searchParams.get('eventId');

  const baseWorkspacePath = isOrgContext && orgSlugCandidate
    ? `/${orgSlugCandidate}/workspaces`
    : '/dashboard/workspaces';

  const canManageWorkspaces =
    !isOrgContext || (user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ORGANIZER);

  // Fetch workspaces from Supabase workspaces table
  const { data: workspaces, isLoading, error } = useQuery({
    queryKey: ['user-workspaces', orgSlugCandidate, eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, status, created_at, updated_at, event_id')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map to minimal Workspace-like shape for this page
      return ((data || []).map((row: any) => ({
        id: row.id,
        eventId: row.event_id,
        name: row.name,
        status: row.status as WorkspaceStatus,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        event: undefined,
        description: undefined,
        teamMembers: [],
        taskSummary: undefined,
        channels: [],
      })) as unknown) as Workspace[];
    },
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };


  // Filter workspaces based on search and status
  const filteredWorkspaces = React.useMemo(() => {
    if (!workspaces) return [];

    return workspaces.filter(workspace => {
      const matchesSearch = workspace.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           workspace.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           workspace.event?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || workspace.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [workspaces, searchTerm, statusFilter]);

  const getStatusColor = (status: WorkspaceStatus) => {
    switch (status) {
      case WorkspaceStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case WorkspaceStatus.PROVISIONING:
        return 'bg-yellow-100 text-yellow-800';
      case WorkspaceStatus.WINDING_DOWN:
        return 'bg-blue-100 text-blue-800';
      case WorkspaceStatus.DISSOLVED:
        return 'bg-muted text-foreground';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Workspace Name',
      sortable: true,
      filterable: true,
      render: (_value: string, workspace: Workspace) => (
        <div>
          <div className="text-sm font-medium text-foreground">{workspace.name}</div>
          {workspace.description && (
            <div className="text-sm text-muted-foreground truncate max-w-xs">
              {workspace.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (value: WorkspaceStatus) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'event',
      label: 'Associated Event',
      sortable: true,
      filterable: false,
        render: (_value: any, workspace: Workspace) => (
          <div className="text-sm text-foreground">
            {workspace.event ? (
              <Link 
                to={`/dashboard/eventmanagement/${workspace.event.id}`}
                className="text-blue-600 hover:text-blue-500"
              >
                {workspace.event.name}
              </Link>
          ) : (
            <span className="text-muted-foreground">No event</span>
          )}
        </div>
      ),
    },
    {
      key: 'teamMemberCount',
      label: 'Team Size',
      sortable: true,
      filterable: false,
      render: (_value: any, workspace: Workspace) => (
        <div className="flex items-center text-sm text-foreground">
          <UsersIcon className="w-4 h-4 mr-1 text-muted-foreground" />
          {workspace.teamMembers?.length || 0} members
        </div>
      ),
    },
    {
      key: 'taskCount',
      label: 'Tasks',
      sortable: true,
      filterable: false,
      render: (_value: any, workspace: Workspace) => (
        <div className="text-sm text-foreground">
          {workspace.taskSummary?.total || 0} tasks
        </div>
      ),
    },
    {
      key: 'updatedAt',
      label: 'Last Updated',
      sortable: true,
      filterable: false,
      render: (value: string) => (
        <div className="flex items-center text-sm text-foreground">
          <ClockIcon className="w-4 h-4 mr-1 text-muted-foreground" />
          {new Date(value).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      filterable: false,
      render: (_value: any, workspace: Workspace) => (
        <div className="flex items-center space-x-2">
          <Link
            to={`${baseWorkspacePath}/${workspace.id}`}
            className="text-blue-600 hover:text-blue-500 p-1"
            title="View workspace"
          >
            <EyeIcon className="w-4 h-4" />
          </Link>
          {canManageWorkspaces && (
            <>
              <Link
                to={`${baseWorkspacePath}/${workspace.id}/edit`}
                className="text-muted-foreground hover:text-muted-foreground p-1"
                title="Edit workspace"
              >
                <PencilIcon className="w-4 h-4" />
              </Link>
              <button
                onClick={() => handleDeleteWorkspace(workspace.id)}
                className="text-red-600 hover:text-red-500 p-1"
                title="Delete workspace"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const bulkActions = canManageWorkspaces
    ? [
        {
          label: 'Archive Selected',
          action: (selectedItems: Workspace[]) => {
            console.log('Archive workspaces:', selectedItems);
            // Implement bulk archive logic
          },
          icon: 'archive',
          confirmationRequired: true,
        },
        {
          label: 'Delete Selected',
          action: (selectedItems: Workspace[]) => {
            console.log('Delete workspaces:', selectedItems);
            // Implement bulk delete logic
          },
          icon: 'trash',
          confirmationRequired: true,
        },
      ]
    : [];

  const pageActions = canManageWorkspaces
    ? [
        {
          label: 'Create Workspace',
          action: () => navigate(`${baseWorkspacePath}/create${eventId ? `?eventId=${eventId}` : ''}`),
          variant: 'primary' as const,
        },
        {
          label: 'Import Workspace',
          action: () => console.log('Import workspace'),
          variant: 'secondary' as const,
        },
      ]
    : [];


  const handleDeleteWorkspace = async (workspaceId: string) => {
    const confirmed = await confirm({
      title: 'Delete Workspace',
      description: 'Are you sure you want to delete this workspace? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    console.log('Delete workspace:', workspaceId);
    // TODO: Wire to backend delete endpoint and refresh list via React Query
  };


  const hasAnyWorkspaces = (workspaces?.length || 0) > 0;


  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <PageHeader
          title="Workspaces"
          subtitle={`Manage your ${filteredWorkspaces.length} workspace${filteredWorkspaces.length !== 1 ? 's' : ''}`}
          actions={pageActions}
        />

        {/* Role-aware helper */}
        {!canManageWorkspaces && (
          <div className="mb-4 rounded-md border border-border/80 bg-muted/40 px-4 py-3 text-xs sm:text-sm text-muted-foreground">
            You can view workspaces but cannot create, edit, or delete them in this organization. Ask an organizer or admin if you need changes.
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs sm:text-sm text-destructive">
            We couldn’t load your workspaces. Please try again or contact support.
          </div>
        )}


        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search workspaces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus-visible:ring-ring focus-visible:border-primary"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as WorkspaceStatus | 'all')}
              className="border border-input rounded-md px-3 py-2 focus-visible:ring-ring focus-visible:border-primary"
            >
              <option value="all">All Statuses</option>
              <option value={WorkspaceStatus.ACTIVE}>Active</option>
              <option value={WorkspaceStatus.PROVISIONING}>Provisioning</option>
              <option value={WorkspaceStatus.WINDING_DOWN}>Winding Down</option>
              <option value={WorkspaceStatus.DISSOLVED}>Dissolved</option>
            </select>
          </div>
        </div>

        {/* Workspace Table or Empty States */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {isLoading ? (
            <div className="py-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : !hasAnyWorkspaces ? (
            <EmptyState
              illustration={<TeamCollaboration size="sm" />}
              title="No workspaces yet"
              description="Get started by creating your first workspace for event collaboration."
              action={
                canManageWorkspaces
                  ? {
                      label: 'Create Workspace',
                      onClick: () => navigate(`${baseWorkspacePath}/create${eventId ? `?eventId=${eventId}` : ''}`),
                    }
                  : undefined
              }
            />
          ) : filteredWorkspaces.length === 0 ? (
            <SearchEmptyState
              searchTerm={searchTerm}
              onClear={handleClearFilters}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <input
                        type="checkbox"
                        className="rounded border-input text-blue-600 focus-visible:ring-ring"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWorkspaces(filteredWorkspaces.map((w) => w.id));
                          } else {
                            setSelectedWorkspaces([]);
                          }
                        }}
                        checked={
                          selectedWorkspaces.length === filteredWorkspaces.length &&
                          filteredWorkspaces.length > 0
                        }
                      />
                    </th>
                    {columns.slice(0, -1).map((column) => (
                      <th
                        key={column.key}
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                      >
                        {column.label}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {filteredWorkspaces.map((workspace) => (
                    <tr key={workspace.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="rounded border-input text-blue-600 focus-visible:ring-ring"
                          checked={selectedWorkspaces.includes(workspace.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedWorkspaces([...selectedWorkspaces, workspace.id]);
                            } else {
                              setSelectedWorkspaces(
                                selectedWorkspaces.filter((id) => id !== workspace.id)
                              );
                            }
                          }}
                        />
                      </td>
                      {columns.slice(0, -1).map((column) => (
                        <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                          {column.render
                            ? column.render(
                                workspace[column.key as keyof Workspace] as any,
                                workspace
                              )
                            : String(workspace[column.key as keyof Workspace] || '')}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {columns[columns.length - 1].render &&
                          columns[columns.length - 1].render(undefined as any, workspace)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedWorkspaces.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedWorkspaces.length} workspace{selectedWorkspaces.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                {bulkActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={async () => {
                      const selectedItems = filteredWorkspaces.filter(w => selectedWorkspaces.includes(w.id));
                      if (action.confirmationRequired) {
                        const confirmed = await confirm({
                          title: action.label,
                          description: `Are you sure you want to ${action.label.toLowerCase()}?`,
                          confirmLabel: action.label,
                          variant: 'warning',
                        });
                        if (confirmed) {
                          action.action(selectedItems);
                          setSelectedWorkspaces([]);
                        }
                      } else {
                        action.action(selectedItems);
                        setSelectedWorkspaces([]);
                      }
                    }}
                    className="px-3 py-1 text-sm font-medium text-blue-700 bg-card border border-blue-300 rounded-md hover:bg-blue-50"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State - handled in table view above */}
      </div>
      <ConfirmationDialog {...dialogProps} />
    </div>
  );
};

export default WorkspaceListPage;