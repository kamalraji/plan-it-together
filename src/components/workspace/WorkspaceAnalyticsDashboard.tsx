import { useState, useEffect } from 'react';
import { Workspace, TaskPriority } from '../../types';
import { WorkspaceAnalyticsChart } from './WorkspaceAnalyticsChart';
import api from '../../lib/api';

interface WorkspaceAnalytics {
  taskMetrics: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    blockedTasks: number;
    completionRate: number;
    averageCompletionTime: number; // in days
  };
  teamMetrics: {
    totalMembers: number;
    activeMembers: number;
    taskAssignments: Array<{
      memberId: string;
      memberName: string;
      assignedTasks: number;
      completedTasks: number;
      overdueTasks: number;
      workloadScore: number;
    }>;
    collaborationScore: number;
  };
  timelineMetrics: {
    tasksCompletedOverTime: Array<{
      date: string;
      completed: number;
      cumulative: number;
    }>;
    upcomingDeadlines: Array<{
      taskId: string;
      taskTitle: string;
      dueDate: string;
      assigneeName: string;
      priority: TaskPriority;
      daysUntilDue: number;
    }>;
  };
  healthIndicators: {
    overallHealth: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
    bottlenecks: Array<{
      type: 'OVERDUE_TASKS' | 'BLOCKED_TASKS' | 'OVERLOADED_MEMBER' | 'DEPENDENCY_CHAIN';
      description: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      affectedTasks: number;
    }>;
    recommendations: Array<{
      type: string;
      message: string;
      actionable: boolean;
    }>;
  };
}

interface WorkspaceAnalyticsDashboardProps {
  workspace: Workspace;
  roleScope: string;
}

export function WorkspaceAnalyticsDashboard({ workspace, roleScope }: WorkspaceAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<WorkspaceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [workspace.id, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/workspaces/${workspace.id}/analytics`, {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          roleScope,
        },
      });

      setAnalytics(response.data.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (format: 'CSV' | 'PDF') => {
    try {
      setExportLoading(true);

      const response = await api.post(`/workspaces/${workspace.id}/analytics/export`, {
        format,
        dateRange
      }, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: format === 'PDF' ? 'application/pdf' : 'text/csv'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workspace-analytics-${workspace.name}-${Date.now()}.${format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExportLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'EXCELLENT': return 'text-green-600 bg-green-100';
      case 'GOOD': return 'text-blue-600 bg-blue-100';
      case 'WARNING': return 'text-yellow-600 bg-yellow-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HIGH': return 'text-red-600 bg-red-100';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="mt-2 text-sm text-red-800 underline hover:text-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workspace Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {workspace.name} • {workspace.event?.name}
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => handleExportReport('CSV')}
            disabled={exportLoading}
            className="inline-flex items-center px-4 py-2 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>

          <button
            onClick={() => handleExportReport('PDF')}
            disabled={exportLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-card shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Date Range Filter</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-foreground">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="mt-1 block w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-foreground">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="mt-1 block w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Workspace Health Indicator */}
      <div className="bg-card shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">Workspace Health</h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(analytics.healthIndicators.overallHealth)}`}>
            {analytics.healthIndicators.overallHealth}
          </span>
        </div>

        {analytics.healthIndicators.bottlenecks.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Identified Issues</h4>
            <div className="space-y-2">
              {analytics.healthIndicators.bottlenecks.map((bottleneck, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-md">
                  <svg className="h-5 w-5 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getSeverityColor(bottleneck.severity)}`}>
                        {bottleneck.severity}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {bottleneck.affectedTasks} tasks affected
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-1">{bottleneck.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {analytics.healthIndicators.recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Recommendations</h4>
            <div className="space-y-2">
              {analytics.healthIndicators.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-md">
                  <svg className="h-5 w-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-foreground">{rec.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">Task Completion Rate</dt>
                  <dd className="text-lg font-medium text-foreground">
                    {analytics.taskMetrics.completionRate.toFixed(1)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.196M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">Active Team Members</dt>
                  <dd className="text-lg font-medium text-foreground">
                    {analytics.teamMetrics.activeMembers} / {analytics.teamMetrics.totalMembers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">Avg. Completion Time</dt>
                  <dd className="text-lg font-medium text-foreground">
                    {analytics.taskMetrics.averageCompletionTime.toFixed(1)} days
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">Overdue Tasks</dt>
                  <dd className="text-lg font-medium text-foreground">
                    {analytics.taskMetrics.overdueTasks}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Progress Over Time */}
      <WorkspaceAnalyticsChart
        data={analytics.timelineMetrics.tasksCompletedOverTime.map(item => ({
          date: item.date,
          value: item.completed,
          label: `${item.completed} tasks completed`
        }))}
        title="Task Completion Trends"
        type="line"
        color="#4F46E5"
      />

      {/* Team Performance */}
      <div className="bg-card shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Team Performance</h3>
        <div className="space-y-4">
          {analytics.teamMetrics.taskAssignments.map((member, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-md">
              <div>
                <p className="text-sm font-medium text-foreground">{member.memberName}</p>
                <p className="text-sm text-muted-foreground">
                  {member.completedTasks} of {member.assignedTasks} tasks completed
                  {member.overdueTasks > 0 && (
                    <span className="text-red-600 ml-2">• {member.overdueTasks} overdue</span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${(member.completedTasks / member.assignedTasks) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-foreground w-12 text-right">
                  {((member.completedTasks / member.assignedTasks) * 100).toFixed(0)}%
                </span>
                <div className={`px-2 py-1 rounded text-xs font-medium ${member.workloadScore > 80 ? 'text-red-600 bg-red-100' :
                    member.workloadScore > 60 ? 'text-yellow-600 bg-yellow-100' :
                      'text-green-600 bg-green-100'
                  }`}>
                  Load: {member.workloadScore}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-card shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Upcoming Deadlines</h3>
        <div className="space-y-3">
          {analytics.timelineMetrics.upcomingDeadlines.slice(0, 10).map((deadline, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-border rounded-md">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{deadline.taskTitle}</p>
                <p className="text-sm text-muted-foreground">Assigned to {deadline.assigneeName}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${deadline.priority === 'URGENT' ? 'text-red-600 bg-red-100' :
                    deadline.priority === 'HIGH' ? 'text-orange-600 bg-orange-100' :
                      deadline.priority === 'MEDIUM' ? 'text-yellow-600 bg-yellow-100' :
                        'text-green-600 bg-green-100'
                  }`}>
                  {deadline.priority}
                </span>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {deadline.daysUntilDue === 0 ? 'Today' :
                      deadline.daysUntilDue === 1 ? 'Tomorrow' :
                        `${deadline.daysUntilDue} days`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(deadline.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}