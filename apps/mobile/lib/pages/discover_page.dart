import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/event_card.dart';
import 'package:thittam1hub/utils/animations.dart';
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/utils/icon_mappings.dart';
import 'package:thittam1hub/pages/discover/discover_page_controller.dart';
import 'package:thittam1hub/pages/discover/products_discovery_page.dart';
import 'package:thittam1hub/pages/discover/discover_tabs.dart';
import 'package:thittam1hub/models/product_with_org.dart';
class DiscoverPage extends StatefulWidget {
  final String? initialView;
  final String? initialCategory;
  final String? initialMode;
  final String? initialSort;
  final String? initialSearch;
  
  const DiscoverPage({
    super.key,
    this.initialView,
    this.initialCategory,
    this.initialMode,
    this.initialSort,
    this.initialSearch,
  });

  @override
  State<DiscoverPage> createState() => _DiscoverPageState();
}

class _DiscoverPageState extends State<DiscoverPage> {
  final TextEditingController _searchController = TextEditingController();
  late final DiscoverPageController _controller;
  late final FocusNode _pageFocusNode;
  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();
    _pageFocusNode = FocusNode();
    _controller = DiscoverPageController(
      initialView: widget.initialView,
      initialCategory: widget.initialCategory,
      initialMode: widget.initialMode,
      initialSort: widget.initialSort,
      initialSearch: widget.initialSearch,
    );
    _controller.addListener(_onControllerChanged);
    _controller.initialize();
    
    // Pre-populate search controller if initial search exists
    if (widget.initialSearch != null && widget.initialSearch!.isNotEmpty) {
      _searchController.text = widget.initialSearch!;
    }
    
    // Sync search controller with debounced URL updates
    _searchController.addListener(_onSearchChanged);
  }
  
  void _onSearchChanged() {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 300), () {
      _controller.setSearchQuery(_searchController.text);
      if (_searchController.text.isNotEmpty) _updateUrl();
    });
  }
  
  void _onControllerChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _pageFocusNode.dispose();
    _controller.removeListener(_onControllerChanged);
    _controller.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _updateUrl() {
    final params = _controller.getUrlParams();
    final url = AppRoutes.discoverWithFilters(
      view: params.view,
      category: params.category,
      mode: params.mode,
      sort: params.sort,
      searchQuery: params.searchQuery,
    );
    context.replace(url);
  }
  
  void _onViewChanged(DiscoverView view) {
    _controller.setView(view);
    _searchController.clear();
    _updateUrl();
  }
  
  void _onCategoryChanged(EventCategory? category) {
    _controller.setCategory(category);
    _updateUrl();
  }
  
  void _onModeChanged(EventMode? mode) {
    _controller.setMode(mode);
    _updateUrl();
  }
  
  void _onProductCategoryChanged(String? category) {
    _controller.setProductCategory(category);
    _updateUrl();
  }
  
  void _onProductSortChanged(ProductSortBy sort) {
    _controller.setProductSort(sort);
    _updateUrl();
  }
  
  void _onProductSearchChanged(String query) {
    _controller.setSearchQuery(query);
    _updateUrl();
  }

  Widget _buildSearchField(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return SizedBox(
      width: 200,
      height: 36,
      child: TextField(
        controller: _searchController,
        autofocus: true,
        style: const TextStyle(fontSize: 13),
        decoration: InputDecoration(
          hintText: 'Search events...',
          hintStyle: TextStyle(fontSize: 13, color: cs.onSurfaceVariant),
          prefixIcon: Icon(Icons.search, color: cs.onSurfaceVariant, size: 18),
          suffixIcon: IconButton(
            icon: Icon(Icons.close, color: cs.onSurfaceVariant, size: 16),
            onPressed: () {
              _searchController.clear();
              _controller.clearSearch();
            },
          ),
          filled: true,
          fillColor: cs.surfaceContainerHighest,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(999),
            borderSide: BorderSide.none,
          ),
          contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
          isDense: true,
        ),
      ),
    );
  }

  /// Combined filter row with category chips + mode toggles
  Widget _combinedFilterChips() {
    final cs = Theme.of(context).colorScheme;
    
    // Total items: categories + "More" + divider + 3 modes
    final totalItems = DiscoverPageController.featuredCategories.length + 1 + 1 + EventMode.values.length;
    
    return SizedBox(
      height: 36,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 4),
        itemCount: totalItems,
        itemBuilder: (_, i) {
          final featuredCats = DiscoverPageController.featuredCategories;
          
          // Category chips (0 to featuredCats.length - 1)
          if (i < featuredCats.length) {
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: _buildCategoryChip(featuredCats[i], cs),
            );
          }
          
          // "More" button
          if (i == featuredCats.length) {
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: _buildMoreButton(cs),
            );
          }
          
          // Visual divider
          if (i == featuredCats.length + 1) {
            return _buildChipDivider(cs);
          }
          
          // Mode chips (Online, Offline, Hybrid)
          final modeIndex = i - featuredCats.length - 2;
          final mode = EventMode.values[modeIndex];
          return Padding(
            padding: EdgeInsets.only(right: modeIndex < EventMode.values.length - 1 ? 8 : 0),
            child: _buildModeChip(mode, cs),
          );
        },
      ),
    );
  }
  
  Widget _buildCategoryChip(EventCategory? cat, ColorScheme cs) {
    final selected = _controller.selectedCategory == cat;
    final label = cat == null ? 'All' : cat.displayName;
    final icon = cat == null 
        ? IconMappings.filterAll 
        : IconMappings.getEventCategoryIcon(cat);
    final color = cat == null 
        ? cs.primary 
        : IconMappings.getEventCategoryColor(cat);
    
    return Semantics(
      button: true,
      selected: selected,
      label: '$label category filter${selected ? ", selected" : ""}',
      child: GestureDetector(
        onTap: () {
          HapticFeedback.lightImpact();
          _onCategoryChanged(cat);
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: selected ? color : cs.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: selected ? color : cs.outline.withValues(alpha: 0.3),
              width: 1.5,
            ),
            boxShadow: selected ? [
              BoxShadow(
                color: color.withValues(alpha: 0.3),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ] : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: selected ? Colors.white : cs.onSurfaceVariant),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: selected ? Colors.white : cs.onSurface,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildMoreButton(ColorScheme cs) {
    return Semantics(
      button: true,
      label: 'More categories',
      child: GestureDetector(
        onTap: () {
          HapticFeedback.lightImpact();
          _showCategorySheet();
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: cs.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: cs.outline.withValues(alpha: 0.3), width: 1.5),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.more_horiz_rounded, size: 16, color: cs.onSurfaceVariant),
              const SizedBox(width: 4),
              Text(
                'More',
                style: TextStyle(
                  fontSize: 12,
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
  
  Widget _buildChipDivider(ColorScheme cs) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: Container(
        width: 1,
        height: 20,
        color: cs.outline.withValues(alpha: 0.4),
      ),
    );
  }
  
  Widget _buildModeChip(EventMode mode, ColorScheme cs) {
    final selected = _controller.selectedMode == mode;
    final icon = IconMappings.getEventModeIcon(mode);
    final color = IconMappings.getEventModeColor(mode);
    final label = IconMappings.eventModeLabels[mode] ?? mode.name;
    
    return Semantics(
      button: true,
      selected: selected,
      label: '$label mode filter${selected ? ", selected" : ""}',
      child: GestureDetector(
        onTap: () {
          HapticFeedback.lightImpact();
          _onModeChanged(selected ? null : mode);
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: selected ? color : cs.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: selected ? color : cs.outline.withValues(alpha: 0.3),
              width: 1.5,
            ),
            boxShadow: selected ? [
              BoxShadow(
                color: color.withValues(alpha: 0.3),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ] : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: selected ? Colors.white : cs.onSurfaceVariant),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: selected ? Colors.white : cs.onSurface,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showCategorySheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _CategoryFilterSheet(
        selectedCategory: _controller.selectedCategory,
        onCategorySelected: (cat) {
          _onCategoryChanged(cat);
          Navigator.pop(context);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isLarge = context.showMasterDetail;
    
    return Shortcuts(
      shortcuts: {
        LogicalKeySet(LogicalKeyboardKey.keyE): const _EventsViewIntent(),
        LogicalKeySet(LogicalKeyboardKey.keyP): const _ProductsViewIntent(),
        LogicalKeySet(LogicalKeyboardKey.keyS): const _SearchIntent(),
        LogicalKeySet(LogicalKeyboardKey.keyR): const _RefreshIntent(),
      },
      child: Actions(
        actions: {
          _EventsViewIntent: CallbackAction<_EventsViewIntent>(
            onInvoke: (_) {
              _onViewChanged(DiscoverView.events);
              return null;
            },
          ),
          _ProductsViewIntent: CallbackAction<_ProductsViewIntent>(
            onInvoke: (_) {
              _onViewChanged(DiscoverView.products);
              return null;
            },
          ),
          _SearchIntent: CallbackAction<_SearchIntent>(
            onInvoke: (_) {
              _controller.toggleSearch();
              return null;
            },
          ),
          _RefreshIntent: CallbackAction<_RefreshIntent>(
            onInvoke: (_) {
              _controller.onRefresh();
              return null;
            },
          ),
        },
        child: Focus(
          focusNode: _pageFocusNode,
          autofocus: true,
          child: Scaffold(
            backgroundColor: cs.surface,
            body: SafeArea(
              child: isLarge 
                  ? _buildLargeScreenLayout(context, cs, textTheme)
                  : _buildMobileLayout(context, cs, textTheme),
            ),
          ),
        ),
      ),
    );
  }
  
  Widget _buildMobileLayout(BuildContext context, ColorScheme cs, TextTheme textTheme) {
    // Products view
    if (_controller.currentView == DiscoverView.products) {
      return Column(
        children: [
          _buildMobileAppBarHeader(cs, textTheme),
          Expanded(
            child: ProductsDiscoveryPage(
              initialCategory: _controller.productCategory,
              initialSort: _controller.productSort.queryValue,
              initialSearch: _controller.searchQuery,
              onCategoryChanged: _onProductCategoryChanged,
              onSortChanged: _onProductSortChanged,
              onSearchChanged: _onProductSearchChanged,
            ),
          ),
        ],
      );
    }
    
    // Events view
    return BrandedRefreshIndicator(
      onRefresh: _controller.onRefresh,
      child: CustomScrollView(
        slivers: [
          _buildAppBar(cs, textTheme),
          _buildFilters(),
          SliverFillRemaining(
            child: _EventsList(
              isLoading: _controller.isLoading,
              events: _controller.filteredEvents,
              tiersByEvent: _controller.tiersByEvent,
              savedEventIds: _controller.savedEventIds,
              onRefresh: _controller.onRefresh,
              onToggleSave: (id) => _controller.toggleSaveEvent(id),
              onEventTap: (e) => context.push(AppRoutes.eventDetail(e.id), extra: e),
              errorMessage: _controller.errorMessage,
            ),
          ),
        ],
      ),
    );
  }
  
  /// Mobile header with view toggle for products
  Widget _buildMobileAppBarHeader(ColorScheme cs, TextTheme textTheme) {
    return Container(
      height: context.appBarHeight,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border(bottom: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.3))),
      ),
      child: Row(
        children: [
          Text('Discover', style: textTheme.titleLarge),
          const SizedBox(width: 12),
          DiscoverTabSelector(
            currentView: _controller.currentView,
            onViewChanged: _onViewChanged,
            compact: true,
          ),
          const Spacer(),
        ],
      ),
    );
  }
  
  Widget _buildLargeScreenLayout(BuildContext context, ColorScheme cs, TextTheme textTheme) {
    // Products view - full width
    if (_controller.currentView == DiscoverView.products) {
      return Column(
        children: [
          // Header with view toggle
          Container(
            height: context.appBarHeight,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: cs.surface,
              border: Border(bottom: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.3))),
            ),
            child: Row(
              children: [
                Text('Discover', style: textTheme.titleLarge),
                const SizedBox(width: 16),
                DiscoverTabSelector(
                  currentView: _controller.currentView,
                  onViewChanged: _onViewChanged,
                ),
                const Spacer(),
              ],
            ),
          ),
          Expanded(
            child: ProductsDiscoveryPage(
              initialCategory: _controller.productCategory,
              initialSort: _controller.productSort.queryValue,
              initialSearch: _controller.searchQuery,
              onCategoryChanged: _onProductCategoryChanged,
              onSortChanged: _onProductSortChanged,
              onSearchChanged: _onProductSearchChanged,
            ),
          ),
        ],
      );
    }
    
    // Events view - master-detail layout
    final filteredEvents = _controller.filteredEvents;
    
    return Row(
      children: [
        // Left panel - Event list
        SizedBox(
          width: 420,
          child: Column(
            children: [
              // Header with view toggle
              Container(
                height: context.appBarHeight,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: cs.surface,
                  border: Border(bottom: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.3))),
                ),
                child: Row(
                  children: [
                  if (_controller.showSearch)
                    Expanded(child: _buildSearchField(context))
                  else ...[
                    Text('Discover', style: textTheme.titleLarge),
                    const SizedBox(width: 12),
                    DiscoverTabSelector(
                      currentView: _controller.currentView,
                      onViewChanged: _onViewChanged,
                      compact: true,
                    ),
                    const Spacer(),
                  ],
                    IconButton(
                      icon: Icon(_controller.showSearch ? Icons.close : Icons.search, color: cs.onSurface),
                      onPressed: () {
                        if (_controller.showSearch) _searchController.clear();
                        _controller.toggleSearch();
                      },
                    ),
                  ],
                ),
              ),
              // Filters - single combined row
              Padding(
                padding: const EdgeInsets.fromLTRB(0, 8, 0, 6),
                child: _combinedFilterChips(),
              ),
              // Events list
              Expanded(
                child: BrandedRefreshIndicator(
                  onRefresh: _controller.onRefresh,
                  child: _EventsList(
                    isLoading: _controller.isLoading,
                    events: filteredEvents,
                    tiersByEvent: _controller.tiersByEvent,
                    savedEventIds: _controller.savedEventIds,
                    selectedEventId: _controller.selectedEvent?.id,
                    onRefresh: _controller.onRefresh,
                    onToggleSave: (id) => _controller.toggleSaveEvent(id),
                    onEventTap: (e) => _controller.selectEvent(e),
                    errorMessage: _controller.errorMessage,
                  ),
                ),
              ),
            ],
          ),
        ),
        // Divider
        Container(width: 1, color: cs.outlineVariant.withValues(alpha: 0.3)),
        // Right panel - Event detail
        Expanded(
          child: _controller.selectedEvent != null
              ? _EventDetailPanel(
                  key: ValueKey(_controller.selectedEvent!.id),
                  event: _controller.selectedEvent!,
                  tiers: _controller.getTiersForEvent(_controller.selectedEvent!.id),
                  isSaved: _controller.isEventSaved(_controller.selectedEvent!.id),
                  onToggleSave: () => _controller.toggleSaveEvent(_controller.selectedEvent!.id),
                  onClose: () => _controller.clearSelectedEvent(),
                  onOpenFullPage: () => context.push('/events/${_controller.selectedEvent!.id}', extra: _controller.selectedEvent),
                )
              : _buildEmptyDetailPanel(cs, textTheme),
        ),
      ],
    );
  }
  
  Widget _buildEmptyDetailPanel(ColorScheme cs, TextTheme textTheme) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.touch_app_rounded, size: 64, color: cs.outlineVariant),
          const SizedBox(height: 16),
          Text(
            'Select an event',
            style: textTheme.titleMedium?.copyWith(color: cs.onSurfaceVariant),
          ),
          const SizedBox(height: 4),
          Text(
            'Click on an event from the list to view details',
            style: textTheme.bodySmall?.copyWith(color: cs.outline),
          ),
        ],
      ),
    );
  }
  
  SliverAppBar _buildAppBar(ColorScheme cs, TextTheme textTheme) {
    return SliverAppBar(
      floating: true,
      snap: true,
      backgroundColor: cs.surface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      expandedHeight: context.appBarHeight,
      toolbarHeight: context.appBarHeight,
      automaticallyImplyLeading: false,
      titleSpacing: 16,
      title: _controller.showSearch 
          ? null  // Hide title when search is shown
          : Row(
              children: [
                Text('Discover', style: textTheme.titleLarge),
                const SizedBox(width: 12),
                DiscoverTabSelector(
                  currentView: _controller.currentView,
                  onViewChanged: _onViewChanged,
                  compact: true,
                ),
              ],
            ),
      actions: [
        if (_controller.showSearch)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SizedBox(
              width: MediaQuery.of(context).size.width - 32,
              child: _buildSearchField(context),
            ),
          )
        else
          IconButton(
            icon: Icon(Icons.search, color: cs.onSurface),
            onPressed: () => _controller.toggleSearch(),
          ),
      ],
    );
  }
  
  SliverToBoxAdapter _buildFilters() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(0, 8, 0, 6),
        child: _combinedFilterChips(),
      ),
    );
  }
}

// ============================================================================
// Events List Widget
// ============================================================================

class _EventsList extends StatelessWidget {
  const _EventsList({
    required this.isLoading,
    required this.events,
    required this.tiersByEvent,
    required this.savedEventIds,
    required this.onRefresh,
    required this.onToggleSave,
    required this.onEventTap,
    this.selectedEventId,
    this.errorMessage,
  });

  final bool isLoading;
  final List<Event> events;
  final Map<String, List<TicketTier>> tiersByEvent;
  final Set<String> savedEventIds;
  final Future<void> Function() onRefresh;
  final void Function(String id) onToggleSave;
  final void Function(Event event) onEventTap;
  final String? selectedEventId;
  final String? errorMessage;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    if (isLoading) {
      return ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        physics: const NeverScrollableScrollPhysics(),
        itemCount: 3,
        separatorBuilder: (_, __) => const SizedBox(height: 6),
        itemBuilder: (_, index) => FadeSlideTransition(
          delay: staggerDelay(index),
          child: const EventCardSkeleton(),
        ),
      );
    }

    if (errorMessage != null) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(height: MediaQuery.of(context).size.height * 0.15),
          Center(child: Icon(Icons.cloud_off, size: 48, color: cs.error)),
          const SizedBox(height: 12),
          Center(
            child: Text(
              'Something went wrong',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(color: cs.error),
            ),
          ),
          const SizedBox(height: 6),
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                errorMessage!,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: FilledButton.icon(
              onPressed: onRefresh,
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Try Again'),
            ),
          ),
        ],
      );
    }

    if (events.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(height: MediaQuery.of(context).size.height * 0.15),
          Center(child: Icon(Icons.event_busy, size: 48, color: cs.onSurfaceVariant)),
          const SizedBox(height: 12),
          Center(
            child: Text(
              'No upcoming events',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(color: cs.onSurface),
            ),
          ),
          const SizedBox(height: 6),
          Center(
            child: Text(
              'Try adjusting your filters',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
            ),
          ),
        ],
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      itemCount: events.length,
      physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
      separatorBuilder: (_, __) => const SizedBox(height: 6),
      itemBuilder: (_, i) {
        final e = events[i];
        final isSelected = selectedEventId == e.id;
        return Semantics(
          selected: isSelected,
          child: FadeSlideTransition(
            delay: staggerDelay(i),
            child: Container(
              decoration: isSelected ? BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: cs.primary, width: 2),
              ) : null,
              child: EventCard(
              event: e,
              tiers: tiersByEvent[e.id] ?? const [],
              saved: savedEventIds.contains(e.id),
              onTap: () => onEventTap(e),
              onToggleSave: () => onToggleSave(e.id),
            ),
            ),
          ),
        );
      },
    );
  }
}

// ============================================================================
// Event Detail Panel (Large Screens)
// ============================================================================

class _EventDetailPanel extends StatelessWidget {
  const _EventDetailPanel({
    super.key,
    required this.event,
    required this.tiers,
    required this.isSaved,
    required this.onToggleSave,
    required this.onClose,
    required this.onOpenFullPage,
  });

  final Event event;
  final List<TicketTier> tiers;
  final bool isSaved;
  final VoidCallback onToggleSave;
  final VoidCallback onClose;
  final VoidCallback onOpenFullPage;

  String _formatDate(DateTime dt) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    final d = dt.toLocal();
    return '${months[d.month - 1]} ${d.day}, ${d.year}';
  }

  String _formatTime(DateTime dt) {
    final d = dt.toLocal();
    final hour = d.hour % 12 == 0 ? 12 : d.hour % 12;
    final min = d.minute.toString().padLeft(2, '0');
    final ampm = d.hour < 12 ? 'AM' : 'PM';
    return '$hour:$min $ampm';
  }

  (IconData, Color, String) _modeBadge(EventMode mode) => switch (mode) {
    EventMode.ONLINE => (Icons.public, Colors.blue, 'Online'),
    EventMode.OFFLINE => (Icons.place, Colors.green, 'In-Person'),
    EventMode.HYBRID => (Icons.group, Colors.purple, 'Hybrid'),
  };

  String _priceLabel() {
    if (tiers.isEmpty) return '';
    final prices = tiers.map((t) => t.price).where((p) => p >= 0).toList()..sort();
    if (prices.isEmpty) return '';
    final minP = prices.first;
    final maxP = prices.last;
    if (minP == 0 && maxP == 0) return 'Free';
    if (minP == 0 && maxP > 0) return 'Free – ₹${maxP.toStringAsFixed(0)}';
    if (minP == maxP) return '₹${minP.toStringAsFixed(0)}';
    return '₹${minP.toStringAsFixed(0)} – ₹${maxP.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    final (modeIcon, modeColor, modeLabel) = _modeBadge(event.mode);
    final price = _priceLabel();

    return Column(
      children: [
        // Header bar
        Container(
          height: context.appBarHeight,
          padding: const EdgeInsets.symmetric(horizontal: 8),
          decoration: BoxDecoration(
            color: cs.surface,
            border: Border(bottom: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.3))),
          ),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: onClose,
                tooltip: 'Close panel',
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Event Details',
                  style: text.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                ),
              ),
              IconButton(
                icon: Icon(isSaved ? Icons.bookmark : Icons.bookmark_border),
                onPressed: onToggleSave,
                tooltip: isSaved ? 'Remove from saved' : 'Save event',
              ),
              IconButton(
                icon: const Icon(Icons.open_in_new),
                onPressed: onOpenFullPage,
                tooltip: 'Open full page',
              ),
            ],
          ),
        ),
        // Content
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Banner
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: AspectRatio(
                    aspectRatio: 16 / 9,
                    child: event.branding.bannerUrl != null
                        ? Image.network(
                            event.branding.bannerUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              color: cs.surfaceContainerHighest,
                              child: Icon(Icons.image, size: 48, color: cs.outlineVariant),
                            ),
                          )
                        : Container(
                            color: cs.surfaceContainerHighest,
                            child: Icon(Icons.event, size: 48, color: cs.outlineVariant),
                          ),
                  ),
                ),
                const SizedBox(height: 16),
                // Title
                Text(
                  event.name,
                  style: text.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                // Mode and category badges
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: modeColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(modeIcon, size: 14, color: modeColor),
                          const SizedBox(width: 4),
                          Text(modeLabel, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: modeColor)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: cs.primaryContainer,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        event.category.displayName,
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: cs.onPrimaryContainer),
                      ),
                    ),
                    if (price.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: cs.tertiaryContainer,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          price,
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: cs.onTertiaryContainer),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 20),
                // Date & Time
                _DetailRow(
                  icon: Icons.calendar_today,
                  label: 'Date',
                  value: _formatDate(event.startDate),
                ),
                const SizedBox(height: 12),
                _DetailRow(
                  icon: Icons.access_time,
                  label: 'Time',
                  value: _formatTime(event.startDate),
                ),
                if (event.capacity != null) ...[
                  const SizedBox(height: 12),
                  _DetailRow(
                    icon: Icons.people_alt,
                    label: 'Capacity',
                    value: '${event.capacity} attendees',
                  ),
                ],
                const SizedBox(height: 20),
                // Organizer
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: cs.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundColor: cs.surface,
                        backgroundImage: event.organization.logoUrl != null
                            ? NetworkImage(event.organization.logoUrl!)
                            : null,
                        child: event.organization.logoUrl == null
                            ? Text(event.organization.name[0], style: text.titleMedium)
                            : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    event.organization.name,
                                    style: text.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (event.organization.verificationStatus == 'VERIFIED') ...[
                                  const SizedBox(width: 4),
                                  const Icon(Icons.verified, size: 16, color: Colors.blue),
                                ],
                              ],
                            ),
                            Text(
                              '@${event.organization.slug}',
                              style: text.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                if (event.description != null && event.description!.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  Text('About', style: text.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Text(
                    event.description!,
                    style: text.bodyMedium?.copyWith(color: cs.onSurfaceVariant, height: 1.5),
                  ),
                ],
                // Tickets section
                if (tiers.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  Text('Tickets', style: text.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  ...tiers.map((t) => Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: cs.surface,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: cs.outlineVariant),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(t.name, style: text.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                              if (t.description != null)
                                Text(
                                  t.description!,
                                  style: text.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                            ],
                          ),
                        ),
                        Text(
                          t.price == 0 ? 'Free' : '₹${t.price.toStringAsFixed(0)}',
                          style: text.titleSmall?.copyWith(fontWeight: FontWeight.w700, color: cs.primary),
                        ),
                      ],
                    ),
                  )),
                ],
                const SizedBox(height: 24),
                // Register button
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: onOpenFullPage,
                    icon: const Icon(Icons.arrow_forward),
                    label: const Text('View Full Details & Register'),
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.icon, required this.label, required this.value});
  
  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: cs.primaryContainer.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 18, color: cs.primary),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: text.labelSmall?.copyWith(color: cs.onSurfaceVariant)),
            Text(value, style: text.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
          ],
        ),
      ],
    );
  }
}

// ============================================================================
// Category Filter Sheet
// ============================================================================

class _CategoryFilterSheet extends StatelessWidget {
  const _CategoryFilterSheet({
    required this.selectedCategory,
    required this.onCategorySelected,
  });

  final EventCategory? selectedCategory;
  final void Function(EventCategory?) onCategorySelected;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final groupedCategories = IconMappings.getGroupedEventCategories();
    
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
      ),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: cs.outlineVariant,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
            child: Row(
              children: [
                Text(
                  'Select Category',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                if (selectedCategory != null)
                  TextButton(
                    onPressed: () => onCategorySelected(null),
                    child: Text(
                      'Clear',
                      style: TextStyle(
                        color: cs.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(Icons.close_rounded, color: cs.onSurfaceVariant),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          // Category list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              itemCount: groupedCategories.length,
              itemBuilder: (context, index) {
                final groupName = groupedCategories.keys.elementAt(index);
                final categories = groupedCategories[groupName]!;
                
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(left: 4, top: 12, bottom: 8),
                      child: Text(
                        groupName,
                        style: Theme.of(context).textTheme.labelMedium?.copyWith(
                          color: cs.onSurfaceVariant,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: categories.map((config) {
                        final isSelected = selectedCategory == config.category;
                        final color = config.category != null
                            ? IconMappings.getEventCategoryColor(config.category!)
                            : cs.primary;
                        
                        return Semantics(
                          button: true,
                          selected: isSelected,
                          label: '${config.label} category${isSelected ? ", selected" : ""}',
                          child: GestureDetector(
                            onTap: () {
                              HapticFeedback.lightImpact();
                              onCategorySelected(config.category);
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: isSelected ? color : cs.surfaceContainerHighest,
                                borderRadius: BorderRadius.circular(999),
                                border: Border.all(
                                  color: isSelected ? color : cs.outline.withValues(alpha: 0.3),
                                  width: 1.5,
                                ),
                                boxShadow: isSelected
                                    ? [
                                        BoxShadow(
                                          color: color.withValues(alpha: 0.3),
                                          blurRadius: 8,
                                          offset: const Offset(0, 2),
                                        ),
                                      ]
                                    : null,
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    config.icon,
                                    size: 16,
                                    color: isSelected ? Colors.white : cs.onSurfaceVariant,
                                  ),
                                const SizedBox(width: 6),
                                  Text(
                                    config.label,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: isSelected ? Colors.white : cs.onSurface,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// Keyboard Navigation Intent Classes
// ============================================================================

class _EventsViewIntent extends Intent { const _EventsViewIntent(); }
class _ProductsViewIntent extends Intent { const _ProductsViewIntent(); }
class _SearchIntent extends Intent { const _SearchIntent(); }
class _RefreshIntent extends Intent { const _RefreshIntent(); }
