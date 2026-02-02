import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:thittam1hub/models/zone_challenge.dart';
import 'package:thittam1hub/services/zone_state_service.dart';
import 'package:thittam1hub/widgets/zone/challenge_card.dart';
import 'package:thittam1hub/widgets/zone/sections/zone_section_utils.dart';

/// Challenges section displaying scavenger hunt tasks
class ChallengesSection extends StatefulWidget {
  final String eventId;

  const ChallengesSection({super.key, required this.eventId});

  @override
  State<ChallengesSection> createState() => _ChallengesSectionState();
}

class _ChallengesSectionState extends State<ChallengesSection> {
  String? _completingChallengeId;

  @override
  void initState() {
    super.initState();
    // Trigger load if not already loaded
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final service = context.read<ZoneStateService>();
      if (service.activeChallenges.isEmpty && !service.isLoadingChallenges) {
        service.loadChallenges(widget.eventId);
      }
    });
  }

  Future<void> _completeChallenge(
    ZoneStateService service,
    ZoneChallenge challenge,
  ) async {
    if (challenge.isCompleted || !challenge.isAvailable) return;

    setState(() => _completingChallengeId = challenge.id);
    HapticFeedback.mediumImpact();

    final points = await service.completeChallenge(
      challengeId: challenge.id,
      eventId: widget.eventId,
    );

    if (points > 0 && mounted) {
      HapticFeedback.heavyImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Challenge complete! +$points points 🏆'),
          backgroundColor: Theme.of(context).colorScheme.primary,
        ),
      );
    }

    if (mounted) {
      setState(() => _completingChallengeId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Selector<ZoneStateService, ({
      bool loading,
      List<ZoneChallenge> challenges,
      int completedCount,
    })>(
      selector: (_, s) => (
        loading: s.isLoadingChallenges,
        challenges: s.activeChallenges,
        completedCount: s.completedChallenges.length,
      ),
      builder: (context, data, _) {
        if (data.loading && data.challenges.isEmpty) {
          return const ZoneSectionLoading();
        }

        if (data.challenges.isEmpty) {
          return const ZoneSectionEmpty(
            icon: Icons.emoji_events_rounded,
            title: 'No Active Challenges',
            subtitle: 'Event challenges will appear here when available',
          );
        }

        final service = context.read<ZoneStateService>();
        final tt = Theme.of(context).textTheme;
        final cs = Theme.of(context).colorScheme;

        // Separate completed and active challenges
        final active = data.challenges.where((c) => !c.isCompleted).toList();
        final completed = data.challenges.where((c) => c.isCompleted).toList();

        return RefreshIndicator(
          onRefresh: () => service.loadChallenges(widget.eventId),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Progress header
              _buildProgressHeader(
                context,
                completed: completed.length,
                total: data.challenges.length,
              ),
              const SizedBox(height: 16),

              // Active challenges
              if (active.isNotEmpty) ...[
                Text(
                  'Active Challenges',
                  style: tt.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                ...active.map((challenge) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: ChallengeCard(
                    challenge: challenge,
                    isLoading: _completingChallengeId == challenge.id,
                    onComplete: () => _completeChallenge(service, challenge),
                  ),
                )),
              ],

              // Completed challenges
              if (completed.isNotEmpty) ...[
                const SizedBox(height: 16),
                Row(
                  children: [
                    Icon(Icons.check_circle_rounded, size: 20, color: cs.primary),
                    const SizedBox(width: 8),
                    Text(
                      'Completed (${completed.length})',
                      style: tt.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ...completed.map((challenge) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: ChallengeCard(
                    challenge: challenge,
                    isLoading: false,
                    onComplete: null,
                  ),
                )),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildProgressHeader(
    BuildContext context, {
    required int completed,
    required int total,
  }) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final progress = total > 0 ? completed / total : 0.0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            cs.primaryContainer,
            cs.primaryContainer.withOpacity(0.5),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Challenge Progress',
                    style: tt.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$completed of $total completed',
                    style: tt.bodyMedium?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: cs.primary,
                  shape: BoxShape.circle,
                ),
                child: Text(
                  '${(progress * 100).round()}%',
                  style: tt.titleSmall?.copyWith(
                    color: cs.onPrimary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: cs.surfaceContainerHighest,
              valueColor: AlwaysStoppedAnimation(cs.primary),
            ),
          ),
        ],
      ),
    );
  }
}
