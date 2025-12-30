import { useState } from 'react';
import { WorkspaceTemplate } from '../../types/workspace-template';

interface WorkspaceTemplatePreviewProps {
  template: WorkspaceTemplate;
  onClose: () => void;
  onUseTemplate?: (template: WorkspaceTemplate) => void;
}

export function WorkspaceTemplatePreview({ template, onClose, onUseTemplate }: WorkspaceTemplatePreviewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'tasks' | 'channels' | 'timeline'>('overview');

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'SIMPLE':
        return 'bg-green-100 text-green-800';
      case 'MODERATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLEX':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CONFERENCE':
        return '🎤';
      case 'WORKSHOP':
        return '🛠️';
      case 'HACKATHON':
        return '💻';
      case 'NETWORKING':
        return '🤝';
      case 'COMPETITION':
        return '🏆';
      default:
        return '📋';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'roles', name: 'Team Roles', icon: '👥' },
    { id: 'tasks', name: 'Task Structure', icon: '✅' },
    { id: 'channels', name: 'Communication', icon: '💬' },
    { id: 'timeline', name: 'Timeline', icon: '📅' }
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-lg rounded-md border mx-auto">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center">
            <span className="text-3xl mr-3">{getCategoryIcon(template.category)}</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
              <div className="flex items-center space-x-4 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(template.complexity)}`}>
                  {template.complexity}
                </span>
                <span className="text-sm text-gray-500">{template.category}</span>
                <span className="text-sm text-gray-500">
                  {template.eventSizeMin}-{template.eventSizeMax} people
                </span>
                {renderStars(template.averageRating)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-6">{template.description}</p>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-96 max-h-96 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Team Structure</h4>
                  <div className="text-sm text-gray-600">
                    <p>{template.structure.roles?.length || 0} role types</p>
                    <p>{template.structure.roles?.reduce((sum, role) => sum + role.count, 0) || 0} total positions</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Task Organization</h4>
                  <div className="text-sm text-gray-600">
                    <p>{template.structure.taskCategories?.length || 0} categories</p>
                    <p>{template.structure.taskCategories?.reduce((sum, cat) => sum + cat.tasks.length, 0) || 0} total tasks</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Communication</h4>
                  <div className="text-sm text-gray-600">
                    <p>{template.structure.channels?.length || 0} channels</p>
                    <p>{template.structure.milestones?.length || 0} milestones</p>
                  </div>
                </div>
              </div>

              {template.effectiveness && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Effectiveness Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Avg. Completion Rate:</span>
                      <p className="font-medium">{template.effectiveness.avgCompletionRate || 'N/A'}%</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Team Satisfaction:</span>
                      <p className="font-medium">{template.effectiveness.avgTeamSatisfaction || 'N/A'}/5</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Success Rate:</span>
                      <p className="font-medium">{template.effectiveness.successRate || 'N/A'}%</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Times Used:</span>
                      <p className="font-medium">{template.usageCount}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-4">
              {template.structure.roles?.map((role, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{role.role.replace(/_/g, ' ')}</h4>
                    <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded">
                      {role.count} {role.count === 1 ? 'person' : 'people'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Permissions:</h5>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((permission, permIndex) => (
                        <span
                          key={permIndex}
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                        >
                          {permission.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )) || <p className="text-gray-500">No role information available.</p>}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6">
              {template.structure.taskCategories?.map((category, index) => (
                <div key={index}>
                  <h4 className="font-medium text-gray-900 mb-3">{category.category}</h4>
                  <div className="space-y-2">
                    {category.tasks.map((task, taskIndex) => (
                      <div key={taskIndex} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-800">{task.title}</h5>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className="text-xs text-gray-500">{task.estimatedHours}h</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{task.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )) || <p className="text-gray-500">No task information available.</p>}
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="space-y-4">
              {template.structure.channels?.map((channel, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">#{channel.name}</h4>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                      {channel.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{channel.description}</p>
                  <div className="text-xs text-gray-500">
                    Members: {channel.members.join(', ') || 'All team members'}
                  </div>
                </div>
              )) || <p className="text-gray-500">No channel information available.</p>}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {template.structure.milestones?.map((milestone, index) => (
                <div key={index} className="flex items-start space-x-4 border-l-2 border-indigo-200 pl-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 text-sm font-medium">{milestone.daysFromStart}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{milestone.name}</h4>
                    <p className="text-sm text-gray-600">{milestone.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Day {milestone.daysFromStart} from event start</p>
                  </div>
                </div>
              )) || <p className="text-gray-500">No timeline information available.</p>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Close
          </button>
          {onUseTemplate && (
            <button
              onClick={() => onUseTemplate(template)}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Use This Template
            </button>
          )}
        </div>
      </div>
    </div>
  );
}