import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/theme.dart';
import '../../models/settings_models.dart';
import '../../services/accessibility_service.dart';
import '../../services/device_fingerprint_service.dart';
import '../../services/enhanced_security_service.dart';
import '../../widgets/settings_components.dart';
import '../../widgets/security/change_password_sheet.dart';
import '../../services/privacy_service.dart';
import '../../widgets/security/two_factor_setup_sheet.dart';
import '../../widgets/security/backup_codes_sheet.dart';
import '../../widgets/security/recovery_options_sheet.dart';
import '../../widgets/security/security_score_card.dart';
import '../../widgets/security/session_timeout_sheet.dart';
import '../../widgets/security/security_notification_prefs_sheet.dart';
import '../../widgets/security/login_attempts_sheet.dart';
import '../../widgets/security/audit_export_sheet.dart';
import '../../widgets/security/trusted_devices_sheet.dart';
import '../../widgets/security/geo_security_card.dart';
import '../../widgets/security/rate_limiting_card.dart';
import '../../widgets/security/sensitive_operation_guard.dart';

import 'package:thittam1hub/services/logging_service.dart';
/// Dedicated security settings page with session management and login history
class SecuritySettingsPage extends StatefulWidget {
  const SecuritySettingsPage({super.key});

  @override
  State<SecuritySettingsPage> createState() => _SecuritySettingsPageState();
}

class _SecuritySettingsPageState extends State<SecuritySettingsPage>
    with SingleTickerProviderStateMixin {
  // Logging
  static final _log = LoggingService.instance;
  static const String _tag = 'SecuritySettingsPage';
  
  late TabController _tabController;
  final _operationGuard = SensitiveOperationGuard.instance;
  final _securityService = EnhancedSecurityService.instance;
  
  List<UserSession> _sessions = [];
  List<LoginHistoryEntry> _loginHistory = [];
  bool _isLoading = true;
  bool _twoFactorEnabled = false;
  bool _stepUpAuthEnabled = true;
  DateTime? _passwordLastChanged;
  String? _recoveryEmail;
  String? _recoveryPhone;
  bool _recoveryEmailVerified = false;
  bool _recoveryPhoneVerified = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
    _loadMFAStatus();
    _loadSecurityPreferences();
  }
  
  Future<void> _loadSecurityPreferences() async {
    try {
      final prefs = await _securityService.getSecurityPreferences();
      if (mounted) {
        setState(() {
          _stepUpAuthEnabled = prefs.requireReauthenticationSensitive;
        });
      }
    } catch (e) {
      _log.error('Error loading security preferences: $e', tag: _tag);
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    try {
      final sessions = await SessionService.getActiveSessions();
      final history = await SessionService.getLoginHistory();
      
      if (mounted) {
        setState(() {
          _sessions = sessions;
          _loginHistory = history;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _loadMFAStatus() async {
    try {
      final factors = await Supabase.instance.client.auth.mfa.listFactors();
      if (mounted) {
        setState(() {
          _twoFactorEnabled = factors.totp.isNotEmpty && 
              factors.totp.any((f) => f.status == FactorStatus.verified);
        });
      }
    } catch (e) {
      _log.error('Error loading MFA status: $e', tag: _tag);
    }
  }

  int _calculateSecurityScore() {
    int score = 20; // Base score for having an account
    
    if (_passwordLastChanged != null) {
      final daysSinceChange = DateTime.now().difference(_passwordLastChanged!).inDays;
      if (daysSinceChange < 90) score += 20;
      else if (daysSinceChange < 180) score += 10;
    }
    
    if (_twoFactorEnabled) score += 30;
    if (_recoveryEmailVerified) score += 15;
    if (_recoveryPhoneVerified) score += 15;
    
    return score.clamp(0, 100);
  }

  List<SecurityRecommendation> _getRecommendations() {
    final recommendations = <SecurityRecommendation>[];
    
    if (!_twoFactorEnabled) {
      recommendations.add(SecurityRecommendation(
        title: 'Enable Two-Factor Authentication',
        icon: Icons.security,
        color: Colors.orange,
        points: 30,
        onTap: () => _toggleTwoFactor(true),
      ));
    }
    
    if (!_recoveryEmailVerified) {
      recommendations.add(SecurityRecommendation(
        title: 'Add Recovery Email',
        icon: Icons.email_outlined,
        color: Colors.blue,
        points: 15,
        onTap: _setupRecoveryEmail,
      ));
    }
    
    if (!_recoveryPhoneVerified) {
      recommendations.add(SecurityRecommendation(
        title: 'Add Recovery Phone',
        icon: Icons.phone_outlined,
        color: Colors.green,
        points: 15,
        onTap: _setupRecoveryPhone,
      ));
    }
    
    return recommendations;
  }

  Future<void> _terminateSession(UserSession session) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign Out Device'),
        content: Text('Are you sure you want to sign out "${session.displayName}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(ctx).colorScheme.error,
            ),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await SessionService.terminateSession(session.id);
        _loadData();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Device signed out successfully')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to sign out device: $e')),
          );
        }
      }
    }
  }

  Future<void> _terminateAllOtherSessions() async {
    // Step-up auth for session termination
    final authorized = await _operationGuard.guard(
      context,
      operation: SensitiveOperationType.sessionTermination,
    );
    
    if (!authorized || !mounted) return;
    
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign Out All Other Devices'),
        content: const Text(
          'This will sign out all devices except your current one. '
          'You\'ll need to sign in again on those devices.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(ctx).colorScheme.error,
            ),
            child: const Text('Sign Out All'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await SessionService.terminateAllOtherSessions();
        _loadData();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('All other devices signed out')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to sign out devices: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Security'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Account', icon: Icon(Icons.lock_outline)),
            Tab(text: 'Sessions', icon: Icon(Icons.devices)),
            Tab(text: 'History', icon: Icon(Icons.history)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildAccountTab(theme, colorScheme),
          _buildSessionsTab(theme, colorScheme),
          _buildHistoryTab(theme, colorScheme),
        ],
      ),
    );
  }

  Widget _buildAccountTab(ThemeData theme, ColorScheme colorScheme) {
    final horizontalPadding = MediaQuery.of(context).size.width < 600 ? 16.0 : (MediaQuery.of(context).size.width < 1200 ? 24.0 : 32.0);
    return ListView(
      padding: EdgeInsets.symmetric(horizontal: horizontalPadding, vertical: 16),
      children: [
        // Security Score Card
        SecurityScoreCard(
          score: _calculateSecurityScore(),
          recommendations: _getRecommendations(),
        ),
        const SizedBox(height: 20),

        // Password Section
        SettingsSection(
          title: 'Password',
          icon: Icons.password,
          iconColor: colorScheme.primary,
          initiallyExpanded: true,
          children: [
            SettingsAction(
              label: 'Change Password',
              subtitle: _passwordLastChanged != null
                  ? 'Last changed ${_formatDate(_passwordLastChanged!)}'
                  : 'Set a new password',
              icon: Icons.key,
              onTap: _showChangePasswordDialog,
            ),
          ],
        ),
        
        const SizedBox(height: 16),
        
        // Two-Factor Authentication
        SettingsSection(
          title: 'Two-Factor Authentication',
          icon: Icons.security,
          iconColor: _twoFactorEnabled ? Colors.green : colorScheme.secondary,
          initiallyExpanded: true,
          helpText: 'Two-factor authentication (2FA) adds an extra layer of security to your account. '
              'When enabled, you\'ll need to enter a code from your authenticator app in addition to your password when signing in. '
              'This protects your account even if your password is compromised.',
          trailing: _twoFactorEnabled
              ? Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'ENABLED',
                    style: TextStyle(
                      color: Colors.green,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                )
              : null,
          children: [
            SettingsToggle(
              label: 'Enable 2FA',
              subtitle: _twoFactorEnabled 
                  ? 'Your account is protected with 2FA'
                  : 'Add an extra layer of security',
              icon: Icons.phonelink_lock,
              value: _twoFactorEnabled,
              onChanged: _toggleTwoFactor,
              helpText: 'Recommended apps: Google Authenticator, Authy, or Microsoft Authenticator. '
                  'Store your backup codes in a safe place in case you lose access to your authenticator app.',
            ),
            if (_twoFactorEnabled) ...[
              SettingsAction(
                label: 'Backup Codes',
                subtitle: 'View or regenerate backup codes',
                icon: Icons.vpn_key,
                onTap: _showBackupCodes,
              ),
              SettingsAction(
                label: 'Authenticator App',
                subtitle: 'Manage authenticator app',
                icon: Icons.qr_code,
                onTap: _manageAuthenticator,
              ),
            ],
          ],
        ),
        
        const SizedBox(height: 16),
        
        // Recovery Options
        SettingsSection(
          title: 'Account Recovery',
          icon: Icons.restore,
          iconColor: colorScheme.tertiary,
          helpText: 'Recovery options help you regain access to your account if you forget your password or lose access to your 2FA device. '
              'We recommend setting up both email and phone recovery for maximum protection.',
          children: [
            SettingsAction(
              label: 'Recovery Email',
              subtitle: _recoveryEmailVerified 
                  ? '$_recoveryEmail ✓'
                  : _recoveryEmail ?? 'Set up a backup email address',
              icon: Icons.email_outlined,
              onTap: _setupRecoveryEmail,
              trailing: _recoveryEmailVerified
                  ? const Icon(Icons.check_circle, color: Colors.green, size: 20)
                  : null,
            ),
            SettingsAction(
              label: 'Recovery Phone',
              subtitle: _recoveryPhoneVerified 
                  ? '$_recoveryPhone ✓'
                  : _recoveryPhone ?? 'Add a phone number for recovery',
              icon: Icons.phone_outlined,
              onTap: _setupRecoveryPhone,
              trailing: _recoveryPhoneVerified
                  ? const Icon(Icons.check_circle, color: Colors.green, size: 20)
                  : null,
            ),
          ],
        ),
        
        const SizedBox(height: 16),
        
        // Activity & Monitoring
        SettingsSection(
          title: 'Activity & Monitoring',
          icon: Icons.history,
          iconColor: Colors.indigo,
          children: [
            SettingsAction(
              label: 'Security Activity',
              subtitle: 'View password changes, logins, 2FA events, and more',
              icon: Icons.timeline,
              onTap: () => context.push(AppRoutes.securityActivity),
            ),
            SettingsAction(
              label: 'Login History',
              subtitle: 'View recent login attempts and locations',
              icon: Icons.login,
              onTap: () => _showLoginHistory(),
            ),
            SettingsAction(
              label: 'Export Audit Log',
              subtitle: 'Download your security activity report',
              icon: Icons.download,
              onTap: () => _showAuditExport(),
            ),
          ],
        ),
        
        const SizedBox(height: 16),
        
        // Advanced Security
        SettingsSection(
          title: 'Advanced Security',
          icon: Icons.admin_panel_settings,
          iconColor: Colors.deepPurple,
          children: [
            SettingsToggle(
              label: 'Require Re-authentication',
              subtitle: 'Verify identity for sensitive operations',
              icon: Icons.verified_user,
              value: _stepUpAuthEnabled,
              onChanged: _toggleStepUpAuth,
            ),
            SettingsAction(
              label: 'Session Timeout',
              subtitle: 'Configure auto-logout after inactivity',
              icon: Icons.timer_outlined,
              onTap: () => _showSessionTimeout(),
            ),
            SettingsAction(
              label: 'Security Alerts',
              subtitle: 'Configure email and push notifications',
              icon: Icons.notifications_active_outlined,
              onTap: () => _showSecurityNotificationPrefs(),
            ),
            SettingsAction(
              label: 'Trusted Devices',
              subtitle: 'Manage devices that skip verification',
              icon: Icons.devices,
              onTap: () => _showTrustedDevices(),
            ),
          ],
        ),
        
        const SizedBox(height: 16),
        
        // Security Tips
        _buildSecurityTipsCard(theme, colorScheme),
      ],
    );
  }

  Widget _buildSessionsTab(ThemeData theme, ColorScheme colorScheme) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_sessions.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: colorScheme.surfaceContainerHighest,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.devices,
                size: 48,
                color: colorScheme.outline,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'No active sessions',
              style: theme.textTheme.titleMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your session information will appear here',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colorScheme.outline,
              ),
            ),
          ],
        ),
      );
    }

    final horizontalPadding = MediaQuery.of(context).size.width < 600 ? 16.0 : (MediaQuery.of(context).size.width < 1200 ? 24.0 : 32.0);
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: EdgeInsets.symmetric(horizontal: horizontalPadding, vertical: 16),
        children: [
          // Current Session
          if (_sessions.any((s) => s.isCurrent)) ...[
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.circle, size: 8, color: Colors.green),
                ),
                const SizedBox(width: 8),
                Text(
                  'Current Session',
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: colorScheme.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ..._sessions.where((s) => s.isCurrent).map((session) => 
              _buildSessionCard(session, theme, colorScheme, isCurrent: true)
            ),
            const SizedBox(height: 24),
          ],
          
          // Other Sessions
          if (_sessions.any((s) => !s.isCurrent)) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Other Sessions (${_sessions.where((s) => !s.isCurrent).length})',
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton.icon(
                  onPressed: _terminateAllOtherSessions,
                  icon: const Icon(Icons.logout, size: 18),
                  label: const Text('Sign Out All'),
                  style: TextButton.styleFrom(
                    foregroundColor: colorScheme.error,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ..._sessions.where((s) => !s.isCurrent).map((session) => 
              _buildSessionCard(session, theme, colorScheme)
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSessionCard(
    UserSession session,
    ThemeData theme,
    ColorScheme colorScheme, {
    bool isCurrent = false,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isCurrent 
                    ? colorScheme.primaryContainer 
                    : colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                session.deviceIcon,
                style: const TextStyle(fontSize: 24),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          session.displayName,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (isCurrent) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.green,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            'This device',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  if (session.os != null || session.browser != null)
                    Text(
                      [session.browser, session.os].where((s) => s != null).join(' • '),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  Row(
                    children: [
                      Icon(Icons.location_on, size: 12, color: colorScheme.outline),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          session.location ?? session.ipAddress ?? 'Unknown location',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.outline,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    'Last active: ${_formatDateTime(session.lastActiveAt)}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.outline,
                    ),
                  ),
                ],
              ),
            ),
            if (!isCurrent)
              IconButton(
                onPressed: () => _terminateSession(session),
                icon: const Icon(Icons.logout),
                color: colorScheme.error,
                tooltip: 'Sign out this device',
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryTab(ThemeData theme, ColorScheme colorScheme) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    // Check for suspicious activity
    final failedAttempts = _loginHistory.where((e) => !e.success).length;
    final hasRecentFailures = _loginHistory.take(5).any((e) => !e.success);

    if (_loginHistory.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: colorScheme.surfaceContainerHighest,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.history,
                size: 48,
                color: colorScheme.outline,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'No login history',
              style: theme.textTheme.titleMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your login history will appear here',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colorScheme.outline,
              ),
            ),
          ],
        ),
      );
    }

    final horizontalPadding = MediaQuery.of(context).size.width < 600 ? 16.0 : (MediaQuery.of(context).size.width < 1200 ? 24.0 : 32.0);
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: EdgeInsets.symmetric(horizontal: horizontalPadding, vertical: 16),
        children: [
          // Rate limiting status card
          const RateLimitingCard(),
          const SizedBox(height: 16),
          
          // Geo security card showing login locations
          const GeoSecurityCard(),
          const SizedBox(height: 16),
          
          // Security alert for failed attempts
          if (hasRecentFailures) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.orange.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.orange.withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.warning_amber, color: Colors.orange.shade700),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Suspicious Activity Detected',
                          style: TextStyle(
                            color: Colors.orange.shade800,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '$failedAttempts failed login attempt${failedAttempts > 1 ? 's' : ''} recently',
                          style: TextStyle(
                            color: Colors.orange.shade700,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: _showChangePasswordDialog,
                    child: const Text('Secure'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Stats summary
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Total Logins',
                  _loginHistory.where((e) => e.success).length.toString(),
                  Icons.login,
                  Colors.green,
                  colorScheme,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'Failed Attempts',
                  failedAttempts.toString(),
                  Icons.block,
                  failedAttempts > 0 ? Colors.orange : Colors.grey,
                  colorScheme,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          
          // Geo Security Card - Login Locations Map
          GeoSecurityCard(
            maxLocations: 5,
            onViewAll: () => _showLoginHistory(),
          ),
          const SizedBox(height: 20),

          // History list
          Text(
            'Recent Activity',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 12),
          ..._loginHistory.map((entry) => _buildHistoryEntry(entry, theme, colorScheme)),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    String label,
    String value,
    IconData icon,
    Color color,
    ColorScheme colorScheme,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: color, size: 20),
                const SizedBox(width: 8),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: colorScheme.onSurfaceVariant,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryEntry(
    LoginHistoryEntry entry,
    ThemeData theme,
    ColorScheme colorScheme,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: entry.success 
                ? Colors.green.withOpacity(0.1)
                : colorScheme.errorContainer,
            shape: BoxShape.circle,
          ),
          child: Icon(
            entry.success ? Icons.check : Icons.close,
            color: entry.success ? Colors.green : colorScheme.error,
            size: 20,
          ),
        ),
        title: Text(
          entry.success ? 'Successful login' : 'Failed login attempt',
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w500,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.location_on, size: 12, color: colorScheme.outline),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    entry.location ?? entry.ipAddress ?? 'Unknown location',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            if (entry.browser != null || entry.os != null)
              Text(
                [entry.browser, entry.os].where((s) => s != null).join(' • '),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colorScheme.outline,
                ),
              ),
            if (!entry.success && entry.failureReason != null)
              Text(
                entry.failureReason!,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colorScheme.error,
                ),
              ),
          ],
        ),
        trailing: Text(
          _formatDateTime(entry.createdAt),
          style: theme.textTheme.bodySmall?.copyWith(
            color: colorScheme.outline,
          ),
        ),
        isThreeLine: true,
      ),
    );
  }

  Widget _buildSecurityTipsCard(ThemeData theme, ColorScheme colorScheme) {
    return Card(
      color: colorScheme.primaryContainer.withOpacity(0.5),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.tips_and_updates, color: colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  'Security Tips',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: colorScheme.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildTip('Use a strong, unique password', _passwordLastChanged != null, colorScheme),
            _buildTip('Enable two-factor authentication', _twoFactorEnabled, colorScheme),
            _buildTip('Add recovery options', _recoveryEmailVerified || _recoveryPhoneVerified, colorScheme),
            _buildTip('Review active sessions regularly', true, colorScheme),
            _buildTip('Never share your login credentials', true, colorScheme),
          ],
        ),
      ),
    );
  }

  Widget _buildTip(String text, bool completed, ColorScheme colorScheme) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(
            completed ? Icons.check_circle : Icons.circle_outlined,
            size: 16,
            color: completed ? Colors.green : colorScheme.outline,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 13,
                color: completed 
                    ? colorScheme.onSurface 
                    : colorScheme.onSurfaceVariant,
                decoration: completed ? null : TextDecoration.none,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  String _formatDateTime(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return _formatDate(date);
  }

  // ==================== ACTION METHODS ====================

  void _showChangePasswordDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ChangePasswordSheet(
        onSuccess: () {
          setState(() => _passwordLastChanged = DateTime.now());
        },
      ),
    );
  }

  void _toggleTwoFactor(bool value) async {
    if (value) {
      // Enable 2FA - show setup flow
      final result = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (context) => TwoFactorSetupSheet(
          onSuccess: () {
            setState(() => _twoFactorEnabled = true);
          },
        ),
      );
      
      if (result == true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Two-factor authentication enabled'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } else {
      // Disable 2FA - requires step-up auth for this sensitive operation
      final authorized = await _operationGuard.guard(
        context,
        operation: SensitiveOperationType.twoFactorChange,
      );
      
      if (!authorized || !mounted) return;
      
      // Confirm after auth
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Disable 2FA?'),
          content: const Text(
            'Disabling two-factor authentication will make your account less secure. '
            'Are you sure you want to continue?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: FilledButton.styleFrom(
                backgroundColor: Theme.of(ctx).colorScheme.error,
              ),
              child: const Text('Disable 2FA'),
            ),
          ],
        ),
      );

      if (confirmed == true) {
        try {
          final factors = await Supabase.instance.client.auth.mfa.listFactors();
          for (final factor in factors.totp) {
            await Supabase.instance.client.auth.mfa.unenroll(factor.id);
          }
          
          setState(() => _twoFactorEnabled = false);
          
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Two-factor authentication disabled')),
            );
          }
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Failed to disable 2FA: $e')),
            );
          }
        }
      }
    }
  }

  void _showBackupCodes() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const BackupCodesSheet(),
    );
  }

  void _manageAuthenticator() async {
    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Authenticator App'),
        content: const Text(
          'Your account is secured with an authenticator app. '
          'You can regenerate the QR code if you need to set up a new device.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, 'cancel'),
            child: const Text('Cancel'),
          ),
          OutlinedButton(
            onPressed: () => Navigator.pop(ctx, 'regenerate'),
            child: const Text('Regenerate QR'),
          ),
        ],
      ),
    );

    if (result == 'regenerate' && mounted) {
      // First disable, then re-enable to get new QR
      // _toggleTwoFactor is void, so we call it and check state afterward
      _toggleTwoFactor(false);
      // Wait for state to update before re-enabling
      await Future.delayed(const Duration(milliseconds: 500));
      if (!_twoFactorEnabled) {
        _toggleTwoFactor(true);
      }
    }
  }

  void _setupRecoveryEmail() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => RecoveryOptionsSheet(
        type: RecoveryType.email,
        currentValue: _recoveryEmail,
        isVerified: _recoveryEmailVerified,
        onSave: (email) {
          setState(() {
            _recoveryEmail = email;
            _recoveryEmailVerified = true;
          });
        },
      ),
    );
  }

  void _setupRecoveryPhone() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => RecoveryOptionsSheet(
        type: RecoveryType.phone,
        currentValue: _recoveryPhone,
        isVerified: _recoveryPhoneVerified,
        onSave: (phone) {
          setState(() {
            _recoveryPhone = phone;
            _recoveryPhoneVerified = true;
          });
        },
      ),
    );
  }

  void _showSessionTimeout() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const SessionTimeoutSheet(),
    );
  }

  void _showSecurityNotificationPrefs() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const SecurityNotificationPrefsSheet(),
    );
  }

  void _showLoginHistory() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const LoginAttemptsSheet(),
    );
  }

  void _showAuditExport() async {
    // Step-up auth for data export
    final authorized = await _operationGuard.guard(
      context,
      operation: SensitiveOperationType.dataExport,
    );
    
    if (!authorized || !mounted) return;
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const AuditExportSheet(),
    );
  }

  void _toggleStepUpAuth(bool value) async {
    final success = await _securityService.updateRequireReauthentication(value);
    if (success && mounted) {
      setState(() => _stepUpAuthEnabled = value);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(value 
              ? 'Re-authentication enabled for sensitive operations'
              : 'Re-authentication disabled'),
        ),
      );
    }
  }

  void _showTrustedDevices() async {
    final privacyService = PrivacyService.instance;
    await privacyService.loadTrustedDevices();
    
    if (!mounted) return;
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => TrustedDevicesSheet(
        devices: privacyService.trustedDevices,
        onUpdated: () => _loadData(),
      ),
    );
  }
}
