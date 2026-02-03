import 'package:flutter/material.dart';

/// Chat theme settings model for persisting user preferences
class ChatThemeSettings {
  final String id;
  final String userId;
  final String selectedTheme;
  final String accentColor;
  final String bubbleStyle;
  final int fontSize;
  final bool reducedMotion;
  final DateTime createdAt;
  final DateTime updatedAt;

  const ChatThemeSettings({
    required this.id,
    required this.userId,
    this.selectedTheme = 'default',
    this.accentColor = '#8B5CF6',
    this.bubbleStyle = 'modern',
    this.fontSize = 16,
    this.reducedMotion = false,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Create default settings for a user
  factory ChatThemeSettings.defaults(String userId) {
    final now = DateTime.now();
    return ChatThemeSettings(
      id: '',
      userId: userId,
      selectedTheme: 'default',
      accentColor: '#8B5CF6',
      bubbleStyle: 'modern',
      fontSize: 16,
      reducedMotion: false,
      createdAt: now,
      updatedAt: now,
    );
  }

  /// Parse from Supabase JSON response
  factory ChatThemeSettings.fromJson(Map<String, dynamic> json) {
    return ChatThemeSettings(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      selectedTheme: json['selected_theme'] as String? ?? 'default',
      accentColor: json['accent_color'] as String? ?? '#8B5CF6',
      bubbleStyle: json['bubble_style'] as String? ?? 'modern',
      fontSize: json['font_size'] as int? ?? 16,
      reducedMotion: json['reduced_motion'] as bool? ?? false,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : DateTime.now(),
    );
  }

  /// Convert to JSON for Supabase upsert
  Map<String, dynamic> toJson() {
    return {
      if (id.isNotEmpty) 'id': id,
      'user_id': userId,
      'selected_theme': selectedTheme,
      'accent_color': accentColor,
      'bubble_style': bubbleStyle,
      'font_size': fontSize,
      'reduced_motion': reducedMotion,
      'updated_at': DateTime.now().toIso8601String(),
    };
  }

  /// Convert to SharedPreferences-friendly map (for local caching)
  Map<String, dynamic> toLocalJson() {
    return {
      'id': id,
      'user_id': userId,
      'selected_theme': selectedTheme,
      'accent_color': accentColor,
      'bubble_style': bubbleStyle,
      'font_size': fontSize,
      'reduced_motion': reducedMotion,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  /// Create a copy with updated fields
  ChatThemeSettings copyWith({
    String? id,
    String? userId,
    String? selectedTheme,
    String? accentColor,
    String? bubbleStyle,
    int? fontSize,
    bool? reducedMotion,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ChatThemeSettings(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      selectedTheme: selectedTheme ?? this.selectedTheme,
      accentColor: accentColor ?? this.accentColor,
      bubbleStyle: bubbleStyle ?? this.bubbleStyle,
      fontSize: fontSize ?? this.fontSize,
      reducedMotion: reducedMotion ?? this.reducedMotion,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? DateTime.now(),
    );
  }

  /// Get accent color as Flutter Color object
  Color get accentColorValue {
    try {
      final hex = accentColor.replaceFirst('#', '');
      return Color(int.parse('FF$hex', radix: 16));
    } catch (_) {
      return const Color(0xFF8B5CF6); // Default purple
    }
  }

  /// Available theme options
  static const List<String> themeOptions = [
    'default',
    'minimal',
    'gradient',
    'classic',
  ];

  /// Available bubble style options
  static const List<String> bubbleStyleOptions = [
    'modern',
    'rounded',
    'classic',
    'flat',
  ];

  /// Available accent color presets (hex strings)
  static const List<String> accentColorPresets = [
    '#8B5CF6', // Purple (brand)
    '#06B6D4', // Cyan
    '#EC4899', // Pink
    '#EF4444', // Red
    '#F97316', // Orange
    '#22C55E', // Green
    '#3B82F6', // Blue
    '#6366F1', // Indigo
  ];

  /// Font size range
  static const int minFontSize = 12;
  static const int maxFontSize = 24;
  static const int defaultFontSize = 16;

  @override
  String toString() {
    return 'ChatThemeSettings(theme: $selectedTheme, accent: $accentColor, bubble: $bubbleStyle, font: $fontSize, reducedMotion: $reducedMotion)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is ChatThemeSettings &&
        other.userId == userId &&
        other.selectedTheme == selectedTheme &&
        other.accentColor == accentColor &&
        other.bubbleStyle == bubbleStyle &&
        other.fontSize == fontSize &&
        other.reducedMotion == reducedMotion;
  }

  @override
  int get hashCode {
    return Object.hash(
      userId,
      selectedTheme,
      accentColor,
      bubbleStyle,
      fontSize,
      reducedMotion,
    );
  }
}
