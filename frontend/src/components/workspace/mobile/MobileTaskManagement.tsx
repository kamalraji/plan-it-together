import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  UserIcon,
  CalendarIcon,
  ChevronRightIcon,
  MapPinIcon,
  PhotoIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { WorkspaceTask, TaskStatus, TaskPriority, TeamMember } from '../../../types';
import api from '../../../lib/api';

interface MobileTaskManagementProps {
  workspaceId: string;
  onCreateTask: () => void;
  onTaskClick: (task: WorkspaceTask) => void;
}

type ViewMode = 'list' | 'kanban';
type FilterStatus = 'all' | TaskStatus;
type FilterPriority = 'all' | TaskPriority;

export function MobileTaskManagement({ 
  workspaceId, 
  onCreateTask, 
  onTaskClick 
}: MobileTaskManagementProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [priorityFilter, setFilterPriority] = useState<FilterPriority>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['workspace-tasks', workspaceId],
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspaceId}/tasks`);
      return response.data.tasks as WorkspaceTask[];
    },
  });

  // Fetch team members for assignee info
  const { data: teamMembers } = useQuery({
    queryKey: ['workspace-team-members', workspaceId],
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspaceId}/team-members`);
      return response.data.teamMembers as TeamMember[];
    },
  });

  const filteredTasks = tasks?.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  }) || [];

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'IN_PROGRESS':
        return <ClockIcon className="w-4 h-4 text-blue-500" />;
      case 'BLOCKED':
        return <ExclamationCircleIcon className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'BLOCKED':
        return 'bg-red-100 text-red-800';
      case 'REVIEW_REQUIRED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssigneeName = (task: WorkspaceTask) => {
    if (task.assignee) {
      return task.assignee.user.name;
    }
    const member = teamMembers?.find(m => m.id === task.assignee?.id);
    return member?.user.name || 'Unassigned';
  };

  const isOverdue = (dueDate: string | undefined, status: TaskStatus) => {
    if (status === 'COMPLETED' || !dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const handleLocationCheckIn = async (taskId: string) => {
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          });
        });

        const { latitude, longitude } = position.coords;
        
        // Update task with location check-in
        await api.patch(`/workspaces/${workspaceId}/tasks/${taskId}/checkin`, {
          location: { latitude, longitude },
          timestamp: new Date().toISOString()
        });

        // Show success message
        alert('Location check-in successful!');
      } catch (error) {
        console.error('Location check-in failed:', error);
        alert('Failed to get location. Please ensure location services are enabled.');
      }
    } else {
      alert('Location services not supported on this device.');
    }
  };

  const handlePhotoUpload = async (taskId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('taskId', taskId);

      await api.post(`/workspaces/${workspaceId}/tasks/${taskId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Refresh task data
      // queryClient.invalidateQueries(['workspace-tasks', workspaceId]);
      alert('Photo uploaded successfully!');
    } catch (error) {
      console.error('Photo upload failed:', error);
      alert('Failed to upload photo. Please try again.');
    }
  };

  const triggerPhotoUpload = (taskId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use rear camera on mobile
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handlePhotoUpload(taskId, file);
      }
    };
    input.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
        <button
          onClick={onCreateTask}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          New Task
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filters
          </button>
          
          {/* View Mode Toggle */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-xs font-medium rounded-l-md border ${
                viewMode === 'list'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 text-xs font-medium rounded-r-md border-t border-r border-b ${
                viewMode === 'kanban'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                className="w-full text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW_REQUIRED">Review Required</option>
                <option value="COMPLETED">Completed</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
                className="w-full text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Priority</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <ClipboardDocumentListIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No tasks found</h3>
            <p className="text-xs text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first task to get started'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
              <button
                onClick={onCreateTask}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Task
              </button>
            )}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start space-x-3">
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(task.status)}
                </div>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate pr-2">
                      {task.title}
                    </h3>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                  
                  {task.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {/* Task Meta */}
                  <div className="flex items-center space-x-4 mt-3">
                    {/* Assignee */}
                    <div className="flex items-center text-xs text-gray-500">
                      <UserIcon className="w-3 h-3 mr-1" />
                      <span className="truncate">{getAssigneeName(task)}</span>
                    </div>

                    {/* Due Date */}
                    {task.dueDate && (
                      <div className={`flex items-center text-xs ${
                        isOverdue(task.dueDate, task.status) ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Status and Priority Badges */}
                  <div className="flex items-center space-x-2 mt-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ').toLowerCase()}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    {isOverdue(task.dueDate, task.status) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Overdue
                      </span>
                    )}
                  </div>

                  {/* Mobile-specific Actions */}
                  <div className="flex items-center space-x-2 mt-3">
                    {/* Location Check-in */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLocationCheckIn(task.id);
                      }}
                      className="flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-100"
                    >
                      <MapPinIcon className="w-3 h-3 mr-1" />
                      Check-in
                    </button>

                    {/* Photo Upload */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerPhotoUpload(task.id);
                      }}
                      className="flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium hover:bg-green-100"
                    >
                      <PhotoIcon className="w-3 h-3 mr-1" />
                      Photo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}