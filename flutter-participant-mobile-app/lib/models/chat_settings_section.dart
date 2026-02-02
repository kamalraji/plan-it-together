import 'package:flutter/material.dart';

/// Type-safe Chat Settings sections for navigation
/// 
/// This enum provides a centralized, type-safe definition of chat settings sections
/// used by both the navigation system (AppRoutes) and the UI (ChatSettingsNavRail).
/// 
/// Usage:
/// - Navigation: `AppRoutes.chatSettingsWithSection(ChatSettingsSection.security)`
/// - UI: `ChatSettingsNavRail(selectedSection: ChatSettingsSection.theme, ...)`
enum ChatSettingsSection {
  notifications('notifications', Icons.notifications_outlined, 'Notifications'),
  theme('theme', Icons.palette_outlined, 'Theme'),
  security('security', Icons.security_outlined, 'Security'),
  accessibility('accessibility', Icons.accessibility_new, 'Accessibility'),
  backup('backup', Icons.backup_outlined, 'Backup'),
  storage('storage', Icons.storage_outlined, 'Storage');

  const ChatSettingsSection(this.id, this.icon, this.label);
  
  /// The URL-safe identifier used in query parameters
  final String id;
  
  /// The icon displayed in the navigation rail
  final IconData icon;
  
  /// The human-readable label
  final String label;
  
  /// Safely parse a section from a string ID
  /// Returns null if the ID doesn't match any section
  static ChatSettingsSection? fromId(String? id) {
    if (id == null || id.isEmpty) return null;
    try {
      return ChatSettingsSection.values.firstWhere((s) => s.id == id);
    } catch (_) {
      return null;
    }
  }
  
  /// Get all valid section IDs for validation
  static List<String> get validIds => values.map((v) => v.id).toList();
}
