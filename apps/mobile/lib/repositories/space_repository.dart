import 'package:thittam1hub/models/space.dart';
import 'package:thittam1hub/utils/result.dart';

/// Abstract repository interface for Space (audio room) operations
/// 
/// Provides a clean abstraction layer for live audio space management,
/// speaker/audience handling, and real-time participation.
abstract class SpaceRepository {
  /// Get all live spaces
  Future<Result<List<Space>>> getLiveSpaces({int limit = 20});

  /// Get a space by ID
  Future<Result<Space?>> getSpaceById(String spaceId);

  /// Get spaces by host
  Future<Result<List<Space>>> getSpacesByHost(String hostId, {int limit = 20});

  /// Search spaces by topic or tags
  Future<Result<List<Space>>> searchSpaces(String query, {int limit = 20});

  /// Create a new space
  Future<Result<Space>> createSpace({
    required String topic,
    List<String> tags = const [],
  });

  /// Update a space
  Future<Result<Space>> updateSpace({
    required String spaceId,
    String? topic,
    List<String>? tags,
  });

  /// End a space (host only)
  Future<Result<bool>> endSpace(String spaceId);

  /// Delete a space
  Future<Result<bool>> deleteSpace(String spaceId);

  /// Join as audience
  Future<Result<bool>> joinAsAudience(String spaceId);

  /// Leave space
  Future<Result<bool>> leaveSpace(String spaceId);

  /// Request to speak (raise hand)
  Future<Result<bool>> requestToSpeak(String spaceId);

  /// Cancel speak request
  Future<Result<bool>> cancelSpeakRequest(String spaceId);

  /// Promote to speaker (host only)
  Future<Result<bool>> promoteToSpeaker(String spaceId, String userId);

  /// Demote to audience (host only)
  Future<Result<bool>> demoteToAudience(String spaceId, String userId);

  /// Mute a speaker (host only)
  Future<Result<bool>> muteSpeaker(String spaceId, String userId);

  /// Unmute self (speaker only)
  Future<Result<bool>> unmuteSelf(String spaceId);

  /// Toggle own mute status
  Future<Result<bool>> toggleMute(String spaceId);

  /// Get speakers for a space
  Future<Result<List<SpaceSpeaker>>> getSpeakers(String spaceId);

  /// Get audience for a space
  Future<Result<List<SpaceAudience>>> getAudience(String spaceId, {int limit = 100});

  /// Get participant count
  Future<Result<({int speakers, int audience})>> getParticipantCounts(String spaceId);

  /// Check if current user is a speaker
  Future<Result<bool>> isSpeaker(String spaceId);

  /// Check if current user is the host
  Future<Result<bool>> isHost(String spaceId);

  /// Get hand raises (pending speaker requests)
  Future<Result<List<String>>> getHandRaises(String spaceId);

  /// Remove a participant (host only)
  Future<Result<bool>> removeParticipant(String spaceId, String userId);

  /// Report a space
  Future<Result<bool>> reportSpace(String spaceId, String reason, {String? details});
}
