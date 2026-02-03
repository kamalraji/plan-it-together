import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:thittam1hub/models/zone_models.dart';
import 'package:thittam1hub/models/models.dart' show EventCategory;
import 'package:thittam1hub/models/circle.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/services/zone_state_service.dart';
import 'package:thittam1hub/supabase/circle_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/utils/zone_category_features.dart';
import 'package:thittam1hub/utils/icon_mappings.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart';
import 'package:thittam1hub/widgets/zone/error_retry_card.dart';
import 'package:thittam1hub/pages/impact/zone_management_page.dart';
import 'package:thittam1hub/pages/impact/zone_lobby_page.dart';
import 'package:thittam1hub/pages/impact/zone_inside_page.dart';

/// Zone Page - Router between Lobby (pre-check-in) and Inside (post-check-in) experiences
/// 
/// URL State Synchronization:
/// - Lobby: /impact?tab=zone&eventId=xxx
/// - Inside: /impact?tab=zone&inside=true&eventId=xxx&section=schedule
class ZonePage extends StatefulWidget {
  final String? searchQuery;
  final String? eventId;
  final String? section;
  final bool? initialInside;
  final String? initialSessionId;

  const ZonePage({
    Key? key,
    this.searchQuery,
    this.eventId,
    this.section,
    this.initialInside,
    this.initialSessionId,
  }) : super(key: key);

  @override
  State<ZonePage> createState() => _ZonePageState();
}

class _ZonePageState extends State<ZonePage> {
  late ZoneStateService _zoneService;
  final CircleService _circleService = CircleService();
  bool _isInitialLoad = true;
  
  // Event circles state (for legacy view, may be removed)
  List<Circle> _eventCircles = [];
  Set<String> _joinedCircleIds = {};
  bool _circlesLoading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _zoneService = context.read<ZoneStateService>();
      _setupAnnouncementCallback();
      _initializeFromUrl();
    });
  }

  /// Initialize zone state from URL parameters
  void _initializeFromUrl() async {
    // Check if URL indicates we should be inside zone
    if (widget.initialInside == true && widget.eventId != null) {
      // Sync service state with URL
      _zoneService.syncFromUrl(
        isInside: true,
        eventId: widget.eventId,
        sectionId: widget.section,
      );
    }
    
    await _loadData();
  }

  void _setupAnnouncementCallback() {
    _zoneService.onNewAnnouncementCallback = (announcement) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                Icon(announcement.typeIcon, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        announcement.title,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        announcement.content,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            duration: const Duration(seconds: 5),
            behavior: SnackBarBehavior.floating,
            action: SnackBarAction(
              label: 'View',
              textColor: Colors.white,
              onPressed: () {},
            ),
          ),
        );
      }
    };
  }

  @override
  void dispose() {
    _zoneService.onNewAnnouncementCallback = null;
    _zoneService.unsubscribeFromEventUpdates();
    super.dispose();
  }

  @override
  void didUpdateWidget(ZonePage oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    // Handle URL changes (browser back/forward, deep links)
    if (widget.eventId != oldWidget.eventId ||
        widget.initialInside != oldWidget.initialInside ||
        widget.section != oldWidget.section) {
      _syncWithUrl();
    }
  }

  /// Sync zone state when URL changes (e.g., browser back button)
  void _syncWithUrl() {
    final service = context.read<ZoneStateService>();
    
    if (widget.initialInside == true && widget.eventId != null) {
      service.syncFromUrl(
        isInside: true,
        eventId: widget.eventId,
        sectionId: widget.section,
      );
    } else if (widget.initialInside == false && service.isInsideZone) {
      // User navigated back to lobby via URL
      service.syncFromUrl(isInside: false, eventId: widget.eventId);
    }
  }

  Future<void> _loadData() async {
    setState(() => _isInitialLoad = true);

    await _zoneService.loadTodayEvents();

    // Get current checked-in event or use provided eventId
    if (widget.eventId != null) {
      _zoneService.currentEvent = _zoneService.todayEvents.firstWhere(
        (e) => e.id == widget.eventId,
        orElse: () => _zoneService.todayEvents.isNotEmpty
            ? _zoneService.todayEvents.first
            : null as ZoneEvent,
      );
    } else {
      await _zoneService.loadCurrentEvent();
      if (_zoneService.currentEvent == null && _zoneService.todayEvents.isNotEmpty) {
        _zoneService.currentEvent = _zoneService.todayEvents.first;
      }
    }

    // Load event-specific data if we have an event
    if (_zoneService.currentEvent != null) {
      final eventId = _zoneService.currentEvent!.id;
      
      // Subscribe to realtime updates
      _zoneService.subscribeToEventUpdates(eventId);
      
      // Load all data in parallel (including event circles)
      await Future.wait([
        _zoneService.loadAllData(eventId),
        _loadEventCircles(eventId),
      ]);
    }

    if (mounted) setState(() => _isInitialLoad = false);
  }

  Future<void> _loadEventCircles(String eventId) async {
    setState(() => _circlesLoading = true);
    try {
      final results = await Future.wait([
        _circleService.getCirclesByEvent(eventId),
        _circleService.getUserCircles(),
      ]);
      if (mounted) {
        setState(() {
          _eventCircles = results[0] as List<Circle>;
          _joinedCircleIds = results[1] as Set<String>;
          _circlesLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _circlesLoading = false);
    }
  }

  Future<void> _toggleCircleMembership(Circle circle) async {
    final isJoined = _joinedCircleIds.contains(circle.id);
    final cs = Theme.of(context).colorScheme;
    
    try {
      if (isJoined) {
        await _circleService.leaveCircle(circle.id);
        if (mounted) {
          setState(() => _joinedCircleIds.remove(circle.id));
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Left ${circle.name}'), backgroundColor: cs.surfaceContainerHighest),
          );
        }
      } else {
        await _circleService.joinCircle(circle.id);
        if (mounted) {
          setState(() => _joinedCircleIds.add(circle.id));
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Joined ${circle.name}'), backgroundColor: cs.primary),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to ${isJoined ? "leave" : "join"} circle')),
        );
      }
    }
  }

  /// Handle check-in with URL state sync
  Future<void> _handleCheckIn() async {
    if (_zoneService.currentEvent == null) return;

    HapticFeedback.mediumImpact();
    
    final eventId = _zoneService.currentEvent!.id;
    final success = await _zoneService.enterZone(eventId);

    if (success && mounted) {
      HapticFeedback.heavyImpact();
      
      // Update URL to reflect inside state
      context.go(AppRoutes.zoneInside(eventId, section: 'schedule'));
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('✓ Welcome to ${_zoneService.currentEvent!.name}'),
          backgroundColor: Theme.of(context).colorScheme.primary,
        ),
      );
    }
  }

  /// Handle check-out with URL state sync
  Future<void> _handleCheckOut() async {
    if (_zoneService.currentEvent == null) return;

    HapticFeedback.mediumImpact();
    
    final eventId = _zoneService.currentEvent!.id;
    final success = await _zoneService.exitZone(eventId);

    if (success && mounted) {
      // Update URL to reflect lobby state
      context.go(AppRoutes.zoneWithEvent(eventId));
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Checked out. See you next time!')),
      );
    }
  }

  void _openManagement() {
    if (_zoneService.currentEvent == null) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ZoneManagementPage(
          eventId: _zoneService.currentEvent!.id,
          eventName: _zoneService.currentEvent!.name,
        ),
      ),
    ).then((_) => _loadData());
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    // Router: Select minimal state to decide which view to render
    return Selector<ZoneStateService, ({ZoneEvent? event, bool isLoadingEvents, bool isInsideZone, bool isCheckingIn})>(
      selector: (_, s) => (
        event: s.currentEvent,
        isLoadingEvents: s.isLoadingEvents,
        isInsideZone: s.isInsideZone,
        isCheckingIn: s.isCheckingIn,
      ),
      builder: (context, data, _) {
        final currentEvent = data.event;
        final isLoading = _isInitialLoad || data.isLoadingEvents;

        // Loading state
        if (isLoading) {
          return Scaffold(
            backgroundColor: cs.surface,
            body: _buildLoadingState(),
          );
        }

        // No event state
        if (currentEvent == null) {
          return Scaffold(
            backgroundColor: cs.surface,
            body: _buildNoEventState(),
          );
        }

        // Route based on check-in status
        // Priority: URL state (widget.initialInside) > Service state (isInsideZone) > Event state (isCheckedIn)
        final shouldShowInside = widget.initialInside == true || 
                                  data.isInsideZone || 
                                  currentEvent.isCheckedIn;

        if (shouldShowInside) {
          // INSIDE ZONE - Full experience with FAB navigation
          return ZoneInsidePage(
            eventId: currentEvent.id,
            eventName: currentEvent.name,
            initialSection: widget.section,
            initialSessionId: widget.initialSessionId,
            onCheckOut: _handleCheckOut,
          );
        } else {
          // LOBBY - Premium event preview with check-in CTA
          return ZoneLobbyPage(
            event: currentEvent,
            onCheckIn: _handleCheckIn,
          );
        }
      },
    );
  }

  // Legacy build method for fallback - keeping existing UI components below
  Widget _buildLegacyZoneContent(ZoneEvent currentEvent, bool canManage) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: cs.surface,
        elevation: 0,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.location_on_rounded, color: cs.primary, size: 24),
            const SizedBox(width: 8),
            Text('Zone', style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
          ],
        ),
      ),
      body: SafeArea(
        child: BrandedRefreshIndicator(
          onRefresh: _loadData,
          child: ListView(
            padding: EdgeInsets.only(bottom: context.bottomContentPadding),
            children: [
              // Event Context Header
              _EventContextCard(
                event: currentEvent,
                attendeeCount: 0, // Will use Selector inside
                onCheckIn: _handleCheckIn,
                onCheckOut: _handleCheckOut,
                canManage: canManage,
                onManage: _openManagement,
              ),

              // Dynamic Zone Card based on category
              if (currentEvent.category != null &&
                  ZoneCategoryFeatures.hasDedicatedZoneCard(currentEvent.category!))
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: ZoneCategoryFeatures.getZoneCardWidget(
                    currentEvent.category!,
                    currentEvent.id,
                  )!,
                )
              else if (currentEvent.category != null)
                _CategoryFeatureGrid(
                  category: currentEvent.category!,
                  eventId: currentEvent.id,
                ),

              // Sessions Section with isolated Selector
              _SessionsSectionSelector(eventId: currentEvent.id),

              // Networking Section with isolated Selector
              _NetworkingSectionSelector(eventId: currentEvent.id),

              // Event Circles Section (local state, not from ZoneStateService)
              if (_eventCircles.isNotEmpty || _circlesLoading)
                _circlesLoading
                    ? Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildSectionHeader('💬 Event Circles', cs.primary),
                            const SizedBox(height: 8),
                            const ShimmerPlaceholder(height: 80, borderRadius: BorderRadius.all(Radius.circular(12))),
                          ],
                        ),
                      )
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildSectionHeader(
                            '💬 Event Circles (${_eventCircles.length})',
                            cs.primary,
                          ),
                          SizedBox(
                            height: 120,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: _eventCircles.length,
                              itemBuilder: (ctx, i) => _EventCircleCard(
                                circle: _eventCircles[i],
                                isJoined: _joinedCircleIds.contains(_eventCircles[i].id),
                                onTap: () => context.push(AppRoutes.circleDetail(_eventCircles[i].id), extra: _eventCircles[i]),
                                onJoinToggle: () => _toggleCircleMembership(_eventCircles[i]),
                              ),
                            ),
                          ),
                        ],
                      ),

              // Polls Section with isolated Selector
              _PollsSectionSelector(eventId: currentEvent.id),

              // Announcements Section with isolated Selector
              _AnnouncementsSectionSelector(eventId: currentEvent.id),

              // Empty state with isolated Selector
              _QuietStateSelectorWrapper(
                canManage: canManage,
                onManage: _openManagement,
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: canManage
          ? FloatingActionButton.extended(
              onPressed: _openManagement,
              icon: const Icon(Icons.dashboard_customize_rounded),
              label: const Text('Manage'),
              backgroundColor: cs.primary,
              foregroundColor: cs.onPrimary,
            )
          : null,
    );
  }

  // Reintroduced as a thin wrapper for backwards compatibility with existing call sites.
  // This keeps the section header styling centralized and avoids repeated UI code.
  Widget _buildSectionHeader(String title, Color accentColor) {
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 18,
            decoration: BoxDecoration(
              color: accentColor,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              title,
              style: textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: List.generate(
        4,
        (_) => const Padding(
          padding: EdgeInsets.symmetric(vertical: 8),
          child: ShimmerPlaceholder(height: 120, width: double.infinity),
        ),
      ),
    );
  }

  Widget _buildNoEventState() {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.event_busy_rounded, size: 80, color: cs.onSurfaceVariant.withOpacity(0.5)),
            const SizedBox(height: 24),
            Text(
              'No Events Today',
              style: textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'You don\'t have any events scheduled for today.\nExplore upcoming events to register!',
              textAlign: TextAlign.center,
              style: textTheme.bodyMedium?.copyWith(color: cs.onSurfaceVariant),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () => context.go('/discover'),
              icon: const Icon(Icons.explore_rounded),
              label: const Text('Discover Events'),
            ),
          ],
        ),
      ),
    );
  }

  // _buildQuietState removed - now using _QuietStateSelectorWrapper
}

// ============ Event Context Card with Category Theming ============

class _EventContextCard extends StatelessWidget {
  final ZoneEvent event;
  final int attendeeCount;
  final VoidCallback onCheckIn;
  final VoidCallback onCheckOut;
  final bool canManage;
  final VoidCallback onManage;

  const _EventContextCard({
    required this.event,
    required this.attendeeCount,
    required this.onCheckIn,
    required this.onCheckOut,
    required this.canManage,
    required this.onManage,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    final categoryColor = event.category != null
        ? IconMappings.getEventCategoryColor(event.category!)
        : cs.primary;
    final categoryIcon = event.category != null
        ? IconMappings.getEventCategoryIcon(event.category!)
        : Icons.location_on;
    final categoryTagline = ZoneCategoryFeatures.getCategoryTagline(event.category);

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            categoryColor.withOpacity(0.15),
            cs.tertiary.withOpacity(0.08),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: categoryColor.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (event.category != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: categoryColor.withOpacity(0.15),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: categoryColor.withOpacity(0.3)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(categoryIcon, size: 14, color: categoryColor),
                  const SizedBox(width: 6),
                  Text(
                    categoryTagline,
                    style: textTheme.labelSmall?.copyWith(
                      color: categoryColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],
          Row(
            children: [
              Icon(Icons.location_on, size: 18, color: categoryColor),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  event.name,
                  style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (event.isHappeningNow)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: cs.error.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: cs.error,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'LIVE',
                        style: textTheme.labelSmall?.copyWith(
                          color: cs.error,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          if (event.venue != null) ...[
            const SizedBox(height: 4),
            Text(
              event.venue!,
              style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
            ),
          ],
          const SizedBox(height: 12),
          if (event.category != null) ...[
            _buildCategoryQuickActions(context, event.category!, categoryColor),
            const SizedBox(height: 12),
          ],
          Row(
            children: [
              Icon(Icons.people_rounded, size: 16, color: cs.onSurfaceVariant),
              const SizedBox(width: 4),
              Text(
                '$attendeeCount here now',
                style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
              ),
              const Spacer(),
              if (event.isCheckedIn)
                Chip(
                  avatar: Icon(Icons.check_circle, size: 16, color: categoryColor),
                  label: const Text('Checked In'),
                  backgroundColor: categoryColor.withOpacity(0.1),
                  side: BorderSide.none,
                  visualDensity: VisualDensity.compact,
                )
              else
                FilledButton.tonal(
                  onPressed: onCheckIn,
                  style: FilledButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                    backgroundColor: categoryColor.withOpacity(0.15),
                    foregroundColor: categoryColor,
                  ),
                  child: const Text('Check In'),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryQuickActions(BuildContext context, EventCategory category, Color themeColor) {
    final features = ZoneCategoryFeatures.getFeaturesForCategory(category);
    final quickFeatures = features.take(4).toList();

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: quickFeatures.map((feature) {
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ActionChip(
              avatar: Icon(
                ZoneCategoryFeatures.getFeatureIcon(feature),
                size: 16,
                color: themeColor,
              ),
              label: Text(
                ZoneCategoryFeatures.getFeatureName(feature),
                style: TextStyle(fontSize: 12, color: themeColor),
              ),
              backgroundColor: themeColor.withOpacity(0.08),
              side: BorderSide(color: themeColor.withOpacity(0.2)),
              visualDensity: VisualDensity.compact,
              onPressed: () {
                HapticFeedback.lightImpact();
              },
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ============ Category Feature Grid ============

class _CategoryFeatureGrid extends StatelessWidget {
  final EventCategory category;
  final String eventId;

  const _CategoryFeatureGrid({
    required this.category,
    required this.eventId,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final categoryColor = IconMappings.getEventCategoryColor(category);
    final features = ZoneCategoryFeatures.getFeaturesForCategory(category);

    final uniqueFeatures = features
        .where((f) =>
            f != ZoneFeature.sessions &&
            f != ZoneFeature.announcements &&
            f != ZoneFeature.polls &&
            f != ZoneFeature.networking)
        .take(6)
        .toList();

    if (uniqueFeatures.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                IconMappings.getEventCategoryIcon(category),
                size: 16,
                color: categoryColor,
              ),
              const SizedBox(width: 6),
              Text(
                'Quick Actions',
                style: textTheme.labelMedium?.copyWith(
                  color: cs.onSurfaceVariant,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.1,
            ),
            itemCount: uniqueFeatures.length,
            itemBuilder: (context, index) {
              final feature = uniqueFeatures[index];
              return _FeatureTile(
                feature: feature,
                themeColor: categoryColor,
                onTap: () => _handleFeatureTap(context, feature),
              );
            },
          ),
        ],
      ),
    );
  }

  void _handleFeatureTap(BuildContext context, ZoneFeature feature) {
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${ZoneCategoryFeatures.getFeatureName(feature)} coming soon!'),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }
}

class _FeatureTile extends StatelessWidget {
  final ZoneFeature feature;
  final Color themeColor;
  final VoidCallback onTap;

  const _FeatureTile({
    required this.feature,
    required this.themeColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Material(
      color: themeColor.withOpacity(0.08),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: themeColor.withOpacity(0.2)),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                ZoneCategoryFeatures.getFeatureIcon(feature),
                size: 28,
                color: themeColor,
              ),
              const SizedBox(height: 6),
              Text(
                ZoneCategoryFeatures.getFeatureName(feature),
                style: textTheme.labelSmall?.copyWith(
                  color: themeColor,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ============ Live Session Card ============

class _LiveSessionCard extends StatelessWidget {
  final EventSession session;

  const _LiveSessionCard({required this.session});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: cs.error,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'LIVE NOW',
                  style: textTheme.labelSmall?.copyWith(
                    color: cs.error,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                if (session.room != null)
                  Chip(
                    label: Text(session.room!),
                    visualDensity: VisualDensity.compact,
                    side: BorderSide.none,
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              session.title,
              style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            if (session.speakerName != null) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  CircleAvatar(
                    radius: 12,
                    backgroundImage: session.speakerAvatar != null
                        ? NetworkImage(session.speakerAvatar!)
                        : null,
                    child: session.speakerAvatar == null
                        ? Text(session.speakerName![0])
                        : null,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    session.speakerName!,
                    style: textTheme.bodyMedium?.copyWith(color: cs.onSurfaceVariant),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.timer_outlined, size: 16, color: cs.onSurfaceVariant),
                const SizedBox(width: 4),
                Text(
                  '${session.minutesRemaining} min remaining',
                  style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                ),
                const Spacer(),
                FilledButton(
                  onPressed: () {},
                  child: const Text('Join'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ============ Upcoming Session Card ============

class _UpcomingSessionCard extends StatelessWidget {
  final EventSession session;

  const _UpcomingSessionCard({required this.session});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    final timeFormat =
        '${session.startTime.hour}:${session.startTime.minute.toString().padLeft(2, '0')}';

    return Container(
      width: 140,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            timeFormat,
            style: textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: cs.primary,
            ),
          ),
          const SizedBox(height: 4),
          Expanded(
            child: Text(
              session.title,
              style: textTheme.bodySmall,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (session.room != null)
            Text(
              session.room!,
              style: textTheme.labelSmall?.copyWith(color: cs.onSurfaceVariant),
            ),
        ],
      ),
    );
  }
}

// ============ Attendee Radar Card ============

class _AttendeeRadarCard extends StatelessWidget {
  final AttendeeRadar attendee;
  final VoidCallback onTap;

  const _AttendeeRadarCard({required this.attendee, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 72,
        margin: const EdgeInsets.only(right: 12),
        child: Column(
          children: [
            Stack(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundImage: attendee.avatarUrl != null
                      ? NetworkImage(attendee.avatarUrl!)
                      : null,
                  child: attendee.avatarUrl == null
                      ? Text(
                          attendee.fullName.isNotEmpty ? attendee.fullName[0] : '?',
                          style: textTheme.titleMedium,
                        )
                      : null,
                ),
                if (attendee.isOnline)
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 14,
                      height: 14,
                      decoration: BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                        border: Border.all(color: cs.surface, width: 2),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              attendee.fullName.split(' ').first,
              style: textTheme.labelSmall,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

// ============ More Attendees Card ============

class _MoreAttendeesCard extends StatelessWidget {
  final int count;

  const _MoreAttendeesCard({required this.count});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      width: 72,
      margin: const EdgeInsets.only(right: 12),
      child: Column(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: cs.surfaceContainerHighest,
            child: Text(
              '+$count',
              style: textTheme.titleSmall?.copyWith(
                color: cs.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'more',
            style: textTheme.labelSmall?.copyWith(color: cs.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

// ============ Live Poll Card ============

class _LivePollCard extends StatelessWidget {
  final EventPoll poll;
  final Function(String) onVote;

  const _LivePollCard({required this.poll, required this.onVote});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              poll.question,
              style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ...poll.options.map((option) {
              final isSelected = poll.userVote == option.id;
              final percentage = poll.totalVotes > 0
                  ? (option.voteCount / poll.totalVotes * 100).round()
                  : 0;

              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: InkWell(
                  onTap: poll.hasVoted ? null : () => onVote(option.id),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? cs.primary.withOpacity(0.15)
                          : cs.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(8),
                      border: isSelected ? Border.all(color: cs.primary) : null,
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            option.text,
                            style: textTheme.bodyMedium?.copyWith(
                              fontWeight: isSelected ? FontWeight.bold : null,
                            ),
                          ),
                        ),
                        if (poll.hasVoted) ...[
                          Text(
                            '$percentage%',
                            style: textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: cs.primary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              );
            }),
            const SizedBox(height: 8),
            Text(
              '${poll.totalVotes} votes',
              style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}

// ============ Announcement Card ============

class _AnnouncementCard extends StatelessWidget {
  final EventAnnouncement announcement;

  const _AnnouncementCard({required this.announcement});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(announcement.typeIcon, size: 18, color: cs.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    announcement.title,
                    style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ),
                if (announcement.isPinned)
                  Icon(Icons.push_pin, size: 16, color: cs.tertiary),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              announcement.content,
              style: textTheme.bodyMedium,
            ),
            const SizedBox(height: 8),
            Text(
              _formatTime(announcement.createdAt),
              style: textTheme.labelSmall?.copyWith(color: cs.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${time.day}/${time.month}';
  }
}


// ============ Event Circle Card ============

class _EventCircleCard extends StatelessWidget {
  final Circle circle;
  final bool isJoined;
  final VoidCallback onTap;
  final VoidCallback onJoinToggle;

  const _EventCircleCard({
    required this.circle,
    required this.isJoined,
    required this.onTap,
    required this.onJoinToggle,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(right: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: 160,
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: IconMappings.getCircleCategoryColor(circle.category).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: Text(circle.icon, style: const TextStyle(fontSize: 16)),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      circle.name,
                      style: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const Spacer(),
              Row(
                children: [
                  Icon(Icons.people_outline, size: 12, color: cs.onSurfaceVariant),
                  const SizedBox(width: 4),
                  Text('${circle.memberCount}', style: textTheme.labelSmall?.copyWith(color: cs.onSurfaceVariant)),
                  const Spacer(),
                  SizedBox(
                    height: 28,
                    child: FilledButton(
                      onPressed: onJoinToggle,
                      style: FilledButton.styleFrom(
                        backgroundColor: isJoined ? cs.surfaceContainerHighest : cs.primary,
                        foregroundColor: isJoined ? cs.onSurfaceVariant : cs.onPrimary,
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        textStyle: textTheme.labelSmall,
                      ),
                      child: Text(isJoined ? '✓' : 'Join'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ============ Granular Section Selector Widgets for Performance ============

/// Sessions section with isolated loading and data
class _SessionsSectionSelector extends StatelessWidget {
  final String eventId;
  const _SessionsSectionSelector({required this.eventId});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Selector<ZoneStateService, ({
      bool isLoading,
      String? error,
      List<EventSession> liveSessions,
      List<EventSession> upcomingSessions,
    })>(
      selector: (_, s) => (
        isLoading: s.isLoadingSessions,
        error: s.sessionsError,
        liveSessions: s.liveSessions,
        upcomingSessions: s.upcomingSessions,
      ),
      builder: (context, data, _) {
        final service = context.read<ZoneStateService>();
        return ZoneSectionState(
          isLoading: data.isLoading,
          error: data.error,
          onRetry: () => service.loadSessions(eventId),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (data.liveSessions.isNotEmpty) ...[
                _SectionHeader(title: '🔴 Live Now', color: cs.error),
                ...data.liveSessions.map((s) => _LiveSessionCard(session: s)),
              ],
              if (data.upcomingSessions.isNotEmpty) ...[
                _SectionHeader(title: '⏭️ Up Next', color: cs.primary),
                SizedBox(
                  height: 120,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: data.upcomingSessions.length,
                    itemBuilder: (ctx, i) => _UpcomingSessionCard(
                      session: data.upcomingSessions[i],
                    ),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}

/// Networking section with isolated loading and data
class _NetworkingSectionSelector extends StatelessWidget {
  final String eventId;
  const _NetworkingSectionSelector({required this.eventId});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Selector<ZoneStateService, ({
      bool isLoading,
      String? error,
      List<AttendeeRadar> attendees,
    })>(
      selector: (_, s) => (
        isLoading: s.isLoadingAttendees,
        error: s.attendeesError,
        attendees: s.nearbyAttendees,
      ),
      builder: (context, data, _) {
        final service = context.read<ZoneStateService>();
        return ZoneSectionState(
          isLoading: data.isLoading,
          error: data.error,
          onRetry: () => service.loadAttendees(eventId),
          child: data.attendees.isNotEmpty
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _SectionHeader(
                      title: '📡 Networking Radar (${data.attendees.length} nearby)',
                      color: cs.tertiary,
                    ),
                    SizedBox(
                      height: 100,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: data.attendees.length > 8 ? 9 : data.attendees.length,
                        itemBuilder: (ctx, i) {
                          if (i == 8 && data.attendees.length > 8) {
                            return _MoreAttendeesCard(count: data.attendees.length - 8);
                          }
                          return _AttendeeRadarCard(
                            attendee: data.attendees[i],
                            onTap: () {
                              context.push(AppRoutes.publicProfile(data.attendees[i].userId));
                            },
                          );
                        },
                      ),
                    ),
                  ],
                )
              : const SizedBox.shrink(),
        );
      },
    );
  }
}

/// Polls section with isolated loading, data, and pagination
class _PollsSectionSelector extends StatelessWidget {
  final String eventId;
  const _PollsSectionSelector({required this.eventId});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Selector<ZoneStateService, ({
      bool isLoading,
      bool isLoadingMore,
      bool hasMore,
      String? error,
      List<EventPoll> polls,
      int totalCount,
    })>(
      selector: (_, s) => (
        isLoading: s.isLoadingPolls,
        isLoadingMore: s.isLoadingMorePolls,
        hasMore: s.hasMorePolls,
        error: s.pollsError,
        polls: s.activePolls.items,
        totalCount: s.activePolls.totalCount,
      ),
      builder: (context, data, _) {
        final service = context.read<ZoneStateService>();
        return ZoneSectionState(
          isLoading: data.isLoading,
          error: data.error,
          onRetry: () => service.loadActivePolls(eventId),
          child: data.polls.isNotEmpty
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _SectionHeader(
                      title: '📊 Live Polls (${data.totalCount})',
                      color: cs.secondary,
                    ),
                    ...data.polls.map((p) => _LivePollCard(
                      poll: p,
                      onVote: (optionId) async {
                        await service.submitPollVote(p.id, optionId, eventId);
                      },
                    )),
                    if (data.hasMore)
                      _LoadMoreButton(
                        isLoading: data.isLoadingMore,
                        onPressed: () => service.loadMorePolls(eventId),
                      ),
                  ],
                )
              : const SizedBox.shrink(),
        );
      },
    );
  }
}

/// Announcements section with isolated loading, data, and pagination
class _AnnouncementsSectionSelector extends StatelessWidget {
  final String eventId;
  const _AnnouncementsSectionSelector({required this.eventId});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Selector<ZoneStateService, ({
      bool isLoading,
      bool isLoadingMore,
      bool hasMore,
      String? error,
      List<EventAnnouncement> announcements,
    })>(
      selector: (_, s) => (
        isLoading: s.isLoadingAnnouncements,
        isLoadingMore: s.isLoadingMoreAnnouncements,
        hasMore: s.hasMoreAnnouncements,
        error: s.announcementsError,
        announcements: s.announcements.items,
      ),
      builder: (context, data, _) {
        final service = context.read<ZoneStateService>();
        return ZoneSectionState(
          isLoading: data.isLoading,
          error: data.error,
          onRetry: () => service.loadAnnouncements(eventId),
          child: data.announcements.isNotEmpty
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _SectionHeader(title: '📢 Announcements', color: cs.onSurfaceVariant),
                    ...data.announcements.map((a) => _ZoneAnnouncementCard(announcement: a)),
                    if (data.hasMore)
                      _LoadMoreButton(
                        isLoading: data.isLoadingMore,
                        onPressed: () => service.loadMoreAnnouncements(eventId),
                      ),
                  ],
                )
              : const SizedBox.shrink(),
        );
      },
    );
  }
}

/// Quiet state wrapper with Selector for empty content detection
class _QuietStateSelectorWrapper extends StatelessWidget {
  final bool canManage;
  final VoidCallback onManage;

  const _QuietStateSelectorWrapper({
    required this.canManage,
    required this.onManage,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Selector<ZoneStateService, bool>(
      selector: (_, s) =>
          s.liveSessions.isEmpty &&
          s.upcomingSessions.isEmpty &&
          s.nearbyAttendees.isEmpty &&
          s.activePolls.items.isEmpty &&
          s.announcements.items.isEmpty,
      builder: (context, isEmpty, _) {
        if (!isEmpty) return const SizedBox.shrink();
        
        return Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            children: [
              Icon(Icons.coffee_rounded, size: 64, color: cs.onSurfaceVariant.withOpacity(0.5)),
              const SizedBox(height: 16),
              Text(
                'It\'s quiet here...',
                style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'No live sessions or activities right now.\nCheck back during the event!',
                textAlign: TextAlign.center,
                style: textTheme.bodyMedium?.copyWith(color: cs.onSurfaceVariant),
              ),
              if (canManage) ...[
                const SizedBox(height: 16),
                OutlinedButton.icon(
                  onPressed: onManage,
                  icon: const Icon(Icons.add_rounded),
                  label: const Text('Add Content'),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}

/// Reusable section header widget
class _SectionHeader extends StatelessWidget {
  final String title;
  final Color color;

  const _SectionHeader({required this.title, required this.color});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: color,
            ),
      ),
    );
  }
}

/// Reusable load more button widget
class _LoadMoreButton extends StatelessWidget {
  final bool isLoading;
  final VoidCallback onPressed;

  const _LoadMoreButton({required this.isLoading, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: isLoading
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : TextButton.icon(
                onPressed: onPressed,
                icon: const Icon(Icons.expand_more_rounded),
                label: const Text('Load More'),
              ),
      ),
    );
  }
}

/// Zone announcement card (renamed to avoid conflict with management page)
class _ZoneAnnouncementCard extends StatelessWidget {
  final EventAnnouncement announcement;
  const _ZoneAnnouncementCard({required this.announcement});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: announcement.isPinned
            ? Border.all(color: cs.primary.withOpacity(0.5))
            : null,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(announcement.typeIcon, size: 20, color: cs.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    if (announcement.isPinned)
                      Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: Icon(Icons.push_pin, size: 14, color: cs.primary),
                      ),
                    Expanded(
                      child: Text(
                        announcement.title,
                        style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  announcement.content,
                  style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
