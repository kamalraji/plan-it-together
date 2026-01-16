import React, { useState } from 'react';
import { WorkspaceTask, TaskStatus, TaskPriority, TaskCategory, TeamMember, WorkspaceRoleScope } from '../../types';
import { supabase } from '@/integrations/supabase/client';
import { TaskCommentsPanel, TaskActivityFeed } from './comments';

interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

interface TaskFile {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

interface TaskActivity {
  id: string;
  type: 'status_change' | 'assignment' | 'comment' | 'file_upload' | 'progress_update';
  userId: string;
  userName: string;
  description: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface TaskDetailViewProps {
  task: WorkspaceTask;
  teamMembers: TeamMember[];
  comments?: TaskComment[];
  files?: TaskFile[];
  activities?: TaskActivity[];
  onTaskUpdate?: (taskId: string, updates: Partial<WorkspaceTask>) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onProgressUpdate?: (taskId: string, progress: number) => void;
  onCommentAdd?: (taskId: string, content: string) => void;
  onCommentEdit?: (commentId: string, content: string) => void;
  onCommentDelete?: (commentId: string) => void;
  onFileUpload?: (taskId: string, files: FileList) => void;
  onFileDelete?: (fileId: string) => void;
  onClose?: () => void;
  isLoading?: boolean;
}

export function TaskDetailView({
  task,
  teamMembers,
  files = [],
  onStatusChange,
  onProgressUpdate,
  onFileUpload,
  onFileDelete,
  onClose,
}: TaskDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'files' | 'activity'>('details');
  const [progressValue, setProgressValue] = useState(task.progress);
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [isSavingRoleScope, setIsSavingRoleScope] = useState(false);
  const [roleScopeValue, setRoleScopeValue] = useState<string>(
    (task.roleScope || (task.metadata?.roleScope as WorkspaceRoleScope | undefined) || '') as string,
  );
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.NOT_STARTED:
        return 'bg-muted text-foreground';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.REVIEW_REQUIRED:
        return 'bg-yellow-100 text-yellow-800';
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case TaskStatus.BLOCKED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-muted text-foreground';
      case TaskPriority.MEDIUM:
        return 'bg-blue-100 text-blue-800';
      case TaskPriority.HIGH:
        return 'bg-orange-100 text-orange-800';
      case TaskPriority.URGENT:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getCategoryColor = (category: TaskCategory) => {
    switch (category) {
      case TaskCategory.SETUP:
        return 'bg-purple-100 text-purple-800';
      case TaskCategory.MARKETING:
        return 'bg-pink-100 text-pink-800';
      case TaskCategory.LOGISTICS:
        return 'bg-blue-100 text-blue-800';
      case TaskCategory.TECHNICAL:
        return 'bg-green-100 text-green-800';
      case TaskCategory.REGISTRATION:
        return 'bg-yellow-100 text-yellow-800';
      case TaskCategory.POST_EVENT:
        return 'bg-muted text-foreground';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const isOverdue = (task: WorkspaceTask) => {
    if (!task.dueDate || task.status === TaskStatus.COMPLETED) return false;
    return new Date(task.dueDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleProgressUpdate = () => {
    if (onProgressUpdate && progressValue !== task.progress) {
      onProgressUpdate(task.id, progressValue);
    }
    setIsEditingProgress(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onFileUpload) {
      onFileUpload(task.id, e.target.files);
      e.target.value = ''; // Reset file input
    }
  };

  const handleRoleScopeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as WorkspaceRoleScope | '';
    setRoleScopeValue(value || '');
    setIsSavingRoleScope(true);

    const { error } = await supabase
      .from('workspace_tasks')
      .update({ role_scope: value || null })
      .eq('id', task.id);

    if (error) {
      console.error('Failed to update task role scope', error);
    }

    setIsSavingRoleScope(false);
  };
  const tabs = [
    { id: 'details', name: 'Details' },
    { id: 'comments', name: 'Comments' },
    { id: 'files', name: 'Files', count: files.length },
    { id: 'activity', name: 'Activity' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-muted-foreground/30 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-card rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-foreground truncate">
                  {task.title}
                </h3>
                <div className="flex items-center space-x-3 mt-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(task.category)}`}>
                    {task.category.replace('_', ' ')}
                  </span>
                  {isOverdue(task) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Overdue
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="ml-3 text-muted-foreground hover:text-muted-foreground"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-input'
                    }`}
                >
                  <span className="flex items-center space-x-2">
                    <span>{tab.name}</span>
                    {tab.count !== undefined && (
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-muted text-muted-foreground'
                        }`}>
                        {tab.count}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="px-6 py-6 max-h-96 overflow-y-auto">
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Description</h4>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {task.description || 'No description provided.'}
                  </p>
                </div>

                {/* Task Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assignee */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Assignee</h4>
                    {task.assignee ? (
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {task.assignee.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-foreground">
                            {task.assignee.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {task.assignee.role.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Unassigned</p>
                    )}
                  </div>

                  {/* Due Date */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Due Date</h4>
                    {task.dueDate ? (
                      <p className={`text-sm ${isOverdue(task) ? 'text-red-600 font-medium' : 'text-foreground'}`}>
                        {formatDate(task.dueDate)}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No due date set</p>
                    )}
                  </div>

                  {/* Created */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Created</h4>
                    <p className="text-sm text-foreground">
                      {formatDate(task.createdAt)} by {task.creator.user.name}
                    </p>
                  </div>

                  {/* Last Updated */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Last Updated</h4>
                    <p className="text-sm text-foreground">
                      {formatDate(task.updatedAt)}
                    </p>
                  </div>
                </div>

                {/* Role Space (sub workspace) */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Role Space (sub workspace)</h4>
                  <select
                    value={roleScopeValue}
                    onChange={handleRoleScopeChange}
                    disabled={isSavingRoleScope}
                    className="block w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring focus-visible:border-primary"
                  >
                    <option value="">All teams (no specific role)</option>
                    {Array.from(new Set(teamMembers.map((m) => m.role))).map((role) => (
                      <option key={role} value={role}>
                        {role.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-foreground">Progress</h4>
                    <button
                      onClick={() => setIsEditingProgress(!isEditingProgress)}
                      className="text-xs text-indigo-600 hover:text-indigo-500"
                    >
                      {isEditingProgress ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                  {isEditingProgress ? (
                    <div className="flex items-center space-x-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={progressValue}
                        onChange={(e) => setProgressValue(parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm text-foreground w-12">{progressValue}%</span>
                      <button
                        onClick={handleProgressUpdate}
                        className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-foreground w-12">{task.progress}%</span>
                    </div>
                  )}
                </div>

                {/* Status Update */}
                {onStatusChange && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Update Status</h4>
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                      className="block w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring focus-visible:border-primary"
                    >
                      {Object.values(TaskStatus).map(status => (
                        <option key={status} value={status}>
                          {status.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Tags */}
                {task.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dependencies */}
                {task.dependencies.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Dependencies</h4>
                    <p className="text-sm text-foreground">
                      This task depends on {task.dependencies.length} other task{task.dependencies.length !== 1 ? 's' : ''}.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-4">
                <TaskCommentsPanel 
                  taskId={task.id} 
                  teamMembers={teamMembers.map(m => ({
                    id: m.user?.id || m.id || '',
                    full_name: m.user?.name || 'Unknown',
                    avatar_url: undefined
                  }))} 
                />
              </div>
            )}

            {activeTab === 'files' && (
              <div className="space-y-4">
                {/* File Upload */}
                <div className="border-2 border-dashed border-input rounded-lg p-6">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-muted-foreground" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-foreground">
                          Upload files
                        </span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          multiple
                          className="sr-only"
                          onChange={handleFileUpload}
                        />
                        <span className="mt-1 block text-xs text-muted-foreground">
                          PNG, JPG, PDF up to 10MB
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Files List */}
                <div className="space-y-2">
                  {files.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No files attached yet.
                    </p>
                  ) : (
                    files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-foreground">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)} • Uploaded by {file.uploadedBy} on {formatDate(file.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-500 text-sm"
                          >
                            Download
                          </a>
                          <button
                            onClick={() => onFileDelete?.(file.id)}
                            className="text-red-600 hover:text-red-500 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <TaskActivityFeed taskId={task.id} />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-muted/50">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-input rounded-md text-sm font-medium text-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus-visible:ring-ring"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}