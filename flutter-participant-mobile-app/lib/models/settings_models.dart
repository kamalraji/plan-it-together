/// Settings-related models for the enhanced settings system

/// User session information for device tracking
class UserSession {
  final String id;
  final String userId;
  final String? deviceName;
  final String? deviceType;
  final String? browser;
  final String? os;
  final String? ipAddress;
  final String? location;
  final DateTime lastActiveAt;
  final DateTime createdAt;
  final bool isCurrent;

  const UserSession({
    required this.id,
    required this.userId,
    this.deviceName,
    this.deviceType,
    this.browser,
    this.os,
    this.ipAddress,
    this.location,
    required this.lastActiveAt,
    required this.createdAt,
    this.isCurrent = false,
  });

  factory UserSession.fromJson(Map<String, dynamic> json) {
    return UserSession(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      deviceName: json['device_name'] as String?,
      deviceType: json['device_type'] as String?,
      browser: json['browser'] as String?,
      os: json['os'] as String?,
      ipAddress: json['ip_address'] as String?,
      location: json['location'] as String?,
      lastActiveAt: DateTime.parse(json['last_active_at'] as String),
      createdAt: DateTime.parse(json['created_at'] as String),
      isCurrent: json['is_current'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'user_id': userId,
    'device_name': deviceName,
    'device_type': deviceType,
    'browser': browser,
    'os': os,
    'ip_address': ipAddress,
    'location': location,
    'last_active_at': lastActiveAt.toIso8601String(),
    'created_at': createdAt.toIso8601String(),
    'is_current': isCurrent,
  };

  String get deviceIcon {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return '📱';
      case 'tablet':
        return '📱';
      case 'desktop':
        return '💻';
      case 'web':
        return '🌐';
      default:
        return '📱';
    }
  }

  String get displayName {
    if (deviceName != null && deviceName!.isNotEmpty) {
      return deviceName!;
    }
    final parts = <String>[];
    if (browser != null) parts.add(browser!);
    if (os != null) parts.add('on $os');
    return parts.isNotEmpty ? parts.join(' ') : 'Unknown Device';
  }
}

/// Login history entry for security audit
class LoginHistoryEntry {
  final String id;
  final String userId;
  final bool success;
  final String? deviceName;
  final String? deviceType;
  final String? browser;
  final String? os;
  final String? ipAddress;
  final String? location;
  final String? failureReason;
  final DateTime createdAt;

  const LoginHistoryEntry({
    required this.id,
    required this.userId,
    required this.success,
    this.deviceName,
    this.deviceType,
    this.browser,
    this.os,
    this.ipAddress,
    this.location,
    this.failureReason,
    required this.createdAt,
  });

  factory LoginHistoryEntry.fromJson(Map<String, dynamic> json) {
    return LoginHistoryEntry(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      success: json['success'] as bool? ?? true,
      deviceName: json['device_name'] as String?,
      deviceType: json['device_type'] as String?,
      browser: json['browser'] as String?,
      os: json['os'] as String?,
      ipAddress: json['ip_address'] as String?,
      location: json['location'] as String?,
      failureReason: json['failure_reason'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

/// Accessibility settings for the app
class AccessibilitySettings {
  final String? id;
  final String userId;
  final double textScaleFactor;
  final bool boldTextEnabled;
  final bool highContrastEnabled;
  final bool reduceMotionEnabled;
  final bool largerTouchTargets;
  final bool screenReaderOptimized;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const AccessibilitySettings({
    this.id,
    required this.userId,
    this.textScaleFactor = 1.0,
    this.boldTextEnabled = false,
    this.highContrastEnabled = false,
    this.reduceMotionEnabled = false,
    this.largerTouchTargets = false,
    this.screenReaderOptimized = false,
    this.createdAt,
    this.updatedAt,
  });

  factory AccessibilitySettings.empty(String userId) {
    return AccessibilitySettings(userId: userId);
  }

  factory AccessibilitySettings.fromJson(Map<String, dynamic> json) {
    return AccessibilitySettings(
      id: json['id'] as String?,
      userId: json['user_id'] as String,
      textScaleFactor: (json['text_scale_factor'] as num?)?.toDouble() ?? 1.0,
      boldTextEnabled: json['bold_text_enabled'] as bool? ?? false,
      highContrastEnabled: json['high_contrast_enabled'] as bool? ?? false,
      reduceMotionEnabled: json['reduce_motion_enabled'] as bool? ?? false,
      largerTouchTargets: json['larger_touch_targets'] as bool? ?? false,
      screenReaderOptimized: json['screen_reader_optimized'] as bool? ?? false,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'] as String) 
          : null,
      updatedAt: json['updated_at'] != null 
          ? DateTime.parse(json['updated_at'] as String) 
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    if (id != null) 'id': id,
    'user_id': userId,
    'text_scale_factor': textScaleFactor,
    'bold_text_enabled': boldTextEnabled,
    'high_contrast_enabled': highContrastEnabled,
    'reduce_motion_enabled': reduceMotionEnabled,
    'larger_touch_targets': largerTouchTargets,
    'screen_reader_optimized': screenReaderOptimized,
    'updated_at': DateTime.now().toIso8601String(),
  };

  AccessibilitySettings copyWith({
    String? id,
    String? userId,
    double? textScaleFactor,
    bool? boldTextEnabled,
    bool? highContrastEnabled,
    bool? reduceMotionEnabled,
    bool? largerTouchTargets,
    bool? screenReaderOptimized,
  }) {
    return AccessibilitySettings(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      textScaleFactor: textScaleFactor ?? this.textScaleFactor,
      boldTextEnabled: boldTextEnabled ?? this.boldTextEnabled,
      highContrastEnabled: highContrastEnabled ?? this.highContrastEnabled,
      reduceMotionEnabled: reduceMotionEnabled ?? this.reduceMotionEnabled,
      largerTouchTargets: largerTouchTargets ?? this.largerTouchTargets,
      screenReaderOptimized: screenReaderOptimized ?? this.screenReaderOptimized,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}

/// Locale settings for language and region
class LocaleSettings {
  final String? id;
  final String userId;
  final String languageCode;
  final String regionCode;
  final String dateFormat;
  final String timeFormat;
  final String timezone;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const LocaleSettings({
    this.id,
    required this.userId,
    this.languageCode = 'en',
    this.regionCode = 'US',
    this.dateFormat = 'DD/MM/YYYY',
    this.timeFormat = '24h',
    this.timezone = 'UTC',
    this.createdAt,
    this.updatedAt,
  });

  factory LocaleSettings.empty(String userId) {
    return LocaleSettings(userId: userId);
  }

  factory LocaleSettings.fromJson(Map<String, dynamic> json) {
    return LocaleSettings(
      id: json['id'] as String?,
      userId: json['user_id'] as String,
      languageCode: json['language_code'] as String? ?? 'en',
      regionCode: json['region_code'] as String? ?? 'US',
      dateFormat: json['date_format'] as String? ?? 'DD/MM/YYYY',
      timeFormat: json['time_format'] as String? ?? '24h',
      timezone: json['timezone'] as String? ?? 'UTC',
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'] as String) 
          : null,
      updatedAt: json['updated_at'] != null 
          ? DateTime.parse(json['updated_at'] as String) 
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    if (id != null) 'id': id,
    'user_id': userId,
    'language_code': languageCode,
    'region_code': regionCode,
    'date_format': dateFormat,
    'time_format': timeFormat,
    'timezone': timezone,
    'updated_at': DateTime.now().toIso8601String(),
  };

  LocaleSettings copyWith({
    String? id,
    String? userId,
    String? languageCode,
    String? regionCode,
    String? dateFormat,
    String? timeFormat,
    String? timezone,
  }) {
    return LocaleSettings(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      languageCode: languageCode ?? this.languageCode,
      regionCode: regionCode ?? this.regionCode,
      dateFormat: dateFormat ?? this.dateFormat,
      timeFormat: timeFormat ?? this.timeFormat,
      timezone: timezone ?? this.timezone,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }

  String get languageDisplayName {
    switch (languageCode) {
      case 'en': return 'English';
      case 'hi': return 'हिन्दी (Hindi)';
      case 'ta': return 'தமிழ் (Tamil)';
      case 'te': return 'తెలుగు (Telugu)';
      case 'kn': return 'ಕನ್ನಡ (Kannada)';
      case 'ml': return 'മലയാളം (Malayalam)';
      case 'mr': return 'मराठी (Marathi)';
      case 'bn': return 'বাংলা (Bengali)';
      case 'gu': return 'ગુજરાતી (Gujarati)';
      case 'pa': return 'ਪੰਜਾਬੀ (Punjabi)';
      default: return languageCode.toUpperCase();
    }
  }

  String get regionDisplayName {
    switch (regionCode) {
      case 'US': return 'United States';
      case 'IN': return 'India';
      case 'GB': return 'United Kingdom';
      case 'CA': return 'Canada';
      case 'AU': return 'Australia';
      case 'DE': return 'Germany';
      case 'FR': return 'France';
      case 'JP': return 'Japan';
      case 'SG': return 'Singapore';
      case 'AE': return 'UAE';
      default: return regionCode;
    }
  }
}

/// Supported languages
class SupportedLanguage {
  final String code;
  final String name;
  final String nativeName;

  const SupportedLanguage({
    required this.code,
    required this.name,
    required this.nativeName,
  });

  static const List<SupportedLanguage> all = [
    SupportedLanguage(code: 'en', name: 'English', nativeName: 'English'),
    SupportedLanguage(code: 'hi', name: 'Hindi', nativeName: 'हिन्दी'),
    SupportedLanguage(code: 'ta', name: 'Tamil', nativeName: 'தமிழ்'),
    SupportedLanguage(code: 'te', name: 'Telugu', nativeName: 'తెలుగు'),
    SupportedLanguage(code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ'),
    SupportedLanguage(code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം'),
    SupportedLanguage(code: 'mr', name: 'Marathi', nativeName: 'मराठी'),
    SupportedLanguage(code: 'bn', name: 'Bengali', nativeName: 'বাংলা'),
    SupportedLanguage(code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી'),
    SupportedLanguage(code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ'),
  ];
}

/// Supported regions
class SupportedRegion {
  final String code;
  final String name;
  final String flag;

  const SupportedRegion({
    required this.code,
    required this.name,
    required this.flag,
  });

  static const List<SupportedRegion> all = [
    SupportedRegion(code: 'IN', name: 'India', flag: '🇮🇳'),
    SupportedRegion(code: 'US', name: 'United States', flag: '🇺🇸'),
    SupportedRegion(code: 'GB', name: 'United Kingdom', flag: '🇬🇧'),
    SupportedRegion(code: 'CA', name: 'Canada', flag: '🇨🇦'),
    SupportedRegion(code: 'AU', name: 'Australia', flag: '🇦🇺'),
    SupportedRegion(code: 'DE', name: 'Germany', flag: '🇩🇪'),
    SupportedRegion(code: 'FR', name: 'France', flag: '🇫🇷'),
    SupportedRegion(code: 'JP', name: 'Japan', flag: '🇯🇵'),
    SupportedRegion(code: 'SG', name: 'Singapore', flag: '🇸🇬'),
    SupportedRegion(code: 'AE', name: 'UAE', flag: '🇦🇪'),
  ];
}

/// Date format options
class DateFormatOption {
  final String format;
  final String example;

  const DateFormatOption({required this.format, required this.example});

  static const List<DateFormatOption> all = [
    DateFormatOption(format: 'DD/MM/YYYY', example: '20/01/2026'),
    DateFormatOption(format: 'MM/DD/YYYY', example: '01/20/2026'),
    DateFormatOption(format: 'YYYY-MM-DD', example: '2026-01-20'),
    DateFormatOption(format: 'DD-MMM-YYYY', example: '20-Jan-2026'),
  ];
}

/// Time format options
class TimeFormatOption {
  final String format;
  final String example;

  const TimeFormatOption({required this.format, required this.example});

  static const List<TimeFormatOption> all = [
    TimeFormatOption(format: '24h', example: '14:30'),
    TimeFormatOption(format: '12h', example: '2:30 PM'),
  ];
}
