import 'package:flutter/material.dart';

/// Categories for match insights explaining WHY two profiles match
enum MatchCategory {
  skills,       // Shared technical/professional skills
  interests,    // Common hobbies/passions  
  goals,        // Complementary objectives (what you offer matches what they seek)
  network,      // Mutual followers
  activity,     // Both attending same events
  community,    // Both in same circles
  education,    // Same education status or field
  organization, // Same company/startup/org
}

/// Represents a single insight explaining why profiles match
class MatchInsight {
  final MatchCategory category;
  final String title;           // "Shared Expertise"
  final String description;     // "You both know Flutter & Dart"
  final List<String> items;     // ["Flutter", "Dart", "Firebase"]
  final int contribution;       // How much this adds to score (0-100)
  final IconData icon;
  final Color color;
  final bool isComplementary;   // True if goal-based (you offer what they seek)

  const MatchInsight({
    required this.category,
    required this.title,
    required this.description,
    required this.items,
    required this.contribution,
    required this.icon,
    required this.color,
    this.isComplementary = false,
  });
  
  /// Get the category metadata
  static Map<MatchCategory, CategoryMeta> categoryMeta = {
    MatchCategory.skills: CategoryMeta(
      icon: Icons.code_rounded,
      color: Colors.blue,
      label: 'Professional',
    ),
    MatchCategory.interests: CategoryMeta(
      icon: Icons.favorite_rounded,
      color: Colors.pink,
      label: 'Shared Passions',
    ),
    MatchCategory.goals: CategoryMeta(
      icon: Icons.handshake_rounded,
      color: Colors.teal,
      label: 'Goal Match',
    ),
    MatchCategory.network: CategoryMeta(
      icon: Icons.people_rounded,
      color: Colors.indigo,
      label: 'Network',
    ),
    MatchCategory.activity: CategoryMeta(
      icon: Icons.event_rounded,
      color: Colors.purple,
      label: 'Same Event',
    ),
    MatchCategory.community: CategoryMeta(
      icon: Icons.groups_rounded,
      color: Colors.orange,
      label: 'Same Community',
    ),
    MatchCategory.education: CategoryMeta(
      icon: Icons.school_rounded,
      color: Colors.green,
      label: 'Academic',
    ),
    MatchCategory.organization: CategoryMeta(
      icon: Icons.business_rounded,
      color: Colors.blueGrey,
      label: 'Same Org',
    ),
  };
}

class CategoryMeta {
  final IconData icon;
  final Color color;
  final String label;
  
  const CategoryMeta({
    required this.icon,
    required this.color,
    required this.label,
  });
}

/// Complete match result with all insights
class MatchResult {
  final int totalScore;
  final List<MatchInsight> insights;  // Ordered by contribution
  final IconData summaryIcon;          // Icon for high match (e.g., Icons.local_fire_department)
  final String summaryText;           // "Strong professional match"
  final MatchCategory? primaryCategory; // Dominant match type
  final String? matchStory;           // Human-readable narrative

  const MatchResult({
    required this.totalScore,
    required this.insights,
    required this.summaryIcon,
    required this.summaryText,
    this.primaryCategory,
    this.matchStory,
  });
  
  /// Get a summary badge label based on primary category
  String get summaryBadge {
    if (primaryCategory == null) return 'New Match';
    final meta = MatchInsight.categoryMeta[primaryCategory];
    return meta?.label ?? 'Match';
  }
  
  /// Get color for summary badge
  Color get summaryColor {
    if (primaryCategory == null) return Colors.grey;
    return MatchInsight.categoryMeta[primaryCategory]?.color ?? Colors.grey;
  }
  
  /// Get icon for summary badge
  IconData get summaryBadgeIcon {
    if (primaryCategory == null) return Icons.person_add_rounded;
    return MatchInsight.categoryMeta[primaryCategory]?.icon ?? Icons.auto_awesome_rounded;
  }
  
  /// Check if this is a strong match (>70%)
  bool get isStrong => totalScore >= 70;
  
  /// Check if this is a moderate match (40-69%)
  bool get isModerate => totalScore >= 40 && totalScore < 70;
  
  /// Get strength label
  String get strengthLabel {
    if (totalScore >= 85) return 'Excellent';
    if (totalScore >= 70) return 'Strong';
    if (totalScore >= 50) return 'Good';
    if (totalScore >= 30) return 'Fair';
    return 'New';
  }
}

/// Match result for group/circle matching
class GroupMatchResult {
  final String circleId;
  final String circleName;
  final String? circleIcon;
  final int matchScore;
  final List<MatchInsight> insights;
  final int memberOverlap;        // How many members you know
  final List<String> sharedTags;  // Matching interests with circle tags
  final bool alignsWithGoal;      // Circle category matches your lookingFor
  
  const GroupMatchResult({
    required this.circleId,
    required this.circleName,
    this.circleIcon,
    required this.matchScore,
    required this.insights,
    required this.memberOverlap,
    required this.sharedTags,
    required this.alignsWithGoal,
  });
}
