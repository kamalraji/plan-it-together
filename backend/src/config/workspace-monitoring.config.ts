/**
 * Workspace Monitoring Configuration
 * Defines monitoring metrics, alerts, and health checks for workspace features
 */

export interface MonitoringMetric {
  name: string;
  description: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  labels?: string[];
}

export interface AlertRule {
  name: string;
  description: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold: number;
  duration: string;
  actions: string[];
}

export interface HealthCheck {
  name: string;
  description: string;
  endpoint?: string;
  interval: number;
  timeout: number;
  retries: number;
}

class WorkspaceMonitoringConfig {
  /**
   * Core workspace metrics to track
   */
  getMetrics(): MonitoringMetric[] {
    return [
      // Workspace Lifecycle Metrics
      {
        name: 'workspace_total',
        description: 'Total number of workspaces',
        type: 'gauge',
        labels: ['status', 'event_type']
      },
      {
        name: 'workspace_created_total',
        description: 'Total workspaces created',
        type: 'counter',
        labels: ['event_type', 'template_used']
      },
      {
        name: 'workspace_dissolved_total',
        description: 'Total workspaces dissolved',
        type: 'counter',
        labels: ['reason', 'duration_days']
      },
      {
        name: 'workspace_provisioning_duration_seconds',
        description: 'Time taken to provision a workspace',
        type: 'histogram',
        labels: ['event_type', 'template_used']
      },

      // Team Management Metrics
      {
        name: 'team_members_total',
        description: 'Total team members across all workspaces',
        type: 'gauge',
        labels: ['role', 'status']
      },
      {
        name: 'team_invitations_sent_total',
        description: 'Total team invitations sent',
        type: 'counter',
        labels: ['role', 'bulk_invitation']
      },
      {
        name: 'team_invitations_accepted_total',
        description: 'Total team invitations accepted',
        type: 'counter',
        labels: ['role', 'time_to_accept']
      },
      {
        name: 'team_member_activity_score',
        description: 'Team member activity score',
        type: 'gauge',
        labels: ['workspace_id', 'member_id', 'role']
      },

      // Task Management Metrics
      {
        name: 'tasks_total',
        description: 'Total tasks across all workspaces',
        type: 'gauge',
        labels: ['status', 'category', 'priority']
      },
      {
        name: 'tasks_created_total',
        description: 'Total tasks created',
        type: 'counter',
        labels: ['category', 'priority', 'has_dependencies']
      },
      {
        name: 'tasks_completed_total',
        description: 'Total tasks completed',
        type: 'counter',
        labels: ['category', 'priority', 'on_time']
      },
      {
        name: 'task_completion_duration_seconds',
        description: 'Time taken to complete tasks',
        type: 'histogram',
        labels: ['category', 'priority', 'assignee_role']
      },
      {
        name: 'task_overdue_total',
        description: 'Total overdue tasks',
        type: 'gauge',
        labels: ['category', 'priority', 'days_overdue']
      },

      // Communication Metrics
      {
        name: 'messages_sent_total',
        description: 'Total messages sent in workspaces',
        type: 'counter',
        labels: ['channel_type', 'message_type', 'sender_role']
      },
      {
        name: 'notifications_sent_total',
        description: 'Total notifications sent',
        type: 'counter',
        labels: ['type', 'channel', 'priority']
      },
      {
        name: 'notification_delivery_duration_seconds',
        description: 'Time taken to deliver notifications',
        type: 'histogram',
        labels: ['type', 'channel']
      },

      // Performance Metrics
      {
        name: 'workspace_api_request_duration_seconds',
        description: 'Duration of workspace API requests',
        type: 'histogram',
        labels: ['method', 'endpoint', 'status_code']
      },
      {
        name: 'workspace_database_query_duration_seconds',
        description: 'Duration of workspace database queries',
        type: 'histogram',
        labels: ['operation', 'table']
      },
      {
        name: 'workspace_memory_usage_bytes',
        description: 'Memory usage by workspace services',
        type: 'gauge',
        labels: ['service', 'workspace_id']
      },

      // Security Metrics
      {
        name: 'workspace_access_attempts_total',
        description: 'Total workspace access attempts',
        type: 'counter',
        labels: ['result', 'user_role', 'access_type']
      },
      {
        name: 'workspace_security_violations_total',
        description: 'Total security violations detected',
        type: 'counter',
        labels: ['violation_type', 'severity']
      },
      {
        name: 'workspace_audit_events_total',
        description: 'Total audit events logged',
        type: 'counter',
        labels: ['event_type', 'user_role']
      }
    ];
  }

  /**
   * Alert rules for workspace monitoring
   */
  getAlertRules(): AlertRule[] {
    return [
      // High Severity Alerts
      {
        name: 'WorkspaceProvisioningFailureRate',
        description: 'High workspace provisioning failure rate',
        condition: 'rate(workspace_provisioning_errors_total[5m]) > 0.1',
        severity: 'high',
        threshold: 0.1,
        duration: '5m',
        actions: ['email', 'slack', 'pagerduty']
      },
      {
        name: 'WorkspaceSecurityViolations',
        description: 'Security violations detected in workspaces',
        condition: 'increase(workspace_security_violations_total[1m]) > 0',
        severity: 'critical',
        threshold: 0,
        duration: '1m',
        actions: ['email', 'slack', 'pagerduty', 'auto_block']
      },
      {
        name: 'WorkspaceAPIHighLatency',
        description: 'High latency in workspace API responses',
        condition: 'histogram_quantile(0.95, workspace_api_request_duration_seconds) > 5',
        severity: 'high',
        threshold: 5,
        duration: '5m',
        actions: ['email', 'slack']
      },

      // Medium Severity Alerts
      {
        name: 'WorkspaceTaskOverdueRate',
        description: 'High rate of overdue tasks',
        condition: 'task_overdue_total / tasks_total > 0.2',
        severity: 'medium',
        threshold: 0.2,
        duration: '10m',
        actions: ['email', 'slack']
      },
      {
        name: 'WorkspaceTeamInvitationFailureRate',
        description: 'High team invitation failure rate',
        condition: 'rate(team_invitation_failures_total[10m]) > 0.05',
        severity: 'medium',
        threshold: 0.05,
        duration: '10m',
        actions: ['email']
      },
      {
        name: 'WorkspaceNotificationDeliveryFailure',
        description: 'High notification delivery failure rate',
        condition: 'rate(notification_delivery_failures_total[5m]) > 0.1',
        severity: 'medium',
        threshold: 0.1,
        duration: '5m',
        actions: ['email', 'slack']
      },

      // Low Severity Alerts
      {
        name: 'WorkspaceMemoryUsageHigh',
        description: 'High memory usage in workspace services',
        condition: 'workspace_memory_usage_bytes > 1073741824', // 1GB
        severity: 'low',
        threshold: 1073741824,
        duration: '15m',
        actions: ['email']
      },
      {
        name: 'WorkspaceInactiveTeamMembers',
        description: 'High number of inactive team members',
        condition: 'team_member_activity_score < 0.3',
        severity: 'low',
        threshold: 0.3,
        duration: '1h',
        actions: ['email']
      }
    ];
  }

  /**
   * Health checks for workspace services
   */
  getHealthChecks(): HealthCheck[] {
    return [
      {
        name: 'WorkspaceAPI',
        description: 'Workspace API health check',
        endpoint: '/api/workspace-config/health',
        interval: 30, // seconds
        timeout: 5,   // seconds
        retries: 3
      },
      {
        name: 'WorkspaceDatabase',
        description: 'Workspace database connectivity',
        interval: 60,
        timeout: 10,
        retries: 3
      },
      {
        name: 'WorkspaceScheduler',
        description: 'Workspace dissolution scheduler',
        interval: 300, // 5 minutes
        timeout: 30,
        retries: 2
      },
      {
        name: 'WorkspaceNotifications',
        description: 'Workspace notification service',
        interval: 120, // 2 minutes
        timeout: 15,
        retries: 3
      },
      {
        name: 'WorkspaceAnalytics',
        description: 'Workspace analytics service',
        interval: 300, // 5 minutes
        timeout: 20,
        retries: 2
      }
    ];
  }

  /**
   * Get monitoring configuration for specific environment
   */
  getEnvironmentConfig(environment: string) {
    const baseConfig = {
      metrics: this.getMetrics(),
      alerts: this.getAlertRules(),
      healthChecks: this.getHealthChecks()
    };

    switch (environment) {
      case 'production':
        return {
          ...baseConfig,
          // More aggressive monitoring in production
          alerts: baseConfig.alerts.map(alert => ({
            ...alert,
            duration: alert.severity === 'critical' ? '30s' : alert.duration
          })),
          healthChecks: baseConfig.healthChecks.map(check => ({
            ...check,
            interval: Math.max(check.interval / 2, 15) // More frequent checks
          }))
        };

      case 'staging':
        return {
          ...baseConfig,
          // Relaxed monitoring in staging
          alerts: baseConfig.alerts.filter(alert => alert.severity !== 'low')
        };

      case 'development':
        return {
          ...baseConfig,
          // Minimal monitoring in development
          alerts: baseConfig.alerts.filter(alert => alert.severity === 'critical'),
          healthChecks: baseConfig.healthChecks.map(check => ({
            ...check,
            interval: check.interval * 2 // Less frequent checks
          }))
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Get Prometheus configuration for workspace metrics
   */
  getPrometheusConfig() {
    return {
      job_name: 'workspace-metrics',
      static_configs: [
        {
          targets: ['localhost:3000']
        }
      ],
      metrics_path: '/api/workspace-config/metrics',
      scrape_interval: '15s',
      scrape_timeout: '10s'
    };
  }

  /**
   * Get Grafana dashboard configuration
   */
  getGrafanaDashboardConfig() {
    return {
      dashboard: {
        title: 'Workspace Monitoring Dashboard',
        tags: ['workspace', 'thittam1hub'],
        panels: [
          {
            title: 'Workspace Overview',
            type: 'stat',
            targets: [
              { expr: 'workspace_total', legendFormat: 'Total Workspaces' },
              { expr: 'sum(team_members_total)', legendFormat: 'Total Team Members' },
              { expr: 'sum(tasks_total)', legendFormat: 'Total Tasks' }
            ]
          },
          {
            title: 'Workspace Creation Rate',
            type: 'graph',
            targets: [
              { expr: 'rate(workspace_created_total[5m])', legendFormat: 'Creation Rate' }
            ]
          },
          {
            title: 'Task Completion Rate',
            type: 'graph',
            targets: [
              { expr: 'rate(tasks_completed_total[5m])', legendFormat: 'Completion Rate' }
            ]
          },
          {
            title: 'API Response Times',
            type: 'graph',
            targets: [
              { expr: 'histogram_quantile(0.95, workspace_api_request_duration_seconds)', legendFormat: '95th Percentile' },
              { expr: 'histogram_quantile(0.50, workspace_api_request_duration_seconds)', legendFormat: '50th Percentile' }
            ]
          }
        ]
      }
    };
  }
}

// Export singleton instance
export const workspaceMonitoringConfig = new WorkspaceMonitoringConfig();
export default workspaceMonitoringConfig;