import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/utils/result.dart';

/// Top-level background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Ensure Firebase is initialized for background isolate
  await Firebase.initializeApp();
  // Note: LoggingService not available in background isolate, use debugPrint
  debugPrint('[PushNotificationService] Background message: ${message.messageId}');
  
  // Store notification for later processing when app opens
  final prefs = await SharedPreferences.getInstance();
  final pendingNotifications = prefs.getStringList('pending_notifications') ?? [];
  pendingNotifications.add(message.data.toString());
  await prefs.setStringList('pending_notifications', pendingNotifications);
}

/// Push Notification Service - Industrial-grade FCM integration
/// Extends BaseService for standardized error handling and logging
class PushNotificationService extends BaseService {
  static PushNotificationService? _instance;
  static PushNotificationService get instance => _instance ??= PushNotificationService._();
  PushNotificationService._();

  @override
  String get tag => 'PushNotificationService';

  static const String _tokenKey = 'fcm_token';
  static const String _permissionKey = 'notification_permission';
  static const String _pendingNotificationsKey = 'pending_notifications';
  
  String? _fcmToken;
  bool _isInitialized = false;
  StreamSubscription? _tokenRefreshSubscription;
  StreamSubscription? _foregroundMessageSubscription;
  SharedPreferences? _prefs;
  FirebaseMessaging? _messaging;
  
  // Notification handlers
  Function(NotificationPayload)? onNotificationReceived;
  Function(NotificationPayload)? onNotificationTapped;
  Function(String channelId)? onNavigateToChat;

  // Getters
  String? get fcmToken => _fcmToken;
  bool get isInitialized => _isInitialized;
  FirebaseMessaging? get messaging => _messaging;

  /// Initialize push notification service
  Future<Result<bool>> initialize() {
    return execute(() async {
      if (_isInitialized) return true;

      logDebug('Initializing...');
      _prefs = await SharedPreferences.getInstance();

      // Initialize Firebase Messaging
      _messaging = FirebaseMessaging.instance;

      // Set up background message handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Check cached permission status
      final cachedPermission = _prefs?.getBool(_permissionKey);
      if (cachedPermission == false) {
        logDebug('Permission previously denied');
        // Still try to request - user might have changed settings
      }

      // Request permission
      final permissionGranted = await _requestPermission();
      if (!permissionGranted) {
        logWarning('Permission denied');
        await _prefs?.setBool(_permissionKey, false);
        return false;
      }
      await _prefs?.setBool(_permissionKey, true);

      // Get FCM token
      _fcmToken = await _messaging!.getToken();
      
      if (_fcmToken == null) {
        logWarning('Failed to get FCM token');
        return false;
      }
      
      await _prefs?.setString(_tokenKey, _fcmToken!);
      logDebug('FCM Token obtained', metadata: {'token_prefix': _fcmToken?.substring(0, 30)});

      // Register token with backend
      await _registerToken(_fcmToken!);

      // Set up message handlers
      _setupMessageHandlers();

      // Check for initial notification (app opened via notification)
      await _checkInitialNotification();

      // Process any pending notifications from background
      await _processPendingNotifications();

      // Configure foreground notification presentation (iOS)
      await _configureForegroundPresentation();

      _isInitialized = true;
      logInfo('Push notification service initialized');
      return true;
    }, operationName: 'initialize');
  }

  /// Configure how notifications appear when app is in foreground (iOS)
  Future<void> _configureForegroundPresentation() async {
    await _messaging?.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  /// Set up all message handlers
  void _setupMessageHandlers() {
    // Foreground messages
    _foregroundMessageSubscription = FirebaseMessaging.onMessage.listen(
      _handleForegroundMessage,
      onError: (error) {
        logError('Foreground message error', error: error);
      },
    );

    // When user taps notification and app opens from background
    FirebaseMessaging.onMessageOpenedApp.listen(
      _handleNotificationTap,
      onError: (error) {
        logError('Message opened app error', error: error);
      },
    );

    // Token refresh
    _tokenRefreshSubscription = _messaging!.onTokenRefresh.listen(
      _onTokenRefresh,
      onError: (error) {
        logError('Token refresh error', error: error);
      },
    );

    logDebug('Message handlers configured');
  }

  /// Check if app was opened via a notification
  Future<void> _checkInitialNotification() async {
    final initialMessage = await _messaging?.getInitialMessage();
    if (initialMessage != null) {
      logInfo('App opened from notification');
      _handleNotificationTap(initialMessage);
    }
  }

  /// Process notifications received in background
  Future<void> _processPendingNotifications() async {
    final pendingNotifications = _prefs?.getStringList(_pendingNotificationsKey) ?? [];
    if (pendingNotifications.isEmpty) return;

    logDebug('Processing pending notifications', metadata: {'count': pendingNotifications.length});
    
    // Clear pending notifications
    await _prefs?.remove(_pendingNotificationsKey);
    
    // We don't auto-process old notifications to avoid confusion
    // They're already shown as system notifications
  }

  /// Handle token refresh
  Future<void> _onTokenRefresh(String newToken) async {
    logDebug('Token refreshed');
    final oldToken = _fcmToken;
    _fcmToken = newToken;
    await _prefs?.setString(_tokenKey, newToken);
    
    // Unregister old token if exists
    if (oldToken != null && oldToken != newToken) {
      try {
        await SupabaseConfig.client
            .from('fcm_tokens')
            .delete()
            .eq('token', oldToken);
        logDebug('Old token removed');
      } catch (e) {
        logWarning('Failed to remove old token', error: e);
      }
    }
    
    await _registerToken(newToken);
  }

  /// Request notification permission
  Future<bool> _requestPermission() async {
    try {
      final settings = await _messaging!.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      logDebug('Permission status', metadata: {'status': settings.authorizationStatus.toString()});

      return settings.authorizationStatus == AuthorizationStatus.authorized ||
             settings.authorizationStatus == AuthorizationStatus.provisional;
    } catch (e) {
      logError('Permission request failed', error: e);
      return false;
    }
  }

  /// Register FCM token with backend
  Future<void> _registerToken(String token) async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) {
        logDebug('No user logged in, skipping token registration');
        return;
      }

      final deviceType = _getDeviceType();
      final deviceName = await _getDeviceName();

      await SupabaseConfig.client.from('fcm_tokens').upsert({
        'user_id': userId,
        'token': token,
        'device_type': deviceType,
        'device_name': deviceName,
        'last_used_at': DateTime.now().toIso8601String(),
      }, onConflict: 'token');

      logDbOperation('UPSERT', 'fcm_tokens', rowCount: 1);
      logDebug('Token registered', metadata: {'device': deviceName, 'type': deviceType});
    } catch (e) {
      logError('Token registration failed', error: e);
    }
  }

  String _getDeviceType() {
    if (kIsWeb) return 'web';
    if (Platform.isIOS) return 'ios';
    if (Platform.isAndroid) return 'android';
    if (Platform.isMacOS) return 'macos';
    if (Platform.isWindows) return 'windows';
    if (Platform.isLinux) return 'linux';
    return 'unknown';
  }

  Future<String> _getDeviceName() async {
    // Basic device identification
    if (kIsWeb) return 'Web Browser';
    if (Platform.isIOS) return 'iPhone/iPad';
    if (Platform.isAndroid) return 'Android Device';
    if (Platform.isMacOS) return 'macOS';
    if (Platform.isWindows) return 'Windows';
    if (Platform.isLinux) return 'Linux';
    return 'Unknown Device';
  }

  /// Handle foreground notification
  void _handleForegroundMessage(RemoteMessage message) {
    try {
      final payload = NotificationPayload.fromRemoteMessage(message);
      logInfo('Foreground notification', metadata: {'title': payload.title});
      logDebug('Notification data', metadata: message.data);
      
      onNotificationReceived?.call(payload);
      
      // Navigate to chat if it's a message notification
      if (payload.channelId != null && payload.type == NotificationType.message) {
        // Don't auto-navigate while in foreground - just show the notification
        // User can tap to navigate
      }
    } catch (e, stackTrace) {
      logError('Failed to handle foreground message', error: e, stackTrace: stackTrace);
    }
  }

  /// Handle notification tap (background/terminated)
  void _handleNotificationTap(RemoteMessage message) {
    try {
      final payload = NotificationPayload.fromRemoteMessage(message);
      logInfo('Notification tapped', metadata: {'title': payload.title});
      logDebug('Notification data', metadata: message.data);
      
      onNotificationTapped?.call(payload);
      
      // Navigate to chat/channel if applicable
      if (payload.channelId != null) {
        onNavigateToChat?.call(payload.channelId!);
      } else if (payload.actionUrl != null) {
        // Handle action URL navigation
        logDebug('Action URL navigation', metadata: {'url': payload.actionUrl});
      }
    } catch (e, stackTrace) {
      logError('Failed to handle notification tap', error: e, stackTrace: stackTrace);
    }
  }

  /// Subscribe to a topic for group notifications
  Future<Result<void>> subscribeToTopic(String topic) {
    return execute(() async {
      await _messaging?.subscribeToTopic(topic);
      logDebug('Subscribed to topic', metadata: {'topic': topic});
    }, operationName: 'subscribeToTopic');
  }

  /// Unsubscribe from a topic
  Future<Result<void>> unsubscribeFromTopic(String topic) {
    return execute(() async {
      await _messaging?.unsubscribeFromTopic(topic);
      logDebug('Unsubscribed from topic', metadata: {'topic': topic});
    }, operationName: 'unsubscribeFromTopic');
  }

  /// Get current notification settings
  Future<Result<NotificationSettings?>> getNotificationSettings() {
    return execute(() async {
      return await _messaging?.getNotificationSettings();
    }, operationName: 'getNotificationSettings');
  }

  /// Check if notifications are enabled
  Future<Result<bool>> areNotificationsEnabled() {
    return execute(() async {
      final settings = await _messaging?.getNotificationSettings();
      return settings?.authorizationStatus == AuthorizationStatus.authorized ||
             settings?.authorizationStatus == AuthorizationStatus.provisional;
    }, operationName: 'areNotificationsEnabled');
  }

  /// Delete FCM token (for logout)
  Future<Result<void>> deleteToken() {
    return execute(() async {
      await _messaging?.deleteToken();
      _fcmToken = null;
      await _prefs?.remove(_tokenKey);
      logInfo('Token deleted');
    }, operationName: 'deleteToken');
  }

  /// Unregister current device token
  Future<Result<void>> unregisterToken() {
    return execute(() async {
      if (_fcmToken == null) return;

      await SupabaseConfig.client
          .from('fcm_tokens')
          .delete()
          .eq('token', _fcmToken!);
      
      await deleteToken();
      logInfo('Token unregistered');
    }, operationName: 'unregisterToken');
  }

  /// Unregister all tokens for current user
  Future<Result<void>> unregisterAllTokens() {
    return execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;

      await SupabaseConfig.client
          .from('fcm_tokens')
          .delete()
          .eq('user_id', userId);
      
      await deleteToken();
      logInfo('All tokens unregistered');
    }, operationName: 'unregisterAllTokens');
  }

  /// Get all registered devices for current user
  Future<Result<List<RegisteredDevice>>> getRegisteredDevices() {
    return execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return <RegisteredDevice>[];

      final response = await SupabaseConfig.client
          .from('fcm_tokens')
          .select()
          .eq('user_id', userId)
          .order('last_used_at', ascending: false);

      logDbOperation('SELECT', 'fcm_tokens', rowCount: (response as List).length);
      return response.map((e) => RegisteredDevice.fromJson(e)).toList();
    }, operationName: 'getRegisteredDevices');
  }

  /// Remove a specific device
  Future<Result<void>> removeDevice(String tokenId) {
    return execute(() async {
      await SupabaseConfig.client
          .from('fcm_tokens')
          .delete()
          .eq('id', tokenId);
      
      logInfo('Device removed', metadata: {'tokenId': tokenId});
    }, operationName: 'removeDevice');
  }

  /// Update last used timestamp
  Future<Result<void>> updateLastUsed() {
    return execute(() async {
      if (_fcmToken == null) return;

      await SupabaseConfig.client
          .from('fcm_tokens')
          .update({'last_used_at': DateTime.now().toIso8601String()})
          .eq('token', _fcmToken!);
    }, operationName: 'updateLastUsed');
  }

  /// Re-register token (useful after login)
  Future<Result<void>> reRegisterToken() {
    return execute(() async {
      if (_fcmToken != null) {
        await _registerToken(_fcmToken!);
      } else if (_isInitialized) {
        // Try to get a new token
        _fcmToken = await _messaging?.getToken();
        if (_fcmToken != null) {
          await _registerToken(_fcmToken!);
        }
      }
    }, operationName: 'reRegisterToken');
  }

  /// Dispose resources
  void dispose() {
    _tokenRefreshSubscription?.cancel();
    _tokenRefreshSubscription = null;
    _foregroundMessageSubscription?.cancel();
    _foregroundMessageSubscription = null;
    _isInitialized = false;
    logDebug('Disposed');
  }
}

/// Notification payload model
class NotificationPayload {
  final String? title;
  final String? body;
  final String? channelId;
  final String? messageId;
  final String? senderId;
  final String? senderName;
  final String? senderAvatar;
  final String? actionUrl;
  final String? groupId;
  final String? groupName;
  final NotificationType type;
  final Map<String, dynamic> data;
  final DateTime receivedAt;

  const NotificationPayload({
    this.title,
    this.body,
    this.channelId,
    this.messageId,
    this.senderId,
    this.senderName,
    this.senderAvatar,
    this.actionUrl,
    this.groupId,
    this.groupName,
    this.type = NotificationType.message,
    this.data = const {},
    required this.receivedAt,
  });

  factory NotificationPayload.fromRemoteMessage(RemoteMessage message) {
    final notification = message.notification;
    final data = message.data;

    return NotificationPayload(
      title: notification?.title ?? data['title'] as String?,
      body: notification?.body ?? data['body'] as String?,
      channelId: data['channel_id'] as String?,
      messageId: data['message_id'] as String?,
      senderId: data['sender_id'] as String?,
      senderName: data['sender_name'] as String?,
      senderAvatar: data['sender_avatar'] as String?,
      actionUrl: data['action_url'] as String?,
      groupId: data['group_id'] as String?,
      groupName: data['group_name'] as String?,
      type: _parseNotificationType(data['type'] as String?),
      data: data,
      receivedAt: DateTime.now(),
    );
  }

  static NotificationType _parseNotificationType(String? type) {
    switch (type?.toLowerCase()) {
      case 'message':
        return NotificationType.message;
      case 'group_message':
        return NotificationType.groupMessage;
      case 'mention':
        return NotificationType.mention;
      case 'reaction':
        return NotificationType.reaction;
      case 'follow':
        return NotificationType.follow;
      case 'event':
        return NotificationType.event;
      case 'comment':
        return NotificationType.comment;
      case 'system':
        return NotificationType.system;
      default:
        return NotificationType.message;
    }
  }

  /// Whether this is a chat-related notification
  bool get isChatNotification =>
      type == NotificationType.message ||
      type == NotificationType.groupMessage ||
      type == NotificationType.mention ||
      type == NotificationType.reaction;

  /// Whether this notification has navigation data
  bool get hasNavigation => channelId != null || actionUrl != null;
}

/// Types of notifications
enum NotificationType {
  message,
  groupMessage,
  mention,
  reaction,
  follow,
  event,
  comment,
  system,
}

/// Registered device model
class RegisteredDevice {
  final String id;
  final String token;
  final String deviceType;
  final String? deviceName;
  final DateTime lastUsedAt;
  final DateTime createdAt;

  const RegisteredDevice({
    required this.id,
    required this.token,
    required this.deviceType,
    this.deviceName,
    required this.lastUsedAt,
    required this.createdAt,
  });

  factory RegisteredDevice.fromJson(Map<String, dynamic> json) {
    return RegisteredDevice(
      id: json['id'] as String,
      token: json['token'] as String,
      deviceType: json['device_type'] as String? ?? 'unknown',
      deviceName: json['device_name'] as String?,
      lastUsedAt: DateTime.parse(json['last_used_at'] as String),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  /// Whether this is the current device
  bool isCurrentDevice(String? currentToken) => token == currentToken;

  /// Human-readable device type label
  String get deviceTypeLabel {
    switch (deviceType) {
      case 'ios':
        return 'iPhone/iPad';
      case 'android':
        return 'Android';
      case 'web':
        return 'Web Browser';
      case 'macos':
        return 'macOS';
      case 'windows':
        return 'Windows';
      case 'linux':
        return 'Linux';
      default:
        return 'Unknown Device';
    }
  }

  /// Device icon name
  String get deviceIcon {
    switch (deviceType) {
      case 'ios':
        return 'phone_iphone';
      case 'android':
        return 'phone_android';
      case 'web':
        return 'language';
      case 'macos':
        return 'desktop_mac';
      case 'windows':
        return 'desktop_windows';
      case 'linux':
        return 'computer';
      default:
        return 'devices';
    }
  }
}
