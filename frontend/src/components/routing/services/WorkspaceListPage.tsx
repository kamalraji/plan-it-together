import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { PageHeader } from '../PageHeader';
import { Workspace, WorkspaceStatus } from '../../../types';
import api from '../../../lib/api';

/**
 * WorkspaceListPage provides AWS-style resource list interface for workspaces.
 * Features:
 * - Table view with filtering, sorting, and search
 * - Bulk actions for workspace management
 * - Status-based filtering and organization
 * - Quick actions for common workspace operations
 */
export const WorkspaceListPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkspaceStatus | 'all'>('all');
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([]);

  // Fetch workspaces
  const { data: workspaces, isLoading, error } = useQuery({
    queryKey: ['user-workspaces'],
    queryFn: async () => {
      const response = await api.get('/workspaces/my-workspaces');
      return response.data.workspaces as Workspace[];
    },
  });

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
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <div className="text-sm font-medium text-gray-900">{workspace.name}</div>
          {workspace.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
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
        <div className="text-sm text-gray-900">
          {workspace.event ? (
            <Link 
              to={`/console/events/${workspace.event.id}`}
              className="text-blue-600 hover:text-blue-500"
            >
              {workspace.event.name}
            </Link>
          ) : (
            <span className="text-gray-400">No event</span>
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
        <div className="flex items-center text-sm text-gray-900">
          <UsersIcon className="w-4 h-4 mr-1 text-gray-400" />
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
        <div className="text-sm text-gray-900">
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
        <div className="flex items-center text-sm text-gray-900">
          <ClockIcon className="w-4 h-4 mr-1 text-gray-400" />
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
            to={`/console/workspaces/${workspace.id}`}
            className="text-blue-600 hover:text-blue-500 p-1"
            title="View workspace"
          >
            <EyeIcon className="w-4 h-4" />
          </Link>
          <Link
            to={`/console/workspaces/${workspace.id}/edit`}
            className="text-gray-600 hover:text-gray-500 p-1"
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
        </div>
      ),
    },
  ];

  const bulkActions = [
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
  ];

  const pageActions = [
    {
      label: 'Create Workspace',
      action: () => window.location.href = '/console/workspaces/create',
      variant: 'primary' as const,
    },
    {
      label: 'Import Workspace',
      action: () => console.log('Import workspace'),
      variant: 'secondary' as const,
    },
  ];

  const handleDeleteWorkspace = (workspaceId: string) => {
    if (window.confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      console.log('Delete workspace:', workspaceId);
      // Implement delete logic
    }
  };

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Workspaces</h2>
            <p className="text-gray-600 mb-4">There was an error loading your workspaces. Please try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <PageHeader
          title="Workspaces"
          subtitle={`Manage your ${filteredWorkspaces.length} workspace${filteredWorkspaces.length !== 1 ? 's' : ''}`}
          actions={pageActions}
        />

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search workspaces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as WorkspaceStatus | 'all')}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value={WorkspaceStatus.ACTIVE}>Active</option>
              <option value={WorkspaceStatus.PROVISIONING}>Provisioning</option>
              <option value={WorkspaceStatus.WINDING_DOWN}>Winding Down</option>
              <option value={WorkspaceStatus.DISSOLVED}>Dissolved</option>
            </select>
          </div>
        </div>

        {/* Workspace Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedWorkspaces(filteredWorkspaces.map(w => w.id));
                        } else {
                          setSelectedWorkspaces([]);
                        }
                      }}
                      checked={selectedWorkspaces.length === filteredWorkspaces.length && filteredWorkspaces.length > 0}
                    />
                  </th>
                  {columns.slice(0, -1).map((column) => (
                    <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column.label}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : (
                  filteredWorkspaces.map((workspace) => (
                    <tr key={workspace.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedWorkspaces.includes(workspace.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedWorkspaces([...selectedWorkspaces, workspace.id]);
                            } else {
                              setSelectedWorkspaces(selectedWorkspaces.filter(id => id !== workspace.id));
                            }
                          }}
                        />
                      </td>
                      {columns.slice(0, -1).map((column) => (
                        <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                          {column.render ? column.render(workspace[column.key as keyof Workspace] as any, workspace) : String(workspace[column.key as keyof Workspace] || '')}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {columns[columns.length - 1].render && columns[columns.length - 1].render(undefined as any, workspace)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
                    onClick={() => {
                      const selectedItems = filteredWorkspaces.filter(w => selectedWorkspaces.includes(w.id));
                      if (action.confirmationRequired) {
                        if (window.confirm(`Are you sure you want to ${action.label.toLowerCase()}?`)) {
                          action.action(selectedItems);
                          setSelectedWorkspaces([]);
                        }
                      } else {
                        action.action(selectedItems);
                        setSelectedWorkspaces([]);
                      }
                    }}
                    className="px-3 py-1 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredWorkspaces.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              🏗️
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No workspaces found' : 'No workspaces yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first workspace for event collaboration.'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <Link
                to="/console/workspaces/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Your First Workspace
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceListPage;