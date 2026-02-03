import 'package:thittam1hub/models/product.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:thittam1hub/utils/cache_manager.dart';
import 'package:thittam1hub/utils/url_utils.dart';

/// Service for fetching and managing organization products
/// Implements caching, input validation, and analytics tracking
class ProductService {
  final _client = SupabaseConfig.client;
  
  // Cache keys
  static const _cachePrefix = 'products';
  static const _categoryCachePrefix = 'products:categories';
  static const _featuredCachePrefix = 'products:featured';

  /// Maximum products to fetch in a single request
  static const _maxProducts = 100;

  /// Get all products for an organization
  /// Validates org ID and implements caching
  Future<Result<List<Product>>> getProductsByOrganization(
    String orgId, {
    int limit = 50,
  }) async {
    // Validate org ID
    if (!InputSanitizer.isValidUuid(orgId)) {
      return const Failure('Invalid organization ID');
    }
    
    final safeLimit = limit.clamp(1, _maxProducts);
    
    // Check cache
    final cacheKey = '$_cachePrefix:$orgId:$safeLimit';
    final cached = AppCache.products.get(cacheKey);
    if (cached != null) {
      return Success(List<Product>.from(cached as List));
    }

    try {
      final response = await _client
          .from('organization_products')
          .select()
          .eq('organization_id', orgId)
          .eq('status', 'active')
          .order('is_featured', ascending: false)
          .order('featured_position', ascending: true, nullsFirst: false)
          .order('position', ascending: true, nullsFirst: false)
          .order('created_at', ascending: false)
          .limit(safeLimit);
      
      final products = (response as List)
          .map((e) => Product.fromJson(Map<String, dynamic>.from(e)))
          .where((p) => p.isValid) // Filter out invalid products
          .toList();
      
      // Cache result
      AppCache.products.set(cacheKey, products);
      
      return Success(products);
    } catch (e) {
      return Failure(_parseError('Failed to load products', e));
    }
  }

  /// Get products by category
  /// Validates and sanitizes category input
  Future<Result<List<Product>>> getProductsByCategory(
    String orgId,
    String category, {
    int limit = 50,
  }) async {
    // Validate inputs
    if (!InputSanitizer.isValidUuid(orgId)) {
      return const Failure('Invalid organization ID');
    }
    
    final sanitizedCategory = InputSanitizer.sanitizeCategory(category);
    if (sanitizedCategory == null || sanitizedCategory.isEmpty) {
      return const Failure('Invalid category');
    }
    
    final safeLimit = limit.clamp(1, _maxProducts);
    
    // Check cache
    final cacheKey = '$_cachePrefix:$orgId:category:$sanitizedCategory:$safeLimit';
    final cached = AppCache.products.get(cacheKey);
    if (cached != null) {
      return Success(List<Product>.from(cached as List));
    }

    try {
      final response = await _client
          .from('organization_products')
          .select()
          .eq('organization_id', orgId)
          .eq('status', 'active')
          .eq('category', sanitizedCategory)
          .order('is_featured', ascending: false)
          .order('position', ascending: true, nullsFirst: false)
          .order('created_at', ascending: false)
          .limit(safeLimit);
      
      final products = (response as List)
          .map((e) => Product.fromJson(Map<String, dynamic>.from(e)))
          .where((p) => p.isValid)
          .toList();
      
      // Cache result
      AppCache.products.set(cacheKey, products, ttl: const Duration(minutes: 3));
      
      return Success(products);
    } catch (e) {
      return Failure(_parseError('Failed to load products', e));
    }
  }

  /// Get featured products
  Future<Result<List<Product>>> getFeaturedProducts(
    String orgId, {
    int limit = 10,
  }) async {
    // Validate org ID
    if (!InputSanitizer.isValidUuid(orgId)) {
      return const Failure('Invalid organization ID');
    }
    
    final safeLimit = limit.clamp(1, 20);
    
    // Check cache
    final cacheKey = '$_featuredCachePrefix:$orgId:$safeLimit';
    final cached = AppCache.products.get(cacheKey);
    if (cached != null) {
      return Success(List<Product>.from(cached as List));
    }

    try {
      final response = await _client
          .from('organization_products')
          .select()
          .eq('organization_id', orgId)
          .eq('status', 'active')
          .eq('is_featured', true)
          .order('featured_position', ascending: true, nullsFirst: false)
          .order('created_at', ascending: false)
          .limit(safeLimit);
      
      final products = (response as List)
          .map((e) => Product.fromJson(Map<String, dynamic>.from(e)))
          .where((p) => p.isValid)
          .toList();
      
      // Cache result
      AppCache.products.set(cacheKey, products);
      
      return Success(products);
    } catch (e) {
      return Failure(_parseError('Failed to load featured products', e));
    }
  }

  /// Get product categories for an organization
  Future<Result<List<String>>> getProductCategories(String orgId) async {
    // Validate org ID
    if (!InputSanitizer.isValidUuid(orgId)) {
      return const Failure('Invalid organization ID');
    }
    
    // Check cache
    final cacheKey = '$_categoryCachePrefix:$orgId';
    final cached = AppCache.products.get(cacheKey);
    if (cached != null) {
      return Success(List<String>.from(cached as List));
    }

    try {
      final response = await _client
          .from('organization_products')
          .select('category')
          .eq('organization_id', orgId)
          .eq('status', 'active')
          .not('category', 'is', null);
      
      final categories = (response as List)
          .map((e) => e['category'] as String?)
          .whereType<String>()
          .where((c) => c.isNotEmpty)
          .map((c) => InputSanitizer.sanitizeCategory(c))
          .whereType<String>()
          .toSet()
          .toList()
        ..sort();
      
      // Cache result
      AppCache.products.set(cacheKey, categories, ttl: const Duration(minutes: 10));
      
      return Success(categories);
    } catch (e) {
      return Failure(_parseError('Failed to load categories', e));
    }
  }

  /// Record product impressions (analytics)
  /// Validates product IDs before recording
  Future<void> recordImpressions(List<String> productIds) async {
    if (productIds.isEmpty) return;
    
    // Validate all product IDs
    final validIds = productIds
        .where((id) => InputSanitizer.isValidUuid(id))
        .take(50) // Limit batch size
        .toList();
    
    if (validIds.isEmpty) return;
    
    try {
      // Use batch update for efficiency
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

  /// Record product click (analytics)
  /// Validates product ID before recording
  Future<void> recordClick(String productId) async {
    // Validate product ID
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

  /// Invalidate cache for an organization's products
  void invalidateCache(String orgId) {
    AppCache.products.removeByPrefix('$_cachePrefix:$orgId');
    AppCache.products.removeByPrefix('$_featuredCachePrefix:$orgId');
    AppCache.products.removeByPrefix('$_categoryCachePrefix:$orgId');
  }

  /// Parse database errors into user-friendly messages
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
