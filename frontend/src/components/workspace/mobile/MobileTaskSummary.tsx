import { useQuery } from '@tanstack/react-query';
import { 
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { Workspace, WorkspaceTask } from '../../../types';
import api from '../../../lib/api';

interface MobileTaskSummaryProps {
  workspace: Workspace;
  onViewTasks: () => void;
}

export function MobileTaskSummary({ workspace, onViewTasks }: MobileTaskSummaryProps) {
  // Fetch tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['workspace-tasks', workspace.id],
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspace.id}/tasks`);
      return response.data.tasks as WorkspaceTask[];
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(t => t.status === 'COMPLETED').length || 0;
  const inProgressTasks = tasks?.filter(t => t.status === 'IN_PROGRESS').length || 0;
  const overdueTasks = tasks?.filter(t => {
    if (t.status === 'COMPLETED' || !t.dueDate) return false;
    return new Date(t.dueDate) < new Date();
  }).length || 0;
  const blockedTasks = tasks?.filter(t => t.status === 'BLOCKED').length || 0;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = [
    {
      label: 'Completed',
      value: completedTasks,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'In Progress',
      value: inProgressTasks,
      icon: ClockIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Overdue',
      value: overdueTasks,
      icon: ExclamationCircleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Blocked',
      value: blockedTasks,
      icon: ExclamationCircleIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <ClipboardDocumentListIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-base font-semibold text-gray-900">Tasks</h3>
        </div>
        <button
          onClick={onViewTasks}
          className="flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          View All
          <ChevronRightIcon className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-semibold text-gray-900">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">{completedTasks} of {totalTasks} tasks completed</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`${stat.bgColor} rounded-lg p-3`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs font-medium text-gray-600">{stat.label}</span>
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Tasks Preview */}
      {tasks && tasks.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Upcoming Tasks</h4>
          <div className="space-y-2">
            {tasks
              .filter(t => t.status !== 'COMPLETED' && t.dueDate)
              .sort((a, b) => {
                if (!a.dueDate || !b.dueDate) return 0;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
              })
              .slice(0, 3)
              .map((task) => {
                const isOverdue = task.dueDate ? new Date(task.dueDate) < new Date() : false;
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      {task.dueDate && (
                        <p className={`text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                      task.priority === 'HIGH' 
                        ? 'bg-red-100 text-red-800'
                        : task.priority === 'MEDIUM'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}