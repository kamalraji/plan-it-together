import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:thittam1hub/models/zone_models.dart';
import 'package:thittam1hub/services/zone_state_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';
import 'package:thittam1hub/widgets/zone/error_retry_card.dart';
import 'package:thittam1hub/widgets/zone/sections/zone_section_utils.dart';

/// Announcements section displaying event updates
class AnnouncementsSection extends StatelessWidget {
  final String eventId;

  const AnnouncementsSection({super.key, required this.eventId});

  @override
  Widget build(BuildContext context) {
    return Selector<ZoneStateService, ({bool loading, List<EventAnnouncement> items, String? error})>(
      selector: (_, s) => (
        loading: s.isLoadingAnnouncements,
        items: s.announcements.items,
        error: s.announcementsError,
      ),
      builder: (context, data, _) {
        if (data.loading) {
          return const ZoneSectionLoading();
        }

        if (data.error != null) {
          return ErrorRetryCard(
            message: data.error!,
            onRetry: () => context.read<ZoneStateService>().loadAnnouncements(eventId),
          );
        }

        if (data.items.isEmpty) {
          return const ZoneSectionEmpty(
            icon: Icons.campaign_rounded,
            title: 'No Announcements',
            subtitle: 'Stay tuned for updates from organizers',
          );
        }

        return BrandedRefreshIndicator(
          onRefresh: () => context.read<ZoneStateService>().loadAnnouncements(eventId, refresh: true),
          child: ListView.builder(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 16,
              bottom: context.bottomContentPadding,
            ),
            itemCount: data.items.length,
            itemBuilder: (context, index) {
              final announcement = data.items[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _AnnouncementCard(announcement: announcement),
              );
            },
          ),
        );
      },
    );
  }
}

class _AnnouncementCard extends StatelessWidget {
  final EventAnnouncement announcement;

  const _AnnouncementCard({required this.announcement});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    Color getTypeColor() {
      switch (announcement.type) {
        case 'alert':
          return Colors.red;
        case 'update':
          return Colors.blue;
        case 'sponsor':
          return Colors.amber;
        default:
          return cs.primary;
      }
    }

    final color = getTypeColor();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: announcement.isPinned ? color.withOpacity(0.3) : cs.outline.withOpacity(0.1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  announcement.typeIcon,
                  size: 18,
                  color: color,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  announcement.title,
                  style: textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              if (announcement.isPinned)
                Icon(Icons.push_pin_rounded, size: 16, color: color),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            announcement.content,
            style: textTheme.bodyMedium?.copyWith(
              color: cs.onSurfaceVariant,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}
