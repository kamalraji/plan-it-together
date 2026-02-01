import React, { useState } from 'react';
import {
  DocumentArrowDownIcon,
  CalendarIcon,
  ChartBarIcon,
  TableCellsIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { ExportFormat, DateRangeFilter } from '../../types';

interface ReportGeneratorProps {
  scope: 'event' | 'organization' | 'workspace' | 'global';
  eventId?: string;
  organizationId?: string;
  workspaceId?: string;
  onExport: (format: ExportFormat, options: ReportOptions) => Promise<void>;
}

interface ReportOptions {
  dateRange: DateRangeFilter;
  includeCharts: boolean;
  includeRawData: boolean;
  sections: string[];
  format: ExportFormat;
  customTitle?: string;
  compareWithPrevious?: boolean;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  defaultFormat: ExportFormat;
  icon: React.ComponentType<{ className?: string }>;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  scope,
  eventId: _eventId,
  organizationId: _organizationId,
  workspaceId: _workspaceId,
  onExport,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('comprehensive');
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    dateRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    },
    includeCharts: true,
    includeRawData: false,
    sections: ['summary', 'registrations', 'attendance', 'engagement'],
    format: 'PDF',
    compareWithPrevious: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Report templates based on scope
  const getReportTemplates = (): ReportTemplate[] => {
    const baseTemplates: ReportTemplate[] = [
      {
        id: 'comprehensive',
        name: 'Comprehensive Report',
        description: 'Complete analytics with all available metrics and visualizations',
        sections: ['summary', 'registrations', 'attendance', 'engagement', 'performance'],
        defaultFormat: 'PDF',
        icon: DocumentArrowDownIcon,
      },
      {
        id: 'executive',
        name: 'Executive Summary',
        description: 'High-level overview with key metrics and insights',
        sections: ['summary', 'key-metrics', 'trends'],
        defaultFormat: 'PDF',
        icon: ChartBarIcon,
      },
      {
        id: 'operational',
        name: 'Operational Report',
        description: 'Detailed operational metrics for day-to-day management',
        sections: ['attendance', 'engagement', 'issues', 'recommendations'],
        defaultFormat: 'CSV',
        icon: TableCellsIcon,
      },
    ];

    // Add scope-specific templates
    if (scope === 'event') {
      baseTemplates.push({
        id: 'event-performance',
        name: 'Event Performance',
        description: 'Focused on event-specific metrics and participant feedback',
        sections: ['registrations', 'attendance', 'sessions', 'feedback'],
        defaultFormat: 'PDF',
        icon: CalendarIcon,
      });
    }

    if (scope === 'organization') {
      baseTemplates.push({
        id: 'organization-growth',
        name: 'Organization Growth',
        description: 'Track organization growth, follower engagement, and event success',
        sections: ['growth', 'events', 'followers', 'engagement'],
        defaultFormat: 'PDF',
        icon: ChartBarIcon,
      });
    }

    return baseTemplates;
  };

  const availableSections = [
    { id: 'summary', label: 'Executive Summary', description: 'Key metrics and highlights' },
    { id: 'registrations', label: 'Registration Analytics', description: 'Registration trends and demographics' },
    { id: 'attendance', label: 'Attendance Tracking', description: 'Check-in rates and session attendance' },
    { id: 'engagement', label: 'Engagement Metrics', description: 'User interaction and participation' },
    { id: 'performance', label: 'Performance Analysis', description: 'System performance and response times' },
    { id: 'feedback', label: 'Feedback Analysis', description: 'Participant feedback and ratings' },
    { id: 'financial', label: 'Financial Overview', description: 'Revenue and cost analysis' },
    { id: 'trends', label: 'Trend Analysis', description: 'Historical trends and projections' },
    { id: 'recommendations', label: 'Recommendations', description: 'AI-generated insights and suggestions' },
  ];

  const handleTemplateSelect = (templateId: string) => {
    const template = getReportTemplates().find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setReportOptions(prev => ({
        ...prev,
        sections: template.sections,
        format: template.defaultFormat,
      }));
    }
  };

  const handleSectionToggle = (sectionId: string) => {
    setReportOptions(prev => ({
      ...prev,
      sections: prev.sections.includes(sectionId)
        ? prev.sections.filter(s => s !== sectionId)
        : [...prev.sections, sectionId],
    }));
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await onExport(reportOptions.format, reportOptions);

      clearInterval(progressInterval);
      setGenerationProgress(100);

      // Reset after a delay
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 1000);
    } catch (_error) {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const estimatedGenerationTime = () => {
    const baseTime = 5; // seconds
    const sectionMultiplier = reportOptions.sections.length * 2;
    const chartMultiplier = reportOptions.includeCharts ? 10 : 0;
    const dataMultiplier = reportOptions.includeRawData ? 15 : 0;
    
    return Math.max(baseTime + sectionMultiplier + chartMultiplier + dataMultiplier, 5);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Report Templates */}
      <div className="bg-card shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Report Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getReportTemplates().map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template.id)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                selectedTemplate === template.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-border hover:border-input'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <template.icon className={`h-6 w-6 ${
                  selectedTemplate === template.id ? 'text-indigo-600' : 'text-muted-foreground'
                }`} />
                <h3 className="font-medium text-foreground">{template.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{template.description}</p>
              <div className="mt-2 flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  template.defaultFormat === 'PDF' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {template.defaultFormat}
                </span>
                <span className="text-xs text-muted-foreground">
                  {template.sections.length} sections
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Report Configuration */}
      <div className="bg-card shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-foreground mb-6">Report Configuration</h2>
        
        <div className="space-y-6">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-xs text-muted-foreground mb-1">
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
                  className="block w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-xs text-muted-foreground mb-1">
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
                  className="block w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Export Format
            </label>
            <div className="flex space-x-4">
              {(['PDF', 'CSV'] as ExportFormat[]).map((format) => (
                <label key={format} className="flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value={format}
                    checked={reportOptions.format === format}
                    onChange={(e) => setReportOptions(prev => ({
                      ...prev,
                      format: e.target.value as ExportFormat
                    }))}
                    className="h-4 w-4 text-indigo-600 focus-visible:ring-ring border-input"
                  />
                  <span className="ml-2 text-sm text-foreground">{format}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Report Options */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Report Options
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportOptions.includeCharts}
                  onChange={(e) => setReportOptions(prev => ({
                    ...prev,
                    includeCharts: e.target.checked
                  }))}
                  className="h-4 w-4 text-indigo-600 focus-visible:ring-ring border-input rounded"
                />
                <span className="ml-2 text-sm text-foreground">Include charts and visualizations</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportOptions.includeRawData}
                  onChange={(e) => setReportOptions(prev => ({
                    ...prev,
                    includeRawData: e.target.checked
                  }))}
                  className="h-4 w-4 text-indigo-600 focus-visible:ring-ring border-input rounded"
                />
                <span className="ml-2 text-sm text-foreground">Include raw data tables</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportOptions.compareWithPrevious}
                  onChange={(e) => setReportOptions(prev => ({
                    ...prev,
                    compareWithPrevious: e.target.checked
                  }))}
                  className="h-4 w-4 text-indigo-600 focus-visible:ring-ring border-input rounded"
                />
                <span className="ml-2 text-sm text-foreground">Compare with previous period</span>
              </label>
            </div>
          </div>

          {/* Section Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Report Sections
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableSections.map((section) => (
                <label key={section.id} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={reportOptions.sections.includes(section.id)}
                    onChange={() => handleSectionToggle(section.id)}
                    className="h-4 w-4 text-indigo-600 focus-visible:ring-ring border-input rounded mt-1"
                  />
                  <div>
                    <div className="text-sm font-medium text-foreground">{section.label}</div>
                    <div className="text-xs text-muted-foreground">{section.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Title */}
          <div>
            <label htmlFor="customTitle" className="block text-sm font-medium text-foreground mb-2">
              Custom Report Title (Optional)
            </label>
            <input
              type="text"
              id="customTitle"
              value={reportOptions.customTitle || ''}
              onChange={(e) => setReportOptions(prev => ({
                ...prev,
                customTitle: e.target.value
              }))}
              placeholder="Enter custom report title..."
              className="block w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <ClockIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Generating Report</h3>
              <p className="text-sm text-blue-600">
                Estimated time: {estimatedGenerationTime()} seconds
              </p>
            </div>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${generationProgress}%` }}
            ></div>
          </div>
          <p className="mt-2 text-xs text-blue-600">{generationProgress}% complete</p>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-end">
        <button
          onClick={handleGenerateReport}
          disabled={isGenerating || reportOptions.sections.length === 0}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-background mr-2" />
              Generating...
            </>
          ) : (
            <>
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Generate Report
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReportGenerator;