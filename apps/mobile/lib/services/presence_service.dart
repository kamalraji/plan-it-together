import 'dart:async';
import 'package:flutter/widgets.dart';
import 'package:thittam1hub/services/chat_service.dart';

/// Service to manage user online/offline presence based on app lifecycle
class PresenceService with WidgetsBindingObserver {
  static PresenceService? _instance;
  static PresenceService get instance => _instance ??= PresenceService._();
  PresenceService._();

  bool _initialized = false;
  Timer? _heartbeatTimer;
  static const Duration _heartbeatInterval = Duration(minutes: 2);

  /// Initialize the presence service and start tracking
  void init() {
    if (_initialized) return;
    _initialized = true;
    
    WidgetsBinding.instance.addObserver(this);
    _setOnline();
    _startHeartbeat();
  }

  /// Dispose the presence service
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _heartbeatTimer?.cancel();
    _setOffline();
    _initialized = false;
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.resumed:
        _setOnline();
        _startHeartbeat();
        break;
      case AppLifecycleState.paused:
      case AppLifecycleState.inactive:
      case AppLifecycleState.detached:
      case AppLifecycleState.hidden:
        _setOffline();
        _stopHeartbeat();
        break;
    }
  }

  void _setOnline() {
    ChatService.setOnlineStatus(true);
  }

  void _setOffline() {
    ChatService.setOnlineStatus(false);
  }

  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(_heartbeatInterval, (_) {
      ChatService.updateHeartbeat();
    });
  }

  void _stopHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
  }
}
