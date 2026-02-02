import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:thittam1hub/models/zone_models.dart';
import 'package:thittam1hub/services/zone_state_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';
import 'package:thittam1hub/widgets/zone/error_retry_card.dart';
import 'package:thittam1hub/widgets/zone/sections/zone_section_utils.dart';

/// Polls section displaying active event polls
class PollsSection extends StatelessWidget {
  final String eventId;

  const PollsSection({super.key, required this.eventId});

  @override
  Widget build(BuildContext context) {
    return Selector<ZoneStateService, ({bool loading, List<EventPoll> polls, String? error})>(
      selector: (_, s) => (
        loading: s.isLoadingPolls,
        polls: s.activePolls.items,
        error: s.pollsError,
      ),
      builder: (context, data, _) {
        if (data.loading) {
          return const ZoneSectionLoading();
        }

        if (data.error != null) {
          return ErrorRetryCard(
            message: data.error!,
            onRetry: () => context.read<ZoneStateService>().loadActivePolls(eventId),
          );
        }

        if (data.polls.isEmpty) {
          return const ZoneSectionEmpty(
            icon: Icons.poll_rounded,
            title: 'No Active Polls',
            subtitle: 'Polls will appear here when organizers create them',
          );
        }

        return BrandedRefreshIndicator(
          onRefresh: () => context.read<ZoneStateService>().loadActivePolls(eventId, refresh: true),
          child: ListView.builder(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 16,
              bottom: context.bottomContentPadding,
            ),
            itemCount: data.polls.length,
            itemBuilder: (context, index) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _PollCard(poll: data.polls[index], eventId: eventId),
              );
            },
          ),
        );
      },
    );
  }
}

class _PollCard extends StatelessWidget {
  final EventPoll poll;
  final String eventId;

  const _PollCard({required this.poll, required this.eventId});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cs.outline.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.poll_rounded, color: cs.secondary, size: 20),
              const SizedBox(width: 8),
              Text(
                '${poll.totalVotes} votes',
                style: textTheme.labelMedium?.copyWith(
                  color: cs.onSurfaceVariant,
                ),
              ),
              const Spacer(),
              if (poll.hasVoted)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.check_circle, size: 12, color: Colors.green),
                      const SizedBox(width: 4),
                      Text(
                        'Voted',
                        style: textTheme.labelSmall?.copyWith(
                          color: Colors.green,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            poll.question,
            style: textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          ...poll.options.map((option) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: _PollOptionBar(
              option: option,
              isSelected: poll.userVote == option.id,
              hasVoted: poll.hasVoted,
              onTap: poll.hasVoted
                  ? null
                  : () => context.read<ZoneStateService>().submitPollVote(
                        poll.id,
                        option.id,
                        eventId,
                      ),
            ),
          )),
        ],
      ),
    );
  }
}

class _PollOptionBar extends StatelessWidget {
  final PollOption option;
  final bool isSelected;
  final bool hasVoted;
  final VoidCallback? onTap;

  const _PollOptionBar({
    required this.option,
    required this.isSelected,
    required this.hasVoted,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest.withOpacity(0.5),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? cs.secondary : cs.outline.withOpacity(0.1),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Stack(
          children: [
            if (hasVoted)
              Positioned.fill(
                child: FractionallySizedBox(
                  alignment: Alignment.centerLeft,
                  widthFactor: option.percentage / 100,
                  child: Container(
                    decoration: BoxDecoration(
                      color: isSelected
                          ? cs.secondary.withOpacity(0.2)
                          : cs.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      option.text,
                      style: textTheme.bodyMedium?.copyWith(
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ),
                  if (hasVoted)
                    Text(
                      '${option.percentage.toStringAsFixed(0)}%',
                      style: textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: isSelected ? cs.secondary : cs.onSurfaceVariant,
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
}
