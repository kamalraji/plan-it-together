/// Platform-agnostic database interface
/// Provides abstraction layer for Drift-based database operations
abstract class AppDatabaseInterface {
  /// Schema version
  int get schemaVersion;
  
  /// Get all cached messages for a channel
  Future<List<CachedMessageData>> getMessagesForChannel(
    String channelId, {
    int limit = 50,
    DateTime? before,
  });
  
  /// Get a single message by ID
  Future<CachedMessageData?> getMessage(String messageId);
  
  /// Upsert a single message
  Future<void> upsertMessage(CachedMessageData message);
  
  /// Batch upsert messages
  Future<void> batchUpsertMessages(List<CachedMessageData> messages);
  
  /// Delete a message by ID
  Future<void> deleteMessage(String messageId);
  
  /// Delete a message by ID (alias for backward compatibility)
  Future<void> deleteMessageById(String messageId);
  
  /// Soft delete (mark as deleted)
  Future<void> softDeleteMessage(String messageId);
  
  /// Delete all messages for a channel
  Future<void> deleteChannelMessages(String channelId);
  
  /// Get all messages (for backup)
  Future<List<CachedMessageData>> getAllMessages();
  
  /// Get channel sync metadata
  Future<ChannelSyncMetaData?> getChannelMeta(String channelId);
  
  /// Update channel sync metadata
  Future<void> updateChannelMeta(ChannelSyncMetaData meta);
  
  /// Get all channel metadata
  Future<List<ChannelSyncMetaData>> getAllChannelMeta();
  
  /// Search messages using FTS
  Future<List<CachedMessageData>> searchMessages(
    String query, {
    String? channelId,
    int limit = 50,
  });
  
  /// Clear all data for a channel
  Future<void> clearChannel(String channelId);
  
  /// Clear all data
  Future<void> clearAll();
  
  /// Prune old messages older than keepDays
  Future<int> pruneOldMessages({int keepDays = 90});
  
  /// Vacuum database to reclaim space
  Future<void> vacuum();
  
  /// Get database statistics
  Future<Map<String, dynamic>> getStats();
  
  /// Run integrity check
  Future<bool> checkIntegrity();
  
  /// Close database connection
  Future<void> close();
  
  /// Run startup health check
  Future<void> runStartupCheck();
}

/// Cached message data model (platform-agnostic)
class CachedMessageData {
  final String id;
  final String channelId;
  final String senderId;
  final String senderName;
  final String? senderAvatar;
  final String content;
  final String attachmentsJson;
  final DateTime sentAt;
  final DateTime? editedAt;
  final DateTime? deletedAt;
  final bool isDeleted;
  final bool? isEncrypted;
  final int? encryptionVersion;
  final String? senderPublicKey;
  final String? nonce;
  final DateTime cachedAt;

  const CachedMessageData({
    required this.id,
    required this.channelId,
    required this.senderId,
    required this.senderName,
    this.senderAvatar,
    required this.content,
    this.attachmentsJson = '[]',
    required this.sentAt,
    this.editedAt,
    this.deletedAt,
    this.isDeleted = false,
    this.isEncrypted,
    this.encryptionVersion,
    this.senderPublicKey,
    this.nonce,
    required this.cachedAt,
  });

  Map<String, dynamic> toMap() => {
    'id': id,
    'channelId': channelId,
    'senderId': senderId,
    'senderName': senderName,
    'senderAvatar': senderAvatar,
    'content': content,
    'attachmentsJson': attachmentsJson,
    'sentAt': sentAt.toIso8601String(),
    'editedAt': editedAt?.toIso8601String(),
    'deletedAt': deletedAt?.toIso8601String(),
    'isDeleted': isDeleted,
    'isEncrypted': isEncrypted,
    'encryptionVersion': encryptionVersion,
    'senderPublicKey': senderPublicKey,
    'nonce': nonce,
    'cachedAt': cachedAt.toIso8601String(),
  };

  factory CachedMessageData.fromMap(Map<String, dynamic> map) {
    return CachedMessageData(
      id: map['id'] as String,
      channelId: map['channelId'] as String,
      senderId: map['senderId'] as String,
      senderName: map['senderName'] as String,
      senderAvatar: map['senderAvatar'] as String?,
      content: map['content'] as String,
      attachmentsJson: map['attachmentsJson'] as String? ?? '[]',
      sentAt: DateTime.parse(map['sentAt'] as String),
      editedAt: map['editedAt'] != null ? DateTime.parse(map['editedAt'] as String) : null,
      deletedAt: map['deletedAt'] != null ? DateTime.parse(map['deletedAt'] as String) : null,
      isDeleted: map['isDeleted'] as bool? ?? false,
      isEncrypted: map['isEncrypted'] as bool?,
      encryptionVersion: map['encryptionVersion'] as int?,
      senderPublicKey: map['senderPublicKey'] as String?,
      nonce: map['nonce'] as String?,
      cachedAt: DateTime.parse(map['cachedAt'] as String),
    );
  }
}

/// Channel sync metadata (platform-agnostic)
class ChannelSyncMetaData {
  final String channelId;
  final DateTime lastSyncedAt;
  final bool hasMore;
  final int messageCount;

  const ChannelSyncMetaData({
    required this.channelId,
    required this.lastSyncedAt,
    this.hasMore = true,
    this.messageCount = 0,
  });

  Map<String, dynamic> toMap() => {
    'channelId': channelId,
    'lastSyncedAt': lastSyncedAt.toIso8601String(),
    'hasMore': hasMore,
    'messageCount': messageCount,
  };

  factory ChannelSyncMetaData.fromMap(Map<String, dynamic> map) {
    return ChannelSyncMetaData(
      channelId: map['channelId'] as String,
      lastSyncedAt: DateTime.parse(map['lastSyncedAt'] as String),
      hasMore: map['hasMore'] as bool? ?? true,
      messageCount: map['messageCount'] as int? ?? 0,
    );
  }
}
