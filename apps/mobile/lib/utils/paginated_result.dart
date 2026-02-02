/// Generic paginated result wrapper for cursor-based pagination.
/// Uses cursor-based approach for optimal performance on high-traffic tables.
class PaginatedResult<T> {
  final List<T> items;
  final String? nextCursor;
  final bool hasMore;
  final int? totalCount;

  const PaginatedResult({
    required this.items,
    this.nextCursor,
    this.hasMore = false,
    this.totalCount,
  });

  /// Creates an empty result.
  factory PaginatedResult.empty() => const PaginatedResult(
        items: [],
        hasMore: false,
      );

  /// Creates a result from a list when all items fit in one page.
  factory PaginatedResult.fromList(List<T> items) => PaginatedResult(
        items: items,
        hasMore: false,
      );

  /// Whether this result has any items.
  bool get isEmpty => items.isEmpty;
  bool get isNotEmpty => items.isNotEmpty;

  /// Number of items in this page.
  int get length => items.length;

  /// Maps the items to a new type.
  PaginatedResult<R> map<R>(R Function(T) mapper) => PaginatedResult(
        items: items.map(mapper).toList(),
        nextCursor: nextCursor,
        hasMore: hasMore,
        totalCount: totalCount,
      );

  @override
  String toString() =>
      'PaginatedResult(items: ${items.length}, hasMore: $hasMore, cursor: $nextCursor)';
}

/// Pagination parameters for cursor-based queries.
class PaginationParams {
  final String? cursor;
  final int limit;
  final SortDirection direction;

  const PaginationParams({
    this.cursor,
    this.limit = 20,
    this.direction = SortDirection.desc,
  });

  /// Default pagination with 20 items per page.
  static const defaultParams = PaginationParams();

  /// First page with custom limit.
  factory PaginationParams.first({int limit = 20}) => PaginationParams(limit: limit);

  /// Next page from cursor.
  factory PaginationParams.next(String cursor, {int limit = 20}) =>
      PaginationParams(cursor: cursor, limit: limit);

  @override
  String toString() => 'PaginationParams(cursor: $cursor, limit: $limit)';
}

enum SortDirection { asc, desc }
