import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Service for managing icebreaker prompts and responses
class IcebreakerService {
  static final IcebreakerService instance = IcebreakerService._();
  IcebreakerService._();

  static final _log = LoggingService.instance;
  static const String _tag = 'IcebreakerService';

  /// Get today's icebreaker prompt for an event
  Future<IcebreakerPrompt?> getTodaysPrompt(String eventId) async {
    try {
      final today = DateTime.now().toIso8601String().split('T')[0];
      
      final response = await SupabaseConfig.client
          .from('icebreaker_prompts')
          .select()
          .eq('event_id', eventId)
          .eq('active_date', today)
          .eq('is_active', true)
          .maybeSingle();

      if (response == null) return null;
      return IcebreakerPrompt.fromJson(response);
    } catch (e) {
      _log.error('Failed to get today\'s prompt: $e', tag: _tag);
      return null;
    }
  }

  /// Get all active prompts for an event
  Future<List<IcebreakerPrompt>> getActivePrompts(String eventId) async {
    try {
      final response = await SupabaseConfig.client
          .from('icebreaker_prompts')
          .select()
          .eq('event_id', eventId)
          .eq('is_active', true)
          .order('active_date', ascending: false)
          .limit(10);

      return (response as List)
          .map((json) => IcebreakerPrompt.fromJson(json))
          .toList();
    } catch (e) {
      _log.error('Failed to get active prompts: $e', tag: _tag);
      return [];
    }
  }

  /// Get responses for a prompt with user profiles
  Future<List<IcebreakerResponse>> getResponses(
    String promptId, {
    int limit = 50,
    String? beforeId,
  }) async {
    try {
      // Build base filter query first, then apply transforms
      var baseQuery = SupabaseConfig.client
          .from('icebreaker_responses')
          .select('''
            *,
            user_profiles:user_id (
              id,
              full_name,
              profile_picture_url,
              headline
            )
          ''')
          .eq('prompt_id', promptId);

      // Apply cursor-based pagination filter before transforms
      final filteredQuery = beforeId != null 
          ? baseQuery.lt('id', beforeId)
          : baseQuery;

      final response = await filteredQuery
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((json) => IcebreakerResponse.fromJson(json))
          .toList();
    } catch (e) {
      _log.error('Failed to get responses: $e', tag: _tag);
      return [];
    }
  }

  /// Get current user's response for a prompt
  Future<IcebreakerResponse?> getUserResponse(String promptId) async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return null;

      final response = await SupabaseConfig.client
          .from('icebreaker_responses')
          .select()
          .eq('prompt_id', promptId)
          .eq('user_id', userId)
          .maybeSingle();

      if (response == null) return null;
      return IcebreakerResponse.fromJson(response);
    } catch (e) {
      _log.error('Failed to get user response: $e', tag: _tag);
      return null;
    }
  }

  /// Submit a response to an icebreaker prompt
  Future<IcebreakerResponse?> submitResponse({
    required String promptId,
    required String responseText,
    bool isAnonymous = false,
  }) async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      final response = await SupabaseConfig.client
          .from('icebreaker_responses')
          .upsert({
            'prompt_id': promptId,
            'user_id': userId,
            'response': responseText.trim(),
            'is_anonymous': isAnonymous,
          }, onConflict: 'prompt_id,user_id')
          .select()
          .single();

      _log.info('Submitted icebreaker response', tag: _tag);
      return IcebreakerResponse.fromJson(response);
    } catch (e) {
      _log.error('Failed to submit response: $e', tag: _tag);
      return null;
    }
  }

  /// Delete user's response
  Future<bool> deleteResponse(String responseId) async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return false;

      await SupabaseConfig.client
          .from('icebreaker_responses')
          .delete()
          .eq('id', responseId)
          .eq('user_id', userId);

      return true;
    } catch (e) {
      _log.error('Failed to delete response: $e', tag: _tag);
      return false;
    }
  }

  /// Toggle like on a response
  Future<bool> toggleLike(String responseId) async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return false;

      // Check if already liked
      final existing = await SupabaseConfig.client
          .from('icebreaker_response_likes')
          .select('id')
          .eq('response_id', responseId)
          .eq('user_id', userId)
          .maybeSingle();

      if (existing != null) {
        // Unlike
        await SupabaseConfig.client
            .from('icebreaker_response_likes')
            .delete()
            .eq('id', existing['id']);
        return false; // Now unliked
      } else {
        // Like
        await SupabaseConfig.client
            .from('icebreaker_response_likes')
            .insert({
              'response_id': responseId,
              'user_id': userId,
            });
        return true; // Now liked
      }
    } catch (e) {
      _log.error('Failed to toggle like: $e', tag: _tag);
      rethrow;
    }
  }

  /// Check if user has liked a response
  Future<bool> hasLiked(String responseId) async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return false;

      final response = await SupabaseConfig.client
          .from('icebreaker_response_likes')
          .select('id')
          .eq('response_id', responseId)
          .eq('user_id', userId)
          .maybeSingle();

      return response != null;
    } catch (e) {
      return false;
    }
  }
}

/// Icebreaker prompt model
class IcebreakerPrompt {
  final String id;
  final String eventId;
  final String question;
  final String promptType;
  final DateTime activeDate;
  final bool isActive;
  final DateTime createdAt;

  IcebreakerPrompt({
    required this.id,
    required this.eventId,
    required this.question,
    required this.promptType,
    required this.activeDate,
    required this.isActive,
    required this.createdAt,
  });

  factory IcebreakerPrompt.fromJson(Map<String, dynamic> json) {
    return IcebreakerPrompt(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      question: json['question'] as String,
      promptType: json['prompt_type'] as String? ?? 'daily',
      activeDate: DateTime.parse(json['active_date'] as String),
      isActive: json['is_active'] as bool? ?? true,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

/// Icebreaker response model
class IcebreakerResponse {
  final String id;
  final String promptId;
  final String userId;
  final String response;
  final bool isAnonymous;
  final int likesCount;
  final DateTime createdAt;
  final IcebreakerUserProfile? userProfile;

  IcebreakerResponse({
    required this.id,
    required this.promptId,
    required this.userId,
    required this.response,
    required this.isAnonymous,
    required this.likesCount,
    required this.createdAt,
    this.userProfile,
  });

  factory IcebreakerResponse.fromJson(Map<String, dynamic> json) {
    IcebreakerUserProfile? profile;
    if (json['user_profiles'] != null) {
      profile = IcebreakerUserProfile.fromJson(json['user_profiles']);
    }

    return IcebreakerResponse(
      id: json['id'] as String,
      promptId: json['prompt_id'] as String,
      userId: json['user_id'] as String,
      response: json['response'] as String,
      isAnonymous: json['is_anonymous'] as bool? ?? false,
      likesCount: json['likes_count'] as int? ?? 0,
      createdAt: DateTime.parse(json['created_at'] as String),
      userProfile: profile,
    );
  }

  String get displayName {
    if (isAnonymous) return 'Anonymous';
    return userProfile?.fullName ?? 'Unknown';
  }

  String? get avatarUrl {
    if (isAnonymous) return null;
    return userProfile?.profilePictureUrl;
  }
}

/// Minimal user profile for icebreaker display
class IcebreakerUserProfile {
  final String id;
  final String? fullName;
  final String? profilePictureUrl;
  final String? headline;

  IcebreakerUserProfile({
    required this.id,
    this.fullName,
    this.profilePictureUrl,
    this.headline,
  });

  factory IcebreakerUserProfile.fromJson(Map<String, dynamic> json) {
    return IcebreakerUserProfile(
      id: json['id'] as String,
      fullName: json['full_name'] as String?,
      profilePictureUrl: json['profile_picture_url'] as String?,
      headline: json['headline'] as String?,
    );
  }
}
