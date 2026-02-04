import { useState } from 'react';
import { WorkspaceTask, TaskCategory, TaskPriority, TeamMember } from '../../types';

interface TaskFormProps {
  task?: WorkspaceTask;
  teamMembers: TeamMember[];
  availableTasks: WorkspaceTask[];
  onSubmit: (taskData: TaskFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface TaskFormData {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
  dependencies: string[];
  tags: string[];
  templateId?: string;
}

const TASK_TEMPLATES = [
  {
    id: 'event-setup',
    name: 'Event Setup',
    category: TaskCategory.SETUP,
    priority: TaskPriority.HIGH,
    description: 'Set up event infrastructure and basic requirements',
    tags: ['setup', 'infrastructure']
  },
  {
    id: 'marketing-campaign',
    name: 'Marketing Campaign',
    category: TaskCategory.MARKETING,
    priority: TaskPriority.MEDIUM,
    description: 'Create and execute marketing campaign for the event',
    tags: ['marketing', 'promotion']
  },
  {
    id: 'venue-logistics',
    name: 'Venue Logistics',
    category: TaskCategory.LOGISTICS,
    priority: TaskPriority.HIGH,
    description: 'Coordinate venue arrangements and logistics',
    tags: ['venue', 'logistics']
  },
  {
    id: 'technical-setup',
    name: 'Technical Setup',
    category: TaskCategory.TECHNICAL,
    priority: TaskPriority.HIGH,
    description: 'Set up technical infrastructure and equipment',
    tags: ['technical', 'equipment']
  },
  {
    id: 'registration-management',
    name: 'Registration Management',
    category: TaskCategory.REGISTRATION,
    priority: TaskPriority.MEDIUM,
    description: 'Manage participant registration and communication',
    tags: ['registration', 'participants']
  }
];

export function TaskForm({ 
  task, 
  teamMembers, 
  availableTasks, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || '',
    description: task?.description || '',
    category: task?.category || TaskCategory.SETUP,
    priority: task?.priority || TaskPriority.MEDIUM,
    assigneeId: task?.assignee?.userId || '',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    dependencies: task?.dependencies || [],
    tags: task?.tags || [],
    templateId: ''
  });

  const [newTag, setNewTag] = useState('');
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>(task?.dependencies || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter out current task from available dependencies to prevent self-reference
  const availableDependencies = availableTasks.filter(t => t.id !== task?.id);

  const handleInputChange = (field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = TASK_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        templateId,
        title: template.name,
        description: template.description,
        category: template.category,
        priority: template.priority,
        tags: template.tags
      }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleDependencyToggle = (taskId: string) => {
    const newDependencies = selectedDependencies.includes(taskId)
      ? selectedDependencies.filter(id => id !== taskId)
      : [...selectedDependencies, taskId];
    
    setSelectedDependencies(newDependencies);
    setFormData(prev => ({ ...prev, dependencies: newDependencies }));
  };

  // Check for circular dependencies
  const wouldCreateCircularDependency = (taskId: string): boolean => {
    if (!task?.id) return false;
    
    const checkCircular = (currentTaskId: string, targetTaskId: string, visited: Set<string>): boolean => {
      if (visited.has(currentTaskId)) return true;
      if (currentTaskId === targetTaskId) return true;
      
      visited.add(currentTaskId);
      const currentTask = availableTasks.find(t => t.id === currentTaskId);
      if (!currentTask) return false;
      
      return currentTask.dependencies.some(depId => 
        checkCircular(depId, targetTaskId, new Set(visited))
      );
    };
    
    return checkCircular(taskId, task.id, new Set());
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {task ? 'Edit Task' : 'Create New Task'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Template Selection (only for new tasks) */}
        {!task && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start from Template (Optional)
            </label>
            <select
              value={formData.templateId}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a template...</option>
              {TASK_TEMPLATES.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.title ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
            }`}
            placeholder="Enter task title"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.description ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
            }`}
            placeholder="Describe the task in detail"
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        {/* Category and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value as TaskCategory)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {Object.values(TaskCategory).map(category => (
                <option key={category} value={category}>
                  {category.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value as TaskPriority)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {Object.values(TaskPriority).map(priority => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Assignee and Due Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">
              Assignee
            </label>
            <select
              id="assignee"
              value={formData.assigneeId}
              onChange={(e) => handleInputChange('assigneeId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Unassigned</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.userId}>
                  {member.user.name} ({member.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.dueDate ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
              }`}
            />
            {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>}
          </div>
        </div>

        {/* Dependencies */}
        {availableDependencies.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dependencies
            </label>
            <div className="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
              {availableDependencies.map(availableTask => {
                const wouldCreateCircular = wouldCreateCircularDependency(availableTask.id);
                return (
                  <label
                    key={availableTask.id}
                    className={`flex items-center space-x-2 py-1 ${
                      wouldCreateCircular ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDependencies.includes(availableTask.id)}
                      onChange={() => !wouldCreateCircular && handleDependencyToggle(availableTask.id)}
                      disabled={wouldCreateCircular}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">
                      {availableTask.title}
                      {wouldCreateCircular && (
                        <span className="text-xs text-red-500 ml-1">(would create circular dependency)</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-indigo-600 hover:text-indigo-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Add a tag"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Add
            </button>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
          </button>
        </div>
      </form>
    </div>
  );
}