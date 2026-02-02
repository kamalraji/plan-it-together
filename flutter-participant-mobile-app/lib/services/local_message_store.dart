import 'dart:collection';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:thittam1hub/database/app_database_accessor.dart';
import 'package:thittam1hub/database/database_interface.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/connectivity_service.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Cache entry with metadata for LRU + TTL eviction
class _CacheEntry {
  final List<Message> messages;
  final DateTime lastAccessedAt;
  final DateTime createdAt;
  
  _CacheEntry({
    required this.messages,
    DateTime? lastAccessedAt,
    DateTime? createdAt,
  }) : lastAccessedAt = lastAccessedAt ?? DateTime.now(),
       createdAt = createdAt ?? DateTime.now();
  
  /// Check if entry has expired based on TTL
  bool isExpired(Duration ttl) {
    return DateTime.now().difference(createdAt) > ttl;
  }
  
  /// Check if entry is stale (not accessed recently)
  bool isStale(Duration staleThreshold) {
    return DateTime.now().difference(lastAccessedAt) > staleThreshold;
  }
  
  /// Create a new entry with updated access time
  _CacheEntry touch() {
    return _CacheEntry(
      messages: messages,
      lastAccessedAt: DateTime.now(),
      createdAt: createdAt,
    );
  }
  
  /// Create entry with updated messages
  _CacheEntry withMessages(List<Message> newMessages) {
    return _CacheEntry(
      messages: newMessages,
      lastAccessedAt: DateTime.now(),
      createdAt: createdAt,
    );
  }
}

/// Cached message data for a channel (used for migration compatibility)
class CachedChannelData {
  final List<Message> messages;
  final DateTime lastSyncedAt;
  final bool hasMore;

  const CachedChannelData({
    required this.messages,
    required this.lastSyncedAt,
    this.hasMore = true,
  });

  Map<String, dynamic> toJson() => {
    'messages': messages.map((m) => m.toJson()).toList(),
    'lastSyncedAt': lastSyncedAt.toIso8601String(),
    'hasMore': hasMore,
  };

  factory CachedChannelData.fromJson(Map<String, dynamic> json) {
    return CachedChannelData(
      messages: (json['messages'] as List<dynamic>?)
          ?.map((m) => Message.fromJson(m as Map<String, dynamic>))
          .toList() ?? [],
      lastSyncedAt: DateTime.parse(json['lastSyncedAt'] as String),
      hasMore: json['hasMore'] as bool? ?? true,
    );
  }
}

/// SQLite-backed local message store using Drift
/// 
/// Features:
/// - Unlimited message history per channel
/// - Efficient paginated queries via SQL indexes
/// - LRU memory cache with size + TTL eviction
/// - Delta sync for bandwidth efficiency
/// - Automatic migration from SharedPreferences
class LocalMessageStore {
  static const String _tag = 'LocalMessageStore';
  static final _log = LoggingService.instance;

  static const String _oldMessagesPrefix = 'channel_messages_v1_';
  static const String _oldSyncTimestampsKey = 'message_sync_timestamps_v1';
  static const String _migrationKey = 'sqlite_migration_v2';
  static const int _defaultFetchLimit = 50;
  
  // LRU Cache Configuration
  static const int _maxMemoryCacheChannels = 10;      // Max channels in memory
  static const int _maxMessagesPerChannel = 100;      // Max messages per channel in memory
  static const int _maxTotalMemoryMessages = 500;     // Total messages across all channels
  static const Duration _cacheEntryTtl = Duration(minutes: 30); // TTL for cache entries
  static const Duration _cleanupInterval = Duration(minutes: 5); // Auto-cleanup interval
  
  static LocalMessageStore? _instance;
  static LocalMessageStore get instance => _instance ??= LocalMessageStore._();
  
  LocalMessageStore._();

  late AppDatabaseInterface _db;
  SharedPreferences? _prefs;
  bool _initialized = false;
  DateTime? _lastCleanup;
  
  /// LRU memory cache for quick access to hot channels
  /// Key: channelId, Value: cached entry with messages and metadata
  final LinkedHashMap<String, _CacheEntry> _memoryCache = LinkedHashMap();
  
  /// Get total messages currently in memory cache
  int get _totalCachedMessages => 
      _memoryCache.values.fold<int>(0, (sum, entry) => sum + entry.messages.length);

  /// Initialize the message store
  Future<void> init() async {
    if (_initialized) return;
    
    try {
      _db = AppDatabaseAccessor.instance;
      _prefs = await SharedPreferences.getInstance();
      
      // Check if migration from SharedPreferences is needed
      final hasMigrated = _prefs?.getBool(_migrationKey) ?? false;
      if (!hasMigrated) {
        await _migrateFromSharedPreferences();
        await _prefs?.setBool(_migrationKey, true);
      }
      
      _initialized = true;
      _log.serviceInitialized('LocalMessageStore');
    } catch (e) {
      _log.error('Init error', tag: _tag, error: e);
    }
  }

  // ==========================================
  // MIGRATION FROM SHAREDPREFERENCES
  // ==========================================

  /// One-time migration from old SharedPreferences storage to SQLite
  Future<void> _migrateFromSharedPreferences() async {
    try {
      final keys = _prefs?.getKeys().where((k) => k.startsWith(_oldMessagesPrefix)).toList() ?? [];
      
      if (keys.isEmpty) {
        _log.debug('No SharedPreferences data to migrate', tag: _tag);
        return;
      }
      
      _log.info('Migrating from SharedPreferences to SQLite', tag: _tag, metadata: {'channels': keys.length});
      
      for (final key in keys) {
        try {
          final json = _prefs?.getString(key);
          if (json == null) continue;
          
          final data = CachedChannelData.fromJson(jsonDecode(json) as Map<String, dynamic>);
          if (data.messages.isEmpty) continue;
          
          final channelId = data.messages.first.channelId;
          
          // Convert messages to data and batch insert
          final entities = data.messages.map(_messageToData).toList();
          await _db.batchUpsertMessages(entities);
          
          // Save sync metadata
          await _db.updateChannelMeta(ChannelSyncMetaData(
            channelId: channelId,
            lastSyncedAt: data.lastSyncedAt,
            hasMore: data.hasMore,
            messageCount: data.messages.length,
          ));
          
          // Remove old key after successful migration
          await _prefs?.remove(key);
        } catch (e) {
          _log.warning('Failed to migrate channel', tag: _tag, error: e);
        }
      }
      
      // Clean up old sync timestamps
      await _prefs?.remove(_oldSyncTimestampsKey);
      
      _log.info('Migration complete', tag: _tag);
    } catch (e) {
      _log.error('Migration error', tag: _tag, error: e);
    }
  }

  // ==========================================
  // LOCAL MESSAGE ACCESS
  // ==========================================

  /// Get messages from local cache
  /// Returns (messages, isFromCache, hasMore)
  Future<(List<Message>, bool, bool)> getMessages(
    String channelId, {
    int limit = _defaultFetchLimit,
    DateTime? before,
  }) async {
    if (!_initialized) await init();
    
    // Trigger periodic cleanup
    _maybeRunCleanup();
    
    // Check memory cache first (only for first page)
    if (before == null && _memoryCache.containsKey(channelId)) {
      final entry = _memoryCache[channelId]!;
      
      // Check if entry is still valid (not expired)
      if (!entry.isExpired(_cacheEntryTtl)) {
        // Touch entry to update last access time
        _memoryCache[channelId] = entry.touch();
        
        if (entry.messages.isNotEmpty) {
          final hasMore = entry.messages.length >= limit;
          return (entry.messages.take(limit).toList(), true, hasMore);
        }
      } else {
        // Entry expired, remove it
        _memoryCache.remove(channelId);
      }
    }
    
    // Query SQLite database
    try {
      final entities = await _db.getMessagesForChannel(
        channelId,
        limit: limit + 1, // Fetch one extra to check hasMore
        before: before,
      );
      
      final hasMore = entities.length > limit;
      final messages = entities
          .take(limit)
          .map(_dataToMessage)
          .toList();
      
      // Update memory cache for first page
      if (before == null && messages.isNotEmpty) {
        _updateMemoryCache(channelId, messages);
      }
      
      return (messages, true, hasMore);
    } catch (e) {
      _log.error('Get cached messages error', tag: _tag, error: e);
      return (<Message>[], false, true);
    }
  }

  /// Get last sync timestamp for a channel
  Future<DateTime?> getLastSyncTime(String channelId) async {
    if (!_initialized) await init();
    
    final meta = await _db.getChannelMeta(channelId);
    return meta?.lastSyncedAt;
  }

  /// Check if channel has cached messages
  Future<bool> hasCachedMessages(String channelId) async {
    if (!_initialized) await init();
    
    if (_memoryCache.containsKey(channelId)) return true;
    
    final meta = await _db.getChannelMeta(channelId);
    return meta != null && meta.messageCount > 0;
  }

  // ==========================================
  // DELTA SYNC - ONLY FETCH NEW MESSAGES
  // ==========================================

  /// Perform delta sync for a channel
  /// Only fetches messages after lastSyncedAt
  /// Returns new messages that were fetched
  Future<List<Message>> syncChannel(String channelId) async {
    if (!ConnectivityService.instance.isOnline) {
      _log.debug('Offline - skipping sync', tag: _tag, metadata: {'channelId': channelId});
      return [];
    }
    
    if (!_initialized) await init();
    
    final meta = await _db.getChannelMeta(channelId);
    final lastSync = meta?.lastSyncedAt;
    
    try {
      List<dynamic> rows;
      
      if (lastSync != null) {
        // Delta sync - only fetch new messages
        _log.debug('Delta sync', tag: _tag, metadata: {'channelId': channelId, 'after': lastSync.toIso8601String()});
        rows = await SupabaseConfig.client
            .from('channel_messages')
            .select('*, sender:user_profiles!channel_messages_sender_id_fkey(id, username, avatar_url)')
            .eq('channel_id', channelId)
            .gt('created_at', lastSync.toIso8601String())
            .order('created_at', ascending: false)
            .limit(_defaultFetchLimit);
      } else {
        // Initial fetch
        _log.debug('Initial fetch', tag: _tag, metadata: {'channelId': channelId});
        rows = await SupabaseConfig.client
            .from('channel_messages')
            .select('*, sender:user_profiles!channel_messages_sender_id_fkey(id, username, avatar_url)')
            .eq('channel_id', channelId)
            .order('created_at', ascending: false)
            .limit(_defaultFetchLimit);
      }
      
      final newMessages = rows.map((r) => Message.fromJson(r as Map<String, dynamic>)).toList();
      
      if (newMessages.isNotEmpty) {
        // Batch insert to database
        final entities = newMessages.map(_messageToData).toList();
        await _db.batchUpsertMessages(entities);
        
        // Update sync metadata (estimate count from current + new)
        await _db.updateChannelMeta(ChannelSyncMetaData(
          channelId: channelId,
          lastSyncedAt: DateTime.now(),
          hasMore: newMessages.length >= _defaultFetchLimit,
          messageCount: newMessages.length,
        ));
        
        // Invalidate memory cache to force refresh
        _memoryCache.remove(channelId);
        
        _log.dbOperation('SYNC', 'channel_messages', rowCount: newMessages.length, tag: _tag);
      }
      
      return newMessages;
    } catch (e) {
      _log.error('Sync channel error', tag: _tag, error: e);
      return [];
    }
  }

  // ==========================================
  // OPTIMISTIC UPDATES
  // ==========================================

  /// Add a message optimistically (before server confirmation)
  Future<void> addMessageOptimistic(String channelId, Message message) async {
    if (!_initialized) await init();
    
    // Insert to database
    await _db.upsertMessage(_messageToData(message));
    
    // Update memory cache
    if (_memoryCache.containsKey(channelId)) {
      final entry = _memoryCache[channelId]!;
      final updatedMessages = [message, ...entry.messages];
      
      // Trim to per-channel limit
      final trimmed = updatedMessages.take(_maxMessagesPerChannel).toList();
      _memoryCache[channelId] = entry.withMessages(trimmed);
    }
  }

  /// Update a message (e.g., after server confirmation)
  Future<void> updateMessage(String channelId, Message message) async {
    if (!_initialized) await init();
    
    // Update in database
    await _db.upsertMessage(_messageToData(message));
    
    // Update memory cache
    if (_memoryCache.containsKey(channelId)) {
      final entry = _memoryCache[channelId]!;
      final index = entry.messages.indexWhere((m) => m.id == message.id);
      if (index >= 0) {
        final updatedMessages = List<Message>.from(entry.messages);
        updatedMessages[index] = message;
        _memoryCache[channelId] = entry.withMessages(updatedMessages);
      }
    }
  }

  /// Remove a message from cache
  Future<void> removeMessage(String channelId, String messageId) async {
    if (!_initialized) await init();
    
    // Delete from database
    await _db.deleteMessageById(messageId);
    
    // Remove from memory cache
    if (_memoryCache.containsKey(channelId)) {
      final entry = _memoryCache[channelId]!;
      final updatedMessages = entry.messages.where((m) => m.id != messageId).toList();
      _memoryCache[channelId] = entry.withMessages(updatedMessages);
    }
  }

  // ==========================================
  // BATCH OPERATIONS
  // ==========================================

  /// Sync multiple channels in parallel
  Future<Map<String, List<Message>>> syncChannels(List<String> channelIds) async {
    final results = <String, List<Message>>{};
    
    await Future.wait(
      channelIds.map((channelId) async {
        final messages = await syncChannel(channelId);
        results[channelId] = messages;
      }),
    );
    
    return results;
  }

  /// Preload messages for visible channels
  Future<void> preloadChannels(List<String> channelIds) async {
    // Only preload channels that aren't already cached
    final toLoad = <String>[];
    for (final id in channelIds) {
      final hasCached = await hasCachedMessages(id);
      if (!hasCached) toLoad.add(id);
    }
    
    if (toLoad.isNotEmpty) {
      _log.debug('Preloading channels', tag: _tag, metadata: {'count': toLoad.length});
      await syncChannels(toLoad.take(5).toList()); // Limit parallel requests
    }
  }

  // ==========================================
  // ADVANCED QUERIES (NEW WITH SQLITE)
  // ==========================================

  /// Search messages by content across all channels or specific channel
  Future<List<Message>> searchMessages(String query, {String? channelId}) async {
    if (!_initialized) await init();
    
    final entities = await _db.searchMessages(query, channelId: channelId);
    return entities.map(_dataToMessage).toList();
  }

  /// Get messages by sender across all channels
  /// Note: This is a simplified implementation - full sender filtering requires extended interface
  Future<List<Message>> getMessagesBySender(String senderId, {int limit = 50}) async {
    if (!_initialized) await init();
    
    // Use search as a fallback - sender name matching
    final allMessages = await _db.getAllMessages();
    return allMessages
        .where((m) => m.senderId == senderId)
        .take(limit)
        .map(_dataToMessage)
        .toList();
  }

  // ==========================================
  // CACHE MANAGEMENT
  // ==========================================

  /// Clear cache for a specific channel
  Future<void> clearChannel(String channelId) async {
    if (!_initialized) await init();
    
    _memoryCache.remove(channelId);
    await _db.deleteChannelMessages(channelId);
    _log.info('Cleared cache', tag: _tag, metadata: {'channelId': channelId});
  }

  /// Clear all message caches
  Future<void> clearAll() async {
    if (!_initialized) await init();
    
    _memoryCache.clear();
    await _db.clearAll();
    _log.info('All message caches cleared', tag: _tag);
  }

  /// Prune old messages (database maintenance)
  Future<void> pruneOldMessages({int keepDays = 90}) async {
    if (!_initialized) await init();
    
    final deleted = await _db.pruneOldMessages(keepDays: keepDays);
    _log.info('Pruned old messages', tag: _tag, metadata: {'deleted': deleted});
  }

  /// Vacuum database to reclaim space
  Future<void> vacuum() async {
    if (!_initialized) await init();
    await _db.vacuum();
    _log.debug('Database vacuumed', tag: _tag);
  }

  /// Get cache statistics
  Future<Map<String, dynamic>> getStats() async {
    if (!_initialized) await init();
    
    final dbStats = await _db.getStats();
    return {
      'memoryCacheChannels': _memoryCache.length,
      'memoryCacheMessages': _totalCachedMessages,
      'maxMemoryCacheChannels': _maxMemoryCacheChannels,
      'maxMessagesPerChannel': _maxMessagesPerChannel,
      ...dbStats,
    };
  }

  // ==========================================
  // LRU CACHE MANAGEMENT
  // ==========================================

  /// Update memory cache with new messages
  void _updateMemoryCache(String channelId, List<Message> messages) {
    // If already cached, just update
    if (_memoryCache.containsKey(channelId)) {
      _memoryCache[channelId] = _memoryCache[channelId]!.withMessages(messages);
      return;
    }
    
    // Evict old entries if we're at capacity
    while (_memoryCache.length >= _maxMemoryCacheChannels) {
      _evictLeastRecentlyUsed();
    }
    
    // Also check total message count
    while (_totalCachedMessages + messages.length > _maxTotalMemoryMessages && _memoryCache.isNotEmpty) {
      _evictLeastRecentlyUsed();
    }
    
    // Add new entry (limited to max per channel)
    _memoryCache[channelId] = _CacheEntry(
      messages: messages.take(_maxMessagesPerChannel).toList(),
    );
  }

  /// Evict the least recently used entry
  void _evictLeastRecentlyUsed() {
    if (_memoryCache.isEmpty) return;
    
    // Find the entry with oldest lastAccessedAt
    String? oldestKey;
    DateTime? oldestTime;
    
    for (final entry in _memoryCache.entries) {
      if (oldestTime == null || entry.value.lastAccessedAt.isBefore(oldestTime)) {
        oldestKey = entry.key;
        oldestTime = entry.value.lastAccessedAt;
      }
    }
    
    if (oldestKey != null) {
      _memoryCache.remove(oldestKey);
      _log.debug('Evicted LRU cache entry', tag: _tag, metadata: {'channelId': oldestKey});
    }
  }

  /// Maybe run periodic cleanup
  void _maybeRunCleanup() {
    final now = DateTime.now();
    if (_lastCleanup == null || now.difference(_lastCleanup!) > _cleanupInterval) {
      _lastCleanup = now;
      _runCleanup();
    }
  }

  /// Run cache cleanup
  void _runCleanup() {
    // Remove expired entries
    final expiredKeys = <String>[];
    for (final entry in _memoryCache.entries) {
      if (entry.value.isExpired(_cacheEntryTtl)) {
        expiredKeys.add(entry.key);
      }
    }
    
    for (final key in expiredKeys) {
      _memoryCache.remove(key);
    }
    
    if (expiredKeys.isNotEmpty) {
      _log.debug('Cleaned expired cache entries', tag: _tag, metadata: {'count': expiredKeys.length});
    }
  }

  // ==========================================
  // DATA CONVERSION
  // ==========================================

  CachedMessageData _messageToData(Message m) {
    return CachedMessageData(
      id: m.id,
      channelId: m.channelId,
      senderId: m.senderId,
      senderName: m.senderName,
      senderAvatar: m.senderAvatar,
      content: m.content,
      attachmentsJson: m.attachments.isNotEmpty ? jsonEncode(m.attachments.map((a) => a.toJson()).toList()) : '[]',
      sentAt: m.sentAt,
      isEncrypted: m.isEncrypted,
      nonce: m.nonce,
      senderPublicKey: m.senderPublicKey,
      cachedAt: DateTime.now(),
    );
  }

  Message _dataToMessage(CachedMessageData d) {
    return Message(
      id: d.id,
      channelId: d.channelId,
      senderId: d.senderId,
      senderName: d.senderName,
      senderAvatar: d.senderAvatar,
      content: d.content,
      attachments: d.attachmentsJson.isNotEmpty && d.attachmentsJson != '[]'
          ? (jsonDecode(d.attachmentsJson) as List)
              .map((a) => MessageAttachment.fromJson(a as Map<String, dynamic>))
              .toList()
          : [],
      sentAt: d.sentAt,
      isEncrypted: d.isEncrypted,
      nonce: d.nonce,
      senderPublicKey: d.senderPublicKey,
    );
  }
}
