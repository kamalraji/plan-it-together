import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
export 'package:image_picker/image_picker.dart' show XFile, ImageSource, CameraDevice;
import 'package:path_provider/path_provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
export 'package:supabase_flutter/supabase_flutter.dart' show FileOptions;
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/video_thumbnail_service.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Custom exception for video validation errors
class VideoValidationError implements Exception {
  final String message;
  VideoValidationError(this.message);
  
  @override
  String toString() => message;
}

/// Model for a video story
@immutable
class VideoStory {
  final String id;
  final String userId;
  final String videoUrl;
  final String? thumbnailUrl;
  final String? caption;
  final int durationSeconds;
  final DateTime createdAt;
  final DateTime expiresAt;
  final int viewCount;
  final int uniqueViewCount;
  final int reactionCount;
  final double completionRate;
  final bool isViewed;
  final String? userName;
  final String? userAvatar;

  const VideoStory({
    required this.id,
    required this.userId,
    required this.videoUrl,
    this.thumbnailUrl,
    this.caption,
    required this.durationSeconds,
    required this.createdAt,
    required this.expiresAt,
    this.viewCount = 0,
    this.uniqueViewCount = 0,
    this.reactionCount = 0,
    this.completionRate = 0.0,
    this.isViewed = false,
    this.userName,
    this.userAvatar,
  });

  factory VideoStory.fromMap(Map<String, dynamic> map) {
    return VideoStory(
      id: map['id'] as String,
      userId: map['user_id'] as String,
      videoUrl: map['video_url'] as String,
      thumbnailUrl: map['thumbnail_url'] as String?,
      caption: map['caption'] as String?,
      durationSeconds: map['duration_seconds'] as int? ?? 0,
      createdAt: DateTime.parse(map['created_at'] as String),
      expiresAt: DateTime.parse(map['expires_at'] as String),
      viewCount: map['view_count'] as int? ?? 0,
      uniqueViewCount: map['unique_view_count'] as int? ?? 0,
      reactionCount: map['reaction_count'] as int? ?? 0,
      completionRate: (map['completion_rate'] as num?)?.toDouble() ?? 0.0,
      isViewed: map['is_viewed'] as bool? ?? false,
      userName: map['user_name'] as String?,
      userAvatar: map['user_avatar'] as String?,
    );
  }

  bool get isExpired => DateTime.now().isAfter(expiresAt);
  
  Duration get timeRemaining => expiresAt.difference(DateTime.now());
  
  String get timeRemainingFormatted {
    final remaining = timeRemaining;
    if (remaining.isNegative) return 'Expired';
    if (remaining.inHours > 0) return '${remaining.inHours}h left';
    return '${remaining.inMinutes}m left';
  }
  
  VideoStory copyWith({
    String? id,
    String? userId,
    String? videoUrl,
    String? thumbnailUrl,
    String? caption,
    int? durationSeconds,
    DateTime? createdAt,
    DateTime? expiresAt,
    int? viewCount,
    int? uniqueViewCount,
    int? reactionCount,
    double? completionRate,
    bool? isViewed,
    String? userName,
    String? userAvatar,
  }) {
    return VideoStory(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      videoUrl: videoUrl ?? this.videoUrl,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      caption: caption ?? this.caption,
      durationSeconds: durationSeconds ?? this.durationSeconds,
      createdAt: createdAt ?? this.createdAt,
      expiresAt: expiresAt ?? this.expiresAt,
      viewCount: viewCount ?? this.viewCount,
      uniqueViewCount: uniqueViewCount ?? this.uniqueViewCount,
      reactionCount: reactionCount ?? this.reactionCount,
      completionRate: completionRate ?? this.completionRate,
      isViewed: isViewed ?? this.isViewed,
      userName: userName ?? this.userName,
      userAvatar: userAvatar ?? this.userAvatar,
    );
  }
}

/// Model for story reaction
@immutable
class StoryReaction {
  final String id;
  final String storyId;
  final String userId;
  final String? emoji;
  final String? message;
  final DateTime createdAt;
  final String? userName;
  final String? userAvatar;

  const StoryReaction({
    required this.id,
    required this.storyId,
    required this.userId,
    this.emoji,
    this.message,
    required this.createdAt,
    this.userName,
    this.userAvatar,
  });

  factory StoryReaction.fromMap(Map<String, dynamic> map) {
    final profile = map['impact_profiles'] as Map<String, dynamic>?;
    return StoryReaction(
      id: map['id'] as String,
      storyId: map['story_id'] as String,
      userId: map['user_id'] as String,
      emoji: map['emoji'] as String?,
      message: map['message'] as String?,
      createdAt: DateTime.parse(map['created_at'] as String),
      userName: profile?['full_name'] as String?,
      userAvatar: profile?['avatar_url'] as String?,
    );
  }
}

/// Model for story highlight collection
@immutable
class StoryHighlight {
  final String id;
  final String userId;
  final String title;
  final String? coverUrl;
  final List<String> storyIds;
  final DateTime createdAt;
  final List<VideoStory>? stories;

  const StoryHighlight({
    required this.id,
    required this.userId,
    required this.title,
    this.coverUrl,
    required this.storyIds,
    required this.createdAt,
    this.stories,
  });

  factory StoryHighlight.fromMap(Map<String, dynamic> map) {
    return StoryHighlight(
      id: map['id'] as String,
      userId: map['user_id'] as String,
      title: map['title'] as String,
      coverUrl: map['cover_url'] as String?,
      storyIds: List<String>.from(map['story_ids'] ?? []),
      createdAt: DateTime.parse(map['created_at'] as String),
    );
  }
}

/// Model for story analytics
@immutable
class StoryAnalytics {
  final int totalViews;
  final int uniqueViews;
  final double completionRate;
  final int avgWatchTimeSeconds;
  final Map<String, int> reactionCounts;
  final List<StoryViewerInfo> topViewers;

  const StoryAnalytics({
    this.totalViews = 0,
    this.uniqueViews = 0,
    this.completionRate = 0.0,
    this.avgWatchTimeSeconds = 0,
    this.reactionCounts = const {},
    this.topViewers = const [],
  });
}

/// Viewer info for analytics
@immutable
class StoryViewerInfo {
  final String id;
  final String name;
  final String? avatar;
  final DateTime viewedAt;
  final double watchPercentage;

  const StoryViewerInfo({
    required this.id,
    required this.name,
    this.avatar,
    required this.viewedAt,
    this.watchPercentage = 0.0,
  });
}

/// Service for managing video stories with industry best practices
class VideoStoryService {
  static const String _tag = 'VideoStory';
  static final _log = LoggingService.instance;
  
  // Constants
  static const int maxVideoSizeBytes = 50 * 1024 * 1024; // 50MB
  static const int maxVideoDurationSeconds = 30;
  static const List<String> allowedVideoExtensions = ['mp4', 'mov', 'avi', 'webm'];
  static const String storiesBucket = 'video-stories';
  static const String thumbnailsBucket = 'story-thumbnails';
  static const Duration storyDuration = Duration(hours: 24);
  
  // Quick reaction emojis
  static const List<String> quickReactions = ['❤️', '🔥', '😂', '😮', '😢', '👏'];
  
  final _supabase = SupabaseConfig.client;
  final _picker = ImagePicker();
  
  /// Get current user ID
  String? get currentUserId => _supabase.auth.currentUser?.id;
  
  // ============================================================
  // VIDEO PICKING & VALIDATION
  // ============================================================
  
  /// Pick video from gallery
  Future<XFile?> pickVideoFromGallery() async {
    try {
      final video = await _picker.pickVideo(
        source: ImageSource.gallery,
        maxDuration: Duration(seconds: maxVideoDurationSeconds),
      );
      return video;
    } catch (e) {
      _log.error('Error picking video from gallery', tag: _tag, error: e);
      return null;
    }
  }
  
  /// Record video from camera
  Future<XFile?> recordVideo() async {
    try {
      final video = await _picker.pickVideo(
        source: ImageSource.camera,
        maxDuration: Duration(seconds: maxVideoDurationSeconds),
        preferredCameraDevice: CameraDevice.front,
      );
      return video;
    } catch (e) {
      _log.error('Error recording video', tag: _tag, error: e);
      return null;
    }
  }
  
  /// Validate video file before upload
  Future<Uint8List> validateVideo(XFile file) async {
    final bytes = await file.readAsBytes();
    
    // Validate file size
    if (bytes.length > maxVideoSizeBytes) {
      throw VideoValidationError('Video too large (max 50MB)');
    }
    
    // Validate file type
    final ext = file.path.split('.').last.toLowerCase();
    if (!allowedVideoExtensions.contains(ext)) {
      throw VideoValidationError('Invalid video format. Use MP4, MOV, or WebM');
    }
    
    return bytes;
  }
  
  // ============================================================
  // THUMBNAIL GENERATION
  // ============================================================
  
  final _thumbnailService = VideoThumbnailService.instance;
  
  /// Generate thumbnail from video file path
  /// Uses video_thumbnail package for actual frame extraction
  Future<Uint8List?> generateThumbnail(String videoPath) async {
    try {
      final result = await _thumbnailService.generateFromPath(
        videoPath: videoPath,
        maxWidth: VideoThumbnailService.thumbnailSizeLarge,
        quality: VideoThumbnailService.thumbnailQualityMedium,
        timeMs: 500, // Capture frame at 0.5 seconds for better content
      );
      
      if (!result.isSuccess) {
        _log.warning('Failed to generate thumbnail: ${result.errorMessage}', tag: _tag);
        return null;
      }
      
      final thumbnail = result.data;
      if (thumbnail != null) {
        _log.debug('Generated thumbnail: ${thumbnail.length} bytes', tag: _tag);
      }
      
      return thumbnail;
    } catch (e) {
      _log.error('Error generating thumbnail', tag: _tag, error: e);
      return null;
    }
  }
  
  /// Generate thumbnail from video URL (for already uploaded videos)
  Future<Uint8List?> generateThumbnailFromUrl(String videoUrl) async {
    try {
      final result = await _thumbnailService.generateFromUrl(
        videoUrl: videoUrl,
        maxWidth: VideoThumbnailService.thumbnailSizeLarge,
        quality: VideoThumbnailService.thumbnailQualityMedium,
        timeMs: 500,
      );
      return result.isSuccess ? result.data : null;
    } catch (e) {
      _log.error('Error generating thumbnail from URL', tag: _tag, error: e);
      return null;
    }
  }
  
  /// Generate preview strip for video scrubbing
  Future<List<Uint8List>> generatePreviewStrip({
    required String videoPath,
    required int videoDurationMs,
    int frameCount = 5,
  }) async {
    final result = await _thumbnailService.generatePreviewStrip(
      videoPath: videoPath,
      videoDurationMs: videoDurationMs,
      frameCount: frameCount,
    );
    return result.isSuccess ? result.data : <Uint8List>[];
  }
  
  /// Upload thumbnail to storage
  Future<String?> uploadThumbnail({
    required Uint8List bytes,
    required String storyId,
  }) async {
    try {
      final path = 'thumbnails/$storyId.jpg';
      
      await _supabase.storage
          .from(thumbnailsBucket)
          .uploadBinary(path, bytes, fileOptions: FileOptions(
            contentType: 'image/jpeg',
            upsert: true,
          ));
      
      return _supabase.storage.from(thumbnailsBucket).getPublicUrl(path);
    } catch (e) {
      _log.error('Error uploading thumbnail', tag: _tag, error: e);
      return null;
    }
  }
  
  // ============================================================
  // STORY UPLOAD & CREATION
  // ============================================================
  
  /// Upload video story to Supabase Storage with compression
  Future<String> uploadVideoStory({
    required Uint8List bytes,
    required String fileName,
    void Function(double)? onProgress,
  }) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');
      
      // Generate unique file path
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final ext = fileName.split('.').last.toLowerCase();
      final path = 'stories/$userId/${timestamp}_story.$ext';
      
      onProgress?.call(0.1);
      
      // In production, compress video here using video_compress package
      // final compressed = await VideoCompress.compressVideo(...);
      
      onProgress?.call(0.3);
      
      // Upload to Supabase Storage
      await _supabase.storage
          .from(storiesBucket)
          .uploadBinary(path, bytes, fileOptions: FileOptions(
            contentType: 'video/$ext',
            upsert: true,
          ));
      
      onProgress?.call(0.9);
      
      // Get public URL
      final publicUrl = _supabase.storage
          .from(storiesBucket)
          .getPublicUrl(path);
      
      onProgress?.call(1.0);
      
      _log.info('Video story uploaded', tag: _tag, metadata: {'path': path});
      return publicUrl;
    } catch (e) {
      _log.error('Error uploading video story', tag: _tag, error: e);
      rethrow;
    }
  }
  
  /// Create a new video story record in database
  Future<VideoStory?> createVideoStory({
    required String videoUrl,
    String? thumbnailUrl,
    String? caption,
    int durationSeconds = 0,
  }) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');
      
      final expiresAt = DateTime.now().add(storyDuration);
      
      final response = await _supabase
          .from('video_stories')
          .insert({
            'user_id': userId,
            'video_url': videoUrl,
            'thumbnail_url': thumbnailUrl,
            'caption': caption,
            'duration_seconds': durationSeconds,
            'expires_at': expiresAt.toIso8601String(),
          })
          .select()
          .single();
      
      return VideoStory.fromMap(response);
    } catch (e) {
      _log.error('Error creating video story', tag: _tag, error: e);
      return null;
    }
  }
  
  // ============================================================
  // STORY RETRIEVAL
  // ============================================================
  
  /// Get active stories from all users
  Future<List<VideoStory>> getActiveStories() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      
      final response = await _supabase
          .from('video_stories')
          .select('''
            *,
            impact_profiles!inner(full_name, avatar_url)
          ''')
          .gt('expires_at', DateTime.now().toIso8601String())
          .order('created_at', ascending: false);
      
      // Get viewed stories for current user
      Set<String> viewedStoryIds = {};
      if (userId != null) {
        try {
          final views = await _supabase
              .from('story_views')
              .select('story_id')
              .eq('viewer_id', userId);
          viewedStoryIds = views.map((v) => v['story_id'] as String).toSet();
        } catch (_) {}
      }
      
      return response.map((row) {
        final profile = row['impact_profiles'] as Map<String, dynamic>?;
        return VideoStory(
          id: row['id'] as String,
          userId: row['user_id'] as String,
          videoUrl: row['video_url'] as String,
          thumbnailUrl: row['thumbnail_url'] as String?,
          caption: row['caption'] as String?,
          durationSeconds: row['duration_seconds'] as int? ?? 0,
          createdAt: DateTime.parse(row['created_at'] as String),
          expiresAt: DateTime.parse(row['expires_at'] as String),
          viewCount: row['view_count'] as int? ?? 0,
          uniqueViewCount: row['unique_view_count'] as int? ?? 0,
          reactionCount: row['reaction_count'] as int? ?? 0,
          completionRate: (row['completion_rate'] as num?)?.toDouble() ?? 0.0,
          isViewed: viewedStoryIds.contains(row['id']),
          userName: profile?['full_name'] as String?,
          userAvatar: profile?['avatar_url'] as String?,
        );
      }).toList();
    } catch (e) {
      _log.error('Failed to fetch active stories', tag: _tag, error: e);
      return [];
    }
  }
  
  /// Get stories for a specific user
  Future<List<VideoStory>> getUserStories(String userId) async {
    try {
      final response = await _supabase
          .from('video_stories')
          .select()
          .eq('user_id', userId)
          .gt('expires_at', DateTime.now().toIso8601String())
          .order('created_at', ascending: false);
      
      return response.map((row) => VideoStory.fromMap(row)).toList();
    } catch (e) {
      _log.error('Failed to fetch user stories', tag: _tag, error: e);
      return [];
    }
  }
  
  /// Get current user's stories
  Future<List<VideoStory>> getMyStories() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return [];
    return getUserStories(userId);
  }
  
  /// Preload next stories for smooth playback
  Future<void> preloadStories(List<VideoStory> stories, int currentIndex) async {
    // Preload next 2 stories
    for (int i = 1; i <= 2; i++) {
      final nextIndex = currentIndex + i;
      if (nextIndex < stories.length) {
        final story = stories[nextIndex];
        // In production, use video preloading library
        _log.debug('Preloading story', tag: _tag, metadata: {'story_id': story.id});
      }
    }
  }
  
  // ============================================================
  // STORY VIEWS & ANALYTICS
  // ============================================================
  
  /// Mark story as viewed with watch progress
  Future<void> markStoryViewed(String storyId, {double watchPercentage = 1.0}) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return;
      
      // Insert view record (ignore if already exists)
      await _supabase
          .from('story_views')
          .upsert({
            'story_id': storyId,
            'viewer_id': userId,
            'viewed_at': DateTime.now().toIso8601String(),
            'watch_percentage': watchPercentage,
          }, onConflict: 'story_id,viewer_id');
      
      // Increment view count
      await _supabase.rpc('increment_story_view_count', params: {
        'story_uuid': storyId,
      });
      
      // Update completion rate if fully watched
      if (watchPercentage >= 0.9) {
        await _supabase.rpc('update_story_completion_rate', params: {
          'story_uuid': storyId,
        });
      }
    } catch (e) {
      _log.error('Error marking story viewed', tag: _tag, error: e);
    }
  }
  
  /// Get story analytics (for story owner)
  Future<StoryAnalytics> getStoryAnalytics(String storyId) async {
    try {
      // Get view statistics
      final views = await _supabase
          .from('story_views')
          .select('''
            viewed_at,
            watch_percentage,
            impact_profiles!inner(id, full_name, avatar_url)
          ''')
          .eq('story_id', storyId)
          .order('viewed_at', ascending: false);
      
      // Get reaction counts
      final reactions = await _supabase
          .from('story_reactions')
          .select('emoji')
          .eq('story_id', storyId);
      
      // Calculate reaction counts by emoji
      final Map<String, int> reactionCounts = {};
      for (final reaction in reactions) {
        final emoji = reaction['emoji'] as String?;
        if (emoji != null) {
          reactionCounts[emoji] = (reactionCounts[emoji] ?? 0) + 1;
        }
      }
      
      // Calculate average watch time
      double avgWatch = 0;
      if (views.isNotEmpty) {
        final total = views.fold<double>(
          0,
          (sum, v) => sum + ((v['watch_percentage'] as num?)?.toDouble() ?? 0),
        );
        avgWatch = total / views.length;
      }
      
      // Get top viewers
      final topViewers = views.take(10).map((v) {
        final profile = v['impact_profiles'] as Map<String, dynamic>;
        return StoryViewerInfo(
          id: profile['id'] as String,
          name: profile['full_name'] as String? ?? 'Unknown',
          avatar: profile['avatar_url'] as String?,
          viewedAt: DateTime.parse(v['viewed_at'] as String),
          watchPercentage: (v['watch_percentage'] as num?)?.toDouble() ?? 0,
        );
      }).toList();
      
      return StoryAnalytics(
        totalViews: views.length,
        uniqueViews: views.length,
        completionRate: avgWatch,
        avgWatchTimeSeconds: (avgWatch * 30).round(),
        reactionCounts: reactionCounts,
        topViewers: topViewers,
      );
    } catch (e) {
      _log.error('Error fetching story analytics', tag: _tag, error: e);
      return const StoryAnalytics();
    }
  }
  
  /// Get story viewers (for story owner)
  Future<List<Map<String, dynamic>>> getStoryViewers(String storyId) async {
    try {
      final response = await _supabase
          .from('story_views')
          .select('''
            viewed_at,
            watch_percentage,
            impact_profiles!inner(id, full_name, avatar_url)
          ''')
          .eq('story_id', storyId)
          .order('viewed_at', ascending: false);
      
      return response.map((row) {
        final profile = row['impact_profiles'] as Map<String, dynamic>;
        return {
          'id': profile['id'],
          'name': profile['full_name'],
          'avatar': profile['avatar_url'],
          'viewedAt': row['viewed_at'],
          'watchPercentage': row['watch_percentage'],
        };
      }).toList();
    } catch (e) {
      _log.error('Error fetching story viewers', tag: _tag, error: e);
      return [];
    }
  }
  
  // ============================================================
  // REACTIONS & REPLIES
  // ============================================================
  
  /// React to a story with emoji
  Future<bool> reactToStory(String storyId, String emoji) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return false;
      
      await _supabase.from('story_reactions').upsert({
        'story_id': storyId,
        'user_id': userId,
        'emoji': emoji,
        'created_at': DateTime.now().toIso8601String(),
      }, onConflict: 'story_id,user_id');
      
      // Increment reaction count
      await _supabase.rpc('increment_story_reaction_count', params: {
        'story_uuid': storyId,
      });
      
      return true;
    } catch (e) {
      _log.error('Error reacting to story', tag: _tag, error: e);
      return false;
    }
  }
  
  /// Reply to a story with a message
  Future<bool> replyToStory(String storyId, String message) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return false;
      
      await _supabase.from('story_reactions').insert({
        'story_id': storyId,
        'user_id': userId,
        'message': message,
        'created_at': DateTime.now().toIso8601String(),
      });
      
      return true;
    } catch (e) {
      _log.error('Error replying to story', tag: _tag, error: e);
      return false;
    }
  }
  
  /// Get reactions for a story
  Future<List<StoryReaction>> getStoryReactions(String storyId) async {
    try {
      final response = await _supabase
          .from('story_reactions')
          .select('''
            *,
            impact_profiles!inner(full_name, avatar_url)
          ''')
          .eq('story_id', storyId)
          .order('created_at', ascending: false);
      
      return response.map((row) => StoryReaction.fromMap(row)).toList();
    } catch (e) {
      _log.error('Error fetching story reactions', tag: _tag, error: e);
      return [];
    }
  }
  
  // ============================================================
  // STORY HIGHLIGHTS
  // ============================================================
  
  /// Create a new story highlight
  Future<StoryHighlight?> createHighlight({
    required String title,
    String? coverUrl,
    required List<String> storyIds,
  }) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return null;
      
      final response = await _supabase
          .from('story_highlights')
          .insert({
            'user_id': userId,
            'title': title,
            'cover_url': coverUrl,
            'story_ids': storyIds,
          })
          .select()
          .single();
      
      return StoryHighlight.fromMap(response);
    } catch (e) {
      _log.error('Error creating highlight', tag: _tag, error: e);
      return null;
    }
  }
  
  /// Get user's highlights
  Future<List<StoryHighlight>> getUserHighlights(String userId) async {
    try {
      final response = await _supabase
          .from('story_highlights')
          .select()
          .eq('user_id', userId)
          .order('created_at', ascending: false);
      
      return response.map((row) => StoryHighlight.fromMap(row)).toList();
    } catch (e) {
      _log.error('Error fetching highlights', tag: _tag, error: e);
      return [];
    }
  }
  
  /// Add story to existing highlight
  Future<bool> addToHighlight(String highlightId, String storyId) async {
    try {
      await _supabase.rpc('add_story_to_highlight', params: {
        'highlight_uuid': highlightId,
        'story_uuid': storyId,
      });
      return true;
    } catch (e) {
      _log.error('Error adding to highlight', tag: _tag, error: e);
      return false;
    }
  }
  
  /// Delete highlight
  Future<bool> deleteHighlight(String highlightId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return false;
      
      await _supabase
          .from('story_highlights')
          .delete()
          .eq('id', highlightId)
          .eq('user_id', userId);
      
      return true;
    } catch (e) {
      _log.error('Error deleting highlight', tag: _tag, error: e);
      return false;
    }
  }
  
  // ============================================================
  // STORY MANAGEMENT
  // ============================================================
  
  /// Delete a story (owner only)
  Future<bool> deleteStory(String storyId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return false;
      
      await _supabase
          .from('video_stories')
          .delete()
          .eq('id', storyId)
          .eq('user_id', userId);
      
      return true;
    } catch (e) {
      _log.error('Error deleting story', tag: _tag, error: e);
      return false;
    }
  }
  
  /// Report a story
  Future<bool> reportStory(String storyId, String reason) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return false;
      
      await _supabase.from('story_reports').insert({
        'story_id': storyId,
        'reporter_id': userId,
        'reason': reason,
        'created_at': DateTime.now().toIso8601String(),
      });
      
      return true;
    } catch (e) {
      _log.error('Error reporting story', tag: _tag, error: e);
      return false;
    }
  }
  
  // ============================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================
  
  /// Subscribe to new stories from followed users
  Stream<List<VideoStory>> subscribeToNewStories() {
    return _supabase
        .from('video_stories')
        .stream(primaryKey: ['id'])
        .gt('expires_at', DateTime.now().toIso8601String())
        .order('created_at', ascending: false)
        .map((data) => data.map((row) => VideoStory.fromMap(row)).toList());
  }
}
