import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/utils/result.dart';

/// Result of a paginated query containing data and cursor info.
class PaginatedResult<T> {
  final List<T> items;
  final String? nextCursor;
  final bool hasMore;
  final int totalFetched;

  const PaginatedResult({
    required this.items,
    this.nextCursor,
    this.hasMore = false,
    this.totalFetched = 0,
  });

  /// Create an empty result
  factory PaginatedResult.empty() => const PaginatedResult(
        items: [],
        hasMore: false,
        totalFetched: 0,
      );
}

/// Mixin providing cursor-based pagination capabilities for services.
/// 
/// Industrial best practice: Cursor pagination scales better than offset
/// for large datasets and maintains consistency during concurrent writes.
mixin PaginationMixin on BaseService {
  /// Default page size for paginated queries
  static const int defaultPageSize = 50;

  /// Maximum allowed page size to prevent memory issues
  static const int maxPageSize = 200;

  /// Validate and normalize page size
  int normalizePageSize(int? requestedSize) {
    if (requestedSize == null || requestedSize <= 0) return defaultPageSize;
    if (requestedSize > maxPageSize) {
      logWarning('Page size $requestedSize exceeds max ($maxPageSize), clamping');
      return maxPageSize;
    }
    return requestedSize;
  }

  /// Parse a cursor string into timestamp for comparison
  DateTime? parseCursor(String? cursor) {
    if (cursor == null || cursor.isEmpty) return null;
    try {
      return DateTime.parse(cursor);
    } catch (e) {
      logWarning('Invalid cursor format: $cursor', error: e);
      return null;
    }
  }

  /// Create a cursor from a timestamp
  String createCursor(DateTime timestamp) => timestamp.toIso8601String();

  /// Determine if there are more results based on fetched count vs requested
  bool calculateHasMore(int fetchedCount, int pageSize) => fetchedCount >= pageSize;
}

/// Extension methods for paginated list operations
extension PaginatedListExtensions<T> on List<T> {
  /// Take first n items and determine if more exist
  PaginatedResult<T> toPaginatedResult({
    required int pageSize,
    required String? Function(T) getCursor,
  }) {
    final hasMore = length >= pageSize;
    final items = hasMore ? take(pageSize).toList() : this;
    final nextCursor = items.isNotEmpty ? getCursor(items.last) : null;

    return PaginatedResult(
      items: items,
      nextCursor: nextCursor,
      hasMore: hasMore,
      totalFetched: length,
    );
  }
}
