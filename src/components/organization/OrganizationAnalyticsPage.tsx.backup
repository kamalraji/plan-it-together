import React from 'react';
import { OrganizationAnalyticsDashboard } from './OrganizationAnalyticsDashboard';
import { OrganizationReportExport } from './OrganizationReportExport';

interface OrganizationAnalyticsPageProps {
  organizationId: string;
}

/**
 * Complete organization analytics page that combines the dashboard and export functionality
 * This component demonstrates how to use both OrganizationAnalyticsDashboard and OrganizationReportExport together
 */
export const OrganizationAnalyticsPage: React.FC<OrganizationAnalyticsPageProps> = ({
  organizationId
}) => {
  const handleExportStart = () => {
    console.log('Export started');
  };

  const handleExportComplete = (success: boolean, filename?: string) => {
    if (success) {
      console.log(`Export completed successfully: ${filename}`);
      // Could show a success toast notification here
    } else {
      console.log('Export failed');
      // Could show an error toast notification here
    }
  };

  const handleExportError = (error: string) => {
    console.error('Export error:', error);
    // Could show an error toast notification here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organization Analytics</h1>
              <p className="mt-2 text-sm text-gray-600">
                Comprehensive insights and performance metrics for your organization
              </p>
            </div>
            
            {/* Standalone Export Controls */}
            <div className="mt-4 sm:mt-0">
              <OrganizationReportExport
                organizationId={organizationId}
                onExportStart={handleExportStart}
                onExportComplete={handleExportComplete}
                onExportError={handleExportError}
                className="flex justify-end"
              />
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <OrganizationAnalyticsDashboard organizationId={organizationId} />
      </div>
    </div>
  );
};

export default OrganizationAnalyticsPage;