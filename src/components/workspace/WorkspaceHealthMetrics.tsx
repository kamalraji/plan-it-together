import React from 'react';
import { Workspace, WorkspaceStatus } from '../../types';

interface WorkspaceHealthMetricsProps {
  workspace: Workspace;
}

export function WorkspaceHealthMetrics({ workspace }: WorkspaceHealthMetricsProps) {
  const taskSummary = workspace.taskSummary || {
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0
  };

  // Calculate health metrics
  const completionRate = taskSummary.total > 0
    ? Math.round((taskSummary.completed / taskSummary.total) * 100)
    : 0;

  const overdueRate = taskSummary.total > 0
    ? Math.round((taskSummary.overdue / taskSummary.total) * 100)
    : 0;

  const teamSize = workspace.teamMembers?.length || 0;
  const activeChannels = workspace.channels?.length || 0;

  // Determine overall health status
  const getHealthStatus = () => {
    if (overdueRate > 20) return { status: 'critical', color: 'text-destructive', bgColor: 'bg-destructive/10' };
    if (overdueRate > 10 || completionRate < 50) return { status: 'warning', color: 'text-warning', bgColor: 'bg-warning/10' };
    if (completionRate > 80) return { status: 'excellent', color: 'text-success', bgColor: 'bg-success/10' };
    return { status: 'good', color: 'text-info', bgColor: 'bg-info/10' };
  };

  const healthStatus = getHealthStatus();

  const getWorkspaceStatusInfo = () => {
    switch (workspace.status) {
      case WorkspaceStatus.ACTIVE:
        return { text: 'Active & Collaborative', color: 'text-success' };
      case WorkspaceStatus.PROVISIONING:
        return { text: 'Setting Up', color: 'text-warning' };
      case WorkspaceStatus.WINDING_DOWN:
        return { text: 'Wrapping Up', color: 'text-orange-600' };
      case WorkspaceStatus.DISSOLVED:
        return { text: 'Completed', color: 'text-muted-foreground' };
      default:
        return { text: 'Unknown', color: 'text-muted-foreground' };
    }
  };

  const statusInfo = getWorkspaceStatusInfo();

  const metrics = [
    {
      label: 'Task Completion',
      value: `${completionRate}%`,
      trend: completionRate > 70 ? 'up' : completionRate < 30 ? 'down' : 'stable',
      color: completionRate > 70 ? 'text-success' : completionRate < 30 ? 'text-destructive' : 'text-warning'
    },
    {
      label: 'Team Members',
      value: teamSize.toString(),
      trend: 'stable',
      color: 'text-info'
    },
    {
      label: 'Active Channels',
      value: activeChannels.toString(),
      trend: 'stable',
      color: 'text-primary'
    },
    {
      label: 'Overdue Tasks',
      value: taskSummary.overdue.toString(),
      trend: taskSummary.overdue > 0 ? 'down' : 'stable',
      color: taskSummary.overdue > 0 ? 'text-destructive' : 'text-success'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
    }
  };

  return (
    <React.Fragment>
      <div className="bg-card overflow-hidden shadow rounded-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-foreground">Workspace Health</h3>
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${healthStatus.bgColor} ${healthStatus.color}`}>
              {healthStatus.status.charAt(0).toUpperCase() + healthStatus.status.slice(1)}
            </div>
          </div>

          {/* Overall Status */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Workspace Status</p>
                <p className={`text-lg font-semibold ${statusInfo.color}`}>
                  {statusInfo.text}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Since</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(workspace.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="space-y-4">
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getTrendIcon(metric.trend)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{metric.label}</p>
                  </div>
                </div>
                <div className={`text-lg font-semibold ${metric.color}`}>
                  {metric.value}
                </div>
              </div>
            ))}
          </div>

          {/* Health Indicators */}
          {taskSummary.total > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="text-sm font-medium text-foreground mb-4">Health Indicators</h4>
              <div className="space-y-3">
                {/* Completion Progress */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Task Completion</span>
                    <span>{completionRate}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${completionRate > 70 ? 'bg-success' :
                          completionRate > 40 ? 'bg-warning' : 'bg-destructive'
                        }`}
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>

                {/* Overdue Alert */}
                {taskSummary.overdue > 0 && (
                  <div className="flex items-center space-x-2 p-3 bg-destructive/10 rounded-lg">
                    <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        {taskSummary.overdue} overdue task{taskSummary.overdue !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-destructive">Requires immediate attention</p>
                    </div>
                  </div>
                )}

                {/* Team Activity */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Team Activity</span>
                  <span className="font-medium text-foreground">
                    {teamSize} member{teamSize !== 1 ? 's' : ''} active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {taskSummary.total === 0 && (
            <div className="mt-6 pt-6 border-t border-border text-center">
              <svg className="mx-auto h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-2 text-sm text-muted-foreground">No tasks yet</p>
              <p className="text-xs text-muted-foreground">Create tasks to see health metrics</p>
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
}