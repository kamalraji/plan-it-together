import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/services/profile_service.dart' show EventHistory;
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/utils/animations.dart' show FadeSlideTransition, staggerDelay;
import '../widgets/profile_helper_widgets.dart';

/// Events tab content with scroll position preservation
class ProfileEventsTabContent extends StatefulWidget {
  final List<Map<String, dynamic>> upcoming;
  final List<EventHistory> history;

  const ProfileEventsTabContent({
    super.key,
    required this.upcoming,
    required this.history,
  });

  @override
  State<ProfileEventsTabContent> createState() => _ProfileEventsTabContentState();
}

class _ProfileEventsTabContentState extends State<ProfileEventsTabContent>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin
    final isTablet = MediaQuery.of(context).size.width >= 600;

    if (widget.upcoming.isEmpty && widget.history.isEmpty) {
      return const ProfileEmptyTabContent(
        icon: Icons.event_outlined,
        title: 'No events yet',
        subtitle: 'Register for events to see them here',
      );
    }

    // Side-by-side layout for tablets when both sections have content
    if (isTablet && widget.upcoming.isNotEmpty && widget.history.isNotEmpty) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: _buildUpcomingSection(context)),
            const SizedBox(width: 24),
            Expanded(child: _buildHistorySection(context)),
          ],
        ),
      );
    }

    // Default stacked layout for phones or single section
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.upcoming.isNotEmpty) ...[
            _buildUpcomingSection(context),
            const SizedBox(height: 16),
          ],
          if (widget.history.isNotEmpty) _buildHistorySection(context),
        ],
      ),
    );
  }

  Widget _buildUpcomingSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'UPCOMING',
          style: context.textStyles.labelSmall?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 8),
        ...widget.upcoming.asMap().entries.map((entry) {
          final index = entry.key;
          final e = entry.value;
          final eventId = e['event_id'] as String? ?? '';
          return FadeSlideTransition(
            delay: staggerDelay(index, baseDelay: 40),
            child: _EventTile(
              name: e['events']?['name'] ?? 'Event',
              date: DateTime.tryParse(e['events']?['start_date'] ?? '') ?? DateTime.now(),
              bannerUrl: e['events']?['branding']?['banner_url'],
              isUpcoming: true,
              eventId: eventId,
            ),
          );
        }),
      ],
    );
  }

  Widget _buildHistorySection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'PAST EVENTS',
          style: context.textStyles.labelSmall?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 8),
        ...widget.history.take(5).toList().asMap().entries.map((entry) {
          final index = entry.key;
          final e = entry.value;
          return FadeSlideTransition(
            delay: staggerDelay(index, baseDelay: 40),
            child: _EventTile(
              name: e.eventName,
              date: e.startDate,
              bannerUrl: e.bannerUrl,
              isUpcoming: false,
              eventId: e.eventId,
            ),
          );
        }),
      ],
    );
  }
}

class _EventTile extends StatelessWidget {
  final String name;
  final DateTime date;
  final String? bannerUrl;
  final bool isUpcoming;
  final String eventId;

  const _EventTile({
    required this.name,
    required this.date,
    this.bannerUrl,
    required this.isUpcoming,
    required this.eventId,
  });

  static const _months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final dateLabel = '${_months[date.month - 1]} ${date.day}, ${date.year}';

    return Semantics(
      button: true,
      label: '$name event on $dateLabel',
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            if (eventId.isNotEmpty) {
              context.push('/events/$eventId');
            }
          },
          borderRadius: BorderRadius.circular(12),
          child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: isUpcoming ? cs.primary.withValues(alpha: 0.1) : cs.outline.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _months[date.month - 1].toUpperCase(),
                        style: context.textStyles.labelSmall?.copyWith(
                          color: isUpcoming ? cs.primary : cs.onSurfaceVariant,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        date.day.toString(),
                        style: context.textStyles.titleMedium?.copyWith(
                          color: isUpcoming ? cs.primary : cs.onSurfaceVariant,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: context.textStyles.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        dateLabel,
                        style: context.textStyles.labelSmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.chevron_right,
                  color: cs.onSurfaceVariant,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
