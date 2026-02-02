import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:thittam1hub/models/zone_section.dart';
import 'package:thittam1hub/services/zone_state_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/zone/zone_navigation_fab.dart';
import 'package:thittam1hub/widgets/zone/zone_inside_header.dart';
import 'package:thittam1hub/widgets/zone/zone_section_content.dart';
import 'package:thittam1hub/widgets/zone/zone_sidebar.dart';

/// Inside Zone Experience - Full-featured zone with structured navigation
/// Accessed after check-in with FAB navigation on mobile, sidebar on tablet/desktop
class ZoneInsidePage extends StatefulWidget {
  final String eventId;
  final String eventName;
  final String? initialSection;
  final String? initialSessionId;
  final VoidCallback onCheckOut;

  const ZoneInsidePage({
    super.key,
    required this.eventId,
    required this.eventName,
    this.initialSection,
    this.initialSessionId,
    required this.onCheckOut,
  });

  @override
  State<ZoneInsidePage> createState() => _ZoneInsidePageState();
}

class _ZoneInsidePageState extends State<ZoneInsidePage>
    with TickerProviderStateMixin {
  late ZoneSection _currentSection;
  late AnimationController _sectionTransitionController;
  late Animation<double> _fadeAnimation;

  // Track loaded sections for lazy loading
  final Set<ZoneSection> _loadedSections = {};

  // Drawer controller for mobile
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // Sidebar expanded state for tablet/desktop
  bool _sidebarExpanded = true;

  @override
  void initState() {
    super.initState();

    // Parse initial section from URL or default to schedule
    _currentSection =
        ZoneSection.fromId(widget.initialSection) ?? ZoneSection.schedule;
    _loadedSections.add(_currentSection);

    _sectionTransitionController = AnimationController(
      duration: const Duration(milliseconds: 250),
      vsync: this,
    );

    _fadeAnimation = CurvedAnimation(
      parent: _sectionTransitionController,
      curve: Curves.easeOutCubic,
    );

    _sectionTransitionController.forward();

    // Load initial section data
    _loadSectionData(_currentSection);
  }

  @override
  void dispose() {
    _sectionTransitionController.dispose();
    super.dispose();
  }

  Future<void> _loadSectionData(ZoneSection section) async {
    if (_loadedSections.contains(section)) return;

    final service = context.read<ZoneStateService>();

    switch (section) {
      case ZoneSection.schedule:
        await service.loadSessions(widget.eventId);
      case ZoneSection.networking:
        await service.loadAttendees(widget.eventId);
      case ZoneSection.polls:
        await service.loadActivePolls(widget.eventId);
      case ZoneSection.announcements:
        await service.loadAnnouncements(widget.eventId);
      case ZoneSection.leaderboard:
        // Leaderboard data loaded via gamification
        break;
      case ZoneSection.materials:
        // Materials loaded per-session
        break;
      case ZoneSection.circles:
        // Circles loaded separately
        break;
      case ZoneSection.icebreaker:
        await service.loadTodayIcebreaker(widget.eventId);
      case ZoneSection.qa:
        // Q&A loaded via sessions
        break;
      case ZoneSection.sponsors:
        // Sponsors loaded separately
        break;
      case ZoneSection.challenges:
        // Challenges loaded via gamification
        break;
      case ZoneSection.activity:
        // Activity feed loaded separately
        break;
    }

    _loadedSections.add(section);
  }

  void _switchSection(ZoneSection section) {
    if (_currentSection == section) return;

    HapticFeedback.lightImpact();

    // Update service state for URL sync
    context.read<ZoneStateService>().switchSection(section.id);

    // Animate out current section
    _sectionTransitionController.reverse().then((_) {
      setState(() => _currentSection = section);

      // Load data for new section
      _loadSectionData(section);

      // Animate in new section
      _sectionTransitionController.forward();
    });

    // Pre-load adjacent sections
    _preloadAdjacentSections(section);
  }

  void _preloadAdjacentSections(ZoneSection current) {
    final sections = ZoneSection.values;
    final currentIndex = sections.indexOf(current);

    final adjacentSections = [
      if (currentIndex > 0) sections[currentIndex - 1],
      if (currentIndex < sections.length - 1) sections[currentIndex + 1],
    ];

    for (final section in adjacentSections) {
      _loadSectionData(section);
    }
  }

  Future<void> _handleCheckOut() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.logout_rounded),
            SizedBox(width: 12),
            Text('Check Out'),
          ],
        ),
        content: const Text(
          'Are you sure you want to check out from this event? '
          'You can check back in anytime.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Stay'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Check Out'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      HapticFeedback.heavyImpact();
      widget.onCheckOut();
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final showSidebar = context.showMasterDetail;

    // Tablet/Desktop: Sidebar layout
    if (showSidebar) {
      return Scaffold(
        key: _scaffoldKey,
        backgroundColor: cs.surface,
        body: SafeArea(
          child: Row(
            children: [
              // Persistent sidebar
              ZoneSidebar(
                currentSection: _currentSection,
                eventName: widget.eventName,
                onSectionChanged: _switchSection,
                onCheckOut: _handleCheckOut,
                isExpanded: _sidebarExpanded,
                onToggleExpanded: () {
                  setState(() => _sidebarExpanded = !_sidebarExpanded);
                },
              ),

              // Main content area
              Expanded(
                child: Column(
                  children: [
                    // Simplified header for desktop (no menu button)
                    _ZoneDesktopHeader(
                      eventName: widget.eventName,
                      currentSection: _currentSection,
                    ),

                    // Section Content
                    Expanded(
                      child: FadeTransition(
                        opacity: _fadeAnimation,
                        child: ZoneSectionContent(
                          section: _currentSection,
                          eventId: widget.eventId,
                          initialSessionId: widget.initialSessionId,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Mobile: FAB + Drawer layout
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: cs.surface,

      // Navigation Drawer for section list
      drawer: _ZoneSectionDrawer(
        currentSection: _currentSection,
        eventName: widget.eventName,
        onSectionChanged: (section) {
          Navigator.pop(context); // Close drawer
          _switchSection(section);
        },
        onCheckOut: () {
          Navigator.pop(context); // Close drawer
          _handleCheckOut();
        },
      ),

      body: SafeArea(
        child: Column(
          children: [
            // Header with event name and checkout
            ZoneInsideHeader(
              eventName: widget.eventName,
              currentSection: _currentSection,
              onMenuPressed: () => _scaffoldKey.currentState?.openDrawer(),
              onCheckOut: _handleCheckOut,
            ),

            // Section Content
            Expanded(
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: ZoneSectionContent(
                  section: _currentSection,
                  eventId: widget.eventId,
                  initialSessionId: widget.initialSessionId,
                ),
              ),
            ),
          ],
        ),
      ),

      // Navigation FAB (mobile only)
      floatingActionButton: ZoneNavigationFAB(
        currentSection: _currentSection,
        onSectionChanged: _switchSection,
      ),
    );
  }
}

// =============================================================================
// Desktop Header (simplified, no menu button)
// =============================================================================

class _ZoneDesktopHeader extends StatelessWidget {
  final String eventName;
  final ZoneSection currentSection;

  const _ZoneDesktopHeader({
    required this.eventName,
    required this.currentSection,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final sectionColor = currentSection.getColor(cs);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border(
          bottom: BorderSide(color: cs.outline.withOpacity(0.1)),
        ),
      ),
      child: Row(
        children: [
          // Current section badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: sectionColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: sectionColor.withOpacity(0.2)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  currentSection.icon,
                  size: 20,
                  color: sectionColor,
                ),
                const SizedBox(width: 8),
                Text(
                  currentSection.label,
                  style: textTheme.titleMedium?.copyWith(
                    color: sectionColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),

          const Spacer(),

          // Live indicator
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: Colors.green,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.green.withOpacity(0.5),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'In Zone',
                  style: textTheme.labelMedium?.copyWith(
                    color: Colors.green,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// Section Drawer Component
// =============================================================================

class _ZoneSectionDrawer extends StatelessWidget {
  final ZoneSection currentSection;
  final String eventName;
  final ValueChanged<ZoneSection> onSectionChanged;
  final VoidCallback onCheckOut;

  const _ZoneSectionDrawer({
    required this.currentSection,
    required this.eventName,
    required this.onSectionChanged,
    required this.onCheckOut,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Drawer(
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Drawer Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(color: cs.outline.withOpacity(0.1)),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: cs.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          Icons.location_on_rounded,
                          color: cs.primary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Zone',
                              style: textTheme.labelSmall?.copyWith(
                                color: cs.primary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              eventName,
                              style: textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            
            // Section List
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: ZoneSection.values.map((section) {
                  final isActive = section == currentSection;
                  final color = section.getColor(cs);
                  
                  return ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isActive ? color.withOpacity(0.2) : Colors.transparent,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        section.icon,
                        color: isActive ? color : cs.onSurfaceVariant,
                        size: 22,
                      ),
                    ),
                    title: Text(
                      section.label,
                      style: textTheme.bodyLarge?.copyWith(
                        fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                        color: isActive ? cs.onSurface : cs.onSurfaceVariant,
                      ),
                    ),
                    trailing: isActive
                        ? Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: color,
                              shape: BoxShape.circle,
                            ),
                          )
                        : null,
                    selected: isActive,
                    selectedTileColor: color.withOpacity(0.05),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    onTap: () => onSectionChanged(section),
                  );
                }).toList(),
              ),
            ),
            
            // Check Out Button
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(color: cs.outline.withOpacity(0.1)),
                ),
              ),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: onCheckOut,
                  icon: const Icon(Icons.logout_rounded),
                  label: const Text('Check Out'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: cs.error,
                    side: BorderSide(color: cs.error.withOpacity(0.3)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
