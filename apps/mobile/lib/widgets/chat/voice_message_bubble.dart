import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/services/voice_message_service.dart';
import 'package:thittam1hub/theme.dart';

/// Voice message bubble with waveform visualization and playback controls
class VoiceMessageBubble extends StatefulWidget {
  final String audioUrl;
  final int durationSeconds;
  final List<double>? waveformData;
  final bool isOwnMessage;
  final String? transcription;

  const VoiceMessageBubble({
    super.key,
    required this.audioUrl,
    required this.durationSeconds,
    this.waveformData,
    this.isOwnMessage = false,
    this.transcription,
  });

  @override
  State<VoiceMessageBubble> createState() => _VoiceMessageBubbleState();
}

class _VoiceMessageBubbleState extends State<VoiceMessageBubble>
    with SingleTickerProviderStateMixin {
  final _voiceService = VoiceMessageService.instance;
  late AnimationController _pulseController;
  
  bool _isPlaying = false;
  bool _isLoading = false;
  Duration _position = Duration.zero;
  Duration? _duration;
  bool _showSpeedControl = false;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    
    // Preload audio
    _voiceService.preload(widget.audioUrl);
    
    // Listen to playback state
    _voiceService.addPlaybackListener(_onPlaybackStateChanged);
    
    // Check if already playing
    _isPlaying = _voiceService.isUrlPlaying(widget.audioUrl);
    if (_isPlaying) {
      _pulseController.repeat(reverse: true);
      _subscribeToPosition();
    }
  }

  @override
  void dispose() {
    _voiceService.removePlaybackListener(_onPlaybackStateChanged);
    _pulseController.dispose();
    super.dispose();
  }

  void _onPlaybackStateChanged(String url) {
    if (url == widget.audioUrl && mounted) {
      setState(() {
        _isPlaying = _voiceService.isUrlPlaying(widget.audioUrl);
        if (_isPlaying) {
          _pulseController.repeat(reverse: true);
          _subscribeToPosition();
        } else {
          _pulseController.stop();
        }
      });
    }
  }

  void _subscribeToPosition() {
    _voiceService.getPositionStream(widget.audioUrl)?.listen((pos) {
      if (mounted) {
        setState(() {
          _position = pos;
          _duration = _voiceService.getDuration(widget.audioUrl);
        });
      }
    });
  }

  Future<void> _togglePlayback() async {
    HapticFeedback.lightImpact();
    
    if (_isLoading) return;
    
    setState(() => _isLoading = true);
    
    try {
      await _voiceService.togglePlayback(widget.audioUrl);
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _seekToPosition(double percent) {
    _voiceService.seekToPercent(widget.audioUrl, percent.clamp(0.0, 1.0));
  }

  void _toggleSpeedControl() {
    HapticFeedback.selectionClick();
    setState(() => _showSpeedControl = !_showSpeedControl);
  }

  void _setSpeed(double speed) {
    HapticFeedback.selectionClick();
    _voiceService.setPlaybackSpeed(speed);
    setState(() => _showSpeedControl = false);
  }

  double get _progress {
    final totalMs = _duration?.inMilliseconds ?? 
        (widget.durationSeconds * 1000);
    if (totalMs == 0) return 0.0;
    return (_position.inMilliseconds / totalMs).clamp(0.0, 1.0);
  }

  int get _currentSeconds {
    return _position.inSeconds;
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final bgColor = widget.isOwnMessage 
        ? cs.primary.withOpacity(0.15)
        : cs.surfaceContainerHighest;
    final accentColor = widget.isOwnMessage ? cs.primary : cs.secondary;

    return Container(
      padding: const EdgeInsets.all(12),
      constraints: const BoxConstraints(maxWidth: 300),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Play/Pause button
              _PlayButton(
                isPlaying: _isPlaying,
                isLoading: _isLoading,
                pulseController: _pulseController,
                accentColor: accentColor,
                onTap: _togglePlayback,
              ),
              const SizedBox(width: 12),

              // Waveform with seek capability
              Expanded(
                child: GestureDetector(
                  onTapDown: (details) {
                    final box = context.findRenderObject() as RenderBox;
                    final localX = details.localPosition.dx;
                    // Subtract play button width + spacing
                    final waveformWidth = box.size.width - 56 - 12 - 12;
                    if (waveformWidth > 0) {
                      final percent = (localX) / waveformWidth;
                      _seekToPosition(percent);
                    }
                  },
                  onHorizontalDragUpdate: (details) {
                    final box = context.findRenderObject() as RenderBox;
                    final localX = details.localPosition.dx - 56 - 12;
                    final waveformWidth = box.size.width - 56 - 12 - 12;
                    if (waveformWidth > 0) {
                      final percent = localX / waveformWidth;
                      _seekToPosition(percent);
                    }
                  },
                  child: _WaveformVisualizer(
                    waveformData: widget.waveformData ?? _generateDefaultWaveform(),
                    progress: _progress,
                    accentColor: accentColor,
                    inactiveColor: cs.onSurface.withOpacity(0.2),
                  ),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 8),
          
          // Duration and speed control
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Current position / Duration
              Text(
                '${VoiceMessageService.formatSeconds(_currentSeconds)} / ${VoiceMessageService.formatSeconds(widget.durationSeconds)}',
                style: context.textStyles.labelSmall?.copyWith(
                  color: cs.onSurface.withOpacity(0.6),
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
              
              // Speed control
              GestureDetector(
                onTap: _toggleSpeedControl,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: cs.onSurface.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    VoiceMessageService.formatSpeed(_voiceService.playbackSpeed),
                    style: context.textStyles.labelSmall?.copyWith(
                      color: cs.onSurface.withOpacity(0.7),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
          
          // Speed selector (expanded)
          if (_showSpeedControl) ...[
            const SizedBox(height: 8),
            _SpeedSelector(
              currentSpeed: _voiceService.playbackSpeed,
              onSpeedSelected: _setSpeed,
            ),
          ],
          
          // Transcription (if available)
          if (widget.transcription != null && widget.transcription!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                widget.transcription!,
                style: context.textStyles.bodySmall?.copyWith(
                  color: cs.onSurface.withOpacity(0.7),
                  fontStyle: FontStyle.italic,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ),
        ],
      ),
    );
  }

  List<double> _generateDefaultWaveform() {
    return List.generate(30, (i) => 0.2 + (i % 5) * 0.15 + (i % 3) * 0.1);
  }
}

class _PlayButton extends StatelessWidget {
  final bool isPlaying;
  final bool isLoading;
  final AnimationController pulseController;
  final Color accentColor;
  final VoidCallback onTap;

  const _PlayButton({
    required this.isPlaying,
    required this.isLoading,
    required this.pulseController,
    required this.accentColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return GestureDetector(
      onTap: onTap,
      child: AnimatedBuilder(
        animation: pulseController,
        builder: (context, child) {
          return Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: accentColor,
              shape: BoxShape.circle,
              boxShadow: isPlaying
                  ? [
                      BoxShadow(
                        color: accentColor.withOpacity(0.3 + pulseController.value * 0.2),
                        blurRadius: 8 + pulseController.value * 4,
                        spreadRadius: pulseController.value * 2,
                      ),
                    ]
                  : null,
            ),
            child: isLoading
                ? Padding(
                    padding: const EdgeInsets.all(12),
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: cs.onPrimary,
                    ),
                  )
                : Icon(
                    isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                    color: cs.onPrimary,
                    size: 24,
                  ),
          );
        },
      ),
    );
  }
}

class _WaveformVisualizer extends StatelessWidget {
  final List<double> waveformData;
  final double progress;
  final Color accentColor;
  final Color inactiveColor;

  const _WaveformVisualizer({
    required this.waveformData,
    required this.progress,
    required this.accentColor,
    required this.inactiveColor,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 36,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: List.generate(waveformData.length, (index) {
          final isActive = index / waveformData.length <= progress;
          final height = 8 + waveformData[index] * 28;
          
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 0.5),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                height: height,
                decoration: BoxDecoration(
                  color: isActive ? accentColor : inactiveColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _SpeedSelector extends StatelessWidget {
  final double currentSpeed;
  final void Function(double) onSpeedSelected;

  const _SpeedSelector({
    required this.currentSpeed,
    required this.onSpeedSelected,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: VoiceMessageService.playbackSpeeds.map((speed) {
          final isSelected = speed == currentSpeed;
          return GestureDetector(
            onTap: () => onSpeedSelected(speed),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: isSelected ? cs.primary : Colors.transparent,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                VoiceMessageService.formatSpeed(speed),
                style: context.textStyles.labelSmall?.copyWith(
                  color: isSelected ? cs.onPrimary : cs.onSurface.withOpacity(0.7),
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

/// Voice recorder widget for the composer
class VoiceRecorder extends StatefulWidget {
  final Function(String audioUrl, int duration, List<double> waveform) onRecordComplete;
  final VoidCallback onCancel;

  const VoiceRecorder({
    super.key,
    required this.onRecordComplete,
    required this.onCancel,
  });

  @override
  State<VoiceRecorder> createState() => _VoiceRecorderState();
}

class _VoiceRecorderState extends State<VoiceRecorder>
    with SingleTickerProviderStateMixin {
  final _voiceService = VoiceMessageService.instance;
  late AnimationController _pulseController;
  bool _isUploading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _startRecording();
    _voiceService.addRecordingListener(_onRecordingStateChanged);
  }

  @override
  void dispose() {
    _voiceService.removeRecordingListener(_onRecordingStateChanged);
    _pulseController.dispose();
    super.dispose();
  }

  void _onRecordingStateChanged() {
    if (mounted) {
      setState(() {});
    }
  }

  Future<void> _startRecording() async {
    HapticFeedback.heavyImpact();
    
    final hasPermission = await _voiceService.hasPermission();
    if (!hasPermission) {
      setState(() => _error = 'Microphone permission required');
      return;
    }

    final started = await _voiceService.startRecording();
    if (started) {
      _pulseController.repeat(reverse: true);
    } else {
      setState(() => _error = 'Failed to start recording');
    }
  }

  Future<void> _stopAndSend() async {
    HapticFeedback.mediumImpact();
    _pulseController.stop();
    
    setState(() => _isUploading = true);
    
    try {
      final result = await _voiceService.stopRecording();
      if (result == null) {
        setState(() {
          _error = 'Recording too short';
          _isUploading = false;
        });
        return;
      }
      
      // Upload to storage
      final uploadedUrl = await _voiceService.uploadVoiceMessage(result);
      if (uploadedUrl != null) {
        widget.onRecordComplete(uploadedUrl, result.durationSeconds, result.waveformData);
      } else {
        // Fallback: use local path
        widget.onRecordComplete(result.localPath, result.durationSeconds, result.waveformData);
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to send recording';
        _isUploading = false;
      });
    }
  }

  void _cancel() {
    HapticFeedback.lightImpact();
    _pulseController.stop();
    _voiceService.cancelRecording();
    widget.onCancel();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isRecording = _voiceService.isRecording;
    final duration = _voiceService.recordingDuration;
    final waveform = _voiceService.liveWaveform;

    if (_error != null) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: cs.errorContainer,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Row(
          children: [
            Icon(Icons.error_outline, color: cs.onErrorContainer),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                _error!,
                style: TextStyle(color: cs.onErrorContainer),
              ),
            ),
            TextButton(
              onPressed: widget.onCancel,
              child: Text('Close', style: TextStyle(color: cs.onErrorContainer)),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: cs.errorContainer,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        children: [
          // Cancel button
          GestureDetector(
            onTap: _cancel,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: cs.onErrorContainer.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.close, color: cs.onErrorContainer, size: 20),
            ),
          ),
          
          const SizedBox(width: 12),
          
          // Recording indicator
          AnimatedBuilder(
            animation: _pulseController,
            builder: (context, child) {
              return Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: cs.error,
                  shape: BoxShape.circle,
                  boxShadow: isRecording
                      ? [
                          BoxShadow(
                            color: cs.error.withOpacity(0.3 + _pulseController.value * 0.3),
                            blurRadius: 4 + _pulseController.value * 4,
                          ),
                        ]
                      : null,
                ),
              );
            },
          ),
          
          const SizedBox(width: 12),
          
          // Duration
          Text(
            VoiceMessageService.formatSeconds(duration),
            style: context.textStyles.titleMedium?.copyWith(
              color: cs.onErrorContainer,
              fontWeight: FontWeight.w600,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
          
          const Spacer(),
          
          // Live waveform preview
          SizedBox(
            width: 100,
            height: 28,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: waveform.reversed.take(20).map((h) {
                return Container(
                  width: 3,
                  height: 6 + h * 22,
                  margin: const EdgeInsets.symmetric(horizontal: 1),
                  decoration: BoxDecoration(
                    color: cs.onErrorContainer.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(1.5),
                  ),
                );
              }).toList(),
            ),
          ),
          
          const SizedBox(width: 12),
          
          // Send button
          GestureDetector(
            onTap: _isUploading ? null : _stopAndSend,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: cs.onErrorContainer,
                shape: BoxShape.circle,
              ),
              child: _isUploading
                  ? SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: cs.errorContainer,
                      ),
                    )
                  : Icon(Icons.send, color: cs.errorContainer, size: 20),
            ),
          ),
        ],
      ),
    );
  }
}
