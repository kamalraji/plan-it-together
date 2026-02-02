import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:thittam1hub/services/base_service.dart';

/// Service to monitor network connectivity and trigger callbacks on reconnect
class ConnectivityService extends BaseService {
  static ConnectivityService? _instance;
  static ConnectivityService get instance => _instance ??= ConnectivityService._();
  ConnectivityService._();

  @override
  String get tag => 'Connectivity';

  final Connectivity _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _subscription;
  bool _isOnline = true;
  bool _initialized = false;
  
  final List<VoidCallback> _onReconnectListeners = [];

  /// Whether the device is currently online
  bool get isOnline => _isOnline;

  /// Initialize connectivity monitoring
  Future<void> init() async {
    if (_initialized) return;
    
    try {
      // Check initial connectivity state
      final results = await _connectivity.checkConnectivity();
      _isOnline = results.any((r) => r != ConnectivityResult.none);
      
      // Listen for connectivity changes
      _subscription = _connectivity.onConnectivityChanged.listen(_handleConnectivityChange);
      
      _initialized = true;
      logInfo('Initialized', metadata: {'online': _isOnline});
    } catch (e) {
      logError('Init failed', error: e);
      // Assume online if we can't check
      _isOnline = true;
    }
  }

  void _handleConnectivityChange(List<ConnectivityResult> results) {
    final wasOffline = !_isOnline;
    _isOnline = results.any((r) => r != ConnectivityResult.none);
    
    logInfo('Connectivity changed', metadata: {'online': _isOnline, 'wasOffline': wasOffline});
    
    // Trigger background sync when coming back online
    if (wasOffline && _isOnline) {
      logInfo('Back online - triggering background sync');
      _triggerBackgroundSync();
    }
  }

  /// Add a listener that will be called when the device reconnects
  void addOnReconnectListener(VoidCallback callback) {
    _onReconnectListeners.add(callback);
  }

  /// Remove a previously added reconnect listener
  void removeOnReconnectListener(VoidCallback callback) {
    _onReconnectListeners.remove(callback);
  }

  void _triggerBackgroundSync() {
    for (final listener in List.from(_onReconnectListeners)) {
      try {
        listener();
      } catch (e) {
        logError('Reconnect listener error', error: e);
      }
    }
  }

  /// Clean up resources
  void dispose() {
    _subscription?.cancel();
    _onReconnectListeners.clear();
    _initialized = false;
  }
}
