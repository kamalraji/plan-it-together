import { useState, useEffect } from 'react';
import { Workspace, UserRole, WorkspaceRole, TeamMember } from '../../types';
import api from '../../lib/api';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  defaultFormat: 'CSV' | 'PDF';
}

interface ReportGenerationOptions {
  templateId: string;
  format: 'CSV' | 'PDF';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  includeSections: string[];
  includeCharts: boolean;
  includeRawData: boolean;
}

interface WorkspaceReportExportProps {
  workspace: Workspace;
  teamMembers?: TeamMember[];
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'comprehensive',
    name: 'Comprehensive Workspace Report',
    description: 'Complete overview including task metrics, team performance, timeline analysis, and health indicators',
    sections: ['task_metrics', 'team_performance', 'timeline_analysis', 'health_indicators', 'recommendations'],
    defaultFormat: 'PDF'
  },
  {
    id: 'task_summary',
    name: 'Task Summary Report',
    description: 'Focused report on task completion, progress, and deadlines',
    sections: ['task_metrics', 'timeline_analysis', 'upcoming_deadlines'],
    defaultFormat: 'CSV'
  },
  {
    id: 'team_performance',
    name: 'Team Performance Report',
    description: 'Detailed analysis of team member contributions and workload distribution',
    sections: ['team_performance', 'collaboration_metrics', 'workload_analysis'],
    defaultFormat: 'PDF'
  },
  {
    id: 'executive_summary',
    name: 'Executive Summary',
    description: 'High-level overview for stakeholders and management',
    sections: ['key_metrics', 'health_indicators', 'recommendations'],
    defaultFormat: 'PDF'
  }
];

export function WorkspaceReportExport({ workspace, teamMembers }: WorkspaceReportExportProps) {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate>(REPORT_TEMPLATES[0]);
  const [reportOptions, setReportOptions] = useState<ReportGenerationOptions>({
    templateId: REPORT_TEMPLATES[0].id,
    format: REPORT_TEMPLATES[0].defaultFormat,
    dateRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    includeSections: REPORT_TEMPLATES[0].sections,
    includeCharts: true,
    includeRawData: false
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [scheduledReports, setScheduledReports] = useState<any[]>([]);

  const isGlobalManager =
    !!user && (user.role === UserRole.ORGANIZER || user.role === UserRole.SUPER_ADMIN);

  const currentMember = teamMembers?.find((member) => member.userId === user?.id);
  const managerWorkspaceRoles: WorkspaceRole[] = [
    WorkspaceRole.WORKSPACE_OWNER,
    WorkspaceRole.OPERATIONS_MANAGER,
    WorkspaceRole.GROWTH_MANAGER,
    WorkspaceRole.CONTENT_MANAGER,
    WorkspaceRole.TECH_FINANCE_MANAGER,
    WorkspaceRole.VOLUNTEERS_MANAGER,
    WorkspaceRole.EVENT_COORDINATOR,
  ];
  const isWorkspaceManager = currentMember
    ? managerWorkspaceRoles.includes(currentMember.role as WorkspaceRole)
    : false;

  const canExportReports = isGlobalManager || isWorkspaceManager;

  const handleTemplateChange = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setReportOptions(prev => ({
      ...prev,
      templateId: template.id,
      format: template.defaultFormat,
      includeSections: template.sections
    }));
  };

  const handleSectionToggle = (section: string) => {
    setReportOptions(prev => ({
      ...prev,
      includeSections: prev.includeSections.includes(section)
        ? prev.includeSections.filter(s => s !== section)
        : [...prev.includeSections, section]
    }));
  };

  const generateReport = async () => {
    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      setError(null);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 15, 90));
      }, 500);

      const response = await api.post(`/workspaces/${workspace.id}/reports/generate`, reportOptions, {
        responseType: 'blob'
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      // Create download link
      const blob = new Blob([response.data], { 
        type: reportOptions.format === 'PDF' ? 'application/pdf' : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `${workspace.name}-${selectedTemplate.name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.${reportOptions.format.toLowerCase()}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Log audit event for report export
      await supabase.from('workspace_activities').insert({
        workspace_id: workspace.id,
        type: 'communication',
        title: 'Report exported',
        description: `Generated ${selectedTemplate.name} report in ${reportOptions.format} format`,
        actor_id: user?.id,
        actor_name: user?.name || user?.email || 'Unknown',
        metadata: { 
          templateId: selectedTemplate.id,
          format: reportOptions.format,
          sections: reportOptions.includeSections,
          action: 'report_export'
        },
      });

      // Reset progress after a delay
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report generation failed');
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const scheduleReport = async () => {
    try {
      await api.post(`/workspaces/${workspace.id}/reports/schedule`, {
        ...reportOptions,
        frequency: 'weekly', // Could be made configurable
        nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      // Refresh scheduled reports list
      fetchScheduledReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule report');
    }
  };

  const fetchScheduledReports = async () => {
    try {
      const response = await api.get(`/workspaces/${workspace.id}/reports/scheduled`);
      setScheduledReports(response.data.reports);
    } catch (err) {
      // Handle error silently for now
    }
  };

  const getSectionDisplayName = (section: string) => {
    const names: Record<string, string> = {
      'task_metrics': 'Task Metrics',
      'team_performance': 'Team Performance',
      'timeline_analysis': 'Timeline Analysis',
      'health_indicators': 'Health Indicators',
      'recommendations': 'Recommendations',
      'upcoming_deadlines': 'Upcoming Deadlines',
      'collaboration_metrics': 'Collaboration Metrics',
      'workload_analysis': 'Workload Analysis',
      'key_metrics': 'Key Metrics'
    };
    return names[section] || section;
  };

  useEffect(() => {
    fetchScheduledReports();
  }, [workspace.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Report Generation</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate and export workspace analytics reports
        </p>
      </div>

      {!canExportReports && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 px-4 py-3">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Export Restricted
              </h3>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                You can view reports but cannot export them. Contact a workspace manager (Owner, Team Lead, or
                Event Coordinator) or an event organizer to request export access.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Report Template Selection */}
      <div className="bg-card shadow-sm border border-border rounded-lg p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Report Template</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REPORT_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className={`relative rounded-lg border p-4 cursor-pointer hover:bg-muted/50 ${
                selectedTemplate.id === template.id
                  ? 'border-indigo-500 ring-2 ring-indigo-500'
                  : 'border-input'
              }`}
              onClick={() => handleTemplateChange(template)}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="text-sm font-medium text-foreground">{template.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-muted text-foreground">
                      Default: {template.defaultFormat}
                    </span>
                  </div>
                </div>
              </div>
              {selectedTemplate.id === template.id && (
                <div className="absolute top-2 right-2">
                  <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Report Configuration */}
      <div className="bg-card shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Report Configuration</h3>
        
        {/* Date Range */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-foreground mb-3">Date Range</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-foreground">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={reportOptions.dateRange.startDate}
                onChange={(e) => setReportOptions(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, startDate: e.target.value }
                }))}
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
                value={reportOptions.dateRange.endDate}
                onChange={(e) => setReportOptions(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, endDate: e.target.value }
                }))}
                className="mt-1 block w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-foreground mb-3">Export Format</h4>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="PDF"
                checked={reportOptions.format === 'PDF'}
                onChange={(e) => setReportOptions(prev => ({ ...prev, format: e.target.value as 'PDF' | 'CSV' }))}
                className="focus-visible:ring-ring h-4 w-4 text-indigo-600 border-input"
              />
              <span className="ml-2 text-sm text-foreground">PDF (Formatted Report)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="CSV"
                checked={reportOptions.format === 'CSV'}
                onChange={(e) => setReportOptions(prev => ({ ...prev, format: e.target.value as 'PDF' | 'CSV' }))}
                className="focus-visible:ring-ring h-4 w-4 text-indigo-600 border-input"
              />
              <span className="ml-2 text-sm text-foreground">CSV (Data Export)</span>
            </label>
          </div>
        </div>

        {/* Section Selection */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-foreground mb-3">Include Sections</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedTemplate.sections.map((section) => (
              <label key={section} className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportOptions.includeSections.includes(section)}
                  onChange={() => handleSectionToggle(section)}
                  className="focus-visible:ring-ring h-4 w-4 text-indigo-600 border-input rounded"
                />
                <span className="ml-2 text-sm text-foreground">{getSectionDisplayName(section)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Additional Options */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-foreground mb-3">Additional Options</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={reportOptions.includeCharts}
                onChange={(e) => setReportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                className="focus-visible:ring-ring h-4 w-4 text-indigo-600 border-input rounded"
              />
              <span className="ml-2 text-sm text-foreground">Include Charts and Visualizations</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={reportOptions.includeRawData}
                onChange={(e) => setReportOptions(prev => ({ ...prev, includeRawData: e.target.checked }))}
                className="focus-visible:ring-ring h-4 w-4 text-indigo-600 border-input rounded"
              />
              <span className="ml-2 text-sm text-foreground">Include Raw Data Tables</span>
            </label>
          </div>
        </div>

        {/* Generation Progress */}
        {isGenerating && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-md p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-indigo-800">
                  Generating report...
                </p>
                <div className="mt-2 w-full bg-indigo-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
                <p className="mt-1 text-xs text-indigo-600">{generationProgress}% complete</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={generateReport}
            disabled={!canExportReports || isGenerating || reportOptions.includeSections.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
          
          <button
            onClick={scheduleReport}
            disabled={!canExportReports || isGenerating || reportOptions.includeSections.length === 0}
            className="inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 2m8-2l2 2m-2-2v12a2 2 0 01-2 2H10a2 2 0 01-2-2V9" />
            </svg>
            Schedule Weekly
          </button>
        </div>
      </div>

      {/* Scheduled Reports */}
      {scheduledReports.length > 0 && (
        <div className="bg-card shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Scheduled Reports</h3>
          <div className="space-y-3">
            {scheduledReports.map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div>
                  <p className="text-sm font-medium text-foreground">{report.templateName}</p>
                  <p className="text-sm text-muted-foreground">
                    {report.frequency} • Next run: {new Date(report.nextRun).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => {/* Handle cancel schedule */}}
                  className="text-sm text-red-600 hover:text-red-900"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}