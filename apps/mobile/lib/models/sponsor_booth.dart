/// Sponsor Booth model for Zone Phase 2
/// Represents sponsor booths at events for the sponsor experience feature

class SponsorBooth {
  final String id;
  final String eventId;
  final String sponsorName;
  final String? sponsorLogo;
  final String tier; // 'platinum', 'gold', 'silver', 'bronze'
  final String? boothNumber;
  final String? location;
  final String? description;
  final String? website;
  final Map<String, dynamic> socialLinks;
  final List<String> offerings;
  final bool isActive;
  final int visitCount;
  final DateTime createdAt;
  final DateTime? updatedAt;
  
  // Client-side state
  final bool hasVisited;

  const SponsorBooth({
    required this.id,
    required this.eventId,
    required this.sponsorName,
    this.sponsorLogo,
    this.tier = 'bronze',
    this.boothNumber,
    this.location,
    this.description,
    this.website,
    this.socialLinks = const {},
    this.offerings = const [],
    this.isActive = true,
    this.visitCount = 0,
    required this.createdAt,
    this.updatedAt,
    this.hasVisited = false,
  });

  /// Get tier color based on sponsor level
  String get tierColor {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return '#E5E4E2';
      case 'gold':
        return '#FFD700';
      case 'silver':
        return '#C0C0C0';
      case 'bronze':
        return '#CD7F32';
      default:
        return '#808080';
    }
  }

  /// Get tier order for sorting (lower = higher tier)
  int get tierOrder {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return 0;
      case 'gold':
        return 1;
      case 'silver':
        return 2;
      case 'bronze':
        return 3;
      default:
        return 4;
    }
  }

  factory SponsorBooth.fromJson(Map<String, dynamic> json, {bool hasVisited = false}) {
    return SponsorBooth(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      sponsorName: json['sponsor_name'] as String,
      sponsorLogo: json['sponsor_logo'] as String?,
      tier: json['tier'] as String? ?? 'bronze',
      boothNumber: json['booth_number'] as String?,
      location: json['location'] as String?,
      description: json['description'] as String?,
      website: json['website'] as String?,
      socialLinks: json['social_links'] as Map<String, dynamic>? ?? {},
      offerings: (json['offerings'] as List<dynamic>?)?.cast<String>() ?? [],
      isActive: json['is_active'] as bool? ?? true,
      visitCount: json['visit_count'] as int? ?? 0,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] != null 
          ? DateTime.parse(json['updated_at'] as String) 
          : null,
      hasVisited: hasVisited,
    );
  }

  SponsorBooth copyWith({bool? hasVisited}) {
    return SponsorBooth(
      id: id,
      eventId: eventId,
      sponsorName: sponsorName,
      sponsorLogo: sponsorLogo,
      tier: tier,
      boothNumber: boothNumber,
      location: location,
      description: description,
      website: website,
      socialLinks: socialLinks,
      offerings: offerings,
      isActive: isActive,
      visitCount: visitCount,
      createdAt: createdAt,
      updatedAt: updatedAt,
      hasVisited: hasVisited ?? this.hasVisited,
    );
  }
}
