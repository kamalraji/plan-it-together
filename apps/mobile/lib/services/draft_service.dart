import 'dart:async';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';

/// Message Draft Service
/// Auto-saves message drafts per conversation with local and cloud sync
class DraftService extends BaseService {
  static DraftService? _instance;
  static DraftService get instance => _instance ??= DraftService._();
  DraftService._();

  @override
  String get tag => 'DraftService';

  static const String _localDraftsKey = 'message_drafts';
  static const Duration _autoSaveDelay = Duration(seconds: 2);
  static const Duration _syncInterval = Duration(minutes: 5);

  final Map<String, MessageDraft> _drafts = {};
  final Map<String, Timer> _autoSaveTimers = {};
  Timer? _syncTimer;
  bool _isInitialized = false;

  // Listeners
  final List<void Function(String channelId)> _draftChangedListeners = [];

  /// Initialize draft service
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      await _loadLocalDrafts();
      await _syncFromCloud();
      
      // Start periodic sync
      _syncTimer = Timer.periodic(_syncInterval, (_) => syncToCloud());
      
      _isInitialized = true;
      logInfo('Initialized with ${_drafts.length} drafts');
    } catch (e) {
      logError('Initialization failed', error: e);
    }
  }

  /// Add draft changed listener
  void addDraftChangedListener(void Function(String channelId) listener) {
    _draftChangedListeners.add(listener);
  }

  /// Remove draft changed listener
  void removeDraftChangedListener(void Function(String channelId) listener) {
    _draftChangedListeners.remove(listener);
  }

  void _notifyDraftChanged(String channelId) {
    for (final listener in _draftChangedListeners) {
      listener(channelId);
    }
  }

  /// Load drafts from local storage
  Future<void> _loadLocalDrafts() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final draftsJson = prefs.getString(_localDraftsKey);
      
      if (draftsJson != null) {
        final draftsMap = jsonDecode(draftsJson) as Map<String, dynamic>;
        for (final entry in draftsMap.entries) {
          _drafts[entry.key] = MessageDraft.fromJson(entry.value);
        }
      }
      
      logDebug('Loaded ${_drafts.length} local drafts');
    } catch (e) {
      logError('Failed to load local drafts', error: e);
    }
  }

  /// Save drafts to local storage
  Future<void> _saveLocalDrafts() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final draftsMap = _drafts.map((k, v) => MapEntry(k, v.toJson()));
      await prefs.setString(_localDraftsKey, jsonEncode(draftsMap));
    } catch (e) {
      logError('Failed to save local drafts', error: e);
    }
  }

  /// Sync drafts from cloud
  Future<void> _syncFromCloud() async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;

      final response = await SupabaseConfig.client
          .from('message_drafts')
          .select()
          .eq('user_id', userId);

      for (final row in response as List) {
        final channelId = row['channel_id'] as String;
        final cloudDraft = MessageDraft.fromCloudJson(row);
        
        // Only update if cloud version is newer
        final localDraft = _drafts[channelId];
        if (localDraft == null || 
            cloudDraft.updatedAt.isAfter(localDraft.updatedAt)) {
          _drafts[channelId] = cloudDraft;
        }
      }

      logDbOperation('SELECT', 'message_drafts', rowCount: response.length);
    } catch (e) {
      logError('Cloud sync failed', error: e);
    }
  }

  /// Sync drafts to cloud
  Future<void> syncToCloud() async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;

      for (final entry in _drafts.entries) {
        if (entry.value.content.isEmpty && 
            (entry.value.attachments?.isEmpty ?? true)) {
          // Delete empty drafts
          await SupabaseConfig.client
              .from('message_drafts')
              .delete()
              .eq('channel_id', entry.key)
              .eq('user_id', userId);
        } else {
          // Upsert non-empty drafts
          await SupabaseConfig.client.from('message_drafts').upsert({
            'channel_id': entry.key,
            'user_id': userId,
            'content': entry.value.content,
            'attachments': entry.value.attachments,
            'reply_to_message_id': entry.value.replyToMessageId,
            'updated_at': entry.value.updatedAt.toIso8601String(),
          }, onConflict: 'channel_id,user_id');
        }
      }

      logDebug('Synced ${_drafts.length} drafts to cloud');
    } catch (e) {
      logError('Cloud sync failed', error: e);
    }
  }

  /// Get draft for a channel
  MessageDraft? getDraft(String channelId) {
    return _drafts[channelId];
  }

  /// Check if channel has a non-empty draft
  bool hasDraft(String channelId) {
    final draft = _drafts[channelId];
    if (draft == null) return false;
    return draft.content.isNotEmpty || (draft.attachments?.isNotEmpty ?? false);
  }

  /// Get all channels with drafts
  List<String> getChannelsWithDrafts() {
    return _drafts.entries
        .where((e) => e.value.content.isNotEmpty || 
                      (e.value.attachments?.isNotEmpty ?? false))
        .map((e) => e.key)
        .toList();
  }

  /// Update draft content with auto-save
  void updateDraft(
    String channelId, 
    String content, {
    List<Map<String, dynamic>>? attachments,
    String? replyToMessageId,
  }) {
    // Cancel existing timer
    _autoSaveTimers[channelId]?.cancel();

    // Update in-memory draft
    _drafts[channelId] = MessageDraft(
      channelId: channelId,
      content: content,
      attachments: attachments,
      replyToMessageId: replyToMessageId,
      updatedAt: DateTime.now(),
    );

    // Schedule auto-save
    _autoSaveTimers[channelId] = Timer(_autoSaveDelay, () {
      _saveDraft(channelId);
    });
  }

  Future<void> _saveDraft(String channelId) async {
    await _saveLocalDrafts();
    _notifyDraftChanged(channelId);
    
    // Sync single draft to cloud
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return;

    final draft = _drafts[channelId];
    if (draft == null) return;

    try {
      if (draft.content.isEmpty && (draft.attachments?.isEmpty ?? true)) {
        await SupabaseConfig.client
            .from('message_drafts')
            .delete()
            .eq('channel_id', channelId)
            .eq('user_id', userId);
      } else {
        await SupabaseConfig.client.from('message_drafts').upsert({
          'channel_id': channelId,
          'user_id': userId,
          'content': draft.content,
          'attachments': draft.attachments,
          'reply_to_message_id': draft.replyToMessageId,
          'updated_at': draft.updatedAt.toIso8601String(),
        }, onConflict: 'channel_id,user_id');
      }
    } catch (e) {
      logError('Failed to save draft to cloud', error: e);
    }
  }

  /// Clear draft for a channel (called after sending)
  Future<void> clearDraft(String channelId) async {
    _autoSaveTimers[channelId]?.cancel();
    _autoSaveTimers.remove(channelId);
    _drafts.remove(channelId);
    
    await _saveLocalDrafts();
    _notifyDraftChanged(channelId);

    // Remove from cloud
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return;

    try {
      await SupabaseConfig.client
          .from('message_drafts')
          .delete()
          .eq('channel_id', channelId)
          .eq('user_id', userId);
    } catch (e) {
      logError('Failed to clear cloud draft', error: e);
    }
  }

  /// Clear all drafts
  Future<void> clearAllDrafts() async {
    for (final timer in _autoSaveTimers.values) {
      timer.cancel();
    }
    _autoSaveTimers.clear();
    _drafts.clear();

    await _saveLocalDrafts();

    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return;

    try {
      await SupabaseConfig.client
          .from('message_drafts')
          .delete()
          .eq('user_id', userId);
    } catch (e) {
      logError('Failed to clear all cloud drafts', error: e);
    }
  }

  /// Dispose resources
  void dispose() {
    _syncTimer?.cancel();
    for (final timer in _autoSaveTimers.values) {
      timer.cancel();
    }
    _autoSaveTimers.clear();
    _draftChangedListeners.clear();
    _isInitialized = false;
  }
}

/// Message draft model
class MessageDraft {
  final String channelId;
  final String content;
  final List<Map<String, dynamic>>? attachments;
  final String? replyToMessageId;
  final DateTime updatedAt;

  const MessageDraft({
    required this.channelId,
    required this.content,
    this.attachments,
    this.replyToMessageId,
    required this.updatedAt,
  });

  factory MessageDraft.fromJson(Map<String, dynamic> json) {
    return MessageDraft(
      channelId: json['channelId'] as String,
      content: json['content'] as String? ?? '',
      attachments: (json['attachments'] as List?)
          ?.map((e) => Map<String, dynamic>.from(e))
          .toList(),
      replyToMessageId: json['replyToMessageId'] as String?,
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  factory MessageDraft.fromCloudJson(Map<String, dynamic> json) {
    return MessageDraft(
      channelId: json['channel_id'] as String,
      content: json['content'] as String? ?? '',
      attachments: (json['attachments'] as List?)
          ?.map((e) => Map<String, dynamic>.from(e))
          .toList(),
      replyToMessageId: json['reply_to_message_id'] as String?,
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
    'channelId': channelId,
    'content': content,
    'attachments': attachments,
    'replyToMessageId': replyToMessageId,
    'updatedAt': updatedAt.toIso8601String(),
  };

  MessageDraft copyWith({
    String? channelId,
    String? content,
    List<Map<String, dynamic>>? attachments,
    String? replyToMessageId,
    DateTime? updatedAt,
  }) {
    return MessageDraft(
      channelId: channelId ?? this.channelId,
      content: content ?? this.content,
      attachments: attachments ?? this.attachments,
      replyToMessageId: replyToMessageId ?? this.replyToMessageId,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
