import 'package:flutter/material.dart';

/// Configuration class for intent types in the Pulse discovery feature.
/// Maps each LookingFor type to visual metadata for the Intent Selector cards.
class IntentConfig {
  final String key;
  final String label;
  final IconData icon;
  final Color color;
  final String description;
  final String? complementaryKey; // For matching: MENTOR shows MENTEE profiles

  const IntentConfig({
    required this.key,
    required this.label,
    required this.icon,
    required this.color,
    required this.description,
    this.complementaryKey,
  });

  /// All available intent configurations (DATING moved to last)
  static const List<IntentConfig> all = [
    IntentConfig(
      key: 'FRIENDS',
      label: 'Friends',
      icon: Icons.people_rounded,
      color: Color(0xFF2196F3), // Blue
      description: 'Meet new friends',
    ),
    IntentConfig(
      key: 'COFOUNDER',
      label: 'Co-Founder',
      icon: Icons.rocket_launch_rounded,
      color: Color(0xFF673AB7), // Deep Purple
      description: 'Find a startup partner',
    ),
    IntentConfig(
      key: 'PROJECT_PARTNER',
      label: 'Project Partner',
      icon: Icons.handshake_rounded,
      color: Color(0xFF009688), // Teal
      description: 'Collaborate on projects',
    ),
    IntentConfig(
      key: 'STUDY_GROUP',
      label: 'Study Buddy',
      icon: Icons.school_rounded,
      color: Color(0xFFFF9800), // Orange
      description: 'Study together',
    ),
    IntentConfig(
      key: 'HACKATHON_TEAM',
      label: 'Hackathon',
      icon: Icons.code_rounded,
      color: Color(0xFF4CAF50), // Green
      description: 'Build together',
    ),
    IntentConfig(
      key: 'MENTOR',
      label: 'Mentor',
      icon: Icons.psychology_rounded,
      color: Color(0xFF3F51B5), // Indigo
      description: 'Get guidance',
      complementaryKey: 'MENTEE',
    ),
    IntentConfig(
      key: 'MENTEE',
      label: 'Mentee',
      icon: Icons.spa_rounded,
      color: Color(0xFF8BC34A), // Light Green
      description: 'Share your knowledge',
      complementaryKey: 'MENTOR',
    ),
    IntentConfig(
      key: 'JOB',
      label: 'Job',
      icon: Icons.work_rounded,
      color: Color(0xFF607D8B), // Blue Grey
      description: 'Find opportunities',
      complementaryKey: 'HIRE',
    ),
    IntentConfig(
      key: 'HIRE',
      label: 'Hire',
      icon: Icons.person_search_rounded,
      color: Color(0xFF00BCD4), // Cyan
      description: 'Find talent',
      complementaryKey: 'JOB',
    ),
    IntentConfig(
      key: 'NETWORKING',
      label: 'Networking',
      icon: Icons.hub_rounded,
      color: Color(0xFF9C27B0), // Purple
      description: 'Expand your network',
    ),
    IntentConfig(
      key: 'DATING',
      label: 'Dating',
      icon: Icons.favorite_rounded,
      color: Color(0xFFE91E63), // Pink
      description: 'Find a romantic connection',
    ),
  ];

  /// Get config by key
  static IntentConfig? getByKey(String key) {
    try {
      return all.firstWhere((config) => config.key == key);
    } catch (_) {
      return null;
    }
  }

  /// Get the complementary config (e.g., MENTOR -> MENTEE config)
  IntentConfig? get complementary {
    if (complementaryKey == null) return null;
    return getByKey(complementaryKey!);
  }
}
