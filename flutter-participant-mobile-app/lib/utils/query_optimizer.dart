import 'dart:async';
import 'package:thittam1hub/services/logging_service.dart';

/// Query optimization utilities for Zone feature.
/// Provides request coalescing, caching, and batch loading.
class QueryOptimizer {
  static final QueryOptimizer _instance = QueryOptimizer._();
  static QueryOptimizer get instance => _instance;
  QueryOptimizer._();

  static final _log = LoggingService.instance;
  static const String _tag = 'QueryOptimizer';

  // In-flight request deduplication
  final Map<String, Future<dynamic>> _inflightRequests = {};

  // Simple TTL cache
  final Map<String, _CacheEntry> _cache = {};

  /// Deduplicates concurrent identical requests.
  /// If a request with the same key is already in flight, returns its future.
  Future<T> dedupe<T>(
    String key,
    Future<T> Function() request,
  ) async {
    // Return existing in-flight request
    if (_inflightRequests.containsKey(key)) {
      _log.debug('Deduping request: $key', tag: _tag);
      return _inflightRequests[key] as Future<T>;
    }

    // Create new request
    final future = request().whenComplete(() {
      _inflightRequests.remove(key);
    });

    _inflightRequests[key] = future;
    return future;
  }

  /// Caches a request result with TTL.
  Future<T> cached<T>(
    String key,
    Future<T> Function() request, {
    Duration ttl = const Duration(minutes: 1),
  }) async {
    // Check cache
    final entry = _cache[key];
    if (entry != null && !entry.isExpired) {
      _log.debug('Cache hit: $key', tag: _tag);
      return entry.value as T;
    }

    // Fetch and cache
    final result = await dedupe(key, request);
    _cache[key] = _CacheEntry(result, DateTime.now().add(ttl));
    _log.debug('Cached: $key (TTL: ${ttl.inSeconds}s)', tag: _tag);

    return result;
  }

  /// Invalidates cache entries matching a pattern.
  void invalidate(String pattern) {
    final keysToRemove = _cache.keys
        .where((k) => k.contains(pattern))
        .toList();

    for (final key in keysToRemove) {
      _cache.remove(key);
    }

    if (keysToRemove.isNotEmpty) {
      _log.debug('Invalidated ${keysToRemove.length} cache entries', tag: _tag);
    }
  }

  /// Clears all cache entries.
  void clearCache() {
    _cache.clear();
    _log.debug('Cache cleared', tag: _tag);
  }

  /// Cleans up expired entries.
  void cleanup() {
    final now = DateTime.now();
    _cache.removeWhere((_, entry) => entry.expiresAt.isBefore(now));
  }
}

class _CacheEntry {
  final dynamic value;
  final DateTime expiresAt;

  _CacheEntry(this.value, this.expiresAt);

  bool get isExpired => DateTime.now().isAfter(expiresAt);
}

/// Batch loader for efficient multi-item fetching.
/// Coalesces multiple single-item requests into batch queries.
class BatchLoader<K, V> {
  final Future<Map<K, V>> Function(List<K> keys) batchFetch;
  final Duration batchWindow;

  final Map<K, Completer<V?>> _pending = {};
  Timer? _batchTimer;
  final List<K> _pendingKeys = [];

  BatchLoader({
    required this.batchFetch,
    this.batchWindow = const Duration(milliseconds: 16), // ~1 frame
  });

  /// Loads a single item, batching with other concurrent requests.
  Future<V?> load(K key) {
    if (_pending.containsKey(key)) {
      return _pending[key]!.future;
    }

    final completer = Completer<V?>();
    _pending[key] = completer;
    _pendingKeys.add(key);

    // Schedule batch execution
    _batchTimer?.cancel();
    _batchTimer = Timer(batchWindow, _executeBatch);

    return completer.future;
  }

  Future<void> _executeBatch() async {
    if (_pendingKeys.isEmpty) return;

    final keys = List<K>.from(_pendingKeys);
    final completers = Map<K, Completer<V?>>.from(_pending);

    _pendingKeys.clear();
    _pending.clear();

    try {
      final results = await batchFetch(keys);

      for (final key in keys) {
        completers[key]?.complete(results[key]);
      }
    } catch (e) {
      for (final completer in completers.values) {
        completer.completeError(e);
      }
    }
  }

  /// Clears pending requests.
  void clear() {
    _batchTimer?.cancel();
    _pendingKeys.clear();
    _pending.clear();
  }
}
