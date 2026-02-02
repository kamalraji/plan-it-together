import 'package:flutter/foundation.dart';

/// Platform-agnostic voice message service interface
/// Follows industrial best practice for cross-platform compatibility
abstract class VoiceMessageServiceInterface {
  // Getters
  bool get isRecording;
  bool get isPlaying;
  String? get currentPlayingUrl;
  double get playbackSpeed;
  List<double> get liveWaveform;
  int get recordingDuration;
  
  // Constants
  static const int maxRecordingDurationSeconds = 300;
  static const int minRecordingDurationSeconds = 1;
  static const List<double> playbackSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  
  // Initialization
  Future<void> initialize();
  
  // Permission
  Future<bool> hasPermission();
  
  // Recording
  Future<bool> startRecording();
  Future<VoiceRecordingResult?> stopRecording();
  Future<void> cancelRecording();
  
  // Upload
  Future<String?> uploadVoiceMessage(VoiceRecordingResult recording);
  
  // Playback
  Future<bool> startPlayback(String audioUrl);
  Future<void> pausePlayback(String audioUrl);
  Future<void> resumePlayback(String audioUrl);
  Future<void> togglePlayback(String audioUrl);
  Future<void> stopAllPlayback();
  
  // Seek
  Future<void> seekTo(String audioUrl, Duration position);
  Future<void> seekToPercent(String audioUrl, double percent);
  
  // Streams
  Stream<Duration>? getPositionStream(String audioUrl);
  Stream<dynamic>? getPlayerStateStream(String audioUrl);
  
  // State
  Duration? getDuration(String audioUrl);
  Duration? getPosition(String audioUrl);
  bool isUrlPlaying(String audioUrl);
  
  // Speed
  Future<void> setPlaybackSpeed(double speed);
  Future<void> togglePlaybackSpeed();
  
  // Preload
  Future<void> preload(String audioUrl);
  
  // Disposal
  Future<void> disposePlayer(String audioUrl);
  Future<void> dispose();
  
  // Listeners
  void addRecordingListener(VoidCallback listener);
  void removeRecordingListener(VoidCallback listener);
  void addPlaybackListener(void Function(String url) listener);
  void removePlaybackListener(void Function(String url) listener);
  
  // Static helpers
  static String formatSpeed(double speed) {
    if (speed == 1.0) return '1×';
    if (speed == 0.5) return '0.5×';
    if (speed == 0.75) return '0.75×';
    if (speed == 1.25) return '1.25×';
    if (speed == 1.5) return '1.5×';
    if (speed == 2.0) return '2×';
    return '${speed}×';
  }

  static String formatDuration(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }

  static String formatSeconds(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }
}

/// Result of a voice recording
class VoiceRecordingResult {
  final String localPath;
  final int durationSeconds;
  final List<double> waveformData;

  const VoiceRecordingResult({
    required this.localPath,
    required this.durationSeconds,
    required this.waveformData,
  });

  Map<String, dynamic> toJson() => {
    'localPath': localPath,
    'durationSeconds': durationSeconds,
    'waveformData': waveformData,
  };

  /// Create message attachment from recording
  Map<String, dynamic> toAttachment(String uploadedUrl) => {
    'type': 'voice',
    'url': uploadedUrl,
    'duration': durationSeconds,
    'waveform': waveformData,
  };
}
