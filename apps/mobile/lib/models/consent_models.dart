/// GDPR/CCPA Consent Management Models

class ConsentCategory {
  final String id;
  final String key;
  final String name;
  final String description;
  final bool isRequired;
  final bool isActive;
  final int sortOrder;
  final DateTime createdAt;

  ConsentCategory({
    required this.id,
    required this.key,
    required this.name,
    required this.description,
    required this.isRequired,
    required this.isActive,
    required this.sortOrder,
    required this.createdAt,
  });

  factory ConsentCategory.fromJson(Map<String, dynamic> json) {
    return ConsentCategory(
      id: json['id'] as String,
      key: json['key'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      isRequired: json['is_required'] as bool? ?? false,
      isActive: json['is_active'] as bool? ?? true,
      sortOrder: json['sort_order'] as int? ?? 0,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

class UserConsent {
  final String id;
  final String userId;
  final String categoryKey;
  final bool isGranted;
  final DateTime? grantedAt;
  final DateTime? withdrawnAt;
  final String consentVersion;
  final DateTime createdAt;
  final DateTime updatedAt;

  UserConsent({
    required this.id,
    required this.userId,
    required this.categoryKey,
    required this.isGranted,
    this.grantedAt,
    this.withdrawnAt,
    required this.consentVersion,
    required this.createdAt,
    required this.updatedAt,
  });

  factory UserConsent.fromJson(Map<String, dynamic> json) {
    return UserConsent(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      categoryKey: json['category_key'] as String,
      isGranted: json['is_granted'] as bool? ?? false,
      grantedAt: json['granted_at'] != null 
          ? DateTime.parse(json['granted_at'] as String) 
          : null,
      withdrawnAt: json['withdrawn_at'] != null 
          ? DateTime.parse(json['withdrawn_at'] as String) 
          : null,
      consentVersion: json['consent_version'] as String? ?? '1.0',
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'category_key': categoryKey,
      'is_granted': isGranted,
      'granted_at': grantedAt?.toIso8601String(),
      'withdrawn_at': withdrawnAt?.toIso8601String(),
      'consent_version': consentVersion,
    };
  }
}

class ConsentAuditEntry {
  final String id;
  final String userId;
  final String categoryKey;
  final String action;
  final bool? previousValue;
  final bool newValue;
  final String consentVersion;
  final String? source;
  final DateTime createdAt;

  ConsentAuditEntry({
    required this.id,
    required this.userId,
    required this.categoryKey,
    required this.action,
    this.previousValue,
    required this.newValue,
    required this.consentVersion,
    this.source,
    required this.createdAt,
  });

  factory ConsentAuditEntry.fromJson(Map<String, dynamic> json) {
    return ConsentAuditEntry(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      categoryKey: json['category_key'] as String,
      action: json['action'] as String,
      previousValue: json['previous_value'] as bool?,
      newValue: json['new_value'] as bool,
      consentVersion: json['consent_version'] as String,
      source: json['source'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

class DataSubjectRequest {
  final String id;
  final String userId;
  final String requestType;
  final String status;
  final String? reason;
  final String? responseNotes;
  final DateTime requestedAt;
  final DateTime? processedAt;
  final DateTime? expiresAt;
  final DateTime createdAt;

  DataSubjectRequest({
    required this.id,
    required this.userId,
    required this.requestType,
    required this.status,
    this.reason,
    this.responseNotes,
    required this.requestedAt,
    this.processedAt,
    this.expiresAt,
    required this.createdAt,
  });

  factory DataSubjectRequest.fromJson(Map<String, dynamic> json) {
    return DataSubjectRequest(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      requestType: json['request_type'] as String,
      status: json['status'] as String,
      reason: json['reason'] as String?,
      responseNotes: json['response_notes'] as String?,
      requestedAt: DateTime.parse(json['requested_at'] as String),
      processedAt: json['processed_at'] != null 
          ? DateTime.parse(json['processed_at'] as String) 
          : null,
      expiresAt: json['expires_at'] != null 
          ? DateTime.parse(json['expires_at'] as String) 
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  String get requestTypeLabel {
    switch (requestType) {
      case 'access':
        return 'Data Access Request';
      case 'rectification':
        return 'Data Rectification';
      case 'erasure':
        return 'Right to Erasure';
      case 'portability':
        return 'Data Portability';
      case 'restriction':
        return 'Restrict Processing';
      case 'objection':
        return 'Object to Processing';
      default:
        return requestType;
    }
  }

  String get statusLabel {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  }
}

class PrivacyPolicyVersion {
  final String id;
  final String version;
  final String title;
  final String content;
  final String? summary;
  final DateTime effectiveDate;
  final bool isActive;
  final DateTime createdAt;

  PrivacyPolicyVersion({
    required this.id,
    required this.version,
    required this.title,
    required this.content,
    this.summary,
    required this.effectiveDate,
    required this.isActive,
    required this.createdAt,
  });

  factory PrivacyPolicyVersion.fromJson(Map<String, dynamic> json) {
    return PrivacyPolicyVersion(
      id: json['id'] as String,
      version: json['version'] as String,
      title: json['title'] as String,
      content: json['content'] as String,
      summary: json['summary'] as String?,
      effectiveDate: DateTime.parse(json['effective_date'] as String),
      isActive: json['is_active'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

/// Represents a consent category with its current user consent state
class ConsentPreference {
  final ConsentCategory category;
  final bool isGranted;
  final DateTime? lastUpdated;

  ConsentPreference({
    required this.category,
    required this.isGranted,
    this.lastUpdated,
  });

  ConsentPreference copyWith({bool? isGranted, DateTime? lastUpdated}) {
    return ConsentPreference(
      category: category,
      isGranted: isGranted ?? this.isGranted,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}
