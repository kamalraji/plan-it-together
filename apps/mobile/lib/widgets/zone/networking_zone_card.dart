import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/nav.dart';
import '../../models/networking_models.dart';
import '../../models/impact_profile.dart';
import '../../supabase/networking_service.dart';
import '../../supabase/impact_service.dart';
import '../styled_avatar.dart';
import '../styled_button.dart';
import '../styled_card.dart';
import '../styled_text_field.dart';
import '../icebreaker_card.dart';
import '../match_insights_card.dart';
import 'smart_match_card.dart';
import 'schedule_meeting_sheet.dart';
import 'contact_exchange_sheet.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Zone card for networking events with smart matching, icebreakers, and meeting scheduler.
/// Uses the follower system for social actions.
class NetworkingZoneCard extends StatefulWidget {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'NetworkingZoneCard';

  final String eventId;
  final String? eventName;
  final DateTime? eventStartDate;
  final DateTime? eventEndDate;
  /// Called when user establishes a new follow relationship at the event
  final VoidCallback? onFollowEstablished;

  const NetworkingZoneCard({
    super.key,
    required this.eventId,
    this.eventName,
    this.eventStartDate,
    this.eventEndDate,
    this.onFollowEstablished,
  });

  @override
  State<NetworkingZoneCard> createState() => _NetworkingZoneCardState();
}

class _NetworkingZoneCardState extends State<NetworkingZoneCard> {
  static const String _tag = 'NetworkingZoneCard';
  static final _log = LoggingService.instance;
  
  final NetworkingService _service = NetworkingService();
  final ImpactService _impactService = ImpactService();

  bool _isLoading = true;
  List<SmartMatch> _smartMatches = [];
  EventIcebreaker? _activeIcebreaker;
  List<NetworkingMeeting> _pendingRequests = [];
  List<NetworkingMeeting> _upcomingMeetings = [];
  int _contactCount = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    try {
      // Use Zone-specific AI matching (event-scoped context)
      final results = await Future.wait([
        _service.getZoneMatches(widget.eventId, limit: 20),
        _service.getActiveIcebreaker(widget.eventId),
        _service.getPendingRequests(widget.eventId),
        _service.getUpcomingMeetings(widget.eventId),
        _service.getContactExchangeCount(widget.eventId),
      ]);

      if (mounted) {
        setState(() {
          _smartMatches = results[0] as List<SmartMatch>;
          _activeIcebreaker = results[1] as EventIcebreaker?;
          _pendingRequests = results[2] as List<NetworkingMeeting>;
          _upcomingMeetings = results[3] as List<NetworkingMeeting>;
          _contactCount = results[4] as int;
          _isLoading = false;
        });
        
        _log.debug(
          'Loaded ${_smartMatches.length} AI zone matches for event ${widget.eventId}',
          tag: _tag,
        );
      }
    } catch (e) {
      _log.debug('Error loading networking data: $e', tag: _tag);
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _openChat(ImpactProfile profile) {
    // Navigate to chat with this user - uses chatNew with extra params
    context.push(AppRoutes.chatNew, extra: {
      'dmUserId': profile.userId,
      'dmUserName': profile.fullName,
      'dmUserAvatar': profile.avatarUrl,
    });
  }

  void _showScheduleMeeting(ImpactProfile profile) {
    final now = DateTime.now();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ScheduleMeetingSheet(
        eventId: widget.eventId,
        targetProfile: profile,
        eventStartDate: widget.eventStartDate ?? now,
        eventEndDate: widget.eventEndDate ?? now.add(const Duration(days: 1)),
        onScheduled: _loadData,
      ),
    );
  }

  void _showContactExchange(ImpactProfile profile) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ContactExchangeSheet(
        eventId: widget.eventId,
        targetProfile: profile,
        onExchanged: _loadData,
      ),
    );
  }

  void _viewProfile(ImpactProfile profile) {
    context.push(AppRoutes.impactProfile(profile.userId));
  }

  Future<void> _respondToMeeting(String meetingId, bool accept) async {
    final success = await _service.respondToMeeting(meetingId, accept);
    if (success) {
      _loadData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(accept ? 'Meeting accepted!' : 'Meeting declined'),
            backgroundColor: accept ? Colors.green : Colors.orange,
          ),
        );
      }
    }
  }

  Future<void> _submitIcebreakerAnswer(String answer) async {
    if (_activeIcebreaker == null) return;

    final success = await _service.submitIcebreakerAnswer(
      _activeIcebreaker!.id,
      answer,
    );

    if (success) {
      _loadData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Answer submitted!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: CircularProgressIndicator(),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.people_alt,
                    color: theme.colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Networking Zone',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Connect with like-minded people',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Smart Matches Section
            _buildSmartMatchesSection(theme),

            const SizedBox(height: 24),

            // Active Icebreaker Section
            if (_activeIcebreaker != null) ...[
              _buildIcebreakerSection(theme),
              const SizedBox(height: 24),
            ],

            // Meetings Section
            _buildMeetingsSection(theme),

            const SizedBox(height: 24),

            // Contact Exchange Section
            _buildContactExchangeSection(theme),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildSmartMatchesSection(ThemeData theme) {
    // Calculate AI match stats
    final aiMatchCount = _smartMatches.where((m) => 
      m.embeddingSimilarity != null || m.commonSkills.isNotEmpty
    ).length;
    final hasAIMatches = aiMatchCount > 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(
                  Icons.auto_awesome,
                  size: 20,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  'AI-Powered Matches',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (hasAIMatches) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.green.withOpacity(0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.bolt, size: 10, color: Colors.green),
                        const SizedBox(width: 2),
                        Text(
                          'AI',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.green,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
            if (_smartMatches.isNotEmpty)
              TextButton(
                onPressed: () {
                  // Navigate to full matches list
                },
                child: const Text('See All'),
              ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          hasAIMatches 
            ? 'Matches based on skills, interests & event activity'
            : 'Matches based on profile similarity',
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.textTheme.bodySmall?.color?.withOpacity(0.6),
          ),
        ),
        const SizedBox(height: 12),
        if (_smartMatches.isEmpty)
          _buildEmptyState(
            theme,
            icon: Icons.people_outline,
            title: 'No matches yet',
            subtitle: 'Check in to see attendees who match your interests',
          )
        else
          SizedBox(
            height: 230, // Slightly taller for AI badges
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _smartMatches.length,
              itemBuilder: (context, index) {
                final match = _smartMatches[index];
                return SmartMatchCard(
                  match: match,
                  followsMe: match.followsYou,
                  onSayHi: () => _openChat(match.profile),
                  onScheduleMeeting: () => _showScheduleMeeting(match.profile),
                  onViewProfile: () => _viewProfile(match.profile),
                );
              },
            ),
          ),
      ],
    );
  }

  Widget _buildIcebreakerSection(ThemeData theme) {
    final icebreaker = _activeIcebreaker!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(
              Icons.lightbulb_outline,
              size: 20,
              color: Colors.amber,
            ),
            const SizedBox(width: 8),
            Text(
              'Icebreaker',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '${icebreaker.answerCount} answers',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: Colors.amber.shade700,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        StyledCard(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  icebreaker.question,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 12),
                if (icebreaker.myAnswer != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.check_circle,
                          size: 18,
                          color: theme.colorScheme.primary,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Your answer: ${icebreaker.myAnswer}',
                            style: theme.textTheme.bodyMedium,
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  _IcebreakerAnswerInput(
                    onSubmit: _submitIcebreakerAnswer,
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMeetingsSection(ThemeData theme) {
    final hasPending = _pendingRequests.isNotEmpty;
    final hasUpcoming = _upcomingMeetings.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(
              Icons.calendar_today,
              size: 20,
              color: theme.colorScheme.secondary,
            ),
            const SizedBox(width: 8),
            Text(
              'Meetings',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            if (hasPending) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.red,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${_pendingRequests.length} pending',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 12),

        // Pending requests
        if (hasPending) ...[
          Text(
            'Pending Requests',
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 8),
          ..._pendingRequests.map((meeting) => _buildMeetingCard(
                theme,
                meeting,
                isPending: true,
              )),
          const SizedBox(height: 16),
        ],

        // Upcoming meetings
        if (hasUpcoming) ...[
          Text(
            'Upcoming',
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 8),
          ..._upcomingMeetings.map((meeting) => _buildMeetingCard(
                theme,
                meeting,
                isPending: false,
              )),
        ],

        if (!hasPending && !hasUpcoming)
          _buildEmptyState(
            theme,
            icon: Icons.event_available,
            title: 'No meetings scheduled',
            subtitle: 'Schedule a meeting from Smart Matches',
          ),
      ],
    );
  }

  Widget _buildMeetingCard(
    ThemeData theme,
    NetworkingMeeting meeting, {
    required bool isPending,
  }) {
    return StyledCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            StyledAvatar(
              imageUrl: meeting.otherUserAvatar,
              name: meeting.otherUserName ?? 'User',
              size: 44,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    meeting.otherUserName ?? 'Unknown',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Row(
                    children: [
                      Icon(
                        Icons.access_time,
                        size: 14,
                        color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _formatMeetingTime(meeting.proposedTime),
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                        ),
                      ),
                      if (meeting.proposedLocation != null) ...[
                        const SizedBox(width: 8),
                        Icon(
                          Icons.location_on,
                          size: 14,
                          color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                        ),
                        const SizedBox(width: 2),
                        Text(
                          meeting.proposedLocation!,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            if (isPending) ...[
              IconButton(
                icon: const Icon(Icons.close, color: Colors.red),
                onPressed: () => _respondToMeeting(meeting.id, false),
                tooltip: 'Decline',
              ),
              IconButton(
                icon: const Icon(Icons.check, color: Colors.green),
                onPressed: () => _respondToMeeting(meeting.id, true),
                tooltip: 'Accept',
              ),
            ] else
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Confirmed',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.green,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactExchangeSection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(
                  Icons.contact_phone,
                  size: 20,
                  color: Colors.teal,
                ),
                const SizedBox(width: 8),
                Text(
                  'Contacts Collected',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.teal.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.people,
                    size: 16,
                    color: Colors.teal,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '$_contactCount',
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: Colors.teal,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        StyledCard(
          child: ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.teal.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.qr_code,
                color: Colors.teal,
              ),
            ),
            title: const Text('View All Contacts'),
            subtitle: Text(
              _contactCount > 0
                  ? 'Tap to see all exchanged contacts'
                  : 'Start networking to exchange contacts',
            ),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              // Navigate to contacts list
            },
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState(
    ThemeData theme, {
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.dividerColor),
      ),
      child: Column(
        children: [
          Icon(
            icon,
            size: 48,
            color: theme.disabledColor,
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  String _formatMeetingTime(DateTime time) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final meetingDate = DateTime(time.year, time.month, time.day);

    String dateStr;
    if (meetingDate == today) {
      dateStr = 'Today';
    } else if (meetingDate == today.add(const Duration(days: 1))) {
      dateStr = 'Tomorrow';
    } else {
      dateStr = '${time.day}/${time.month}';
    }

    final hour = time.hour > 12 ? time.hour - 12 : time.hour;
    final period = time.hour >= 12 ? 'PM' : 'AM';
    final minute = time.minute.toString().padLeft(2, '0');

    return '$dateStr at $hour:$minute $period';
  }
}

/// Input widget for icebreaker answers
class _IcebreakerAnswerInput extends StatefulWidget {
  final Function(String) onSubmit;

  const _IcebreakerAnswerInput({required this.onSubmit});

  @override
  State<_IcebreakerAnswerInput> createState() => _IcebreakerAnswerInputState();
}

class _IcebreakerAnswerInputState extends State<_IcebreakerAnswerInput> {
  final TextEditingController _controller = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submit() async {
    if (_controller.text.trim().isEmpty) return;

    setState(() => _isSubmitting = true);
    await widget.onSubmit(_controller.text.trim());
    setState(() => _isSubmitting = false);
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: StyledTextField(
            controller: _controller,
            hintText: 'Type your answer...',
            enabled: !_isSubmitting,
          ),
        ),
        const SizedBox(width: 8),
        IconButton(
          onPressed: _isSubmitting ? null : _submit,
          icon: _isSubmitting
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Icon(
                  Icons.send,
                  color: Theme.of(context).colorScheme.primary,
                ),
        ),
      ],
    );
  }
}
