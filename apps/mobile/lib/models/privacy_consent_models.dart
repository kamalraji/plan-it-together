/// Privacy consent model for GDPR/CCPA compliance
class PrivacyConsent {
  final String id;
  final String userId;
  final bool analyticsConsent;
  final bool marketingConsent;
  final bool personalizationConsent;
  final bool thirdPartySharing;
  final bool essentialCookies; // Always true, required
  final String consentVersion;
  final DateTime consentedAt;
  final DateTime? updatedAt;
  final String? ipAddressHash;

  PrivacyConsent({
    required this.id,
    required this.userId,
    this.analyticsConsent = false,
    this.marketingConsent = false,
    this.personalizationConsent = false,
    this.thirdPartySharing = false,
    this.essentialCookies = true,
    required this.consentVersion,
    required this.consentedAt,
    this.updatedAt,
    this.ipAddressHash,
  });

  factory PrivacyConsent.empty(String userId) => PrivacyConsent(
    id: '',
    userId: userId,
    consentVersion: '1.0',
    consentedAt: DateTime.now(),
  );

  factory PrivacyConsent.fromJson(Map<String, dynamic> json) {
    return PrivacyConsent(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      analyticsConsent: json['analytics_consent'] as bool? ?? false,
      marketingConsent: json['marketing_consent'] as bool? ?? false,
      personalizationConsent: json['personalization_consent'] as bool? ?? false,
      thirdPartySharing: json['third_party_sharing'] as bool? ?? false,
      essentialCookies: true, // Always true
      consentVersion: json['consent_version'] as String? ?? '1.0',
      consentedAt: DateTime.tryParse(json['consented_at'] as String? ?? '') ?? DateTime.now(),
      updatedAt: json['updated_at'] != null 
        ? DateTime.tryParse(json['updated_at'] as String)
        : null,
      ipAddressHash: json['ip_address_hash'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    if (id.isNotEmpty) 'id': id,
    'user_id': userId,
    'analytics_consent': analyticsConsent,
    'marketing_consent': marketingConsent,
    'personalization_consent': personalizationConsent,
    'third_party_sharing': thirdPartySharing,
    'consent_version': consentVersion,
    'consented_at': consentedAt.toIso8601String(),
    if (ipAddressHash != null) 'ip_address_hash': ipAddressHash,
  };

  PrivacyConsent copyWith({
    String? id,
    String? userId,
    bool? analyticsConsent,
    bool? marketingConsent,
    bool? personalizationConsent,
    bool? thirdPartySharing,
    String? consentVersion,
    DateTime? consentedAt,
    DateTime? updatedAt,
    String? ipAddressHash,
  }) {
    return PrivacyConsent(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      analyticsConsent: analyticsConsent ?? this.analyticsConsent,
      marketingConsent: marketingConsent ?? this.marketingConsent,
      personalizationConsent: personalizationConsent ?? this.personalizationConsent,
      thirdPartySharing: thirdPartySharing ?? this.thirdPartySharing,
      consentVersion: consentVersion ?? this.consentVersion,
      consentedAt: consentedAt ?? this.consentedAt,
      updatedAt: updatedAt ?? this.updatedAt,
      ipAddressHash: ipAddressHash ?? this.ipAddressHash,
    );
  }

  /// Check if user has given any consent
  bool get hasAnyConsent => analyticsConsent || marketingConsent || 
    personalizationConsent || thirdPartySharing;

  /// Check if user has given all consent
  bool get hasAllConsent => analyticsConsent && marketingConsent && 
    personalizationConsent && thirdPartySharing;
}

/// Profile visibility settings for granular privacy control
class ProfileVisibilitySettings {
  final String id;
  final String userId;
  final ProfileVisibility profileVisibility;
  final FieldVisibility emailVisibility;
  final FieldVisibility phoneVisibility;
  final LocationVisibility locationVisibility;
  final bool searchable;
  final bool contactSyncDiscoverable;
  final bool showProfileViews;
  final bool showActivityStatus;
  final bool showInNearby;
  final bool showInSuggestions;
  final MessagePermission allowMessagesFrom;
  final bool showSocialLinks;
  final bool allowFollowRequests;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  ProfileVisibilitySettings({
    this.id = '',
    required this.userId,
    this.profileVisibility = ProfileVisibility.everyone,
    this.emailVisibility = FieldVisibility.hidden,
    this.phoneVisibility = FieldVisibility.hidden,
    this.locationVisibility = LocationVisibility.city,
    this.searchable = true,
    this.contactSyncDiscoverable = true,
    this.showProfileViews = true,
    this.showActivityStatus = true,
    this.showInNearby = true,
    this.showInSuggestions = true,
    this.allowMessagesFrom = MessagePermission.everyone,
    this.showSocialLinks = true,
    this.allowFollowRequests = true,
    this.createdAt,
    this.updatedAt,
  });

  factory ProfileVisibilitySettings.empty(String userId) => ProfileVisibilitySettings(
    userId: userId,
  );

  factory ProfileVisibilitySettings.fromJson(Map<String, dynamic> json) {
    return ProfileVisibilitySettings(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      profileVisibility: ProfileVisibility.fromString(
        json['profile_visibility'] as String? ?? 'everyone',
      ),
      emailVisibility: FieldVisibility.fromString(
        json['email_visibility'] as String? ?? 'hidden',
      ),
      phoneVisibility: FieldVisibility.fromString(
        json['phone_visibility'] as String? ?? 'hidden',
      ),
      locationVisibility: LocationVisibility.fromString(
        json['location_visibility'] as String? ?? 'city',
      ),
      searchable: json['searchable'] as bool? ?? true,
      contactSyncDiscoverable: json['contact_sync_discoverable'] as bool? ?? true,
      showProfileViews: json['show_profile_views'] as bool? ?? true,
      showActivityStatus: json['show_activity_status'] as bool? ?? true,
      showInNearby: json['show_in_nearby'] as bool? ?? true,
      showInSuggestions: json['show_in_suggestions'] as bool? ?? true,
      allowMessagesFrom: MessagePermission.fromString(
        json['allow_messages_from'] as String? ?? 'everyone',
      ),
      showSocialLinks: json['show_social_links'] as bool? ?? true,
      allowFollowRequests: json['allow_connection_requests'] as bool? ?? true,
      createdAt: json['created_at'] != null 
        ? DateTime.tryParse(json['created_at'] as String)
        : null,
      updatedAt: json['updated_at'] != null 
        ? DateTime.tryParse(json['updated_at'] as String)
        : null,
    );
  }

  Map<String, dynamic> toJson() => {
    if (id.isNotEmpty) 'id': id,
    'user_id': userId,
    'profile_visibility': profileVisibility.value,
    'email_visibility': emailVisibility.value,
    'phone_visibility': phoneVisibility.value,
    'location_visibility': locationVisibility.value,
    'searchable': searchable,
    'contact_sync_discoverable': contactSyncDiscoverable,
    'show_profile_views': showProfileViews,
    'show_activity_status': showActivityStatus,
    'show_in_nearby': showInNearby,
    'show_in_suggestions': showInSuggestions,
    'allow_messages_from': allowMessagesFrom.value,
    'show_social_links': showSocialLinks,
    'allow_connection_requests': allowFollowRequests,
  };

  ProfileVisibilitySettings copyWith({
    String? id,
    String? userId,
    ProfileVisibility? profileVisibility,
    FieldVisibility? emailVisibility,
    FieldVisibility? phoneVisibility,
    LocationVisibility? locationVisibility,
    bool? searchable,
    bool? contactSyncDiscoverable,
    bool? showProfileViews,
    bool? showActivityStatus,
    bool? showInNearby,
    bool? showInSuggestions,
    MessagePermission? allowMessagesFrom,
    bool? showSocialLinks,
    bool? allowFollowRequests,
  }) {
    return ProfileVisibilitySettings(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      profileVisibility: profileVisibility ?? this.profileVisibility,
      emailVisibility: emailVisibility ?? this.emailVisibility,
      phoneVisibility: phoneVisibility ?? this.phoneVisibility,
      locationVisibility: locationVisibility ?? this.locationVisibility,
      searchable: searchable ?? this.searchable,
      contactSyncDiscoverable: contactSyncDiscoverable ?? this.contactSyncDiscoverable,
      showProfileViews: showProfileViews ?? this.showProfileViews,
      showActivityStatus: showActivityStatus ?? this.showActivityStatus,
      showInNearby: showInNearby ?? this.showInNearby,
      showInSuggestions: showInSuggestions ?? this.showInSuggestions,
      allowMessagesFrom: allowMessagesFrom ?? this.allowMessagesFrom,
      showSocialLinks: showSocialLinks ?? this.showSocialLinks,
      allowFollowRequests: allowFollowRequests ?? this.allowFollowRequests,
    );
  }
}

/// Who can message the user
enum MessagePermission {
  everyone('everyone', 'Everyone', 'Anyone can message you'),
  connections('connections', 'Followers Only', 'Only your followers can message you'),
  nobody('nobody', 'Nobody', 'Block all incoming messages');

  final String value;
  final String label;
  final String description;

  const MessagePermission(this.value, this.label, this.description);

  static MessagePermission fromString(String value) {
    return MessagePermission.values.firstWhere(
      (v) => v.value == value,
      orElse: () => MessagePermission.everyone,
    );
  }
}

/// Who can see the user's profile
enum ProfileVisibility {
  everyone('everyone', 'Everyone', 'Anyone can view your profile'),
  connections('connections', 'Followers Only', 'Only your followers'),
  nobody('nobody', 'Nobody', 'Your profile is hidden from everyone');

  final String value;
  final String label;
  final String description;

  const ProfileVisibility(this.value, this.label, this.description);

  static ProfileVisibility fromString(String value) {
    return ProfileVisibility.values.firstWhere(
      (v) => v.value == value,
      orElse: () => ProfileVisibility.everyone,
    );
  }
}

/// Field visibility options
enum FieldVisibility {
  public('public', 'Public', 'Visible to everyone'),
  connections('connections', 'Followers', 'Visible to followers only'),
  hidden('hidden', 'Hidden', 'Not visible to anyone');

  final String value;
  final String label;
  final String description;

  const FieldVisibility(this.value, this.label, this.description);

  static FieldVisibility fromString(String value) {
    return FieldVisibility.values.firstWhere(
      (v) => v.value == value,
      orElse: () => FieldVisibility.hidden,
    );
  }
}

/// Location visibility options
enum LocationVisibility {
  exact('exact', 'Exact Location', 'Show your precise location'),
  city('city', 'City Level', 'Show only your city'),
  country('country', 'Country Only', 'Show only your country'),
  hidden('hidden', 'Hidden', 'Don\'t show your location');

  final String value;
  final String label;
  final String description;

  const LocationVisibility(this.value, this.label, this.description);

  static LocationVisibility fromString(String value) {
    return LocationVisibility.values.firstWhere(
      (v) => v.value == value,
      orElse: () => LocationVisibility.city,
    );
  }
}

/// Trusted device model
class TrustedDevice {
  final String id;
  final String userId;
  final String deviceId;
  final String deviceName;
  final String? deviceType;
  final String? os;
  final String? browser;
  final DateTime trustedAt;
  final DateTime? expiresAt;
  final bool isCurrent;

  TrustedDevice({
    required this.id,
    required this.userId,
    required this.deviceId,
    required this.deviceName,
    this.deviceType,
    this.os,
    this.browser,
    required this.trustedAt,
    this.expiresAt,
    this.isCurrent = false,
  });

  factory TrustedDevice.fromJson(Map<String, dynamic> json) {
    return TrustedDevice(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      deviceId: json['device_id'] as String? ?? '',
      deviceName: json['device_name'] as String? ?? 'Unknown Device',
      deviceType: json['device_type'] as String?,
      os: json['os'] as String?,
      browser: json['browser'] as String?,
      trustedAt: DateTime.tryParse(json['trusted_at'] as String? ?? '') ?? DateTime.now(),
      expiresAt: json['expires_at'] != null 
        ? DateTime.tryParse(json['expires_at'] as String)
        : null,
      isCurrent: json['is_current'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    if (id.isNotEmpty) 'id': id,
    'user_id': userId,
    'device_id': deviceId,
    'device_name': deviceName,
    if (deviceType != null) 'device_type': deviceType,
    if (os != null) 'os': os,
    if (browser != null) 'browser': browser,
    'trusted_at': trustedAt.toIso8601String(),
    if (expiresAt != null) 'expires_at': expiresAt!.toIso8601String(),
    'is_current': isCurrent,
  };

  bool get isExpired => expiresAt != null && DateTime.now().isAfter(expiresAt!);

  String get expiryLabel {
    if (expiresAt == null) return 'Never expires';
    if (isExpired) return 'Expired';
    final days = expiresAt!.difference(DateTime.now()).inDays;
    if (days <= 0) return 'Expires today';
    if (days == 1) return 'Expires tomorrow';
    return 'Expires in $days days';
  }
}

/// Security activity log entry
class SecurityActivityEntry {
  final String id;
  final String userId;
  final SecurityActivityType activityType;
  final String description;
  final DateTime timestamp;
  final String? ipAddress;
  final String? deviceName;
  final String? location;
  final Map<String, dynamic>? metadata;

  SecurityActivityEntry({
    required this.id,
    required this.userId,
    required this.activityType,
    required this.description,
    required this.timestamp,
    this.ipAddress,
    this.deviceName,
    this.location,
    this.metadata,
  });

  factory SecurityActivityEntry.fromJson(Map<String, dynamic> json) {
    return SecurityActivityEntry(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      activityType: SecurityActivityType.fromString(
        json['activity_type'] as String? ?? 'other',
      ),
      description: json['description'] as String? ?? '',
      timestamp: DateTime.tryParse(json['timestamp'] as String? ?? '') ?? DateTime.now(),
      ipAddress: json['ip_address'] as String?,
      deviceName: json['device_name'] as String?,
      location: json['location'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() => {
    if (id.isNotEmpty) 'id': id,
    'user_id': userId,
    'activity_type': activityType.value,
    'description': description,
    'timestamp': timestamp.toIso8601String(),
    if (ipAddress != null) 'ip_address': ipAddress,
    if (deviceName != null) 'device_name': deviceName,
    if (location != null) 'location': location,
    if (metadata != null) 'metadata': metadata,
  };
}

/// Types of security activities
enum SecurityActivityType {
  login('login', 'Sign In', '🔑'),
  logout('logout', 'Sign Out', '🚪'),
  passwordChange('password_change', 'Password Changed', '🔒'),
  mfaEnabled('mfa_enabled', '2FA Enabled', '✅'),
  mfaDisabled('mfa_disabled', '2FA Disabled', '❌'),
  deviceTrusted('device_trusted', 'Device Trusted', '📱'),
  deviceRemoved('device_removed', 'Device Removed', '🗑️'),
  sessionTerminated('session_terminated', 'Session Terminated', '⛔'),
  recoveryEmailChanged('recovery_email_changed', 'Recovery Email Changed', '📧'),
  recoveryPhoneChanged('recovery_phone_changed', 'Recovery Phone Changed', '📞'),
  privacySettingsChanged('privacy_settings_changed', 'Privacy Settings Changed', '🔐'),
  dataExportRequested('data_export_requested', 'Data Export Requested', '📦'),
  accountDeactivated('account_deactivated', 'Account Deactivated', '⏸️'),
  accountReactivated('account_reactivated', 'Account Reactivated', '▶️'),
  suspiciousActivity('suspicious_activity', 'Suspicious Activity', '⚠️'),
  other('other', 'Other Activity', '📝');

  final String value;
  final String label;
  final String emoji;

  const SecurityActivityType(this.value, this.label, this.emoji);

  static SecurityActivityType fromString(String value) {
    return SecurityActivityType.values.firstWhere(
      (v) => v.value == value,
      orElse: () => SecurityActivityType.other,
    );
  }
}

/// Connected third-party app
class ConnectedApp {
  final String id;
  final String userId;
  final String appId;
  final String appName;
  final String? appIconUrl;
  final List<String> permissions;
  final DateTime authorizedAt;
  final DateTime? lastAccessedAt;

  ConnectedApp({
    required this.id,
    required this.userId,
    required this.appId,
    required this.appName,
    this.appIconUrl,
    this.permissions = const [],
    required this.authorizedAt,
    this.lastAccessedAt,
  });

  factory ConnectedApp.fromJson(Map<String, dynamic> json) {
    return ConnectedApp(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      appId: json['app_id'] as String? ?? '',
      appName: json['app_name'] as String? ?? 'Unknown App',
      appIconUrl: json['app_icon_url'] as String?,
      permissions: (json['permissions'] as List<dynamic>?)
          ?.map((e) => e.toString())
          .toList() ?? [],
      authorizedAt: DateTime.tryParse(json['authorized_at'] as String? ?? '') ?? DateTime.now(),
      lastAccessedAt: json['last_accessed_at'] != null 
        ? DateTime.tryParse(json['last_accessed_at'] as String)
        : null,
    );
  }

  Map<String, dynamic> toJson() => {
    if (id.isNotEmpty) 'id': id,
    'user_id': userId,
    'app_id': appId,
    'app_name': appName,
    if (appIconUrl != null) 'app_icon_url': appIconUrl,
    'permissions': permissions,
    'authorized_at': authorizedAt.toIso8601String(),
    if (lastAccessedAt != null) 'last_accessed_at': lastAccessedAt!.toIso8601String(),
  };
}

/// Data retention settings
class DataRetentionSettings {
  final String id;
  final String userId;
  final RetentionPeriod messageRetention;
  final RetentionPeriod activityRetention;
  final RetentionPeriod searchHistoryRetention;
  final bool autoDeleteEnabled;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  DataRetentionSettings({
    required this.id,
    required this.userId,
    this.messageRetention = RetentionPeriod.forever,
    this.activityRetention = RetentionPeriod.oneYear,
    this.searchHistoryRetention = RetentionPeriod.thirtyDays,
    this.autoDeleteEnabled = false,
    this.createdAt,
    this.updatedAt,
  });

  factory DataRetentionSettings.empty(String userId) => DataRetentionSettings(
    id: '',
    userId: userId,
  );

  factory DataRetentionSettings.fromJson(Map<String, dynamic> json) {
    return DataRetentionSettings(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      messageRetention: RetentionPeriod.fromString(
        json['message_retention'] as String? ?? 'forever',
      ),
      activityRetention: RetentionPeriod.fromString(
        json['activity_retention'] as String? ?? 'one_year',
      ),
      searchHistoryRetention: RetentionPeriod.fromString(
        json['search_history_retention'] as String? ?? 'thirty_days',
      ),
      autoDeleteEnabled: json['auto_delete_enabled'] as bool? ?? false,
      createdAt: json['created_at'] != null 
        ? DateTime.tryParse(json['created_at'] as String)
        : null,
      updatedAt: json['updated_at'] != null 
        ? DateTime.tryParse(json['updated_at'] as String)
        : null,
    );
  }

  Map<String, dynamic> toJson() => {
    if (id.isNotEmpty) 'id': id,
    'user_id': userId,
    'message_retention': messageRetention.value,
    'activity_retention': activityRetention.value,
    'search_history_retention': searchHistoryRetention.value,
    'auto_delete_enabled': autoDeleteEnabled,
  };

  DataRetentionSettings copyWith({
    String? id,
    String? userId,
    RetentionPeriod? messageRetention,
    RetentionPeriod? activityRetention,
    RetentionPeriod? searchHistoryRetention,
    bool? autoDeleteEnabled,
  }) {
    return DataRetentionSettings(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      messageRetention: messageRetention ?? this.messageRetention,
      activityRetention: activityRetention ?? this.activityRetention,
      searchHistoryRetention: searchHistoryRetention ?? this.searchHistoryRetention,
      autoDeleteEnabled: autoDeleteEnabled ?? this.autoDeleteEnabled,
    );
  }
}

/// Retention period options
enum RetentionPeriod {
  sevenDays('seven_days', '7 Days', 7),
  thirtyDays('thirty_days', '30 Days', 30),
  ninetyDays('ninety_days', '90 Days', 90),
  oneYear('one_year', '1 Year', 365),
  forever('forever', 'Forever', -1);

  final String value;
  final String label;
  final int days;

  const RetentionPeriod(this.value, this.label, this.days);

  static RetentionPeriod fromString(String value) {
    return RetentionPeriod.values.firstWhere(
      (v) => v.value == value,
      orElse: () => RetentionPeriod.forever,
    );
  }
}
