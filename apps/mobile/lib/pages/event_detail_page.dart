/// Event detail page displaying full event information.
/// 
/// Features:
/// - Hero banner with animated header
/// - Ticket tier selection and registration flow
/// - Organizer information and social proof
/// - FAQ accordion section
/// 
/// Uses [EventDetailPageController] for state management.
/// Deep-linkable via `/events/{eventId}`.
library event_detail_page;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/services/registration_flow_service.dart';
import 'package:thittam1hub/utils/hero_animations.dart';
import 'package:thittam1hub/utils/icon_mappings.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/widgets/registration/registration_widgets.dart';
import 'package:thittam1hub/widgets/ticket/countdown_timer.dart';
import 'package:thittam1hub/widgets/event/event_widgets.dart';
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';
import 'package:thittam1hub/pages/event_detail_page_controller.dart';

// Extracted widgets
import 'event/widgets/event_detail_widgets.dart';

class EventDetailPage extends StatefulWidget {
  final String eventId;
  final Event? event;
  
  const EventDetailPage({
    super.key,
    required this.eventId,
    this.event,
  });

  @override
  State<EventDetailPage> createState() => _EventDetailPageState();
}

// Keyboard navigation intents
class _SaveIntent extends Intent { const _SaveIntent(); }
class _RegisterIntent extends Intent { const _RegisterIntent(); }
class _BackIntent extends Intent { const _BackIntent(); }

class _EventDetailPageState extends State<EventDetailPage> with SingleTickerProviderStateMixin {
  late final EventDetailPageController _controller;
  late AnimationController _animationController;
  late List<Animation<double>> _fadeAnimations;
  late FocusNode _pageFocusNode;

  @override
  void initState() {
    super.initState();
    _pageFocusNode = FocusNode();
    _controller = EventDetailPageController(
      eventId: widget.eventId,
      initialEvent: widget.event,
    );
    _controller.addListener(_onControllerChanged);
    
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _fadeAnimations = List.generate(
      6,
      (index) => Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(
          parent: _animationController,
          curve: Interval(index * 0.1, 0.4 + index * 0.1, curve: Curves.easeOut),
        ),
      ),
    );

    if (widget.event != null) _animationController.forward();
    
    _controller.initialize().then((_) {
      if (mounted && !_animationController.isCompleted) {
        _animationController.forward();
      }
    });
  }
  
  void _onControllerChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _pageFocusNode.dispose();
    _controller.removeListener(_onControllerChanged);
    _controller.dispose();
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _toggleSave() async {
    final result = await _controller.toggleSave();
    if (!mounted) return;
    
    switch (result) {
      case SaveToggleSuccess(:final isSaved):
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isSaved ? 'Event saved' : 'Event removed from saved'),
            backgroundColor: isSaved ? AppColors.success : null,
          ),
        );
      case SaveToggleFailed(:final currentState):
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to ${currentState ? 'unsave' : 'save'} event'),
            backgroundColor: AppColors.error,
          ),
        );
      case SaveToggleBusy():
        break;
    }
  }

  void _openRegistrationFlow({TicketTier? preselectedTier}) {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please sign in to register')),
      );
      context.push(AppRoutes.signIn);
      return;
    }

    final event = _controller.event;
    if (event == null) return;

    if (_controller.tiers.isEmpty) {
      HapticFeedback.lightImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.info_outline, color: Colors.white),
              SizedBox(width: 12),
              Expanded(child: Text('Registration is not yet available for this event')),
            ],
          ),
          backgroundColor: Colors.orange.shade700,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          margin: const EdgeInsets.all(16),
        ),
      );
      return;
    }

    final flowService = RegistrationFlowService();
    int currentStep = 0;
    final userName = user.userMetadata?['full_name'] as String? ?? user.userMetadata?['name'] as String? ?? '';
    final userEmail = user.email ?? '';
    final userPhone = user.phone;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setSheetState) => DraggableScrollableSheet(
          initialChildSize: 0.9,
          minChildSize: 0.5,
          maxChildSize: 0.95,
          builder: (context, scrollController) {
            switch (currentStep) {
              case 0:
                return TicketSelectionSheet(
                  event: event,
                  tiers: _controller.tiers,
                  preselectedTier: preselectedTier,
                  flowService: flowService,
                  onContinue: () => setSheetState(() => currentStep = 1),
                );
              case 1:
                return RegistrationFormSheet(
                  event: event,
                  flowService: flowService,
                  userName: userName,
                  userEmail: userEmail,
                  userPhone: userPhone,
                  onBack: () => setSheetState(() => currentStep = 0),
                  onContinue: () => setSheetState(() => currentStep = 2),
                );
              case 2:
                return OrderSummarySheet(
                  event: event,
                  flowService: flowService,
                  onBack: () => setSheetState(() => currentStep = 1),
                  onConfirm: () async {
                    final result = await flowService.submitRegistration(
                      eventId: event.id,
                      userId: user.id,
                      userName: flowService.formResponses['name'] as String? ?? userName,
                      userEmail: flowService.formResponses['email'] as String? ?? userEmail,
                    );
                    if (result.isSuccess && result.registration != null) {
                      Navigator.of(sheetContext).pop();
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => RegistrationSuccessScreen(
                            event: event,
                            registration: result.registration!,
                            ticketType: flowService.selectedTier?.name ?? 'Ticket',
                            quantity: flowService.quantity,
                            attendeeEmail: flowService.formResponses['email'] as String? ?? userEmail,
                          ),
                        ),
                      );
                      _controller.refreshAfterRegistration();
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(result.errorMessage ?? 'Registration failed'),
                          backgroundColor: AppColors.error,
                        ),
                      );
                    }
                  },
                );
              default:
                return const SizedBox.shrink();
            }
          },
        ),
      ),
    );
  }

  void _viewMyTicket() {
    final registration = _controller.existingRegistration;
    if (registration == null) return;
    context.push(AppRoutes.ticketDetail(registration.id));
  }

  void _handleJoinEvent(Event e) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Joining the live event... (coming soon)')),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_controller.isLoading && _controller.event == null) {
      return const EventDetailSkeleton();
    }
    
    final e = _controller.event;
    if (e == null) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
          ),
        ),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.event_busy, size: 64, color: AppColors.textMuted),
              const SizedBox(height: 16),
              Text('Event not found', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              TextButton.icon(
                onPressed: () => _controller.loadEvent(),
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    return Shortcuts(
      shortcuts: {
        LogicalKeySet(LogicalKeyboardKey.keyS): const _SaveIntent(),
        LogicalKeySet(LogicalKeyboardKey.keyR): const _RegisterIntent(),
        LogicalKeySet(LogicalKeyboardKey.escape): const _BackIntent(),
      },
      child: Actions(
        actions: {
          _SaveIntent: CallbackAction<_SaveIntent>(
            onInvoke: (_) { _toggleSave(); return null; },
          ),
          _RegisterIntent: CallbackAction<_RegisterIntent>(
            onInvoke: (_) { _openRegistrationFlow(); return null; },
          ),
          _BackIntent: CallbackAction<_BackIntent>(
            onInvoke: (_) { context.pop(); return null; },
          ),
        },
        child: Focus(
          focusNode: _pageFocusNode,
          autofocus: true,
          child: Scaffold(
            body: BrandedRefreshIndicator(
              onRefresh: _controller.onRefresh,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  _buildSliverAppBar(e),
                  SliverToBoxAdapter(child: _buildContent(e)),
                ],
              ),
            ),
            bottomNavigationBar: EventBottomCTA(
              priceLabel: _controller.priceRange.label,
              isRegistered: _controller.isRegistered,
              status: e.status,
              hasTickets: _controller.tiers.isNotEmpty,
              onRegister: () => _openRegistrationFlow(),
              onViewTicket: _viewMyTicket,
              onJoinLive: () => _handleJoinEvent(e),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSliverAppBar(Event e) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    final modeBadge = _controller.modeBadge;
    final categoryIcon = IconMappings.getEventCategoryIcon(e.category);
    final categoryColor = IconMappings.getEventCategoryColor(e.category);
    final priceLabel = _controller.priceRange.label;

    return SliverAppBar(
      pinned: true,
      expandedHeight: context.isTablet ? 340 : 280,
      leading: IconButton(
        icon: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.3),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
        ),
        onPressed: () => context.pop(),
      ),
      actions: [
        IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.3),
              shape: BoxShape.circle,
            ),
            child: Icon(
              _controller.isSaved ? Icons.bookmark : Icons.bookmark_border,
              color: _controller.isSaved ? AppColors.warning : Colors.white,
              size: 20,
            ),
          ),
          onPressed: _toggleSave,
        ),
        const SizedBox(width: 8),
      ],
      flexibleSpace: FlexibleSpaceBar(
        titlePadding: const EdgeInsetsDirectional.only(start: 56, bottom: 16, end: 16),
        title: TextHero(
          tag: HeroConfig.eventTitleTag(widget.eventId),
          child: Text(
            e.name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.white,
              shadows: [Shadow(blurRadius: 4, color: Colors.black45)],
            ),
          ),
        ),
        background: Stack(fit: StackFit.expand, children: [
          AnimatedHero(
            tag: HeroConfig.eventBannerTag(widget.eventId),
            child: EventBannerImage(urlOrAsset: e.branding.bannerUrl),
          ),
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withValues(alpha: 0.1),
                  Colors.black.withValues(alpha: 0.3),
                  Colors.black.withValues(alpha: 0.7),
                ],
                stops: const [0.0, 0.5, 1.0],
              ),
            ),
          ),
          Positioned(
            left: 16, right: 16, bottom: 56,
            child: Row(children: [
              EventPillBadge(
                icon: modeBadge.icon,
                label: modeBadge.label,
                color: modeBadge.color,
              ),
              const SizedBox(width: 8),
              EventCategoryBadge(icon: categoryIcon, label: e.category.displayName, color: categoryColor),
              const Spacer(),
              if (priceLabel.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(999),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 8, offset: const Offset(0, 2))],
                  ),
                  child: Text(priceLabel, style: text.labelLarge?.copyWith(color: cs.primary, fontWeight: FontWeight.w800)),
                ),
            ]),
          ),
        ]),
      ),
    );
  }

  Widget _buildContent(Event e) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    final priceLabel = _controller.priceRange.label;
    final isRegistered = _controller.isRegistered;
    final availableTiers = _controller.availableTiers;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (isRegistered) ...[
          FadeTransition(opacity: _fadeAnimations[0], child: EventRegisteredBadge(onViewTicket: _viewMyTicket)),
          const SizedBox(height: 16),
        ],
        
        FadeTransition(
          opacity: _fadeAnimations[0],
          child: EventOrganizerCard(
            organization: e.organization,
            status: e.status,
            onTap: () => context.push(AppRoutes.organizationBySlug(e.organization.slug), extra: e.organization),
          ),
        ),
        const SizedBox(height: 16),

        FadeTransition(
          opacity: _fadeAnimations[1],
          child: EventQuickActions(
            eventId: e.id,
            eventName: e.name,
            isSaved: _controller.isSaved,
            isSaving: _controller.isSaving,
            onToggleSave: _toggleSave,
          ),
        ),
        const SizedBox(height: 16),

        if (_controller.isUpcoming) ...[
          FadeTransition(opacity: _fadeAnimations[1], child: CountdownTimer(targetDate: e.startDate, onComplete: () => setState(() {}))),
          const SizedBox(height: 16),
        ],

        FadeTransition(
          opacity: _fadeAnimations[2],
          child: EventSocialProof(registeredCount: _controller.registeredCount, capacity: e.capacity, attendeeAvatars: _controller.attendeeAvatars),
        ),
        const SizedBox(height: 16),

        FadeTransition(
          opacity: _fadeAnimations[2],
          child: Wrap(spacing: 8, runSpacing: 8, children: [
            EventInfoChip(icon: Icons.calendar_today, label: _controller.formatDate(e.startDate)),
            EventInfoChip(icon: Icons.access_time, label: '${_controller.formatTime(e.startDate)} ${e.timezone}'),
            if (e.endDate != null) EventInfoChip(icon: Icons.timelapse, label: _controller.formatDuration(e.startDate, e.endDate!)),
            if (e.capacity != null) EventInfoChip(icon: Icons.people_alt, label: '${e.capacity} seats'),
            if (e.language.isNotEmpty && e.language != 'en') EventLanguageChip(languageCode: e.language),
            if (e.hasAgeRestriction) EventAgeRestriction(minAge: e.minAge, maxAge: e.maxAge),
          ]),
        ),
        const SizedBox(height: 16),

        if (e.registrationDeadline != null && e.registrationDeadline!.isAfter(DateTime.now())) ...[
          FadeTransition(opacity: _fadeAnimations[2], child: EventRegistrationDeadline(deadline: e.registrationDeadline!, timezone: e.timezone, onDeadlinePassed: () => setState(() {}))),
          const SizedBox(height: 16),
        ],

        if (e.hasAgeRestriction && (e.minAge != null && e.minAge! >= 18)) ...[
          FadeTransition(opacity: _fadeAnimations[2], child: EventAgeRestrictionCard(minAge: e.minAge, maxAge: e.maxAge)),
          const SizedBox(height: 16),
        ],
        
        const SizedBox(height: 8),

        if ((e.description ?? '').isNotEmpty) ...[
          FadeTransition(
            opacity: _fadeAnimations[3],
            child: EventAboutSection(description: e.description!, isExpanded: _controller.aboutExpanded, onToggle: _controller.toggleAboutExpanded),
          ),
          const SizedBox(height: 24),
        ],

        FadeTransition(
          opacity: _fadeAnimations[4],
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Location', style: text.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            EventLocationCard(venueName: e.venueName, address: e.address, city: e.city, latitude: e.latitude, longitude: e.longitude, isOnline: e.mode == EventMode.ONLINE),
          ]),
        ),
        const SizedBox(height: 24),

        FadeTransition(
          opacity: _fadeAnimations[5],
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Text('Tickets', style: text.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
              const Spacer(),
              if (priceLabel.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(999), border: Border.all(color: AppColors.border)),
                  child: Text(priceLabel, style: text.labelMedium?.copyWith(color: cs.primary, fontWeight: FontWeight.w700)),
                ),
            ]),
            const SizedBox(height: 12),
            ..._controller.tiers.asMap().entries.map((entry) {
              final index = entry.key;
              final t = entry.value;
              return TweenAnimationBuilder<double>(
                tween: Tween(begin: 0.0, end: 1.0),
                duration: Duration(milliseconds: 300 + index * 100),
                builder: (context, value, child) => Transform.translate(
                  offset: Offset(0, 20 * (1 - value)),
                  child: Opacity(opacity: value, child: child),
                ),
                child: EventTicketTierCard(tier: t, isAvailable: availableTiers.contains(t), isRegistered: isRegistered, onSelect: () => _openRegistrationFlow(preselectedTier: t)),
              );
            }),
          ]),
        ),
        const SizedBox(height: 24),

        if (e.contactEmail != null || e.contactPhone != null || e.eventWebsite != null)
          FadeTransition(opacity: _fadeAnimations[5], child: EventContactInfo(email: e.contactEmail, phone: e.contactPhone, website: e.eventWebsite)),
        if (e.contactEmail != null || e.contactPhone != null || e.eventWebsite != null)
          const SizedBox(height: 24),

        if (_controller.faqs.isNotEmpty || _controller.faqsLoading)
          FadeTransition(opacity: _fadeAnimations[5], child: EventFaqSection(faqs: _controller.faqs, isLoading: _controller.faqsLoading)),
      ]),
    );
  }
}
