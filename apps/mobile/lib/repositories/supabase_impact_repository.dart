import 'dart:typed_data';
import 'package:thittam1hub/models/impact_profile.dart';
import 'package:thittam1hub/repositories/impact_repository.dart';
import 'package:thittam1hub/repositories/base_repository.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:uuid/uuid.dart';

/// Supabase implementation of ImpactRepository
/// 
/// Handles all Impact Profile data operations with Supabase,
/// including profile management, follows, and discovery.
class SupabaseImpactRepository extends BaseRepository implements ImpactRepository {
  static SupabaseImpactRepository? _instance;
  static SupabaseImpactRepository get instance => _instance ??= SupabaseImpactRepository._();
  SupabaseImpactRepository._();

  @override
  String get tag => 'ImpactRepository';

  final _supabase = SupabaseConfig.client;
  final _uuid = const Uuid();

  @override
  Future<Result<ImpactProfile?>> getCurrentProfile() {
    return execute(() async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return null;

      final response = await _supabase
          .from('impact_profiles')
          .select()
          .eq('id', userId)
          .maybeSingle();

      if (response == null) return null;
      
      logDbOperation('SELECT', 'impact_profiles', rowCount: 1);
      return ImpactProfile.fromJson(response);
    }, operationName: 'getCurrentProfile');
  }

  @override
  Future<Result<ImpactProfile?>> getProfileById(String userId) {
    return execute(() async {
      final response = await _supabase
          .from('impact_profiles')
          .select()
          .eq('id', userId)
          .maybeSingle();

      if (response == null) return null;
      
      logDbOperation('SELECT', 'impact_profiles', rowCount: 1);
      return ImpactProfile.fromJson(response);
    }, operationName: 'getProfileById');
  }

  @override
  Future<Result<ImpactProfile?>> getProfileByUsername(String username) {
    return execute(() async {
      final response = await _supabase
          .from('impact_profiles')
          .select()
          .eq('username', username.toLowerCase())
          .maybeSingle();

      if (response == null) return null;
      
      logDbOperation('SELECT', 'impact_profiles', rowCount: 1);
      return ImpactProfile.fromJson(response);
    }, operationName: 'getProfileByUsername');
  }

  @override
  Future<Result<ImpactProfile>> updateProfile({
    String? fullName,
    String? username,
    String? bio,
    String? avatarUrl,
    String? organization,
    String? role,
    List<String>? skills,
    List<String>? interests,
    String? linkedinUrl,
    String? twitterUrl,
    String? githubUrl,
    String? website,
  }) {
    return execute(() async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      final updates = <String, dynamic>{
        'updated_at': DateTime.now().toIso8601String(),
      };

      if (fullName != null) updates['full_name'] = fullName;
      if (username != null) updates['username'] = username.toLowerCase();
      if (bio != null) updates['bio'] = bio;
      if (avatarUrl != null) updates['avatar_url'] = avatarUrl;
      if (organization != null) updates['organization'] = organization;
      if (role != null) updates['role'] = role;
      if (skills != null) updates['skills'] = skills;
      if (interests != null) updates['interests'] = interests;
      if (linkedinUrl != null) updates['linkedin_url'] = linkedinUrl;
      if (twitterUrl != null) updates['twitter_url'] = twitterUrl;
      if (githubUrl != null) updates['github_url'] = githubUrl;
      if (website != null) updates['website'] = website;

      final response = await _supabase
          .from('impact_profiles')
          .update(updates)
          .eq('id', userId)
          .select()
          .single();

      logDbOperation('UPDATE', 'impact_profiles', rowCount: 1);
      return ImpactProfile.fromJson(response);
    }, operationName: 'updateProfile');
  }

  @override
  Future<Result<String>> uploadAvatar(List<int> bytes, String fileName) {
    return execute(() async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      final ext = fileName.split('.').last;
      final path = 'avatars/$userId/${_uuid.v4()}.$ext';

      await _supabase.storage
          .from('avatars')
          .uploadBinary(path, Uint8List.fromList(bytes));

      final url = _supabase.storage.from('avatars').getPublicUrl(path);
      
      logInfo('Avatar uploaded', metadata: {'path': path});
      return url;
    }, operationName: 'uploadAvatar');
  }

  @override
  Future<Result<bool>> deleteAvatar() {
    return execute(() async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      // Get current avatar URL
      final profile = await _supabase
          .from('impact_profiles')
          .select('avatar_url')
          .eq('id', userId)
          .maybeSingle();

      if (profile?['avatar_url'] != null) {
        final url = profile!['avatar_url'] as String;
        // Extract path from URL
        final uri = Uri.parse(url);
        final pathSegments = uri.pathSegments;
        if (pathSegments.length >= 3) {
          final storagePath = pathSegments.sublist(2).join('/');
          await _supabase.storage.from('avatars').remove([storagePath]);
        }
      }

      // Clear avatar URL in profile
      await _supabase
          .from('impact_profiles')
          .update({'avatar_url': null})
          .eq('id', userId);

      logDbOperation('UPDATE', 'impact_profiles', rowCount: 1);
      return true;
    }, operationName: 'deleteAvatar');
  }

  @override
  Future<Result<bool>> followUser(String userId) {
    return execute(() async {
      final currentUserId = _supabase.auth.currentUser?.id;
      if (currentUserId == null) throw Exception('Not authenticated');
      if (currentUserId == userId) throw Exception('Cannot follow yourself');

      await _supabase
          .from('follows')
          .upsert({
            'follower_id': currentUserId,
            'following_id': userId,
          }, onConflict: 'follower_id,following_id');

      logDbOperation('UPSERT', 'follows', rowCount: 1);
      return true;
    }, operationName: 'followUser');
  }

  @override
  Future<Result<bool>> unfollowUser(String userId) {
    return execute(() async {
      final currentUserId = _supabase.auth.currentUser?.id;
      if (currentUserId == null) throw Exception('Not authenticated');

      await _supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', userId);

      logDbOperation('DELETE', 'follows', rowCount: 1);
      return true;
    }, operationName: 'unfollowUser');
  }

  @override
  Future<Result<bool>> isFollowing(String userId) {
    return execute(() async {
      final currentUserId = _supabase.auth.currentUser?.id;
      if (currentUserId == null) return false;

      final response = await _supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUserId)
          .eq('following_id', userId)
          .maybeSingle();

      return response != null;
    }, operationName: 'isFollowing');
  }

  @override
  Future<Result<List<ImpactProfile>>> getFollowers(String userId, {int limit = 50}) {
    return execute(() async {
      final response = await _supabase
          .from('follows')
          .select('follower:impact_profiles!follower_id(*)')
          .eq('following_id', userId)
          .limit(limit);

      final profiles = (response as List)
          .where((r) => r['follower'] != null)
          .map((r) => ImpactProfile.fromJson(r['follower']))
          .toList();

      logDbOperation('SELECT', 'follows', rowCount: profiles.length);
      return profiles;
    }, operationName: 'getFollowers');
  }

  @override
  Future<Result<List<ImpactProfile>>> getFollowing(String userId, {int limit = 50}) {
    return execute(() async {
      final response = await _supabase
          .from('follows')
          .select('following:impact_profiles!following_id(*)')
          .eq('follower_id', userId)
          .limit(limit);

      final profiles = (response as List)
          .where((r) => r['following'] != null)
          .map((r) => ImpactProfile.fromJson(r['following']))
          .toList();

      logDbOperation('SELECT', 'follows', rowCount: profiles.length);
      return profiles;
    }, operationName: 'getFollowing');
  }

  @override
  Future<Result<({int followers, int following})>> getFollowCounts(String userId) {
    return execute(() async {
      final results = await Future.wait([
        _supabase
            .from('follows')
            .select('id')
            .eq('following_id', userId),
        _supabase
            .from('follows')
            .select('id')
            .eq('follower_id', userId),
      ]);

      return (
        followers: (results[0] as List).length,
        following: (results[1] as List).length,
      );
    }, operationName: 'getFollowCounts');
  }

  @override
  Future<Result<List<ImpactProfile>>> searchProfiles(String query, {int limit = 20}) {
    return execute(() async {
      final response = await _supabase
          .from('impact_profiles')
          .select()
          .or('full_name.ilike.%$query%,username.ilike.%$query%')
          .limit(limit);

      logDbOperation('SELECT', 'impact_profiles', rowCount: (response as List).length);
      return response.map((json) => ImpactProfile.fromJson(json)).toList();
    }, operationName: 'searchProfiles');
  }

  @override
  Future<Result<List<ImpactProfile>>> getSuggestedProfiles({int limit = 10}) {
    return execute(() async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return <ImpactProfile>[];

      // Get users not already followed, excluding self
      final response = await _supabase
          .from('impact_profiles')
          .select()
          .neq('id', userId)
          .limit(limit);

      logDbOperation('SELECT', 'impact_profiles', rowCount: (response as List).length);
      return response.map((json) => ImpactProfile.fromJson(json)).toList();
    }, operationName: 'getSuggestedProfiles');
  }

  @override
  Future<Result<List<ImpactProfile>>> getMatchedProfiles({int limit = 10}) {
    return execute(() async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return <ImpactProfile>[];

      // Get current user's interests/skills
      final currentProfile = await _supabase
          .from('impact_profiles')
          .select('interests, skills')
          .eq('id', userId)
          .maybeSingle();

      if (currentProfile == null) return <ImpactProfile>[];

      final interests = (currentProfile['interests'] as List?)?.cast<String>() ?? [];
      final skills = (currentProfile['skills'] as List?)?.cast<String>() ?? [];

      if (interests.isEmpty && skills.isEmpty) {
        return (await getSuggestedProfiles(limit: limit)).dataOrNull ?? [];
      }

      // Get profiles with overlapping interests/skills
      final response = await _supabase
          .from('impact_profiles')
          .select()
          .neq('id', userId)
          .limit(50);

      final profiles = (response as List)
          .map((json) => ImpactProfile.fromJson(json))
          .toList();

      // Score and sort by match
      profiles.sort((a, b) {
        final aScore = _calculateMatchScore(a, interests, skills);
        final bScore = _calculateMatchScore(b, interests, skills);
        return bScore.compareTo(aScore);
      });

      return profiles.take(limit).toList();
    }, operationName: 'getMatchedProfiles');
  }

  int _calculateMatchScore(ImpactProfile profile, List<String> interests, List<String> skills) {
    int score = 0;
    
    for (final interest in profile.interests) {
      if (interests.contains(interest)) score += 2;
    }
    
    for (final skill in profile.skills) {
      if (skills.contains(skill)) score += 3;
    }
    
    return score;
  }

  @override
  Future<Result<bool>> blockUser(String userId) {
    return execute(() async {
      final currentUserId = _supabase.auth.currentUser?.id;
      if (currentUserId == null) throw Exception('Not authenticated');

      await _supabase
          .from('blocked_users')
          .upsert({
            'blocker_id': currentUserId,
            'blocked_id': userId,
          }, onConflict: 'blocker_id,blocked_id');

      // Also unfollow
      await _supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', userId);

      logDbOperation('UPSERT', 'blocked_users', rowCount: 1);
      return true;
    }, operationName: 'blockUser');
  }

  @override
  Future<Result<bool>> unblockUser(String userId) {
    return execute(() async {
      final currentUserId = _supabase.auth.currentUser?.id;
      if (currentUserId == null) throw Exception('Not authenticated');

      await _supabase
          .from('blocked_users')
          .delete()
          .eq('blocker_id', currentUserId)
          .eq('blocked_id', userId);

      logDbOperation('DELETE', 'blocked_users', rowCount: 1);
      return true;
    }, operationName: 'unblockUser');
  }

  @override
  Future<Result<List<String>>> getBlockedUserIds() {
    return execute(() async {
      final currentUserId = _supabase.auth.currentUser?.id;
      if (currentUserId == null) return <String>[];

      final response = await _supabase
          .from('blocked_users')
          .select('blocked_id')
          .eq('blocker_id', currentUserId);

      logDbOperation('SELECT', 'blocked_users', rowCount: (response as List).length);
      return response.map((r) => r['blocked_id'] as String).toList();
    }, operationName: 'getBlockedUserIds');
  }
}
