import 'package:flutter/foundation.dart';
import 'database_interface.dart';

import 'package:thittam1hub/services/logging_service.dart';
/// Web stub implementation of AppDatabaseInterface
/// SQLite/Drift is not available on web, so this provides a no-op stub
class AppDatabaseWebStub implements AppDatabaseInterface {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'AppDatabaseWebStub';

  static AppDatabaseWebStub? _instance;
  static AppDatabaseWebStub get instance => _instance ??= AppDatabaseWebStub._();
  
  AppDatabaseWebStub._() {
    _log.warning('⚠️ AppDatabase: Using web stub - local caching disabled', tag: _tag);
  }

  @override
  int get schemaVersion => 2;

  @override
  Future<List<CachedMessageData>> getMessagesForChannel(
    String channelId, {
    int limit = 50,
    DateTime? before,
  }) async => [];

  @override
  Future<CachedMessageData?> getMessage(String messageId) async => null;

  @override
  Future<void> upsertMessage(CachedMessageData message) async {}

  @override
  Future<void> batchUpsertMessages(List<CachedMessageData> messages) async {}

  @override
  Future<void> deleteMessage(String messageId) async {}

  @override
  Future<void> deleteMessageById(String messageId) async {}

  @override
  Future<void> softDeleteMessage(String messageId) async {}

  @override
  Future<void> deleteChannelMessages(String channelId) async {}

  @override
  Future<List<CachedMessageData>> getAllMessages() async => [];

  @override
  Future<ChannelSyncMetaData?> getChannelMeta(String channelId) async => null;

  @override
  Future<void> updateChannelMeta(ChannelSyncMetaData meta) async {}

  @override
  Future<List<ChannelSyncMetaData>> getAllChannelMeta() async => [];

  @override
  Future<List<CachedMessageData>> searchMessages(
    String query, {
    String? channelId,
    int limit = 50,
  }) async => [];

  @override
  Future<void> clearChannel(String channelId) async {}

  @override
  Future<void> clearAll() async {}

  @override
  Future<int> pruneOldMessages({int keepDays = 90}) async => 0;

  @override
  Future<void> vacuum() async {}

  @override
  Future<Map<String, dynamic>> getStats() async => {
    'messageCount': 0,
    'channelCount': 0,
    'platform': 'web',
  };

  @override
  Future<bool> checkIntegrity() async => true;

  @override
  Future<void> close() async {}

  @override
  Future<void> runStartupCheck() async {
    _log.info('✅ AppDatabase: Web stub - no startup check needed', tag: _tag);
  }
}

/// Factory function for web platform
AppDatabaseInterface createAppDatabase() {
  return AppDatabaseWebStub.instance;
}
