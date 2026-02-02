/// Picture-in-Picture Controller
/// 
/// Global state manager for the floating PiP player that persists
/// across navigation. Implements ChangeNotifier for reactive UI updates.

import 'package:flutter/foundation.dart';
import 'package:thittam1hub/models/live_stream.dart';
import 'package:thittam1hub/models/zone_models.dart';
import 'package:thittam1hub/services/logging_service.dart';

final _log = LoggingService.instance;
const _tag = 'PipController';

/// PiP player position on screen
enum PipPosition {
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
}

/// PiP player state
enum PipState {
  hidden,
  minimized,
  expanded,
}

/// Controller for Picture-in-Picture floating player
class PipController extends ChangeNotifier {
  static PipController? _instance;
  static PipController get instance => _instance ??= PipController._();
  PipController._();

  // ==================== State ====================

  PipState _state = PipState.hidden;
  PipPosition _position = PipPosition.bottomRight;
  LiveStream? _stream;
  EventSession? _session;
  bool _isMuted = false;
  double _progress = 0.0;
  int _viewerCount = 0;

  // ==================== Getters ====================

  PipState get state => _state;
  PipPosition get position => _position;
  LiveStream? get stream => _stream;
  EventSession? get session => _session;
  bool get isMuted => _isMuted;
  double get progress => _progress;
  int get viewerCount => _viewerCount;

  bool get isActive => _state != PipState.hidden && _stream != null;
  bool get isMinimized => _state == PipState.minimized;
  bool get isExpanded => _state == PipState.expanded;

  // ==================== Actions ====================

  /// Start PiP mode with a stream
  void startPip({
    required LiveStream stream,
    required EventSession session,
  }) {
    _log.info('Starting PiP for stream: ${stream.id}', tag: _tag);
    _stream = stream;
    _session = session;
    _state = PipState.minimized;
    _isMuted = false;
    _progress = 0.0;
    notifyListeners();
  }

  /// Expand PiP to larger view
  void expand() {
    if (!isActive) return;
    _log.debug('Expanding PiP', tag: _tag);
    _state = PipState.expanded;
    notifyListeners();
  }

  /// Minimize PiP to small floating window
  void minimize() {
    if (!isActive) return;
    _log.debug('Minimizing PiP', tag: _tag);
    _state = PipState.minimized;
    notifyListeners();
  }

  /// Toggle between minimized and expanded
  void toggleSize() {
    if (_state == PipState.minimized) {
      expand();
    } else if (_state == PipState.expanded) {
      minimize();
    }
  }

  /// Close PiP and stop playback
  void close() {
    _log.info('Closing PiP', tag: _tag);
    _state = PipState.hidden;
    _stream = null;
    _session = null;
    _progress = 0.0;
    _viewerCount = 0;
    notifyListeners();
  }

  /// Move PiP to a new position
  void setPosition(PipPosition newPosition) {
    if (_position == newPosition) return;
    _log.debug('Moving PiP to: $newPosition', tag: _tag);
    _position = newPosition;
    notifyListeners();
  }

  /// Toggle mute state
  void toggleMute() {
    _isMuted = !_isMuted;
    _log.debug('Mute toggled: $_isMuted', tag: _tag);
    notifyListeners();
  }

  /// Update playback progress (0.0 - 1.0)
  void updateProgress(double value) {
    _progress = value.clamp(0.0, 1.0);
    // Don't notify for progress updates to avoid excessive rebuilds
  }

  /// Update viewer count
  void updateViewerCount(int count) {
    if (_viewerCount == count) return;
    _viewerCount = count;
    notifyListeners();
  }

  /// Update stream data (e.g., when status changes)
  void updateStream(LiveStream newStream) {
    if (_stream?.id != newStream.id) return;
    _stream = newStream;
    notifyListeners();
  }

  /// Check if a specific stream is currently in PiP
  bool isStreamInPip(String streamId) {
    return isActive && _stream?.id == streamId;
  }

  /// Switch to fullscreen mode (close PiP and open modal)
  /// Returns the stream/session pair for the caller to handle navigation
  (LiveStream, EventSession)? goFullscreen() {
    if (!isActive || _stream == null || _session == null) return null;
    
    final result = (_stream!, _session!);
    close();
    return result;
  }

  @override
  void dispose() {
    _instance = null;
    super.dispose();
  }
}
