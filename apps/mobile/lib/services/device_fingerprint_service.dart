import 'dart:convert';
import 'dart:io';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/utils/result.dart';

/// Service for generating and managing device fingerprints
class DeviceFingerprintService extends BaseService {
  static DeviceFingerprintService? _instance;
  static DeviceFingerprintService get instance => _instance ??= DeviceFingerprintService._();
  DeviceFingerprintService._();

  @override
  String get tag => 'DeviceFingerprint';

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  static const _deviceIdKey = 'device_fingerprint_id';
  static const _deviceInfoKey = 'device_fingerprint_info';

  String? _cachedFingerprint;
  DeviceInfo? _cachedDeviceInfo;

  /// Mask fingerprint for logging (security)
  String _maskFingerprint(String fingerprint) {
    if (fingerprint.length <= 8) return '***';
    return '${fingerprint.substring(0, 4)}...${fingerprint.substring(fingerprint.length - 4)}';
  }

  /// Get or generate a unique device fingerprint
  Future<Result<String>> getDeviceFingerprint() => execute(() async {
    if (_cachedFingerprint != null) return _cachedFingerprint!;

    // Try to retrieve existing fingerprint
    final existingFingerprint = await _storage.read(key: _deviceIdKey);
    if (existingFingerprint != null) {
      _cachedFingerprint = existingFingerprint;
      logDebug('Retrieved existing fingerprint: ${_maskFingerprint(existingFingerprint)}');
      return existingFingerprint;
    }

    // Generate new fingerprint
    final fingerprint = await _generateFingerprint();
    await _storage.write(key: _deviceIdKey, value: fingerprint);
    _cachedFingerprint = fingerprint;
    
    logInfo('New fingerprint generated: ${_maskFingerprint(fingerprint)}');
    return fingerprint;
  }, operationName: 'getDeviceFingerprint');

  /// Get detailed device information
  Future<Result<DeviceInfo>> getDeviceInfo() => execute(() async {
    if (_cachedDeviceInfo != null) return _cachedDeviceInfo!;

    final storedInfo = await _storage.read(key: _deviceInfoKey);
    if (storedInfo != null) {
      _cachedDeviceInfo = DeviceInfo.fromJson(jsonDecode(storedInfo));
      return _cachedDeviceInfo!;
    }

    final info = await _collectDeviceInfo();
    await _storage.write(key: _deviceInfoKey, value: jsonEncode(info.toJson()));
    _cachedDeviceInfo = info;
    
    logDebug('Device info collected: ${info.platform} ${info.deviceType}');
    return info;
  }, operationName: 'getDeviceInfo');

  /// Generate a unique device fingerprint based on multiple factors
  Future<String> _generateFingerprint() async {
    final info = await _collectDeviceInfo();
    final components = [
      info.platform,
      info.osVersion,
      info.model,
      info.manufacturer,
      DateTime.now().millisecondsSinceEpoch.toString(),
      _generateRandomComponent(),
    ];

    final combined = components.join('|');
    final bytes = utf8.encode(combined);
    final hash = sha256.convert(bytes);
    
    return hash.toString().substring(0, 32);
  }

  /// Fallback fingerprint generation
  String _generateFallbackFingerprint() {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final random = _generateRandomComponent();
    final combined = '$timestamp|$random';
    final bytes = utf8.encode(combined);
    final hash = sha256.convert(bytes);
    return hash.toString().substring(0, 32);
  }

  String _generateRandomComponent() {
    final random = List<int>.generate(16, (i) => 
      DateTime.now().microsecondsSinceEpoch % 256);
    return base64Encode(random);
  }

  /// Collect device information
  Future<DeviceInfo> _collectDeviceInfo() async {
    String platform = 'unknown';
    String osVersion = 'unknown';
    String model = 'unknown';
    String manufacturer = 'unknown';
    String deviceType = 'mobile';

    try {
      if (kIsWeb) {
        platform = 'web';
        deviceType = 'web';
      } else if (Platform.isAndroid) {
        platform = 'android';
        osVersion = Platform.operatingSystemVersion;
        deviceType = 'mobile';
      } else if (Platform.isIOS) {
        platform = 'ios';
        osVersion = Platform.operatingSystemVersion;
        deviceType = 'mobile';
      } else if (Platform.isMacOS) {
        platform = 'macos';
        osVersion = Platform.operatingSystemVersion;
        deviceType = 'desktop';
      } else if (Platform.isWindows) {
        platform = 'windows';
        osVersion = Platform.operatingSystemVersion;
        deviceType = 'desktop';
      } else if (Platform.isLinux) {
        platform = 'linux';
        osVersion = Platform.operatingSystemVersion;
        deviceType = 'desktop';
      }
    } catch (e) {
      logWarning('Error collecting platform info', error: e);
    }

    return DeviceInfo(
      platform: platform,
      osVersion: osVersion,
      model: model,
      manufacturer: manufacturer,
      deviceType: deviceType,
      screenResolution: await _getScreenResolution(),
      locale: Platform.localeName,
      timezone: DateTime.now().timeZoneName,
    );
  }

  Future<String> _getScreenResolution() async {
    try {
      // This would typically use platform-specific code
      return 'unknown';
    } catch (e) {
      return 'unknown';
    }
  }

  /// Check if current device matches a stored fingerprint
  Future<bool> matchesFingerprint(String storedFingerprint) async {
    final result = await getDeviceFingerprint();
    if (result is Success<String>) {
      return result.data == storedFingerprint;
    }
    return false;
  }

  /// Get a display-friendly device name
  Future<String> getDeviceDisplayName() async {
    final result = await getDeviceInfo();
    final info = result is Success<DeviceInfo> ? result.data : DeviceInfo.unknown();
    
    if (info.model != 'unknown') {
      return info.model;
    }
    
    switch (info.platform) {
      case 'android':
        return 'Android Device';
      case 'ios':
        return 'iPhone';
      case 'macos':
        return 'Mac';
      case 'windows':
        return 'Windows PC';
      case 'web':
        return 'Web Browser';
      default:
        return 'Unknown Device';
    }
  }

  /// Clear cached fingerprint (useful for testing)
  Future<Result<void>> clearFingerprint() => execute(() async {
    _cachedFingerprint = null;
    _cachedDeviceInfo = null;
    await _storage.delete(key: _deviceIdKey);
    await _storage.delete(key: _deviceInfoKey);
    logInfo('Fingerprint cleared');
  }, operationName: 'clearFingerprint');
}

/// Device information model
class DeviceInfo {
  final String platform;
  final String osVersion;
  final String model;
  final String manufacturer;
  final String deviceType;
  final String? screenResolution;
  final String? locale;
  final String? timezone;

  DeviceInfo({
    required this.platform,
    required this.osVersion,
    required this.model,
    required this.manufacturer,
    required this.deviceType,
    this.screenResolution,
    this.locale,
    this.timezone,
  });

  factory DeviceInfo.unknown() {
    return DeviceInfo(
      platform: 'unknown',
      osVersion: 'unknown',
      model: 'unknown',
      manufacturer: 'unknown',
      deviceType: 'mobile',
    );
  }

  factory DeviceInfo.fromJson(Map<String, dynamic> json) {
    return DeviceInfo(
      platform: json['platform'] as String? ?? 'unknown',
      osVersion: json['os_version'] as String? ?? 'unknown',
      model: json['model'] as String? ?? 'unknown',
      manufacturer: json['manufacturer'] as String? ?? 'unknown',
      deviceType: json['device_type'] as String? ?? 'mobile',
      screenResolution: json['screen_resolution'] as String?,
      locale: json['locale'] as String?,
      timezone: json['timezone'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'platform': platform,
      'os_version': osVersion,
      'model': model,
      'manufacturer': manufacturer,
      'device_type': deviceType,
      'screen_resolution': screenResolution,
      'locale': locale,
      'timezone': timezone,
    };
  }

  String get displayPlatform {
    switch (platform) {
      case 'android':
        return 'Android';
      case 'ios':
        return 'iOS';
      case 'macos':
        return 'macOS';
      case 'windows':
        return 'Windows';
      case 'linux':
        return 'Linux';
      case 'web':
        return 'Web';
      default:
        return platform;
    }
  }

  String get displayDeviceType {
    switch (deviceType) {
      case 'mobile':
        return 'Mobile';
      case 'tablet':
        return 'Tablet';
      case 'desktop':
        return 'Desktop';
      case 'web':
        return 'Browser';
      default:
        return deviceType;
    }
  }
}
