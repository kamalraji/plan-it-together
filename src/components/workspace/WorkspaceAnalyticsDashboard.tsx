import { useState, useMemo } from 'react';
import { Workspace, TaskPriority } from '../../types';
import { WorkspaceAnalyticsChart } from './WorkspaceAnalyticsChart';
import { useWorkspaceAnalytics } from '@/hooks/useWorkspaceAPI';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Local analytics interface for display (different from API response)
interface LocalWorkspaceAnalytics {
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

export function WorkspaceAnalyticsDashboard({ workspace, roleScope: _roleScope }: WorkspaceAnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [exportLoading, setExportLoading] = useState(false);

  // Use the API hook instead of legacy api.get
  const { data: rawAnalytics, isLoading: loading, error: fetchError, refetch: fetchAnalytics } = useWorkspaceAnalytics(workspace.id, false);

  // Fallback to local data calculation if edge function not available
  const { data: localAnalytics } = useQuery({
    queryKey: ['workspace-local-analytics', workspace.id, dateRange],
    queryFn: async (): Promise<LocalWorkspaceAnalytics> => {
      // Fetch tasks for this workspace
      const { data: tasks } = await supabase
        .from('workspace_tasks')
        .select('*')
        .eq('workspace_id', workspace.id);

      const { data: members } = await supabase
        .from('workspace_team_members')
        .select('*, profiles:user_id(full_name, email)')
        .eq('workspace_id', workspace.id);

      const allTasks = tasks || [];
      const allMembers = members || [];

      const completedTasks = allTasks.filter(t => t.status === 'COMPLETED');
      const inProgressTasks = allTasks.filter(t => t.status === 'IN_PROGRESS');
      const overdueTasks = allTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'COMPLETED');
      const blockedTasks = allTasks.filter(t => t.status === 'BLOCKED');

      // Calculate task assignments per member
      const taskAssignments = allMembers.map(member => {
        const memberTasks = allTasks.filter(t => t.assigned_to === member.user_id);
        const completed = memberTasks.filter(t => t.status === 'COMPLETED').length;
        const overdue = memberTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'COMPLETED').length;
        
        return {
          memberId: member.user_id,
          memberName: (member.profiles as any)?.full_name || (member.profiles as any)?.email || 'Unknown',
          assignedTasks: memberTasks.length,
          completedTasks: completed,
          overdueTasks: overdue,
          workloadScore: memberTasks.length * 10 // Simple score
        };
      });

      // Generate health indicators
      const bottlenecks: LocalWorkspaceAnalytics['healthIndicators']['bottlenecks'] = [];
      if (overdueTasks.length > 0) {
        bottlenecks.push({
          type: 'OVERDUE_TASKS',
          description: `${overdueTasks.length} tasks are past their due date`,
          severity: overdueTasks.length > 5 ? 'HIGH' : overdueTasks.length > 2 ? 'MEDIUM' : 'LOW',
          affectedTasks: overdueTasks.length
        });
      }
      if (blockedTasks.length > 0) {
        bottlenecks.push({
          type: 'BLOCKED_TASKS',
          description: `${blockedTasks.length} tasks are blocked`,
          severity: blockedTasks.length > 3 ? 'HIGH' : 'MEDIUM',
          affectedTasks: blockedTasks.length
        });
      }

      const completionRate = allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0;
      let overallHealth: LocalWorkspaceAnalytics['healthIndicators']['overallHealth'] = 'GOOD';
      if (completionRate >= 80 && overdueTasks.length === 0) overallHealth = 'EXCELLENT';
      else if (completionRate < 50 || overdueTasks.length > 5) overallHealth = 'WARNING';
      else if (overdueTasks.length > 10 || blockedTasks.length > 5) overallHealth = 'CRITICAL';

      // Calculate average completion time from real data (using updated_at as proxy for completion)
      const completedWithDates = completedTasks.filter(t => t.created_at && t.updated_at);
      let avgCompletionDays = 0;
      if (completedWithDates.length > 0) {
        const totalDays = completedWithDates.reduce((sum, task) => {
          const created = new Date(task.created_at);
          const completed = new Date(task.updated_at!);
          return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        }, 0);
        avgCompletionDays = Math.round((totalDays / completedWithDates.length) * 10) / 10;
      }

      // Calculate collaboration score from real data
      const uniqueAssignees = new Set(allTasks.filter(t => t.assigned_to).map(t => t.assigned_to)).size;
      const participationRate = allMembers.length > 0 ? uniqueAssignees / allMembers.length : 0;
      const distributionScore = participationRate * 40;
      const activityScore = completionRate * 0.3;
      const realCollaborationScore = Math.round(Math.min(100, distributionScore + activityScore * 100 + (allTasks.length > 5 ? 20 : 0)));

      return {
        taskMetrics: {
          totalTasks: allTasks.length,
          completedTasks: completedTasks.length,
          inProgressTasks: inProgressTasks.length,
          overdueTasks: overdueTasks.length,
          blockedTasks: blockedTasks.length,
          completionRate,
          averageCompletionTime: avgCompletionDays
        },
        teamMetrics: {
          totalMembers: allMembers.length,
          activeMembers: allMembers.length,
          taskAssignments,
          collaborationScore: realCollaborationScore
        },
        timelineMetrics: {
          tasksCompletedOverTime: [], // Would need historical data
          upcomingDeadlines: allTasks
            .filter(t => t.due_date && new Date(t.due_date) > new Date() && t.status !== 'COMPLETED')
            .slice(0, 5)
            .map(t => ({
              taskId: t.id,
              taskTitle: t.title,
              dueDate: t.due_date!, // Non-null after filter
              assigneeName: 'Unassigned',
              priority: t.priority as TaskPriority,
              daysUntilDue: Math.ceil((new Date(t.due_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            }))
        },
        healthIndicators: {
          overallHealth,
          bottlenecks,
          recommendations: completionRate < 70 ? [{
            type: 'productivity',
            message: 'Consider redistributing tasks to improve completion rate',
            actionable: true
          }] : []
        }
      };
    },
    enabled: !!workspace.id && !rawAnalytics,
    staleTime: 5 * 60 * 1000,
  });

  // Use edge function data if available, otherwise use local calculation
  const analytics: LocalWorkspaceAnalytics | null = useMemo(() => {
    if (rawAnalytics) {
      // Map edge function response to expected format
      return {
        taskMetrics: {
          totalTasks: rawAnalytics.tasks?.total || 0,
          completedTasks: rawAnalytics.tasks?.completed || 0,
          inProgressTasks: rawAnalytics.tasks?.inProgress || 0,
          overdueTasks: rawAnalytics.tasks?.overdue || 0,
          blockedTasks: 0,
          completionRate: rawAnalytics.tasks?.completionRate || 0,
          averageCompletionTime: rawAnalytics.tasks?.avgCompletionTimeHours ? rawAnalytics.tasks.avgCompletionTimeHours / 24 : 3.5
        },
        teamMetrics: {
          totalMembers: rawAnalytics.team?.totalMembers || 0,
          activeMembers: rawAnalytics.team?.activeMembers || 0,
          taskAssignments: (rawAnalytics.team?.topPerformers || []).map(p => ({
            memberId: p.userId,
            memberName: p.name,
            assignedTasks: p.completedTasks,
            completedTasks: p.completedTasks,
            overdueTasks: 0,
            workloadScore: p.completedTasks * 10
          })),
          collaborationScore: 75
        },
        timelineMetrics: {
          tasksCompletedOverTime: [],
          upcomingDeadlines: []
        },
        healthIndicators: {
          overallHealth: rawAnalytics.health?.score >= 80 ? 'EXCELLENT' : rawAnalytics.health?.score >= 50 ? 'GOOD' : 'WARNING',
          bottlenecks: [],
          recommendations: []
        }
      };
    }
    return localAnalytics || null;
  }, [rawAnalytics, localAnalytics]);

  const error = fetchError ? (fetchError instanceof Error ? fetchError.message : 'Failed to fetch analytics') : null;

  const handleExportReport = async (format: 'CSV' | 'PDF') => {
    if (!analytics) return;
    
    try {
      setExportLoading(true);

      if (format === 'CSV') {
        // Generate CSV locally
        const csvRows = [
          ['Metric', 'Value'],
          ['Total Tasks', analytics.taskMetrics.totalTasks.toString()],
          ['Completed Tasks', analytics.taskMetrics.completedTasks.toString()],
          ['In Progress Tasks', analytics.taskMetrics.inProgressTasks.toString()],
          ['Overdue Tasks', analytics.taskMetrics.overdueTasks.toString()],
          ['Completion Rate', `${analytics.taskMetrics.completionRate.toFixed(1)}%`],
          ['Total Members', analytics.teamMetrics.totalMembers.toString()],
          ['Active Members', analytics.teamMetrics.activeMembers.toString()],
          ['Overall Health', analytics.healthIndicators.overallHealth],
        ];
        const csvContent = csvRows.map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `workspace-analytics-${workspace.name}-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({ title: 'Export successful', description: 'CSV file downloaded' });
      } else {
        // Generate PDF using jsPDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Title
        doc.setFontSize(20);
        doc.setTextColor(31, 41, 55);
        doc.text('Workspace Analytics Report', pageWidth / 2, 20, { align: 'center' });
        
        // Subtitle
        doc.setFontSize(12);
        doc.setTextColor(107, 114, 128);
        doc.text(`${workspace.name} • ${workspace.event?.name || 'N/A'}`, pageWidth / 2, 30, { align: 'center' });
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 38, { align: 'center' });
        
        // Health Status
        doc.setFontSize(14);
        doc.setTextColor(31, 41, 55);
        doc.text('Overall Health Status', 14, 55);
        doc.setFontSize(12);
        const healthColor = analytics.healthIndicators.overallHealth === 'EXCELLENT' ? [34, 197, 94] :
                           analytics.healthIndicators.overallHealth === 'GOOD' ? [59, 130, 246] :
                           analytics.healthIndicators.overallHealth === 'WARNING' ? [234, 179, 8] : [239, 68, 68];
        doc.setTextColor(healthColor[0], healthColor[1], healthColor[2]);
        doc.text(analytics.healthIndicators.overallHealth, 14, 63);
        
        // Task Metrics Table
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(14);
        doc.text('Task Metrics', 14, 80);
        
        // Use autoTable for clean table formatting
        (doc as any).autoTable({
          startY: 85,
          head: [['Metric', 'Value']],
          body: [
            ['Total Tasks', analytics.taskMetrics.totalTasks.toString()],
            ['Completed Tasks', analytics.taskMetrics.completedTasks.toString()],
            ['In Progress', analytics.taskMetrics.inProgressTasks.toString()],
            ['Overdue Tasks', analytics.taskMetrics.overdueTasks.toString()],
            ['Blocked Tasks', analytics.taskMetrics.blockedTasks.toString()],
            ['Completion Rate', `${analytics.taskMetrics.completionRate.toFixed(1)}%`],
          ],
          theme: 'striped',
          headStyles: { fillColor: [79, 70, 229] },
          margin: { left: 14, right: 14 },
        });
        
        // Team Metrics
        const teamY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.text('Team Metrics', 14, teamY);
        
        (doc as any).autoTable({
          startY: teamY + 5,
          head: [['Metric', 'Value']],
          body: [
            ['Total Members', analytics.teamMetrics.totalMembers.toString()],
            ['Active Members', analytics.teamMetrics.activeMembers.toString()],
            ['Collaboration Score', `${analytics.teamMetrics.collaborationScore}%`],
          ],
          theme: 'striped',
          headStyles: { fillColor: [79, 70, 229] },
          margin: { left: 14, right: 14 },
        });
        
        // Bottlenecks if any
        if (analytics.healthIndicators.bottlenecks.length > 0) {
          const bottleneckY = (doc as any).lastAutoTable.finalY + 15;
          doc.setFontSize(14);
          doc.text('Identified Issues', 14, bottleneckY);
          
          const bottleneckData = analytics.healthIndicators.bottlenecks.map(b => [
            b.type.replace(/_/g, ' '),
            b.description,
            b.severity,
            b.affectedTasks.toString()
          ]);
          
          (doc as any).autoTable({
            startY: bottleneckY + 5,
            head: [['Type', 'Description', 'Severity', 'Affected']],
            body: bottleneckData,
            theme: 'striped',
            headStyles: { fillColor: [239, 68, 68] },
            margin: { left: 14, right: 14 },
          });
        }
        
        // Footer
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(10);
        doc.setTextColor(156, 163, 175);
        doc.text('Generated by Workspace Analytics', pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        // Save the PDF
        doc.save(`workspace-analytics-${workspace.name}-${Date.now()}.pdf`);
        
        toast({ title: 'Export successful', description: 'PDF file downloaded' });
      }
    } catch (err) {
      toast({ 
        title: 'Export failed', 
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setExportLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'EXCELLENT': return 'text-success bg-success/20';
      case 'GOOD': return 'text-info bg-info/20';
      case 'WARNING': return 'text-warning bg-warning/20';
      case 'CRITICAL': return 'text-destructive bg-destructive/20';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'text-success bg-success/20';
      case 'MEDIUM': return 'text-warning bg-warning/20';
      case 'HIGH': return 'text-destructive bg-destructive/20';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-red-200 rounded-md p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
            <p className="mt-1 text-sm text-destructive">{error}</p>
            <button
              onClick={() => fetchAnalytics()}
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
                  <svg className="h-5 w-5 text-warning mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div key={index} className="flex items-start space-x-3 p-3 bg-info/10 rounded-md">
                  <svg className="h-5 w-5 text-info mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <span className="text-destructive ml-2">• {member.overdueTasks} overdue</span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${(member.completedTasks / member.assignedTasks) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-foreground w-12 text-right">
                  {((member.completedTasks / member.assignedTasks) * 100).toFixed(0)}%
                </span>
                <div className={`px-2 py-1 rounded text-xs font-medium ${member.workloadScore > 80 ? 'text-destructive bg-destructive/20' :
                    member.workloadScore > 60 ? 'text-warning bg-warning/20' :
                      'text-success bg-success/20'
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
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${deadline.priority === 'URGENT' ? 'text-destructive bg-destructive/20' :
                    deadline.priority === 'HIGH' ? 'text-orange-600 bg-orange-100' :
                      deadline.priority === 'MEDIUM' ? 'text-warning bg-warning/20' :
                        'text-success bg-success/20'
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