import 'package:flutter/material.dart';
import '../../models/security_preferences_models.dart';
import '../../services/enhanced_security_service.dart';

class SecurityNotificationPrefsSheet extends StatefulWidget {
  const SecurityNotificationPrefsSheet({super.key});

  @override
  State<SecurityNotificationPrefsSheet> createState() => _SecurityNotificationPrefsSheetState();
}

class _SecurityNotificationPrefsSheetState extends State<SecurityNotificationPrefsSheet> {
  final _securityService = EnhancedSecurityService.instance;
  bool _loading = true;
  bool _saving = false;
  late SecurityNotificationPreferences _prefs;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final prefs = await _securityService.getNotificationPreferences();
    if (mounted) {
      setState(() {
        _prefs = prefs;
        _loading = false;
      });
    }
  }

  Future<void> _updatePrefs(SecurityNotificationPreferences newPrefs) async {
    setState(() {
      _prefs = newPrefs;
      _saving = true;
    });

    final success = await _securityService.updateNotificationPreferences(newPrefs);
    
    if (mounted) {
      setState(() => _saving = false);
      if (!success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to update preferences'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: theme.colorScheme.onSurface.withOpacity(0.2),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.notifications_active_outlined,
                    color: theme.colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Security Alerts',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Choose how you get notified',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurface.withOpacity(0.6),
                        ),
                      ),
                    ],
                  ),
                ),
                if (_saving)
                  const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
              ],
            ),
          ),
          
          const Divider(height: 1),
          
          if (_loading)
            const Padding(
              padding: EdgeInsets.all(40),
              child: CircularProgressIndicator(),
            )
          else
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Email Notifications Section
                    _buildSectionHeader(
                      context,
                      'Email Notifications',
                      Icons.email_outlined,
                    ),
                    const SizedBox(height: 12),
                    
                    _buildToggleTile(
                      context,
                      'New Login Alerts',
                      'Get notified when someone logs into your account',
                      _prefs.emailOnNewLogin,
                      (v) => _updatePrefs(_prefs.copyWith(emailOnNewLogin: v)),
                    ),
                    _buildToggleTile(
                      context,
                      'Password Changes',
                      'Get notified when your password is changed',
                      _prefs.emailOnPasswordChange,
                      (v) => _updatePrefs(_prefs.copyWith(emailOnPasswordChange: v)),
                    ),
                    _buildToggleTile(
                      context,
                      '2FA Changes',
                      'Get notified when 2FA settings are modified',
                      _prefs.emailOn2faChange,
                      (v) => _updatePrefs(_prefs.copyWith(emailOn2faChange: v)),
                    ),
                    _buildToggleTile(
                      context,
                      'Suspicious Activity',
                      'Get notified about unusual account activity',
                      _prefs.emailOnSuspiciousActivity,
                      (v) => _updatePrefs(_prefs.copyWith(emailOnSuspiciousActivity: v)),
                    ),
                    
                    const SizedBox(height: 24),
                    
                    // Push Notifications Section
                    _buildSectionHeader(
                      context,
                      'Push Notifications',
                      Icons.phone_android_outlined,
                    ),
                    const SizedBox(height: 12),
                    
                    _buildToggleTile(
                      context,
                      'New Login Alerts',
                      'Real-time alerts for new logins',
                      _prefs.pushOnNewLogin,
                      (v) => _updatePrefs(_prefs.copyWith(pushOnNewLogin: v)),
                    ),
                    _buildToggleTile(
                      context,
                      'Password Changes',
                      'Instant notification on password change',
                      _prefs.pushOnPasswordChange,
                      (v) => _updatePrefs(_prefs.copyWith(pushOnPasswordChange: v)),
                    ),
                    _buildToggleTile(
                      context,
                      '2FA Changes',
                      'Alert when 2FA is modified',
                      _prefs.pushOn2faChange,
                      (v) => _updatePrefs(_prefs.copyWith(pushOn2faChange: v)),
                    ),
                    _buildToggleTile(
                      context,
                      'Suspicious Activity',
                      'Immediate alert for suspicious events',
                      _prefs.pushOnSuspiciousActivity,
                      (v) => _updatePrefs(_prefs.copyWith(pushOnSuspiciousActivity: v)),
                    ),
                    
                    const SizedBox(height: 24),
                    
                    // Summary Section
                    _buildSectionHeader(
                      context,
                      'Summary',
                      Icons.summarize_outlined,
                    ),
                    const SizedBox(height: 12),
                    
                    _buildToggleTile(
                      context,
                      'Weekly Security Digest',
                      'Get a weekly summary of your account security',
                      _prefs.weeklySecurityDigest,
                      (v) => _updatePrefs(_prefs.copyWith(weeklySecurityDigest: v)),
                    ),
                    
                    const SizedBox(height: 16),
                    
                    // Info card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.shield_outlined,
                            color: theme.colorScheme.primary,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'We recommend keeping all security alerts enabled for maximum protection.',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.primary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title, IconData icon) {
    final theme = Theme.of(context);
    
    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: theme.colorScheme.primary,
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildToggleTile(
    BuildContext context,
    String title,
    String subtitle,
    bool value,
    void Function(bool) onChanged,
  ) {
    final theme = Theme.of(context);
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.3),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.6),
                    ),
                  ),
                ],
              ),
            ),
            Switch(
              value: value,
              onChanged: _saving ? null : onChanged,
            ),
          ],
        ),
      ),
    );
  }
}
