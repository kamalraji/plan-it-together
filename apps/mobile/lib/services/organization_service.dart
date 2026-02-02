import 'package:thittam1hub/models/organization_detail.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:thittam1hub/utils/cache_manager.dart';
import 'package:thittam1hub/utils/url_utils.dart';

/// Service for fetching organization details and related data
/// Implements caching and input validation for security and performance
class OrganizationService extends BaseService {
  @override
  String get tag => 'OrganizationService';
  
  // Singleton pattern
  static OrganizationService? _instance;
  static OrganizationService get instance => _instance ??= OrganizationService._();
  OrganizationService._();
  
  final _client = SupabaseConfig.client;
  
  // Cache keys
  static const _cachePrefix = 'org';
  static const _slugCachePrefix = 'org:slug';
  static const _eventsCachePrefix = 'events:org';

  /// Get organization by slug (for deep links)
  /// Validates slug format before querying
  Future<Result<OrganizationDetail?>> getOrganizationBySlug(String slug) async {
    // Validate and sanitize slug
    final sanitizedSlug = UrlUtils.sanitizeSlug(slug);
    if (sanitizedSlug.isEmpty || !UrlUtils.isValidSlug(sanitizedSlug)) {
      return const Failure('Invalid organization slug');
    }

    // Check cache first
    final cacheKey = '$_slugCachePrefix:$sanitizedSlug';
    final cached = AppCache.organizations.get(cacheKey);
    if (cached != null) {
      return Success(cached as OrganizationDetail);
    }

    try {
      final response = await _client
          .from('organizations')
          .select()
          .eq('slug', sanitizedSlug)
          .maybeSingle();
      
      if (response == null) {
        return const Success(null);
      }
      
      // Get event count with proper filtering
      final eventCountResponse = await _client
          .from('events')
          .select('id')
          .eq('organization_id', response['id'])
          .inFilter('status', ['PUBLISHED', 'ONGOING', 'COMPLETED']);
      
      // Get product count
      final productCountResponse = await _client
          .from('organization_products')
          .select('id')
          .eq('organization_id', response['id'])
          .eq('status', 'active');
      
      final data = Map<String, dynamic>.from(response);
      data['event_count'] = (eventCountResponse as List).length;
      data['product_count'] = (productCountResponse as List).length;
      
      final org = OrganizationDetail.fromJson(data);
      
      // Validate parsed data
      if (!org.isValid) {
        return const Failure('Invalid organization data received');
      }
      
      // Cache the result
      AppCache.organizations.set(cacheKey, org);
      AppCache.organizations.set('$_cachePrefix:${org.id}', org);
      
      return Success(org);
    } catch (e) {
      logError('Failed to load organization by slug', error: e);
      return Failure(_parseError('Failed to load organization', e));
    }
  }

  /// Get organization by ID
  /// Validates UUID format before querying
  Future<Result<OrganizationDetail?>> getOrganizationById(String id) async {
    // Validate UUID format
    if (!InputSanitizer.isValidUuid(id)) {
      return const Failure('Invalid organization ID format');
    }

    // Check cache first
    final cacheKey = '$_cachePrefix:$id';
    final cached = AppCache.organizations.get(cacheKey);
    if (cached != null) {
      return Success(cached as OrganizationDetail);
    }

    try {
      final response = await _client
          .from('organizations')
          .select()
          .eq('id', id)
          .maybeSingle();
      
      if (response == null) {
        return const Success(null);
      }
      
      // Get event count
      final eventCountResponse = await _client
          .from('events')
          .select('id')
          .eq('organization_id', id)
          .inFilter('status', ['PUBLISHED', 'ONGOING', 'COMPLETED']);
      
      // Get product count
      final productCountResponse = await _client
          .from('organization_products')
          .select('id')
          .eq('organization_id', id)
          .eq('status', 'active');
      
      final data = Map<String, dynamic>.from(response);
      data['event_count'] = (eventCountResponse as List).length;
      data['product_count'] = (productCountResponse as List).length;
      
      final org = OrganizationDetail.fromJson(data);
      
      // Validate parsed data
      if (!org.isValid) {
        return const Failure('Invalid organization data received');
      }
      
      // Cache the result
      AppCache.organizations.set(cacheKey, org);
      AppCache.organizations.set('$_slugCachePrefix:${org.slug}', org);
      
      return Success(org);
    } catch (e) {
      logError('Failed to load organization by ID', error: e);
      return Failure(_parseError('Failed to load organization', e));
    }
  }

  /// Get events by organization
  /// Implements pagination with sensible defaults
  Future<Result<List<Event>>> getOrganizationEvents(
    String orgId, {
    int limit = 20,
    int offset = 0,
  }) async {
    // Validate inputs
    if (!InputSanitizer.isValidUuid(orgId)) {
      return const Failure('Invalid organization ID');
    }
    
    // Clamp limit to prevent abuse
    final safeLimit = limit.clamp(1, 50);
    final safeOffset = offset.clamp(0, 10000);

    // Check cache for first page
    final cacheKey = '$_eventsCachePrefix:$orgId:$safeOffset:$safeLimit';
    if (safeOffset == 0) {
      final cached = AppCache.events.get(cacheKey);
      if (cached != null) {
        return Success(List<Event>.from(cached as List));
      }
    }

    try {
      final response = await _client
          .from('events')
          .select('''
            *,
            organization:organizations(id, name, slug, logo_url, verification_status)
          ''')
          .eq('organization_id', orgId)
          .inFilter('status', ['PUBLISHED', 'ONGOING', 'COMPLETED'])
          .order('start_date', ascending: false)
          .range(safeOffset, safeOffset + safeLimit - 1);
      
      final events = (response as List)
          .map((e) => Event.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      
      // Cache first page
      if (safeOffset == 0) {
        AppCache.events.set(cacheKey, events);
      }
      
      return Success(events);
    } catch (e) {
      logError('Failed to load organization events', error: e, metadata: {'orgId': orgId});
      return Failure(_parseError('Failed to load events', e));
    }
  }

  /// Get upcoming events by organization
  Future<Result<List<Event>>> getUpcomingEvents(
    String orgId, {
    int limit = 10,
  }) async {
    // Validate inputs
    if (!InputSanitizer.isValidUuid(orgId)) {
      return const Failure('Invalid organization ID');
    }
    
    final safeLimit = limit.clamp(1, 20);
    
    // Check cache
    final cacheKey = '$_eventsCachePrefix:$orgId:upcoming:$safeLimit';
    final cached = AppCache.events.get(cacheKey);
    if (cached != null) {
      return Success(List<Event>.from(cached as List));
    }

    try {
      final now = DateTime.now().toIso8601String();
      final response = await _client
          .from('events')
          .select('''
            *,
            organization:organizations(id, name, slug, logo_url, verification_status)
          ''')
          .eq('organization_id', orgId)
          .inFilter('status', ['PUBLISHED', 'ONGOING'])
          .gte('end_date', now)
          .order('start_date', ascending: true)
          .limit(safeLimit);
      
      final events = (response as List)
          .map((e) => Event.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      
      // Cache result
      AppCache.events.set(cacheKey, events, ttl: const Duration(minutes: 2));
      
      return Success(events);
    } catch (e) {
      logError('Failed to load upcoming events', error: e, metadata: {'orgId': orgId});
      return Failure(_parseError('Failed to load events', e));
    }
  }

  /// Invalidate cache for an organization
  void invalidateCache(String orgId) {
    AppCache.clearForOrganization(orgId);
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
    
    // Don't expose raw database errors in production
    return '$prefix. Please try again.';
  }
}
