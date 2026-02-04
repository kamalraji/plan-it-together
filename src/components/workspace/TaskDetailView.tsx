import React, { useState } from 'react';
import { WorkspaceTask, TaskStatus, TaskPriority, TaskCategory, TeamMember, WorkspaceRoleScope } from '../../types';
import { supabase } from '@/integrations/supabase/client';
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
  comments = [],
  files = [],
  activities = [],
  onStatusChange,
  onProgressUpdate,
  onCommentAdd,
  onCommentEdit,
  onCommentDelete,
  onFileUpload,
  onFileDelete,
  onClose,
}: TaskDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'files' | 'activity'>('details');
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [progressValue, setProgressValue] = useState(task.progress);
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [isSavingRoleScope, setIsSavingRoleScope] = useState(false);
  const [roleScopeValue, setRoleScopeValue] = useState<string>(
    (task.roleScope || (task.metadata?.roleScope as WorkspaceRoleScope | undefined) || '') as string,
  );
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.NOT_STARTED:
        return 'bg-gray-100 text-gray-800';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.REVIEW_REQUIRED:
        return 'bg-yellow-100 text-yellow-800';
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case TaskStatus.BLOCKED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-gray-100 text-gray-800';
      case TaskPriority.MEDIUM:
        return 'bg-blue-100 text-blue-800';
      case TaskPriority.HIGH:
        return 'bg-orange-100 text-orange-800';
      case TaskPriority.URGENT:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && onCommentAdd) {
      onCommentAdd(task.id, newComment.trim());
      setNewComment('');
    }
  };

  const handleCommentEdit = (commentId: string, content: string) => {
    setEditingComment(commentId);
    setEditCommentContent(content);
  };

  const handleCommentEditSubmit = (commentId: string) => {
    if (editCommentContent.trim() && onCommentEdit) {
      onCommentEdit(commentId, editCommentContent.trim());
      setEditingComment(null);
      setEditCommentContent('');
    }
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
    { id: 'comments', name: 'Comments', count: comments.length },
    { id: 'files', name: 'Files', count: files.length },
    { id: 'activity', name: 'Activity', count: activities.length }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 truncate">
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
                className="ml-3 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <span className="flex items-center space-x-2">
                    <span>{tab.name}</span>
                    {tab.count !== undefined && (
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
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
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {task.description || 'No description provided.'}
                  </p>
                </div>

                {/* Task Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assignee */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Assignee</h4>
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
                          <p className="text-sm font-medium text-gray-900">
                            {task.assignee.user.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {task.assignee.role.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Unassigned</p>
                    )}
                  </div>

                  {/* Due Date */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Due Date</h4>
                    {task.dueDate ? (
                      <p className={`text-sm ${isOverdue(task) ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                        {formatDate(task.dueDate)}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">No due date set</p>
                    )}
                  </div>

                  {/* Created */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Created</h4>
                    <p className="text-sm text-gray-700">
                      {formatDate(task.createdAt)} by {task.creator.user.name}
                    </p>
                  </div>

                  {/* Last Updated */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Last Updated</h4>
                    <p className="text-sm text-gray-700">
                      {formatDate(task.updatedAt)}
                    </p>
                  </div>
                </div>

                {/* Role Space (sub workspace) */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Role Space (sub workspace)</h4>
                  <select
                    value={roleScopeValue}
                    onChange={handleRoleScopeChange}
                    disabled={isSavingRoleScope}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                    <h4 className="text-sm font-medium text-gray-900">Progress</h4>
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
                      <span className="text-sm text-gray-700 w-12">{progressValue}%</span>
                      <button
                        onClick={handleProgressUpdate}
                        className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-700 w-12">{task.progress}%</span>
                    </div>
                  )}
                </div>

                {/* Status Update */}
                {onStatusChange && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Update Status</h4>
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
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
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Dependencies</h4>
                    <p className="text-sm text-gray-700">
                      This task depends on {task.dependencies.length} other task{task.dependencies.length !== 1 ? 's' : ''}.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-4">
                {/* Add Comment Form */}
                <form onSubmit={handleCommentSubmit} className="space-y-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Comment
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No comments yet. Be the first to add one!
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm text-gray-900">
                              {comment.userName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(comment.createdAt)}
                            </span>
                            {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                              <span className="text-xs text-gray-400">(edited)</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleCommentEdit(comment.id, comment.content)}
                              className="text-xs text-indigo-600 hover:text-indigo-500"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onCommentDelete?.(comment.id)}
                              className="text-xs text-red-600 hover:text-red-500"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="mt-2">
                          {editingComment === comment.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editCommentContent}
                                onChange={(e) => setEditCommentContent(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => setEditingComment(null)}
                                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleCommentEditSubmit(comment.id)}
                                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'files' && (
              <div className="space-y-4">
                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
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
                        <span className="mt-1 block text-xs text-gray-500">
                          PNG, JPG, PDF up to 10MB
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Files List */}
                <div className="space-y-2">
                  {files.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No files attached yet.
                    </p>
                  ) : (
                    files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">
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
                {activities.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No activity yet.
                  </p>
                ) : (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {activities.map((activity, activityIdx) => (
                        <li key={activity.id}>
                          <div className="relative pb-8">
                            {activityIdx !== activities.length - 1 ? (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
                                  <span className="text-white text-xs font-medium">
                                    {activity.userName.charAt(0).toUpperCase()}
                                  </span>
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-gray-500">
                                    <span className="font-medium text-gray-900">{activity.userName}</span>{' '}
                                    {activity.description}
                                  </p>
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                  {formatDate(activity.createdAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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