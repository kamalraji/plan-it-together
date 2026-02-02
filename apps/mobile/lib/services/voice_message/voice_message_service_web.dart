import 'package:flutter/foundation.dart';
import 'voice_message_interface.dart';
import '../logging_service.dart';

/// Web stub implementation - voice messages not supported on web platform
/// This prevents compilation errors while gracefully degrading functionality
class VoiceMessageServiceImpl implements VoiceMessageServiceInterface {
  static const String _tag = 'VoiceMessageService';
  static final _log = LoggingService.instance;
  static VoiceMessageServiceImpl? _instance;
  static VoiceMessageServiceImpl get instance => _instance ??= VoiceMessageServiceImpl._();
  VoiceMessageServiceImpl._();

  @override
  bool get isRecording => false;

  @override
  bool get isPlaying => false;

  @override
  String? get currentPlayingUrl => null;

  @override
  double get playbackSpeed => 1.0;

  @override
  List<double> get liveWaveform => [];

  @override
  int get recordingDuration => 0;

  @override
  Future<void> initialize() async {
    _log.info('Web platform - voice not supported', tag: _tag);
  }

  @override
  Future<bool> hasPermission() async => false;

  @override
  Future<bool> startRecording() async {
    _log.debug('Recording not available on web', tag: _tag);
    return false;
  }

  @override
  Future<VoiceRecordingResult?> stopRecording() async => null;

  @override
  Future<void> cancelRecording() async {}

  @override
  Future<String?> uploadVoiceMessage(VoiceRecordingResult recording) async {
    _log.debug('Upload not available on web', tag: _tag);
    return null;
  }

  @override
  Future<bool> startPlayback(String audioUrl) async {
    _log.debug('Playback not available on web', tag: _tag);
    return false;
  }

  @override
  Future<void> pausePlayback(String audioUrl) async {}

  @override
  Future<void> resumePlayback(String audioUrl) async {}

  @override
  Future<void> togglePlayback(String audioUrl) async {}

  @override
  Future<void> stopAllPlayback() async {}

  @override
  Future<void> seekTo(String audioUrl, Duration position) async {}

  @override
  Future<void> seekToPercent(String audioUrl, double percent) async {}

  @override
  Stream<Duration>? getPositionStream(String audioUrl) => null;

  @override
  Stream<dynamic>? getPlayerStateStream(String audioUrl) => null;

  @override
  Duration? getDuration(String audioUrl) => null;

  @override
  Duration? getPosition(String audioUrl) => null;

  @override
  bool isUrlPlaying(String audioUrl) => false;

  @override
  Future<void> setPlaybackSpeed(double speed) async {}

  @override
  Future<void> togglePlaybackSpeed() async {}

  @override
  Future<void> preload(String audioUrl) async {}

  @override
  Future<void> disposePlayer(String audioUrl) async {}

  @override
  Future<void> dispose() async {
    _log.debug('Web stub disposed', tag: _tag);
  }

  final List<VoidCallback> _recordingListeners = [];
  final List<void Function(String url)> _playbackListeners = [];

  @override
  void addRecordingListener(VoidCallback listener) {
    _recordingListeners.add(listener);
  }

  @override
  void removeRecordingListener(VoidCallback listener) {
    _recordingListeners.remove(listener);
  }

  @override
  void addPlaybackListener(void Function(String url) listener) {
    _playbackListeners.add(listener);
  }

  @override
  void removePlaybackListener(void Function(String url) listener) {
    _playbackListeners.remove(listener);
  }
}

/// Factory function for conditional import
VoiceMessageServiceInterface createVoiceMessageService() {
  return VoiceMessageServiceImpl.instance;
}
