import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';

/// Mute information for a conversation
class MuteInfo {
  final DateTime? mutedUntil;
  final bool isPermanent;

  const MuteInfo({this.mutedUntil, this.isPermanent = false});

  bool get isMuted {
    if (isPermanent) return true;
    if (mutedUntil == null) return false;
    return DateTime.now().isBefore(mutedUntil!);
  }

  Map<String, dynamic> toJson() => {
    'mutedUntil': mutedUntil?.toIso8601String(),
    'isPermanent': isPermanent,
  };

  factory MuteInfo.fromJson(Map<String, dynamic> json) => MuteInfo(
    mutedUntil: json['mutedUntil'] != null 
        ? DateTime.parse(json['mutedUntil'] as String)
        : null,
    isPermanent: json['isPermanent'] as bool? ?? false,
  );
}

/// WhatsApp-style local-first chat preferences storage
/// Handles pinned, archived, and muted conversations locally with background server sync
class ChatPreferencesStore {
  static const String _pinnedKey = 'chat_pinned_v1';
  static const String _archivedKey = 'chat_archived_v1';
  static const String _mutedKey = 'chat_muted_v1';
  static const String _lastSyncKey = 'chat_prefs_last_sync';
  
  static const String _tag = 'ChatPreferences';
  static final _log = LoggingService.instance;
  
  static ChatPreferencesStore? _instance;
  static ChatPreferencesStore get instance => _instance ??= ChatPreferencesStore._();
  
  ChatPreferencesStore._();

  SharedPreferences? _prefs;
  bool _initialized = false;
  
  // Local state (primary source of truth)
  Set<String> _pinnedIds = {};
  Set<String> _archivedIds = {};
  Map<String, MuteInfo> _mutedInfo = {};
  
  final List<void Function()> _listeners = [];

  /// Initialize and load from local storage
  Future<void> init() async {
    if (_initialized) return;
    
    try {
      _prefs = await SharedPreferences.getInstance();
      await _loadFromLocal();
      _initialized = true;
      _log.info('Initialized', tag: _tag);
      
      // Background sync from server (don't await)
      _syncFromServer();
    } catch (e) {
      _log.error('Init error', tag: _tag, error: e);
    }
  }

  void addListener(void Function() callback) => _listeners.add(callback);
  void removeListener(void Function() callback) => _listeners.remove(callback);
  void _notifyListeners() {
    for (final listener in _listeners) {
      listener();
    }
  }

  /// Load preferences from local storage
  Future<void> _loadFromLocal() async {
    try {
      // Load pinned
      final pinnedJson = _prefs?.getString(_pinnedKey);
      if (pinnedJson != null) {
        final list = jsonDecode(pinnedJson) as List<dynamic>;
        _pinnedIds = list.map((e) => e as String).toSet();
      }
      
      // Load archived
      final archivedJson = _prefs?.getString(_archivedKey);
      if (archivedJson != null) {
        final list = jsonDecode(archivedJson) as List<dynamic>;
        _archivedIds = list.map((e) => e as String).toSet();
      }
      
      // Load muted
      final mutedJson = _prefs?.getString(_mutedKey);
      if (mutedJson != null) {
        final map = jsonDecode(mutedJson) as Map<String, dynamic>;
        _mutedInfo = map.map((k, v) => MapEntry(k, MuteInfo.fromJson(v as Map<String, dynamic>)));
      }
      
      _log.debug('Loaded: ${_pinnedIds.length} pinned, ${_archivedIds.length} archived, ${_mutedInfo.length} muted', tag: _tag);
    } catch (e) {
      _log.error('Load error', tag: _tag, error: e);
    }
  }

  /// Save preferences to local storage
  Future<void> _saveToLocal() async {
    try {
      await _prefs?.setString(_pinnedKey, jsonEncode(_pinnedIds.toList()));
      await _prefs?.setString(_archivedKey, jsonEncode(_archivedIds.toList()));
      await _prefs?.setString(_mutedKey, jsonEncode(
        _mutedInfo.map((k, v) => MapEntry(k, v.toJson()))
      ));
    } catch (e) {
      _log.error('Save error', tag: _tag, error: e);
    }
  }

  // ==========================================
  // PINNED CONVERSATIONS
  // ==========================================

  Set<String> get pinnedIds => Set.unmodifiable(_pinnedIds);
  
  bool isPinned(String channelId) => _pinnedIds.contains(channelId);

  /// Toggle pin status - local first, then background sync
  Future<void> togglePin(String channelId) async {
    final wasPinned = _pinnedIds.contains(channelId);
    
    // Update locally immediately
    if (wasPinned) {
      _pinnedIds.remove(channelId);
    } else {
      _pinnedIds.add(channelId);
    }
    
    await _saveToLocal();
    _notifyListeners();
    
    // Background sync to server (fire and forget)
    _syncPinToServer(channelId, !wasPinned);
  }

  Future<void> _syncPinToServer(String channelId, bool isPinned) async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;
      
      if (isPinned) {
        await SupabaseConfig.client.from('pinned_conversations').upsert({
          'user_id': userId,
          'channel_id': channelId,
        });
      } else {
        await SupabaseConfig.client
            .from('pinned_conversations')
            .delete()
            .eq('user_id', userId)
            .eq('channel_id', channelId);
      }
    } catch (e) {
      // Silently fail - local is primary, server is backup
      _log.warning('Pin sync to server failed', tag: _tag, error: e);
    }
  }

  // ==========================================
  // ARCHIVED CONVERSATIONS
  // ==========================================

  Set<String> get archivedIds => Set.unmodifiable(_archivedIds);
  
  bool isArchived(String channelId) => _archivedIds.contains(channelId);

  /// Toggle archive status - local first
  Future<void> toggleArchive(String channelId) async {
    final wasArchived = _archivedIds.contains(channelId);
    
    if (wasArchived) {
      _archivedIds.remove(channelId);
    } else {
      _archivedIds.add(channelId);
    }
    
    await _saveToLocal();
    _notifyListeners();
    
    // Background sync
    _syncArchiveToServer(channelId, !wasArchived);
  }

  Future<void> _syncArchiveToServer(String channelId, bool isArchived) async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;
      
      if (isArchived) {
        await SupabaseConfig.client.from('archived_conversations').upsert({
          'user_id': userId,
          'channel_id': channelId,
        });
      } else {
        await SupabaseConfig.client
            .from('archived_conversations')
            .delete()
            .eq('user_id', userId)
            .eq('channel_id', channelId);
      }
    } catch (e) {
      _log.warning('Archive sync to server failed', tag: _tag, error: e);
    }
  }

  // ==========================================
  // MUTED CONVERSATIONS
  // ==========================================

  Map<String, MuteInfo> get mutedInfo => Map.unmodifiable(_mutedInfo);
  
  Set<String> get mutedIds => _mutedInfo.entries
      .where((e) => e.value.isMuted)
      .map((e) => e.key)
      .toSet();
  
  bool isMuted(String channelId) {
    final info = _mutedInfo[channelId];
    return info?.isMuted ?? false;
  }

  /// Set mute status with optional duration
  Future<void> setMute(String channelId, {Duration? duration, bool permanent = false}) async {
    DateTime? mutedUntil;
    if (duration != null) {
      mutedUntil = DateTime.now().add(duration);
    }
    
    _mutedInfo[channelId] = MuteInfo(
      mutedUntil: mutedUntil,
      isPermanent: permanent,
    );
    
    await _saveToLocal();
    _notifyListeners();
    
    // Background sync
    _syncMuteToServer(channelId, mutedUntil, permanent);
  }

  /// Unmute a conversation
  Future<void> unmute(String channelId) async {
    _mutedInfo.remove(channelId);
    await _saveToLocal();
    _notifyListeners();
    
    _syncMuteToServer(channelId, null, false);
  }

  /// Toggle mute (unmute if muted, permanent mute if not)
  Future<void> toggleMute(String channelId) async {
    if (isMuted(channelId)) {
      await unmute(channelId);
    } else {
      await setMute(channelId, permanent: true);
    }
  }

  Future<void> _syncMuteToServer(String channelId, DateTime? mutedUntil, bool permanent) async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;
      
      if (mutedUntil != null || permanent) {
        await SupabaseConfig.client.from('channel_notification_settings').upsert({
          'user_id': userId,
          'channel_id': channelId,
          'muted': true,
          'muted_until': permanent ? null : mutedUntil?.toIso8601String(),
        });
      } else {
        await SupabaseConfig.client
            .from('channel_notification_settings')
            .delete()
            .eq('user_id', userId)
            .eq('channel_id', channelId);
      }
    } catch (e) {
      _log.warning('Mute sync to server failed', tag: _tag, error: e);
    }
  }

  // ==========================================
  // SERVER SYNC (for cross-device consistency)
  // ==========================================

  /// Sync preferences from server (background operation)
  Future<void> _syncFromServer() async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;
      
      // Fetch pinned from server
      final pinnedRows = await SupabaseConfig.client
          .from('pinned_conversations')
          .select('channel_id')
          .eq('user_id', userId);
      
      final serverPinned = (pinnedRows as List)
          .map((r) => r['channel_id'] as String)
          .toSet();
      
      // Fetch archived from server
      final archivedRows = await SupabaseConfig.client
          .from('archived_conversations')
          .select('channel_id')
          .eq('user_id', userId);
      
      final serverArchived = (archivedRows as List)
          .map((r) => r['channel_id'] as String)
          .toSet();
      
      // Fetch muted from server
      final mutedRows = await SupabaseConfig.client
          .from('channel_notification_settings')
          .select('channel_id, muted, muted_until')
          .eq('user_id', userId)
          .eq('muted', true);
      
      final serverMuted = <String, MuteInfo>{};
      for (final row in mutedRows) {
        final channelId = row['channel_id'] as String;
        final mutedUntil = row['muted_until'] != null 
            ? DateTime.parse(row['muted_until'] as String)
            : null;
        serverMuted[channelId] = MuteInfo(
          mutedUntil: mutedUntil,
          isPermanent: mutedUntil == null,
        );
      }
      
      // Merge: server wins for cross-device consistency
      // But keep local additions that haven't synced yet
      _pinnedIds.addAll(serverPinned);
      _archivedIds.addAll(serverArchived);
      _mutedInfo.addAll(serverMuted);
      
      await _saveToLocal();
      await _prefs?.setString(_lastSyncKey, DateTime.now().toIso8601String());
      
      _notifyListeners();
      _log.info('Synced from server', tag: _tag);
    } catch (e) {
      _log.warning('Server sync failed', tag: _tag, error: e);
    }
  }

  /// Force sync from server (manual refresh)
  Future<void> forceSyncFromServer() async {
    await _syncFromServer();
  }

  /// Clear all preferences (on logout)
  Future<void> clearAll() async {
    _pinnedIds.clear();
    _archivedIds.clear();
    _mutedInfo.clear();
    
    await _prefs?.remove(_pinnedKey);
    await _prefs?.remove(_archivedKey);
    await _prefs?.remove(_mutedKey);
    await _prefs?.remove(_lastSyncKey);
    
    _notifyListeners();
    _log.info('Cleared all preferences', tag: _tag);
  }

  /// Get preferences stats for debugging
  Map<String, dynamic> getStats() {
    return {
      'initialized': _initialized,
      'pinnedCount': _pinnedIds.length,
      'archivedCount': _archivedIds.length,
      'mutedCount': _mutedInfo.length,
      'activeMutedCount': mutedIds.length,
    };
  }
}
