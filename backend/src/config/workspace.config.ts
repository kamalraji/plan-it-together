/**
 * Workspace Configuration Service
 * Manages workspace-specific configuration settings and feature flags
 */

export interface WorkspaceConfig {
  // Core Settings
  enabled: boolean;
  autoProvision: boolean;
  dissolutionDelayDays: number;
  maxTeamSize: number;
  maxTasksPerWorkspace: number;
  templateSharingEnabled: boolean;

  // Security Settings
  sessionTimeoutMinutes: number;
  mfaRequiredRoles: string[];
  auditLogRetentionDays: number;
  encryptionKey: string;

  // Notification Settings
  notificationEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  slackWebhookUrl?: string;
  teamsWebhookUrl?: string;

  // Analytics Settings
  analyticsEnabled: boolean;
  metricsRetentionDays: number;
  performanceMonitoring: boolean;
}

class WorkspaceConfigService {
  private config: WorkspaceConfig;

  constructor() {
    this.config = this.loadConfiguration();
  }

  private loadConfiguration(): WorkspaceConfig {
    return {
      // Core Settings
      enabled: process.env.WORKSPACE_ENABLED === 'true',
      autoProvision: process.env.WORKSPACE_AUTO_PROVISION !== 'false',
      dissolutionDelayDays: parseInt(process.env.WORKSPACE_DISSOLUTION_DELAY_DAYS || '30'),
      maxTeamSize: parseInt(process.env.WORKSPACE_MAX_TEAM_SIZE || '50'),
      maxTasksPerWorkspace: parseInt(process.env.WORKSPACE_MAX_TASKS_PER_WORKSPACE || '500'),
      templateSharingEnabled: process.env.WORKSPACE_TEMPLATE_SHARING_ENABLED !== 'false',

      // Security Settings
      sessionTimeoutMinutes: parseInt(process.env.WORKSPACE_SESSION_TIMEOUT_MINUTES || '60'),
      mfaRequiredRoles: (process.env.WORKSPACE_MFA_REQUIRED_ROLES || 'workspace_owner,team_lead').split(','),
      auditLogRetentionDays: parseInt(process.env.WORKSPACE_AUDIT_LOG_RETENTION_DAYS || '365'),
      encryptionKey: process.env.WORKSPACE_ENCRYPTION_KEY || '',

      // Notification Settings
      notificationEnabled: process.env.WORKSPACE_NOTIFICATION_ENABLED !== 'false',
      emailNotifications: process.env.WORKSPACE_EMAIL_NOTIFICATIONS !== 'false',
      pushNotifications: process.env.WORKSPACE_PUSH_NOTIFICATIONS !== 'false',
      slackWebhookUrl: process.env.WORKSPACE_SLACK_WEBHOOK_URL,
      teamsWebhookUrl: process.env.WORKSPACE_TEAMS_WEBHOOK_URL,

      // Analytics Settings
      analyticsEnabled: process.env.WORKSPACE_ANALYTICS_ENABLED !== 'false',
      metricsRetentionDays: parseInt(process.env.WORKSPACE_METRICS_RETENTION_DAYS || '90'),
      performanceMonitoring: process.env.WORKSPACE_PERFORMANCE_MONITORING !== 'false',
    };
  }

  /**
   * Get the complete workspace configuration
   */
  getConfig(): WorkspaceConfig {
    return { ...this.config };
  }

  /**
   * Check if workspace features are enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Check if auto-provisioning is enabled
   */
  isAutoProvisionEnabled(): boolean {
    return this.config.autoProvision;
  }

  /**
   * Get maximum team size allowed
   */
  getMaxTeamSize(): number {
    return this.config.maxTeamSize;
  }

  /**
   * Get maximum tasks per workspace
   */
  getMaxTasksPerWorkspace(): number {
    return this.config.maxTasksPerWorkspace;
  }

  /**
   * Get workspace dissolution delay in days
   */
  getDissolutionDelayDays(): number {
    return this.config.dissolutionDelayDays;
  }

  /**
   * Check if template sharing is enabled
   */
  isTemplateSharingEnabled(): boolean {
    return this.config.templateSharingEnabled;
  }

  /**
   * Get session timeout in minutes
   */
  getSessionTimeoutMinutes(): number {
    return this.config.sessionTimeoutMinutes;
  }

  /**
   * Check if MFA is required for a role
   */
  isMfaRequiredForRole(role: string): boolean {
    return this.config.mfaRequiredRoles.includes(role);
  }

  /**
   * Get audit log retention period in days
   */
  getAuditLogRetentionDays(): number {
    return this.config.auditLogRetentionDays;
  }

  /**
   * Get workspace encryption key
   */
  getEncryptionKey(): string {
    return this.config.encryptionKey;
  }

  /**
   * Check if notifications are enabled
   */
  isNotificationEnabled(): boolean {
    return this.config.notificationEnabled;
  }

  /**
   * Check if email notifications are enabled
   */
  isEmailNotificationEnabled(): boolean {
    return this.config.emailNotifications;
  }

  /**
   * Check if push notifications are enabled
   */
  isPushNotificationEnabled(): boolean {
    return this.config.pushNotifications;
  }

  /**
   * Get Slack webhook URL if configured
   */
  getSlackWebhookUrl(): string | undefined {
    return this.config.slackWebhookUrl;
  }

  /**
   * Get Teams webhook URL if configured
   */
  getTeamsWebhookUrl(): string | undefined {
    return this.config.teamsWebhookUrl;
  }

  /**
   * Check if analytics are enabled
   */
  isAnalyticsEnabled(): boolean {
    return this.config.analyticsEnabled;
  }

  /**
   * Get metrics retention period in days
   */
  getMetricsRetentionDays(): number {
    return this.config.metricsRetentionDays;
  }

  /**
   * Check if performance monitoring is enabled
   */
  isPerformanceMonitoringEnabled(): boolean {
    return this.config.performanceMonitoring;
  }

  /**
   * Validate configuration settings
   */
  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate numeric values
    if (this.config.maxTeamSize <= 0) {
      errors.push('Maximum team size must be greater than 0');
    }

    if (this.config.maxTasksPerWorkspace <= 0) {
      errors.push('Maximum tasks per workspace must be greater than 0');
    }

    if (this.config.dissolutionDelayDays < 0) {
      errors.push('Dissolution delay days cannot be negative');
    }

    if (this.config.sessionTimeoutMinutes <= 0) {
      errors.push('Session timeout must be greater than 0');
    }

    if (this.config.auditLogRetentionDays <= 0) {
      errors.push('Audit log retention days must be greater than 0');
    }

    if (this.config.metricsRetentionDays <= 0) {
      errors.push('Metrics retention days must be greater than 0');
    }

    // Validate encryption key if workspace is enabled
    if (this.config.enabled && !this.config.encryptionKey) {
      errors.push('Workspace encryption key is required when workspace features are enabled');
    }

    // Validate MFA roles
    const validRoles = ['workspace_owner', 'team_lead', 'event_coordinator', 'volunteer_manager', 'technical_specialist', 'marketing_lead', 'general_volunteer'];
    for (const role of this.config.mfaRequiredRoles) {
      if (!validRoles.includes(role)) {
        errors.push(`Invalid MFA required role: ${role}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get configuration for API responses (excludes sensitive data)
   */
  getPublicConfig() {
    return {
      enabled: this.config.enabled,
      maxTeamSize: this.config.maxTeamSize,
      maxTasksPerWorkspace: this.config.maxTasksPerWorkspace,
      templateSharingEnabled: this.config.templateSharingEnabled,
      sessionTimeoutMinutes: this.config.sessionTimeoutMinutes,
      mfaRequiredRoles: this.config.mfaRequiredRoles,
      notificationEnabled: this.config.notificationEnabled,
      emailNotifications: this.config.emailNotifications,
      pushNotifications: this.config.pushNotifications,
      analyticsEnabled: this.config.analyticsEnabled,
      performanceMonitoring: this.config.performanceMonitoring,
    };
  }
}

// Export singleton instance
export const workspaceConfig = new WorkspaceConfigService();
export default workspaceConfig;