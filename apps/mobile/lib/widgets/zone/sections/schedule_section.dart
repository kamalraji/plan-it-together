import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:thittam1hub/models/zone_models.dart';
import 'package:thittam1hub/models/live_stream.dart';
import 'package:thittam1hub/services/zone_state_service.dart';
import 'package:thittam1hub/services/live_stream_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';
import 'package:thittam1hub/widgets/zone/error_retry_card.dart';
import 'package:thittam1hub/widgets/zone/stream_viewer_modal.dart';
import 'package:thittam1hub/widgets/zone/session_detail_sheet.dart';
import 'package:thittam1hub/widgets/zone/sections/zone_section_utils.dart';

/// Schedule section displaying live and upcoming sessions
class ScheduleSection extends StatelessWidget {
  final String eventId;
  final String? initialSessionId;

  const ScheduleSection({
    super.key,
    required this.eventId,
    this.initialSessionId,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Selector<ZoneStateService, ({bool loading, List<EventSession> live, List<EventSession> upcoming, String? error})>(
      selector: (_, s) => (
        loading: s.isLoadingSessions,
        live: s.liveSessions,
        upcoming: s.upcomingSessions,
        error: s.sessionsError,
      ),
      builder: (context, data, _) {
        if (data.loading) {
          return const ZoneSectionLoading();
        }

        if (data.error != null) {
          return ErrorRetryCard(
            message: data.error!,
            onRetry: () => context.read<ZoneStateService>().loadSessions(eventId),
          );
        }

        final allSessions = [...data.live, ...data.upcoming];
        if (allSessions.isEmpty) {
          return const ZoneSectionEmpty(
            icon: Icons.calendar_today_rounded,
            title: 'No Sessions Yet',
            subtitle: 'Sessions will appear here when scheduled',
          );
        }

        return BrandedRefreshIndicator(
          onRefresh: () => context.read<ZoneStateService>().loadSessions(eventId),
          child: ListView(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 16,
              bottom: context.bottomContentPadding,
            ),
            children: [
              // Live Sessions
              if (data.live.isNotEmpty) ...[
                ZoneSectionHeader(
                  title: 'Live Now',
                  icon: Icons.play_circle_rounded,
                  color: Colors.red,
                  count: data.live.length,
                ),
                const SizedBox(height: 8),
                ...data.live.map((s) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _SessionCard(
                    session: s,
                    isLive: true,
                    eventId: eventId,
                    initialSessionId: initialSessionId,
                  ),
                )),
                const SizedBox(height: 16),
              ],

              // Upcoming Sessions
              if (data.upcoming.isNotEmpty) ...[
                ZoneSectionHeader(
                  title: 'Coming Up',
                  icon: Icons.schedule_rounded,
                  color: cs.primary,
                  count: data.upcoming.length,
                ),
                const SizedBox(height: 8),
                ...data.upcoming.map((s) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _SessionCard(
                    session: s,
                    isLive: false,
                    eventId: eventId,
                    initialSessionId: initialSessionId,
                  ),
                )),
              ],
            ],
          ),
        );
      },
    );
  }
}

class _SessionCard extends StatefulWidget {
  final EventSession session;
  final bool isLive;
  final String eventId;
  final String? initialSessionId;

  const _SessionCard({
    required this.session,
    required this.isLive,
    required this.eventId,
    this.initialSessionId,
  });

  @override
  State<_SessionCard> createState() => _SessionCardState();
}

class _SessionCardState extends State<_SessionCard> {
  LiveStream? _stream;
  bool _loadingStream = false;
  bool _sheetShown = false;

  @override
  void initState() {
    super.initState();
    _loadStream();
    
    // Auto-open sheet if this session matches the deep-linked sessionId
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.initialSessionId == widget.session.id && !_sheetShown) {
        _sheetShown = true;
        _openSessionDetail();
      }
    });
  }

  Future<void> _loadStream() async {
    if (!mounted) return;
    setState(() => _loadingStream = true);

    final result = await LiveStreamService.instance
        .getStreamForSession(widget.session.id);

    if (!mounted) return;
    setState(() {
      _loadingStream = false;
      if (result.isSuccess) {
        _stream = result.dataOrNull;
      }
    });
  }

  void _openStreamViewer() {
    if (_stream == null) return;
    HapticFeedback.mediumImpact();
    StreamViewerModal.show(
      context,
      stream: _stream!,
      session: widget.session,
    );
  }

  void _openSessionDetail() {
    HapticFeedback.lightImpact();
    
    // Update URL with sessionId for shareability
    final currentUri = GoRouterState.of(context).uri;
    final newParams = Map<String, String>.from(currentUri.queryParameters);
    newParams['sessionId'] = widget.session.id;
    context.replace('${currentUri.path}?${Uri(queryParameters: newParams).query}');
    
    SessionDetailSheet.show(
      context,
      session: widget.session,
      eventId: widget.eventId,
      onClose: () {
        // Remove sessionId from URL when sheet closes
        final uri = GoRouterState.of(context).uri;
        final params = Map<String, String>.from(uri.queryParameters);
        params.remove('sessionId');
        final query = params.isEmpty ? '' : '?${Uri(queryParameters: params).query}';
        context.replace('${uri.path}$query');
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isLive = widget.isLive;
    final session = widget.session;

    final time = '${session.startTime.hour.toString().padLeft(2, '0')}:${session.startTime.minute.toString().padLeft(2, '0')}';

    final hasLiveStream = _stream != null && _stream!.isLive;
    final hasRecording = _stream != null && _stream!.canPlayRecording;

    return GestureDetector(
      onTap: _openSessionDetail,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: hasLiveStream
                ? Colors.red.withOpacity(0.4)
                : isLive
                    ? Colors.red.withOpacity(0.3)
                    : cs.outline.withOpacity(0.1),
            width: hasLiveStream ? 2 : isLive ? 2 : 1,
          ),
          boxShadow: [
            if (hasLiveStream)
              BoxShadow(
                color: Colors.red.withOpacity(0.15),
                blurRadius: 16,
                spreadRadius: 2,
              )
            else if (isLive)
              BoxShadow(
                color: Colors.red.withOpacity(0.1),
                blurRadius: 12,
              ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Time/Live Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: isLive ? Colors.red : cs.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (isLive) ...[
                        const PulsingDot(),
                        const SizedBox(width: 6),
                      ],
                      Text(
                        isLive ? 'LIVE' : time,
                        style: textTheme.labelMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: isLive ? Colors.white : cs.primary,
                        ),
                      ),
                    ],
                  ),
                ),

                // Streaming Badge
                if (hasLiveStream) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFFF0000), Color(0xFFCC0000)],
                      ),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.videocam_rounded,
                          size: 14,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'STREAMING',
                          style: textTheme.labelSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ] else if (hasRecording) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: cs.secondary.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.play_circle_outline_rounded,
                          size: 14,
                          color: cs.secondary,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'RECORDING',
                          style: textTheme.labelSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: cs.secondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                const Spacer(),

                // Room Badge
                if (session.room != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: cs.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.meeting_room_rounded,
                          size: 12,
                          color: cs.onSurfaceVariant,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          session.room!,
                          style: textTheme.labelSmall?.copyWith(
                            color: cs.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                
                // Tap hint chevron
                const SizedBox(width: 8),
                Icon(
                  Icons.chevron_right_rounded,
                  size: 20,
                  color: cs.onSurfaceVariant.withOpacity(0.5),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              session.title,
              style: textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            if (session.speakerName != null) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  Icon(
                    Icons.person_rounded,
                    size: 16,
                    color: cs.onSurfaceVariant,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      session.speakerName!,
                      style: textTheme.bodyMedium?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ],
            if (session.description != null) ...[
              const SizedBox(height: 8),
              Text(
                session.description!,
                style: textTheme.bodySmall?.copyWith(
                  color: cs.onSurfaceVariant,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],

            // Watch Live Button
            if (hasLiveStream || hasRecording) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: _openStreamViewer,
                  style: FilledButton.styleFrom(
                    backgroundColor: hasLiveStream ? Colors.red : cs.secondary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  icon: Icon(
                    hasLiveStream ? Icons.live_tv_rounded : Icons.play_arrow_rounded,
                    size: 20,
                  ),
                  label: Text(
                    hasLiveStream ? 'Watch Live' : 'Watch Recording',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
