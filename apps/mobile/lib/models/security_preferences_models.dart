/// Models for security preferences and enhanced security features

class UserSecurityPreferences {
  final String id;
  final String userId;
  final int sessionTimeoutMinutes;
  final bool idleTimeoutEnabled;
  final bool requireReauthenticationSensitive;
  final int? passwordExpiryDays;
  final DateTime createdAt;
  final DateTime updatedAt;

  UserSecurityPreferences({
    required this.id,
    required this.userId,
    this.sessionTimeoutMinutes = 30,
    this.idleTimeoutEnabled = true,
    this.requireReauthenticationSensitive = true,
    this.passwordExpiryDays,
    required this.createdAt,
    required this.updatedAt,
  });

  factory UserSecurityPreferences.fromJson(Map<String, dynamic> json) {
    return UserSecurityPreferences(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      sessionTimeoutMinutes: json['session_timeout_minutes'] as int? ?? 30,
      idleTimeoutEnabled: json['idle_timeout_enabled'] as bool? ?? true,
      requireReauthenticationSensitive: json['require_reauthentication_sensitive'] as bool? ?? true,
      passwordExpiryDays: json['password_expiry_days'] as int?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'session_timeout_minutes': sessionTimeoutMinutes,
      'idle_timeout_enabled': idleTimeoutEnabled,
      'require_reauthentication_sensitive': requireReauthenticationSensitive,
      'password_expiry_days': passwordExpiryDays,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  UserSecurityPreferences copyWith({
    String? id,
    String? userId,
    int? sessionTimeoutMinutes,
    bool? idleTimeoutEnabled,
    bool? requireReauthenticationSensitive,
    int? passwordExpiryDays,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return UserSecurityPreferences(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      sessionTimeoutMinutes: sessionTimeoutMinutes ?? this.sessionTimeoutMinutes,
      idleTimeoutEnabled: idleTimeoutEnabled ?? this.idleTimeoutEnabled,
      requireReauthenticationSensitive: requireReauthenticationSensitive ?? this.requireReauthenticationSensitive,
      passwordExpiryDays: passwordExpiryDays ?? this.passwordExpiryDays,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  static UserSecurityPreferences empty(String userId) {
    final now = DateTime.now();
    return UserSecurityPreferences(
      id: '',
      userId: userId,
      sessionTimeoutMinutes: 30,
      idleTimeoutEnabled: true,
      requireReauthenticationSensitive: true,
      passwordExpiryDays: null,
      createdAt: now,
      updatedAt: now,
    );
  }
}

class SecurityNotificationPreferences {
  final String id;
  final String userId;
  final bool emailOnNewLogin;
  final bool emailOnPasswordChange;
  final bool emailOn2faChange;
  final bool emailOnSuspiciousActivity;
  final bool pushOnNewLogin;
  final bool pushOnPasswordChange;
  final bool pushOn2faChange;
  final bool pushOnSuspiciousActivity;
  final bool weeklySecurityDigest;
  final DateTime createdAt;
  final DateTime updatedAt;

  SecurityNotificationPreferences({
    required this.id,
    required this.userId,
    this.emailOnNewLogin = true,
    this.emailOnPasswordChange = true,
    this.emailOn2faChange = true,
    this.emailOnSuspiciousActivity = true,
    this.pushOnNewLogin = true,
    this.pushOnPasswordChange = true,
    this.pushOn2faChange = true,
    this.pushOnSuspiciousActivity = true,
    this.weeklySecurityDigest = false,
    required this.createdAt,
    required this.updatedAt,
  });

  factory SecurityNotificationPreferences.fromJson(Map<String, dynamic> json) {
    return SecurityNotificationPreferences(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      emailOnNewLogin: json['email_on_new_login'] as bool? ?? true,
      emailOnPasswordChange: json['email_on_password_change'] as bool? ?? true,
      emailOn2faChange: json['email_on_2fa_change'] as bool? ?? true,
      emailOnSuspiciousActivity: json['email_on_suspicious_activity'] as bool? ?? true,
      pushOnNewLogin: json['push_on_new_login'] as bool? ?? true,
      pushOnPasswordChange: json['push_on_password_change'] as bool? ?? true,
      pushOn2faChange: json['push_on_2fa_change'] as bool? ?? true,
      pushOnSuspiciousActivity: json['push_on_suspicious_activity'] as bool? ?? true,
      weeklySecurityDigest: json['weekly_security_digest'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'email_on_new_login': emailOnNewLogin,
      'email_on_password_change': emailOnPasswordChange,
      'email_on_2fa_change': emailOn2faChange,
      'email_on_suspicious_activity': emailOnSuspiciousActivity,
      'push_on_new_login': pushOnNewLogin,
      'push_on_password_change': pushOnPasswordChange,
      'push_on_2fa_change': pushOn2faChange,
      'push_on_suspicious_activity': pushOnSuspiciousActivity,
      'weekly_security_digest': weeklySecurityDigest,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  SecurityNotificationPreferences copyWith({
    String? id,
    String? userId,
    bool? emailOnNewLogin,
    bool? emailOnPasswordChange,
    bool? emailOn2faChange,
    bool? emailOnSuspiciousActivity,
    bool? pushOnNewLogin,
    bool? pushOnPasswordChange,
    bool? pushOn2faChange,
    bool? pushOnSuspiciousActivity,
    bool? weeklySecurityDigest,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return SecurityNotificationPreferences(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      emailOnNewLogin: emailOnNewLogin ?? this.emailOnNewLogin,
      emailOnPasswordChange: emailOnPasswordChange ?? this.emailOnPasswordChange,
      emailOn2faChange: emailOn2faChange ?? this.emailOn2faChange,
      emailOnSuspiciousActivity: emailOnSuspiciousActivity ?? this.emailOnSuspiciousActivity,
      pushOnNewLogin: pushOnNewLogin ?? this.pushOnNewLogin,
      pushOnPasswordChange: pushOnPasswordChange ?? this.pushOnPasswordChange,
      pushOn2faChange: pushOn2faChange ?? this.pushOn2faChange,
      pushOnSuspiciousActivity: pushOnSuspiciousActivity ?? this.pushOnSuspiciousActivity,
      weeklySecurityDigest: weeklySecurityDigest ?? this.weeklySecurityDigest,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  static SecurityNotificationPreferences empty(String userId) {
    final now = DateTime.now();
    return SecurityNotificationPreferences(
      id: '',
      userId: userId,
      createdAt: now,
      updatedAt: now,
    );
  }
}

class PasswordBreachResult {
  final bool breached;
  final int breachCount;
  final bool inHistory;
  final int historyMatches;
  final bool safe;
  final List<String> recommendations;

  PasswordBreachResult({
    required this.breached,
    required this.breachCount,
    required this.inHistory,
    required this.historyMatches,
    required this.safe,
    required this.recommendations,
  });

  factory PasswordBreachResult.fromJson(Map<String, dynamic> json) {
    return PasswordBreachResult(
      breached: json['breached'] as bool? ?? false,
      breachCount: json['breachCount'] as int? ?? 0,
      inHistory: json['inHistory'] as bool? ?? false,
      historyMatches: json['historyMatches'] as int? ?? 0,
      safe: json['safe'] as bool? ?? true,
      recommendations: (json['recommendations'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList() ?? [],
    );
  }
}

class GeoAnomalyResult {
  final bool isAnomaly;
  final String? anomalyType;
  final String riskLevel;
  final String details;
  final List<String> recommendations;

  GeoAnomalyResult({
    required this.isAnomaly,
    this.anomalyType,
    required this.riskLevel,
    required this.details,
    required this.recommendations,
  });

  factory GeoAnomalyResult.fromJson(Map<String, dynamic> json) {
    return GeoAnomalyResult(
      isAnomaly: json['isAnomaly'] as bool? ?? false,
      anomalyType: json['anomalyType'] as String?,
      riskLevel: json['riskLevel'] as String? ?? 'low',
      details: json['details'] as String? ?? '',
      recommendations: (json['recommendations'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList() ?? [],
    );
  }

  bool get isCritical => riskLevel == 'critical';
  bool get isHigh => riskLevel == 'high';
  bool get isMedium => riskLevel == 'medium';
}

class LoginAttempt {
  final String id;
  final String? userId;
  final String? email;
  final String? ipAddressHash;
  final String? userAgent;
  final String? locationCountry;
  final String? locationCity;
  final double? locationLat;
  final double? locationLng;
  final bool success;
  final String? failureReason;
  final DateTime createdAt;

  LoginAttempt({
    required this.id,
    this.userId,
    this.email,
    this.ipAddressHash,
    this.userAgent,
    this.locationCountry,
    this.locationCity,
    this.locationLat,
    this.locationLng,
    required this.success,
    this.failureReason,
    required this.createdAt,
  });

  factory LoginAttempt.fromJson(Map<String, dynamic> json) {
    return LoginAttempt(
      id: json['id'] as String,
      userId: json['user_id'] as String?,
      email: json['email'] as String?,
      ipAddressHash: json['ip_address_hash'] as String?,
      userAgent: json['user_agent'] as String?,
      locationCountry: json['location_country'] as String?,
      locationCity: json['location_city'] as String?,
      locationLat: (json['location_lat'] as num?)?.toDouble(),
      locationLng: (json['location_lng'] as num?)?.toDouble(),
      success: json['success'] as bool? ?? false,
      failureReason: json['failure_reason'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  /// Convenience getter for city (aliases locationCity)
  String? get city => locationCity;
  
  /// Convenience getter for country (aliases locationCountry)
  String? get country => locationCountry;

  String get displayLocation {
    if (locationCity != null && locationCountry != null) {
      return '$locationCity, $locationCountry';
    }
    return locationCountry ?? 'Unknown';
  }
}

/// Session timeout options
class SessionTimeoutOption {
  final int minutes;
  final String label;

  const SessionTimeoutOption(this.minutes, this.label);

  static const List<SessionTimeoutOption> all = [
    SessionTimeoutOption(5, '5 minutes'),
    SessionTimeoutOption(15, '15 minutes'),
    SessionTimeoutOption(30, '30 minutes'),
    SessionTimeoutOption(60, '1 hour'),
    SessionTimeoutOption(120, '2 hours'),
    SessionTimeoutOption(480, '8 hours'),
    SessionTimeoutOption(0, 'Never'),
  ];
}
