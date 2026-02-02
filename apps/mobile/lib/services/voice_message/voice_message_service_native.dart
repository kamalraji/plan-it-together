import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:just_audio/just_audio.dart';
import 'package:record/record.dart';
import 'voice_message_interface.dart';

/// Native (iOS/Android) implementation of voice message service
/// Uses just_audio and record packages for full functionality
class VoiceMessageServiceImpl implements VoiceMessageServiceInterface {
  static VoiceMessageServiceImpl? _instance;
  static VoiceMessageServiceImpl get instance => _instance ??= VoiceMessageServiceImpl._();
  VoiceMessageServiceImpl._();

  static final _log = LoggingService.instance;
  static const String _tag = 'VoiceMessage';

  // Recording
  AudioRecorder? _recorder;
  bool _isRecording = false;
  String? _currentRecordingPath;
  DateTime? _recordingStartTime;
  Timer? _durationTimer;
  Timer? _amplitudeTimer;
  final List<double> _liveWaveform = [];
  
  // Playback
  final Map<String, AudioPlayer> _players = {};
  String? _currentPlayingUrl;
  double _playbackSpeed = 1.0;
  
  // Listeners
  final List<VoidCallback> _recordingListeners = [];
  final List<void Function(String url)> _playbackListeners = [];
  
  // Constants
  static const int amplitudeSampleRateMs = 100;
  static const String storageBucket = 'voice-messages';

  @override
  bool get isRecording => _isRecording;
  
  @override
  bool get isPlaying => _currentPlayingUrl != null;
  
  @override
  String? get currentPlayingUrl => _currentPlayingUrl;
  
  @override
  double get playbackSpeed => _playbackSpeed;
  
  @override
  List<double> get liveWaveform => List.unmodifiable(_liveWaveform);
  
  @override
  int get recordingDuration {
    if (_recordingStartTime == null) return 0;
    return DateTime.now().difference(_recordingStartTime!).inSeconds;
  }

  @override
  Future<void> initialize() async {
    _recorder = AudioRecorder();
    _log.info('Native voice message service initialized', tag: _tag);
  }

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

  void _notifyRecordingListeners() {
    for (final listener in _recordingListeners) {
      listener();
    }
  }

  void _notifyPlaybackListeners(String url) {
    for (final listener in _playbackListeners) {
      listener(url);
    }
  }

  @override
  Future<bool> hasPermission() async {
    _recorder ??= AudioRecorder();
    return await _recorder!.hasPermission();
  }

  @override
  Future<bool> startRecording() async {
    if (_isRecording) return false;

    try {
      _recorder ??= AudioRecorder();

      if (!await _recorder!.hasPermission()) {
        _log.warning('No recording permission', tag: _tag);
        return false;
      }

      await stopAllPlayback();

      final tempDir = await getTemporaryDirectory();
      final fileName = 'voice_${const Uuid().v4()}.m4a';
      _currentRecordingPath = '${tempDir.path}/$fileName';

      final config = RecordConfig(
        encoder: AudioEncoder.aacLc,
        bitRate: 128000,
        sampleRate: 44100,
        numChannels: 1,
      );

      await _recorder!.start(config, path: _currentRecordingPath!);

      _isRecording = true;
      _recordingStartTime = DateTime.now();
      _liveWaveform.clear();

      _amplitudeTimer = Timer.periodic(
        const Duration(milliseconds: amplitudeSampleRateMs),
        (_) => _sampleAmplitude(),
      );

      _durationTimer = Timer(
        Duration(seconds: VoiceMessageServiceInterface.maxRecordingDurationSeconds),
        () => stopRecording(),
      );

      _notifyRecordingListeners();
      _log.info('Recording started', tag: _tag);
      return true;
    } catch (e) {
      _log.error('Failed to start recording', tag: _tag, error: e);
      _isRecording = false;
      return false;
    }
  }

  Future<void> _sampleAmplitude() async {
    if (!_isRecording || _recorder == null) return;

    try {
      final amplitude = await _recorder!.getAmplitude();
      final normalized = ((amplitude.current + 60) / 60).clamp(0.0, 1.0);
      _liveWaveform.add(normalized);
      
      if (_liveWaveform.length > 100) {
        _liveWaveform.removeAt(0);
      }
      
      _notifyRecordingListeners();
    } catch (e) {
      _liveWaveform.add(0.3);
    }
  }

  @override
  Future<VoiceRecordingResult?> stopRecording() async {
    if (!_isRecording || _recorder == null) return null;

    try {
      _amplitudeTimer?.cancel();
      _amplitudeTimer = null;
      _durationTimer?.cancel();
      _durationTimer = null;

      final path = await _recorder!.stop();
      final duration = recordingDuration;
      final waveform = _normalizeWaveform(List<double>.from(_liveWaveform));

      _isRecording = false;
      _recordingStartTime = null;
      _liveWaveform.clear();

      _notifyRecordingListeners();

      if (duration < VoiceMessageServiceInterface.minRecordingDurationSeconds) {
        _log.debug('Recording too short, discarding', tag: _tag, metadata: {'duration': duration});
        if (path != null) {
          try {
            await File(path).delete();
          } catch (_) {}
        }
        return null;
      }

      _log.info('Recording stopped', tag: _tag, metadata: {'duration': duration});
      
      return VoiceRecordingResult(
        localPath: path ?? _currentRecordingPath ?? '',
        durationSeconds: duration,
        waveformData: waveform,
      );
    } catch (e) {
      _log.error('Failed to stop recording', tag: _tag, error: e);
      _isRecording = false;
      _liveWaveform.clear();
      _notifyRecordingListeners();
      return null;
    } finally {
      _currentRecordingPath = null;
    }
  }

  List<double> _normalizeWaveform(List<double> raw, {int targetSamples = 50}) {
    if (raw.isEmpty) return List.filled(targetSamples, 0.3);
    if (raw.length == targetSamples) return raw;
    
    final result = <double>[];
    final ratio = raw.length / targetSamples;
    
    for (var i = 0; i < targetSamples; i++) {
      final start = (i * ratio).floor();
      final end = ((i + 1) * ratio).ceil().clamp(0, raw.length);
      
      if (start >= end) {
        result.add(raw.last);
      } else {
        var sum = 0.0;
        for (var j = start; j < end; j++) {
          sum += raw[j];
        }
        result.add((sum / (end - start)).clamp(0.1, 1.0));
      }
    }
    
    return result;
  }

  @override
  Future<void> cancelRecording() async {
    if (!_isRecording) return;

    _amplitudeTimer?.cancel();
    _amplitudeTimer = null;
    _durationTimer?.cancel();
    _durationTimer = null;

    try {
      await _recorder?.stop();
    } catch (_) {}

    _isRecording = false;
    _recordingStartTime = null;
    _liveWaveform.clear();

    if (_currentRecordingPath != null) {
      try {
        final file = File(_currentRecordingPath!);
        if (await file.exists()) {
          await file.delete();
        }
      } catch (_) {}
    }
    _currentRecordingPath = null;

    _notifyRecordingListeners();
    _log.debug('Recording cancelled', tag: _tag);
  }

  @override
  Future<String?> uploadVoiceMessage(VoiceRecordingResult recording) async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return null;

      final file = File(recording.localPath);
      if (!await file.exists()) {
        _log.warning('Recording file not found', tag: _tag);
        return null;
      }

      final bytes = await file.readAsBytes();
      final fileName = 'voice_${DateTime.now().millisecondsSinceEpoch}.m4a';
      final storagePath = '$userId/$fileName';

      await SupabaseConfig.client.storage
          .from(storageBucket)
          .uploadBinary(storagePath, bytes, fileOptions: FileOptions(
            contentType: 'audio/mp4',
          ));

      final publicUrl = SupabaseConfig.client.storage
          .from(storageBucket)
          .getPublicUrl(storagePath);

      try {
        await file.delete();
      } catch (_) {}

      _log.info('Voice message uploaded', tag: _tag);
      return publicUrl;
    } catch (e) {
      _log.error('Upload failed', tag: _tag, error: e);
      return null;
    }
  }

  AudioPlayer _getPlayer(String audioUrl) {
    if (!_players.containsKey(audioUrl)) {
      final player = AudioPlayer();
      _players[audioUrl] = player;
      
      player.playerStateStream.listen((state) {
        if (state.processingState == ProcessingState.completed) {
          _onPlaybackComplete(audioUrl);
        }
      });
    }
    return _players[audioUrl]!;
  }

  void _onPlaybackComplete(String audioUrl) {
    if (_currentPlayingUrl == audioUrl) {
      _currentPlayingUrl = null;
      _notifyPlaybackListeners(audioUrl);
    }
  }

  @override
  Future<bool> startPlayback(String audioUrl) async {
    try {
      if (_currentPlayingUrl != null && _currentPlayingUrl != audioUrl) {
        await pausePlayback(_currentPlayingUrl!);
      }

      await cancelRecording();

      final player = _getPlayer(audioUrl);
      
      if (player.audioSource == null) {
        await player.setUrl(audioUrl);
      }
      
      await player.setSpeed(_playbackSpeed);
      await player.play();
      
      _currentPlayingUrl = audioUrl;
      _notifyPlaybackListeners(audioUrl);
      
      _log.debug('Playback started', tag: _tag);
      return true;
    } catch (e) {
      _log.error('Playback failed', tag: _tag, error: e);
      return false;
    }
  }

  @override
  Future<void> pausePlayback(String audioUrl) async {
    try {
      final player = _players[audioUrl];
      if (player != null) {
        await player.pause();
        if (_currentPlayingUrl == audioUrl) {
          _currentPlayingUrl = null;
        }
        _notifyPlaybackListeners(audioUrl);
      }
    } catch (e) {
      _log.warning('Pause failed', tag: _tag, error: e);
    }
  }

  @override
  Future<void> resumePlayback(String audioUrl) async {
    try {
      final player = _players[audioUrl];
      if (player != null) {
        await player.play();
        _currentPlayingUrl = audioUrl;
        _notifyPlaybackListeners(audioUrl);
      }
    } catch (e) {
      _log.warning('Resume failed', tag: _tag, error: e);
    }
  }

  @override
  Future<void> togglePlayback(String audioUrl) async {
    final player = _players[audioUrl];
    if (player != null && player.playing) {
      await pausePlayback(audioUrl);
    } else {
      await startPlayback(audioUrl);
    }
  }

  @override
  Future<void> stopAllPlayback() async {
    for (final entry in _players.entries) {
      try {
        await entry.value.stop();
        await entry.value.seek(Duration.zero);
      } catch (_) {}
    }
    _currentPlayingUrl = null;
  }

  @override
  Future<void> seekTo(String audioUrl, Duration position) async {
    try {
      final player = _players[audioUrl];
      if (player != null) {
        await player.seek(position);
        _notifyPlaybackListeners(audioUrl);
      }
    } catch (e) {
      _log.warning('Seek failed', tag: _tag, error: e);
    }
  }

  @override
  Future<void> seekToPercent(String audioUrl, double percent) async {
    final player = _players[audioUrl];
    if (player != null && player.duration != null) {
      final position = Duration(
        milliseconds: (player.duration!.inMilliseconds * percent).round(),
      );
      await seekTo(audioUrl, position);
    }
  }

  @override
  Stream<Duration>? getPositionStream(String audioUrl) {
    return _players[audioUrl]?.positionStream;
  }

  @override
  Stream<PlayerState>? getPlayerStateStream(String audioUrl) {
    return _players[audioUrl]?.playerStateStream;
  }

  @override
  Duration? getDuration(String audioUrl) {
    return _players[audioUrl]?.duration;
  }

  @override
  Duration? getPosition(String audioUrl) {
    return _players[audioUrl]?.position;
  }

  @override
  bool isUrlPlaying(String audioUrl) {
    return _currentPlayingUrl == audioUrl;
  }

  @override
  void setPlaybackSpeed(double speed) {
    _playbackSpeed = speed.clamp(0.5, 2.0);
    for (final player in _players.values) {
      try {
        player.setSpeed(_playbackSpeed);
      } catch (_) {}
    }
  }

  @override
  void togglePlaybackSpeed() {
    if (_playbackSpeed == 1.0) {
      setPlaybackSpeed(1.5);
    } else if (_playbackSpeed == 1.5) {
      setPlaybackSpeed(2.0);
    } else {
      setPlaybackSpeed(1.0);
    }
  }

  @override
  Future<void> preload(String audioUrl) async {
    try {
      final player = _getPlayer(audioUrl);
      if (player.audioSource == null) {
        await player.setUrl(audioUrl);
      }
    } catch (e) {
      _log.debug('Preload failed', tag: _tag, error: e);
    }
  }

  @override
  Future<void> disposePlayer(String audioUrl) async {
    final player = _players.remove(audioUrl);
    if (player != null) {
      try {
        await player.dispose();
      } catch (_) {}
    }
    if (_currentPlayingUrl == audioUrl) {
      _currentPlayingUrl = null;
    }
  }

  @override
  Future<void> dispose() async {
    _amplitudeTimer?.cancel();
    _durationTimer?.cancel();
    
    try {
      await _recorder?.dispose();
    } catch (_) {}
    _recorder = null;

    for (final player in _players.values) {
      try {
        await player.dispose();
      } catch (_) {}
    }
    _players.clear();

    _recordingListeners.clear();
    _playbackListeners.clear();
    _currentPlayingUrl = null;
    _isRecording = false;
    _liveWaveform.clear();
  }
}

/// Factory function for creating the voice message service
VoiceMessageServiceInterface createVoiceMessageService() {
  return VoiceMessageServiceImpl.instance;
}
