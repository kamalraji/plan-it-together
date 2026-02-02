/// Organizer Application Model
/// Represents the full application for becoming an organizer on the platform.
/// Follows immutable pattern with factory constructors and copyWith.

// =============================================================================
// ENUMS
// =============================================================================

/// Application workflow status
enum ApplicationStatus {
  draft,
  submitted,
  underReview,
  approved,
  rejected,
  requiresMoreInfo;

  /// Parse from database snake_case string
  static ApplicationStatus fromString(String? value) {
    if (value == null) return ApplicationStatus.draft;
    
    final normalized = value.toLowerCase().replaceAll('_', '');
    return ApplicationStatus.values.firstWhere(
      (s) => s.name.toLowerCase() == normalized || 
             s.name.toLowerCase().replaceAll('_', '') == normalized,
      orElse: () => ApplicationStatus.draft,
    );
  }

  /// Convert to database snake_case string
  String toDbString() {
    return switch (this) {
      ApplicationStatus.draft => 'draft',
      ApplicationStatus.submitted => 'submitted',
      ApplicationStatus.underReview => 'under_review',
      ApplicationStatus.approved => 'approved',
      ApplicationStatus.rejected => 'rejected',
      ApplicationStatus.requiresMoreInfo => 'requires_more_info',
    };
  }

  /// User-friendly display label
  String get displayLabel => switch (this) {
    ApplicationStatus.draft => 'Draft',
    ApplicationStatus.submitted => 'Submitted',
    ApplicationStatus.underReview => 'Under Review',
    ApplicationStatus.approved => 'Approved',
    ApplicationStatus.rejected => 'Not Approved',
    ApplicationStatus.requiresMoreInfo => 'More Info Required',
  };

  /// Whether application is pending review
  bool get isPending => this == submitted || this == underReview;

  /// Whether application has reached terminal state
  bool get isTerminal => this == approved || this == rejected;

  /// Whether application can be edited
  bool get canEdit => this == draft || this == requiresMoreInfo;
}

/// Type of organization applying
enum OrganizationType {
  individual,
  company,
  ngo,
  educational,
  government;

  static OrganizationType fromString(String? value) {
    if (value == null) return OrganizationType.individual;
    return OrganizationType.values.firstWhere(
      (t) => t.name.toLowerCase() == value.toLowerCase(),
      orElse: () => OrganizationType.individual,
    );
  }

  String get displayLabel => switch (this) {
    OrganizationType.individual => 'Individual / Freelancer',
    OrganizationType.company => 'Company / Business',
    OrganizationType.ngo => 'Non-Profit / NGO',
    OrganizationType.educational => 'Educational Institution',
    OrganizationType.government => 'Government Body',
  };

  /// Alias for displayLabel for consistency
  String get label => displayLabel;

  /// Value for database storage
  String get value => name;
}

/// Organization size brackets
enum OrganizationSize {
  solo,
  small,      // 2-10
  medium,     // 11-50
  large,      // 51-200
  enterprise; // 200+

  static OrganizationSize? fromString(String? value) {
    if (value == null) return null;
    return switch (value.toLowerCase()) {
      'solo' => OrganizationSize.solo,
      '2-10' => OrganizationSize.small,
      '11-50' => OrganizationSize.medium,
      '51-200' => OrganizationSize.large,
      '200+' => OrganizationSize.enterprise,
      _ => null,
    };
  }

  String toDbString() => switch (this) {
    OrganizationSize.solo => 'solo',
    OrganizationSize.small => '2-10',
    OrganizationSize.medium => '11-50',
    OrganizationSize.large => '51-200',
    OrganizationSize.enterprise => '200+',
  };

  String get displayLabel => switch (this) {
    OrganizationSize.solo => 'Just me',
    OrganizationSize.small => '2-10 people',
    OrganizationSize.medium => '11-50 people',
    OrganizationSize.large => '51-200 people',
    OrganizationSize.enterprise => '200+ people',
  };

  /// Alias for displayLabel for consistency
  String get label => displayLabel;

  /// Value for database storage
  String get value => toDbString();
}

/// Past events count brackets
enum PastEventsCount {
  none,
  few,      // 1-5
  moderate, // 6-20
  many;     // 20+

  static PastEventsCount? fromString(String? value) {
    if (value == null) return null;
    return switch (value.toLowerCase()) {
      'none' => PastEventsCount.none,
      '1-5' => PastEventsCount.few,
      '6-20' => PastEventsCount.moderate,
      '20+' => PastEventsCount.many,
      _ => null,
    };
  }

  String toDbString() => switch (this) {
    PastEventsCount.none => 'none',
    PastEventsCount.few => '1-5',
    PastEventsCount.moderate => '6-20',
    PastEventsCount.many => '20+',
  };

  String get displayLabel => switch (this) {
    PastEventsCount.none => 'No events yet',
    PastEventsCount.few => '1-5 events',
    PastEventsCount.moderate => '6-20 events',
    PastEventsCount.many => '20+ events',
  };

  /// Alias for displayLabel for consistency
  String get label => displayLabel;

  /// Value for database storage
  String get value => toDbString();
}

/// Largest event size brackets
enum LargestEventSize {
  small,    // <50
  medium,   // 50-200
  large,    // 200-1000
  massive;  // 1000+

  static LargestEventSize? fromString(String? value) {
    if (value == null) return null;
    return switch (value) {
      '<50' => LargestEventSize.small,
      '50-200' => LargestEventSize.medium,
      '200-1000' => LargestEventSize.large,
      '1000+' => LargestEventSize.massive,
      _ => null,
    };
  }

  String toDbString() => switch (this) {
    LargestEventSize.small => '<50',
    LargestEventSize.medium => '50-200',
    LargestEventSize.large => '200-1000',
    LargestEventSize.massive => '1000+',
  };

  String get displayLabel => switch (this) {
    LargestEventSize.small => 'Under 50 attendees',
    LargestEventSize.medium => '50-200 attendees',
    LargestEventSize.large => '200-1000 attendees',
    LargestEventSize.massive => '1000+ attendees',
  };

  /// Alias for displayLabel for consistency
  String get label => displayLabel;

  /// Value for database storage
  String get value => toDbString();
}

/// Event type options for applications
enum EventTypeOption {
  conference,
  workshop,
  hackathon,
  meetup,
  webinar,
  competition,
  networking,
  other;

  static EventTypeOption? fromString(String? value) {
    if (value == null) return null;
    return EventTypeOption.values.firstWhere(
      (t) => t.name.toLowerCase() == value.toLowerCase(),
      orElse: () => EventTypeOption.other,
    );
  }

  String get displayLabel => switch (this) {
    EventTypeOption.conference => 'Conference',
    EventTypeOption.workshop => 'Workshop',
    EventTypeOption.hackathon => 'Hackathon',
    EventTypeOption.meetup => 'Meetup',
    EventTypeOption.webinar => 'Webinar',
    EventTypeOption.competition => 'Competition',
    EventTypeOption.networking => 'Networking Event',
    EventTypeOption.other => 'Other',
  };

  /// Alias for displayLabel for consistency  
  String get label => displayLabel;

  /// Value for database storage
  String get value => name;
}

/// Verification document types
enum VerificationDocumentType {
  businessLicense,
  registrationCert,
  taxId,
  identity;

  static VerificationDocumentType? fromString(String? value) {
    if (value == null) return null;
    return switch (value.toLowerCase().replaceAll('_', '')) {
      'businesslicense' => VerificationDocumentType.businessLicense,
      'registrationcert' => VerificationDocumentType.registrationCert,
      'taxid' => VerificationDocumentType.taxId,
      'identity' => VerificationDocumentType.identity,
      _ => null,
    };
  }

  String toDbString() => switch (this) {
    VerificationDocumentType.businessLicense => 'business_license',
    VerificationDocumentType.registrationCert => 'registration_cert',
    VerificationDocumentType.taxId => 'tax_id',
    VerificationDocumentType.identity => 'identity',
  };

  String get displayLabel => switch (this) {
    VerificationDocumentType.businessLicense => 'Business License',
    VerificationDocumentType.registrationCert => 'Registration Certificate',
    VerificationDocumentType.taxId => 'Tax ID / PAN',
    VerificationDocumentType.identity => 'Government ID',
  };
}

// =============================================================================
// SUPPORTING MODELS
// =============================================================================

/// Additional document attached to application
class ApplicationDocument {
  final String url;
  final String type;
  final String name;
  final int? sizeBytes;
  final DateTime uploadedAt;

  const ApplicationDocument({
    required this.url,
    required this.type,
    required this.name,
    this.sizeBytes,
    required this.uploadedAt,
  });

  factory ApplicationDocument.fromJson(Map<String, dynamic> json) {
    return ApplicationDocument(
      url: json['url'] as String? ?? '',
      type: json['type'] as String? ?? '',
      name: json['name'] as String? ?? 'Document',
      sizeBytes: json['size_bytes'] as int?,
      uploadedAt: DateTime.tryParse(json['uploaded_at'] as String? ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'url': url,
    'type': type,
    'name': name,
    'size_bytes': sizeBytes,
    'uploaded_at': uploadedAt.toIso8601String(),
  };
}

/// Status history entry for audit trail
class ApplicationStatusEntry {
  final String id;
  final String applicationId;
  final String? previousStatus;
  final String newStatus;
  final String? changedBy;
  final String? reason;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;

  const ApplicationStatusEntry({
    required this.id,
    required this.applicationId,
    this.previousStatus,
    required this.newStatus,
    this.changedBy,
    this.reason,
    this.metadata,
    required this.createdAt,
  });

  factory ApplicationStatusEntry.fromJson(Map<String, dynamic> json) {
    return ApplicationStatusEntry(
      id: json['id'] as String,
      applicationId: json['application_id'] as String,
      previousStatus: json['previous_status'] as String?,
      newStatus: json['new_status'] as String,
      changedBy: json['changed_by'] as String?,
      reason: json['reason'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  ApplicationStatus get parsedNewStatus => ApplicationStatus.fromString(newStatus);
  ApplicationStatus? get parsedPreviousStatus => 
      previousStatus != null ? ApplicationStatus.fromString(previousStatus) : null;
}

// =============================================================================
// MAIN MODEL
// =============================================================================

/// Immutable organizer application model
class OrganizerApplication {
  final String id;
  final String userId;

  // Step 1: Organization Details
  final String organizationName;
  final OrganizationType organizationType;
  final String? organizationWebsite;
  final OrganizationSize? organizationSize;
  final String? organizationDescription;

  // Step 2: Experience
  final PastEventsCount? pastEventsCount;
  final List<String> eventTypes;
  final LargestEventSize? largestEventSize;
  final String? experienceDescription;
  final List<String> portfolioLinks;

  // Step 3: Documents
  final String? verificationDocumentUrl;
  final VerificationDocumentType? verificationDocumentType;
  final List<ApplicationDocument> additionalDocuments;

  // Status & Review
  final ApplicationStatus status;
  final DateTime? submittedAt;
  final DateTime? reviewedAt;
  final String? reviewedBy;
  final String? rejectionReason;
  final String? adminNotes;
  final String? adminRequestMessage;

  // Timestamps
  final DateTime createdAt;
  final DateTime updatedAt;

  const OrganizerApplication({
    required this.id,
    required this.userId,
    required this.organizationName,
    required this.organizationType,
    this.organizationWebsite,
    this.organizationSize,
    this.organizationDescription,
    this.pastEventsCount,
    this.eventTypes = const [],
    this.largestEventSize,
    this.experienceDescription,
    this.portfolioLinks = const [],
    this.verificationDocumentUrl,
    this.verificationDocumentType,
    this.additionalDocuments = const [],
    required this.status,
    this.submittedAt,
    this.reviewedAt,
    this.reviewedBy,
    this.rejectionReason,
    this.adminNotes,
    this.adminRequestMessage,
    required this.createdAt,
    required this.updatedAt,
  });

  // ===========================================================================
  // COMPUTED PROPERTIES
  // ===========================================================================

  /// Calculate completion percentage for progress indicator
  int get completionPercentage {
    int score = 0;
    
    // Step 1: Organization (40 points)
    if (organizationName.trim().isNotEmpty) score += 15;
    if (organizationDescription?.trim().isNotEmpty == true) score += 15;
    if (organizationWebsite?.trim().isNotEmpty == true) score += 5;
    if (organizationSize != null) score += 5;

    // Step 2: Experience (30 points)
    if (pastEventsCount != null) score += 10;
    if (eventTypes.isNotEmpty) score += 10;
    if (experienceDescription?.trim().isNotEmpty == true) score += 10;

    // Step 3: Documents (30 points)
    if (verificationDocumentUrl != null) score += 25;
    if (additionalDocuments.isNotEmpty) score += 5;

    return score.clamp(0, 100);
  }

  /// Whether application meets minimum requirements for submission
  bool get canSubmit => 
      organizationName.trim().isNotEmpty &&
      organizationDescription?.trim().isNotEmpty == true &&
      verificationDocumentUrl != null &&
      verificationDocumentType != null;

  /// Whether user can edit the application
  bool get canEdit => status.canEdit;

  /// Whether application is awaiting review
  bool get isPending => status.isPending;

  /// Whether application has completed the review process
  bool get isComplete => status.isTerminal;

  /// Step 1 completion check
  bool get isStep1Complete => 
      organizationName.trim().isNotEmpty &&
      organizationDescription?.trim().isNotEmpty == true;

  /// Step 2 completion check (optional but tracked)
  bool get isStep2Complete => 
      pastEventsCount != null || 
      eventTypes.isNotEmpty;

  /// Step 3 completion check
  bool get isStep3Complete => 
      verificationDocumentUrl != null &&
      verificationDocumentType != null;

  // ===========================================================================
  // FACTORY CONSTRUCTORS
  // ===========================================================================

  /// Create from Supabase JSON response
  factory OrganizerApplication.fromJson(Map<String, dynamic> json) {
    // Parse additional documents from JSONB
    final additionalDocsRaw = json['additional_documents'];
    List<ApplicationDocument> additionalDocs = [];
    if (additionalDocsRaw is List) {
      additionalDocs = additionalDocsRaw
          .whereType<Map<String, dynamic>>()
          .map((e) => ApplicationDocument.fromJson(e))
          .toList();
    }

    // Parse event types from TEXT[]
    final eventTypesRaw = json['event_types'];
    List<String> eventTypes = [];
    if (eventTypesRaw is List) {
      eventTypes = eventTypesRaw.cast<String>();
    }

    // Parse portfolio links from TEXT[]
    final portfolioLinksRaw = json['portfolio_links'];
    List<String> portfolioLinks = [];
    if (portfolioLinksRaw is List) {
      portfolioLinks = portfolioLinksRaw.cast<String>();
    }

    return OrganizerApplication(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      organizationName: json['organization_name'] as String? ?? '',
      organizationType: OrganizationType.fromString(json['organization_type'] as String?),
      organizationWebsite: json['organization_website'] as String?,
      organizationSize: OrganizationSize.fromString(json['organization_size'] as String?),
      organizationDescription: json['organization_description'] as String?,
      pastEventsCount: PastEventsCount.fromString(json['past_events_count'] as String?),
      eventTypes: eventTypes,
      largestEventSize: LargestEventSize.fromString(json['largest_event_size'] as String?),
      experienceDescription: json['experience_description'] as String?,
      portfolioLinks: portfolioLinks,
      verificationDocumentUrl: json['verification_document_url'] as String?,
      verificationDocumentType: VerificationDocumentType.fromString(
        json['verification_document_type'] as String?,
      ),
      additionalDocuments: additionalDocs,
      status: ApplicationStatus.fromString(json['status'] as String?),
      submittedAt: json['submitted_at'] != null 
          ? DateTime.tryParse(json['submitted_at'] as String) 
          : null,
      reviewedAt: json['reviewed_at'] != null 
          ? DateTime.tryParse(json['reviewed_at'] as String) 
          : null,
      reviewedBy: json['reviewed_by'] as String?,
      rejectionReason: json['rejection_reason'] as String?,
      adminNotes: json['admin_notes'] as String?,
      adminRequestMessage: json['admin_request_message'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  /// Create empty draft for new application
  factory OrganizerApplication.empty(String userId) {
    final now = DateTime.now();
    return OrganizerApplication(
      id: '',
      userId: userId,
      organizationName: '',
      organizationType: OrganizationType.individual,
      status: ApplicationStatus.draft,
      createdAt: now,
      updatedAt: now,
    );
  }

  // ===========================================================================
  // SERIALIZATION
  // ===========================================================================

  /// Convert to JSON for Supabase updates
  /// Only includes fields that should be updated by the user
  Map<String, dynamic> toUpdateJson() => {
    'organization_name': organizationName,
    'organization_type': organizationType.name,
    'organization_website': organizationWebsite,
    'organization_size': organizationSize?.toDbString(),
    'organization_description': organizationDescription,
    'past_events_count': pastEventsCount?.toDbString(),
    'event_types': eventTypes,
    'largest_event_size': largestEventSize?.toDbString(),
    'experience_description': experienceDescription,
    'portfolio_links': portfolioLinks,
    'verification_document_url': verificationDocumentUrl,
    'verification_document_type': verificationDocumentType?.toDbString(),
    'additional_documents': additionalDocuments.map((d) => d.toJson()).toList(),
  };

  // ===========================================================================
  // COPY WITH
  // ===========================================================================

  OrganizerApplication copyWith({
    String? id,
    String? userId,
    String? organizationName,
    OrganizationType? organizationType,
    String? organizationWebsite,
    OrganizationSize? organizationSize,
    String? organizationDescription,
    PastEventsCount? pastEventsCount,
    List<String>? eventTypes,
    LargestEventSize? largestEventSize,
    String? experienceDescription,
    List<String>? portfolioLinks,
    String? verificationDocumentUrl,
    VerificationDocumentType? verificationDocumentType,
    List<ApplicationDocument>? additionalDocuments,
    ApplicationStatus? status,
    DateTime? submittedAt,
    DateTime? reviewedAt,
    String? reviewedBy,
    String? rejectionReason,
    String? adminNotes,
    String? adminRequestMessage,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return OrganizerApplication(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      organizationName: organizationName ?? this.organizationName,
      organizationType: organizationType ?? this.organizationType,
      organizationWebsite: organizationWebsite ?? this.organizationWebsite,
      organizationSize: organizationSize ?? this.organizationSize,
      organizationDescription: organizationDescription ?? this.organizationDescription,
      pastEventsCount: pastEventsCount ?? this.pastEventsCount,
      eventTypes: eventTypes ?? this.eventTypes,
      largestEventSize: largestEventSize ?? this.largestEventSize,
      experienceDescription: experienceDescription ?? this.experienceDescription,
      portfolioLinks: portfolioLinks ?? this.portfolioLinks,
      verificationDocumentUrl: verificationDocumentUrl ?? this.verificationDocumentUrl,
      verificationDocumentType: verificationDocumentType ?? this.verificationDocumentType,
      additionalDocuments: additionalDocuments ?? this.additionalDocuments,
      status: status ?? this.status,
      submittedAt: submittedAt ?? this.submittedAt,
      reviewedAt: reviewedAt ?? this.reviewedAt,
      reviewedBy: reviewedBy ?? this.reviewedBy,
      rejectionReason: rejectionReason ?? this.rejectionReason,
      adminNotes: adminNotes ?? this.adminNotes,
      adminRequestMessage: adminRequestMessage ?? this.adminRequestMessage,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  String toString() => 'OrganizerApplication(id: $id, status: $status, org: $organizationName)';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OrganizerApplication && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}
