import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/services/base_service.dart';

/// Performance metrics for AI matching operations
class AIMatchingMetrics {
  final int requestCount;
  final int cacheHits;
  final int cacheMisses;
  final int errorCount;
  final double avgResponseTimeMs;
  final DateTime lastUpdated;

  AIMatchingMetrics({
    required this.requestCount,
    required this.cacheHits,
    required this.cacheMisses,
    required this.errorCount,
    required this.avgResponseTimeMs,
    required this.lastUpdated,
  });

  double get cacheHitRate => 
    requestCount > 0 ? (cacheHits / requestCount) * 100 : 0;

  Map<String, dynamic> toJson() => {
    'request_count': requestCount,
    'cache_hits': cacheHits,
    'cache_misses': cacheMisses,
    'error_count': errorCount,
    'avg_response_time_ms': avgResponseTimeMs,
    'cache_hit_rate': cacheHitRate,
    'last_updated': lastUpdated.toIso8601String(),
  };
}

/// AI Match result with full details
class AIMatchResult {
  final String userId;
  final String fullName;
  final String? avatarUrl;
  final String? headline;
  final String? organization;
  final int matchScore;
  final List<String> sharedSkills;
  final List<String> sharedInterests;
  final List<String> sharedGoals;
  final bool isOnline;
  final bool isPremium;
  final bool isVerified;
  final String matchCategory;
  final double? embeddingSimilarity;
  final double behavioralScore;
  
  // AI-generated insights (lazy loaded)
  String? matchNarrative;
  List<String>? conversationStarters;
  List<String>? collaborationIdeas;
  Map<String, dynamic>? sharedContext;

  AIMatchResult({
    required this.userId,
    required this.fullName,
    this.avatarUrl,
    this.headline,
    this.organization,
    required this.matchScore,
    required this.sharedSkills,
    required this.sharedInterests,
    required this.sharedGoals,
    required this.isOnline,
    required this.isPremium,
    required this.isVerified,
    required this.matchCategory,
    this.embeddingSimilarity,
    required this.behavioralScore,
    this.matchNarrative,
    this.conversationStarters,
    this.collaborationIdeas,
    this.sharedContext,
  });

  factory AIMatchResult.fromJson(Map<String, dynamic> json) {
    return AIMatchResult(
      userId: json['user_id'] as String,
      fullName: json['full_name'] as String? ?? 'User',
      avatarUrl: json['avatar_url'] as String?,
      headline: json['headline'] as String?,
      organization: json['organization'] as String?,
      matchScore: (json['match_score'] as num?)?.toInt() ?? 0,
      sharedSkills: List<String>.from(json['shared_skills'] ?? []),
      sharedInterests: List<String>.from(json['shared_interests'] ?? []),
      sharedGoals: List<String>.from(json['shared_goals'] ?? []),
      isOnline: json['is_online'] as bool? ?? false,
      isPremium: json['is_premium'] as bool? ?? false,
      isVerified: json['is_verified'] as bool? ?? false,
      matchCategory: json['match_category'] as String? ?? 'general',
      embeddingSimilarity: (json['embedding_similarity'] as num?)?.toDouble(),
      behavioralScore: (json['behavioral_score'] as num?)?.toDouble() ?? 0,
      matchNarrative: json['match_narrative'] as String?,
      conversationStarters: json['conversation_starters'] != null 
        ? List<String>.from(json['conversation_starters']) 
        : null,
      collaborationIdeas: json['collaboration_ideas'] != null 
        ? List<String>.from(json['collaboration_ideas']) 
        : null,
      sharedContext: json['shared_context'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() => {
    'user_id': userId,
    'full_name': fullName,
    'avatar_url': avatarUrl,
    'headline': headline,
    'organization': organization,
    'match_score': matchScore,
    'shared_skills': sharedSkills,
    'shared_interests': sharedInterests,
    'shared_goals': sharedGoals,
    'is_online': isOnline,
    'is_premium': isPremium,
    'is_verified': isVerified,
    'match_category': matchCategory,
    'embedding_similarity': embeddingSimilarity,
    'behavioral_score': behavioralScore,
    'match_narrative': matchNarrative,
    'conversation_starters': conversationStarters,
    'collaboration_ideas': collaborationIdeas,
    'shared_context': sharedContext,
  };
}

/// Service for AI-powered networking matches with caching, monitoring, and error handling
class AIMatchingService extends BaseService {
  static const String _tag = 'AIMatchingService';
  static const String _cacheBoxName = 'ai_matches_cache';
  static const Duration _cacheDuration = Duration(minutes: 15);
  static const Duration _insightsCacheDuration = Duration(hours: 24);
  static const int _maxRetries = 3;
  static const Duration _retryDelay = Duration(seconds: 2);

  static AIMatchingService? _instance;
  static AIMatchingService get instance {
    _instance ??= AIMatchingService._();
    return _instance!;
  }

  AIMatchingService._();

  final SupabaseClient _supabase = Supabase.instance.client;
  Box<String>? _cacheBox;
  bool _isInitialized = false;

  // Performance metrics
  int _requestCount = 0;
  int _cacheHits = 0;
  int _cacheMisses = 0;
  int _errorCount = 0;
  final List<int> _responseTimes = [];

  @override
  String get tag => _tag;

  /// Initialize the service
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      _cacheBox = await Hive.openBox<String>(_cacheBoxName);
      _isInitialized = true;
      logInfo('AI Matching Service initialized');
      
      // Clean expired cache entries
      await _cleanExpiredCache();
    } catch (e, stack) {
      logError('Failed to initialize AI Matching Service', error: e, stackTrace: stack);
    }
  }

  /// Get AI-powered matches for Pulse page
  Future<List<AIMatchResult>> getPulseMatches({
    int limit = 20,
    int offset = 0,
    List<String>? skillFilters,
    List<String>? interestFilters,
    bool onlineOnly = false,
    bool forceRefresh = false,
  }) async {
    return _getMatches(
      context: 'pulse',
      limit: limit,
      offset: offset,
      skillFilters: skillFilters,
      interestFilters: interestFilters,
      onlineOnly: onlineOnly,
      forceRefresh: forceRefresh,
    );
  }

  /// Get AI-powered matches for Zone page (event-specific)
  Future<List<AIMatchResult>> getZoneMatches({
    required String eventId,
    int limit = 20,
    int offset = 0,
    List<String>? skillFilters,
    List<String>? interestFilters,
    bool onlineOnly = false,
    bool forceRefresh = false,
  }) async {
    return _getMatches(
      context: 'zone',
      eventId: eventId,
      limit: limit,
      offset: offset,
      skillFilters: skillFilters,
      interestFilters: interestFilters,
      onlineOnly: onlineOnly,
      forceRefresh: forceRefresh,
    );
  }

  /// Core matching logic with caching and error handling
  Future<List<AIMatchResult>> _getMatches({
    required String context,
    String? eventId,
    int limit = 20,
    int offset = 0,
    List<String>? skillFilters,
    List<String>? interestFilters,
    bool onlineOnly = false,
    bool forceRefresh = false,
  }) async {
    if (!_isInitialized) await initialize();

    final stopwatch = Stopwatch()..start();
    _requestCount++;

    final cacheKey = _generateCacheKey(
      context: context,
      eventId: eventId,
      limit: limit,
      offset: offset,
      skillFilters: skillFilters,
      interestFilters: interestFilters,
      onlineOnly: onlineOnly,
    );

    // Check cache first
    if (!forceRefresh) {
      final cached = await _getCachedMatches(cacheKey);
      if (cached != null) {
        _cacheHits++;
        _recordResponseTime(stopwatch.elapsedMilliseconds);
        logDebug('Cache hit for $cacheKey');
        return cached;
      }
    }

    _cacheMisses++;

    // Check connectivity
    final connectivity = await Connectivity().checkConnectivity();
    if (connectivity.contains(ConnectivityResult.none)) {
      logWarning('No connectivity, returning cached data if available');
      final cached = await _getCachedMatches(cacheKey);
      return cached ?? [];
    }

    // Fetch from server with retry logic
    List<AIMatchResult>? results;
    Exception? lastError;

    for (int attempt = 0; attempt < _maxRetries; attempt++) {
      try {
        results = await _fetchMatchesFromServer(
          context: context,
          eventId: eventId,
          limit: limit,
          offset: offset,
          skillFilters: skillFilters,
          interestFilters: interestFilters,
          onlineOnly: onlineOnly,
        );
        break;
      } catch (e) {
        lastError = e is Exception ? e : Exception(e.toString());
        logWarning('Attempt ${attempt + 1} failed: $e');
        
        if (attempt < _maxRetries - 1) {
          await Future.delayed(_retryDelay * (attempt + 1));
        }
      }
    }

    if (results == null) {
      _errorCount++;
      logError('All retry attempts failed', error: lastError);
      
      // Return stale cache as fallback
      final staleCache = await _getCachedMatches(cacheKey, ignoreExpiry: true);
      if (staleCache != null) {
        logInfo('Returning stale cache as fallback');
        return staleCache;
      }
      
      throw lastError ?? Exception('Failed to fetch matches');
    }

    // Cache successful results
    await _cacheMatches(cacheKey, results);
    _recordResponseTime(stopwatch.elapsedMilliseconds);

    logInfo('Fetched ${results.length} matches in ${stopwatch.elapsedMilliseconds}ms');
    return results;
  }

  /// Fetch matches from the edge function
  Future<List<AIMatchResult>> _fetchMatchesFromServer({
    required String context,
    String? eventId,
    int limit = 20,
    int offset = 0,
    List<String>? skillFilters,
    List<String>? interestFilters,
    bool onlineOnly = false,
  }) async {
    final body = <String, dynamic>{
      'context': context,
      'limit': limit,
      'offset': offset,
    };

    if (eventId != null) body['event_id'] = eventId;

    final filters = <String, dynamic>{};
    if (skillFilters?.isNotEmpty == true) filters['skills'] = skillFilters;
    if (interestFilters?.isNotEmpty == true) filters['interests'] = interestFilters;
    if (onlineOnly) filters['online_only'] = true;
    if (filters.isNotEmpty) body['filters'] = filters;

    final response = await _supabase.functions.invoke(
      'get-ai-matches',
      body: body,
    );

    if (response.status != 200) {
      throw Exception('Server returned status ${response.status}');
    }

    final data = response.data as Map<String, dynamic>;
    if (data['success'] != true) {
      throw Exception(data['error'] ?? 'Unknown error');
    }

    final matches = (data['matches'] as List<dynamic>)
        .map((m) => AIMatchResult.fromJson(m as Map<String, dynamic>))
        .toList();

    return matches;
  }

  /// Get AI-generated insights for a specific match
  Future<AIMatchResult> getMatchInsights({
    required AIMatchResult match,
    bool forceRefresh = false,
  }) async {
    if (!forceRefresh && match.matchNarrative != null) {
      return match;
    }

    final cacheKey = 'insights_${match.userId}';
    
    // Check insights cache
    if (!forceRefresh) {
      final cached = await _getCachedInsights(cacheKey);
      if (cached != null) {
        match.matchNarrative = cached['match_narrative'] as String?;
        match.conversationStarters = cached['conversation_starters'] != null
            ? List<String>.from(cached['conversation_starters'])
            : null;
        match.collaborationIdeas = cached['collaboration_ideas'] != null
            ? List<String>.from(cached['collaboration_ideas'])
            : null;
        match.sharedContext = cached['shared_context'] as Map<String, dynamic>?;
        return match;
      }
    }

    try {
      final response = await _supabase.functions.invoke(
        'analyze-profile-match',
        body: {
          'target_user_id': match.userId,
          'similarity_score': (match.embeddingSimilarity ?? match.matchScore) / 100,
        },
      );

      if (response.status == 200) {
        final data = response.data as Map<String, dynamic>;
        
        match.matchNarrative = data['narrative'] as String? ?? 
            data['match_narrative'] as String?;
        match.conversationStarters = data['conversationStarters'] != null
            ? List<String>.from(data['conversationStarters'])
            : (data['conversation_starters'] != null
                ? List<String>.from(data['conversation_starters'])
                : null);
        match.collaborationIdeas = data['collaborationIdeas'] != null
            ? List<String>.from(data['collaborationIdeas'])
            : (data['collaboration_ideas'] != null
                ? List<String>.from(data['collaboration_ideas'])
                : null);
        match.sharedContext = data['sharedContext'] as Map<String, dynamic>? ??
            data['shared_context'] as Map<String, dynamic>?;

        // Cache the insights
        await _cacheInsights(cacheKey, data);
      }
    } catch (e) {
      logWarning('Failed to fetch match insights: $e');
    }

    return match;
  }

  /// Get current performance metrics
  AIMatchingMetrics getMetrics() {
    final avgResponseTime = _responseTimes.isNotEmpty
        ? _responseTimes.reduce((a, b) => a + b) / _responseTimes.length
        : 0.0;

    return AIMatchingMetrics(
      requestCount: _requestCount,
      cacheHits: _cacheHits,
      cacheMisses: _cacheMisses,
      errorCount: _errorCount,
      avgResponseTimeMs: avgResponseTime,
      lastUpdated: DateTime.now(),
    );
  }

  /// Log performance metrics for analytics
  Future<void> logMetricsToServer() async {
    final metrics = getMetrics();
    
    try {
      await _supabase.from('ai_matching_metrics').insert({
        'user_id': _supabase.auth.currentUser?.id,
        'metrics': metrics.toJson(),
        'created_at': DateTime.now().toIso8601String(),
      });
      logInfo('Logged metrics to server: ${metrics.toJson()}');
    } catch (e) {
      logWarning('Failed to log metrics: $e');
    }
  }

  /// Clear local cache
  Future<void> clearCache() async {
    await _cacheBox?.clear();
    logInfo('Cache cleared');
  }

  /// Reset metrics
  void resetMetrics() {
    _requestCount = 0;
    _cacheHits = 0;
    _cacheMisses = 0;
    _errorCount = 0;
    _responseTimes.clear();
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  String _generateCacheKey({
    required String context,
    String? eventId,
    required int limit,
    required int offset,
    List<String>? skillFilters,
    List<String>? interestFilters,
    required bool onlineOnly,
  }) {
    final userId = _supabase.auth.currentUser?.id ?? 'anon';
    final parts = [
      'matches',
      context,
      userId,
      'l$limit',
      'o$offset',
    ];
    if (eventId != null) parts.add('e$eventId');
    if (skillFilters?.isNotEmpty == true) {
      parts.add('s${skillFilters!.join('-')}');
    }
    if (interestFilters?.isNotEmpty == true) {
      parts.add('i${interestFilters!.join('-')}');
    }
    if (onlineOnly) parts.add('online');
    
    return parts.join('_');
  }

  Future<List<AIMatchResult>?> _getCachedMatches(String key, {bool ignoreExpiry = false}) async {
    try {
      final cached = _cacheBox?.get(key);
      if (cached == null) return null;

      final data = jsonDecode(cached) as Map<String, dynamic>;
      final timestamp = DateTime.parse(data['timestamp'] as String);
      
      if (!ignoreExpiry && DateTime.now().difference(timestamp) > _cacheDuration) {
        await _cacheBox?.delete(key);
        return null;
      }

      final matches = (data['matches'] as List<dynamic>)
          .map((m) => AIMatchResult.fromJson(m as Map<String, dynamic>))
          .toList();
      
      return matches;
    } catch (e) {
      logWarning('Cache read error: $e');
      return null;
    }
  }

  Future<void> _cacheMatches(String key, List<AIMatchResult> matches) async {
    try {
      final data = {
        'timestamp': DateTime.now().toIso8601String(),
        'matches': matches.map((m) => m.toJson()).toList(),
      };
      await _cacheBox?.put(key, jsonEncode(data));
    } catch (e) {
      logWarning('Cache write error: $e');
    }
  }

  Future<Map<String, dynamic>?> _getCachedInsights(String key) async {
    try {
      final cached = _cacheBox?.get(key);
      if (cached == null) return null;

      final data = jsonDecode(cached) as Map<String, dynamic>;
      final timestamp = DateTime.parse(data['timestamp'] as String);
      
      if (DateTime.now().difference(timestamp) > _insightsCacheDuration) {
        await _cacheBox?.delete(key);
        return null;
      }

      return data['insights'] as Map<String, dynamic>;
    } catch (e) {
      return null;
    }
  }

  Future<void> _cacheInsights(String key, Map<String, dynamic> insights) async {
    try {
      final data = {
        'timestamp': DateTime.now().toIso8601String(),
        'insights': insights,
      };
      await _cacheBox?.put(key, jsonEncode(data));
    } catch (e) {
      logWarning('Failed to cache insights: $e');
    }
  }

  Future<void> _cleanExpiredCache() async {
    try {
      final keysToDelete = <String>[];
      final now = DateTime.now();

      for (final key in _cacheBox?.keys ?? []) {
        final cached = _cacheBox?.get(key);
        if (cached == null) continue;

        try {
          final data = jsonDecode(cached) as Map<String, dynamic>;
          final timestamp = DateTime.parse(data['timestamp'] as String);
          final maxAge = key.toString().startsWith('insights_') 
              ? _insightsCacheDuration 
              : _cacheDuration;
          
          if (now.difference(timestamp) > maxAge) {
            keysToDelete.add(key.toString());
          }
        } catch (_) {
          keysToDelete.add(key.toString());
        }
      }

      for (final key in keysToDelete) {
        await _cacheBox?.delete(key);
      }

      if (keysToDelete.isNotEmpty) {
        logDebug('Cleaned ${keysToDelete.length} expired cache entries');
      }
    } catch (e) {
      logWarning('Cache cleanup error: $e');
    }
  }

  void _recordResponseTime(int ms) {
    _responseTimes.add(ms);
    // Keep only last 100 measurements
    if (_responseTimes.length > 100) {
      _responseTimes.removeAt(0);
    }
  }

  /// Dispose resources and close cache
  Future<void> dispose() async {
    await _cacheBox?.close();
  }
}
