/// Conference/Workshop-specific models for Zone features

class EventTrack {
  final String id;
  final String eventId;
  final String name;
  final String? description;
  final String color;
  final String icon;
  final String? location;
  final int sortOrder;
  final DateTime createdAt;

  EventTrack({
    required this.id,
    required this.eventId,
    required this.name,
    this.description,
    this.color = '#6366f1',
    this.icon = 'event',
    this.location,
    this.sortOrder = 0,
    required this.createdAt,
  });

  factory EventTrack.fromJson(Map<String, dynamic> json) {
    return EventTrack(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      color: json['color'] as String? ?? '#6366f1',
      icon: json['icon'] as String? ?? 'event',
      location: json['location'] as String?,
      sortOrder: json['sort_order'] as int? ?? 0,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

class SponsorBooth {
  final String id;
  final String eventId;
  final String sponsorName;
  final String? sponsorLogo;
  final String tier;
  final String? boothNumber;
  final String? location;
  final String? description;
  final String? website;
  final Map<String, dynamic> socialLinks;
  final List<String> offerings;
  final bool isActive;
  final int visitCount;
  final DateTime createdAt;
  final bool hasVisited;

  SponsorBooth({
    required this.id,
    required this.eventId,
    required this.sponsorName,
    this.sponsorLogo,
    this.tier = 'silver',
    this.boothNumber,
    this.location,
    this.description,
    this.website,
    this.socialLinks = const {},
    this.offerings = const [],
    this.isActive = true,
    this.visitCount = 0,
    required this.createdAt,
    this.hasVisited = false,
  });

  factory SponsorBooth.fromJson(Map<String, dynamic> json, {bool hasVisited = false}) {
    return SponsorBooth(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      sponsorName: json['sponsor_name'] as String,
      sponsorLogo: json['sponsor_logo'] as String?,
      tier: json['tier'] as String? ?? 'silver',
      boothNumber: json['booth_number'] as String?,
      location: json['location'] as String?,
      description: json['description'] as String?,
      website: json['website'] as String?,
      socialLinks: (json['social_links'] as Map<String, dynamic>?) ?? {},
      offerings: List<String>.from(json['offerings'] ?? []),
      isActive: json['is_active'] as bool? ?? true,
      visitCount: json['visit_count'] as int? ?? 0,
      createdAt: DateTime.parse(json['created_at'] as String),
      hasVisited: hasVisited,
    );
  }

  int get tierPriority {
    switch (tier) {
      case 'platinum': return 0;
      case 'gold': return 1;
      case 'silver': return 2;
      case 'bronze': return 3;
      case 'partner': return 4;
      default: return 5;
    }
  }

  String get tierDisplayName {
    switch (tier) {
      case 'platinum': return 'Platinum';
      case 'gold': return 'Gold';
      case 'silver': return 'Silver';
      case 'bronze': return 'Bronze';
      case 'partner': return 'Partner';
      default: return tier;
    }
  }
}

class EventMaterial {
  final String id;
  final String eventId;
  final String? sessionId;
  final String title;
  final String? description;
  final String materialType;
  final String? fileUrl;
  final String? externalLink;
  final int? fileSize;
  final bool isDownloadable;
  final bool isPublic;
  final int sortOrder;
  final String? createdBy;
  final DateTime createdAt;
  final bool hasDownloaded;

  EventMaterial({
    required this.id,
    required this.eventId,
    this.sessionId,
    required this.title,
    this.description,
    required this.materialType,
    this.fileUrl,
    this.externalLink,
    this.fileSize,
    this.isDownloadable = true,
    this.isPublic = false,
    this.sortOrder = 0,
    this.createdBy,
    required this.createdAt,
    this.hasDownloaded = false,
  });

  factory EventMaterial.fromJson(Map<String, dynamic> json, {bool hasDownloaded = false}) {
    return EventMaterial(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      sessionId: json['session_id'] as String?,
      title: json['title'] as String,
      description: json['description'] as String?,
      materialType: json['material_type'] as String,
      fileUrl: json['file_url'] as String?,
      externalLink: json['external_link'] as String?,
      fileSize: json['file_size'] as int?,
      isDownloadable: json['is_downloadable'] as bool? ?? true,
      isPublic: json['is_public'] as bool? ?? false,
      sortOrder: json['sort_order'] as int? ?? 0,
      createdBy: json['created_by'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      hasDownloaded: hasDownloaded,
    );
  }

  String get typeIcon {
    switch (materialType) {
      case 'slides': return '📊';
      case 'document': return '📄';
      case 'code': return '💻';
      case 'video': return '🎬';
      case 'link': return '🔗';
      case 'exercise': return '✍️';
      case 'template': return '📋';
      default: return '📁';
    }
  }

  String get typeDisplayName {
    switch (materialType) {
      case 'slides': return 'Slides';
      case 'document': return 'Document';
      case 'code': return 'Code';
      case 'video': return 'Video';
      case 'link': return 'Link';
      case 'exercise': return 'Exercise';
      case 'template': return 'Template';
      default: return materialType;
    }
  }

  String get formattedFileSize {
    if (fileSize == null) return '';
    if (fileSize! < 1024) return '$fileSize B';
    if (fileSize! < 1024 * 1024) return '${(fileSize! / 1024).toStringAsFixed(1)} KB';
    return '${(fileSize! / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}

class WorkshopProgress {
  final String id;
  final String eventId;
  final String userId;
  final int currentStep;
  final int totalSteps;
  final DateTime startedAt;
  final DateTime? completedAt;
  final DateTime lastActivityAt;
  final Map<String, dynamic> notes;

  WorkshopProgress({
    required this.id,
    required this.eventId,
    required this.userId,
    this.currentStep = 0,
    this.totalSteps = 1,
    required this.startedAt,
    this.completedAt,
    required this.lastActivityAt,
    this.notes = const {},
  });

  factory WorkshopProgress.fromJson(Map<String, dynamic> json) {
    return WorkshopProgress(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      userId: json['user_id'] as String,
      currentStep: json['current_step'] as int? ?? 0,
      totalSteps: json['total_steps'] as int? ?? 1,
      startedAt: DateTime.parse(json['started_at'] as String),
      completedAt: json['completed_at'] != null
          ? DateTime.parse(json['completed_at'] as String)
          : null,
      lastActivityAt: DateTime.parse(json['last_activity_at'] as String),
      notes: (json['notes'] as Map<String, dynamic>?) ?? {},
    );
  }

  bool get isCompleted => completedAt != null;
  double get progressPercentage => totalSteps > 0 ? currentStep / totalSteps : 0;
}
