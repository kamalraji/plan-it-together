import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/pages/impact/pulse_page_controller.dart';
import 'package:thittam1hub/pages/impact/widgets/pulse_widgets.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/enhanced_empty_state.dart';
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';
import 'package:thittam1hub/utils/animations.dart';
import 'package:thittam1hub/utils/intent_config.dart';
import 'package:thittam1hub/utils/icon_mappings.dart';

/// Pulse discovery page for finding people and groups.
/// 
/// Features:
/// - People discovery with swipe cards
/// - Groups/Circles discovery and creation
/// - Intent-based filtering (Looking For)
/// - Skills and interests filtering
/// - Deep link support via URL parameters
class PulsePage extends StatefulWidget {
  final String? initialIntent;
  final String? initialMode;
  final String? searchQuery;

  const PulsePage({
    super.key,
    this.initialIntent,
    this.initialMode,
    this.searchQuery,
  });

  @override
  State<PulsePage> createState() => _PulsePageState();
}

class _PulsePageState extends State<PulsePage> {
  late final PulsePageController _controller;

  @override
  void initState() {
    super.initState();
    _controller = PulsePageController(
      initialIntent: widget.initialIntent,
      initialMode: widget.initialMode,
      searchQuery: widget.searchQuery,
    );
    _controller.addListener(_onControllerChanged);
    _controller.initialize();
  }

  void _onControllerChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _controller.removeListener(_onControllerChanged);
    _controller.dispose();
    super.dispose();
  }

  void _updateUrl() {
    final params = _controller.getUrlParams();
    context.replace('/impact?${params.toQueryString()}');
  }

  void _showFilterDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => PulseFilterSheet(
        allProfiles: _controller.allProfiles,
        selectedSkills: _controller.selectedSkills,
        selectedInterests: _controller.selectedInterests,
        selectedLookingFor: _controller.selectedLookingFor,
        onApply: (skills, interests, lookingFor) {
          _controller.applyFilters(skills, interests, lookingFor);
          _updateUrl();
        },
      ),
    );
  }

  void _openCreateCircle() {
    final cs = Theme.of(context).colorScheme;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: cs.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => CreateCircleSheet(
        onCreate: (name, description, icon, isPublic, tags) async {
          final success = await _controller.createCircle(
            name: name,
            description: description,
            icon: icon,
            isPublic: isPublic,
            tags: tags,
          );
          if (mounted && success) {
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Circle "$name" created'),
                backgroundColor: cs.primary,
              ),
            );
          }
        },
      ),
    );
  }

  Future<void> _onFollow() async {
    final cs = Theme.of(context).colorScheme;
    final profile = _controller.currentProfile;
    if (profile == null) return;

    final result = await _controller.onFollow();

    if (mounted) {
      if (result.success) {
        HapticFeedback.heavyImpact();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Now following ${profile.fullName}!'),
            backgroundColor: AppColors.success,
          ),
        );
      } else if (result.requestSent) {
        HapticFeedback.mediumImpact();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Follow request sent to ${profile.fullName}'),
            backgroundColor: cs.primary,
          ),
        );
      } else if (result.rateLimited) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Too many follow requests. Please wait a bit.'),
            backgroundColor: AppColors.warning,
          ),
        );
      }
    }
  }

  Future<void> _onSave() async {
    final profile = _controller.currentProfile;
    if (profile == null) return;

    final success = await _controller.onSave();

    if (mounted && success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Saved ${profile.fullName} to favorites'),
          backgroundColor: Colors.amber[600],
        ),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to save profile')),
      );
    }
  }

  Future<void> _toggleCircleMembership(circle) async {
    final cs = Theme.of(context).colorScheme;
    final isJoined = _controller.isCircleJoined(circle.id);
    final success = await _controller.toggleCircleMembership(circle);

    if (mounted && success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(isJoined ? 'Left ${circle.name}' : 'Joined ${circle.name}'),
          backgroundColor: isJoined ? cs.surfaceContainerHighest : cs.primary,
        ),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to ${isJoined ? "leave" : "join"} circle')),
      );
    }
  }

  Future<void> _onRefresh() async {
    await _controller.onRefresh();
    _updateUrl();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: BrandedRefreshIndicator(
          onRefresh: _onRefresh,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              // Discovery Mode Toggle
              SliverToBoxAdapter(
                child: PulseDiscoveryToggle(
                  currentMode: _controller.discoveryMode,
                  onModeChanged: (mode) {
                    _controller.setDiscoveryMode(mode);
                    _updateUrl();
                  },
                ),
              ),

              // Filter Button Row
              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: context.horizontalPadding,
                    vertical: 8.0,
                  ),
                  child: Row(
                    children: [
                      if (widget.searchQuery != null && widget.searchQuery!.isNotEmpty)
                        Expanded(
                          child: Text(
                            'Searching: "${widget.searchQuery}"',
                            style: textTheme.bodyMedium?.copyWith(color: cs.onSurfaceVariant),
                            overflow: TextOverflow.ellipsis,
                          ),
                        )
                      else
                        const Spacer(),
                      _buildFilterButton(cs),
                    ],
                  ),
                ),
              ),

              // Active Filter Chips
              if (_controller.hasActiveFilters)
                SliverToBoxAdapter(child: _buildFilterChips()),

              // Content Area
              SliverFillRemaining(
                hasScrollBody: false,
                child: _controller.isLoading
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: FadeSlideTransition(
                            child: const ProfileCardSkeleton(),
                          ),
                        ),
                      )
                    : _controller.discoveryMode == DiscoveryMode.groups
                        ? _buildGroupsContent(cs, textTheme)
                        : _buildPeopleContent(cs, textTheme),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilterButton(ColorScheme cs) {
    return IconButton(
      icon: Stack(
        children: [
          Icon(Icons.filter_list, color: cs.onSurfaceVariant),
          if (_controller.hasActiveFilters)
            Positioned(
              right: 0,
              top: 0,
              child: Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: cs.primary,
                  shape: BoxShape.circle,
                ),
              ),
            ),
        ],
      ),
      onPressed: _showFilterDialog,
    );
  }

  Widget _buildFilterChips() {
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          ..._controller.selectedLookingFor.map((l) {
            final config = IntentConfig.getByKey(l);
            return _FilterChip(
              label: config?.label ?? l,
              icon: config?.icon,
              color: config?.color,
              onRemove: () {
                _controller.removeLookingForFilter(l);
                _updateUrl();
              },
            );
          }),
          ..._controller.selectedSkills.map((s) => _FilterChip(
                label: s,
                onRemove: () => _controller.removeSkillFilter(s),
              )),
          ..._controller.selectedInterests.map((i) => _FilterChip(
                label: i,
                onRemove: () => _controller.removeInterestFilter(i),
              )),
        ],
      ),
    );
  }

  Widget _buildPeopleContent(ColorScheme cs, TextTheme textTheme) {
    final profile = _controller.currentProfile;
    final aiMatch = _controller.currentAIMatch;
    
    if (profile == null) {
      return _buildEmptyState(cs, textTheme, 'profiles');
    }

    return PulseProfileCard(
      profile: profile,
      matchScore: _controller.currentMatchScore,
      matchResult: _controller.currentMatchResult,
      isOnline: _controller.currentIsOnline,
      followsMe: _controller.currentFollowsMe,
      selectedIntent: _controller.selectedLookingFor.isNotEmpty
          ? _controller.selectedLookingFor.first
          : null,
      // Pass AI match data
      smartMatch: aiMatch,
      matchCategory: aiMatch?.matchCategory,
      commonSkills: aiMatch?.commonSkills,
      commonInterests: aiMatch?.commonInterests,
      onSkip: _controller.onSkip,
      onFollow: _onFollow,
      onSave: _onSave,
      onTap: () => context.push(
        '/impact/profile/${profile.userId}',
        extra: {
          'profile': profile,
          'smartMatch': aiMatch,
        },
      ),
    );
  }

  Widget _buildGroupsContent(ColorScheme cs, TextTheme textTheme) {
    if (_controller.circlesLoading) {
      return ListView(
        padding: const EdgeInsets.all(16),
        children: List.generate(
          4,
          (index) => FadeSlideTransition(
            delay: staggerDelay(index),
            child: const CircleCardSkeleton(),
          ),
        ),
      );
    }

    final hasNoCircles = _controller.autoMatchedCircles.isEmpty &&
        _controller.popularCircles.isEmpty &&
        _controller.recommendedCircles.isEmpty;

    if (hasNoCircles) {
      return _buildEmptyState(cs, textTheme, 'groups');
    }

    return Stack(
      children: [
        ListView(
          padding: const EdgeInsets.only(bottom: 80),
          children: [
            // Auto-Matched Circles
            if (_controller.autoMatchedCircles.isNotEmpty) ...[
              _buildSectionTitle('📍 Auto-Matched Circles'),
              ..._controller.autoMatchedCircles.map((circle) => AutoMatchedCircleCard(
                    circle: circle,
                    isJoined: _controller.isCircleJoined(circle.id),
                    onTap: () => context.push('/circles/${circle.id}', extra: circle),
                    onJoinToggle: () => _toggleCircleMembership(circle),
                  )),
            ],

            // Popular Circles
            if (_controller.popularCircles.isNotEmpty) ...[
              _buildSectionTitle('🔥 Popular Circles'),
              SizedBox(
                height: 200,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _controller.popularCircles.length,
                  itemBuilder: (context, index) {
                    final circle = _controller.popularCircles[index];
                    return PopularCircleCard(
                      circle: circle,
                      isJoined: _controller.isCircleJoined(circle.id),
                      onTap: () => context.push('/circles/${circle.id}', extra: circle),
                      onJoinToggle: () => _toggleCircleMembership(circle),
                    );
                  },
                ),
              ),
            ],

            // Recommended Circles
            if (_controller.recommendedCircles.isNotEmpty) ...[
              _buildSectionTitle('🎯 Based on Your Interests'),
              ..._controller.recommendedCircles.map((circle) => CircleDiscoveryCard(
                    circle: circle,
                    matchScore: 75,
                    insights: const [],
                    onJoin: _controller.isCircleJoined(circle.id)
                        ? null
                        : () => _toggleCircleMembership(circle),
                    onTap: () => context.push('/circles/${circle.id}', extra: circle),
                  )),
            ],
          ],
        ),

        // Create Circle FAB
        Positioned(
          right: 16,
          bottom: 16,
          child: FloatingActionButton.extended(
            onPressed: _openCreateCircle,
            icon: const Icon(Icons.add),
            label: const Text('Create'),
            backgroundColor: cs.primary,
            foregroundColor: cs.onPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Text(
        title,
        style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildEmptyState(ColorScheme cs, TextTheme textTheme, String type) {
    EmptyStateConfig emptyConfig;
    if (type == 'groups') {
      emptyConfig = EmptyStateConfig.groups;
    } else {
      emptyConfig = EmptyStateConfig.profiles;
    }

    return EnhancedEmptyState(
      icon: type == 'groups' ? IconMappings.emptyGroups : emptyConfig.icon,
      title: emptyConfig.title,
      subtitle: emptyConfig.subtitle,
      primaryButtonLabel: _controller.hasActiveFilters ? 'Clear Filters' : null,
      primaryButtonIcon: _controller.hasActiveFilters ? Icons.filter_alt_off_rounded : null,
      onPrimaryAction: _controller.hasActiveFilters
          ? () {
              HapticFeedback.lightImpact();
              _controller.clearAllFilters();
              _updateUrl();
            }
          : null,
    );
  }
}

/// Filter chip widget
class _FilterChip extends StatelessWidget {
  final String label;
  final IconData? icon;
  final Color? color;
  final VoidCallback onRemove;

  const _FilterChip({
    required this.label,
    this.icon,
    this.color,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final chipColor = color ?? cs.primary;

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Chip(
        avatar: icon != null ? Icon(icon, size: 16, color: chipColor) : null,
        label: Text(label),
        deleteIcon: const Icon(Icons.close, size: 16),
        onDeleted: onRemove,
        backgroundColor: chipColor.withValues(alpha: 0.1),
        labelStyle: TextStyle(color: chipColor),
      ),
    );
  }
}
