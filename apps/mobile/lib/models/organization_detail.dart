import 'package:thittam1hub/utils/url_utils.dart';

/// Extended organization model with full details for organization page
/// Includes built-in validation and sanitization for all fields
class OrganizationDetail {
  final String id;
  final String name;
  final String slug;
  final String? description;
  final String? logoUrl;
  final String? bannerUrl;
  final String? primaryColor;
  final String? secondaryColor;
  final String category;
  final String? city;
  final String? state;
  final String? country;
  final String? website;
  final String? email;
  final String? phone;
  final String verificationStatus;
  final String? seoTitle;
  final String? seoDescription;
  final DateTime createdAt;
  final DateTime? updatedAt;
  
  // Computed stats
  final int eventCount;
  final int productCount;

  const OrganizationDetail({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.logoUrl,
    this.bannerUrl,
    this.primaryColor,
    this.secondaryColor,
    this.category = 'Other',
    this.city,
    this.state,
    this.country,
    this.website,
    this.email,
    this.phone,
    this.verificationStatus = 'PENDING',
    this.seoTitle,
    this.seoDescription,
    required this.createdAt,
    this.updatedAt,
    this.eventCount = 0,
    this.productCount = 0,
  });

  // ─────────────────────────────────────────────────────────────────
  // Computed Properties
  // ─────────────────────────────────────────────────────────────────

  bool get isVerified => verificationStatus == 'VERIFIED';

  /// Safe website URL for launching
  String? get safeWebsiteUrl => UrlUtils.sanitizeUrl(
    website?.startsWith('http') == true ? website : 'https://$website',
  );

  /// Safe email URL for launching
  String? get safeEmailUrl => UrlUtils.createMailtoUrl(email);

  /// Safe phone URL for launching
  String? get safePhoneUrl => UrlUtils.createTelUrl(phone);

  /// Domain name extracted from website for display
  String? get websiteDomain => UrlUtils.extractDomain(website);

  /// Validated logo URL
  String? get safeLogoUrl => UrlUtils.sanitizeUrl(logoUrl);

  /// Validated banner URL
  String? get safeBannerUrl => UrlUtils.sanitizeUrl(bannerUrl);

  /// Formatted location string
  String? get location {
    final parts = [city, state, country]
        .whereType<String>()
        .where((s) => s.isNotEmpty)
        .toList();
    return parts.isNotEmpty ? parts.join(', ') : null;
  }

  /// Validates the hex color and returns a safe value
  String? get safePrimaryColor => InputSanitizer.sanitizeHexColor(primaryColor);
  String? get safeSecondaryColor => InputSanitizer.sanitizeHexColor(secondaryColor);

  // ─────────────────────────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────────────────────────

  /// Validates the organization data
  ValidationResult validate() {
    if (!InputSanitizer.isValidUuid(id)) {
      return const ValidationResult.invalid('Invalid organization ID');
    }
    if (name.isEmpty || name.length > InputSanitizer.maxNameLength) {
      return const ValidationResult.invalid('Invalid organization name');
    }
    if (!UrlUtils.isValidSlug(slug)) {
      return const ValidationResult.invalid('Invalid organization slug');
    }
    if (email != null && InputSanitizer.sanitizeEmail(email) == null) {
      return const ValidationResult.invalid('Invalid email address');
    }
    return const ValidationResult.valid();
  }

  bool get isValid => validate().isValid;

  // ─────────────────────────────────────────────────────────────────
  // JSON Serialization with Sanitization
  // ─────────────────────────────────────────────────────────────────

  factory OrganizationDetail.fromJson(Map<String, dynamic> json) {
    String _s(dynamic v, [String d = '']) => v is String ? v : (v?.toString() ?? d);
    DateTime _dt(dynamic v, [DateTime? d]) {
      if (v == null) return d ?? DateTime.now();
      if (v is String) {
        try { return DateTime.parse(v); } catch (_) { return d ?? DateTime.now(); }
      }
      return d ?? DateTime.now();
    }
    int _i(dynamic v, [int d = 0]) => v is int ? v : (v is num ? v.toInt() : d);

    // Sanitize inputs during parsing
    final rawName = _s(json['name'], 'Unknown Organization');
    final rawDescription = json['description'] as String?;
    final rawEmail = json['email'] as String?;
    final rawPhone = json['phone'] as String?;

    return OrganizationDetail(
      id: _s(json['id']),
      name: InputSanitizer.sanitizeName(rawName) ?? rawName,
      slug: UrlUtils.sanitizeSlug(_s(json['slug'])),
      description: InputSanitizer.sanitizeDescription(rawDescription),
      logoUrl: json['logo_url'] as String?,
      bannerUrl: json['banner_url'] as String?,
      primaryColor: json['primary_color'] as String?,
      secondaryColor: json['secondary_color'] as String?,
      category: InputSanitizer.sanitizeCategory(_s(json['category'], 'Other')) ?? 'Other',
      city: InputSanitizer.sanitizeName(json['city'] as String?),
      state: InputSanitizer.sanitizeName(json['state'] as String?),
      country: InputSanitizer.sanitizeName(json['country'] as String?),
      website: json['website'] as String?,
      email: InputSanitizer.sanitizeEmail(rawEmail),
      phone: InputSanitizer.sanitizePhone(rawPhone),
      verificationStatus: _s(json['verification_status'], 'PENDING'),
      seoTitle: InputSanitizer.sanitizeName(json['seo_title'] as String?),
      seoDescription: InputSanitizer.sanitizeDescription(json['seo_description'] as String?),
      createdAt: _dt(json['created_at']),
      updatedAt: json['updated_at'] != null ? _dt(json['updated_at']) : null,
      eventCount: _i(json['event_count']).clamp(0, 999999),
      productCount: _i(json['product_count']).clamp(0, 999999),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'slug': slug,
    'description': description,
    'logo_url': logoUrl,
    'banner_url': bannerUrl,
    'primary_color': primaryColor,
    'secondary_color': secondaryColor,
    'category': category,
    'city': city,
    'state': state,
    'country': country,
    'website': website,
    'email': email,
    'phone': phone,
    'verification_status': verificationStatus,
    'seo_title': seoTitle,
    'seo_description': seoDescription,
    'created_at': createdAt.toIso8601String(),
    'updated_at': updatedAt?.toIso8601String(),
    'event_count': eventCount,
    'product_count': productCount,
  };

  OrganizationDetail copyWith({
    String? id,
    String? name,
    String? slug,
    String? description,
    String? logoUrl,
    String? bannerUrl,
    String? primaryColor,
    String? secondaryColor,
    String? category,
    String? city,
    String? state,
    String? country,
    String? website,
    String? email,
    String? phone,
    String? verificationStatus,
    String? seoTitle,
    String? seoDescription,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? eventCount,
    int? productCount,
  }) {
    return OrganizationDetail(
      id: id ?? this.id,
      name: name ?? this.name,
      slug: slug ?? this.slug,
      description: description ?? this.description,
      logoUrl: logoUrl ?? this.logoUrl,
      bannerUrl: bannerUrl ?? this.bannerUrl,
      primaryColor: primaryColor ?? this.primaryColor,
      secondaryColor: secondaryColor ?? this.secondaryColor,
      category: category ?? this.category,
      city: city ?? this.city,
      state: state ?? this.state,
      country: country ?? this.country,
      website: website ?? this.website,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      verificationStatus: verificationStatus ?? this.verificationStatus,
      seoTitle: seoTitle ?? this.seoTitle,
      seoDescription: seoDescription ?? this.seoDescription,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      eventCount: eventCount ?? this.eventCount,
      productCount: productCount ?? this.productCount,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OrganizationDetail &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'OrganizationDetail(id: $id, name: $name, slug: $slug)';
}
