import 'package:thittam1hub/models/product_with_org.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:thittam1hub/utils/cache_manager.dart';
import 'package:thittam1hub/utils/url_utils.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Service for discovering products across all organizations
/// Implements caching, input validation, and analytics tracking
class ProductDiscoveryService {
  static const String _tag = 'ProductDiscoveryService';
  static final _log = LoggingService.instance;
  final _client = SupabaseConfig.client;

  // Cache keys
  static const _cachePrefix = 'discovery:products';
  static const _categoryCachePrefix = 'discovery:categories';

  /// Maximum products to fetch in a single request
  static const _maxProducts = 100;

  /// Discover products across all organizations
  /// Supports filtering by category, search, and sorting
  Future<Result<List<ProductWithOrg>>> discoverProducts({
    String? category,
    String? searchQuery,
    ProductSortBy sortBy = ProductSortBy.featured,
    int limit = 50,
    int offset = 0,
  }) async {
    final safeLimit = limit.clamp(1, _maxProducts);
    final safeOffset = offset.clamp(0, 10000);

    // Sanitize inputs
    final sanitizedCategory = category != null && category.isNotEmpty
        ? InputSanitizer.sanitizeCategory(category)
        : null;
    final sanitizedSearch = searchQuery != null && searchQuery.isNotEmpty
        ? InputSanitizer.sanitizeSearchQuery(searchQuery)
        : null;

    // Check cache for non-search queries
    final cacheKey = _buildCacheKey(
      category: sanitizedCategory,
      sortBy: sortBy,
      limit: safeLimit,
      offset: safeOffset,
    );
    
    if (sanitizedSearch == null) {
      final cached = AppCache.products.get(cacheKey);
      if (cached != null) {
        return Success(List<ProductWithOrg>.from(cached as List));
      }
    }

    try {
      // Build base query with organization join
      var baseQuery = _client
          .from('organization_products')
          .select('''
            *,
            organizations!inner(
              id,
              name,
              slug,
              logo_url,
              status
            )
          ''')
          .eq('status', 'active')
          .eq('organizations.status', 'approved');

      // Apply category filter
      if (sanitizedCategory != null && sanitizedCategory.isNotEmpty) {
        baseQuery = baseQuery.eq('category', sanitizedCategory);
      }

      // Apply search filter
      if (sanitizedSearch != null && sanitizedSearch.isNotEmpty) {
        baseQuery = baseQuery.or('name.ilike.%$sanitizedSearch%,description.ilike.%$sanitizedSearch%');
      }

      // Apply sorting and pagination in a single chain
      final response = await (() {
        switch (sortBy) {
          case ProductSortBy.featured:
            return baseQuery
                .order('is_featured', ascending: false)
                .order('featured_position', ascending: true, nullsFirst: false)
                .order('created_at', ascending: false)
                .range(safeOffset, safeOffset + safeLimit - 1);
          case ProductSortBy.newest:
            return baseQuery
                .order('created_at', ascending: false)
                .range(safeOffset, safeOffset + safeLimit - 1);
          case ProductSortBy.priceAsc:
            return baseQuery
                .order('price', ascending: true, nullsFirst: false)
                .order('created_at', ascending: false)
                .range(safeOffset, safeOffset + safeLimit - 1);
          case ProductSortBy.priceDesc:
            return baseQuery
                .order('price', ascending: false, nullsFirst: true)
                .order('created_at', ascending: false)
                .range(safeOffset, safeOffset + safeLimit - 1);
          case ProductSortBy.popular:
            return baseQuery
                .order('click_count', ascending: false)
                .order('impression_count', ascending: false)
                .order('created_at', ascending: false)
                .range(safeOffset, safeOffset + safeLimit - 1);
        }
      })();

      final products = (response as List)
          .map((e) => _parseProductWithOrg(Map<String, dynamic>.from(e)))
          .where((p) => p != null && p.isValid)
          .cast<ProductWithOrg>()
          .toList();

      // Cache result (only for non-search queries)
      if (sanitizedSearch == null) {
        AppCache.products.set(cacheKey, products);
      }

      return Success(products);
    } catch (e) {
      _log.error('Failed to discover products', tag: _tag, error: e);
      return Failure(_parseError('Failed to load products', e));
    }
  }

  /// Get all product categories across organizations with counts
  Future<Result<List<ProductCategory>>> getGlobalCategories() async {
    // Check cache
    final cacheKey = '$_categoryCachePrefix:global';
    final cached = AppCache.products.get(cacheKey);
    if (cached != null) {
      return Success(List<ProductCategory>.from(cached as List));
    }

    try {
      // Get categories with counts
      final response = await _client
          .from('organization_products')
          .select('category')
          .eq('status', 'active')
          .not('category', 'is', null);

      // Count categories manually since Supabase doesn't support GROUP BY in select
      final categoryMap = <String, int>{};
      for (final row in response as List) {
        final cat = row['category'] as String?;
        if (cat != null && cat.isNotEmpty) {
          final sanitized = InputSanitizer.sanitizeCategory(cat);
          if (sanitized != null && sanitized.isNotEmpty) {
            categoryMap[sanitized] = (categoryMap[sanitized] ?? 0) + 1;
          }
        }
      }

      final categories = categoryMap.entries
          .map((e) => ProductCategory(name: e.key, count: e.value))
          .toList()
        ..sort((a, b) => b.count.compareTo(a.count)); // Sort by count descending

      // Cache result
      AppCache.products.set(
        cacheKey,
        categories,
        ttl: const Duration(minutes: 10),
      );

      return Success(categories);
    } catch (e) {
      _log.error('Failed to get global categories', tag: _tag, error: e);
      return Failure(_parseError('Failed to load categories', e));
    }
  }

  /// Record discovery impression for analytics
  Future<void> recordDiscoveryImpression(List<String> productIds) async {
    if (productIds.isEmpty) return;

    // Validate all product IDs
    final validIds = productIds
        .where((id) => InputSanitizer.isValidUuid(id))
        .take(50) // Limit batch size
        .toList();

    if (validIds.isEmpty) return;

    try {
      await _client.rpc(
        'record_organization_product_metrics',
        params: {
          '_product_ids': validIds,
          '_event_type': 'impression',
        },
      );
    } catch (_) {
      // Silently fail analytics - don't disrupt UX
    }
  }

  /// Record product click for analytics
  Future<void> recordClick(String productId) async {
    if (!InputSanitizer.isValidUuid(productId)) return;

    try {
      await _client.rpc(
        'record_organization_product_metrics',
        params: {
          '_product_ids': [productId],
          '_event_type': 'click',
        },
      );
    } catch (_) {
      // Silently fail analytics - don't disrupt UX
    }
  }

  /// Invalidate discovery cache
  void invalidateCache() {
    AppCache.products.removeByPrefix(_cachePrefix);
    AppCache.products.removeByPrefix(_categoryCachePrefix);
  }

  // ─────────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────────

  String _buildCacheKey({
    String? category,
    required ProductSortBy sortBy,
    required int limit,
    required int offset,
  }) {
    final parts = [_cachePrefix];
    if (category != null) parts.add('cat:$category');
    parts.add('sort:${sortBy.queryValue}');
    parts.add('limit:$limit');
    parts.add('offset:$offset');
    return parts.join(':');
  }

  ProductWithOrg? _parseProductWithOrg(Map<String, dynamic> json) {
    try {
      // Extract organization data from nested object
      final orgData = json['organizations'] as Map<String, dynamic>?;
      if (orgData == null) return null;

      // Flatten the structure for ProductWithOrg parsing
      final flattenedJson = {
        ...json,
        'org_name': orgData['name'],
        'org_slug': orgData['slug'],
        'org_logo_url': orgData['logo_url'],
      };

      return ProductWithOrg.fromJson(flattenedJson);
    } catch (e) {
      _log.warning('Error parsing ProductWithOrg', tag: _tag, error: e);
      return null;
    }
  }

  String _parseError(String prefix, dynamic error) {
    final errorStr = error.toString().toLowerCase();

    if (errorStr.contains('network') || errorStr.contains('socket')) {
      return 'Network error. Please check your connection.';
    }
    if (errorStr.contains('timeout')) {
      return 'Request timed out. Please try again.';
    }
    if (errorStr.contains('permission') || errorStr.contains('denied')) {
      return 'You don\'t have permission to view this.';
    }

    return '$prefix. Please try again.';
  }
}
