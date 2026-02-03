import 'package:thittam1hub/models/product.dart';
import 'package:thittam1hub/utils/url_utils.dart';

/// Sort options for product discovery
enum ProductSortBy {
  featured,
  newest,
  priceAsc,
  priceDesc,
  popular,
}

extension ProductSortByExtension on ProductSortBy {
  String get displayName {
    switch (this) {
      case ProductSortBy.featured:
        return 'Featured';
      case ProductSortBy.newest:
        return 'Newest';
      case ProductSortBy.priceAsc:
        return 'Price: Low to High';
      case ProductSortBy.priceDesc:
        return 'Price: High to Low';
      case ProductSortBy.popular:
        return 'Most Popular';
    }
  }

  String get queryValue {
    switch (this) {
      case ProductSortBy.featured:
        return 'featured';
      case ProductSortBy.newest:
        return 'newest';
      case ProductSortBy.priceAsc:
        return 'price_asc';
      case ProductSortBy.priceDesc:
        return 'price_desc';
      case ProductSortBy.popular:
        return 'popular';
    }
  }

  static ProductSortBy fromString(String? value) {
    if (value == null || value.isEmpty) return ProductSortBy.featured;
    switch (value.toLowerCase()) {
      case 'newest':
        return ProductSortBy.newest;
      case 'price_asc':
        return ProductSortBy.priceAsc;
      case 'price_desc':
        return ProductSortBy.priceDesc;
      case 'popular':
        return ProductSortBy.popular;
      default:
        return ProductSortBy.featured;
    }
  }
}

/// Product with organization info for discovery view
/// Includes organization details for display in global product listings
class ProductWithOrg {
  final Product product;
  final String organizationId;
  final String organizationName;
  final String organizationSlug;
  final String? organizationLogoUrl;

  const ProductWithOrg({
    required this.product,
    required this.organizationId,
    required this.organizationName,
    required this.organizationSlug,
    this.organizationLogoUrl,
  });

  // ─────────────────────────────────────────────────────────────────
  // Delegation to Product
  // ─────────────────────────────────────────────────────────────────

  String get id => product.id;
  String get name => product.name;
  String? get description => product.description;
  String? get price => product.price;
  String? get category => product.category;
  String? get linkUrl => product.linkUrl;
  List<String> get tags => product.tags;
  bool get isFeatured => product.isFeatured;
  String get status => product.status;
  int get impressionCount => product.impressionCount;
  int get clickCount => product.clickCount;
  DateTime get createdAt => product.createdAt;

  // Computed properties
  bool get isActive => product.isActive;
  bool get hasLink => product.hasLink;
  bool get hasPrice => product.hasPrice;
  bool get hasDescription => product.hasDescription;
  String? get safeLinkUrl => product.safeLinkUrl;
  String? get displayPrice => product.displayPrice;
  String? get displayCategory => product.displayCategory;
  List<String> get displayTags => product.displayTags;

  // ─────────────────────────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────────────────────────

  bool get isValid {
    return product.isValid &&
        InputSanitizer.isValidUuid(organizationId) &&
        organizationName.isNotEmpty &&
        organizationSlug.isNotEmpty;
  }

  // ─────────────────────────────────────────────────────────────────
  // JSON Serialization
  // ─────────────────────────────────────────────────────────────────

  factory ProductWithOrg.fromJson(Map<String, dynamic> json) {
    // Parse product fields
    final product = Product.fromJson(json);

    // Parse organization fields (from joined query)
    final orgId = json['organization_id'] as String? ?? '';
    final orgName = json['org_name'] as String? ??
        json['organization_name'] as String? ??
        '';
    final orgSlug = json['org_slug'] as String? ??
        json['organization_slug'] as String? ??
        '';
    final orgLogo = json['org_logo_url'] as String? ??
        json['organization_logo_url'] as String?;

    return ProductWithOrg(
      product: product,
      organizationId: orgId,
      organizationName: InputSanitizer.sanitizeName(orgName) ?? orgName,
      organizationSlug: orgSlug.toLowerCase().replaceAll(RegExp(r'[^a-z0-9\-_]'), ''),
      organizationLogoUrl: orgLogo,
    );
  }

  Map<String, dynamic> toJson() => {
        ...product.toJson(),
        'organization_id': organizationId,
        'org_name': organizationName,
        'org_slug': organizationSlug,
        'org_logo_url': organizationLogoUrl,
      };

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ProductWithOrg &&
          runtimeType == other.runtimeType &&
          product.id == other.product.id;

  @override
  int get hashCode => product.id.hashCode;

  @override
  String toString() =>
      'ProductWithOrg(id: $id, name: $name, org: $organizationName)';
}

/// Product category with count for filtering
class ProductCategory {
  final String name;
  final int count;

  const ProductCategory({
    required this.name,
    required this.count,
  });

  factory ProductCategory.fromJson(Map<String, dynamic> json) {
    return ProductCategory(
      name: json['category'] as String? ?? '',
      count: json['count'] as int? ?? 0,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ProductCategory &&
          runtimeType == other.runtimeType &&
          name == other.name;

  @override
  int get hashCode => name.hashCode;
}
