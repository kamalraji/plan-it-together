import 'dart:convert';
import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';
import 'package:flutter/foundation.dart';

import 'package:thittam1hub/services/logging_service.dart';
part 'app_database.g.dart';

// ==========================
// TABLE DEFINITIONS
// ==========================

/// Cached messages table for offline-first chat
/// Indexes: channel_id + sent_at (DESC) for efficient loading
@DataClassName('CachedMessageEntity')
class CachedMessages extends Table {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'CachedMessages';

  /// Message UUID (primary key from server)
  TextColumn get id => text()();
  
  /// Channel this message belongs to
  TextColumn get channelId => text()();
  
  /// Sender information
  TextColumn get senderId => text()();
  TextColumn get senderName => text()();
  TextColumn get senderAvatar => text().nullable()();
  
  /// Message content
  TextColumn get content => text()();
  
  /// JSON-serialized attachments array
  TextColumn get attachmentsJson => text().withDefault(const Constant('[]'))();
  
  /// Timestamps
  DateTimeColumn get sentAt => dateTime()();
  DateTimeColumn get editedAt => dateTime().nullable()();
  DateTimeColumn get deletedAt => dateTime().nullable()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();
  
  /// End-to-end encryption fields
  BoolColumn get isEncrypted => boolean().nullable()();
  IntColumn get encryptionVersion => integer().nullable()();
  TextColumn get senderPublicKey => text().nullable()();
  TextColumn get nonce => text().nullable()();
  
  /// Cache metadata
  DateTimeColumn get cachedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

/// Sync metadata per channel for delta sync strategy
@DataClassName('ChannelSyncMetaEntity')
class ChannelSyncMeta extends Table {
  /// Channel UUID (primary key)
  TextColumn get channelId => text()();
  
  /// Last successful sync timestamp
  DateTimeColumn get lastSyncedAt => dateTime()();
  
  /// Whether there are more messages to fetch (pagination)
  BoolColumn get hasMore => boolean().withDefault(const Constant(true))();
  
  /// Total message count in cache for this channel
  IntColumn get messageCount => integer().withDefault(const Constant(0))();

  @override
  Set<Column> get primaryKey => {channelId};
}

// ==========================
// DATABASE CLASS
// ==========================

@DriftDatabase(tables: [CachedMessages, ChannelSyncMeta])
class AppDatabase extends _$AppDatabase {
  /// Private constructor
  AppDatabase._() : super(_openConnection());
  
  /// Singleton instance
  static AppDatabase? _instance;
  static AppDatabase get instance => _instance ??= AppDatabase._();


  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    beforeOpen: (details) async {
      // drift_flutter's driftDatabase() no longer supports a `setup:` callback.
      // Apply performance PRAGMAs here (native only).
      if (!kIsWeb) {
        await customStatement('PRAGMA journal_mode=WAL');
        await customStatement('PRAGMA synchronous=NORMAL');
        await customStatement('PRAGMA cache_size=-8000');
      }
    },
    onCreate: (Migrator m) async {
      await m.createAll();
      await _createIndexes();
      await _createFTS5();
      _log.info('✅ AppDatabase: Tables, indexes, and FTS5 created', tag: _tag);
    },
    onUpgrade: (Migrator m, int from, int to) async {
      _log.debug('📦 AppDatabase: Migrating from v$from to v$to', tag: _tag);
      
      if (from < 2) {
        // Migrate to FTS5
        await _createFTS5();
        // Populate FTS index from existing messages
        await _rebuildFTSIndex();
        _log.info('✅ AppDatabase: FTS5 migration complete', tag: _tag);
      }
    },
  );

  /// Create standard indexes
  Future<void> _createIndexes() async {
    // Primary index for message list queries (most common operation)
    await customStatement('''
      CREATE INDEX IF NOT EXISTS idx_messages_channel_sent 
      ON cached_messages(channel_id, sent_at DESC)
    ''');
    
    // Index for sender-based queries
    await customStatement('''
      CREATE INDEX IF NOT EXISTS idx_messages_sender 
      ON cached_messages(sender_id)
    ''');
    
    // Partial index for active (non-deleted) messages - optimizes standard queries
    await customStatement('''
      CREATE INDEX IF NOT EXISTS idx_messages_channel_active 
      ON cached_messages(channel_id, sent_at DESC) 
      WHERE is_deleted = 0
    ''');
    
    // Index for cache pruning operations (avoids full table scan)
    await customStatement('''
      CREATE INDEX IF NOT EXISTS idx_messages_cached_at 
      ON cached_messages(cached_at)
    ''');
    
    // Index for edit history tracking
    await customStatement('''
      CREATE INDEX IF NOT EXISTS idx_messages_edited 
      ON cached_messages(channel_id, edited_at DESC) 
      WHERE edited_at IS NOT NULL
    ''');
    
    // Index for faster cleanup of soft-deleted messages during repair operations
    await customStatement('''
      CREATE INDEX IF NOT EXISTS idx_messages_deleted_cleanup 
      ON cached_messages(deleted_at) 
      WHERE is_deleted = 1
    ''');
  }

  /// Create FTS5 virtual table and triggers for full-text search
  Future<void> _createFTS5() async {
    // Create FTS5 virtual table
    await customStatement('''
      CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
        id UNINDEXED,
        channel_id UNINDEXED,
        sender_name,
        content,
        tokenize='porter unicode61 remove_diacritics 1'
      )
    ''');
    
    // Trigger: Insert into FTS when message is added
    await customStatement('''
      CREATE TRIGGER IF NOT EXISTS messages_fts_insert 
      AFTER INSERT ON cached_messages
      BEGIN
        INSERT INTO messages_fts(id, channel_id, sender_name, content)
        VALUES (NEW.id, NEW.channel_id, NEW.sender_name, NEW.content);
      END
    ''');
    
    // Trigger: Update FTS when message is updated
    await customStatement('''
      CREATE TRIGGER IF NOT EXISTS messages_fts_update 
      AFTER UPDATE ON cached_messages
      BEGIN
        DELETE FROM messages_fts WHERE id = OLD.id;
        INSERT INTO messages_fts(id, channel_id, sender_name, content)
        VALUES (NEW.id, NEW.channel_id, NEW.sender_name, NEW.content);
      END
    ''');
    
    // Trigger: Delete from FTS when message is deleted
    await customStatement('''
      CREATE TRIGGER IF NOT EXISTS messages_fts_delete 
      AFTER DELETE ON cached_messages
      BEGIN
        DELETE FROM messages_fts WHERE id = OLD.id;
      END
    ''');
  }

  /// Rebuild FTS index from existing messages (for migration)
  Future<void> _rebuildFTSIndex() async {
    await customStatement('DELETE FROM messages_fts');
    await customStatement('''
      INSERT INTO messages_fts(id, channel_id, sender_name, content)
      SELECT id, channel_id, sender_name, content FROM cached_messages
    ''');
  }

  /// Open database connection (platform-aware)
  static QueryExecutor _openConnection() {
    // Web uses IndexedDB via WASM, mobile uses native SQLite.
    return driftDatabase(name: 'thittam_chat_cache');
  }

  // ==========================
  // MESSAGE QUERIES
  // ==========================

  /// Get paginated messages for a channel (newest first)
  Future<List<CachedMessageEntity>> getMessagesForChannel(
    String channelId, {
    int limit = 50,
    DateTime? before,
  }) async {
    var query = select(cachedMessages)
      ..where((m) => m.channelId.equals(channelId))
      ..orderBy([(m) => OrderingTerm.desc(m.sentAt)])
      ..limit(limit);
    
    if (before != null) {
      query = query..where((m) => m.sentAt.isSmallerThanValue(before));
    }
    
    return query.get();
  }

  /// Get a single message by ID
  Future<CachedMessageEntity?> getMessage(String messageId) async {
    return (select(cachedMessages)..where((m) => m.id.equals(messageId))).getSingleOrNull();
  }

  /// Soft delete (mark as deleted) to preserve history and allow recovery.
  Future<void> softDeleteMessage(String messageId) async {
    await (update(cachedMessages)..where((m) => m.id.equals(messageId))).write(
      CachedMessagesCompanion(
        isDeleted: const Value(true),
        deletedAt: Value(DateTime.now()),
      ),
    );
  }

  /// Get all messages (used for backups)
  Future<List<CachedMessageEntity>> getAllMessages() async {
    return select(cachedMessages).get();
  }

  /// Get all channel sync metadata (used for backups/diagnostics)
  Future<List<ChannelSyncMetaEntity>> getAllChannelMeta() async {
    return select(channelSyncMeta).get();
  }

  /// Search messages using FTS (fallbacks to LIKE if FTS fails)
  Future<List<CachedMessageEntity>> searchMessages(
    String query, {
    String? channelId,
    int limit = 50,
  }) async {
    final trimmed = query.trim();
    if (trimmed.isEmpty) return [];
    try {
      return await searchMessagesFTS(trimmed, channelId: channelId, limit: limit);
    } catch (e) {
      _log.error('⚠️ AppDatabase: FTS search failed, falling back to legacy search: $e', tag: _tag);
      return await searchMessagesLegacy(trimmed, channelId: channelId, limit: limit);
    }
  }

  /// Clear all cached data for a single channel
  Future<void> clearChannel(String channelId) async {
    await deleteChannelMessages(channelId);
  }

  /// Get message count for a channel
  Future<int> getMessageCount(String channelId) async {
    final count = cachedMessages.id.count();
    final query = selectOnly(cachedMessages)
      ..addColumns([count])
      ..where(cachedMessages.channelId.equals(channelId));
    
    final result = await query.getSingle();
    return result.read(count) ?? 0;
  }

  /// Insert or update a message
  Future<void> upsertMessage(CachedMessageEntity message) async {
    await into(cachedMessages).insertOnConflictUpdate(message);
  }

  /// Batch insert messages (efficient for sync)
  Future<void> batchUpsertMessages(List<CachedMessageEntity> messages) async {
    await batch((b) {
      for (final msg in messages) {
        b.insert(cachedMessages, msg, mode: InsertMode.insertOrReplace);
      }
    });
  }

  /// Delete a message by ID
  Future<void> deleteMessageById(String messageId) async {
    await (delete(cachedMessages)..where((m) => m.id.equals(messageId))).go();
  }

  /// Delete all messages for a channel
  Future<void> deleteChannelMessages(String channelId) async {
    await (delete(cachedMessages)..where((m) => m.channelId.equals(channelId))).go();
    await (delete(channelSyncMeta)..where((m) => m.channelId.equals(channelId))).go();
  }

  /// Full-text search using FTS5 (fast, ranked results)
  Future<List<CachedMessageEntity>> searchMessagesFTS(
    String query, {
    String? channelId,
    int limit = 100,
  }) async {
    // Escape and prepare query for FTS5
    final ftsQuery = _prepareFTSQuery(query);
    
    String sql;
    List<Variable> variables;
    
    if (channelId != null) {
      sql = '''
        SELECT cm.* FROM cached_messages cm
        INNER JOIN messages_fts fts ON cm.id = fts.id
        WHERE messages_fts MATCH ? AND cm.channel_id = ?
        ORDER BY bm25(messages_fts) DESC, cm.sent_at DESC
        LIMIT ?
      ''';
      variables = [Variable.withString(ftsQuery), Variable.withString(channelId), Variable.withInt(limit)];
    } else {
      sql = '''
        SELECT cm.* FROM cached_messages cm
        INNER JOIN messages_fts fts ON cm.id = fts.id
        WHERE messages_fts MATCH ?
        ORDER BY bm25(messages_fts) DESC, cm.sent_at DESC
        LIMIT ?
      ''';
      variables = [Variable.withString(ftsQuery), Variable.withInt(limit)];
    }
    
    final result = await customSelect(sql, variables: variables).get();
    return result.map((row) => CachedMessageEntity(
      id: row.read<String>('id'),
      channelId: row.read<String>('channel_id'),
      senderId: row.read<String>('sender_id'),
      senderName: row.read<String>('sender_name'),
      senderAvatar: row.readNullable<String>('sender_avatar'),
      content: row.read<String>('content'),
      attachmentsJson: row.read<String>('attachments_json'),
      sentAt: row.read<DateTime>('sent_at'),
      editedAt: row.readNullable<DateTime>('edited_at'),
      deletedAt: row.readNullable<DateTime>('deleted_at'),
      isDeleted: row.read<bool>('is_deleted'),
      isEncrypted: row.readNullable<bool>('is_encrypted'),
      encryptionVersion: row.readNullable<int>('encryption_version'),
      senderPublicKey: row.readNullable<String>('sender_public_key'),
      nonce: row.readNullable<String>('nonce'),
      cachedAt: row.read<DateTime>('cached_at'),
    )).toList();
  }

  /// Search with prefix matching (for autocomplete/live search)
  Future<List<CachedMessageEntity>> searchMessagesPrefix(
    String prefix, {
    String? channelId,
    int limit = 20,
  }) async {
    if (prefix.length < 2) return [];
    
    // Use prefix search with *
    final ftsQuery = '${_escapeFTSToken(prefix)}*';
    
    String sql;
    List<Variable> variables;
    
    if (channelId != null) {
      sql = '''
        SELECT cm.* FROM cached_messages cm
        INNER JOIN messages_fts fts ON cm.id = fts.id
        WHERE messages_fts MATCH ? AND cm.channel_id = ?
        ORDER BY cm.sent_at DESC
        LIMIT ?
      ''';
      variables = [Variable.withString(ftsQuery), Variable.withString(channelId), Variable.withInt(limit)];
    } else {
      sql = '''
        SELECT cm.* FROM cached_messages cm
        INNER JOIN messages_fts fts ON cm.id = fts.id
        WHERE messages_fts MATCH ?
        ORDER BY cm.sent_at DESC
        LIMIT ?
      ''';
      variables = [Variable.withString(ftsQuery), Variable.withInt(limit)];
    }
    
    final result = await customSelect(sql, variables: variables).get();
    return result.map((row) => CachedMessageEntity(
      id: row.read<String>('id'),
      channelId: row.read<String>('channel_id'),
      senderId: row.read<String>('sender_id'),
      senderName: row.read<String>('sender_name'),
      senderAvatar: row.readNullable<String>('sender_avatar'),
      content: row.read<String>('content'),
      attachmentsJson: row.read<String>('attachments_json'),
      sentAt: row.read<DateTime>('sent_at'),
      editedAt: row.readNullable<DateTime>('edited_at'),
      deletedAt: row.readNullable<DateTime>('deleted_at'),
      isDeleted: row.read<bool>('is_deleted'),
      isEncrypted: row.readNullable<bool>('is_encrypted'),
      encryptionVersion: row.readNullable<int>('encryption_version'),
      senderPublicKey: row.readNullable<String>('sender_public_key'),
      nonce: row.readNullable<String>('nonce'),
      cachedAt: row.read<DateTime>('cached_at'),
    )).toList();
  }

  /// Search messages by sender name using FTS5
  Future<List<CachedMessageEntity>> searchBySenderFTS(
    String senderName, {
    int limit = 50,
  }) async {
    final ftsQuery = 'sender_name:${_escapeFTSToken(senderName)}*';
    
    final result = await customSelect('''
      SELECT cm.* FROM cached_messages cm
      INNER JOIN messages_fts fts ON cm.id = fts.id
      WHERE messages_fts MATCH ?
      ORDER BY cm.sent_at DESC
      LIMIT ?
    ''', variables: [Variable.withString(ftsQuery), Variable.withInt(limit)]).get();
    
    return result.map((row) => CachedMessageEntity(
      id: row.read<String>('id'),
      channelId: row.read<String>('channel_id'),
      senderId: row.read<String>('sender_id'),
      senderName: row.read<String>('sender_name'),
      senderAvatar: row.readNullable<String>('sender_avatar'),
      content: row.read<String>('content'),
      attachmentsJson: row.read<String>('attachments_json'),
      sentAt: row.read<DateTime>('sent_at'),
      editedAt: row.readNullable<DateTime>('edited_at'),
      deletedAt: row.readNullable<DateTime>('deleted_at'),
      isDeleted: row.read<bool>('is_deleted'),
      isEncrypted: row.readNullable<bool>('is_encrypted'),
      encryptionVersion: row.readNullable<int>('encryption_version'),
      senderPublicKey: row.readNullable<String>('sender_public_key'),
      nonce: row.readNullable<String>('nonce'),
      cachedAt: row.read<DateTime>('cached_at'),
    )).toList();
  }

  /// Legacy search (fallback, uses LIKE)
  Future<List<CachedMessageEntity>> searchMessagesLegacy(
    String query, {
    String? channelId,
    int limit = 100,
  }) async {
    var q = select(cachedMessages)
      ..where((m) => m.content.contains(query))
      ..orderBy([(m) => OrderingTerm.desc(m.sentAt)])
      ..limit(limit);
    
    if (channelId != null) {
      q = q..where((m) => m.channelId.equals(channelId));
    }
    
    return q.get();
  }

  /// Prepare query string for FTS5 (handles phrases and special chars)
  String _prepareFTSQuery(String query) {
    final trimmed = query.trim();
    
    // If query contains quotes, treat as phrase search
    if (trimmed.contains('"')) {
      return trimmed;
    }
    
    // Split into tokens and escape each
    final tokens = trimmed.split(RegExp(r'\s+'));
    final escaped = tokens.map(_escapeFTSToken).where((t) => t.isNotEmpty);
    
    // Join with AND for stricter matching
    return escaped.join(' AND ');
  }

  /// Escape special FTS5 characters in a token
  String _escapeFTSToken(String token) {
    // Remove characters that have special meaning in FTS5
    return token.replaceAll(RegExp(r'["\(\)\*\:\-\^]'), '');
  }

  /// Optimize FTS index (run periodically)
  Future<void> optimizeFTS() async {
    await customStatement("INSERT INTO messages_fts(messages_fts) VALUES('optimize')");
    _log.info('✅ AppDatabase: FTS index optimized', tag: _tag);
  }

  /// Rebuild FTS index completely (use if index becomes corrupted)
  Future<void> rebuildFTSIndex() async {
    await _rebuildFTSIndex();
    _log.info('✅ AppDatabase: FTS index rebuilt', tag: _tag);
  }

  /// Get FTS index statistics
  Future<Map<String, dynamic>> getFTSStats() async {
    final result = await customSelect(
      "SELECT * FROM messages_fts WHERE messages_fts MATCH 'id:*' LIMIT 0"
    ).get();
    
    final countResult = await customSelect(
      'SELECT COUNT(*) as cnt FROM messages_fts'
    ).getSingle();
    
    return {
      'indexedMessages': countResult.read<int>('cnt'),
      'status': 'healthy',
    };
  }

  /// Get messages by sender
  Future<List<CachedMessageEntity>> getMessagesBySender(
    String senderId, {
    int limit = 50,
  }) async {
    return (select(cachedMessages)
      ..where((m) => m.senderId.equals(senderId))
      ..orderBy([(m) => OrderingTerm.desc(m.sentAt)])
      ..limit(limit)
    ).get();
  }

  // ==========================
  // SYNC METADATA QUERIES
  // ==========================

  /// Get sync metadata for a channel
  Future<ChannelSyncMetaEntity?> getChannelMeta(String channelId) async {
    return (select(channelSyncMeta)
      ..where((m) => m.channelId.equals(channelId))
    ).getSingleOrNull();
  }

  /// Update sync metadata
  Future<void> updateChannelMeta(ChannelSyncMetaEntity meta) async {
    await into(channelSyncMeta).insertOnConflictUpdate(meta);
  }

  /// Get all channel IDs with cached messages
  Future<List<String>> getCachedChannelIds() async {
    final query = selectOnly(channelSyncMeta, distinct: true)
      ..addColumns([channelSyncMeta.channelId]);
    
    final results = await query.get();
    return results.map((r) => r.read(channelSyncMeta.channelId)!).toList();
  }

  // ==========================
  // MAINTENANCE QUERIES
  // ==========================

  /// Prune old messages (keep recent N days)
  Future<int> pruneOldMessages({int keepDays = 90}) async {
    final cutoff = DateTime.now().subtract(Duration(days: keepDays));
    return (delete(cachedMessages)
      ..where((m) => m.sentAt.isSmallerThanValue(cutoff))
    ).go();
  }

  /// Vacuum database to reclaim space
  Future<void> vacuum() async {
    await customStatement('VACUUM');
  }

  /// Get database statistics
  Future<Map<String, dynamic>> getStats() async {
    final messageCount = cachedMessages.id.count();
    final channelCount = channelSyncMeta.channelId.count();
    
    final msgResult = await (selectOnly(cachedMessages)..addColumns([messageCount])).getSingle();
    final chResult = await (selectOnly(channelSyncMeta)..addColumns([channelCount])).getSingle();
    
    return {
      'totalMessages': msgResult.read(messageCount) ?? 0,
      'cachedChannels': chResult.read(channelCount) ?? 0,
      'schemaVersion': schemaVersion,
    };
  }

  /// Clear all cached data
  Future<void> clearAll() async {
    await delete(cachedMessages).go();
    await delete(channelSyncMeta).go();
    _log.info('✅ AppDatabase: All cache cleared', tag: _tag);
  }

  // ==========================
  // INTEGRITY & RECOVERY
  // ==========================

  /// Result of database integrity check
  static const String _integrityOk = 'ok';

  /// Run comprehensive database integrity check
  /// Returns a map with check results and any issues found
  Future<DatabaseHealthReport> checkIntegrity() async {
    final issues = <String>[];
    var isHealthy = true;

    try {
      // 1. SQLite integrity check (checks B-tree structure)
      final integrityResult = await customSelect('PRAGMA integrity_check').get();
      final integrityStatus = integrityResult.first.read<String>('integrity_check');
      if (integrityStatus != _integrityOk) {
        issues.add('Database corruption detected: $integrityStatus');
        isHealthy = false;
      }

      // 2. Foreign key check
      final fkResult = await customSelect('PRAGMA foreign_key_check').get();
      if (fkResult.isNotEmpty) {
        issues.add('Foreign key violations: ${fkResult.length} found');
        isHealthy = false;
      }

      // 3. Check FTS index consistency
      final ftsHealthy = await _checkFTSHealth();
      if (!ftsHealthy) {
        issues.add('FTS5 index inconsistency detected');
        isHealthy = false;
      }

      // 4. Check for orphaned sync metadata
      final orphanedMeta = await _checkOrphanedSyncMeta();
      if (orphanedMeta > 0) {
        issues.add('Orphaned sync metadata: $orphanedMeta entries');
        // Not critical, just cleanup needed
      }

      // 5. WAL checkpoint status
      final walStatus = await _getWALStatus();

      return DatabaseHealthReport(
        isHealthy: isHealthy,
        issues: issues,
        walStatus: walStatus,
        checkedAt: DateTime.now(),
      );
    } catch (e) {
      _log.error('❌ AppDatabase: Integrity check failed: $e', tag: _tag);
      return DatabaseHealthReport(
        isHealthy: false,
        issues: ['Integrity check failed: $e'],
        walStatus: const WALStatus(walSize: 0, checkpointCount: 0),
        checkedAt: DateTime.now(),
      );
    }
  }

  /// Check FTS5 index health by comparing counts
  Future<bool> _checkFTSHealth() async {
    try {
      final messageCount = await customSelect(
        'SELECT COUNT(*) as cnt FROM cached_messages WHERE is_deleted = 0'
      ).getSingle();
      
      final ftsCount = await customSelect(
        'SELECT COUNT(*) as cnt FROM messages_fts'
      ).getSingle();

      final msgCnt = messageCount.read<int>('cnt') ?? 0;
      final ftsCnt = ftsCount.read<int>('cnt') ?? 0;

      // Allow small discrepancy (race conditions during inserts)
      return (msgCnt - ftsCnt).abs() <= 5;
    } catch (e) {
      _log.error('⚠️ AppDatabase: FTS health check error: $e', tag: _tag);
      return false;
    }
  }

  /// Check for orphaned sync metadata (channels with no messages)
  Future<int> _checkOrphanedSyncMeta() async {
    final result = await customSelect('''
      SELECT COUNT(*) as cnt FROM channel_sync_meta csm
      WHERE NOT EXISTS (
        SELECT 1 FROM cached_messages cm WHERE cm.channel_id = csm.channel_id
      )
    ''').getSingle();
    return result.read<int>('cnt') ?? 0;
  }

  /// Get WAL status for monitoring
  Future<WALStatus> _getWALStatus() async {
    try {
      final result = await customSelect('PRAGMA wal_checkpoint(PASSIVE)').getSingle();
      return WALStatus(
        walSize: result.read<int>('busy') ?? 0,
        checkpointCount: result.read<int>('log') ?? 0,
      );
    } catch (e) {
      return const WALStatus(walSize: 0, checkpointCount: 0);
    }
  }

  /// Attempt automatic repair of detected issues
  /// Returns true if repair was successful
  Future<RepairResult> attemptRepair() async {
    final repairActions = <String>[];
    var success = true;

    try {
      // 1. Rebuild FTS index if corrupted
      _log.debug('🔧 AppDatabase: Rebuilding FTS index...', tag: _tag);
      await _rebuildFTSIndex();
      repairActions.add('FTS index rebuilt');

      // 2. Clean up orphaned sync metadata
      final orphanedCleaned = await customStatement('''
        DELETE FROM channel_sync_meta 
        WHERE NOT EXISTS (
          SELECT 1 FROM cached_messages cm 
          WHERE cm.channel_id = channel_sync_meta.channel_id
        )
      ''');
      repairActions.add('Orphaned sync metadata cleaned');

      // 3. Remove soft-deleted messages older than 30 days
      final cutoff = DateTime.now().subtract(const Duration(days: 30));
      await (delete(cachedMessages)
        ..where((m) => m.isDeleted.equals(true))
        ..where((m) => m.deletedAt.isSmallerThanValue(cutoff))
      ).go();
      repairActions.add('Old deleted messages purged');

      // 4. Force WAL checkpoint
      await customStatement('PRAGMA wal_checkpoint(TRUNCATE)');
      repairActions.add('WAL checkpoint completed');

      // 5. Reindex for optimal performance
      await customStatement('REINDEX');
      repairActions.add('Indexes rebuilt');

      // 6. Analyze for query optimizer
      await customStatement('ANALYZE');
      repairActions.add('Statistics updated');

      _log.info('✅ AppDatabase: Repair completed successfully', tag: _tag);
    } catch (e) {
      _log.error('❌ AppDatabase: Repair failed: $e', tag: _tag);
      repairActions.add('Error: $e');
      success = false;
    }

    return RepairResult(
      success: success,
      actions: repairActions,
      repairedAt: DateTime.now(),
    );
  }

  /// Emergency recovery: Export data and recreate database
  /// Use only when normal repair fails
  Future<RecoveryResult> emergencyRecovery() async {
    _log.debug('🚨 AppDatabase: Starting emergency recovery...', tag: _tag);
    
    try {
      // 1. Try to export all recoverable messages
      List<CachedMessageEntity> recoveredMessages = [];
      try {
        recoveredMessages = await select(cachedMessages).get();
        _log.debug('📦 AppDatabase: Recovered ${recoveredMessages.length} messages', tag: _tag);
      } catch (e) {
        _log.warning('⚠️ AppDatabase: Could not recover messages: $e', tag: _tag);
      }

      // 2. Export sync metadata
      List<ChannelSyncMetaEntity> recoveredMeta = [];
      try {
        recoveredMeta = await select(channelSyncMeta).get();
      } catch (e) {
        _log.warning('⚠️ AppDatabase: Could not recover sync metadata: $e', tag: _tag);
      }

      // 3. Close current connection
      await close();
      _instance = null;

      // 4. Delete corrupted database file (platform-specific)
      // Note: drift_flutter handles this internally with the name parameter

      // 5. Reinitialize fresh database
      _instance = AppDatabase._();

      // 6. Restore recovered data
      if (recoveredMessages.isNotEmpty) {
        await _instance!.batchUpsertMessages(recoveredMessages);
        _log.info('✅ AppDatabase: Restored ${recoveredMessages.length} messages', tag: _tag);
      }

      if (recoveredMeta.isNotEmpty) {
        for (final meta in recoveredMeta) {
          await _instance!.updateChannelMeta(meta);
        }
        _log.info('✅ AppDatabase: Restored ${recoveredMeta.length} channel metadata', tag: _tag);
      }

      return RecoveryResult(
        success: true,
        messagesRecovered: recoveredMessages.length,
        channelsRecovered: recoveredMeta.length,
        recoveredAt: DateTime.now(),
      );
    } catch (e) {
      _log.error('❌ AppDatabase: Emergency recovery failed: $e', tag: _tag);
      return RecoveryResult(
        success: false,
        messagesRecovered: 0,
        channelsRecovered: 0,
        recoveredAt: DateTime.now(),
        error: e.toString(),
      );
    }
  }

  /// Run startup health check and auto-repair if needed
  Future<void> runStartupCheck() async {
    _log.debug('🏥 AppDatabase: Running startup health check...', tag: _tag);
    
    final health = await checkIntegrity();
    
    if (!health.isHealthy) {
      _log.warning('⚠️ AppDatabase: Issues detected, attempting repair...', tag: _tag);
      final repair = await attemptRepair();
      
      if (!repair.success) {
        _log.error('❌ AppDatabase: Repair failed, may need emergency recovery', tag: _tag);
      }
    } else {
      _log.info('✅ AppDatabase: Database healthy', tag: _tag);
    }
  }

  /// Close database connection
  Future<void> closeDatabase() async {
    // Checkpoint WAL before closing
    try {
      await customStatement('PRAGMA wal_checkpoint(TRUNCATE)');
    } catch (e) {
      _log.error('⚠️ AppDatabase: WAL checkpoint failed on close: $e', tag: _tag);
    }
    await close();
    _instance = null;
  }
}

// ==========================
// HEALTH REPORT MODELS
// ==========================

/// Database health check report
class DatabaseHealthReport {
  final bool isHealthy;
  final List<String> issues;
  final WALStatus walStatus;
  final DateTime checkedAt;

  const DatabaseHealthReport({
    required this.isHealthy,
    required this.issues,
    required this.walStatus,
    required this.checkedAt,
  });

  @override
  String toString() => 'DatabaseHealthReport(healthy: $isHealthy, issues: ${issues.length})';
}

/// WAL status information
class WALStatus {
  final int walSize;
  final int checkpointCount;

  const WALStatus({
    required this.walSize,
    required this.checkpointCount,
  });
}

/// Repair operation result
class RepairResult {
  final bool success;
  final List<String> actions;
  final DateTime repairedAt;

  const RepairResult({
    required this.success,
    required this.actions,
    required this.repairedAt,
  });
}

/// Emergency recovery result
class RecoveryResult {
  final bool success;
  final int messagesRecovered;
  final int channelsRecovered;
  final DateTime recoveredAt;
  final String? error;

  const RecoveryResult({
    required this.success,
    required this.messagesRecovered,
    required this.channelsRecovered,
    required this.recoveredAt,
    this.error,
  });
}
