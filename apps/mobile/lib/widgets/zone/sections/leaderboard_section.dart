import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:thittam1hub/models/zone_gamification_models.dart';
import 'package:thittam1hub/services/zone_state_service.dart';
import 'package:thittam1hub/widgets/zone/zone_leaderboard_card.dart';

/// Leaderboard section displaying event rankings
class LeaderboardSection extends StatefulWidget {
  final String eventId;

  const LeaderboardSection({super.key, required this.eventId});

  @override
  State<LeaderboardSection> createState() => _LeaderboardSectionState();
}

class _LeaderboardSectionState extends State<LeaderboardSection> {
  @override
  void initState() {
    super.initState();
    // Trigger load if not already loaded
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final service = context.read<ZoneStateService>();
      if (service.leaderboardEntries.isEmpty && !service.isLoadingLeaderboard) {
        service.loadLeaderboard(widget.eventId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Selector<ZoneStateService, ({
      bool loading,
      List<ZoneLeaderboardEntry> entries,
      ZoneLeaderboardEntry? currentUser,
    })>(
      selector: (_, s) => (
        loading: s.isLoadingLeaderboard,
        entries: s.leaderboardEntries,
        currentUser: s.currentUserLeaderboardEntry,
      ),
      builder: (context, data, _) {
        return Padding(
          padding: const EdgeInsets.all(16),
          child: ZoneLeaderboardCard(
            entries: data.entries,
            currentUserStats: data.currentUser != null
                ? ZoneUserStats.fromLeaderboardEntry(data.currentUser)
                : null,
            isLoading: data.loading,
            onViewAll: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (_) => ZoneLeaderboardSheet(
                  entries: data.entries,
                  currentUserId: data.currentUser?.userId,
                ),
              );
            },
          ),
        );
      },
    );
  }
}
