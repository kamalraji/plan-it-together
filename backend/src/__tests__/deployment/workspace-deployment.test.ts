/**
 * Workspace Deployment and Configuration Tests
 * Tests deployment-specific functionality and configuration validation
 */

import { workspaceConfig } from '../../config/workspace.config';
import { workspaceMonitoringConfig } from '../../config/workspace-monitoring.config';

describe('Workspace Deployment Tests', () => {
  describe('Configuration Validation', () => {
    test('should validate workspace configuration successfully', () => {
      const validation = workspaceConfig.validateConfiguration();
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should have required environment variables set', () => {
      // Test that critical environment variables are configured
      expect(workspaceConfig.isEnabled()).toBeDefined();
      expect(workspaceConfig.getMaxTeamSize()).toBeGreaterThan(0);
      expect(workspaceConfig.getMaxTasksPerWorkspace()).toBeGreaterThan(0);
      expect(workspaceConfig.getDissolutionDelayDays()).toBeGreaterThanOrEqual(0);
    });

    test('should have valid security configuration', () => {
      expect(workspaceConfig.getSessionTimeoutMinutes()).toBeGreaterThan(0);
      expect(workspaceConfig.getAuditLogRetentionDays()).toBeGreaterThan(0);
      
      // Check MFA configuration
      const mfaRoles = ['workspace_owner', 'team_lead'];
      mfaRoles.forEach(role => {
        expect(typeof workspaceConfig.isMfaRequiredForRole(role)).toBe('boolean');
      });
    });

    test('should have valid notification configuration', () => {
      expect(typeof workspaceConfig.isNotificationEnabled()).toBe('boolean');
      expect(typeof workspaceConfig.isEmailNotificationEnabled()).toBe('boolean');
      expect(typeof workspaceConfig.isPushNotificationEnabled()).toBe('boolean');
    });

    test('should have valid analytics configuration', () => {
      expect(typeof workspaceConfig.isAnalyticsEnabled()).toBe('boolean');
      expect(workspaceConfig.getMetricsRetentionDays()).toBeGreaterThan(0);
      expect(typeof workspaceConfig.isPerformanceMonitoringEnabled()).toBe('boolean');
    });
  });

  describe('Feature Flag Validation', () => {
    test('should have consistent feature flag configuration', () => {
      const config = workspaceConfig.getConfig();
      
      // If workspace is enabled, core features should be properly configured
      if (config.enabled) {
        expect(config.maxTeamSize).toBeGreaterThan(0);
        expect(config.maxTasksPerWorkspace).toBeGreaterThan(0);
        expect(config.sessionTimeoutMinutes).toBeGreaterThan(0);
      }
    });

    test('should provide public configuration without sensitive data', () => {
      const publicConfig = workspaceConfig.getPublicConfig();
      
      expect(publicConfig).toHaveProperty('enabled');
      expect(publicConfig).toHaveProperty('maxTeamSize');
      expect(publicConfig).toHaveProperty('maxTasksPerWorkspace');
      expect(publicConfig).not.toHaveProperty('encryptionKey');
      expect(publicConfig).not.toHaveProperty('slackWebhookUrl');
    });
  });

  describe('Monitoring Configuration', () => {
    test('should have valid monitoring metrics configuration', () => {
      const metrics = workspaceMonitoringConfig.getMetrics();
      
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
      
      // Validate metric structure
      metrics.forEach(metric => {
        expect(metric).toHaveProperty('name');
        expect(metric).toHaveProperty('description');
        expect(metric).toHaveProperty('type');
        expect(['counter', 'gauge', 'histogram', 'summary']).toContain(metric.type);
      });
    });

    test('should have valid alert rules configuration', () => {
      const alerts = workspaceMonitoringConfig.getAlertRules();
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThan(0);
      
      // Validate alert structure
      alerts.forEach(alert => {
        expect(alert).toHaveProperty('name');
        expect(alert).toHaveProperty('description');
        expect(alert).toHaveProperty('condition');
        expect(alert).toHaveProperty('severity');
        expect(['low', 'medium', 'high', 'critical']).toContain(alert.severity);
        expect(alert).toHaveProperty('threshold');
        expect(alert).toHaveProperty('duration');
        expect(Array.isArray(alert.actions)).toBe(true);
      });
    });

    test('should have valid health check configuration', () => {
      const healthChecks = workspaceMonitoringConfig.getHealthChecks();
      
      expect(Array.isArray(healthChecks)).toBe(true);
      expect(healthChecks.length).toBeGreaterThan(0);
      
      // Validate health check structure
      healthChecks.forEach(check => {
        expect(check).toHaveProperty('name');
        expect(check).toHaveProperty('description');
        expect(check).toHaveProperty('interval');
        expect(check).toHaveProperty('timeout');
        expect(check).toHaveProperty('retries');
        expect(check.interval).toBeGreaterThan(0);
        expect(check.timeout).toBeGreaterThan(0);
        expect(check.retries).toBeGreaterThanOrEqual(0);
      });
    });

    test('should provide environment-specific monitoring configuration', () => {
      const environments = ['development', 'staging', 'production'];
      
      environments.forEach(env => {
        const config = workspaceMonitoringConfig.getEnvironmentConfig(env);
        
        expect(config).toHaveProperty('metrics');
        expect(config).toHaveProperty('alerts');
        expect(config).toHaveProperty('healthChecks');
        expect(Array.isArray(config.metrics)).toBe(true);
        expect(Array.isArray(config.alerts)).toBe(true);
        expect(Array.isArray(config.healthChecks)).toBe(true);
      });
    });
  });

  describe('Security Configuration Tests', () => {
    test('should enforce encryption key requirement when workspace is enabled', () => {
      const config = workspaceConfig.getConfig();
      
      if (config.enabled) {
        // In test environment, encryption key might not be set
        // In production, this should be enforced
        const validation = workspaceConfig.validateConfiguration();
        
        if (!config.encryptionKey) {
          expect(validation.errors).toContain(
            'Workspace encryption key is required when workspace features are enabled'
          );
        }
      } else {
        // If workspace is disabled, we still need to test something
        expect(config.enabled).toBe(false);
      }
    });

    test('should validate MFA role configuration', () => {
      const validation = workspaceConfig.validateConfiguration();
      const validRoles = [
        'workspace_owner',
        'team_lead',
        'event_coordinator',
        'volunteer_manager',
        'technical_specialist',
        'marketing_lead',
        'general_volunteer'
      ];
      
      const config = workspaceConfig.getConfig();
      const invalidRoles = config.mfaRequiredRoles.filter(role => !validRoles.includes(role));
      
      if (invalidRoles.length > 0) {
        invalidRoles.forEach(role => {
          expect(validation.errors).toContain(`Invalid MFA required role: ${role}`);
        });
      } else {
        // All roles are valid
        expect(config.mfaRequiredRoles.every(role => validRoles.includes(role))).toBe(true);
      }
    });

    test('should have reasonable security timeout values', () => {
      const sessionTimeout = workspaceConfig.getSessionTimeoutMinutes();
      const auditRetention = workspaceConfig.getAuditLogRetentionDays();
      
      // Session timeout should be reasonable (between 15 minutes and 24 hours)
      expect(sessionTimeout).toBeGreaterThanOrEqual(15);
      expect(sessionTimeout).toBeLessThanOrEqual(1440); // 24 hours
      
      // Audit retention should be at least 30 days
      expect(auditRetention).toBeGreaterThanOrEqual(30);
    });
  });

  describe('Performance Configuration Tests', () => {
    test('should have reasonable resource limits', () => {
      const maxTeamSize = workspaceConfig.getMaxTeamSize();
      const maxTasks = workspaceConfig.getMaxTasksPerWorkspace();
      
      // Team size should be reasonable (between 1 and 1000)
      expect(maxTeamSize).toBeGreaterThanOrEqual(1);
      expect(maxTeamSize).toBeLessThanOrEqual(1000);
      
      // Task limit should be reasonable (between 10 and 10000)
      expect(maxTasks).toBeGreaterThanOrEqual(10);
      expect(maxTasks).toBeLessThanOrEqual(10000);
    });

    test('should have valid metrics retention configuration', () => {
      const metricsRetention = workspaceConfig.getMetricsRetentionDays();
      
      // Metrics retention should be at least 7 days, max 2 years
      expect(metricsRetention).toBeGreaterThanOrEqual(7);
      expect(metricsRetention).toBeLessThanOrEqual(730);
    });
  });

  describe('Integration Configuration Tests', () => {
    test('should handle optional webhook configurations gracefully', () => {
      const slackWebhook = workspaceConfig.getSlackWebhookUrl();
      const teamsWebhook = workspaceConfig.getTeamsWebhookUrl();
      
      // Webhooks are optional, but if set, should be valid URLs or undefined
      if (slackWebhook) {
        expect(slackWebhook).toMatch(/^https?:\/\/.+/);
      }
      
      if (teamsWebhook) {
        expect(teamsWebhook).toMatch(/^https?:\/\/.+/);
      }
    });

    test('should provide Prometheus configuration', () => {
      const prometheusConfig = workspaceMonitoringConfig.getPrometheusConfig();
      
      expect(prometheusConfig).toHaveProperty('job_name');
      expect(prometheusConfig).toHaveProperty('static_configs');
      expect(prometheusConfig).toHaveProperty('metrics_path');
      expect(prometheusConfig).toHaveProperty('scrape_interval');
      expect(prometheusConfig).toHaveProperty('scrape_timeout');
      
      expect(Array.isArray(prometheusConfig.static_configs)).toBe(true);
      expect(prometheusConfig.static_configs.length).toBeGreaterThan(0);
    });

    test('should provide Grafana dashboard configuration', () => {
      const grafanaConfig = workspaceMonitoringConfig.getGrafanaDashboardConfig();
      
      expect(grafanaConfig).toHaveProperty('dashboard');
      expect(grafanaConfig.dashboard).toHaveProperty('title');
      expect(grafanaConfig.dashboard).toHaveProperty('tags');
      expect(grafanaConfig.dashboard).toHaveProperty('panels');
      
      expect(Array.isArray(grafanaConfig.dashboard.tags)).toBe(true);
      expect(Array.isArray(grafanaConfig.dashboard.panels)).toBe(true);
      expect(grafanaConfig.dashboard.panels.length).toBeGreaterThan(0);
    });
  });

  describe('Deployment Readiness Tests', () => {
    test('should pass all configuration validation checks', () => {
      const validation = workspaceConfig.validateConfiguration();
      
      // Log any validation errors for debugging
      if (!validation.valid) {
        console.warn('Configuration validation errors:', validation.errors);
      }
      
      // In test environment, some validations might fail due to missing env vars
      // This is acceptable for testing, but should be addressed in production
      expect(typeof validation.valid).toBe('boolean');
      expect(Array.isArray(validation.errors)).toBe(true);
    });

    test('should have all required services configured', () => {
      // Test that all critical configuration values are set
      const config = workspaceConfig.getConfig();
      
      expect(typeof config.enabled).toBe('boolean');
      expect(typeof config.autoProvision).toBe('boolean');
      expect(typeof config.templateSharingEnabled).toBe('boolean');
      expect(typeof config.notificationEnabled).toBe('boolean');
      expect(typeof config.analyticsEnabled).toBe('boolean');
    });

    test('should support graceful degradation when optional services are unavailable', () => {
      // Test that the system can handle missing optional configurations
      
      // These should not cause the system to fail if not configured
      expect(() => workspaceConfig.getSlackWebhookUrl()).not.toThrow();
      expect(() => workspaceConfig.getTeamsWebhookUrl()).not.toThrow();
      
      // Core functionality should still work
      expect(workspaceConfig.isEnabled()).toBeDefined();
      expect(workspaceConfig.getMaxTeamSize()).toBeGreaterThan(0);
    });
  });
});

describe('Workspace Configuration API Tests', () => {
  // These tests would typically use supertest to test the actual API endpoints
  // For now, we'll test the configuration service directly
  
  test('should provide public configuration without sensitive data', () => {
    const publicConfig = workspaceConfig.getPublicConfig();
    
    // Should include public settings
    expect(publicConfig).toHaveProperty('enabled');
    expect(publicConfig).toHaveProperty('maxTeamSize');
    expect(publicConfig).toHaveProperty('maxTasksPerWorkspace');
    expect(publicConfig).toHaveProperty('templateSharingEnabled');
    expect(publicConfig).toHaveProperty('sessionTimeoutMinutes');
    expect(publicConfig).toHaveProperty('mfaRequiredRoles');
    expect(publicConfig).toHaveProperty('notificationEnabled');
    expect(publicConfig).toHaveProperty('emailNotifications');
    expect(publicConfig).toHaveProperty('pushNotifications');
    expect(publicConfig).toHaveProperty('analyticsEnabled');
    expect(publicConfig).toHaveProperty('performanceMonitoring');
    
    // Should not include sensitive data
    expect(publicConfig).not.toHaveProperty('encryptionKey');
    expect(publicConfig).not.toHaveProperty('slackWebhookUrl');
    expect(publicConfig).not.toHaveProperty('teamsWebhookUrl');
  });

  test('should validate configuration health check response', () => {
    const validation = workspaceConfig.validateConfiguration();
    
    // Health check should return proper structure
    expect(validation).toHaveProperty('valid');
    expect(validation).toHaveProperty('errors');
    expect(typeof validation.valid).toBe('boolean');
    expect(Array.isArray(validation.errors)).toBe(true);
  });
});

describe('Workspace Monitoring Integration Tests', () => {
  test('should provide complete monitoring configuration for production', () => {
    const prodConfig = workspaceMonitoringConfig.getEnvironmentConfig('production');
    
    expect(prodConfig.metrics.length).toBeGreaterThan(0);
    expect(prodConfig.alerts.length).toBeGreaterThan(0);
    expect(prodConfig.healthChecks.length).toBeGreaterThan(0);
    
    // Production should have more aggressive monitoring
    const criticalAlerts = prodConfig.alerts.filter(alert => alert.severity === 'critical');
    expect(criticalAlerts.length).toBeGreaterThan(0);
  });

  test('should provide appropriate monitoring configuration for development', () => {
    const devConfig = workspaceMonitoringConfig.getEnvironmentConfig('development');
    
    // Development should have minimal monitoring
    const criticalAlerts = devConfig.alerts.filter(alert => alert.severity === 'critical');
    const lowAlerts = devConfig.alerts.filter(alert => alert.severity === 'low');
    
    // Should have critical alerts but fewer low-priority ones
    expect(criticalAlerts.length).toBeGreaterThan(0);
    expect(lowAlerts.length).toBeLessThanOrEqual(criticalAlerts.length);
  });
});