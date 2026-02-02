/// Voice Message Service - Platform-aware implementation
/// Uses conditional imports to provide native functionality on mobile
/// and a graceful stub on web platform.
/// 
/// Industrial best practice: separate platform implementations with
/// shared interface to prevent compilation errors.
library voice_message_service;

export 'voice_message_interface.dart' show VoiceRecordingResult, VoiceMessageServiceInterface;

import 'voice_message_interface.dart';

// Conditional import - uses web stub on web, native implementation elsewhere
import 'voice_message_service_stub.dart'
    if (dart.library.io) 'voice_message_service_native.dart';

/// Voice message service singleton accessor
/// Provides platform-appropriate implementation automatically
class VoiceMessageService {
  static VoiceMessageServiceInterface? _instance;
  
  /// Get the singleton instance
  static VoiceMessageServiceInterface get instance {
    _instance ??= createVoiceMessageService();
    return _instance!;
  }
  
  // Prevent instantiation
  VoiceMessageService._();
  
  // Static constants delegated to interface
  static const List<double> playbackSpeeds = VoiceMessageServiceInterface.playbackSpeeds;
  static const int maxRecordingDurationSeconds = VoiceMessageServiceInterface.maxRecordingDurationSeconds;
  static const int minRecordingDurationSeconds = VoiceMessageServiceInterface.minRecordingDurationSeconds;
  
  // Static helper methods delegated to interface
  static String formatSpeed(double speed) => 
      VoiceMessageServiceInterface.formatSpeed(speed);
  
  static String formatDuration(Duration duration) => 
      VoiceMessageServiceInterface.formatDuration(duration);
  
  static String formatSeconds(int seconds) => 
      VoiceMessageServiceInterface.formatSeconds(seconds);
}
