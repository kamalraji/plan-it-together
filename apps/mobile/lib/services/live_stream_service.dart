/// Live Stream Service
/// 
/// Handles all live stream operations including:
/// - Stream CRUD operations (create, read, update, delete)
/// - Viewer session tracking with heartbeat
/// - Real-time status and viewer count updates
/// - Platform-agnostic streaming support (YouTube, Vimeo, Custom)

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/models/live_stream.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:thittam1hub/utils/youtube_utils.dart';
import 'package:thittam1hub/services/logging_service.dart';

class LiveStreamService {
  static LiveStreamService? _instance;
  static LiveStreamService get instance => _instance ??= LiveStreamService._();
  LiveStreamService._();

  final _supabase = Supabase.instance.client;
  static const String _tag = 'LiveStreamService';
  final _log = LoggingService.instance;

  // Heartbeat interval (30 seconds)
  static const Duration _heartbeatInterval = Duration(seconds: 30);

  // Cache TTL (5 minutes)
  static const Duration _cacheTtl = Duration(minutes: 5);

  // Active heartbeat timers by stream ID
  final Map<String, Timer> _heartbeatTimers = {};

  // Stream subscriptions for real-time updates
  final Map<String, StreamSubscription> _subscriptions = {};

  // Cache for streams with timestamps
  final Map<String, _CachedStream> _streamCache = {};

  // Stream controllers for reactive updates
  final Map<String, StreamController<LiveStream>> _streamControllers = {};
  final Map<String, StreamController<int>> _viewerCountControllers = {};

  // ==================== CRUD Operations ====================

  /// Create a new live stream for a session
  Future<Result<LiveStream>> createStream({
    required String sessionId,
    required String eventId,
    required String streamUrl,
    bool chatEnabled = true,
  }) async {
    try {
      _log.debug('Creating stream for session: $sessionId', tag: _tag);

      // Parse the stream URL to extract video ID and platform
      final parsed = StreamUrlUtils.parseStreamUrl(streamUrl);
      if (parsed == null) {
        return Result.failure('Invalid stream URL. Please provide a valid YouTube or Vimeo URL.');
      }

      final response = await _supabase
          .from('event_live_streams')
          .insert({
            'session_id': sessionId,
            'event_id': eventId,
            'platform': parsed.platform,
            'video_id': parsed.videoId,
            'stream_url': streamUrl,
            'stream_status': 'scheduled',
            'chat_enabled': chatEnabled,
          })
          .select()
          .single();

      final stream = LiveStream.fromJson(response);
      _updateCache(stream);
      _log.info('Stream created: ${stream.id}', tag: _tag);
      return Result.success(stream);
    } catch (e, st) {
      _log.error('Error creating stream', tag: _tag, error: e, stackTrace: st);
      return Result.failure('Failed to create stream: ${e.toString()}');
    }
  }

  /// Update an existing live stream
  Future<Result<LiveStream>> updateStream({
    required String streamId,
    String? streamUrl,
    String? streamStatus,
    bool? chatEnabled,
  }) async {
    try {
      _log.debug('Updating stream: $streamId', tag: _tag);

      final updates = <String, dynamic>{};

      if (streamUrl != null) {
        final parsed = StreamUrlUtils.parseStreamUrl(streamUrl);
        if (parsed == null) {
          return Result.failure('Invalid stream URL.');
        }
        updates['platform'] = parsed.platform;
        updates['video_id'] = parsed.videoId;
        updates['stream_url'] = streamUrl;
      }

      if (streamStatus != null) {
        updates['stream_status'] = streamStatus;
        // Set timestamps based on status
        if (streamStatus == 'live') {
          updates['started_at'] = DateTime.now().toIso8601String();
        } else if (streamStatus == 'ended') {
          updates['ended_at'] = DateTime.now().toIso8601String();
        }
      }

      if (chatEnabled != null) {
        updates['chat_enabled'] = chatEnabled;
      }

      if (updates.isEmpty) {
        return Result.failure('No updates provided');
      }

      final response = await _supabase
          .from('event_live_streams')
          .update(updates)
          .eq('id', streamId)
          .select()
          .single();

      final stream = LiveStream.fromJson(response);
      _updateCache(stream);
      _notifyStreamUpdate(stream);
      _log.info('Stream updated: $streamId', tag: _tag);
      return Result.success(stream);
    } catch (e, st) {
      _log.error('Error updating stream', tag: _tag, error: e, stackTrace: st);
      return Result.failure('Failed to update stream: ${e.toString()}');
    }
  }

  /// Delete a live stream
  Future<Result<bool>> deleteStream(String streamId) async {
    try {
      _log.debug('Deleting stream: $streamId', tag: _tag);

      await _supabase
          .from('event_live_streams')
          .delete()
          .eq('id', streamId);

      _streamCache.remove(streamId);
      _closeStreamController(streamId);
      _log.info('Stream deleted: $streamId', tag: _tag);
      return Result.success(true);
    } catch (e, st) {
      _log.error('Error deleting stream', tag: _tag, error: e, stackTrace: st);
      return Result.failure('Failed to delete stream: ${e.toString()}');
    }
  }

  /// Start a live stream (change status to 'live')
  Future<Result<LiveStream>> startStream(String streamId) async {
    return updateStream(streamId: streamId, streamStatus: 'live');
  }

  /// End a live stream (change status to 'ended')
  Future<Result<LiveStream>> endStream(String streamId) async {
    return updateStream(streamId: streamId, streamStatus: 'ended');
  }

  /// Mark stream as having recording available
  Future<Result<LiveStream>> setRecordingAvailable({
    required String streamId,
    required String recordingUrl,
  }) async {
    try {
      final response = await _supabase
          .from('event_live_streams')
          .update({
            'is_recording_available': true,
            'recording_url': recordingUrl,
          })
          .eq('id', streamId)
          .select()
          .single();

      final stream = LiveStream.fromJson(response);
      _updateCache(stream);
      return Result.success(stream);
    } catch (e, st) {
      _log.error('Error setting recording', tag: _tag, error: e, stackTrace: st);
      return Result.failure('Failed to set recording: ${e.toString()}');
    }
  }

  // ==================== Read Operations ====================

  /// Get live stream for a specific session
  Future<Result<LiveStream?>> getStreamForSession(String sessionId) async {
    try {
      _log.debug('Fetching stream for session: $sessionId', tag: _tag);

      final response = await _supabase
          .from('event_live_streams')
          .select()
          .eq('session_id', sessionId)
          .maybeSingle();

      if (response == null) {
        return Result.success(null);
      }

      final stream = LiveStream.fromJson(response);
      _updateCache(stream);
      return Result.success(stream);
    } catch (e, st) {
      _log.error('Error fetching stream for session', tag: _tag, error: e, stackTrace: st);
      return Result.failure('Failed to load stream: ${e.toString()}');
    }
  }

  /// Get all streams for an event
  Future<Result<List<LiveStream>>> getStreamsForEvent(String eventId) async {
    try {
      _log.debug('Fetching streams for event: $eventId', tag: _tag);

      final response = await _supabase
          .from('event_live_streams')
          .select()
          .eq('event_id', eventId)
          .order('created_at', ascending: true);

      final streams = (response as List)
          .map((json) => LiveStream.fromJson(json))
          .toList();

      // Update cache
      for (final stream in streams) {
        _updateCache(stream);
      }

      return Result.success(streams);
    } catch (e, st) {
      _log.error('Error fetching streams for event', tag: _tag, error: e, stackTrace: st);
      return Result.failure('Failed to load streams: ${e.toString()}');
    }
  }

  /// Get all currently live streams for an event
  Future<Result<List<LiveStream>>> getLiveStreamsForEvent(String eventId) async {
    try {
      final response = await _supabase
          .from('event_live_streams')
          .select()
          .eq('event_id', eventId)
          .eq('stream_status', 'live')
          .order('started_at', ascending: false);

      final streams = (response as List)
          .map((json) => LiveStream.fromJson(json))
          .toList();

      for (final stream in streams) {
        _updateCache(stream);
      }

      return Result.success(streams);
    } catch (e, st) {
      _log.error('Error fetching live streams', tag: _tag, error: e, stackTrace: st);
      return Result.failure('Failed to load live streams');
    }
  }

  /// Get all currently live streams for events the user is checked into
  Future<Result<List<LiveStream>>> getLiveNowStreams() async {
    try {
      _log.debug('Fetching live now streams', tag: _tag);

      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) {
        return Result.failure('User not authenticated');
      }

      // Get events user is checked into
      final checkins = await _supabase
          .from('event_checkins')
          .select('event_id')
          .eq('user_id', userId)
          .isFilter('checkout_time', null);

      if ((checkins as List).isEmpty) {
        return Result.success([]);
      }

      final eventIds = checkins.map((c) => c['event_id'] as String).toList();

      // Get live streams for those events
      final response = await _supabase
          .from('event_live_streams')
          .select()
          .inFilter('event_id', eventIds)
          .eq('stream_status', 'live')
          .order('started_at', ascending: false);

      final streams = (response as List)
          .map((json) => LiveStream.fromJson(json))
          .toList();

      return Result.success(streams);
    } catch (e, st) {
      _log.error('Error fetching live now streams', tag: _tag, error: e, stackTrace: st);
      return Result.failure('Failed to load live streams: ${e.toString()}');
    }
  }

  /// Get a single stream by ID (with cache)
  Future<Result<LiveStream?>> getStream(String streamId, {bool forceRefresh = false}) async {
    // Check cache first (if not forcing refresh)
    if (!forceRefresh) {
      final cached = _getCachedStream(streamId);
      if (cached != null) {
        return Result.success(cached);
      }
    }

    try {
      final response = await _supabase
          .from('event_live_streams')
          .select()
          .eq('id', streamId)
          .maybeSingle();

      if (response == null) {
        return Result.success(null);
      }

      final stream = LiveStream.fromJson(response);
      _updateCache(stream);
      return Result.success(stream);
    } catch (e, st) {
      _log.error('Error fetching stream', tag: _tag, error: e, stackTrace: st);
      return Result.failure('Failed to load stream: ${e.toString()}');
    }
  }

  // ==================== Viewer Session Tracking ====================

  /// Start viewer session and begin heartbeat
  Future<Result<void>> startViewerSession(
    String streamId, {
    String quality = 'auto',
    String? deviceType,
  }) async {
    try {
      _log.debug('Starting viewer session for stream: $streamId', tag: _tag);

      // Call RPC to update heartbeat (handles upsert)
      await _supabase.rpc('update_stream_viewer_heartbeat', params: {
        'p_stream_id': streamId,
        'p_quality': quality,
        'p_device_type': deviceType ?? _getDeviceType(),
      });

      // Start heartbeat timer
      _startHeartbeat(streamId, quality);

      return Result.success(null);
    } catch (e, st) {
      _log.error('Error starting viewer session', tag: _tag, error: e, stackTrace: st);
      return Result.failure('Failed to start viewing: ${e.toString()}');
    }
  }

  /// Update viewer heartbeat (called periodically)
  Future<Result<void>> updateViewerHeartbeat(
    String streamId, {
    String quality = 'auto',
  }) async {
    try {
      await _supabase.rpc('update_stream_viewer_heartbeat', params: {
        'p_stream_id': streamId,
        'p_quality': quality,
      });

      return Result.success(null);
    } catch (e) {
      // Silent failure for heartbeat - don't interrupt viewing
      _log.warning('Heartbeat failed: $e', tag: _tag);
      return Result.failure('Heartbeat failed');
    }
  }

  /// End viewer session and stop heartbeat
  Future<Result<void>> endViewerSession(String streamId) async {
    try {
      _log.debug('Ending viewer session for stream: $streamId', tag: _tag);

      // Stop heartbeat timer
      _stopHeartbeat(streamId);

      // Final heartbeat to record final duration
      await _supabase.rpc('update_stream_viewer_heartbeat', params: {
        'p_stream_id': streamId,
      });

      return Result.success(null);
    } catch (e, st) {
      _log.error('Error ending viewer session', tag: _tag, error: e, stackTrace: st);
      return Result.failure('Failed to end viewing: ${e.toString()}');
    }
  }

  /// Get current viewer count for a stream
  Future<Result<int>> getViewerCount(String streamId) async {
    try {
      final count = await _supabase.rpc('get_stream_viewer_count', params: {
        'p_stream_id': streamId,
      });

      final viewerCount = count as int? ?? 0;
      _notifyViewerCountUpdate(streamId, viewerCount);
      return Result.success(viewerCount);
    } catch (e, st) {
      _log.error('Error getting viewer count', tag: _tag, error: e, stackTrace: st);
      return Result.failure('Failed to get viewer count');
    }
  }

  // ==================== Real-time Subscriptions ====================

  /// Subscribe to stream status changes (uses Supabase realtime)
  Stream<LiveStream> streamStatusUpdates(String streamId) {
    _log.debug('Subscribing to stream status: $streamId', tag: _tag);

    return _supabase
        .from('event_live_streams')
        .stream(primaryKey: ['id'])
        .eq('id', streamId)
        .map((rows) {
          if (rows.isEmpty) {
            throw Exception('Stream not found');
          }
          final stream = LiveStream.fromJson(rows.first);
          _updateCache(stream);
          return stream;
        });
  }

  /// Get a broadcast stream for stream updates (for multiple listeners)
  Stream<LiveStream> getStreamUpdates(String streamId) {
    if (!_streamControllers.containsKey(streamId)) {
      _streamControllers[streamId] = StreamController<LiveStream>.broadcast();
      
      // Start listening to realtime updates
      _subscriptions[streamId] = streamStatusUpdates(streamId).listen(
        (stream) => _streamControllers[streamId]?.add(stream),
        onError: (e) => _log.error('Stream update error', tag: _tag, error: e),
      );
    }
    return _streamControllers[streamId]!.stream;
  }

  /// Subscribe to viewer count updates (polls every 10 seconds)
  Stream<int> streamViewerCount(String streamId) {
    if (!_viewerCountControllers.containsKey(streamId)) {
      _viewerCountControllers[streamId] = StreamController<int>.broadcast();
      
      // Start periodic polling
      Timer.periodic(const Duration(seconds: 10), (timer) async {
        if (_viewerCountControllers[streamId]?.isClosed ?? true) {
          timer.cancel();
          return;
        }
        final result = await getViewerCount(streamId);
        if (result.isSuccess) {
          _viewerCountControllers[streamId]?.add(result.data);
        }
      });
    }
    return _viewerCountControllers[streamId]!.stream;
  }

  /// Subscribe to all stream changes for an event
  Stream<List<LiveStream>> eventStreamsUpdates(String eventId) {
    return _supabase
        .from('event_live_streams')
        .stream(primaryKey: ['id'])
        .eq('event_id', eventId)
        .map((rows) => rows.map((r) => LiveStream.fromJson(r)).toList());
  }

  // ==================== Heartbeat Management ====================

  void _startHeartbeat(String streamId, String quality) {
    // Cancel existing timer if any
    _stopHeartbeat(streamId);

    // Create new periodic timer
    _heartbeatTimers[streamId] = Timer.periodic(_heartbeatInterval, (_) {
      updateViewerHeartbeat(streamId, quality: quality);
    });

    _log.debug('Started heartbeat for stream: $streamId', tag: _tag);
  }

  void _stopHeartbeat(String streamId) {
    _heartbeatTimers[streamId]?.cancel();
    _heartbeatTimers.remove(streamId);
    _log.debug('Stopped heartbeat for stream: $streamId', tag: _tag);
  }

  /// Stop all active heartbeats (call on app dispose)
  void stopAllHeartbeats() {
    for (final timer in _heartbeatTimers.values) {
      timer.cancel();
    }
    _heartbeatTimers.clear();
    _log.debug('Stopped all heartbeats', tag: _tag);
  }

  // ==================== Cache Management ====================

  void _updateCache(LiveStream stream) {
    _streamCache[stream.id] = _CachedStream(stream, DateTime.now());
  }

  LiveStream? _getCachedStream(String streamId) {
    final cached = _streamCache[streamId];
    if (cached == null) return null;
    
    // Check if cache is still valid
    if (DateTime.now().difference(cached.cachedAt) > _cacheTtl) {
      _streamCache.remove(streamId);
      return null;
    }
    
    return cached.stream;
  }

  void clearCache() {
    _streamCache.clear();
    _log.debug('Cache cleared', tag: _tag);
  }

  LiveStream? getCachedStream(String streamId) {
    return _streamCache[streamId]?.stream;
  }

  // ==================== Stream Controller Management ====================

  void _notifyStreamUpdate(LiveStream stream) {
    _streamControllers[stream.id]?.add(stream);
  }

  void _notifyViewerCountUpdate(String streamId, int count) {
    _viewerCountControllers[streamId]?.add(count);
  }

  void _closeStreamController(String streamId) {
    _subscriptions[streamId]?.cancel();
    _subscriptions.remove(streamId);
    _streamControllers[streamId]?.close();
    _streamControllers.remove(streamId);
    _viewerCountControllers[streamId]?.close();
    _viewerCountControllers.remove(streamId);
  }

  // ==================== Helpers ====================

  String _getDeviceType() {
    if (kIsWeb) return 'web';
    // Platform detection would go here for native
    return 'mobile';
  }

  /// Check if user is currently watching a stream
  bool isWatching(String streamId) {
    return _heartbeatTimers.containsKey(streamId);
  }

  /// Get list of streams user is currently watching
  List<String> get activeViewerSessions => _heartbeatTimers.keys.toList();

  /// Clean up resources
  void dispose() {
    stopAllHeartbeats();
    
    for (final sub in _subscriptions.values) {
      sub.cancel();
    }
    _subscriptions.clear();
    
    for (final controller in _streamControllers.values) {
      controller.close();
    }
    _streamControllers.clear();
    
    for (final controller in _viewerCountControllers.values) {
      controller.close();
    }
    _viewerCountControllers.clear();
    
    _streamCache.clear();
    _log.debug('Service disposed', tag: _tag);
  }
}

/// Internal cache wrapper with timestamp
class _CachedStream {
  final LiveStream stream;
  final DateTime cachedAt;
  
  _CachedStream(this.stream, this.cachedAt);
}
