import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:thittam1hub/models/zone_models.dart';
import 'package:thittam1hub/models/networking_models.dart';
import 'package:thittam1hub/services/zone_state_service.dart';
import 'package:thittam1hub/services/ai_matching_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';
import 'package:thittam1hub/widgets/zone/error_retry_card.dart';
import 'package:thittam1hub/widgets/zone/sections/zone_section_utils.dart';
import 'package:thittam1hub/widgets/zone/ai_attendee_card.dart';
import 'package:thittam1hub/pages/impact/widgets/ai_match_badge.dart';

/// Networking section displaying AI-matched attendees at the event
class NetworkingSection extends StatefulWidget {
  final String eventId;

  const NetworkingSection({super.key, required this.eventId});

  @override
  State<NetworkingSection> createState() => _NetworkingSectionState();
}

class _NetworkingSectionState extends State<NetworkingSection> {
  final AIMatchingService _aiMatchingService = AIMatchingService.instance;
  
  List<SmartMatch> _aiMatches = [];
  bool _isLoadingAI = true;
  String? _aiError;
  bool _showListView = false;

  @override
  void initState() {
    super.initState();
    _loadAIMatches();
  }

  Future<void> _loadAIMatches() async {
    setState(() {
      _isLoadingAI = true;
      _aiError = null;
    });

    try {
      await _aiMatchingService.initialize();
      final results = await _aiMatchingService.getZoneMatches(
        eventId: widget.eventId,
        limit: 30,
      );
      
      // Convert AIMatchResult to SmartMatch for display
      final matches = results.map((r) => SmartMatch.fromAIMatch({
        'user_id': r.userId,
        'full_name': r.fullName,
        'avatar_url': r.avatarUrl,
        'headline': r.headline,
        'organization': r.organization,
        'final_score': r.matchScore / 100,
        'is_online': r.isOnline,
        'match_category': r.matchCategory,
        'common_skills': r.sharedSkills,
        'common_interests': r.sharedInterests,
        'is_verified': r.isVerified,
        'is_premium': r.isPremium,
        'embedding_similarity': r.embeddingSimilarity,
        'behavioral_score': r.behavioralScore,
      })).toList();

      setState(() {
        _aiMatches = matches;
        _isLoadingAI = false;
      });
    } catch (e) {
      setState(() {
        _aiError = 'Failed to load smart matches';
        _isLoadingAI = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Selector<ZoneStateService, ({bool loading, List<AttendeeRadar> attendees, int count, String? error})>(
      selector: (_, s) => (
        loading: s.isLoadingAttendees,
        attendees: s.nearbyAttendees,
        count: s.attendeeCount,
        error: s.attendeesError,
      ),
      builder: (context, data, _) {
        // Show loading if either regular attendees or AI matches are loading
        if (data.loading && _isLoadingAI) {
          return const ZoneSectionLoading();
        }

        if (data.error != null && _aiError != null) {
          return ErrorRetryCard(
            message: _aiError ?? data.error!,
            onRetry: () {
              context.read<ZoneStateService>().loadAttendees(widget.eventId);
              _loadAIMatches();
            },
          );
        }

        if (_aiMatches.isEmpty && data.attendees.isEmpty) {
          return const ZoneSectionEmpty(
            icon: Icons.people_rounded,
            title: 'No Attendees Nearby',
            subtitle: 'Other attendees will appear here when they check in',
          );
        }

        return BrandedRefreshIndicator(
          onRefresh: () async {
            await Future.wait([
              context.read<ZoneStateService>().loadAttendees(widget.eventId),
              _loadAIMatches(),
            ]);
          },
          child: ListView(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 16,
              bottom: context.bottomContentPadding,
            ),
            children: [
              // Stats & View Toggle
              _buildStatsHeader(context, cs, data.count),
              const SizedBox(height: 16),
              
              // High Match Highlights (horizontal scroll)
              if (_aiMatches.where((m) => m.matchScore >= 70).isNotEmpty) ...[
                _buildHighMatchSection(context, cs),
                const SizedBox(height: 20),
              ],
              
              // All Attendees Section
              Row(
                children: [
                  Expanded(
                    child: ZoneSectionHeader(
                      title: 'People Here',
                      icon: Icons.radar_rounded,
                      color: cs.tertiary,
                      count: _aiMatches.isNotEmpty ? _aiMatches.length : data.attendees.length,
                    ),
                  ),
                  // View toggle
                  IconButton(
                    icon: Icon(
                      _showListView ? Icons.grid_view_rounded : Icons.view_list_rounded,
                      size: 20,
                    ),
                    onPressed: () => setState(() => _showListView = !_showListView),
                    tooltip: _showListView ? 'Grid view' : 'List view',
                  ),
                ],
              ),
              const SizedBox(height: 12),
              
              // AI Matches (if available) or fallback to regular attendees
              if (_aiMatches.isNotEmpty)
                _showListView
                    ? _buildMatchList(context)
                    : _buildMatchGrid(context)
              else
                _buildFallbackGrid(context, cs, data.attendees),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatsHeader(BuildContext context, ColorScheme cs, int attendeeCount) {
    final highMatchCount = _aiMatches.where((m) => m.matchScore >= 70).length;
    final onlineCount = _aiMatches.where((m) => m.isOnline).length;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            cs.tertiary.withOpacity(0.15),
            cs.primary.withOpacity(0.1),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Icon(Icons.people_rounded, color: cs.tertiary, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$attendeeCount Attendees',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Row(
                  children: [
                    if (onlineCount > 0) ...[
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: Colors.green,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '$onlineCount online',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ],
                    if (highMatchCount > 0) ...[
                      if (onlineCount > 0) const SizedBox(width: 12),
                      Icon(Icons.auto_awesome, size: 12, color: cs.primary),
                      const SizedBox(width: 4),
                      Text(
                        '$highMatchCount high matches',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: cs.primary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          // AI Matching indicator
          if (_aiMatches.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: cs.primaryContainer,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.auto_awesome, size: 14, color: cs.primary),
                  const SizedBox(width: 4),
                  Text(
                    'AI',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: cs.primary,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildHighMatchSection(BuildContext context, ColorScheme cs) {
    final highMatches = _aiMatches.where((m) => m.matchScore >= 70).take(10).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.local_fire_department_rounded, size: 18, color: Colors.orange),
            const SizedBox(width: 8),
            Text(
              'Top Matches',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '${highMatches.length}',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.orange,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 190,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: highMatches.length,
            itemBuilder: (context, index) {
              final match = highMatches[index];
              return Padding(
                padding: EdgeInsets.only(
                  right: index < highMatches.length - 1 ? 12 : 0,
                ),
                child: SizedBox(
                  width: 140,
                  child: AIAttendeeCard(
                    match: match,
                    onTap: () => _navigateToProfile(context, match),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildMatchGrid(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.85,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
      ),
      itemCount: _aiMatches.length,
      itemBuilder: (context, index) {
        final match = _aiMatches[index];
        return AIAttendeeCard(
          match: match,
          onTap: () => _navigateToProfile(context, match),
        );
      },
    );
  }

  Widget _buildMatchList(BuildContext context) {
    return Column(
      children: _aiMatches.map((match) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: AIAttendeeListTile(
            match: match,
            onTap: () => _navigateToProfile(context, match),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildFallbackGrid(BuildContext context, ColorScheme cs, List<AttendeeRadar> attendees) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1.2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
      ),
      itemCount: attendees.length,
      itemBuilder: (context, index) {
        return _FallbackAttendeeCard(attendee: attendees[index]);
      },
    );
  }

  void _navigateToProfile(BuildContext context, SmartMatch match) {
    context.push(
      '/impact/profile/${match.profile.userId}',
      extra: {
        'profile': match.profile,
        'smartMatch': match,
      },
    );
  }
}

/// Fallback attendee card when AI matching is unavailable
class _FallbackAttendeeCard extends StatelessWidget {
  final AttendeeRadar attendee;

  const _FallbackAttendeeCard({required this.attendee});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cs.outline.withOpacity(0.1)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Stack(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: cs.primary.withOpacity(0.1),
                backgroundImage: attendee.avatarUrl != null
                    ? NetworkImage(attendee.avatarUrl!)
                    : null,
                child: attendee.avatarUrl == null
                    ? Text(
                        attendee.fullName.isNotEmpty
                            ? attendee.fullName[0].toUpperCase()
                            : '?',
                        style: textTheme.titleLarge?.copyWith(color: cs.primary),
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
          const SizedBox(height: 8),
          Text(
            attendee.fullName,
            style: textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
          ),
          if (attendee.headline != null)
            Text(
              attendee.headline!,
              style: textTheme.bodySmall?.copyWith(
                color: cs.onSurfaceVariant,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
          if (attendee.matchScore > 0) ...[
            const SizedBox(height: 6),
            AIMatchBadge(
              matchScore: attendee.matchScore,
              compact: true,
            ),
          ],
        ],
      ),
    );
  }
}
