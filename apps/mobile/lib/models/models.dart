import 'package:flutter/material.dart';

// ==========================
// ENUMS
// ==========================

enum EventMode { ONLINE, OFFLINE, HYBRID }

/// Event categories matching the Supabase database enum.
/// 
/// These values must stay in sync with the `event_category` enum 
/// defined in the database. Any additions or removals must be 
/// coordinated with database migrations.
/// 
/// Total: 41 categories matching TypeScript enum in types.ts
/// 
/// See also:
/// - [CategoryUtils] for parsing and validation utilities
/// - [IconMappings.getEventCategoryIcon] for category icons
/// - [IconMappings.getEventCategoryColor] for category colors
enum EventCategory {
  // === Database order (matching Supabase enum) ===
  
  /// Technology competitions with coding challenges
  HACKATHON,
  /// Intensive training programs
  BOOTCAMP,
  /// Hands-on learning sessions
  WORKSHOP,
  /// Large-scale professional gatherings
  CONFERENCE,
  /// Community gatherings
  MEETUP,
  /// Startup presentation events
  STARTUP_PITCH,
  /// Recruitment coding challenges
  HIRING_CHALLENGE,
  /// Online presentations
  WEBINAR,
  /// Competitive events
  COMPETITION,
  /// Uncategorized events
  OTHER,
  /// Educational presentations
  SEMINAR,
  /// Academic conferences
  SYMPOSIUM,
  /// Cultural celebrations
  CULTURAL_FEST,
  /// Athletic competitions
  SPORTS_EVENT,
  /// Introductory sessions
  ORIENTATION,
  /// Alumni reunions
  ALUMNI_MEET,
  /// Job fairs
  CAREER_FAIR,
  /// Educational talks
  LECTURE,
  /// Knowledge competitions
  QUIZ,
  /// Formal discussions
  DEBATE,
  /// Product announcements
  PRODUCT_LAUNCH,
  /// Company-wide meetings
  TOWN_HALL,
  /// Team bonding activities
  TEAM_BUILDING,
  /// Professional development
  TRAINING,
  /// Recognition ceremonies
  AWARDS_CEREMONY,
  /// Remote team events
  OFFSITE,
  /// Professional connections
  NETWORKING,
  /// Industry exhibitions
  TRADE_SHOW,
  /// Large exhibitions
  EXPO,
  /// Executive gatherings
  SUMMIT,
  /// Expert discussions
  PANEL_DISCUSSION,
  /// Product demonstrations
  DEMO_DAY,
  /// Charity fundraising
  FUNDRAISER,
  /// Formal celebrations
  GALA,
  /// Charitable events
  CHARITY_EVENT,
  /// Volunteer recruitment
  VOLUNTEER_DRIVE,
  /// Cause promotion
  AWARENESS_CAMPAIGN,
  /// Music performances
  CONCERT,
  /// Art displays
  EXHIBITION,
  /// Multi-day celebrations
  FESTIVAL,
  /// Casual meetups
  SOCIAL_GATHERING,
}

enum EventVisibility { PUBLIC, PRIVATE, UNLISTED }

enum EventStatus { DRAFT, PUBLISHED, ONGOING, COMPLETED, CANCELLED }

enum RegistrationStatus { PENDING, CONFIRMED, WAITLISTED, CANCELLED }

// ==========================
// SUPPORTING CLASSES
// ==========================

class EventBranding {
  final String bannerUrl;
  final String logoUrl;
  final String? primaryColor;
  final String? secondaryColor;

  const EventBranding({
    required this.bannerUrl,
    required this.logoUrl,
    this.primaryColor,
    this.secondaryColor,
  });

  Map<String, dynamic> toJson() => {
    'banner_url': bannerUrl,
    'logo_url': logoUrl,
    'primary_color': primaryColor,
    'secondary_color': secondaryColor,
  };

  factory EventBranding.fromJson(Map<String, dynamic> json) => EventBranding(
    bannerUrl: json['banner_url'] as String,
    logoUrl: json['logo_url'] as String,
    primaryColor: json['primary_color'] as String?,
    secondaryColor: json['secondary_color'] as String?,
  );
}

class Organization {
  final String id;
  final String name;
  final String slug;
  final String logoUrl;
  final String verificationStatus;

  const Organization({
    required this.id,
    required this.name,
    required this.slug,
    required this.logoUrl,
    required this.verificationStatus,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'slug': slug,
    'logo_url': logoUrl,
    'verification_status': verificationStatus,
  };

  factory Organization.fromJson(Map<String, dynamic> json) {
    String _s(dynamic v, [String d = '']) => v is String ? v : (v?.toString() ?? d);
    return Organization(
      id: _s(json['id']),
      name: _s(json['name'], 'Unknown Organization'),
      slug: _s(json['slug']),
      logoUrl: _s(json['logo_url']),
      verificationStatus: _s(json['verification_status'], 'PENDING'),
    );
  }
}

// ==========================
// MODELS
// ==========================

class Event {
  final String id;
  final String name;
  final String? description;
  final EventMode mode;
  final EventCategory category;
  final DateTime startDate;
  final DateTime endDate;
  final int? capacity;
  final EventVisibility visibility;
  final EventStatus status;
  final String? landingPageSlug;
  final EventBranding branding;
  final Organization organization;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? venue;
  final String? venueName;
  final String? address;
  final String? city;
  final double? latitude;
  final double? longitude;
  
  // Phase 1 new columns
  final String timezone;
  final DateTime? registrationDeadline;
  final String registrationType; // 'OPEN', 'APPROVAL', 'INVITE_ONLY', 'CLOSED'
  final bool isFree;
  final bool allowWaitlist;
  final String? contactEmail;
  final String? contactPhone;
  final String? eventWebsite;
  final int? minAge;
  final int? maxAge;
  final String language;

  const Event({
    required this.id,
    required this.name,
    required this.description,
    required this.mode,
    required this.category,
    required this.startDate,
    required this.endDate,
    required this.capacity,
    required this.visibility,
    required this.status,
    required this.landingPageSlug,
    required this.branding,
    required this.organization,
    required this.createdAt,
    required this.updatedAt,
    this.venue,
    this.venueName,
    this.address,
    this.city,
    this.latitude,
    this.longitude,
    this.timezone = 'UTC',
    this.registrationDeadline,
    this.registrationType = 'OPEN',
    this.isFree = true,
    this.allowWaitlist = false,
    this.contactEmail,
    this.contactPhone,
    this.eventWebsite,
    this.minAge,
    this.maxAge,
    this.language = 'en',
  });

  /// Get banner URL from branding
  String? get bannerUrl => branding.bannerUrl.isNotEmpty ? branding.bannerUrl : null;
  
  /// Whether registration is currently open
  bool get isRegistrationOpen {
    if (registrationType == 'CLOSED') return false;
    if (registrationDeadline != null && DateTime.now().isAfter(registrationDeadline!)) {
      return false;
    }
    return status == EventStatus.PUBLISHED;
  }
  
  /// Whether event has age restrictions
  bool get hasAgeRestriction => minAge != null || maxAge != null;

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'description': description,
    'mode': mode.name,
    'category': category.name,
    'start_date': startDate.toIso8601String(),
    'end_date': endDate.toIso8601String(),
    'capacity': capacity,
    'visibility': visibility.name,
    'status': status.name,
    'landing_page_slug': landingPageSlug,
    'branding': branding.toJson(),
    'organization_id': organization.id,
    'created_at': createdAt.toIso8601String(),
    'updated_at': updatedAt.toIso8601String(),
    'venue': venue,
    'venue_name': venueName,
    'address': address,
    'city': city,
    'latitude': latitude,
    'longitude': longitude,
    'timezone': timezone,
    'registration_deadline': registrationDeadline?.toIso8601String(),
    'registration_type': registrationType,
    'is_free': isFree,
    'allow_waitlist': allowWaitlist,
    'contact_email': contactEmail,
    'contact_phone': contactPhone,
    'event_website': eventWebsite,
    'min_age': minAge,
    'max_age': maxAge,
    'language': language,
  };

  factory Event.fromJson(Map<String, dynamic> json) {
    String _s(dynamic v, [String d = '']) => v is String ? v : (v?.toString() ?? d);
    DateTime _dt(dynamic v, [DateTime? d]) {
      if (v == null) return d ?? DateTime.now();
      if (v is String) {
        try { return DateTime.parse(v); } catch (_) { return d ?? DateTime.now(); }
      }
      return d ?? DateTime.now();
    }
    DateTime? _dtNullable(dynamic v) {
      if (v == null) return null;
      if (v is String) {
        try { return DateTime.parse(v); } catch (_) { return null; }
      }
      return null;
    }

    // Parse branding JSON
    EventBranding? branding;
    final rawBranding = json['branding'];
    if (rawBranding is Map) {
      final brandingData = Map<String, dynamic>.from(rawBranding);
      if (brandingData.isNotEmpty) {
        try { branding = EventBranding.fromJson(brandingData); } catch (_) {}
      }
    }
    
    // Parse organization
    Organization? organization;
    final rawOrg = json['organization'];
    if (rawOrg is Map) {
      try { organization = Organization.fromJson(Map<String, dynamic>.from(rawOrg)); } catch (_) {}
    }
    
    final modeStr = _s(json['mode']).toUpperCase();
    final visStr = _s(json['visibility']).toUpperCase();
    final statusStr = _s(json['status']).toUpperCase();
    final catStr = _s(json['category']).toUpperCase();

    EventMode mode = EventMode.ONLINE;
    for (final m in EventMode.values) { if (m.name == modeStr) { mode = m; break; } }

    EventVisibility visibility = EventVisibility.PUBLIC;
    for (final v in EventVisibility.values) { if (v.name == visStr) { visibility = v; break; } }

    EventStatus status = EventStatus.PUBLISHED;
    for (final s in EventStatus.values) { if (s.name == statusStr) { status = s; break; } }

    EventCategory category = EventCategory.OTHER;
    for (final c in EventCategory.values) { if (c.name == catStr) { category = c; break; } }

    final start = _dt(json['start_date']);
    final end = _dt(json['end_date'], start.add(const Duration(hours: 2)));

    return Event(
      id: _s(json['id']),
      name: _s(json['name'], 'Untitled Event'),
      description: json['description'] as String?,
      mode: mode,
      category: category,
      startDate: start,
      endDate: end,
      capacity: json['capacity'] is int ? json['capacity'] as int : (json['capacity'] as num?)?.toInt(),
      visibility: visibility,
      status: status,
      landingPageSlug: json['landing_page_slug'] as String?,
      branding: branding ?? const EventBranding(
        bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
        logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9',
      ),
      organization: organization ?? const Organization(
        id: '',
        name: 'Unknown Organization',
        slug: 'unknown',
        logoUrl: '',
        verificationStatus: 'PENDING',
      ),
      createdAt: _dt(json['created_at'], start),
      updatedAt: _dt(json['updated_at'], start),
      venue: json['venue'] as String?,
      venueName: json['venue_name'] as String?,
      address: json['address'] as String?,
      city: json['city'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      timezone: json['timezone'] as String? ?? 'UTC',
      registrationDeadline: _dtNullable(json['registration_deadline']),
      registrationType: json['registration_type'] as String? ?? 'OPEN',
      isFree: json['is_free'] as bool? ?? true,
      allowWaitlist: json['allow_waitlist'] as bool? ?? false,
      contactEmail: json['contact_email'] as String?,
      contactPhone: json['contact_phone'] as String?,
      eventWebsite: json['event_website'] as String?,
      minAge: json['min_age'] as int?,
      maxAge: json['max_age'] as int?,
      language: json['language'] as String? ?? 'en',
    );
  }

  Event copyWith({
    String? id,
    String? name,
    String? description,
    EventMode? mode,
    EventCategory? category,
    DateTime? startDate,
    DateTime? endDate,
    int? capacity,
    EventVisibility? visibility,
    EventStatus? status,
    String? landingPageSlug,
    EventBranding? branding,
    Organization? organization,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? venue,
    String? venueName,
    String? address,
    String? city,
    double? latitude,
    double? longitude,
    String? timezone,
    DateTime? registrationDeadline,
    String? registrationType,
    bool? isFree,
    bool? allowWaitlist,
    String? contactEmail,
    String? contactPhone,
    String? eventWebsite,
    int? minAge,
    int? maxAge,
    String? language,
  }) => Event(
    id: id ?? this.id,
    name: name ?? this.name,
    description: description ?? this.description,
    mode: mode ?? this.mode,
    category: category ?? this.category,
    startDate: startDate ?? this.startDate,
    endDate: endDate ?? this.endDate,
    capacity: capacity ?? this.capacity,
    visibility: visibility ?? this.visibility,
    status: status ?? this.status,
    landingPageSlug: landingPageSlug ?? this.landingPageSlug,
    branding: branding ?? this.branding,
    organization: organization ?? this.organization,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
    venue: venue ?? this.venue,
    venueName: venueName ?? this.venueName,
    address: address ?? this.address,
    city: city ?? this.city,
    latitude: latitude ?? this.latitude,
    longitude: longitude ?? this.longitude,
    timezone: timezone ?? this.timezone,
    registrationDeadline: registrationDeadline ?? this.registrationDeadline,
    registrationType: registrationType ?? this.registrationType,
    isFree: isFree ?? this.isFree,
    allowWaitlist: allowWaitlist ?? this.allowWaitlist,
    contactEmail: contactEmail ?? this.contactEmail,
    contactPhone: contactPhone ?? this.contactPhone,
    eventWebsite: eventWebsite ?? this.eventWebsite,
    minAge: minAge ?? this.minAge,
    maxAge: maxAge ?? this.maxAge,
    language: language ?? this.language,
  );
}

class TicketTier {
  final String id;
  final String eventId;
  final String name;
  final String? description;
  final double price;
  final String currency;
  final int? quantity;
  final int soldCount;
  final DateTime? saleStart;
  final DateTime? saleEnd;
  final bool isActive;
  final int sortOrder;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int? maxPerOrder;
  final int? capacity;
  final int? registered;

  const TicketTier({
    required this.id,
    required this.eventId,
    required this.name,
    required this.description,
    required this.price,
    required this.currency,
    required this.quantity,
    required this.soldCount,
    required this.saleStart,
    required this.saleEnd,
    required this.isActive,
    required this.sortOrder,
    required this.createdAt,
    required this.updatedAt,
    this.maxPerOrder,
    this.capacity,
    this.registered,
  });

  bool get isFree => price == 0;
  
  /// Whether this tier has unlimited capacity (null quantity/capacity)
  bool get isUnlimited => (capacity ?? quantity) == null;
  
  /// Available tickets = capacity - registered (or quantity - soldCount)
  /// Returns a very large number if unlimited (null quantity/capacity)
  int get available {
    final totalCapacity = capacity ?? quantity;
    final sold = registered ?? soldCount;
    
    // If no limit is set, treat as unlimited
    if (totalCapacity == null) {
      return 999999; // Effectively unlimited
    }
    
    return totalCapacity - sold;
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'event_id': eventId,
    'name': name,
    'description': description,
    'price': price,
    'currency': currency,
    'quantity': quantity,
    'sold_count': soldCount,
    'sale_start': saleStart?.toIso8601String(),
    'sale_end': saleEnd?.toIso8601String(),
    'is_active': isActive,
    'sort_order': sortOrder,
    'created_at': createdAt.toIso8601String(),
    'updated_at': updatedAt.toIso8601String(),
    'max_per_order': maxPerOrder,
    'capacity': capacity,
    'registered': registered,
  };

  factory TicketTier.fromJson(Map<String, dynamic> json) {
    String _s(dynamic v, [String d = '']) => v is String ? v : (v?.toString() ?? d);
    DateTime? _dt(dynamic v) {
      if (v == null) return null;
      if (v is String) { try { return DateTime.parse(v); } catch (_) { return null; } }
      return null;
    }
    double _d(dynamic v, [double d = 0]) => v is num ? v.toDouble() : d;
    int? _i(dynamic v) => v is int ? v : (v is num ? v.toInt() : null);

    return TicketTier(
      id: _s(json['id']),
      eventId: _s(json['event_id']),
      name: _s(json['name'], 'General'),
      description: json['description'] as String?,
      price: _d(json['price']),
      currency: _s(json['currency'], 'INR'),
      quantity: _i(json['quantity']),
      soldCount: _i(json['sold_count']) ?? 0,
      saleStart: _dt(json['sale_start']),
      saleEnd: _dt(json['sale_end']),
      isActive: json['is_active'] is bool ? json['is_active'] as bool : true,
      sortOrder: _i(json['sort_order']) ?? 0,
      createdAt: _dt(json['created_at']) ?? DateTime.now(),
      updatedAt: _dt(json['updated_at']) ?? DateTime.now(),
      maxPerOrder: _i(json['max_per_order']),
      capacity: _i(json['capacity']),
      registered: _i(json['registered']),
    );
  }

  TicketTier copyWith({
    String? id,
    String? eventId,
    String? name,
    String? description,
    double? price,
    String? currency,
    int? quantity,
    int? soldCount,
    DateTime? saleStart,
    DateTime? saleEnd,
    bool? isActive,
    int? sortOrder,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? maxPerOrder,
    int? capacity,
    int? registered,
  }) => TicketTier(
    id: id ?? this.id,
    eventId: eventId ?? this.eventId,
    name: name ?? this.name,
    description: description ?? this.description,
    price: price ?? this.price,
    currency: currency ?? this.currency,
    quantity: quantity ?? this.quantity,
    soldCount: soldCount ?? this.soldCount,
    saleStart: saleStart ?? this.saleStart,
    saleEnd: saleEnd ?? this.saleEnd,
    isActive: isActive ?? this.isActive,
    sortOrder: sortOrder ?? this.sortOrder,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
    maxPerOrder: maxPerOrder ?? this.maxPerOrder,
    capacity: capacity ?? this.capacity,
    registered: registered ?? this.registered,
  );
}

class Registration {
  final String id;
  final String eventId;
  final String userId;
  final String? ticketTierId;
  final RegistrationStatus status;
  final int quantity;
  final Map<String, dynamic> formResponses;
  final double subtotal;
  final double discountAmount;
  final double totalAmount;
  final String? promoCodeId;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Registration({
    required this.id,
    required this.eventId,
    required this.userId,
    required this.ticketTierId,
    required this.status,
    this.quantity = 1,
    required this.formResponses,
    required this.subtotal,
    required this.discountAmount,
    required this.totalAmount,
    required this.promoCodeId,
    required this.createdAt,
    required this.updatedAt,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'event_id': eventId,
    'user_id': userId,
    'ticket_tier_id': ticketTierId,
    'status': status.name,
    'quantity': quantity,
    'form_responses': formResponses,
    'subtotal': subtotal,
    'discount_amount': discountAmount,
    'total_amount': totalAmount,
    'promo_code_id': promoCodeId,
    'created_at': createdAt.toIso8601String(),
    'updated_at': updatedAt.toIso8601String(),
  };

  factory Registration.fromJson(Map<String, dynamic> json) => Registration(
    id: json['id'] as String,
    eventId: json['event_id'] as String,
    userId: json['user_id'] as String,
    ticketTierId: json['ticket_tier_id'] as String?,
    status: RegistrationStatus.values.firstWhere((e) => e.name == json['status']),
    quantity: json['quantity'] as int? ?? 1,
    formResponses: json['form_responses'] is Map<String, dynamic>
        ? json['form_responses'] as Map<String, dynamic>
        : {},
    subtotal: json['subtotal'] != null ? (json['subtotal'] as num).toDouble() : 0,
    discountAmount: json['discount_amount'] != null ? (json['discount_amount'] as num).toDouble() : 0,
    totalAmount: json['total_amount'] != null ? (json['total_amount'] as num).toDouble() : 0,
    promoCodeId: json['promo_code_id'] as String?,
    createdAt: DateTime.parse(json['created_at'] as String),
    updatedAt: DateTime.parse(json['updated_at'] as String),
  );

  Registration copyWith({
    String? id,
    String? eventId,
    String? userId,
    String? ticketTierId,
    RegistrationStatus? status,
    int? quantity,
    Map<String, dynamic>? formResponses,
    double? subtotal,
    double? discountAmount,
    double? totalAmount,
    String? promoCodeId,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => Registration(
    id: id ?? this.id,
    eventId: eventId ?? this.eventId,
    userId: userId ?? this.userId,
    ticketTierId: ticketTierId ?? this.ticketTierId,
    status: status ?? this.status,
    quantity: quantity ?? this.quantity,
    formResponses: formResponses ?? this.formResponses,
    subtotal: subtotal ?? this.subtotal,
    discountAmount: discountAmount ?? this.discountAmount,
    totalAmount: totalAmount ?? this.totalAmount,
    promoCodeId: promoCodeId ?? this.promoCodeId,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
  );
}

enum PortfolioLayout { STACKED, GRID }

class UserProfile {
  final String id;
  final String email;
  final String? username;
  final DateTime? usernameChangedAt;
  final String? fullName;
  final String? avatarUrl;
  final String? coverImageUrl;
  final String? coverGradientId;
  final String? bio;
  final String? organization;
  final String? phone;
  final String? website;
  final String? linkedinUrl;
  final String? twitterUrl;
  final String? githubUrl;
  final String qrCode;
  final bool portfolioIsPublic;
  final PortfolioLayout portfolioLayout;
  final String? portfolioAccentColor;
  final List<String> portfolioSections;
  final Map<String, dynamic>? socialLinks;
  final List<String>? skills;
  final DateTime createdAt;
  final DateTime updatedAt;

  const UserProfile({
    required this.id,
    required this.email,
    this.username,
    this.usernameChangedAt,
    this.fullName,
    this.avatarUrl,
    this.coverImageUrl,
    this.coverGradientId,
    this.bio,
    this.organization,
    this.phone,
    this.website,
    this.linkedinUrl,
    this.twitterUrl,
    this.githubUrl,
    required this.qrCode,
    this.portfolioIsPublic = false,
    this.portfolioLayout = PortfolioLayout.STACKED,
    this.portfolioAccentColor,
    this.portfolioSections = const [],
    this.socialLinks,
    this.skills,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Calculate profile completeness (0-100)
  int get completeness {
    int filledCount = 0;
    const int totalFields = 5;
    if (fullName != null && fullName!.isNotEmpty) filledCount++;
    if (organization != null && organization!.isNotEmpty) filledCount++;
    if (phone != null && phone!.isNotEmpty) filledCount++;
    if (bio != null && bio!.isNotEmpty) filledCount++;
    if (website != null && website!.isNotEmpty) filledCount++;
    return ((filledCount / totalFields) * 100).round();
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'username': username,
    'username_changed_at': usernameChangedAt?.toIso8601String(),
    'full_name': fullName,
    'avatar_url': avatarUrl,
    'cover_image_url': coverImageUrl,
    'cover_gradient_id': coverGradientId,
    'bio': bio,
    'organization': organization,
    'phone': phone,
    'website': website,
    'linkedin_url': linkedinUrl,
    'twitter_url': twitterUrl,
    'github_url': githubUrl,
    'qr_code': qrCode,
    'portfolio_is_public': portfolioIsPublic,
    'portfolio_layout': portfolioLayout.name.toLowerCase(),
    'portfolio_accent_color': portfolioAccentColor,
    'portfolio_sections': portfolioSections,
    'social_links': socialLinks,
    'skills': skills,
    'created_at': createdAt.toIso8601String(),
    'updated_at': updatedAt.toIso8601String(),
  };

  /// Returns JSON for database updates (excludes immutable fields like id, created_at)
  Map<String, dynamic> toUpdateJson() => {
    'full_name': fullName,
    'username': username,
    'username_changed_at': usernameChangedAt?.toIso8601String(),
    'avatar_url': avatarUrl,
    'cover_image_url': coverImageUrl,
    'cover_gradient_id': coverGradientId,
    'bio': bio,
    'organization': organization,
    'phone': phone,
    'website': website,
    'linkedin_url': linkedinUrl,
    'twitter_url': twitterUrl,
    'github_url': githubUrl,
    'portfolio_is_public': portfolioIsPublic,
    'portfolio_layout': portfolioLayout.name.toLowerCase(),
    'portfolio_accent_color': portfolioAccentColor,
    'portfolio_sections': portfolioSections,
    'social_links': socialLinks,
    'skills': skills,
    'updated_at': DateTime.now().toIso8601String(),
  };

  factory UserProfile.fromJson(Map<String, dynamic> json) => UserProfile(
    id: json['id'] as String,
    email: json['email'] as String,
    username: json['username'] as String?,
    usernameChangedAt: json['username_changed_at'] != null
        ? DateTime.tryParse(json['username_changed_at'] as String)
        : null,
    fullName: json['full_name'] as String?,
    avatarUrl: json['avatar_url'] as String?,
    coverImageUrl: json['cover_image_url'] as String?,
    coverGradientId: json['cover_gradient_id'] as String?,
    bio: json['bio'] as String?,
    organization: json['organization'] as String?,
    phone: json['phone'] as String?,
    website: json['website'] as String?,
    linkedinUrl: json['linkedin_url'] as String?,
    twitterUrl: json['twitter_url'] as String?,
    githubUrl: json['github_url'] as String?,
    qrCode: json['qr_code'] as String,
    portfolioIsPublic: json['portfolio_is_public'] as bool? ?? false,
    portfolioLayout: json['portfolio_layout'] != null
        ? PortfolioLayout.values.firstWhere(
            (e) => e.name.toLowerCase() == (json['portfolio_layout'] as String).toLowerCase(),
            orElse: () => PortfolioLayout.STACKED,
          )
        : PortfolioLayout.STACKED,
    portfolioAccentColor: json['portfolio_accent_color'] as String?,
    portfolioSections: json['portfolio_sections'] != null
        ? List<String>.from(json['portfolio_sections'] as List)
        : [],
    socialLinks: json['social_links'] as Map<String, dynamic>?,
    skills: json['skills'] != null
        ? List<String>.from(json['skills'] as List)
        : null,
    createdAt: DateTime.parse(json['created_at'] as String),
    updatedAt: DateTime.parse(json['updated_at'] as String),
  );

  UserProfile copyWith({
    String? id,
    String? email,
    String? username,
    DateTime? usernameChangedAt,
    String? fullName,
    String? avatarUrl,
    String? coverImageUrl,
    String? coverGradientId,
    String? bio,
    String? organization,
    String? phone,
    String? website,
    String? linkedinUrl,
    String? twitterUrl,
    String? githubUrl,
    String? qrCode,
    bool? portfolioIsPublic,
    PortfolioLayout? portfolioLayout,
    String? portfolioAccentColor,
    List<String>? portfolioSections,
    Map<String, dynamic>? socialLinks,
    List<String>? skills,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => UserProfile(
    id: id ?? this.id,
    email: email ?? this.email,
    username: username ?? this.username,
    usernameChangedAt: usernameChangedAt ?? this.usernameChangedAt,
    fullName: fullName ?? this.fullName,
    avatarUrl: avatarUrl ?? this.avatarUrl,
    coverImageUrl: coverImageUrl ?? this.coverImageUrl,
    coverGradientId: coverGradientId ?? this.coverGradientId,
    bio: bio ?? this.bio,
    organization: organization ?? this.organization,
    phone: phone ?? this.phone,
    website: website ?? this.website,
    linkedinUrl: linkedinUrl ?? this.linkedinUrl,
    twitterUrl: twitterUrl ?? this.twitterUrl,
    githubUrl: githubUrl ?? this.githubUrl,
    qrCode: qrCode ?? this.qrCode,
    portfolioIsPublic: portfolioIsPublic ?? this.portfolioIsPublic,
    portfolioLayout: portfolioLayout ?? this.portfolioLayout,
    portfolioAccentColor: portfolioAccentColor ?? this.portfolioAccentColor,
    portfolioSections: portfolioSections ?? this.portfolioSections,
    socialLinks: socialLinks ?? this.socialLinks,
    skills: skills ?? this.skills,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
  );
}

class NotificationPreferences {
  final String userId;
  final bool workspaceEnabled;
  final bool eventEnabled;
  final bool marketplaceEnabled;
  final bool organizationEnabled;
  final bool systemEnabled;
  final bool soundEnabled;
  final bool vibrationEnabled;
  
  // Chat-specific settings
  final bool chatMessagesEnabled;
  final bool typingIndicatorsEnabled;
  final bool readReceiptsEnabled;
  final bool messagePreviewsEnabled;
  final String? chatMuteUntil; // 'Off', '1 hour', '8 hours', '1 day', '1 week', 'Forever'
  final bool customSoundEnabled;
  final String? customSoundName;
  
  // Privacy settings
  final bool showOnlineStatus;
  final bool showLastSeen;
  
  // Storage settings
  final bool autoDownloadMedia;
  
  // Social notification preferences (for NotificationService aggregation)
  // Note: Database columns remain 'connection_*' for backwards compatibility
  final bool followRequests;
  final bool followAccepted;
  final bool circleInvites;
  final bool sparkReactions;
  final bool achievements;
  final bool highMatchOnline;
  
  // Legacy aliases for backwards compatibility
  @Deprecated('Use followRequests instead')
  bool get connectionRequests => followRequests;
  @Deprecated('Use followAccepted instead')
  bool get connectionAccepted => followAccepted;
  
  // Follower preferences
  final bool newFollowerNotifications;
  final String allowFollowFrom; // 'everyone', 'no_one'
  
  // Quiet hours / Do Not Disturb
  final bool quietHoursEnabled;
  final String? quietHoursStart; // Format: "HH:mm:ss"
  final String? quietHoursEnd;   // Format: "HH:mm:ss"
  final bool allowUrgentInQuietHours;

  const NotificationPreferences({
    required this.userId,
    this.workspaceEnabled = true,
    this.eventEnabled = true,
    this.marketplaceEnabled = true,
    this.organizationEnabled = true,
    this.systemEnabled = true,
    this.soundEnabled = true,
    this.vibrationEnabled = true,
    this.chatMessagesEnabled = true,
    this.typingIndicatorsEnabled = true,
    this.readReceiptsEnabled = true,
    this.messagePreviewsEnabled = true,
    this.chatMuteUntil,
    this.customSoundEnabled = false,
    this.customSoundName,
    this.showOnlineStatus = true,
    this.showLastSeen = true,
    this.autoDownloadMedia = true,
    // Social defaults
    this.followRequests = true,
    this.followAccepted = true,
    this.circleInvites = true,
    this.sparkReactions = true,
    this.achievements = true,
    this.highMatchOnline = true,
    // Follower defaults
    this.newFollowerNotifications = true,
    this.allowFollowFrom = 'everyone',
    // Quiet hours defaults
    this.quietHoursEnabled = false,
    this.quietHoursStart,
    this.quietHoursEnd,
    this.allowUrgentInQuietHours = true,
  });

  Map<String, dynamic> toJson() => {
    'user_id': userId,
    'workspace_enabled': workspaceEnabled,
    'event_enabled': eventEnabled,
    'marketplace_enabled': marketplaceEnabled,
    'organization_enabled': organizationEnabled,
    'system_enabled': systemEnabled,
    'sound_enabled': soundEnabled,
    'vibration_enabled': vibrationEnabled,
    'chat_messages_enabled': chatMessagesEnabled,
    'typing_indicators_enabled': typingIndicatorsEnabled,
    'read_receipts_enabled': readReceiptsEnabled,
    'message_previews_enabled': messagePreviewsEnabled,
    'chat_mute_until': chatMuteUntil,
    'custom_sound_enabled': customSoundEnabled,
    'custom_sound_name': customSoundName,
    'show_online_status': showOnlineStatus,
    'show_last_seen': showLastSeen,
    'auto_download_media': autoDownloadMedia,
    // Social preferences (using DB column names for backwards compatibility)
    'connection_requests': followRequests,
    'connection_accepted': followAccepted,
    'circle_invites': circleInvites,
    'spark_reactions': sparkReactions,
    'achievements': achievements,
    'high_match_online': highMatchOnline,
    // Follower preferences
    'new_follower_notifications': newFollowerNotifications,
    'allow_follow_from': allowFollowFrom,
    // Quiet hours
    'quiet_hours_enabled': quietHoursEnabled,
    'quiet_hours_start': quietHoursStart,
    'quiet_hours_end': quietHoursEnd,
    'allow_urgent_in_quiet_hours': allowUrgentInQuietHours,
  };

  factory NotificationPreferences.fromJson(Map<String, dynamic> json) => NotificationPreferences(
    userId: json['user_id'] as String? ?? '',
    workspaceEnabled: json['workspace_enabled'] as bool? ?? true,
    eventEnabled: json['event_enabled'] as bool? ?? true,
    marketplaceEnabled: json['marketplace_enabled'] as bool? ?? true,
    organizationEnabled: json['organization_enabled'] as bool? ?? true,
    systemEnabled: json['system_enabled'] as bool? ?? true,
    soundEnabled: json['sound_enabled'] as bool? ?? true,
    vibrationEnabled: json['vibration_enabled'] as bool? ?? true,
    chatMessagesEnabled: json['chat_messages_enabled'] as bool? ?? true,
    typingIndicatorsEnabled: json['typing_indicators_enabled'] as bool? ?? true,
    readReceiptsEnabled: json['read_receipts_enabled'] as bool? ?? true,
    messagePreviewsEnabled: json['message_previews_enabled'] as bool? ?? true,
    chatMuteUntil: json['chat_mute_until'] as String?,
    customSoundEnabled: json['custom_sound_enabled'] as bool? ?? false,
    customSoundName: json['custom_sound_name'] as String?,
    showOnlineStatus: json['show_online_status'] as bool? ?? true,
    showLastSeen: json['show_last_seen'] as bool? ?? true,
    autoDownloadMedia: json['auto_download_media'] as bool? ?? true,
    // Social preferences (reading from DB column names)
    followRequests: json['connection_requests'] as bool? ?? true,
    followAccepted: json['connection_accepted'] as bool? ?? true,
    circleInvites: json['circle_invites'] as bool? ?? true,
    sparkReactions: json['spark_reactions'] as bool? ?? true,
    achievements: json['achievements'] as bool? ?? true,
    highMatchOnline: json['high_match_online'] as bool? ?? true,
    // Follower preferences
    newFollowerNotifications: json['new_follower_notifications'] as bool? ?? true,
    allowFollowFrom: json['allow_follow_from'] as String? ?? 'everyone',
    // Quiet hours
    quietHoursEnabled: json['quiet_hours_enabled'] as bool? ?? false,
    quietHoursStart: json['quiet_hours_start'] as String?,
    quietHoursEnd: json['quiet_hours_end'] as String?,
    allowUrgentInQuietHours: json['allow_urgent_in_quiet_hours'] as bool? ?? true,
  );

  NotificationPreferences copyWith({
    String? userId,
    bool? workspaceEnabled,
    bool? eventEnabled,
    bool? marketplaceEnabled,
    bool? organizationEnabled,
    bool? systemEnabled,
    bool? soundEnabled,
    bool? vibrationEnabled,
    bool? chatMessagesEnabled,
    bool? typingIndicatorsEnabled,
    bool? readReceiptsEnabled,
    bool? messagePreviewsEnabled,
    String? chatMuteUntil,
    bool? customSoundEnabled,
    String? customSoundName,
    bool? showOnlineStatus,
    bool? showLastSeen,
    bool? autoDownloadMedia,
    bool? followRequests,
    bool? followAccepted,
    bool? circleInvites,
    bool? sparkReactions,
    bool? achievements,
    bool? highMatchOnline,
    bool? newFollowerNotifications,
    String? allowFollowFrom,
    bool? quietHoursEnabled,
    String? quietHoursStart,
    String? quietHoursEnd,
    bool? allowUrgentInQuietHours,
  }) => NotificationPreferences(
    userId: userId ?? this.userId,
    workspaceEnabled: workspaceEnabled ?? this.workspaceEnabled,
    eventEnabled: eventEnabled ?? this.eventEnabled,
    marketplaceEnabled: marketplaceEnabled ?? this.marketplaceEnabled,
    organizationEnabled: organizationEnabled ?? this.organizationEnabled,
    systemEnabled: systemEnabled ?? this.systemEnabled,
    soundEnabled: soundEnabled ?? this.soundEnabled,
    vibrationEnabled: vibrationEnabled ?? this.vibrationEnabled,
    chatMessagesEnabled: chatMessagesEnabled ?? this.chatMessagesEnabled,
    typingIndicatorsEnabled: typingIndicatorsEnabled ?? this.typingIndicatorsEnabled,
    readReceiptsEnabled: readReceiptsEnabled ?? this.readReceiptsEnabled,
    messagePreviewsEnabled: messagePreviewsEnabled ?? this.messagePreviewsEnabled,
    chatMuteUntil: chatMuteUntil ?? this.chatMuteUntil,
    customSoundEnabled: customSoundEnabled ?? this.customSoundEnabled,
    customSoundName: customSoundName ?? this.customSoundName,
    showOnlineStatus: showOnlineStatus ?? this.showOnlineStatus,
    showLastSeen: showLastSeen ?? this.showLastSeen,
    autoDownloadMedia: autoDownloadMedia ?? this.autoDownloadMedia,
    followRequests: followRequests ?? this.followRequests,
    followAccepted: followAccepted ?? this.followAccepted,
    circleInvites: circleInvites ?? this.circleInvites,
    sparkReactions: sparkReactions ?? this.sparkReactions,
    achievements: achievements ?? this.achievements,
    highMatchOnline: highMatchOnline ?? this.highMatchOnline,
    newFollowerNotifications: newFollowerNotifications ?? this.newFollowerNotifications,
    allowFollowFrom: allowFollowFrom ?? this.allowFollowFrom,
    quietHoursEnabled: quietHoursEnabled ?? this.quietHoursEnabled,
    quietHoursStart: quietHoursStart ?? this.quietHoursStart,
    quietHoursEnd: quietHoursEnd ?? this.quietHoursEnd,
    allowUrgentInQuietHours: allowUrgentInQuietHours ?? this.allowUrgentInQuietHours,
  );
  
  /// Check if a notification type should be sent based on preferences
  bool shouldNotify(String notificationType) {
    final typeNormalized = notificationType.toLowerCase().replaceAll('_', '');
    switch (typeNormalized) {
      case 'connectionrequest':
      case 'connectionaccepted':
        return followRequests;
      case 'sparkreaction':
        return sparkReactions;
      case 'circleinvite':
        return circleInvites;
      case 'highmatchonline':
        return highMatchOnline;
      case 'newbadge':
      case 'levelup':
        return achievements;
      default:
        return true;
    }
  }
  
  /// Check if currently in quiet hours
  bool isInQuietHours() {
    if (!quietHoursEnabled || quietHoursStart == null || quietHoursEnd == null) {
      return false;
    }
    
    final now = DateTime.now();
    final currentTime = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:00';
    
    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (quietHoursStart!.compareTo(quietHoursEnd!) > 0) {
      return currentTime.compareTo(quietHoursStart!) >= 0 || 
             currentTime.compareTo(quietHoursEnd!) < 0;
    }
    
    return currentTime.compareTo(quietHoursStart!) >= 0 && 
           currentTime.compareTo(quietHoursEnd!) < 0;
  }
}

// ==========================
// UTILITIES
// ==========================

extension EventCategoryX on EventCategory {
  String get displayName => switch (this) {
    // Tech & Learning
    EventCategory.HACKATHON => 'Hackathon',
    EventCategory.BOOTCAMP => 'Bootcamp',
    EventCategory.WORKSHOP => 'Workshop',
    EventCategory.WEBINAR => 'Webinar',
    EventCategory.SEMINAR => 'Seminar',
    EventCategory.LECTURE => 'Lecture',
    EventCategory.TRAINING => 'Training',
    EventCategory.SYMPOSIUM => 'Symposium',
    
    // Professional & Career
    EventCategory.CONFERENCE => 'Conference',
    EventCategory.MEETUP => 'Meetup',
    EventCategory.NETWORKING => 'Networking',
    EventCategory.CAREER_FAIR => 'Career Fair',
    EventCategory.SUMMIT => 'Summit',
    EventCategory.PANEL_DISCUSSION => 'Panel Discussion',
    EventCategory.TOWN_HALL => 'Town Hall',
    EventCategory.TEAM_BUILDING => 'Team Building',
    EventCategory.OFFSITE => 'Offsite',
    EventCategory.TRADE_SHOW => 'Trade Show',
    EventCategory.EXPO => 'Expo',
    
    // Startup & Innovation
    EventCategory.STARTUP_PITCH => 'Startup Pitch',
    EventCategory.DEMO_DAY => 'Demo Day',
    EventCategory.PRODUCT_LAUNCH => 'Product Launch',
    EventCategory.HIRING_CHALLENGE => 'Hiring Challenge',
    
    // Academic & Education
    EventCategory.COMPETITION => 'Competition',
    EventCategory.QUIZ => 'Quiz',
    EventCategory.DEBATE => 'Debate',
    EventCategory.ORIENTATION => 'Orientation',
    EventCategory.ALUMNI_MEET => 'Alumni Meet',
    
    // Cultural & Entertainment
    EventCategory.CULTURAL_FEST => 'Cultural Fest',
    EventCategory.SPORTS_EVENT => 'Sports Event',
    EventCategory.CONCERT => 'Concert',
    EventCategory.EXHIBITION => 'Exhibition',
    EventCategory.FESTIVAL => 'Festival',
    
    // Social & Community
    EventCategory.SOCIAL_GATHERING => 'Social Gathering',
    EventCategory.AWARDS_CEREMONY => 'Awards Ceremony',
    EventCategory.GALA => 'Gala',
    
    // Charity & Cause
    EventCategory.FUNDRAISER => 'Fundraiser',
    EventCategory.CHARITY_EVENT => 'Charity Event',
    EventCategory.VOLUNTEER_DRIVE => 'Volunteer Drive',
    EventCategory.AWARENESS_CAMPAIGN => 'Awareness Campaign',
    
    EventCategory.OTHER => 'Other',
  };
}

// ==========================
// CHAT MODELS
// ==========================

/// Chat channel types
enum ChannelType { GENERAL, ANNOUNCEMENT, ROLE_BASED, TASK_SPECIFIC }

extension ChannelTypeX on ChannelType {
  String get label => switch (this) {
        ChannelType.ANNOUNCEMENT => 'ANNOUNCEMENTS',
        ChannelType.GENERAL => 'GENERAL',
        ChannelType.ROLE_BASED => 'ROLE_BASED',
        ChannelType.TASK_SPECIFIC => 'TASK_SPECIFIC',
      };
}

class WorkspaceChannel {
  final String id;
  final String workspaceId;
  final String name;
  final ChannelType type;
  final String? description;
  final List<dynamic> members; // keep dynamic to match Supabase JSON arrays
  final bool isPrivate;

  const WorkspaceChannel({
    required this.id,
    required this.workspaceId,
    required this.name,
    required this.type,
    this.description,
    this.members = const [],
    this.isPrivate = false,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'workspace_id': workspaceId,
        'name': name,
        'type': type.name,
        'description': description,
        'members': members,
        'is_private': isPrivate,
      };

  factory WorkspaceChannel.fromJson(Map<String, dynamic> json) => WorkspaceChannel(
        id: json['id'] as String,
        workspaceId: json['workspace_id'] as String,
        name: json['name'] as String,
        type: ChannelType.values.firstWhere(
          (e) => e.name == (json['type'] as String?)?.toUpperCase(),
          orElse: () => ChannelType.GENERAL,
        ),
        description: json['description'] as String?,
        members: json['members'] is List ? List<dynamic>.from(json['members'] as List) : const [],
        isPrivate: json['is_private'] as bool? ?? false,
      );
}

/// Direct Message thread model
/// Represents a DM conversation with another user
class DMThread {
  final String channelId;
  final String partnerUserId;
  final String partnerName;
  final String? partnerAvatar;
  final Message? lastMessage;
  final DateTime updatedAt;
  final bool isBlocked;
  final bool isMuted;
  final bool isPinned;
  final bool isArchived;
  final bool? isOnline;

  const DMThread({
    required this.channelId,
    required this.partnerUserId,
    required this.partnerName,
    this.partnerAvatar,
    this.lastMessage,
    required this.updatedAt,
    this.isBlocked = false,
    this.isMuted = false,
    this.isPinned = false,
    this.isArchived = false,
    this.isOnline,
  });

  Map<String, dynamic> toJson() => {
    'channel_id': channelId,
    'partner_user_id': partnerUserId,
    'partner_name': partnerName,
    'partner_avatar': partnerAvatar,
    'last_message': lastMessage?.toJson(),
    'updated_at': updatedAt.toIso8601String(),
    'is_blocked': isBlocked,
    'is_muted': isMuted,
    'is_pinned': isPinned,
    'is_archived': isArchived,
  };

  factory DMThread.fromJson(Map<String, dynamic> json) {
    Message? lastMessage;
    if (json['last_message'] is Map) {
      lastMessage = Message.fromJson(Map<String, dynamic>.from(json['last_message'] as Map));
    }
    return DMThread(
      channelId: json['channel_id'] as String,
      partnerUserId: json['partner_user_id'] as String,
      partnerName: json['partner_name'] as String? ?? 'User',
      partnerAvatar: json['partner_avatar'] as String?,
      lastMessage: lastMessage,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : DateTime.now(),
      isBlocked: json['is_blocked'] as bool? ?? false,
      isMuted: json['is_muted'] as bool? ?? false,
      isPinned: json['is_pinned'] as bool? ?? false,
      isArchived: json['is_archived'] as bool? ?? false,
    );
  }

  DMThread copyWith({
    String? channelId,
    String? partnerUserId,
    String? partnerName,
    String? partnerAvatar,
    Message? lastMessage,
    DateTime? updatedAt,
    bool? isBlocked,
    bool? isMuted,
    bool? isPinned,
    bool? isArchived,
  }) => DMThread(
    channelId: channelId ?? this.channelId,
    partnerUserId: partnerUserId ?? this.partnerUserId,
    partnerName: partnerName ?? this.partnerName,
    partnerAvatar: partnerAvatar ?? this.partnerAvatar,
    lastMessage: lastMessage ?? this.lastMessage,
    updatedAt: updatedAt ?? this.updatedAt,
    isBlocked: isBlocked ?? this.isBlocked,
    isMuted: isMuted ?? this.isMuted,
    isPinned: isPinned ?? this.isPinned,
    isArchived: isArchived ?? this.isArchived,
  );
}

class MessageAttachment {
  final String filename;
  final String url;
  final int size;
  final String type;

  const MessageAttachment({
    required this.filename,
    required this.url,
    required this.size,
    this.type = 'file',
  });

  Map<String, dynamic> toJson() => {
        'filename': filename,
        'url': url,
        'size': size,
        'type': type,
      };

  factory MessageAttachment.fromJson(Map<String, dynamic> json) => MessageAttachment(
        filename: json['filename'] as String? ?? 'file',
        url: json['url'] as String? ?? '',
        size: json['size'] is int ? json['size'] as int : (json['size'] as num?)?.toInt() ?? 0,
        type: json['type'] as String? ?? _inferType(json['filename'] as String? ?? ''),
      );

  static String _inferType(String filename) {
    final ext = filename.split('.').last.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].contains(ext)) return 'image';
    if (['mp4', 'mov', 'avi', 'webm'].contains(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a'].contains(ext)) return 'audio';
    if (['pdf', 'doc', 'docx', 'txt'].contains(ext)) return 'document';
    return 'file';
  }
}

class Message {
  final String id;
  final String channelId;
  final String senderId;
  final String senderName;
  final String? senderAvatar;
  final String content;
  final List<MessageAttachment> attachments;
  /// Raw attachments JSON for detecting rich content like shared posts
  final List<dynamic> rawAttachments;
  final DateTime sentAt;
  final DateTime? editedAt;
  final DateTime? deletedAt;
  final bool isDeleted;
  
  // E2E Encryption fields
  final bool? isEncrypted;
  final int? encryptionVersion;
  final String? senderPublicKey;
  final String? nonce;

  const Message({
    required this.id,
    required this.channelId,
    required this.senderId,
    required this.senderName,
    this.senderAvatar,
    required this.content,
    this.attachments = const [],
    this.rawAttachments = const [],
    required this.sentAt,
    this.editedAt,
    this.deletedAt,
    this.isDeleted = false,
    // Encryption
    this.isEncrypted,
    this.encryptionVersion,
    this.senderPublicKey,
    this.nonce,
  });

  /// Check if this message was edited
  bool get wasEdited => editedAt != null;
  
  /// Check if message is end-to-end encrypted
  bool get isE2EEncrypted => isEncrypted == true && nonce != null && senderPublicKey != null;

  Map<String, dynamic> toJson() => {
        'id': id,
        'channel_id': channelId,
        'sender_id': senderId,
        'sender_name': senderName,
        'sender_avatar': senderAvatar,
        'content': content,
        'attachments': attachments.map((e) => e.toJson()).toList(),
        'sent_at': sentAt.toIso8601String(),
        'edited_at': editedAt?.toIso8601String(),
        'deleted_at': deletedAt?.toIso8601String(),
        'is_deleted': isDeleted,
        'is_encrypted': isEncrypted,
        'encryption_version': encryptionVersion,
        'sender_public_key': senderPublicKey,
        'nonce': nonce,
      };

  factory Message.fromJson(Map<String, dynamic> json) {
    final atts = <MessageAttachment>[];
    final rawAtts = json['attachments'];
    final rawList = rawAtts is List ? List<dynamic>.from(rawAtts) : <dynamic>[];
    
    if (rawAtts is List) {
      for (final a in rawAtts) {
        if (a is Map) atts.add(MessageAttachment.fromJson(Map<String, dynamic>.from(a)));
      }
    }
    return Message(
      id: json['id'] as String,
      channelId: json['channel_id'] as String,
      senderId: json['sender_id'] as String,
      senderName: json['sender_name'] as String,
      senderAvatar: json['sender_avatar'] as String?,
      content: json['content'] as String? ?? '',
      attachments: atts,
      rawAttachments: rawList,
      sentAt: DateTime.parse(json['sent_at'] as String),
      editedAt: json['edited_at'] != null ? DateTime.parse(json['edited_at'] as String) : null,
      deletedAt: json['deleted_at'] != null ? DateTime.parse(json['deleted_at'] as String) : null,
      isDeleted: json['is_deleted'] as bool? ?? json['deleted_at'] != null,
      // Encryption fields
      isEncrypted: json['is_encrypted'] as bool?,
      encryptionVersion: json['encryption_version'] as int?,
      senderPublicKey: json['sender_public_key'] as String?,
      nonce: json['nonce'] as String?,
    );
  }

  Message copyWith({
    String? id,
    String? channelId,
    String? senderId,
    String? senderName,
    String? senderAvatar,
    String? content,
    List<MessageAttachment>? attachments,
    List<dynamic>? rawAttachments,
    DateTime? sentAt,
    DateTime? editedAt,
    DateTime? deletedAt,
    bool? isDeleted,
    bool? isEncrypted,
    int? encryptionVersion,
    String? senderPublicKey,
    String? nonce,
  }) => Message(
    id: id ?? this.id,
    channelId: channelId ?? this.channelId,
    senderId: senderId ?? this.senderId,
    senderName: senderName ?? this.senderName,
    senderAvatar: senderAvatar ?? this.senderAvatar,
    content: content ?? this.content,
    attachments: attachments ?? this.attachments,
    rawAttachments: rawAttachments ?? this.rawAttachments,
    sentAt: sentAt ?? this.sentAt,
    editedAt: editedAt ?? this.editedAt,
    deletedAt: deletedAt ?? this.deletedAt,
    isDeleted: isDeleted ?? this.isDeleted,
    isEncrypted: isEncrypted ?? this.isEncrypted,
    encryptionVersion: encryptionVersion ?? this.encryptionVersion,
    senderPublicKey: senderPublicKey ?? this.senderPublicKey,
    nonce: nonce ?? this.nonce,
  );
}
