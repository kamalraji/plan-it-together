import 'package:thittam1hub/models/impact_profile.dart';
import 'package:thittam1hub/utils/result.dart';

/// Abstract repository interface for Impact Profile operations
/// 
/// Provides a clean abstraction layer for user profile management
/// including profile CRUD, follow/unfollow, and discovery features.
abstract class ImpactRepository {
  /// Get the current user's profile
  Future<Result<ImpactProfile?>> getCurrentProfile();

  /// Get a profile by user ID
  Future<Result<ImpactProfile?>> getProfileById(String userId);

  /// Get a profile by username
  Future<Result<ImpactProfile?>> getProfileByUsername(String username);

  /// Update the current user's profile
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
  });

  /// Upload a new avatar image
  Future<Result<String>> uploadAvatar(List<int> bytes, String fileName);

  /// Delete the current avatar
  Future<Result<bool>> deleteAvatar();

  /// Follow a user
  Future<Result<bool>> followUser(String userId);

  /// Unfollow a user
  Future<Result<bool>> unfollowUser(String userId);

  /// Check if current user follows a specific user
  Future<Result<bool>> isFollowing(String userId);

  /// Get followers for a user
  Future<Result<List<ImpactProfile>>> getFollowers(String userId, {int limit = 50});

  /// Get users that a user is following
  Future<Result<List<ImpactProfile>>> getFollowing(String userId, {int limit = 50});

  /// Get follow counts for a user
  Future<Result<({int followers, int following})>> getFollowCounts(String userId);

  /// Search profiles by name, username, or skills
  Future<Result<List<ImpactProfile>>> searchProfiles(String query, {int limit = 20});

  /// Get suggested profiles to follow
  Future<Result<List<ImpactProfile>>> getSuggestedProfiles({int limit = 10});

  /// Get profiles with matching skills/interests
  Future<Result<List<ImpactProfile>>> getMatchedProfiles({int limit = 10});

  /// Block a user
  Future<Result<bool>> blockUser(String userId);

  /// Unblock a user
  Future<Result<bool>> unblockUser(String userId);

  /// Get blocked users
  Future<Result<List<String>>> getBlockedUserIds();
}
