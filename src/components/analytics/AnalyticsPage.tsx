import React, { useState, useEffect } from 'react';
import { PageHeader } from '../routing/PageHeader';
import { ServiceDashboard } from '../routing/ServiceDashboard';
import { useAuth } from '../../hooks/useAuth';
import {
  DocumentArrowDownIcon,
  ClockIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { ReportGenerator } from './ReportGenerator';
import CustomDashboard from './CustomDashboard.tsx';
import { RealTimeMetrics } from './RealTimeMetrics';
import { UserRole, AnalyticsReport, DashboardWidget } from '../../types';

interface AnalyticsPageProps {
  eventId?: string;
  organizationId?: string;
  workspaceId?: string;
  scope?: 'event' | 'organization' | 'workspace' | 'global';
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  eventId,
  organizationId,
  workspaceId,
  scope = 'global',
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsReport | null>(null);
  const [customWidgets, setCustomWidgets] = useState<DashboardWidget[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  useEffect(() => {
    fetchAnalyticsData();

    // Set up auto-refresh for real-time data
    if (refreshInterval) {
      const interval = setInterval(fetchAnalyticsData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [eventId, organizationId, workspaceId, scope, refreshInterval]);

  const fetchAnalyticsData = async (): Promise<void> => {
    try {
      setLoading(true);

      let endpoint = '/api/analytics';
      const params = new URLSearchParams();

      if (scope === 'event' && eventId) {
        endpoint = `/api/events/${eventId}/analytics`;
      } else if (scope === 'organization' && organizationId) {
        endpoint = `/api/organizations/${organizationId}/analytics`;
      } else if (scope === 'workspace' && workspaceId) {
        endpoint = `/api/workspaces/${workspaceId}/analytics`;
      }

      const response = await fetch(`${endpoint}?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch {
      // Analytics fetch failed - UI will show empty state
    } finally {
      setLoading(false);
    }
  };

  const handleCustomizeLayout = () => {
    setActiveTab('customize');
  };

  const handleExportReport = async (format: 'CSV' | 'PDF', options: any): Promise<void> => {
    try {
      let endpoint = '/api/analytics/export';

      if (scope === 'event' && eventId) {
        endpoint = `/api/events/${eventId}/analytics/export`;
      } else if (scope === 'organization' && organizationId) {
        endpoint = `/api/organizations/${organizationId}/analytics/export`;
      } else if (scope === 'workspace' && workspaceId) {
        endpoint = `/api/workspaces/${workspaceId}/analytics/export`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format, ...options }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${Date.now()}.${format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // Export failed silently
    }
  };

  // Role-based access control for analytics features
  const canViewAdvancedAnalytics = () => {
    return user?.role === UserRole.SUPER_ADMIN ||
      user?.role === UserRole.ORGANIZER;
  };

  const canExportReports = () => {
    return user?.role === UserRole.SUPER_ADMIN ||
      user?.role === UserRole.ORGANIZER;
  };

  const canCustomizeDashboard = () => {
    return user?.role === UserRole.SUPER_ADMIN ||
      user?.role === UserRole.ORGANIZER;
  };

  // Generate dashboard widgets based on scope and user role
  const generateDashboardWidgets = (): DashboardWidget[] => {
    const widgets: DashboardWidget[] = [];

    if (!analyticsData) return widgets;

    // Basic metrics widgets (available to all roles)
    widgets.push({
      id: 'total-registrations',
      type: 'metric',
      title: 'Total Registrations',
      size: 'small',
      data: {
        value: analyticsData.summary.totalRegistrations,
        change: '+12%',
        changeType: 'increase',
        label: 'vs last period',
      },
    });

    widgets.push({
      id: 'attendance-rate',
      type: 'metric',
      title: 'Attendance Rate',
      size: 'small',
      data: {
        value: `${analyticsData.summary.overallCheckInRate.toFixed(1)}%`,
        change: '+5%',
        changeType: 'increase',
        label: 'vs last event',
      },
    });

    // Advanced widgets for organizers and admins
    if (canViewAdvancedAnalytics()) {
      widgets.push({
        id: 'registration-chart',
        type: 'chart',
        title: 'Registration Over Time',
        size: 'large',
        data: {
          chartData: analyticsData.registrationOverTime,
          chartType: 'line',
        },
      });

      widgets.push({
        id: 'session-checkins',
        type: 'table',
        title: 'Session Check-in Rates',
        size: 'medium',
        data: {
          headers: ['Session', 'Registered', 'Attended', 'Rate'],
          rows: analyticsData.sessionCheckInRates.map(session => [
            session.sessionName,
            session.totalRegistrations,
            session.checkedIn,
            `${session.checkInRate.toFixed(1)}%`,
          ]),
        },
      });

      if (analyticsData.judgeParticipation.length > 0) {
        widgets.push({
          id: 'judge-participation',
          type: 'list',
          title: 'Judge Participation',
          size: 'medium',
          data: {
            items: analyticsData.judgeParticipation.map(judge => ({
              label: judge.judgeName,
              value: `${judge.completionRate.toFixed(1)}%`,
            })),
          },
        });
      }
    }

    // Real-time status widget
    widgets.push({
      id: 'system-status',
      type: 'status',
      title: 'System Status',
      size: 'small',
      data: {
        status: 'healthy',
        message: 'All systems operational',
        details: `Last updated: ${new Date().toLocaleTimeString()}`,
      },
    });

    return widgets;
  };

  // Quick actions based on user role and scope
  const getQuickActions = () => {
    const actions = [];

    if (canExportReports()) {
      actions.push({
        label: 'Generate Report',
        description: 'Create comprehensive analytics report',
        icon: DocumentArrowDownIcon,
        action: () => setActiveTab('reports'),
      });
    }

    if (canCustomizeDashboard()) {
      actions.push({
        label: 'Customize Dashboard',
        description: 'Add or modify dashboard widgets',
        icon: CogIcon,
        action: handleCustomizeLayout,
      });
    }

    actions.push({
      label: 'Real-time View',
      description: 'Monitor live metrics and updates',
      icon: ClockIcon,
      action: () => setActiveTab('realtime'),
    });

    return actions;
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', current: activeTab === 'dashboard' },
    { id: 'reports', label: 'Reports', current: activeTab === 'reports' },
    { id: 'realtime', label: 'Real-time', current: activeTab === 'realtime' },
  ];

  if (canCustomizeDashboard()) {
    tabs.push({ id: 'customize', label: 'Customize', current: activeTab === 'customize' });
  }

  const pageActions: Array<{
    label: string;
    action: () => Promise<void>;
    variant: 'primary' | 'secondary' | 'danger';
    loading?: boolean;
    icon?: React.ComponentType<{ className?: string }>;
  }> = [
      {
        label: 'Refresh',
        action: fetchAnalyticsData,
        variant: 'secondary' as const,
        loading,
      },
    ];

  if (canExportReports()) {
    pageActions.unshift({
      label: 'Export',
      action: async () => { setActiveTab('reports'); },
      variant: 'primary' as const,
      icon: DocumentArrowDownIcon,
    });
  }

  const getScopeTitle = () => {
    switch (scope) {
      case 'event':
        return analyticsData?.eventName || 'Event Analytics';
      case 'organization':
        return 'Organization Analytics';
      case 'workspace':
        return 'Workspace Analytics';
      default:
        return 'Analytics Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-muted/50">
      <PageHeader
        title={getScopeTitle()}
        subtitle="Comprehensive insights and performance metrics"
        actions={pageActions}
        tabs={tabs.map(tab => ({
          ...tab,
          onClick: () => setActiveTab(tab.id),
        }))}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <ServiceDashboard
            service="Analytics"
            widgets={generateDashboardWidgets()}
            quickActions={getQuickActions()}
            loading={loading}
            onRefresh={fetchAnalyticsData}
            onCustomizeLayout={canCustomizeDashboard() ? handleCustomizeLayout : undefined}
          />
        )}

        {activeTab === 'reports' && canExportReports() && (
          <ReportGenerator
            scope={scope}
            eventId={eventId}
            organizationId={organizationId}
            workspaceId={workspaceId}
            onExport={handleExportReport}
          />
        )}

        {activeTab === 'realtime' && (
          <RealTimeMetrics
            scope={scope}
            eventId={eventId}
            organizationId={organizationId}
            workspaceId={workspaceId}
            refreshInterval={refreshInterval}
            onRefreshIntervalChange={setRefreshInterval}
          />
        )}

        {activeTab === 'customize' && canCustomizeDashboard() && (
          <CustomDashboard
            widgets={customWidgets}
            onWidgetsChange={setCustomWidgets}
            availableWidgetTypes={[
              'metric',
              'chart',
              'table',
              'list',
              'status',
              'quickAction',
            ]}
          />
        )}

        {/* Legacy Analytics Dashboard for backward compatibility */}
        {activeTab === 'legacy' && eventId && (
          <AnalyticsDashboard eventId={eventId} />
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;