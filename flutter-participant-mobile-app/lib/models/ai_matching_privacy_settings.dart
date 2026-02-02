/// AI Matching Privacy Settings Model
/// 
/// Maps to the `ai_matching_privacy_settings` table in Supabase.
/// Controls user preferences for AI-powered networking features.
class AIMatchingPrivacySettings {
  final String id;
  final String userId;
  final bool aiMatchingEnabled;
  final bool allowAiInsights;
  final DateTime? consentGivenAt;
  final List<String> hideFromUsers;
  final bool includeActivityInMatching;
  final bool includeBioInMatching;
  final bool includeInterestsInMatching;
  final bool includeSkillsInMatching;
  final bool showInRecommendations;
  final bool onlyShowToMutualInterests;
  final DateTime? lastReviewedAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const AIMatchingPrivacySettings({
    required this.id,
    required this.userId,
    this.aiMatchingEnabled = true,
    this.allowAiInsights = true,
    this.consentGivenAt,
    this.hideFromUsers = const [],
    this.includeActivityInMatching = true,
    this.includeBioInMatching = true,
    this.includeInterestsInMatching = true,
    this.includeSkillsInMatching = true,
    this.showInRecommendations = true,
    this.onlyShowToMutualInterests = false,
    this.lastReviewedAt,
    this.createdAt,
    this.updatedAt,
  });

  /// Create empty settings for a user
  factory AIMatchingPrivacySettings.empty(String userId) {
    return AIMatchingPrivacySettings(
      id: '',
      userId: userId,
    );
  }

  /// Create from Supabase JSON response
  factory AIMatchingPrivacySettings.fromJson(Map<String, dynamic> json) {
    return AIMatchingPrivacySettings(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      aiMatchingEnabled: json['ai_matching_enabled'] as bool? ?? true,
      allowAiInsights: json['allow_ai_insights'] as bool? ?? true,
      consentGivenAt: json['consent_given_at'] != null
          ? DateTime.parse(json['consent_given_at'] as String)
          : null,
      hideFromUsers: (json['hide_from_users'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      includeActivityInMatching:
          json['include_activity_in_matching'] as bool? ?? true,
      includeBioInMatching: json['include_bio_in_matching'] as bool? ?? true,
      includeInterestsInMatching:
          json['include_interests_in_matching'] as bool? ?? true,
      includeSkillsInMatching:
          json['include_skills_in_matching'] as bool? ?? true,
      showInRecommendations: json['show_in_recommendations'] as bool? ?? true,
      onlyShowToMutualInterests:
          json['only_show_to_mutual_interests'] as bool? ?? false,
      lastReviewedAt: json['last_reviewed_at'] != null
          ? DateTime.parse(json['last_reviewed_at'] as String)
          : null,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
    );
  }

  /// Convert to JSON for Supabase upsert
  Map<String, dynamic> toJson() {
    return {
      if (id.isNotEmpty) 'id': id,
      'user_id': userId,
      'ai_matching_enabled': aiMatchingEnabled,
      'allow_ai_insights': allowAiInsights,
      if (consentGivenAt != null)
        'consent_given_at': consentGivenAt!.toIso8601String(),
      'hide_from_users': hideFromUsers,
      'include_activity_in_matching': includeActivityInMatching,
      'include_bio_in_matching': includeBioInMatching,
      'include_interests_in_matching': includeInterestsInMatching,
      'include_skills_in_matching': includeSkillsInMatching,
      'show_in_recommendations': showInRecommendations,
      'only_show_to_mutual_interests': onlyShowToMutualInterests,
      'last_reviewed_at': DateTime.now().toIso8601String(),
    };
  }

  /// Create a copy with updated fields
  AIMatchingPrivacySettings copyWith({
    String? id,
    String? userId,
    bool? aiMatchingEnabled,
    bool? allowAiInsights,
    DateTime? consentGivenAt,
    List<String>? hideFromUsers,
    bool? includeActivityInMatching,
    bool? includeBioInMatching,
    bool? includeInterestsInMatching,
    bool? includeSkillsInMatching,
    bool? showInRecommendations,
    bool? onlyShowToMutualInterests,
    DateTime? lastReviewedAt,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return AIMatchingPrivacySettings(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      aiMatchingEnabled: aiMatchingEnabled ?? this.aiMatchingEnabled,
      allowAiInsights: allowAiInsights ?? this.allowAiInsights,
      consentGivenAt: consentGivenAt ?? this.consentGivenAt,
      hideFromUsers: hideFromUsers ?? this.hideFromUsers,
      includeActivityInMatching:
          includeActivityInMatching ?? this.includeActivityInMatching,
      includeBioInMatching: includeBioInMatching ?? this.includeBioInMatching,
      includeInterestsInMatching:
          includeInterestsInMatching ?? this.includeInterestsInMatching,
      includeSkillsInMatching:
          includeSkillsInMatching ?? this.includeSkillsInMatching,
      showInRecommendations:
          showInRecommendations ?? this.showInRecommendations,
      onlyShowToMutualInterests:
          onlyShowToMutualInterests ?? this.onlyShowToMutualInterests,
      lastReviewedAt: lastReviewedAt ?? this.lastReviewedAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  /// Check if user has given consent
  bool get hasConsent => consentGivenAt != null;

  /// Check if any data sources are enabled
  bool get hasDataSourcesEnabled =>
      includeActivityInMatching ||
      includeBioInMatching ||
      includeInterestsInMatching ||
      includeSkillsInMatching;

  /// Get count of enabled data sources
  int get enabledDataSourceCount {
    int count = 0;
    if (includeActivityInMatching) count++;
    if (includeBioInMatching) count++;
    if (includeInterestsInMatching) count++;
    if (includeSkillsInMatching) count++;
    return count;
  }
}
