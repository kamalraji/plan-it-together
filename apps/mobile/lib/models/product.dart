import 'package:thittam1hub/utils/url_utils.dart';

/// Product model mapping to organization_products table
/// Includes built-in validation and sanitization for all fields
class Product {
  final String id;
  final String organizationId;
  final String name;
  final String? description;
  final String? price;
  final String? category;
  final String? linkUrl;
  final List<String> tags;
  final bool isFeatured;
  final int? featuredPosition;
  final int? position;
  final String status;
  final int impressionCount;
  final int clickCount;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const Product({
    required this.id,
    required this.organizationId,
    required this.name,
    this.description,
    this.price,
    this.category,
    this.linkUrl,
    this.tags = const [],
    this.isFeatured = false,
    this.featuredPosition,
    this.position,
    this.status = 'active',
    this.impressionCount = 0,
    this.clickCount = 0,
    required this.createdAt,
    this.updatedAt,
  });

  // ─────────────────────────────────────────────────────────────────
  // Computed Properties with Validation
  // ─────────────────────────────────────────────────────────────────

  bool get isActive => status == 'active';
  
  /// Returns true if the product has a valid external link
  bool get hasLink => safeLinkUrl != null;
  
  /// Returns true if the product has a price
  bool get hasPrice => price != null && price!.isNotEmpty;
  
  /// Returns true if the product has a description
  bool get hasDescription => description != null && description!.isNotEmpty;

  /// Safe, validated link URL for launching
  String? get safeLinkUrl => UrlUtils.sanitizeUrl(linkUrl);

  /// Extracts domain from link URL for display
  String? get linkDomain => UrlUtils.extractDomain(linkUrl);

  /// Formatted price with validation
  String? get displayPrice => InputSanitizer.sanitizePrice(price);

  /// Sanitized category for display
  String? get displayCategory => InputSanitizer.sanitizeCategory(category);

  /// Sanitized tags for display (max 10)
  List<String> get displayTags => tags.take(10).toList();

  /// Click-through rate as percentage
  double get clickThroughRate {
    if (impressionCount == 0) return 0;
    return (clickCount / impressionCount * 100).clamp(0, 100);
  }

  // ─────────────────────────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────────────────────────

  /// Validates the product data
  ValidationResult validate() {
    if (!InputSanitizer.isValidUuid(id)) {
      return const ValidationResult.invalid('Invalid product ID');
    }
    if (!InputSanitizer.isValidUuid(organizationId)) {
      return const ValidationResult.invalid('Invalid organization ID');
    }
    if (name.isEmpty || name.length > InputSanitizer.maxNameLength) {
      return const ValidationResult.invalid('Invalid product name');
    }
    if (linkUrl != null && safeLinkUrl == null) {
      return const ValidationResult.invalid('Invalid product link URL');
    }
    return const ValidationResult.valid();
  }

  bool get isValid => validate().isValid;

  // ─────────────────────────────────────────────────────────────────
  // JSON Serialization with Sanitization
  // ─────────────────────────────────────────────────────────────────

  factory Product.fromJson(Map<String, dynamic> json) {
    String _s(dynamic v, [String d = '']) => v is String ? v : (v?.toString() ?? d);
    DateTime _dt(dynamic v, [DateTime? d]) {
      if (v == null) return d ?? DateTime.now();
      if (v is String) {
        try { return DateTime.parse(v); } catch (_) { return d ?? DateTime.now(); }
      }
      return d ?? DateTime.now();
    }
    int _i(dynamic v, [int d = 0]) => v is int ? v : (v is num ? v.toInt() : d);
    int? _in(dynamic v) => v is int ? v : (v is num ? v.toInt() : null);
    bool _b(dynamic v, [bool d = false]) => v is bool ? v : d;

    // Sanitize inputs during parsing
    final rawName = _s(json['name'], 'Untitled Product');
    final rawDescription = json['description'] as String?;
    final rawPrice = json['price'] as String?;
    final rawCategory = json['category'] as String?;
    final rawTags = json['tags'];

    return Product(
      id: _s(json['id']),
      organizationId: _s(json['organization_id']),
      name: InputSanitizer.sanitizeName(rawName) ?? rawName,
      description: InputSanitizer.sanitizeDescription(rawDescription),
      price: InputSanitizer.sanitizePrice(rawPrice),
      category: InputSanitizer.sanitizeCategory(rawCategory),
      linkUrl: json['link_url'] as String?, // Validated on access via safeLinkUrl
      tags: InputSanitizer.sanitizeTags(rawTags is List ? rawTags : null),
      isFeatured: _b(json['is_featured']),
      featuredPosition: _in(json['featured_position'])?.clamp(0, 999),
      position: _in(json['position'])?.clamp(0, 999),
      status: _s(json['status'], 'active'),
      impressionCount: _i(json['impression_count']).clamp(0, 999999999),
      clickCount: _i(json['click_count']).clamp(0, 999999999),
      createdAt: _dt(json['created_at']),
      updatedAt: json['updated_at'] != null ? _dt(json['updated_at']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'organization_id': organizationId,
    'name': name,
    'description': description,
    'price': price,
    'category': category,
    'link_url': linkUrl,
    'tags': tags,
    'is_featured': isFeatured,
    'featured_position': featuredPosition,
    'position': position,
    'status': status,
    'impression_count': impressionCount,
    'click_count': clickCount,
    'created_at': createdAt.toIso8601String(),
    'updated_at': updatedAt?.toIso8601String(),
  };

  Product copyWith({
    String? id,
    String? organizationId,
    String? name,
    String? description,
    String? price,
    String? category,
    String? linkUrl,
    List<String>? tags,
    bool? isFeatured,
    int? featuredPosition,
    int? position,
    String? status,
    int? impressionCount,
    int? clickCount,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Product(
      id: id ?? this.id,
      organizationId: organizationId ?? this.organizationId,
      name: name ?? this.name,
      description: description ?? this.description,
      price: price ?? this.price,
      category: category ?? this.category,
      linkUrl: linkUrl ?? this.linkUrl,
      tags: tags ?? this.tags,
      isFeatured: isFeatured ?? this.isFeatured,
      featuredPosition: featuredPosition ?? this.featuredPosition,
      position: position ?? this.position,
      status: status ?? this.status,
      impressionCount: impressionCount ?? this.impressionCount,
      clickCount: clickCount ?? this.clickCount,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Product && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'Product(id: $id, name: $name, category: $category)';
}
