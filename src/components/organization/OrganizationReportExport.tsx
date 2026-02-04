import React, { useState } from 'react';
import { ExportFormat } from '../../types';

interface OrganizationReportExportProps {
  organizationId: string;
  onExportStart?: () => void;
  onExportComplete?: (success: boolean, filename?: string) => void;
  onExportError?: (error: string) => void;
  className?: string;
  showProgress?: boolean;
}

interface ExportState {
  isExporting: boolean;
  format: ExportFormat | null;
  progress: number;
  error: string | null;
}

export const OrganizationReportExport: React.FC<OrganizationReportExportProps> = ({
  organizationId,
  onExportStart,
  onExportComplete,
  onExportError,
  className = '',
  showProgress = true
}) => {
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    format: null,
    progress: 0,
    error: null
  });

  const handleExport = async (format: ExportFormat) => {
    try {
      setExportState({
        isExporting: true,
        format,
        progress: 0,
        error: null
      });

      onExportStart?.();

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const response = await fetch(`/api/organizations/${organizationId}/analytics/export`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to export organization report');
      }

      // Complete progress
      setExportState(prev => ({ ...prev, progress: 100 }));

      // Get the blob and create download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `organization-analytics-${organizationId}-${Date.now()}.${format.toLowerCase()}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      onExportComplete?.(true, filename);

      // Reset export state after a delay
      setTimeout(() => {
        setExportState({
          isExporting: false,
          format: null,
          progress: 0,
          error: null
        });
      }, 1000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      
      setExportState({
        isExporting: false,
        format: null,
        progress: 0,
        error: errorMessage
      });

      onExportError?.(errorMessage);
      onExportComplete?.(false);
    }
  };

  const resetError = () => {
    setExportState(prev => ({ ...prev, error: null }));
  };

  return (
    <div className={className}>
      {/* Export Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={() => handleExport('CSV')}
          disabled={exportState.isExporting}
          className="inline-flex items-center px-4 py-2 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exportState.isExporting && exportState.format === 'CSV' ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exporting...
            </>
          ) : (
            <>
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </>
          )}
        </button>
        
        <button
          onClick={() => handleExport('PDF')}
          disabled={exportState.isExporting}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exportState.isExporting && exportState.format === 'PDF' ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exporting...
            </>
          ) : (
            <>
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </>
          )}
        </button>
      </div>

      {/* Export Progress */}
      {showProgress && exportState.isExporting && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-blue-800">
                Exporting {exportState.format} report...
              </p>
              <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportState.progress}%` }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-blue-600">{exportState.progress}% complete</p>
            </div>
          </div>
        </div>
      )}

      {/* Export Error */}
      {exportState.error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Export failed</h3>
              <p className="mt-1 text-sm text-red-700">{exportState.error}</p>
              <button
                onClick={resetError}
                className="mt-2 text-sm text-red-800 underline hover:text-red-900"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationReportExport;