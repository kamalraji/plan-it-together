import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:thittam1hub/models/impact_profile.dart';
import 'package:thittam1hub/models/follower.dart';
import 'package:thittam1hub/models/match_insight.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:thittam1hub/services/logging_service.dart';
class ImpactService {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'ImpactService';

  final _supabase = SupabaseConfig.client;

  /// Get current user's impact profile (creates one if doesn't exist)
  Future<ImpactProfile?> getMyImpactProfile() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return null;

      final response = await _supabase
          .from('impact_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

      if (response == null) {
        // Auto-create a profile for the user
        return await _createDefaultImpactProfile(userId);
      }
      return ImpactProfile.fromMap(response as Map<String, dynamic>);
    } catch (e) {
      _log.error('Error fetching my impact profile: $e', tag: _tag);
      return null;
    }
  }

  /// Create a default impact profile for new users
  Future<ImpactProfile?> _createDefaultImpactProfile(String userId) async {
    try {
      // Get user metadata from auth
      final user = _supabase.auth.currentUser;
      final fullName = user?.userMetadata?['full_name'] as String? ??
          user?.email?.split('@').first ??
          'New User';
      final avatarUrl = user?.userMetadata?['avatar_url'] as String?;

      final profileData = {
        'user_id': userId,
        'full_name': fullName,
        'avatar_url': avatarUrl,
        'headline': 'Just joined! 👋',
        'bio': null,
        'organization': null,
        'looking_for': <String>[],
        'interests': <String>[],
        'skills': <String>[],
        'relationship_status': 'OPEN_TO_CONNECT',
        'education_status': 'PROFESSIONAL',
        'impact_score': 0,
        'level': 1,
        'badges': <String>[],
        'vibe_emoji': '🚀',
        'is_online': true,
        'last_seen': DateTime.now().toIso8601String(),
        'streak_count': 0,
        'streak_actions_today': 0,
        'is_premium': false,
        'is_verified': false,
        'is_boosted': false,
        'super_like_count': 0,
      };

      final response = await _supabase
          .from('impact_profiles')
          .insert(profileData)
          .select()
          .single();

      _log.info('✅ Created default impact profile for user', tag: _tag);
      return ImpactProfile.fromMap(response as Map<String, dynamic>);
    } catch (e) {
      _log.error('Error creating default impact profile: $e', tag: _tag);
      return null;
    }
  }

  /// Compute a match score (0-100) between two profiles based on
  /// skills/interests overlap and looking-for complementarity.
  /// Weights: skills 50%, interests 30%, looking-for complementarity 20%.
  int calculateMatchScore(ImpactProfile me, ImpactProfile other) {
    final result = calculateMatchInsights(me, other);
    return result.totalScore;
  }

  /// Calculate detailed match insights explaining WHY two profiles match
  /// Returns a MatchResult with breakdown of all match categories
  MatchResult calculateMatchInsights(ImpactProfile me, ImpactProfile other) {
    final insights = <MatchInsight>[];

    final meSkills = me.skills.toSet();
    final otherSkills = other.skills.toSet();
    final meInterests = me.interests.toSet();
    final otherInterests = other.interests.toSet();
    final meLF = me.lookingFor.toSet();
    final otherLF = other.lookingFor.toSet();

    // 1. SKILLS MATCH (Professional - like LinkedIn)
    final sharedSkills = meSkills.intersection(otherSkills);
    if (sharedSkills.isNotEmpty) {
      final contribution = (sharedSkills.length * 12).clamp(0, 40);
      insights.add(MatchInsight(
        category: MatchCategory.skills,
        title: 'Shared Expertise',
        description:
            'You both have ${sharedSkills.length} skill${sharedSkills.length > 1 ? 's' : ''} in common',
        items: sharedSkills.toList(),
        contribution: contribution,
        icon: Icons.code_rounded,
        color: Colors.blue,
      ));
    }

    // 2. INTERESTS MATCH (Social - like Instagram)
    final sharedInterests = meInterests.intersection(otherInterests);
    if (sharedInterests.isNotEmpty) {
      final contribution = (sharedInterests.length * 10).clamp(0, 30);
      insights.add(MatchInsight(
        category: MatchCategory.interests,
        title: 'Common Passions',
        description:
            'You share ${sharedInterests.length} interest${sharedInterests.length > 1 ? 's' : ''}',
        items: sharedInterests.toList(),
        contribution: contribution,
        icon: Icons.favorite_rounded,
        color: Colors.pink,
      ));
    }

    // 3. GOAL COMPLEMENTARITY (You offer what they seek)
    final iCanHelp = meSkills.intersection(otherLF);
    final theyCanHelp = otherSkills.intersection(meLF);
    if (iCanHelp.isNotEmpty || theyCanHelp.isNotEmpty) {
      final allComplementary = {...iCanHelp, ...theyCanHelp};
      String description;
      if (iCanHelp.isNotEmpty && theyCanHelp.isNotEmpty) {
        description =
            'You can help with ${iCanHelp.first}, they can help with ${theyCanHelp.first}';
      } else if (iCanHelp.isNotEmpty) {
        description = 'You can help them with ${iCanHelp.join(", ")}';
      } else {
        description = 'They can help you with ${theyCanHelp.join(", ")}';
      }

      insights.add(MatchInsight(
        category: MatchCategory.goals,
        title: 'Perfect Fit',
        description: description,
        items: allComplementary.toList(),
        contribution: 25,
        icon: Icons.handshake_rounded,
        color: Colors.teal,
        isComplementary: true,
      ));
    }

    // 4. SAME EVENT/ACTIVITY
    if (me.currentEventId != null &&
        other.currentEventId != null &&
        me.currentEventId == other.currentEventId) {
      insights.add(MatchInsight(
        category: MatchCategory.activity,
        title: 'Same Event',
        description: 'You\'re both attending this event',
        items: [],
        contribution: 15,
        icon: Icons.event_rounded,
        color: Colors.purple,
      ));
    }

    // 5. ORGANIZATION MATCH
    if (me.organization != null &&
        other.organization != null &&
        me.organization!.toLowerCase() == other.organization!.toLowerCase()) {
      insights.add(MatchInsight(
        category: MatchCategory.organization,
        title: 'Same Organization',
        description: 'You\'re both from ${me.organization}',
        items: [me.organization!],
        contribution: 12,
        icon: Icons.business_rounded,
        color: Colors.blueGrey,
      ));
    }

    // 6. EDUCATION MATCH
    if (me.educationStatus == other.educationStatus &&
        me.educationStatus != 'PROFESSIONAL') {
      final eduLabel = _getEducationLabel(me.educationStatus);
      insights.add(MatchInsight(
        category: MatchCategory.education,
        title: 'Academic Match',
        description: 'You\'re both $eduLabel',
        items: [eduLabel],
        contribution: 8,
        icon: Icons.school_rounded,
        color: Colors.green,
      ));
    }

    // Calculate total score
    final totalScore =
        insights.fold<int>(0, (sum, i) => sum + i.contribution).clamp(0, 100);

    // Sort by contribution
    insights.sort((a, b) => b.contribution.compareTo(a.contribution));

    // Determine summary
    final summaryText = _getSummaryText(insights);
    final summaryIcon = _getScoreIcon(totalScore);
    final primaryCategory =
        insights.isNotEmpty ? insights.first.category : null;
    final matchStory = _generateMatchStory(me, other, insights, totalScore);

    return MatchResult(
      totalScore: totalScore,
      insights: insights,
      summaryIcon: summaryIcon,
      summaryText: summaryText,
      primaryCategory: primaryCategory,
      matchStory: matchStory,
    );
  }

  IconData _getScoreIcon(int score) {
    if (score >= 85) return Icons.local_fire_department_rounded;
    if (score >= 70) return Icons.star_rounded;
    if (score >= 50) return Icons.auto_awesome_rounded;
    if (score >= 30) return Icons.thumbs_up_down_rounded;
    return Icons.waving_hand_rounded;
  }

  String _getSummaryText(List<MatchInsight> insights) {
    if (insights.isEmpty) return 'New potential connection';

    final categories = insights.map((i) => i.category).toSet();

    if (categories.contains(MatchCategory.goals)) {
      return 'You can help each other grow';
    }
    if (categories.contains(MatchCategory.skills) &&
        categories.contains(MatchCategory.interests)) {
      return 'Strong professional & social match';
    }
    if (categories.contains(MatchCategory.skills)) {
      return 'Professional expertise alignment';
    }
    if (categories.contains(MatchCategory.interests)) {
      return 'You share common passions';
    }
    if (categories.contains(MatchCategory.activity)) {
      return 'You\'re at the same event!';
    }
    if (categories.contains(MatchCategory.organization)) {
      return 'Colleagues in the same org';
    }
    if (categories.contains(MatchCategory.education)) {
      return 'Same academic journey';
    }

    return 'Potential connection';
  }

  String? _generateMatchStory(
    ImpactProfile me,
    ImpactProfile other,
    List<MatchInsight> insights,
    int score,
  ) {
    if (insights.isEmpty) return null;

    final parts = <String>[];
    parts.add('You and ${other.fullName} are a **$score% match**!');

    // Add skill story
    final skillInsight =
        insights.where((i) => i.category == MatchCategory.skills).firstOrNull;
    if (skillInsight != null && skillInsight.items.isNotEmpty) {
      if (skillInsight.items.length == 1) {
        parts.add('You both know ${skillInsight.items.first}.');
      } else {
        parts.add(
            'You share expertise in ${skillInsight.items.take(2).join(" and ")}.');
      }
    }

    // Add goal story
    final goalInsight =
        insights.where((i) => i.category == MatchCategory.goals).firstOrNull;
    if (goalInsight != null) {
      parts.add(goalInsight.description + '.');
    }

    // Add interest story
    final interestInsight = insights
        .where((i) => i.category == MatchCategory.interests)
        .firstOrNull;
    if (interestInsight != null && interestInsight.items.isNotEmpty) {
      parts.add('You\'re both into ${interestInsight.items.first}.');
    }

    return parts.join(' ');
  }

  String _getEducationLabel(String status) {
    switch (status) {
      case 'UNDERGRADUATE':
        return 'undergrad students';
      case 'GRADUATE':
        return 'grad students';
      case 'PHD':
        return 'PhD candidates';
      case 'HIGH_SCHOOL':
        return 'high school students';
      default:
        return 'students';
    }
  }

  /// Get a profile by user id
  Future<ImpactProfile?> getImpactProfileByUserId(String userId) async {
    try {
      final response = await _supabase
          .from('impact_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
      if (response == null) return null;
      return ImpactProfile.fromMap(response as Map<String, dynamic>);
    } catch (e) {
      _log.error('Error fetching impact profile by user id: $e', tag: _tag);
      return null;
    }
  }

  /// @deprecated Use FollowersService.getPendingRequests() instead
  /// Kept for backwards compatibility - now returns empty list
  @Deprecated('Use FollowersService.getPendingRequests() instead')
  Future<List<FollowRequest>> getIncomingPendingRequests() async {
    _log.warning('⚠️ ImpactService.getIncomingPendingRequests is deprecated - use FollowersService', tag: _tag);
    return [];
  }

  /// @deprecated Connection requests replaced by followers system
  @Deprecated('Use FollowersService.acceptFollowRequest() or declineFollowRequest() instead')
  Future<void> respondToConnectionRequest({required String requestId, required bool accept}) async {
    _log.warning('⚠️ ImpactService.respondToConnectionRequest is deprecated - use FollowersService', tag: _tag);
  }

  /// Fetches a list of impact profiles with optional filters
  Future<List<ImpactProfile>> getImpactProfiles({
    List<String>? skills,
    List<String>? interests,
    List<String>? lookingFor,
    bool filterByEvent = true,
  }) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      var query = _supabase.from('impact_profiles').select('*');

      // Exclude current user
      if (userId != null) {
        query = query.neq('user_id', userId);
      }

      final response = await query.limit(500);
      var profiles = (response as List)
          .map((data) => ImpactProfile.fromMap(data as Map<String, dynamic>))
          .toList();

      // Apply client-side filters
      if (skills != null && skills.isNotEmpty) {
        profiles = profiles
            .where((p) => p.skills.any((s) => skills.contains(s)))
            .toList();
      }
      if (interests != null && interests.isNotEmpty) {
        profiles = profiles
            .where((p) => p.interests.any((i) => interests.contains(i)))
            .toList();
      }
      if (lookingFor != null && lookingFor.isNotEmpty) {
        profiles = profiles
            .where((p) => p.lookingFor.any((l) => lookingFor.contains(l)))
            .toList();
      }

      return profiles;
    } catch (e) {
      _log.error('Error fetching impact profiles: $e', tag: _tag);
      return [];
    }
  }

  /// @deprecated Use FollowersService.followUser() instead
  /// Send connection request - now redirects to follow
  @Deprecated('Use FollowersService.followUser() instead')
  Future<void> sendConnectionRequest(String targetUserId, String connectionType) async {
    _log.warning('⚠️ ImpactService.sendConnectionRequest is deprecated - use FollowersService.followUser()', tag: _tag);
    // For backwards compatibility, insert a follow record
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _supabase.from('followers').insert({
        'follower_id': userId,
        'following_id': targetUserId,
        'status': 'ACCEPTED', // Auto-accept for public accounts
      });
      _log.info('✅ Follow sent (via deprecated sendConnectionRequest)', tag: _tag);
    } catch (e) {
      _log.error('❌ Error in deprecated sendConnectionRequest: $e', tag: _tag);
      rethrow;
    }
  }

  /// Skip a profile (optional: track for better recommendations)
  Future<void> skipProfile(String targetUserId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return;

      // Optional: Track skips for recommendation algorithm
      await _supabase.from('profile_skips').insert({
        'user_id': userId,
        'skipped_user_id': targetUserId,
      });
      _log.debug('⏭️  Profile skipped', tag: _tag);
    } catch (e) {
      _log.error('❌ Error skipping profile: $e', tag: _tag);
    }
  }

  /// Save a profile to favorites
  Future<void> saveProfile(String targetUserId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _supabase.from('saved_profiles').insert({
        'user_id': userId,
        'saved_user_id': targetUserId,
      });
      _log.debug('⭐ Profile saved', tag: _tag);
    } catch (e) {
      _log.error('❌ Error saving profile: $e', tag: _tag);
      rethrow;
    }
  }

  /// Update impact profile
  Future<void> updateImpactProfile(ImpactProfile profile) async {
    try {
      await _supabase
          .from('impact_profiles')
          .update(profile.toMap())
          .eq('id', profile.id);
      _log.info('✅ Impact profile updated', tag: _tag);
    } catch (e) {
      _log.error('❌ Error updating impact profile: $e', tag: _tag);
      rethrow;
    }
  }

  /// Update online status
  Future<void> updateOnlineStatus(bool isOnline) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return;

      await _supabase.from('impact_profiles').update({
        'is_online': isOnline,
        'last_seen': DateTime.now().toIso8601String(),
      }).eq('user_id', userId);
      _log.debug('📡 Online status: $isOnline', tag: _tag);
    } catch (e) {
      _log.error('❌ Error updating online status: $e', tag: _tag);
    }
  }

  /// Subscribe to online status changes for Pulse profiles
  RealtimeChannel subscribeToOnlineStatus(
      Function(String userId, bool isOnline) onStatusChange) {
    final channel = _supabase
        .channel('online_status')
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'impact_profiles',
          callback: (payload) {
            try {
              final data = payload.newRecord;
              final userId = data['user_id'] as String?;
              final isOnline = data['is_online'] as bool? ?? false;
              if (userId != null) {
                onStatusChange(userId, isOnline);
              }
            } catch (e) {
              _log.error('Error in online status callback: $e', tag: _tag);
            }
          },
        )
        .subscribe();
    return channel;
  }

  /// Get mutual followers between current user and target user
  /// (Users who both current user and target user follow)
  Future<List<ImpactProfile>> getMutualFollowers(String targetUserId) async {
    try {
      final myId = _supabase.auth.currentUser?.id;
      if (myId == null) return [];

      // Get users I'm following
      final myFollowing = await _supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', myId)
          .eq('status', 'ACCEPTED')
          .limit(500);

      // Get users target is following
      final theirFollowing = await _supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', targetUserId)
          .eq('status', 'ACCEPTED')
          .limit(500);

      // Extract user IDs
      final myFollowingIds = <String>{};
      for (final f in (myFollowing as List)) {
        myFollowingIds.add(f['following_id'] as String);
      }

      final theirFollowingIds = <String>{};
      for (final f in (theirFollowing as List)) {
        theirFollowingIds.add(f['following_id'] as String);
      }

      // Find intersection
      final mutualIds = myFollowingIds.intersection(theirFollowingIds).toList();
      if (mutualIds.isEmpty) return [];

      // Fetch profiles
      final profiles = await _supabase
          .from('impact_profiles')
          .select('*')
          .inFilter('user_id', mutualIds)
          .limit(100);

      return (profiles as List)
          .map((data) => ImpactProfile.fromMap(data as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Error fetching mutual followers: $e', tag: _tag);
      return [];
    }
  }

  /// @deprecated Use getMutualFollowers instead
  @Deprecated('Use getMutualFollowers() instead')
  Future<List<ImpactProfile>> getMutualConnections(String targetUserId) async {
    return getMutualFollowers(targetUserId);
  }

  /// Get a profile by ID (alias for getImpactProfileByUserId)
  Future<ImpactProfile?> getProfileById(String userId) async {
    return getImpactProfileByUserId(userId);
  }

  /// Get follow status between current user and target user
  /// Returns: null, 'PENDING', or 'ACCEPTED'
  Future<String?> getFollowStatus(String targetUserId) async {
    try {
      final myId = _supabase.auth.currentUser?.id;
      if (myId == null) return null;

      // Check if I'm following the target
      final response = await _supabase
          .from('followers')
          .select('status')
          .eq('follower_id', myId)
          .eq('following_id', targetUserId)
          .maybeSingle();

      return response?['status'] as String?;
    } catch (e) {
      _log.error('Error fetching follow status: $e', tag: _tag);
      return null;
    }
  }

  /// @deprecated Use getFollowStatus instead
  @Deprecated('Use getFollowStatus() instead')
  Future<String?> getConnectionStatus(String targetUserId) async {
    return getFollowStatus(targetUserId);
  }
}
