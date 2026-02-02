import 'package:thittam1hub/models/circle.dart';
import 'package:thittam1hub/utils/result.dart';

/// Abstract repository interface for Circle operations
/// 
/// Provides a clean abstraction layer for circle management,
/// membership, and messaging operations.
abstract class CircleRepository {
  /// Get all public circles
  Future<Result<List<Circle>>> getPublicCircles({int limit = 50});

  /// Get circles the current user is a member of
  Future<Result<List<Circle>>> getMyCircles();

  /// Get a circle by ID
  Future<Result<Circle?>> getCircleById(String circleId);

  /// Get circles for a specific event
  Future<Result<List<Circle>>> getCirclesByEvent(String eventId);

  /// Search circles by name or tags
  Future<Result<List<Circle>>> searchCircles(String query, {int limit = 20});

  /// Create a new circle
  Future<Result<Circle>> createCircle({
    required String name,
    String? description,
    String icon = '💬',
    String type = 'USER_CREATED',
    String category = 'INTEREST',
    bool isPrivate = false,
    int? maxMembers,
    List<String> tags = const [],
    String? eventId,
  });

  /// Update a circle
  Future<Result<Circle>> updateCircle({
    required String circleId,
    String? name,
    String? description,
    String? icon,
    bool? isPrivate,
    int? maxMembers,
    List<String>? tags,
  });

  /// Delete a circle
  Future<Result<bool>> deleteCircle(String circleId);

  /// Join a circle
  Future<Result<bool>> joinCircle(String circleId);

  /// Leave a circle
  Future<Result<bool>> leaveCircle(String circleId);

  /// Check if current user is a member of a circle
  Future<Result<bool>> isMember(String circleId);

  /// Get members of a circle
  Future<Result<List<CircleMember>>> getMembers(String circleId, {int limit = 100});

  /// Get member count for a circle
  Future<Result<int>> getMemberCount(String circleId);

  /// Update member role (admin only)
  Future<Result<bool>> updateMemberRole(String circleId, String userId, String role);

  /// Remove a member (admin only)
  Future<Result<bool>> removeMember(String circleId, String userId);

  /// Get messages for a circle
  Future<Result<List<CircleMessage>>> getMessages(String circleId, {int limit = 50});

  /// Send a message to a circle
  Future<Result<CircleMessage>> sendMessage(String circleId, String content);

  /// Delete a message
  Future<Result<bool>> deleteMessage(String messageId);

  /// Get trending circles
  Future<Result<List<Circle>>> getTrendingCircles({int limit = 10});

  /// Get suggested circles based on user interests
  Future<Result<List<Circle>>> getSuggestedCircles({int limit = 10});
}
