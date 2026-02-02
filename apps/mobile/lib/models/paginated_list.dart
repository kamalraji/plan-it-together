/// A generic paginated list model for handling pagination
class PaginatedList<T> {
  final List<T> items;
  final int totalCount;
  final int currentPage;
  final int pageSize;

  const PaginatedList({
    required this.items,
    required this.totalCount,
    this.currentPage = 0,
    this.pageSize = 10,
  });

  /// Whether there are more items to load
  bool get hasMore => (currentPage + 1) * pageSize < totalCount;

  /// The next page number to load
  int get nextPage => currentPage + 1;

  /// Total number of pages
  int get totalPages => (totalCount / pageSize).ceil();

  /// Whether this is the first page
  bool get isFirstPage => currentPage == 0;

  /// Whether this is the last page
  bool get isLastPage => !hasMore;

  /// Create an empty paginated list
  factory PaginatedList.empty() => PaginatedList<T>(
        items: [],
        totalCount: 0,
        currentPage: 0,
        pageSize: 10,
      );

  /// Merge with another paginated list (for infinite scroll)
  PaginatedList<T> merge(PaginatedList<T> other) {
    return PaginatedList<T>(
      items: [...items, ...other.items],
      totalCount: other.totalCount,
      currentPage: other.currentPage,
      pageSize: other.pageSize,
    );
  }

  /// Map items to a new type
  PaginatedList<R> map<R>(R Function(T) transform) {
    return PaginatedList<R>(
      items: items.map(transform).toList(),
      totalCount: totalCount,
      currentPage: currentPage,
      pageSize: pageSize,
    );
  }

  @override
  String toString() =>
      'PaginatedList(items: ${items.length}, total: $totalCount, page: $currentPage, hasMore: $hasMore)';
}
