/// In-memory cache manager with TTL support for Flutter apps
/// Provides thread-safe caching with automatic expiration
class CacheManager<T> {
  final Duration defaultTtl;
  final int maxEntries;
  final Map<String, _CacheEntry<T>> _cache = {};
  
  CacheManager({
    this.defaultTtl = const Duration(minutes: 5),
    this.maxEntries = 100,
  });

  /// Gets a cached value, returns null if expired or not found
  T? get(String key) {
    final entry = _cache[key];
    if (entry == null) return null;
    
    if (entry.isExpired) {
      _cache.remove(key);
      return null;
    }
    
    return entry.value;
  }

  /// Sets a value in the cache with optional custom TTL
  void set(String key, T value, {Duration? ttl}) {
    _evictIfNeeded();
    
    _cache[key] = _CacheEntry(
      value: value,
      expiresAt: DateTime.now().add(ttl ?? defaultTtl),
    );
  }

  /// Checks if a key exists and is not expired
  bool has(String key) {
    final entry = _cache[key];
    if (entry == null) return false;
    
    if (entry.isExpired) {
      _cache.remove(key);
      return false;
    }
    
    return true;
  }

  /// Removes a specific key from cache
  void remove(String key) {
    _cache.remove(key);
  }

  /// Removes all entries matching a prefix
  void removeByPrefix(String prefix) {
    _cache.removeWhere((key, _) => key.startsWith(prefix));
  }

  /// Clears all cache entries
  void clear() {
    _cache.clear();
  }

  /// Removes expired entries
  void evictExpired() {
    _cache.removeWhere((_, entry) => entry.isExpired);
  }

  /// Gets or sets a value using a factory function
  Future<T> getOrSet(
    String key,
    Future<T> Function() factory, {
    Duration? ttl,
  }) async {
    final cached = get(key);
    if (cached != null) return cached;
    
    final value = await factory();
    set(key, value, ttl: ttl);
    return value;
  }

  /// Evicts oldest entries if cache is full
  void _evictIfNeeded() {
    // First, remove expired entries
    evictExpired();
    
    // If still at capacity, remove oldest entries
    while (_cache.length >= maxEntries) {
      String? oldestKey;
      DateTime? oldestTime;
      
      for (final entry in _cache.entries) {
        if (oldestTime == null || entry.value.createdAt.isBefore(oldestTime)) {
          oldestKey = entry.key;
          oldestTime = entry.value.createdAt;
        }
      }
      
      if (oldestKey != null) {
        _cache.remove(oldestKey);
      } else {
        break;
      }
    }
  }

  /// Returns cache statistics
  CacheStats get stats => CacheStats(
    entryCount: _cache.length,
    maxEntries: maxEntries,
    expiredCount: _cache.values.where((e) => e.isExpired).length,
  );
}

class _CacheEntry<T> {
  final T value;
  final DateTime createdAt;
  final DateTime expiresAt;
  
  _CacheEntry({
    required this.value,
    required this.expiresAt,
  }) : createdAt = DateTime.now();
  
  bool get isExpired => DateTime.now().isAfter(expiresAt);
}

class CacheStats {
  final int entryCount;
  final int maxEntries;
  final int expiredCount;
  
  const CacheStats({
    required this.entryCount,
    required this.maxEntries,
    required this.expiredCount,
  });
  
  double get utilizationPercent => entryCount / maxEntries * 100;
}

/// Global cache instances for different data types
class AppCache {
  AppCache._();
  
  static final organizations = CacheManager<dynamic>(
    defaultTtl: const Duration(minutes: 10),
    maxEntries: 50,
  );
  
  static final products = CacheManager<dynamic>(
    defaultTtl: const Duration(minutes: 5),
    maxEntries: 200,
  );
  
  static final events = CacheManager<dynamic>(
    defaultTtl: const Duration(minutes: 3),
    maxEntries: 100,
  );
  
  /// Clears all caches
  static void clearAll() {
    organizations.clear();
    products.clear();
    events.clear();
  }
  
  /// Clears caches for a specific organization
  static void clearForOrganization(String orgId) {
    organizations.removeByPrefix('org:$orgId');
    products.removeByPrefix('products:$orgId');
    events.removeByPrefix('events:$orgId');
  }
}
