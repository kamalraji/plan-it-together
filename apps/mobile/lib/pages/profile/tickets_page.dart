import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:thittam1hub/models/user_ticket.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/services/ticket_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/utils/animations.dart';
import 'package:thittam1hub/utils/hero_animations.dart';
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';
import 'package:thittam1hub/widgets/ticket/countdown_timer.dart';

import 'package:thittam1hub/services/logging_service.dart';
/// My Tickets page - Shows all user's event tickets
/// 
/// Supports deep linking via `?tab=` query parameter.
/// Valid tabs: upcoming, past, all
class TicketsPage extends StatefulWidget {
  /// Tab name for deep linking (e.g., 'upcoming', 'past')
  final String? initialTab;

  const TicketsPage({super.key, this.initialTab});

  @override
  State<TicketsPage> createState() => _TicketsPageState();
}

class _TicketsPageState extends State<TicketsPage>
    with SingleTickerProviderStateMixin {
  // Logging
  static final _log = LoggingService.instance;
  static const String _tag = 'TicketsPage';
  
  final _ticketService = TicketService();
  
  /// Tab name to index mapping
  static const _tabNames = ['upcoming', 'past', 'all'];
  
  List<UserTicket> _allTickets = [];
  String _activeFilter = 'upcoming';
  bool _isLoading = true;
  late TabController _tabController;

  /// Converts tab name to index, defaults to 0 (upcoming)
  int _getInitialTabIndex() {
    if (widget.initialTab != null) {
      final index = _tabNames.indexOf(widget.initialTab!.toLowerCase());
      return index >= 0 ? index : 0;
    }
    return 0;
  }

  /// Syncs current tab state to URL
  void _syncUrlState() {
    if (!mounted) return;
    final tabName = _tabNames[_tabController.index];
    context.replace(AppRoutes.ticketsWithTab(tabName));
  }

  @override
  void initState() {
    super.initState();
    final initialIndex = _getInitialTabIndex();
    _activeFilter = _tabNames[initialIndex];
    _tabController = TabController(length: 3, vsync: this, initialIndex: initialIndex);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {
          _activeFilter = _tabNames[_tabController.index];
        });
        _syncUrlState();
      }
    });
    _loadTickets();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadTickets() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return;

    setState(() => _isLoading = true);

    try {
      final tickets = await _ticketService.getUserTickets(userId);
      if (mounted) {
        setState(() {
          _allTickets = tickets;
          _isLoading = false;
        });
      }
    } catch (e) {
      _log.error('Failed to load tickets: $e', tag: _tag);
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<UserTicket> get _filteredTickets {
    switch (_activeFilter) {
      case 'upcoming':
        return _allTickets
            .where((t) => t.isUpcoming || t.isOngoing)
            .toList()
          ..sort((a, b) => a.startDate.compareTo(b.startDate));
      case 'past':
        return _allTickets.where((t) => t.isPast).toList()
          ..sort((a, b) => b.startDate.compareTo(a.startDate));
      default:
        return _allTickets;
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Tickets'),
        bottom: TabBar(
          controller: _tabController,
          indicatorSize: TabBarIndicatorSize.label,
          tabs: [
            Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.upcoming, size: 18),
                  const SizedBox(width: 6),
                  Text('Upcoming (${_allTickets.where((t) => t.isUpcoming || t.isOngoing).length})'),
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.history, size: 18),
                  const SizedBox(width: 6),
                  Text('Past (${_allTickets.where((t) => t.isPast).length})'),
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.list, size: 18),
                  const SizedBox(width: 6),
                  Text('All (${_allTickets.length})'),
                ],
              ),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? ListView.builder(
              padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding, vertical: AppSpacing.md),
              itemCount: 4,
              itemBuilder: (context, index) => FadeSlideTransition(
                delay: staggerDelay(index),
                child: const TicketCardSkeleton(),
              ),
            )
          : _filteredTickets.isEmpty
              ? _buildEmptyState(cs)
              : BrandedRefreshIndicator(
                  onRefresh: _loadTickets,
                  child: ListView.builder(
                    padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding, vertical: AppSpacing.md),
                    itemCount: _filteredTickets.length,
                    itemBuilder: (context, index) {
                      final ticket = _filteredTickets[index];
                      return FadeSlideTransition(
                        delay: staggerDelay(index),
                        child: _TicketCard(
                          ticket: ticket,
                          onTap: () => context.push(
                            '/profile/tickets/${ticket.registrationId}',
                            extra: ticket,
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  Widget _buildEmptyState(ColorScheme cs) {
    final message = _activeFilter == 'upcoming'
        ? 'No upcoming events'
        : _activeFilter == 'past'
            ? 'No past events yet'
            : 'No tickets found';
    final subtitle = _activeFilter == 'upcoming'
        ? 'Register for events to see your tickets here'
        : _activeFilter == 'past'
            ? 'Attended events will appear here'
            : 'Browse events and register to get started';

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: cs.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.confirmation_number_outlined,
                size: 64,
                color: cs.primary,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              message,
              style: context.textStyles.titleLarge?.bold,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              subtitle,
              style: context.textStyles.bodyMedium?.withColor(cs.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.xl),
            FilledButton.icon(
              onPressed: () => context.go(AppRoutes.discover),
              icon: const Icon(Icons.explore),
              label: const Text('Explore Events'),
            ),
          ],
        ),
      ),
    );
  }
}

/// Bold Minimalism Ticket Card - Two-part horizontal layout
/// Left: QR Code Stub | Right: Event Details
/// Enhanced with industry best practices: countdown, accessibility, animations
class _TicketCard extends StatefulWidget {
  final UserTicket ticket;
  final VoidCallback onTap;

  const _TicketCard({
    required this.ticket,
    required this.onTap,
  });

  @override
  State<_TicketCard> createState() => _TicketCardState();
}

class _TicketCardState extends State<_TicketCard> with SingleTickerProviderStateMixin {
  bool _isPressed = false;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    // Pulse animation for live/ongoing events
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.02).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    
    if (widget.ticket.isOngoing) {
      _pulseController.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  // Ticket stub accent color based on tier
  Color _getStubColor(UserTicket ticket) {
    final tierName = ticket.tierName.toLowerCase();
    if (tierName.contains('vip') || tierName.contains('premium')) {
      return const Color(0xFFE53935); // Bold red for VIP
    } else if (tierName.contains('early') || tierName.contains('special')) {
      return const Color(0xFF7B1FA2); // Purple for early bird
    } else if (tierName.contains('student') || tierName.contains('free')) {
      return const Color(0xFF1976D2); // Blue for student/free
    }
    return const Color(0xFFE91E63); // Pink default (like reference)
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final ticket = widget.ticket;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final stubColor = _getStubColor(ticket);

    return Semantics(
      label: '${ticket.eventName} ticket, ${ticket.tierName}, ${ticket.isOngoing ? "happening now" : ticket.isUpcoming ? "upcoming" : "past event"}',
      button: true,
      child: GestureDetector(
        onTapDown: (_) => setState(() => _isPressed = true),
        onTapUp: (_) {
          setState(() => _isPressed = false);
          HapticFeedback.lightImpact();
          widget.onTap();
        },
        onTapCancel: () => setState(() => _isPressed = false),
        child: AnimatedBuilder(
          animation: _pulseAnimation,
          builder: (context, child) => AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            transform: Matrix4.identity()
              ..scale(_isPressed ? 0.98 : (ticket.isOngoing ? _pulseAnimation.value : 1.0)),
            margin: const EdgeInsets.only(bottom: AppSpacing.md),
            child: child,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Countdown timer for upcoming events
              if (ticket.isUpcoming && ticket.timeUntilStart.inDays <= 7)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                  child: CountdownTimer(
                    targetDate: ticket.startDate,
                    compact: true,
                  ),
                ),
              // Live indicator for ongoing events
              if (ticket.isOngoing)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                  child: _buildLiveIndicator(cs),
                ),
              Hero(
                tag: HeroConfig.ticketCardTag(ticket.registrationId),
                child: Container(
                  height: 160,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                    boxShadow: [
                      BoxShadow(
                        color: (ticket.isOngoing ? stubColor : Colors.black)
                            .withValues(alpha: isDark ? 0.4 : 0.15),
                        blurRadius: ticket.isOngoing ? 25 : 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                    child: Row(
                      children: [
                        // Left QR Stub Section
                        _buildQrStub(context, ticket, stubColor, isDark),

                        // Vertical Perforated Divider
                        _buildVerticalDivider(isDark, stubColor),

                        // Right Event Details Section
                        Expanded(
                          child: _buildEventDetails(context, cs, ticket, isDark),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLiveIndicator(ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.success.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(100),
        border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: AppColors.success,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppColors.success.withValues(alpha: 0.5),
                  blurRadius: 4,
                  spreadRadius: 1,
                ),
              ],
            ),
          ),
          const SizedBox(width: 6),
          Text(
            'HAPPENING NOW',
            style: context.textStyles.labelSmall?.copyWith(
              color: AppColors.success,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }

  /// Left stub with QR code - Bold colored section
  Widget _buildQrStub(BuildContext context, UserTicket ticket, Color stubColor, bool isDark) {
    return Container(
      width: 120,
      decoration: BoxDecoration(
        color: stubColor,
      ),
      child: Stack(
        children: [
          // Subtle pattern overlay
          Positioned.fill(
            child: Opacity(
              opacity: 0.1,
              child: CustomPaint(
                painter: _DiagonalPatternPainter(),
              ),
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(AppSpacing.sm),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Tier badge at top
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.25),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    ticket.tierName.toUpperCase(),
                    style: context.textStyles.labelSmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 9,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),

                // QR Code
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: QrImageView(
                    data: ticket.ticketQrCode,
                    version: QrVersions.auto,
                    size: 72,
                    backgroundColor: Colors.white,
                    eyeStyle: const QrEyeStyle(
                      eyeShape: QrEyeShape.square,
                      color: Colors.black,
                    ),
                    dataModuleStyle: const QrDataModuleStyle(
                      dataModuleShape: QrDataModuleShape.square,
                      color: Colors.black,
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),

                // Ticket ID
                Text(
                  'ID ${ticket.registrationId.substring(0, 6).toUpperCase()}',
                  style: context.textStyles.labelSmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.9),
                    fontSize: 8,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Vertical perforated divider with circular notches
  Widget _buildVerticalDivider(bool isDark, Color stubColor) {
    return SizedBox(
      width: 20,
      child: Stack(
        children: [
          // Background split - left colored, right dark
          Row(
            children: [
              Expanded(child: Container(color: stubColor)),
              Expanded(
                child: Container(
                  color: isDark ? const Color(0xFF1A1A2E) : const Color(0xFF1F1F3D),
                ),
              ),
            ],
          ),
          // Top notch
          Positioned(
            top: -10,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF121212) : Colors.grey[200],
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),
          // Bottom notch
          Positioned(
            bottom: -10,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF121212) : Colors.grey[200],
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),
          // Dashed vertical line
          Positioned.fill(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  12,
                  (i) => Container(
                    width: 2,
                    height: 6,
                    margin: const EdgeInsets.symmetric(vertical: 2),
                    color: Colors.white.withValues(alpha: i.isEven ? 0.3 : 0.0),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Right section with event details - Dark with gradient
  Widget _buildEventDetails(BuildContext context, ColorScheme cs, UserTicket ticket, bool isDark) {
    final timeFormat = DateFormat('HH:mm');
    final dateFormat = DateFormat('dd.MM');
    
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            isDark ? const Color(0xFF1A1A2E) : const Color(0xFF1F1F3D),
            isDark ? const Color(0xFF16213E) : const Color(0xFF2D2D5A),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Stack(
        children: [
          // Banner image overlay (subtle)
          if (ticket.bannerUrl != null)
            Positioned.fill(
              child: Opacity(
                opacity: 0.15,
                child: Image.network(
                  ticket.bannerUrl!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                ),
              ),
            ),
          // Bokeh effect overlay
          Positioned.fill(
            child: CustomPaint(
              painter: _BokehPainter(cs.primary.withValues(alpha: 0.3)),
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Organization name (small)
                Text(
                  ticket.organizationName.toUpperCase(),
                  style: context.textStyles.labelSmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.6),
                    letterSpacing: 1,
                    fontSize: 9,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),

                // Event name (bold)
                Expanded(
                  child: Text(
                    ticket.eventName.toUpperCase(),
                    style: context.textStyles.titleMedium?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                      height: 1.1,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),

                // Date, Time, Location row
                Row(
                  children: [
                    // Date
                    _DetailBox(
                      label: dateFormat.format(ticket.startDate),
                      sublabel: DateFormat('yyyy').format(ticket.startDate),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    // Time
                    _DetailBox(
                      label: timeFormat.format(ticket.startDate),
                      sublabel: ticket.endDate != null
                          ? timeFormat.format(ticket.endDate!)
                          : ticket.modeLabel,
                    ),
                    const Spacer(),
                    // Status indicator
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: ticket.statusColor.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                          color: ticket.statusColor.withValues(alpha: 0.5),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: ticket.statusColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            ticket.statusLabel.toUpperCase(),
                            style: context.textStyles.labelSmall?.copyWith(
                              color: ticket.statusColor,
                              fontWeight: FontWeight.bold,
                              fontSize: 9,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Detail box for date/time display
class _DetailBox extends StatelessWidget {
  final String label;
  final String sublabel;

  const _DetailBox({required this.label, required this.sublabel});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: context.textStyles.labelMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            sublabel,
            style: context.textStyles.labelSmall?.copyWith(
              color: Colors.white.withValues(alpha: 0.6),
              fontSize: 9,
            ),
          ),
        ],
      ),
    );
  }
}

/// Diagonal pattern painter for stub background
class _DiagonalPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..strokeWidth = 1;

    for (double i = -size.height; i < size.width + size.height; i += 8) {
      canvas.drawLine(
        Offset(i, 0),
        Offset(i + size.height, size.height),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Bokeh effect painter for event details background
class _BokehPainter extends CustomPainter {
  final Color color;

  _BokehPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    
    // Draw a few subtle circles
    canvas.drawCircle(Offset(size.width * 0.8, size.height * 0.3), 30, paint);
    canvas.drawCircle(Offset(size.width * 0.9, size.height * 0.7), 20, paint);
    canvas.drawCircle(Offset(size.width * 0.6, size.height * 0.9), 15, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Status badge widget
class _StatusBadge extends StatelessWidget {
  final UserTicket ticket;

  const _StatusBadge({required this.ticket});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: ticket.statusColor.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(100),
        border: Border.all(
          color: ticket.statusColor.withValues(alpha: 0.4),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: ticket.statusColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            ticket.statusLabel,
            style: context.textStyles.labelSmall?.copyWith(
              color: ticket.statusColor,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

/// Icon with label widget
class _IconLabel extends StatelessWidget {
  final IconData icon;
  final String label;

  const _IconLabel({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: cs.onSurfaceVariant),
        const SizedBox(width: 4),
        Text(
          label,
          style: context.textStyles.labelSmall?.withColor(cs.onSurfaceVariant),
        ),
      ],
    );
  }
}

/// Ticket card skeleton - Matches bold minimalism horizontal layout
class TicketCardSkeleton extends StatelessWidget {
  const TicketCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      height: 160,
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: Row(
          children: [
            // Left QR stub skeleton
            Container(
              width: 120,
              color: isDark ? Colors.grey[800] : Colors.grey[300],
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ShimmerLoading(
                    child: ShimmerPlaceholder(
                      width: 60,
                      height: 16,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  ShimmerLoading(
                    child: ShimmerPlaceholder(
                      width: 72,
                      height: 72,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  ShimmerLoading(
                    child: ShimmerPlaceholder(
                      width: 50,
                      height: 10,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ],
              ),
            ),
            // Right details skeleton
            Expanded(
              child: Container(
                color: isDark ? Colors.grey[900] : Colors.grey[400],
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ShimmerLoading(
                        child: ShimmerPlaceholder(
                          width: 100,
                          height: 10,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    const SizedBox(height: AppSpacing.sm),
                    ShimmerLoading(
                        child: ShimmerPlaceholder(
                          width: double.infinity,
                          height: 24,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    const SizedBox(height: 4),
                    ShimmerLoading(
                        child: ShimmerPlaceholder(
                          width: 150,
                          height: 20,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    const Spacer(),
                    Row(
                      children: [
                        ShimmerLoading(
                            child: ShimmerPlaceholder(
                              width: 50,
                              height: 32,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        const SizedBox(width: AppSpacing.sm),
                        ShimmerLoading(
                            child: ShimmerPlaceholder(
                              width: 50,
                              height: 32,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        const Spacer(),
                        ShimmerLoading(
                            child: ShimmerPlaceholder(
                              width: 70,
                              height: 24,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
