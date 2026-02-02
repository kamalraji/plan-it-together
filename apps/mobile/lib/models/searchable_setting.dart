import 'package:flutter/material.dart';

/// Represents a searchable setting option for deep search functionality
class SearchableSetting {
  final String id;
  final String categoryId;
  final String categoryTitle;
  final String label;
  final String? description;
  final IconData icon;
  final List<String> keywords;
  final SettingType type;
  
  const SearchableSetting({
    required this.id,
    required this.categoryId,
    required this.categoryTitle,
    required this.label,
    this.description,
    required this.icon,
    this.keywords = const [],
    this.type = SettingType.toggle,
  });
  
  /// Full path for display: "Category > Setting"
  String get path => '$categoryTitle > $label';
  
  /// Check if this setting matches a search query
  bool matchesQuery(String query) {
    if (query.isEmpty) return true;
    final lowerQuery = query.toLowerCase();
    return label.toLowerCase().contains(lowerQuery) ||
        (description?.toLowerCase().contains(lowerQuery) ?? false) ||
        categoryTitle.toLowerCase().contains(lowerQuery) ||
        keywords.any((k) => k.toLowerCase().contains(lowerQuery));
  }
}

enum SettingType {
  toggle,
  action,
  picker,
  info,
}

/// Registry of all searchable settings across the app
class SettingsRegistry {
  static const List<SearchableSetting> allSettings = [
    // Security
    SearchableSetting(
      id: 'security_password',
      categoryId: 'security',
      categoryTitle: 'Security',
      label: 'Change Password',
      description: 'Update your account password',
      icon: Icons.lock_outline,
      keywords: ['password', 'credentials', 'login', 'authentication'],
      type: SettingType.action,
    ),
    SearchableSetting(
      id: 'security_2fa',
      categoryId: 'security',
      categoryTitle: 'Security',
      label: 'Two-Factor Authentication',
      description: 'Add extra security to your account',
      icon: Icons.security,
      keywords: ['2fa', 'totp', 'authenticator', 'verification', 'mfa'],
      type: SettingType.action,
    ),
    SearchableSetting(
      id: 'security_sessions',
      categoryId: 'security',
      categoryTitle: 'Security',
      label: 'Active Sessions',
      description: 'Manage devices logged into your account',
      icon: Icons.devices,
      keywords: ['sessions', 'devices', 'logout', 'sign out'],
      type: SettingType.action,
    ),
    SearchableSetting(
      id: 'security_login_history',
      categoryId: 'security',
      categoryTitle: 'Security',
      label: 'Login History',
      description: 'View recent login activity',
      icon: Icons.history,
      keywords: ['history', 'activity', 'logins', 'access'],
      type: SettingType.action,
    ),
    
    // Account
    SearchableSetting(
      id: 'account_email',
      categoryId: 'account',
      categoryTitle: 'Account',
      label: 'Email Address',
      description: 'Change your email address',
      icon: Icons.email_outlined,
      keywords: ['email', 'mail', 'address', 'contact'],
      type: SettingType.action,
    ),
    SearchableSetting(
      id: 'account_username',
      categoryId: 'account',
      categoryTitle: 'Account',
      label: 'Username',
      description: 'Change your username',
      icon: Icons.alternate_email,
      keywords: ['username', 'handle', 'name', 'id'],
      type: SettingType.action,
    ),
    SearchableSetting(
      id: 'account_role',
      categoryId: 'account',
      categoryTitle: 'Account',
      label: 'Account Role',
      description: 'View your account type and permissions',
      icon: Icons.badge_outlined,
      keywords: ['role', 'type', 'permissions', 'organizer', 'participant'],
      type: SettingType.info,
    ),
    
    // Appearance
    SearchableSetting(
      id: 'appearance_theme',
      categoryId: 'appearance',
      categoryTitle: 'Appearance',
      label: 'Theme Mode',
      description: 'Light, dark, or system theme',
      icon: Icons.palette_outlined,
      keywords: ['theme', 'dark', 'light', 'mode', 'color'],
      type: SettingType.picker,
    ),
    SearchableSetting(
      id: 'appearance_text_scale',
      categoryId: 'appearance',
      categoryTitle: 'Appearance',
      label: 'Text Size',
      description: 'Adjust text scaling',
      icon: Icons.text_fields,
      keywords: ['text', 'font', 'size', 'scale', 'accessibility'],
      type: SettingType.picker,
    ),
    SearchableSetting(
      id: 'appearance_bold_text',
      categoryId: 'appearance',
      categoryTitle: 'Appearance',
      label: 'Bold Text',
      description: 'Make all text bolder for readability',
      icon: Icons.format_bold,
      keywords: ['bold', 'font', 'weight', 'accessibility'],
      type: SettingType.toggle,
    ),
    SearchableSetting(
      id: 'appearance_high_contrast',
      categoryId: 'appearance',
      categoryTitle: 'Appearance',
      label: 'High Contrast',
      description: 'Increase color contrast',
      icon: Icons.contrast,
      keywords: ['contrast', 'accessibility', 'visibility'],
      type: SettingType.toggle,
    ),
    SearchableSetting(
      id: 'appearance_reduce_motion',
      categoryId: 'appearance',
      categoryTitle: 'Appearance',
      label: 'Reduce Motion',
      description: 'Minimize animations',
      icon: Icons.animation,
      keywords: ['motion', 'animation', 'accessibility', 'vestibular'],
      type: SettingType.toggle,
    ),
    
    // Notifications
    SearchableSetting(
      id: 'notifications_events',
      categoryId: 'notifications',
      categoryTitle: 'Notifications',
      label: 'Event Notifications',
      description: 'Reminders and schedule changes',
      icon: Icons.event_outlined,
      keywords: ['events', 'reminders', 'schedule', 'alerts'],
      type: SettingType.toggle,
    ),
    SearchableSetting(
      id: 'notifications_workspace',
      categoryId: 'notifications',
      categoryTitle: 'Notifications',
      label: 'Workspace Updates',
      description: 'Task updates and mentions',
      icon: Icons.workspaces_outlined,
      keywords: ['workspace', 'tasks', 'mentions', 'updates'],
      type: SettingType.toggle,
    ),
    SearchableSetting(
      id: 'notifications_quiet_hours',
      categoryId: 'notifications',
      categoryTitle: 'Notifications',
      label: 'Quiet Hours',
      description: 'Pause notifications during set times',
      icon: Icons.bedtime_outlined,
      keywords: ['quiet', 'do not disturb', 'dnd', 'sleep', 'night'],
      type: SettingType.toggle,
    ),
    
    // Privacy
    SearchableSetting(
      id: 'privacy_online_status',
      categoryId: 'privacy',
      categoryTitle: 'Privacy',
      label: 'Online Status',
      description: 'Show when you are online',
      icon: Icons.circle_outlined,
      keywords: ['online', 'status', 'presence', 'visibility'],
      type: SettingType.toggle,
    ),
    SearchableSetting(
      id: 'privacy_read_receipts',
      categoryId: 'privacy',
      categoryTitle: 'Privacy',
      label: 'Read Receipts',
      description: 'Let others know when you read messages',
      icon: Icons.done_all,
      keywords: ['read', 'receipts', 'seen', 'messages'],
      type: SettingType.toggle,
    ),
    SearchableSetting(
      id: 'privacy_ai_matching',
      categoryId: 'privacy',
      categoryTitle: 'Privacy',
      label: 'AI Matching',
      description: 'Allow AI-powered networking suggestions',
      icon: Icons.auto_awesome,
      keywords: ['ai', 'matching', 'networking', 'recommendations'],
      type: SettingType.toggle,
    ),
    SearchableSetting(
      id: 'privacy_data_export',
      categoryId: 'privacy',
      categoryTitle: 'Privacy',
      label: 'Export Data',
      description: 'Download all your personal data',
      icon: Icons.download_outlined,
      keywords: ['export', 'download', 'gdpr', 'data', 'backup'],
      type: SettingType.action,
    ),
    
    // Chat
    SearchableSetting(
      id: 'chat_typing_indicator',
      categoryId: 'chat',
      categoryTitle: 'Chat',
      label: 'Typing Indicator',
      description: 'Show when you are typing',
      icon: Icons.keyboard,
      keywords: ['typing', 'indicator', 'status'],
      type: SettingType.toggle,
    ),
    SearchableSetting(
      id: 'chat_message_preview',
      categoryId: 'chat',
      categoryTitle: 'Chat',
      label: 'Message Previews',
      description: 'Show message content in notifications',
      icon: Icons.preview_outlined,
      keywords: ['preview', 'message', 'notification'],
      type: SettingType.toggle,
    ),
    
    // Storage
    SearchableSetting(
      id: 'storage_clear_cache',
      categoryId: 'storage',
      categoryTitle: 'Storage & Data',
      label: 'Clear Cache',
      description: 'Free up storage space',
      icon: Icons.cached,
      keywords: ['cache', 'clear', 'storage', 'space', 'memory'],
      type: SettingType.action,
    ),
    SearchableSetting(
      id: 'storage_downloads',
      categoryId: 'storage',
      categoryTitle: 'Storage & Data',
      label: 'Downloads',
      description: 'Manage downloaded files',
      icon: Icons.folder_outlined,
      keywords: ['downloads', 'files', 'documents', 'media'],
      type: SettingType.action,
    ),
    
    // Connected Accounts
    SearchableSetting(
      id: 'accounts_google',
      categoryId: 'accounts',
      categoryTitle: 'Connected Accounts',
      label: 'Google',
      description: 'Connect your Google account',
      icon: Icons.g_mobiledata,
      keywords: ['google', 'gmail', 'oauth', 'signin'],
      type: SettingType.action,
    ),
    SearchableSetting(
      id: 'accounts_apple',
      categoryId: 'accounts',
      categoryTitle: 'Connected Accounts',
      label: 'Apple',
      description: 'Connect your Apple account',
      icon: Icons.apple,
      keywords: ['apple', 'icloud', 'oauth', 'signin'],
      type: SettingType.action,
    ),
    SearchableSetting(
      id: 'accounts_github',
      categoryId: 'accounts',
      categoryTitle: 'Connected Accounts',
      label: 'GitHub',
      description: 'Connect your GitHub account',
      icon: Icons.code,
      keywords: ['github', 'developer', 'oauth', 'signin'],
      type: SettingType.action,
    ),
    
    // Backup
    SearchableSetting(
      id: 'backup_auto',
      categoryId: 'backup',
      categoryTitle: 'Backup & Restore',
      label: 'Auto Backup',
      description: 'Automatically backup your data',
      icon: Icons.backup,
      keywords: ['backup', 'auto', 'automatic', 'schedule'],
      type: SettingType.toggle,
    ),
    SearchableSetting(
      id: 'backup_restore',
      categoryId: 'backup',
      categoryTitle: 'Backup & Restore',
      label: 'Restore Backup',
      description: 'Restore from a previous backup',
      icon: Icons.restore,
      keywords: ['restore', 'recovery', 'backup', 'import'],
      type: SettingType.action,
    ),
    
    // About
    SearchableSetting(
      id: 'about_version',
      categoryId: 'about',
      categoryTitle: 'Help & About',
      label: 'App Version',
      description: 'View current version and updates',
      icon: Icons.info_outline,
      keywords: ['version', 'update', 'changelog', 'release'],
      type: SettingType.info,
    ),
    SearchableSetting(
      id: 'about_licenses',
      categoryId: 'about',
      categoryTitle: 'Help & About',
      label: 'Open Source Licenses',
      description: 'View third-party licenses',
      icon: Icons.article_outlined,
      keywords: ['licenses', 'open source', 'credits', 'legal'],
      type: SettingType.action,
    ),
    SearchableSetting(
      id: 'about_support',
      categoryId: 'about',
      categoryTitle: 'Help & About',
      label: 'Contact Support',
      description: 'Get help with your account',
      icon: Icons.help_outline,
      keywords: ['support', 'help', 'contact', 'feedback'],
      type: SettingType.action,
    ),
  ];
  
  /// Search all settings and return matches
  static List<SearchableSetting> search(String query) {
    if (query.isEmpty) return [];
    return allSettings
        .where((s) => s.matchesQuery(query))
        .toList();
  }
  
  /// Get settings by category ID
  static List<SearchableSetting> byCategory(String categoryId) {
    return allSettings
        .where((s) => s.categoryId == categoryId)
        .toList();
  }
}
