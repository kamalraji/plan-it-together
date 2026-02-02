import 'package:flutter/foundation.dart';
import 'database_interface.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'app_database.dart' as drift_db;

/// Native implementation of AppDatabaseInterface
/// Wraps the Drift-based AppDatabase for mobile platforms
class AppDatabaseNative implements AppDatabaseInterface {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'AppDatabaseNative';

  static AppDatabaseNative? _instance;
  static AppDatabaseNative get instance => _instance ??= AppDatabaseNative._();
  
  final drift_db.AppDatabase _db = drift_db.AppDatabase.instance;
  
  AppDatabaseNative._() {
    _log.info('✅ AppDatabase: Native Drift implementation initialized', tag: _tag);
  }

  @override
  int get schemaVersion => _db.schemaVersion;

  @override
  Future<List<CachedMessageData>> getMessagesForChannel(
    String channelId, {
    int limit = 50,
    DateTime? before,
  }) async {
    final messages = await _db.getMessagesForChannel(channelId, limit: limit, before: before);
    return messages.map(_entityToData).toList();
  }

  @override
  Future<CachedMessageData?> getMessage(String messageId) async {
    final entity = await _db.getMessage(messageId);
    return entity != null ? _entityToData(entity) : null;
  }

  @override
  Future<void> upsertMessage(CachedMessageData message) async {
    await _db.upsertMessage(_dataToEntity(message));
  }

  @override
  Future<void> batchUpsertMessages(List<CachedMessageData> messages) async {
    await _db.batchUpsertMessages(messages.map(_dataToEntity).toList());
  }

  @override
  Future<void> deleteMessage(String messageId) async {
    await _db.deleteMessageById(messageId);
  }

  @override
  Future<void> deleteMessageById(String messageId) async {
    await _db.deleteMessageById(messageId);
  }

  @override
  Future<void> softDeleteMessage(String messageId) async {
    await _db.softDeleteMessage(messageId);
  }

  @override
  Future<void> deleteChannelMessages(String channelId) async {
    await _db.deleteChannelMessages(channelId);
  }

  @override
  Future<List<CachedMessageData>> getAllMessages() async {
    final messages = await _db.getAllMessages();
    return messages.map(_entityToData).toList();
  }

  @override
  Future<ChannelSyncMetaData?> getChannelMeta(String channelId) async {
    final entity = await _db.getChannelMeta(channelId);
    return entity != null ? _metaEntityToData(entity) : null;
  }

  @override
  Future<void> updateChannelMeta(ChannelSyncMetaData meta) async {
    await _db.updateChannelMeta(_dataToMetaEntity(meta));
  }

  @override
  Future<List<ChannelSyncMetaData>> getAllChannelMeta() async {
    final metas = await _db.getAllChannelMeta();
    return metas.map(_metaEntityToData).toList();
  }

  @override
  Future<List<CachedMessageData>> searchMessages(
    String query, {
    String? channelId,
    int limit = 50,
  }) async {
    final messages = await _db.searchMessages(query, channelId: channelId, limit: limit);
    return messages.map(_entityToData).toList();
  }

  @override
  Future<void> clearChannel(String channelId) async {
    await _db.clearChannel(channelId);
  }

  @override
  Future<void> clearAll() async {
    await _db.clearAll();
  }

  @override
  Future<int> pruneOldMessages({int keepDays = 90}) async {
    return await _db.pruneOldMessages(keepDays: keepDays);
  }

  @override
  Future<void> vacuum() async {
    await _db.vacuum();
  }

  @override
  Future<Map<String, dynamic>> getStats() async {
    return await _db.getStats();
  }

  @override
  Future<bool> checkIntegrity() async {
    final health = await _db.checkIntegrity();
    return health.isHealthy;
  }

  @override
  Future<void> close() async {
    await _db.closeDatabase();
  }

  @override
  Future<void> runStartupCheck() async {
    await _db.runStartupCheck();
  }

  // Conversion helpers
  CachedMessageData _entityToData(drift_db.CachedMessageEntity entity) {
    return CachedMessageData(
      id: entity.id,
      channelId: entity.channelId,
      senderId: entity.senderId,
      senderName: entity.senderName,
      senderAvatar: entity.senderAvatar,
      content: entity.content,
      attachmentsJson: entity.attachmentsJson,
      sentAt: entity.sentAt,
      editedAt: entity.editedAt,
      deletedAt: entity.deletedAt,
      isDeleted: entity.isDeleted,
      isEncrypted: entity.isEncrypted,
      encryptionVersion: entity.encryptionVersion,
      senderPublicKey: entity.senderPublicKey,
      nonce: entity.nonce,
      cachedAt: entity.cachedAt,
    );
  }

  drift_db.CachedMessageEntity _dataToEntity(CachedMessageData data) {
    return drift_db.CachedMessageEntity(
      id: data.id,
      channelId: data.channelId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderAvatar: data.senderAvatar,
      content: data.content,
      attachmentsJson: data.attachmentsJson,
      sentAt: data.sentAt,
      editedAt: data.editedAt,
      deletedAt: data.deletedAt,
      isDeleted: data.isDeleted,
      isEncrypted: data.isEncrypted,
      encryptionVersion: data.encryptionVersion,
      senderPublicKey: data.senderPublicKey,
      nonce: data.nonce,
      cachedAt: data.cachedAt,
    );
  }

  ChannelSyncMetaData _metaEntityToData(drift_db.ChannelSyncMetaEntity entity) {
    return ChannelSyncMetaData(
      channelId: entity.channelId,
      lastSyncedAt: entity.lastSyncedAt,
      hasMore: entity.hasMore,
      messageCount: entity.messageCount,
    );
  }

  drift_db.ChannelSyncMetaEntity _dataToMetaEntity(ChannelSyncMetaData data) {
    return drift_db.ChannelSyncMetaEntity(
      channelId: data.channelId,
      lastSyncedAt: data.lastSyncedAt,
      hasMore: data.hasMore,
      messageCount: data.messageCount,
    );
  }
}

/// Factory function for native platform
AppDatabaseInterface createAppDatabase() {
  return AppDatabaseNative.instance;
}
