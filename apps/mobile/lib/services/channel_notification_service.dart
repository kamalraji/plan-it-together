import 'package:thittam1hub/models/channel_notification_settings.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/utils/result.dart';

/// Service for managing per-channel notification settings
/// 
/// Allows customization of notifications on a per-conversation basis,
/// separate from global notification preferences.
class ChannelNotificationService extends BaseService {
  ChannelNotificationService._();
  static ChannelNotificationService? _instance;
  static ChannelNotificationService get instance => _instance ??= ChannelNotificationService._();
  
  @override
  String get tag => 'ChannelNotification';
  
  // In-memory cache for quick lookups
  final Map<String, ChannelNotificationSettings> _cache = {};
  
  /// Get notification settings for a specific channel
  /// 
  /// Returns null if no custom settings exist (use global defaults)
  Future<Result<ChannelNotificationSettings?>> getSettings(String channelId) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return null;
    
    // Check cache first
    final cacheKey = '$channelId:$userId';
    if (_cache.containsKey(cacheKey)) {
      return _cache[cacheKey];
    }
    
    final result = await SupabaseConfig.client
        .from('channel_notification_settings')
        .select()
        .eq('channel_id', channelId)
        .eq('user_id', userId)
        .maybeSingle();
    
    if (result != null) {
      final settings = ChannelNotificationSettings.fromJson(result);
      _cache[cacheKey] = settings;
      logDbOperation('SELECT', 'channel_notification_settings', rowCount: 1);
      return settings;
    }
    
    return null;
  }, operationName: 'getSettings');
  
  /// Get or create settings for a channel (returns defaults if none exist)
  Future<ChannelNotificationSettings> getOrCreateSettings(String channelId) async {
    final result = await getSettings(channelId);
    if (result is Success<ChannelNotificationSettings?> && result.data != null) {
      return result.data!;
    }
    
    final userId = SupabaseConfig.auth.currentUser?.id ?? '';
    return ChannelNotificationSettings.defaults(
      channelId: channelId,
      userId: userId,
    );
  }
  
  /// Mute a channel for a specific duration
  /// 
  /// [duration] - null means mute forever
  Future<Result<ChannelNotificationSettings?>> muteChannel(
    String channelId, {
    Duration? duration,
    bool forever = false,
  }) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return null;
    
    DateTime? mutedUntil;
    if (!forever && duration != null) {
      mutedUntil = DateTime.now().add(duration);
    }
    // If forever is true, mutedUntil stays null (indicating permanent mute)
    
    final data = {
      'channel_id': channelId,
      'user_id': userId,
      'muted': true,
      'muted_until': mutedUntil?.toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    };
    
    final result = await SupabaseConfig.client
        .from('channel_notification_settings')
        .upsert(data, onConflict: 'channel_id,user_id')
        .select()
        .single();
    
    final settings = ChannelNotificationSettings.fromJson(result);
    _cache['$channelId:$userId'] = settings;
    
    logDbOperation('UPSERT', 'channel_notification_settings', rowCount: 1);
    logInfo('Channel muted', metadata: {'channelId': channelId, 'forever': forever});
    return settings;
  }, operationName: 'muteChannel');
  
  /// Unmute a channel
  Future<Result<ChannelNotificationSettings?>> unmuteChannel(String channelId) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return null;
    
    final data = {
      'channel_id': channelId,
      'user_id': userId,
      'muted': false,
      'muted_until': null,
      'updated_at': DateTime.now().toIso8601String(),
    };
    
    final result = await SupabaseConfig.client
        .from('channel_notification_settings')
        .upsert(data, onConflict: 'channel_id,user_id')
        .select()
        .single();
    
    final settings = ChannelNotificationSettings.fromJson(result);
    _cache['$channelId:$userId'] = settings;
    
    logDbOperation('UPSERT', 'channel_notification_settings', rowCount: 1);
    logInfo('Channel unmuted', metadata: {'channelId': channelId});
    return settings;
  }, operationName: 'unmuteChannel');
  
  /// Update notification settings for a channel
  Future<Result<ChannelNotificationSettings?>> updateSettings(
    String channelId, {
    bool? muted,
    DateTime? mutedUntil,
    String? customSoundName,
    bool? vibrationEnabled,
    bool? showPreviews,
    bool? mentionsOnly,
  }) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return null;
    
    final data = <String, dynamic>{
      'channel_id': channelId,
      'user_id': userId,
      'updated_at': DateTime.now().toIso8601String(),
    };
    
    if (muted != null) data['muted'] = muted;
    if (mutedUntil != null) data['muted_until'] = mutedUntil.toIso8601String();
    if (customSoundName != null) data['custom_sound_name'] = customSoundName;
    if (vibrationEnabled != null) data['vibration_enabled'] = vibrationEnabled;
    if (showPreviews != null) data['show_previews'] = showPreviews;
    if (mentionsOnly != null) data['mentions_only'] = mentionsOnly;
    
    final result = await SupabaseConfig.client
        .from('channel_notification_settings')
        .upsert(data, onConflict: 'channel_id,user_id')
        .select()
        .single();
    
    final settings = ChannelNotificationSettings.fromJson(result);
    _cache['$channelId:$userId'] = settings;
    
    logDbOperation('UPSERT', 'channel_notification_settings', rowCount: 1);
    return settings;
  }, operationName: 'updateSettings');
  
  /// Check if a channel is currently muted
  Future<bool> isChannelMuted(String channelId) async {
    final result = await getSettings(channelId);
    if (result is Success<ChannelNotificationSettings?>) {
      return result.data?.isMuted ?? false;
    }
    return false;
  }
  
  /// Get mute status for multiple channels at once (batch)
  Future<Result<Map<String, bool>>> getMuteStatuses(List<String> channelIds) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return <String, bool>{};
    
    final results = <String, bool>{};
    
    final response = await SupabaseConfig.client
        .from('channel_notification_settings')
        .select('channel_id, muted, muted_until')
        .eq('user_id', userId)
        .inFilter('channel_id', channelIds);
    
    final now = DateTime.now();
    
    for (final row in response as List) {
      final channelId = row['channel_id'] as String;
      final muted = row['muted'] as bool? ?? false;
      final mutedUntilStr = row['muted_until'] as String?;
      
      DateTime? mutedUntil;
      if (mutedUntilStr != null) {
        try { mutedUntil = DateTime.parse(mutedUntilStr); } catch (_) {}
      }
      
      // Check if mute is still active
      final isActive = muted && (mutedUntil == null || now.isBefore(mutedUntil));
      results[channelId] = isActive;
    }
    
    // Set false for channels without settings
    for (final channelId in channelIds) {
      results.putIfAbsent(channelId, () => false);
    }
    
    logDbOperation('SELECT', 'channel_notification_settings', rowCount: response.length);
    return results;
  }, operationName: 'getMuteStatuses');
  
  /// Clear cache (call after logout)
  void clearCache() {
    _cache.clear();
    logDebug('Cache cleared');
  }
  
  /// Clear settings for a specific channel (e.g., when leaving a chat)
  Future<Result<void>> deleteSettings(String channelId) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return;
    
    await SupabaseConfig.client
        .from('channel_notification_settings')
        .delete()
        .eq('channel_id', channelId)
        .eq('user_id', userId);
    
    _cache.remove('$channelId:$userId');
    logDbOperation('DELETE', 'channel_notification_settings', rowCount: 1);
  }, operationName: 'deleteSettings');
}
