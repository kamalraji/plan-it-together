import 'dart:async';
import 'package:flutter/widgets.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Debounced Settings Updater
/// 
/// Batches rapid settings changes into a single API call to reduce
/// network overhead and improve UI responsiveness.
/// 
/// Usage:
/// ```dart
/// final updater = DebouncedSettingsUpdater(
///   onFlush: (changes) async {
///     await profileService.batchUpdatePreferences(changes);
///   },
/// );
/// 
/// // Queue changes - they'll be batched
/// updater.enqueue('show_online_status', true);
/// updater.enqueue('allow_messages', false);
/// 
/// // After 500ms of inactivity, onFlush is called with all changes
/// ```
class DebouncedSettingsUpdater {
  static final _log = LoggingService.instance;
  static const String _tag = 'DebouncedSettingsUpdater';

  Timer? _debounceTimer;
  final Map<String, dynamic> _pendingChanges = {};
  final Duration debounceDelay;
  final Future<void> Function(Map<String, dynamic> changes) onFlush;
  final VoidCallback? onBatchStart;
  final VoidCallback? onBatchComplete;
  final void Function(Object error)? onError;

  bool _isFlushing = false;

  DebouncedSettingsUpdater({
    this.debounceDelay = const Duration(milliseconds: 500),
    required this.onFlush,
    this.onBatchStart,
    this.onBatchComplete,
    this.onError,
  });

  /// Whether there are pending changes waiting to be flushed
  bool get hasPendingChanges => _pendingChanges.isNotEmpty;

  /// Number of pending changes
  int get pendingCount => _pendingChanges.length;

  /// Whether a flush is currently in progress
  bool get isFlushing => _isFlushing;

  /// Enqueue a settings change
  /// 
  /// The change will be batched with other changes and flushed
  /// after [debounceDelay] of inactivity.
  void enqueue(String key, dynamic value) {
    _pendingChanges[key] = value;
    _log.debug('Enqueued change: $key = $value (pending: $pendingCount)', tag: _tag);
    
    _debounceTimer?.cancel();
    _debounceTimer = Timer(debounceDelay, _flush);
  }

  /// Enqueue multiple changes at once
  void enqueueAll(Map<String, dynamic> changes) {
    _pendingChanges.addAll(changes);
    _log.debug('Enqueued ${changes.length} changes (pending: $pendingCount)', tag: _tag);
    
    _debounceTimer?.cancel();
    _debounceTimer = Timer(debounceDelay, _flush);
  }

  /// Force an immediate flush of pending changes
  /// 
  /// Useful when navigating away from a settings page.
  Future<void> flushNow() async {
    _debounceTimer?.cancel();
    await _flush();
  }

  /// Cancel pending changes without flushing
  void cancel() {
    _debounceTimer?.cancel();
    final cancelledCount = _pendingChanges.length;
    _pendingChanges.clear();
    if (cancelledCount > 0) {
      _log.info('Cancelled $cancelledCount pending changes', tag: _tag);
    }
  }

  Future<void> _flush() async {
    if (_pendingChanges.isEmpty || _isFlushing) return;

    _isFlushing = true;
    final changes = Map<String, dynamic>.from(_pendingChanges);
    _pendingChanges.clear();

    _log.info('Flushing ${changes.length} batched changes', tag: _tag);
    onBatchStart?.call();

    try {
      await onFlush(changes);
      _log.info('Batch flush completed successfully', tag: _tag);
      onBatchComplete?.call();
    } catch (e) {
      _log.error('Batch flush failed', tag: _tag, error: e);
      // Re-queue failed changes for retry
      _pendingChanges.addAll(changes);
      onError?.call(e);
    } finally {
      _isFlushing = false;
    }
  }

  /// Dispose of the updater and flush any pending changes
  Future<void> dispose() async {
    _debounceTimer?.cancel();
    if (_pendingChanges.isNotEmpty) {
      _log.info('Disposing with ${_pendingChanges.length} pending changes, flushing...', tag: _tag);
      await _flush();
    }
  }

  /// Dispose without flushing pending changes
  void disposeWithoutFlush() {
    _debounceTimer?.cancel();
    _pendingChanges.clear();
  }
}

/// Mixin to add debounced settings updates to a StatefulWidget
/// 
/// Usage:
/// ```dart
/// class _MySettingsPageState extends State<MySettingsPage>
///     with DebouncedSettingsMixin {
///   
///   @override
///   Future<void> flushSettings(Map<String, dynamic> changes) async {
///     await profileService.batchUpdatePreferences(changes);
///   }
///   
///   void _onToggleChanged(String key, bool value) {
///     enqueueSettingChange(key, value);
///   }
/// }
/// ```
mixin DebouncedSettingsMixin<T extends StatefulWidget> on State<T> {
  DebouncedSettingsUpdater? _settingsUpdater;

  /// Override to handle batched settings changes
  Future<void> flushSettings(Map<String, dynamic> changes);

  /// Optional: Called when a batch starts flushing
  void onBatchStart() {}

  /// Optional: Called when a batch completes successfully
  void onBatchComplete() {}

  /// Optional: Called when a batch fails
  void onBatchError(Object error) {}

  /// The debounce delay before flushing changes
  Duration get settingsDebounceDelay => const Duration(milliseconds: 500);

  DebouncedSettingsUpdater get _updater {
    return _settingsUpdater ??= DebouncedSettingsUpdater(
      debounceDelay: settingsDebounceDelay,
      onFlush: flushSettings,
      onBatchStart: onBatchStart,
      onBatchComplete: onBatchComplete,
      onError: onBatchError,
    );
  }

  /// Enqueue a single settings change
  void enqueueSettingChange(String key, dynamic value) {
    _updater.enqueue(key, value);
  }

  /// Enqueue multiple settings changes
  void enqueueSettingChanges(Map<String, dynamic> changes) {
    _updater.enqueueAll(changes);
  }

  /// Force flush pending changes immediately
  Future<void> flushPendingSettings() async {
    await _updater.flushNow();
  }

  /// Whether there are pending changes
  bool get hasPendingSettingChanges => _updater.hasPendingChanges;

  /// Dispose the debounced updater (called automatically in dispose)
  /// Can be called manually if needed before super.dispose()
  void disposeDebouncedUpdater() {
    _settingsUpdater?.disposeWithoutFlush();
    _settingsUpdater = null;
  }

  @override
  void dispose() {
    _settingsUpdater?.dispose();
    super.dispose();
  }
}
