import { useState } from 'react';
import { LibraryTemplate } from './WorkspaceTemplateLibrary';

interface WorkspaceTemplatePreviewProps {
  template: LibraryTemplate;
  onClose: () => void;
  onUseTemplate?: (template: LibraryTemplate) => void;
}

export function WorkspaceTemplatePreview({ template, onClose, onUseTemplate }: WorkspaceTemplatePreviewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'tasks' | 'channels' | 'timeline'>('overview');

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'SIMPLE':
        return 'bg-success/20 text-success';
      case 'MODERATE':
        return 'bg-warning/20 text-yellow-800';
      case 'COMPLEX':
        return 'bg-destructive/20 text-red-800';
      default:
        return 'bg-muted text-foreground';
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
              star <= rating ? 'text-yellow-400' : 'text-muted-foreground/70'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-muted-foreground">({rating.toFixed(1)})</span>
      </div>
    );
  };

  // Note: getPriorityColor can be re-enabled when task details are available
  // const getPriorityColor = (priority: string) => {
  //   switch (priority.toLowerCase()) {
  //     case 'high':
  //     case 'urgent':
  //       return 'bg-destructive/20 text-red-800';
  //     case 'medium':
  //       return 'bg-warning/20 text-yellow-800';
  //     case 'low':
  //       return 'bg-success/20 text-success';
  //     default:
  //       return 'bg-muted text-foreground';
  //   }
  // };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'roles', name: 'Team Roles', icon: '👥' },
    { id: 'tasks', name: 'Task Structure', icon: '✅' },
    { id: 'channels', name: 'Communication', icon: '💬' },
    { id: 'timeline', name: 'Timeline', icon: '📅' }
  ];

  return (
    <div className="fixed inset-0 bg-muted-foreground/40 bg-opacity-50 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-card w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-lg rounded-md border mx-auto">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center">
            <span className="text-3xl mr-3">{getCategoryIcon(template.category)}</span>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{template.name}</h2>
              <div className="flex items-center space-x-4 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(template.complexity)}`}>
                  {template.complexity}
                </span>
                <span className="text-sm text-muted-foreground">{template.category}</span>
                <span className="text-sm text-muted-foreground">
                  {template.event_size_min}-{template.event_size_max} people
                </span>
                {renderStars(template.average_rating)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-muted-foreground"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="text-muted-foreground mb-6">{template.description}</p>

        {/* Tabs */}
        <div className="border-b border-border mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-input'
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
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">Team Structure</h4>
                  <div className="text-sm text-muted-foreground">
                    <p>{template.structure?.roles?.length || 0} role types</p>
                    <p>Multiple positions available</p>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">Task Organization</h4>
                  <div className="text-sm text-muted-foreground">
                    <p>{template.structure?.taskCategories?.length || 0} categories</p>
                    <p>Pre-defined task structure</p>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">Communication</h4>
                  <div className="text-sm text-muted-foreground">
                    <p>{template.structure?.channels?.length || 0} channels</p>
                    <p>Team collaboration ready</p>
                  </div>
                </div>
              </div>

              <div className="bg-info/10 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">Usage Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Times Used:</span>
                    <p className="font-medium">{template.usage_count}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Average Rating:</span>
                    <p className="font-medium">{template.average_rating.toFixed(1)}/5</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Team Size:</span>
                    <p className="font-medium">{template.event_size_min}-{template.event_size_max}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Complexity:</span>
                    <p className="font-medium">{template.complexity}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-4">
              {template.structure?.roles?.length ? (
                template.structure.roles.map((role, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-foreground">{role.replace(/_/g, ' ')}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">Team member role for workspace organization</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No role information available.</p>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6">
              {template.structure?.taskCategories?.length ? (
                template.structure.taskCategories.map((category, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-2">{category}</h4>
                    <p className="text-sm text-muted-foreground">Pre-defined task category for event organization</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No task information available.</p>
              )}
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="space-y-4">
              {template.structure?.channels?.length ? (
                template.structure.channels.map((channel, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <h4 className="font-medium text-foreground">#{channel}</h4>
                    <p className="text-sm text-muted-foreground mt-1">Communication channel for team collaboration</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No channel information available.</p>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <p className="text-muted-foreground">Timeline milestones will be created based on your event dates when you apply this template.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-input rounded-md text-sm font-medium text-foreground bg-card hover:bg-muted/50"
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