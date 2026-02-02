import 'package:flutter/material.dart';

/// Type-safe Settings sections for navigation
/// 
/// This enum provides a centralized, type-safe definition of settings sections
/// used by both the navigation system (AppRoutes) and the UI (SettingsPage).
/// 
/// Usage:
/// - Navigation: `AppRoutes.settingsWithSection(SettingsSection.security)`
/// - UI: `_onCategoryTap(SettingsSection.privacy)`
enum SettingsSection {
  security('security', Icons.security, 'Security'),
  account('account', Icons.person_outline, 'Account'),
  appearance('appearance', Icons.palette_outlined, 'Appearance'),
  language('language', Icons.language, 'Language & Region'),
  notifications('notifications', Icons.notifications_outlined, 'Notifications'),
  chat('chat', Icons.chat_bubble_outline, 'Chat'),
  privacy('privacy', Icons.lock_outline, 'Privacy'),
  accounts('accounts', Icons.link, 'Connected Accounts'),
  storage('storage', Icons.storage, 'Storage & Data'),
  backup('backup', Icons.backup, 'Backup & Restore'),
  about('about', Icons.help_outline, 'Help & About');

  const SettingsSection(this.id, this.icon, this.label);
  
  /// The URL-safe identifier used in query parameters
  final String id;
  
  /// The icon displayed in the navigation
  final IconData icon;
  
  /// The human-readable label
  final String label;
  
  /// Safely parse a section from a string ID
  /// Returns null if the ID doesn't match any section
  static SettingsSection? fromId(String? id) {
    if (id == null || id.isEmpty) return null;
    try {
      return SettingsSection.values.firstWhere((s) => s.id == id);
    } catch (_) {
      return null;
    }
  }
  
  /// Get all valid section IDs for validation
  static List<String> get validIds => values.map((v) => v.id).toList();
}
