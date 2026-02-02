import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/product_with_org.dart';
import 'package:thittam1hub/services/product_discovery_service.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart';
import 'package:thittam1hub/widgets/product_discovery_card.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/nav.dart';

/// Products discovery page - browse all products across organizations
class ProductsDiscoveryPage extends StatefulWidget {
  final String? initialCategory;
  final String? initialSort;
  final String? initialSearch;
  final ValueChanged<String?>? onCategoryChanged;
  final ValueChanged<ProductSortBy>? onSortChanged;
  final ValueChanged<String>? onSearchChanged;

  const ProductsDiscoveryPage({
    super.key,
    this.initialCategory,
    this.initialSort,
    this.initialSearch,
    this.onCategoryChanged,
    this.onSortChanged,
    this.onSearchChanged,
  });

  @override
  State<ProductsDiscoveryPage> createState() => _ProductsDiscoveryPageState();
}

class _ProductsDiscoveryPageState extends State<ProductsDiscoveryPage> {
  final ProductDiscoveryService _service = ProductDiscoveryService();
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<ProductWithOrg> _products = [];
  List<ProductCategory> _categories = [];
  String? _selectedCategory;
  ProductSortBy _sortBy = ProductSortBy.featured;
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _errorMessage;
  bool _showSearch = false;
  int _offset = 0;
  bool _hasMore = true;

  static const int _pageSize = 30;

  @override
  void initState() {
    super.initState();
    _initializeFilters();
    _loadCategories();
    _loadProducts();
    _scrollController.addListener(_onScroll);
  }

  void _initializeFilters() {
    _selectedCategory = widget.initialCategory;
    if (widget.initialSort != null) {
      _sortBy = ProductSortByExtension.fromString(widget.initialSort);
    }
    if (widget.initialSearch != null && widget.initialSearch!.isNotEmpty) {
      _searchController.text = widget.initialSearch!;
      _showSearch = true;
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
            _scrollController.position.maxScrollExtent - 200 &&
        !_isLoadingMore &&
        _hasMore) {
      _loadMore();
    }
  }

  Future<void> _loadCategories() async {
    final result = await _service.getGlobalCategories();
    if (result case Success(data: final categories)) {
      if (mounted) {
        setState(() => _categories = categories);
      }
    }
  }

  Future<void> _loadProducts({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _offset = 0;
        _hasMore = true;
      });
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result = await _service.discoverProducts(
      category: _selectedCategory,
      searchQuery: _searchController.text.trim(),
      sortBy: _sortBy,
      limit: _pageSize,
      offset: 0,
    );

    if (!mounted) return;

    switch (result) {
      case Success(data: final products):
        setState(() {
          _products = products;
          _isLoading = false;
          _offset = products.length;
          _hasMore = products.length >= _pageSize;
        });
        // Record impressions
        if (products.isNotEmpty) {
          _service.recordDiscoveryImpression(products.map((p) => p.id).toList());
        }

      case Failure(message: final msg):
        setState(() {
          _errorMessage = msg;
          _isLoading = false;
        });
    }
  }

  Future<void> _loadMore() async {
    if (_isLoadingMore || !_hasMore) return;

    setState(() => _isLoadingMore = true);

    final result = await _service.discoverProducts(
      category: _selectedCategory,
      searchQuery: _searchController.text.trim(),
      sortBy: _sortBy,
      limit: _pageSize,
      offset: _offset,
    );

    if (!mounted) return;

    switch (result) {
      case Success(data: final products):
        setState(() {
          _products.addAll(products);
          _isLoadingMore = false;
          _offset += products.length;
          _hasMore = products.length >= _pageSize;
        });
        // Record impressions
        if (products.isNotEmpty) {
          _service.recordDiscoveryImpression(products.map((p) => p.id).toList());
        }

      case Failure():
        setState(() => _isLoadingMore = false);
    }
  }

  void _onCategoryChanged(String? category) {
    setState(() => _selectedCategory = category);
    widget.onCategoryChanged?.call(category);
    _loadProducts(refresh: true);
  }

  void _onSortChanged(ProductSortBy sort) {
    setState(() => _sortBy = sort);
    widget.onSortChanged?.call(sort);
    _loadProducts(refresh: true);
  }

  void _onSearch() {
    widget.onSearchChanged?.call(_searchController.text.trim());
    _loadProducts(refresh: true);
  }

  @override
  Widget build(BuildContext context) {
    return BrandedRefreshIndicator(
      onRefresh: () => _loadProducts(refresh: true),
      child: CustomScrollView(
        controller: _scrollController,
        slivers: [
          // Search bar (when active)
          if (_showSearch)
            SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(context.horizontalPadding, 8, context.horizontalPadding, 0),
                child: _buildSearchField(),
              ),
            ),
          // Category chips
          SliverToBoxAdapter(
            child: _buildCategoryChips(),
          ),
          // Sort dropdown
          SliverToBoxAdapter(
            child: _buildSortRow(),
          ),
          // Content
          _buildContent(),
          // Loading more indicator
          if (_isLoadingMore)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Center(
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSearchField() {
    final cs = Theme.of(context).colorScheme;
    return TextField(
      controller: _searchController,
      autofocus: true,
      onSubmitted: (_) => _onSearch(),
      decoration: InputDecoration(
        hintText: 'Search products...',
        prefixIcon: Icon(Icons.search, color: cs.onSurfaceVariant),
        suffixIcon: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_searchController.text.isNotEmpty)
              IconButton(
                icon: Icon(Icons.clear, color: cs.onSurfaceVariant, size: 18),
                onPressed: () {
                  _searchController.clear();
                  _onSearch();
                },
              ),
            IconButton(
              icon: Icon(Icons.close, color: cs.onSurfaceVariant),
              onPressed: () {
                _searchController.clear();
                setState(() => _showSearch = false);
                _onSearch();
              },
            ),
          ],
        ),
        filled: true,
        fillColor: cs.surfaceContainerHighest,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      ),
    );
  }

  Widget _buildCategoryChips() {
    final cs = Theme.of(context).colorScheme;

    // Build category list with "All" option
    final displayCategories = <String?>[null]; // null = All
    displayCategories.addAll(_categories.take(8).map((c) => c.name));

    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding, vertical: 4),
        itemCount: displayCategories.length + (_categories.length > 8 ? 1 : 0),
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          // "More" button
          if (i == displayCategories.length) {
            return Semantics(
              button: true,
              label: 'More categories',
              child: GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  _showCategorySheet();
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: cs.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: cs.outline.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.more_horiz, size: 16, color: cs.onSurfaceVariant),
                      const SizedBox(width: 4),
                      Text(
                        'More',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: cs.onSurface,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }

          final cat = displayCategories[i];
          final selected = _selectedCategory == cat;
          final label = cat ?? 'All';

          return Semantics(
            button: true,
            selected: selected,
            label: '$label category${selected ? ", selected" : ""}',
            child: GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                _onCategoryChanged(cat);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: selected ? cs.primary : cs.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: selected ? cs.primary : cs.outline.withValues(alpha: 0.3),
                  ),
                  boxShadow: selected
                      ? [
                          BoxShadow(
                            color: cs.primary.withValues(alpha: 0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: selected ? cs.onPrimary : cs.onSurface,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  void _showCategorySheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _CategorySheet(
        categories: _categories,
        selectedCategory: _selectedCategory,
        onSelected: (cat) {
          Navigator.pop(context);
          _onCategoryChanged(cat);
        },
      ),
    );
  }

  Widget _buildSortRow() {
    final cs = Theme.of(context).colorScheme;

    return Padding(
      padding: EdgeInsets.fromLTRB(context.horizontalPadding, 8, context.horizontalPadding, 8),
      child: Row(
        children: [
          // Sort dropdown
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: cs.outline.withValues(alpha: 0.3)),
            ),
            child: DropdownButton<ProductSortBy>(
              value: _sortBy,
              onChanged: (v) {
                if (v != null) _onSortChanged(v);
              },
              isDense: true,
              underline: const SizedBox.shrink(),
              icon: Icon(Icons.arrow_drop_down, color: cs.onSurfaceVariant),
              items: ProductSortBy.values.map((sort) {
                return DropdownMenuItem(
                  value: sort,
                  child: Text(
                    sort.displayName,
                    style: TextStyle(fontSize: 13, color: cs.onSurface),
                  ),
                );
              }).toList(),
            ),
          ),
          const Spacer(),
          // Search toggle
          IconButton(
            icon: Icon(
              _showSearch ? Icons.search_off : Icons.search,
              color: _showSearch ? cs.primary : cs.onSurfaceVariant,
            ),
            onPressed: () {
              setState(() => _showSearch = !_showSearch);
              if (!_showSearch) {
                _searchController.clear();
                _onSearch();
              }
            },
          ),
          // Result count
          Text(
            '${_products.length} products',
            style: TextStyle(
              fontSize: 12,
              color: cs.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return _buildShimmer();
    }

    if (_errorMessage != null) {
      return _buildError();
    }

    if (_products.isEmpty) {
      return _buildEmpty();
    }

    return _buildProductGrid();
  }

  Widget _buildProductGrid() {
    // Responsive grid using context extensions
    final crossAxisCount = context.gridColumns;

    return SliverPadding(
      padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding),
      sliver: SliverGrid(
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: crossAxisCount,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 0.75,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) => ProductDiscoveryCard(
            product: _products[index],
            onOrganizationTap: () {
              HapticFeedback.lightImpact();
              final slug = _products[index].organizationSlug;
              context.push(AppRoutes.organizationPage(slug));
            },
          ),
          childCount: _products.length,
        ),
      ),
    );
  }

  Widget _buildShimmer() {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 0.75,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) => ShimmerPlaceholder(
            borderRadius: BorderRadius.circular(AppRadius.lg),
          ),
          childCount: 6,
        ),
      ),
    );
  }

  Widget _buildError() {
    final cs = Theme.of(context).colorScheme;
    return SliverFillRemaining(
      hasScrollBody: false,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.error_outline,
                size: 48,
                color: cs.error.withValues(alpha: 0.5),
              ),
              const SizedBox(height: 16),
              Text(
                _errorMessage ?? 'Something went wrong',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () => _loadProducts(refresh: true),
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Try Again'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    final cs = Theme.of(context).colorScheme;
    return SliverFillRemaining(
      hasScrollBody: false,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: cs.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.inventory_2_outlined,
                  size: 40,
                  color: cs.primary.withValues(alpha: 0.5),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'No products found',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                _selectedCategory != null
                    ? 'Try a different category or clear filters'
                    : 'Check back later for new products',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
              ),
              if (_selectedCategory != null) ...[
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () => _onCategoryChanged(null),
                  child: const Text('Clear filters'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Category selection bottom sheet
class _CategorySheet extends StatelessWidget {
  final List<ProductCategory> categories;
  final String? selectedCategory;
  final ValueChanged<String?> onSelected;

  const _CategorySheet({
    required this.categories,
    required this.selectedCategory,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.7,
      ),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: cs.outlineVariant,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Title
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Text(
                  'Categories',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const Spacer(),
                if (selectedCategory != null)
                  TextButton(
                    onPressed: () => onSelected(null),
                    child: const Text('Clear'),
                  ),
              ],
            ),
          ),
          const Divider(height: 1),
          // Category list
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: categories.length + 1, // +1 for "All"
              itemBuilder: (context, index) {
                final isAll = index == 0;
                final cat = isAll ? null : categories[index - 1].name;
                final count = isAll ? null : categories[index - 1].count;
                final selected = selectedCategory == cat;

                return Semantics(
                  button: true,
                  selected: selected,
                  label: '${isAll ? "All Categories" : cat} category${selected ? ", selected" : ""}',
                  child: ListTile(
                    leading: Icon(
                      isAll ? Icons.apps : Icons.label_outline,
                      color: selected ? cs.primary : cs.onSurfaceVariant,
                    ),
                    title: Text(
                      isAll ? 'All Categories' : cat!,
                      style: TextStyle(
                        fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                        color: selected ? cs.primary : cs.onSurface,
                      ),
                    ),
                    trailing: count != null
                        ? Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: cs.surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '$count',
                              style: TextStyle(
                                fontSize: 12,
                                color: cs.onSurfaceVariant,
                              ),
                            ),
                          )
                        : null,
                    selected: selected,
                    onTap: () {
                      HapticFeedback.lightImpact();
                      onSelected(cat);
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
