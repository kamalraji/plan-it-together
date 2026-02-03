import 'package:flutter/material.dart';
import '../../models/conference_models.dart';
import '../../models/zone_models.dart';
import '../../supabase/conference_service.dart';
import '../../supabase/zone_service.dart';
import '../styled_card.dart';
import '../styled_chip.dart';

import 'package:thittam1hub/services/logging_service.dart';
/// Conference-specific Zone card with multi-track schedule and sponsor booths
class ConferenceZoneCard extends StatefulWidget {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'ConferenceZoneCard';

  final String eventId;
  final VoidCallback? onBoothVisited;

  const ConferenceZoneCard({
    super.key,
    required this.eventId,
    this.onBoothVisited,
  });

  @override
  State<ConferenceZoneCard> createState() => _ConferenceZoneCardState();
}

class _ConferenceZoneCardState extends State<ConferenceZoneCard> {
  static const String _tag = 'ConferenceZoneCard';
  static final _log = LoggingService.instance;
  
  final ConferenceService _conferenceService = ConferenceService.instance;
  final ZoneService _zoneService = ZoneService.instance;

  bool _isLoading = true;
  List<EventTrack> _tracks = [];
  Map<String, List<EventSession>> _sessionsByTrack = {};
  List<SponsorBooth> _sponsorBooths = [];
  String? _selectedTrackId;
  int _visitedBoothsCount = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _conferenceService.getEventTracks(widget.eventId),
        _conferenceService.getSponsorBooths(widget.eventId),
        _zoneService.getUpcomingSessions(widget.eventId),
        _conferenceService.getUserVisitedBoothsCount(widget.eventId),
      ]);

      _tracks = results[0] as List<EventTrack>;
      _sponsorBooths = results[1] as List<SponsorBooth>;
      final sessions = results[2] as List<EventSession>;
      _visitedBoothsCount = results[3] as int;

      // Group sessions by track
      _sessionsByTrack = {};
      for (final session in sessions) {
        final trackId = session.trackId ?? 'main';
        _sessionsByTrack.putIfAbsent(trackId, () => []).add(session);
      }

      if (_tracks.isNotEmpty && _selectedTrackId == null) {
        _selectedTrackId = _tracks.first.id;
      }
    } catch (e) {
      _log.error('Error loading conference data: $e', tag: _tag);
    }
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (_isLoading) {
      return const StyledCard(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(32),
            child: CircularProgressIndicator(),
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Multi-Track Schedule
        if (_tracks.isNotEmpty) _buildMultiTrackSchedule(cs),

        if (_tracks.isNotEmpty) const SizedBox(height: 16),

        // Sponsor Booths
        if (_sponsorBooths.isNotEmpty) _buildSponsorBooths(cs),
      ],
    );
  }

  Widget _buildMultiTrackSchedule(ColorScheme cs) {
    return StyledCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: cs.primary.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.view_timeline_rounded, color: cs.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Multi-Track Schedule',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      '${_tracks.length} tracks available',
                      style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Track Tabs
          SizedBox(
            height: 40,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _tracks.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final track = _tracks[index];
                final isSelected = track.id == _selectedTrackId;
                final trackColor = _parseColor(track.color);

                return GestureDetector(
                  onTap: () => setState(() => _selectedTrackId = track.id),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? trackColor.withOpacity(0.2)
                          : cs.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isSelected ? trackColor : Colors.transparent,
                        width: 2,
                      ),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      track.name,
                      style: TextStyle(
                        color: isSelected ? trackColor : cs.onSurfaceVariant,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 16),

          // Sessions for selected track
          if (_selectedTrackId != null)
            ..._buildTrackSessions(cs),
        ],
      ),
    );
  }

  List<Widget> _buildTrackSessions(ColorScheme cs) {
    final sessions = _sessionsByTrack[_selectedTrackId] ?? [];
    final track = _tracks.firstWhere(
      (t) => t.id == _selectedTrackId,
      orElse: () => _tracks.first,
    );
    final trackColor = _parseColor(track.color);

    if (sessions.isEmpty) {
      return [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: cs.surfaceContainerHighest.withOpacity(0.5),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              Icon(Icons.event_busy, size: 40, color: cs.onSurfaceVariant),
              const SizedBox(height: 8),
              Text(
                'No upcoming sessions',
                style: TextStyle(color: cs.onSurfaceVariant),
              ),
            ],
          ),
        ),
      ];
    }

    return sessions.take(3).map((session) {
      final isLive = session.isLive;
      
      return Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isLive
              ? trackColor.withOpacity(0.1)
              : cs.surfaceContainerHighest.withOpacity(0.5),
          borderRadius: BorderRadius.circular(12),
          border: isLive
              ? Border.all(color: trackColor.withOpacity(0.5))
              : null,
        ),
        child: Row(
          children: [
            Container(
              width: 4,
              height: 50,
              decoration: BoxDecoration(
                color: trackColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      if (isLive)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          margin: const EdgeInsets.only(right: 8),
                          decoration: BoxDecoration(
                            color: Colors.red,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'LIVE',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      Expanded(
                        child: Text(
                          session.title,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.access_time,
                          size: 14, color: cs.onSurfaceVariant),
                      const SizedBox(width: 4),
                      Text(
                        '${session.startTime.hour}:${session.startTime.minute.toString().padLeft(2, '0')}',
                        style: TextStyle(
                          color: cs.onSurfaceVariant,
                          fontSize: 12,
                        ),
                      ),
                      if (session.speakerName != null) ...[
                        const SizedBox(width: 12),
                        Icon(Icons.person, size: 14, color: cs.onSurfaceVariant),
                        const SizedBox(width: 4),
                        Text(
                          session.speakerName!,
                          style: TextStyle(
                            color: cs.onSurfaceVariant,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            if (session.location != null)
              StyledChip(
                label: session.location!,
                size: ChipSize.small,
                variant: ChipVariant.secondary,
              ),
          ],
        ),
      );
    }).toList();
  }

  Widget _buildSponsorBooths(ColorScheme cs) {
    final totalBooths = _sponsorBooths.length;
    final progress = totalBooths > 0 ? _visitedBoothsCount / totalBooths : 0.0;

    return StyledCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.amber.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.storefront_rounded, color: Colors.amber),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Sponsor Hall',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      '$_visitedBoothsCount/$totalBooths booths visited',
                      style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
                    ),
                  ],
                ),
              ),
              if (progress > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.amber.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${(progress * 100).toInt()}%',
                    style: const TextStyle(
                      color: Colors.amber,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),

          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 6,
              backgroundColor: cs.surfaceContainerHighest,
              valueColor: const AlwaysStoppedAnimation(Colors.amber),
            ),
          ),
          const SizedBox(height: 16),

          // Booth grid
          SizedBox(
            height: 120,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _sponsorBooths.take(6).length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final booth = _sponsorBooths[index];
                return _buildBoothCard(booth, cs);
              },
            ),
          ),

          if (_sponsorBooths.length > 6) ...[
            const SizedBox(height: 12),
            Center(
              child: TextButton(
                onPressed: () {
                  // Navigate to full sponsor hall
                },
                child: Text(
                  'View all ${_sponsorBooths.length} sponsors',
                  style: TextStyle(color: cs.primary),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildBoothCard(SponsorBooth booth, ColorScheme cs) {
    final tierColor = _getTierColor(booth.tier);

    return GestureDetector(
      onTap: () => _showBoothDetails(booth),
      child: Container(
        width: 100,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: booth.hasVisited
              ? tierColor.withOpacity(0.1)
              : cs.surfaceContainerHighest.withOpacity(0.5),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: booth.hasVisited
                ? tierColor.withOpacity(0.5)
                : cs.outline.withOpacity(0.2),
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (booth.sponsorLogo != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  booth.sponsorLogo!,
                  width: 50,
                  height: 50,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: tierColor.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(Icons.business, color: tierColor),
                  ),
                ),
              )
            else
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: tierColor.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Icons.business, color: tierColor),
              ),
            const SizedBox(height: 8),
            Text(
              booth.sponsorName,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 11,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: tierColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                booth.tierDisplayName,
                style: TextStyle(
                  color: tierColor,
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            if (booth.hasVisited)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Icon(Icons.check_circle, size: 16, color: Colors.green),
              ),
          ],
        ),
      ),
    );
  }

  void _showBoothDetails(SponsorBooth booth) {
    final cs = Theme.of(context).colorScheme;
    final tierColor = _getTierColor(booth.tier);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: cs.outline.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      if (booth.sponsorLogo != null)
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.network(
                            booth.sponsorLogo!,
                            width: 60,
                            height: 60,
                            fit: BoxFit.contain,
                          ),
                        )
                      else
                        Container(
                          width: 60,
                          height: 60,
                          decoration: BoxDecoration(
                            color: tierColor.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(Icons.business, color: tierColor, size: 32),
                        ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              booth.sponsorName,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 20,
                              ),
                            ),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: tierColor.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    booth.tierDisplayName,
                                    style: TextStyle(
                                      color: tierColor,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                if (booth.boothNumber != null) ...[
                                  const SizedBox(width: 8),
                                  Text(
                                    'Booth ${booth.boothNumber}',
                                    style: TextStyle(
                                      color: cs.onSurfaceVariant,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (booth.description != null) ...[
                    const SizedBox(height: 16),
                    Text(
                      booth.description!,
                      style: TextStyle(color: cs.onSurfaceVariant),
                    ),
                  ],
                  if (booth.offerings.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    const Text(
                      'What they offer:',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: booth.offerings
                          .map((o) => StyledChip(
                                label: o,
                                variant: ChipVariant.secondary,
                              ))
                          .toList(),
                    ),
                  ],
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: () async {
                            await _conferenceService.visitBooth(booth.id);
                            Navigator.pop(context);
                            _loadData();
                            widget.onBoothVisited?.call();
                          },
                          icon: Icon(booth.hasVisited
                              ? Icons.check
                              : Icons.qr_code_scanner),
                          label: Text(booth.hasVisited ? 'Visited' : 'Check In'),
                        ),
                      ),
                      if (booth.website != null) ...[
                        const SizedBox(width: 12),
                        IconButton.filled(
                          onPressed: () {
                            // Open website
                          },
                          icon: const Icon(Icons.language),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            SizedBox(height: MediaQuery.of(context).padding.bottom + 16),
          ],
        ),
      ),
    );
  }

  Color _parseColor(String hexColor) {
    try {
      return Color(int.parse(hexColor.replaceFirst('#', '0xFF')));
    } catch (_) {
      return Colors.indigo;
    }
  }

  Color _getTierColor(String tier) {
    switch (tier) {
      case 'platinum': return Colors.blueGrey;
      case 'gold': return Colors.amber;
      case 'silver': return Colors.grey;
      case 'bronze': return Colors.brown;
      case 'partner': return Colors.teal;
      default: return Colors.grey;
    }
  }
}
