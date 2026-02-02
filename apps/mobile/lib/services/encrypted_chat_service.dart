import 'dart:convert';
import 'package:thittam1hub/models/encryption_models.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/services/e2e_encryption_service.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';

/// Encrypted Chat Service
///
/// Provides E2E encrypted messaging by wrapping standard chat operations.
/// Messages are encrypted before sending and decrypted when received.
class EncryptedChatService {
  static const String _tag = 'EncryptedChat';
  static final LoggingService _log = LoggingService.instance;

  EncryptedChatService._();
  static EncryptedChatService? _instance;
  static EncryptedChatService get instance => _instance ??= EncryptedChatService._();

  final E2EEncryptionService _encryption = E2EEncryptionService.instance;
  static const String _messagesTable = 'messages';

  // ============ INITIALIZATION ============

  /// Ensure encryption is set up for the current user
  Future<bool> ensureEncryptionInitialized() async {
    return await _encryption.initializeEncryption();
  }

  /// Check if encryption is available
  Future<bool> isEncryptionAvailable() async {
    return await _encryption.hasKeyPair();
  }

  // ============ ENCRYPTED SENDING ============

  /// Send an encrypted DM message
  Future<Message?> sendEncryptedMessage({
    required String channelId,
    required String recipientUserId,
    required String content,
    List<MessageAttachment> attachments = const [],
  }) async {
    try {
      final user = SupabaseConfig.auth.currentUser;
      if (user == null) return null;

      // Encrypt the message content
      final encryptResult = await _encryption.encryptMessage(content, recipientUserId);
      if (!encryptResult.success) {
        _log.error('Encryption failed', tag: _tag, error: encryptResult.error);
        return null;
      }

      final encrypted = encryptResult.data!;

      // Get sender info
      String senderName = user.email?.split('@').first ?? 'You';
      String? senderAvatar;
      try {
        final profile = await SupabaseConfig.client
            .from('user_profiles')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .maybeSingle();
        if (profile != null) {
          senderName = (profile['full_name'] as String?)?.trim().isNotEmpty == true
              ? profile['full_name'] as String
              : senderName;
          senderAvatar = profile['avatar_url'] as String?;
        }
      } catch (e) {
        _log.warning('Profile lookup error', tag: _tag, error: e);
      }

      // Encrypt attachments if any
      List<Map<String, dynamic>> encryptedAttachments = [];
      for (final attachment in attachments) {
        // For now, store attachment metadata encrypted
        // Full file encryption requires upload changes
        encryptedAttachments.add({
          ...attachment.toJson(),
          'encrypted': false, // Mark for future file encryption support
        });
      }

      // Prepare message data
      final data = {
        'channel_id': channelId,
        'sender_id': user.id,
        'sender_name': senderName,
        'sender_avatar': senderAvatar,
        'content': encrypted.ciphertext,
        'attachments': encryptedAttachments,
        'sent_at': DateTime.now().toIso8601String(),
        // Encryption metadata
        'is_encrypted': true,
        'encryption_version': encrypted.encryptionVersion,
        'sender_public_key': encrypted.senderPublicKey,
        'nonce': encrypted.nonce,
      };

      final inserted = await SupabaseConfig.client
          .from(_messagesTable)
          .insert(data)
          .select()
          .maybeSingle();

      if (inserted == null) return null;

      _log.dbOperation('INSERT encrypted', _messagesTable, rowCount: 1, tag: _tag);

      // Return message with original content (for sender's UI)
      return Message.fromJson({
        ...Map<String, dynamic>.from(inserted),
        'content': content, // Use original content for sender
      });
    } catch (e) {
      _log.error('sendEncryptedMessage error', tag: _tag, error: e);
      return null;
    }
  }

  /// Send an encrypted group message
  Future<Message?> sendEncryptedGroupMessage({
    required String groupId,
    required String content,
    Map<String, dynamic>? attachments,
  }) async {
    try {
      final user = SupabaseConfig.auth.currentUser;
      if (user == null) return null;

      final channelId = 'group:$groupId';

      // Get group's encryption key
      final groupKey = await _getGroupEncryptionKey(groupId);
      if (groupKey == null) {
        _log.debug('No group key found, falling back to unencrypted', tag: _tag);
        // Fall back to unencrypted for legacy groups
        return await _sendUnencryptedGroupMessage(groupId, content, attachments);
      }

      // Encrypt with group key
      final myPublicKey = await _encryption.getPublicKey();
      if (myPublicKey == null) return null;

      // Use group key to encrypt
      final encryptResult = await _encryptWithGroupKey(content, groupKey);
      if (!encryptResult.success) {
        _log.warning('Group encryption failed, falling back', tag: _tag);
        return await _sendUnencryptedGroupMessage(groupId, content, attachments);
      }

      final encrypted = encryptResult.data!;

      final data = {
        'channel_id': channelId,
        'sender_id': user.id,
        'content': encrypted.ciphertext,
        'attachments': attachments,
        'sent_at': DateTime.now().toIso8601String(),
        'is_encrypted': true,
        'encryption_version': 1,
        'sender_public_key': encrypted.senderPublicKey,
        'nonce': encrypted.nonce,
      };

      final inserted = await SupabaseConfig.client
          .from(_messagesTable)
          .insert(data)
          .select()
          .maybeSingle();

      // Update group timestamp
      await SupabaseConfig.client
          .from('chat_groups')
          .update({'updated_at': DateTime.now().toIso8601String()})
          .eq('id', groupId);

      if (inserted == null) return null;

      _log.dbOperation('INSERT encrypted group', _messagesTable, rowCount: 1, tag: _tag);

      return Message.fromJson({
        ...Map<String, dynamic>.from(inserted),
        'content': content,
      });
    } catch (e) {
      _log.error('sendEncryptedGroupMessage error', tag: _tag, error: e);
      return null;
    }
  }

  Future<Message?> _sendUnencryptedGroupMessage(
    String groupId,
    String content,
    Map<String, dynamic>? attachments,
  ) async {
    final user = SupabaseConfig.auth.currentUser;
    if (user == null) return null;

    final channelId = 'group:$groupId';
    final data = {
      'channel_id': channelId,
      'sender_id': user.id,
      'content': content,
      'attachments': attachments,
      'sent_at': DateTime.now().toIso8601String(),
      'is_encrypted': false,
    };

    final inserted = await SupabaseConfig.client
        .from(_messagesTable)
        .insert(data)
        .select()
        .maybeSingle();

    await SupabaseConfig.client
        .from('chat_groups')
        .update({'updated_at': DateTime.now().toIso8601String()})
        .eq('id', groupId);

    return inserted != null ? Message.fromJson(Map<String, dynamic>.from(inserted)) : null;
  }

  // ============ DECRYPTION ============

  /// Decrypt a single message
  Future<Message> decryptMessage(Message message) async {
    // Check if message is encrypted
    if (!_isMessageEncrypted(message)) {
      return message;
    }

    try {
      // Build EncryptedMessage from message data
      final encrypted = EncryptedMessage(
        ciphertext: message.content,
        nonce: message.nonce ?? '',
        senderPublicKey: message.senderPublicKey ?? '',
        encryptionVersion: message.encryptionVersion ?? 1,
      );

      final result = await _encryption.decryptMessage(encrypted);
      if (result.success) {
        return message.copyWith(content: result.data!);
      } else {
        _log.warning('Decryption failed', tag: _tag, error: result.error);
        return message.copyWith(content: '[Unable to decrypt message]');
      }
    } catch (e) {
      _log.error('decryptMessage error', tag: _tag, error: e);
      return message.copyWith(content: '[Decryption error]');
    }
  }

  /// Decrypt a list of messages
  Future<List<Message>> decryptMessages(List<Message> messages) async {
    final decrypted = <Message>[];
    
    for (final message in messages) {
      decrypted.add(await decryptMessage(message));
    }
    
    return decrypted;
  }

  /// Stream decrypted messages for a channel
  Stream<List<Message>> streamDecryptedMessages(String channelId) {
    return SupabaseConfig.client
        .from(_messagesTable)
        .stream(primaryKey: ['id'])
        .eq('channel_id', channelId)
        .order('sent_at')
        .asyncMap((rows) async {
          final messages = rows
              .map((e) => Message.fromJson(Map<String, dynamic>.from(e)))
              .toList();
          return await decryptMessages(messages);
        });
  }

  // ============ GROUP KEY MANAGEMENT ============

  /// Initialize encryption for a group (called by owner/admin)
  Future<bool> initializeGroupEncryption(String groupId) async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return false;

      // Generate group key
      final groupKey = await _encryption.generateGroupKey();

      // Get all group members
      final members = await SupabaseConfig.client
          .from('chat_group_members')
          .select('user_id')
          .eq('group_id', groupId);

      final memberIds = (members as List).map((m) => m['user_id'] as String).toList();

      // Encrypt group key for each member
      for (final memberId in memberIds) {
        final encryptedKeyResult = await _encryption.encryptGroupKeyForMember(
          groupKey,
          memberId,
        );

        if (encryptedKeyResult.success && encryptedKeyResult.data != null) {
          final encryptedMessage = encryptedKeyResult.data!;
          
          await SupabaseConfig.client.from('group_encryption_keys').upsert({
            'group_id': groupId,
            'member_id': memberId,
            'encrypted_key': encryptedMessage.ciphertext,
            'nonce': encryptedMessage.nonce,
            'sender_public_key': encryptedMessage.senderPublicKey,
            'key_version': 1,
          });
        }
      }

      _log.info('Group encryption initialized', tag: _tag, metadata: {'groupId': groupId});
      return true;
    } catch (e) {
      _log.error('initializeGroupEncryption error', tag: _tag, error: e);
      return false;
    }
  }

  /// Get group encryption key for current user
  Future<GroupEncryptionKey?> _getGroupEncryptionKey(String groupId) async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return null;

    try {
      final result = await SupabaseConfig.client
          .from('group_encryption_keys')
          .select()
          .eq('group_id', groupId)
          .eq('member_id', userId)
          .order('key_version', ascending: false)
          .limit(1)
          .maybeSingle();

      if (result == null) return null;
      return GroupEncryptionKey.fromJson(result);
    } catch (e) {
      _log.error('_getGroupEncryptionKey error', tag: _tag, error: e);
      return null;
    }
  }

  /// Encrypt content with group key using AES-256-GCM
  Future<EncryptionResult<EncryptedMessage>> _encryptWithGroupKey(
    String content,
    GroupEncryptionKey groupKey,
  ) async {
    try {
      // Validate required fields before attempting decryption
      if (groupKey.senderPublicKey.isEmpty) {
        return EncryptionResult.failure('Missing sender public key for group decryption');
      }
      if (groupKey.nonce.isEmpty) {
        return EncryptionResult.failure('Missing nonce for group key decryption');
      }

      // Decrypt the group symmetric key first
      final decryptedKeyResult = await _encryption.decryptGroupKey(
        groupKey.encryptedKey,
        groupKey.senderPublicKey,
        groupKey.nonce,
      );

      if (!decryptedKeyResult.success || decryptedKeyResult.data == null) {
        return EncryptionResult.failure('Failed to decrypt group key: ${decryptedKeyResult.error}');
      }

      final groupSymmetricKey = decryptedKeyResult.data!;

      // Encrypt the message content with the symmetric group key
      final encryptResult = await _encryption.encryptWithSymmetricKey(
        content,
        groupSymmetricKey,
      );

      if (!encryptResult.success || encryptResult.data == null) {
        return EncryptionResult.failure('Group message encryption failed: ${encryptResult.error}');
      }

      // Get sender's public key for verification
      final myPublicKey = await _encryption.getPublicKey();
      final senderPublicKeyBase64 = myPublicKey != null ? base64Encode(myPublicKey) : '';

      return EncryptionResult.success(EncryptedMessage(
        ciphertext: encryptResult.data!.ciphertext,
        nonce: encryptResult.data!.nonce,
        senderPublicKey: senderPublicKeyBase64,
        encryptionVersion: 2, // Version 2 = symmetric group encryption
      ));
    } catch (e) {
      return EncryptionResult.failure('Group encryption error: $e');
    }
  }

  /// Add encryption key for a new group member
  Future<bool> addMemberEncryptionKey(String groupId, String newMemberId) async {
    try {
      // Get current group key
      final groupKey = await _getGroupEncryptionKey(groupId);
      if (groupKey == null) return false;

      // Validate group key has required fields
      if (groupKey.senderPublicKey.isEmpty || groupKey.nonce.isEmpty) {
        _log.error('Group key missing required encryption metadata', tag: _tag);
        return false;
      }

      // Decrypt group key
      final decryptedKey = await _encryption.decryptGroupKey(
        groupKey.encryptedKey,
        groupKey.senderPublicKey,
        groupKey.nonce,
      );

      if (!decryptedKey.success || decryptedKey.data == null) return false;

      // Re-encrypt for new member
      final encryptedForMemberResult = await _encryption.encryptGroupKeyForMember(
        decryptedKey.data!,
        newMemberId,
      );

      if (!encryptedForMemberResult.success || encryptedForMemberResult.data == null) {
        return false;
      }

      final encryptedMessage = encryptedForMemberResult.data!;

      await SupabaseConfig.client.from('group_encryption_keys').insert({
        'group_id': groupId,
        'member_id': newMemberId,
        'encrypted_key': encryptedMessage.ciphertext,
        'nonce': encryptedMessage.nonce,
        'sender_public_key': encryptedMessage.senderPublicKey,
        'key_version': groupKey.keyVersion,
      });

      _log.info('Added member encryption key', tag: _tag, metadata: {'groupId': groupId, 'memberId': newMemberId});
      return true;
    } catch (e) {
      _log.error('addMemberEncryptionKey error', tag: _tag, error: e);
      return false;
    }
  }

  // ============ UTILITIES ============

  /// Check if a message is encrypted
  bool _isMessageEncrypted(Message message) {
    return message.isEncrypted == true &&
        message.nonce != null &&
        message.senderPublicKey != null;
  }

  /// Get encryption status for a channel
  Future<EncryptionStatus> getChannelEncryptionStatus(String channelId) async {
    return await _encryption.getChatEncryptionStatus(channelId);
  }

  /// Verify a user's key (for safety number comparison)
  Future<String?> getVerificationCode(String otherUserId) async {
    try {
      final myPublicKey = await _encryption.getPublicKey();
      final theirBundle = await _encryption.fetchUserPublicKey(otherUserId);

      if (myPublicKey == null || theirBundle == null) return null;

      return _encryption.generateSafetyNumber(
        myPublicKey,
        theirBundle.publicKeyBytes,
      );
    } catch (e) {
      _log.error('getVerificationCode error', tag: _tag, error: e);
      return null;
    }
  }
}
