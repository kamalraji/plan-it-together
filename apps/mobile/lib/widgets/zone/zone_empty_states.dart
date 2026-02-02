import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// Premium empty state widgets for Zone sections.
/// Provides consistent, engaging empty states with contextual CTAs.
class ZoneEmptyStates {
  ZoneEmptyStates._();

  /// Schedule section - no sessions today.
  static Widget noSessions({VoidCallback? onRefresh}) {
    return _ZoneEmptyState(
      icon: Icons.calendar_today_rounded,
      title: 'No Sessions Right Now',
      message: 'Check back later or browse the full schedule',
      actionLabel: onRefresh != null ? 'Refresh' : null,
      onAction: onRefresh,
      gradient: const [Color(0xFF667EEA), Color(0xFF764BA2)],
    );
  }

  /// Networking section - no attendees nearby.
  static Widget noAttendees({VoidCallback? onExplore}) {
    return _ZoneEmptyState(
      icon: Icons.people_outline_rounded,
      title: 'No One Nearby',
      message: 'Be the first to connect or try the icebreaker!',
      actionLabel: onExplore != null ? 'Try Icebreaker' : null,
      onAction: onExplore,
      gradient: const [Color(0xFF11998E), Color(0xFF38EF7D)],
    );
  }

  /// Polls section - no active polls.
  static Widget noPolls({VoidCallback? onRefresh}) {
    return _ZoneEmptyState(
      icon: Icons.poll_rounded,
      title: 'No Active Polls',
      message: 'Polls will appear here when organizers create them',
      actionLabel: onRefresh != null ? 'Refresh' : null,
      onAction: onRefresh,
      gradient: const [Color(0xFFFF512F), Color(0xFFF09819)],
    );
  }

  /// Q&A section - no questions yet.
  static Widget noQuestions({VoidCallback? onAsk}) {
    return _ZoneEmptyState(
      icon: Icons.question_answer_rounded,
      title: 'No Questions Yet',
      message: 'Be the first to ask the speaker a question!',
      actionLabel: onAsk != null ? 'Ask Question' : null,
      onAction: onAsk,
      gradient: const [Color(0xFF834D9B), Color(0xFFD04ED6)],
    );
  }

  /// Announcements section - no announcements.
  static Widget noAnnouncements() {
    return const _ZoneEmptyState(
      icon: Icons.campaign_rounded,
      title: 'No Announcements',
      message: 'Important updates will appear here',
      gradient: [Color(0xFF1A2980), Color(0xFF26D0CE)],
    );
  }

  /// Leaderboard section - empty leaderboard.
  static Widget emptyLeaderboard({VoidCallback? onEarnPoints}) {
    return _ZoneEmptyState(
      icon: Icons.leaderboard_rounded,
      title: 'Leaderboard Coming Soon',
      message: 'Earn points by participating to climb the ranks!',
      actionLabel: onEarnPoints != null ? 'Start Earning' : null,
      onAction: onEarnPoints,
      gradient: const [Color(0xFFFFD200), Color(0xFFF7971E)],
    );
  }

  /// Materials section - no materials uploaded.
  static Widget noMaterials() {
    return const _ZoneEmptyState(
      icon: Icons.folder_open_rounded,
      title: 'No Materials Yet',
      message: 'Session materials will be shared here',
      gradient: [Color(0xFF4776E6), Color(0xFF8E54E9)],
    );
  }

  /// Circles section - no circles for this event.
  static Widget noCircles({VoidCallback? onExplore}) {
    return _ZoneEmptyState(
      icon: Icons.groups_rounded,
      title: 'No Event Circles',
      message: 'Join or create circles to connect with attendees',
      actionLabel: onExplore != null ? 'Explore Circles' : null,
      onAction: onExplore,
      gradient: const [Color(0xFF00B4DB), Color(0xFF0083B0)],
    );
  }

  /// Sponsors section - no sponsors.
  static Widget noSponsors() {
    return const _ZoneEmptyState(
      icon: Icons.storefront_rounded,
      title: 'No Sponsor Booths',
      message: 'Sponsor booths will appear here during the event',
      gradient: [Color(0xFF56AB2F), Color(0xFFA8E063)],
    );
  }

  /// Challenges section - no active challenges.
  static Widget noChallenges({VoidCallback? onRefresh}) {
    return _ZoneEmptyState(
      icon: Icons.emoji_events_rounded,
      title: 'No Active Challenges',
      message: 'Check back for fun activities to earn points!',
      actionLabel: onRefresh != null ? 'Refresh' : null,
      onAction: onRefresh,
      gradient: const [Color(0xFFEB3349), Color(0xFFF45C43)],
    );
  }

  /// Icebreaker section - no icebreakers.
  static Widget noIcebreakers({VoidCallback? onRefresh}) {
    return _ZoneEmptyState(
      icon: Icons.ac_unit_rounded,
      title: 'No Icebreakers',
      message: 'Fun networking prompts will appear here',
      actionLabel: onRefresh != null ? 'Refresh' : null,
      onAction: onRefresh,
      gradient: const [Color(0xFF2193B0), Color(0xFF6DD5ED)],
    );
  }

  /// Activity feed - no recent activity.
  static Widget noActivity() {
    return const _ZoneEmptyState(
      icon: Icons.stream_rounded,
      title: 'No Recent Activity',
      message: 'Event activity will show up here in real-time',
      gradient: [Color(0xFF373B44), Color(0xFF4286F4)],
    );
  }

  /// Generic error state.
  static Widget error({String? message, VoidCallback? onRetry}) {
    return _ZoneEmptyState(
      icon: Icons.error_outline_rounded,
      title: 'Something Went Wrong',
      message: message ?? 'Please try again',
      actionLabel: onRetry != null ? 'Retry' : null,
      onAction: onRetry,
      gradient: const [Color(0xFFED213A), Color(0xFF93291E)],
      isError: true,
    );
  }

  /// Offline state.
  static Widget offline({VoidCallback? onRetry}) {
    return _ZoneEmptyState(
      icon: Icons.wifi_off_rounded,
      title: 'You\'re Offline',
      message: 'Check your connection and try again',
      actionLabel: onRetry != null ? 'Retry' : null,
      onAction: onRetry,
      gradient: const [Color(0xFF606C88), Color(0xFF3F4C6B)],
    );
  }
}

/// Internal empty state widget with premium styling.
class _ZoneEmptyState extends StatefulWidget {
  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;
  final List<Color> gradient;
  final bool isError;

  const _ZoneEmptyState({
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
    required this.gradient,
    this.isError = false,
  });

  @override
  State<_ZoneEmptyState> createState() => _ZoneEmptyStateState();
}

class _ZoneEmptyStateState extends State<_ZoneEmptyState>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.0, 0.6, curve: Curves.easeOut),
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.6, curve: Curves.easeOutBack),
      ),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.2, 0.8, curve: Curves.easeOut),
    ));

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: FadeTransition(
        opacity: _fadeAnimation,
        child: SlideTransition(
          position: _slideAnimation,
          child: ScaleTransition(
            scale: _scaleAnimation,
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Animated icon with gradient background
                  Container(
                    width: 88,
                    height: 88,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: widget.gradient.map((c) => c.withOpacity(0.15)).toList(),
                      ),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: widget.gradient.first.withOpacity(0.3),
                        width: 1.5,
                      ),
                    ),
                    child: ShaderMask(
                      shaderCallback: (bounds) => LinearGradient(
                        colors: widget.gradient,
                      ).createShader(bounds),
                      child: Icon(
                        widget.icon,
                        size: 40,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Title
                  Text(
                    widget.title,
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  
                  // Message
                  Text(
                    widget.message,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.6),
                    ),
                    textAlign: TextAlign.center,
                  ),
                  
                  // Action button
                  if (widget.actionLabel != null && widget.onAction != null) ...[
                    const SizedBox(height: 24),
                    _GradientActionButton(
                      label: widget.actionLabel!,
                      onPressed: widget.onAction!,
                      gradient: widget.gradient,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Gradient action button for empty states.
class _GradientActionButton extends StatefulWidget {
  final String label;
  final VoidCallback onPressed;
  final List<Color> gradient;

  const _GradientActionButton({
    required this.label,
    required this.onPressed,
    required this.gradient,
  });

  @override
  State<_GradientActionButton> createState() => _GradientActionButtonState();
}

class _GradientActionButtonState extends State<_GradientActionButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) => _controller.reverse(),
      onTapCancel: () => _controller.reverse(),
      onTap: widget.onPressed,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: widget.gradient),
            borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
            boxShadow: [
              BoxShadow(
                color: widget.gradient.first.withOpacity(0.3),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Text(
            widget.label,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }
}
