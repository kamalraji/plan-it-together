import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:thittam1hub/services/icebreaker_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart';
import 'package:thittam1hub/widgets/styled_avatar.dart';
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';
import 'package:thittam1hub/utils/time_formatter.dart' as timeago;

/// Icebreaker section for daily conversation starters
class IcebreakerSection extends StatefulWidget {
  final String eventId;

  const IcebreakerSection({super.key, required this.eventId});

  @override
  State<IcebreakerSection> createState() => _IcebreakerSectionState();
}

class _IcebreakerSectionState extends State<IcebreakerSection>
    with TickerProviderStateMixin {
  final _icebreakerService = IcebreakerService.instance;
  final _responseController = TextEditingController();
  
  IcebreakerPrompt? _prompt;
  List<IcebreakerResponse> _responses = [];
  IcebreakerResponse? _userResponse;
  bool _isLoading = true;
  bool _isSubmitting = false;
  bool _isAnonymous = false;
  String? _error;

  // Animation controllers for premium effects
  late AnimationController _promptAnimController;
  late AnimationController _listAnimController;
  late Animation<double> _promptScale;
  late Animation<double> _promptFade;

  @override
  void initState() {
    super.initState();
    _initAnimations();
    _loadData();
  }

  void _initAnimations() {
    _promptAnimController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _listAnimController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _promptScale = Tween<double>(begin: 0.95, end: 1.0).animate(
      CurvedAnimation(parent: _promptAnimController, curve: Curves.easeOutBack),
    );
    _promptFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _promptAnimController, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _promptAnimController.dispose();
    _listAnimController.dispose();
    _responseController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final prompt = await _icebreakerService.getTodaysPrompt(widget.eventId);
      
      if (prompt != null) {
        final responses = await _icebreakerService.getResponses(prompt.id);
        final userResponse = await _icebreakerService.getUserResponse(prompt.id);
        
        if (mounted) {
          setState(() {
            _prompt = prompt;
            _responses = responses;
            _userResponse = userResponse;
            if (userResponse != null) {
              _responseController.text = userResponse.response;
              _isAnonymous = userResponse.isAnonymous;
            }
          });
          // Trigger animations
          _promptAnimController.forward();
          Future.delayed(const Duration(milliseconds: 300), () {
            if (mounted) _listAnimController.forward();
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _error = 'Failed to load icebreaker');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _submitResponse() async {
    final text = _responseController.text.trim();
    if (text.isEmpty || _prompt == null) return;

    setState(() => _isSubmitting = true);
    HapticFeedback.mediumImpact();

    final response = await _icebreakerService.submitResponse(
      promptId: _prompt!.id,
      responseText: text,
      isAnonymous: _isAnonymous,
    );

    if (response != null && mounted) {
      setState(() {
        _userResponse = response;
        // Add to top if new, or update existing
        final existingIndex = _responses.indexWhere((r) => r.userId == response.userId);
        if (existingIndex >= 0) {
          _responses[existingIndex] = response;
        } else {
          _responses.insert(0, response);
        }
      });
      HapticFeedback.heavyImpact();
    }

    if (mounted) {
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _toggleLike(IcebreakerResponse response) async {
    HapticFeedback.selectionClick();
    try {
      await _icebreakerService.toggleLike(response.id);
      // Refresh to get updated like counts
      await _loadData();
    } catch (e) {
      // Ignore errors silently
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    if (_isLoading) {
      return const _IcebreakerSkeleton();
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: cs.error),
            const SizedBox(height: 16),
            Text(_error!, style: textTheme.bodyMedium),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: _loadData,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_prompt == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.cyan.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.wb_sunny_rounded,
                  size: 48,
                  color: Colors.cyan,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'No Icebreaker Today',
                style: textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Check back later for today\'s conversation starter!',
                style: textTheme.bodyMedium?.copyWith(
                  color: cs.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return BrandedRefreshIndicator(
      onRefresh: _loadData,
      child: CustomScrollView(
        slivers: [
          // Prompt Card with scale animation
          SliverToBoxAdapter(
            child: AnimatedBuilder(
              animation: _promptAnimController,
              builder: (context, child) => Transform.scale(
                scale: _promptScale.value,
                child: Opacity(
                  opacity: _promptFade.value,
                  child: child,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: _PromptCard(
                  prompt: _prompt!,
                  responseController: _responseController,
                  isAnonymous: _isAnonymous,
                  onAnonymousChanged: (v) => setState(() => _isAnonymous = v),
                  isSubmitting: _isSubmitting,
                  hasSubmitted: _userResponse != null,
                  onSubmit: _submitResponse,
                ),
              ),
            ),
          ),

          // Responses Header
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: Row(
                children: [
                  Text(
                    'Responses',
                    style: textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: cs.primaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${_responses.length}',
                      style: textTheme.labelSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: cs.onPrimaryContainer,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Responses List
          if (_responses.isEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  children: [
                    Icon(
                      Icons.chat_bubble_outline_rounded,
                      size: 48,
                      color: cs.outlineVariant,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Be the first to respond!',
                      style: textTheme.bodyMedium?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    // Staggered animation for each response
                    final itemDelay = index * 0.1;
                    final itemAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
                      CurvedAnimation(
                        parent: _listAnimController,
                        curve: Interval(
                          itemDelay.clamp(0.0, 0.7),
                          (itemDelay + 0.3).clamp(0.0, 1.0),
                          curve: Curves.easeOutCubic,
                        ),
                      ),
                    );

                    return AnimatedBuilder(
                      animation: itemAnimation,
                      builder: (context, child) => Transform.translate(
                        offset: Offset(0, 20 * (1 - itemAnimation.value)),
                        child: Opacity(
                          opacity: itemAnimation.value,
                          child: child,
                        ),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _ResponseCard(
                          response: _responses[index],
                          onLike: () => _toggleLike(_responses[index]),
                        ),
                      ),
                    );
                  },
                  childCount: _responses.length,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Prompt card with input
class _PromptCard extends StatelessWidget {
  final IcebreakerPrompt prompt;
  final TextEditingController responseController;
  final bool isAnonymous;
  final ValueChanged<bool> onAnonymousChanged;
  final bool isSubmitting;
  final bool hasSubmitted;
  final VoidCallback onSubmit;

  const _PromptCard({
    required this.prompt,
    required this.responseController,
    required this.isAnonymous,
    required this.onAnonymousChanged,
    required this.isSubmitting,
    required this.hasSubmitted,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.cyan.withOpacity(0.1),
            Colors.teal.withOpacity(0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.cyan.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.cyan.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.wb_sunny_rounded,
                  size: 20,
                  color: Colors.cyan,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Today\'s Icebreaker',
                      style: textTheme.labelMedium?.copyWith(
                        color: Colors.cyan,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      prompt.promptType.toUpperCase(),
                      style: textTheme.labelSmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Question
          Text(
            prompt.question,
            style: textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 20),

          // Input
          TextField(
            controller: responseController,
            maxLines: 3,
            maxLength: 500,
            decoration: InputDecoration(
              hintText: hasSubmitted ? 'Edit your response...' : 'Share your answer...',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: cs.outline.withOpacity(0.3)),
              ),
              filled: true,
              fillColor: cs.surface,
            ),
          ),
          const SizedBox(height: 12),

          // Anonymous toggle and submit
          Row(
            children: [
              GestureDetector(
                onTap: () => onAnonymousChanged(!isAnonymous),
                child: Row(
                  children: [
                    Icon(
                      isAnonymous ? Icons.check_box : Icons.check_box_outline_blank,
                      size: 20,
                      color: cs.onSurfaceVariant,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Post anonymously',
                      style: textTheme.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              FilledButton.icon(
                onPressed: isSubmitting ? null : onSubmit,
                icon: isSubmitting
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Icon(hasSubmitted ? Icons.edit : Icons.send_rounded, size: 18),
                label: Text(hasSubmitted ? 'Update' : 'Share'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Response card with tap micro-interaction
class _ResponseCard extends StatefulWidget {
  final IcebreakerResponse response;
  final VoidCallback onLike;

  const _ResponseCard({
    required this.response,
    required this.onLike,
  });

  @override
  State<_ResponseCard> createState() => _ResponseCardState();
}

class _ResponseCardState extends State<_ResponseCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _scaleController;
  late Animation<double> _scaleAnimation;
  bool _isLiked = false;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.98).animate(
      CurvedAnimation(parent: _scaleController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _scaleController.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails _) {
    _scaleController.forward();
  }

  void _handleTapUp(TapUpDetails _) {
    _scaleController.reverse();
  }

  void _handleTapCancel() {
    _scaleController.reverse();
  }

  void _handleLike() {
    setState(() => _isLiked = !_isLiked);
    HapticFeedback.lightImpact();
    widget.onLike();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) => Transform.scale(
          scale: _scaleAnimation.value,
          child: child,
        ),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: cs.outline.withOpacity(0.1)),
            boxShadow: [
              BoxShadow(
                color: cs.shadow.withOpacity(0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // User info
              Row(
                children: [
                  if (widget.response.isAnonymous)
                    CircleAvatar(
                      radius: 18,
                      backgroundColor: cs.surfaceContainerHighest,
                      child: Icon(
                        Icons.person_outline,
                        size: 20,
                        color: cs.onSurfaceVariant,
                      ),
                    )
                  else
                    StyledAvatar(
                      imageUrl: widget.response.avatarUrl,
                      name: widget.response.displayName,
                      size: 36,
                    ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.response.displayName,
                          style: textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          timeago.format(widget.response.createdAt),
                          style: textTheme.labelSmall?.copyWith(
                            color: cs.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Response text
              Text(
                widget.response.response,
                style: textTheme.bodyMedium?.copyWith(height: 1.4),
              ),
              const SizedBox(height: 12),

              // Animated like button
              Row(
                children: [
                  _AnimatedLikeButton(
                    likesCount: widget.response.likesCount,
                    isLiked: _isLiked,
                    onTap: _handleLike,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Animated like button with heart pop effect
class _AnimatedLikeButton extends StatefulWidget {
  final int likesCount;
  final bool isLiked;
  final VoidCallback onTap;

  const _AnimatedLikeButton({
    required this.likesCount,
    required this.isLiked,
    required this.onTap,
  });

  @override
  State<_AnimatedLikeButton> createState() => _AnimatedLikeButtonState();
}

class _AnimatedLikeButtonState extends State<_AnimatedLikeButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.3), weight: 50),
      TweenSequenceItem(tween: Tween(begin: 1.3, end: 1.0), weight: 50),
    ]).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void didUpdateWidget(_AnimatedLikeButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isLiked && !oldWidget.isLiked) {
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return InkWell(
      onTap: widget.onTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Row(
          children: [
            AnimatedBuilder(
              animation: _scaleAnimation,
              builder: (context, child) => Transform.scale(
                scale: _scaleAnimation.value,
                child: child,
              ),
              child: Icon(
                widget.isLiked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                size: 18,
                color: widget.isLiked ? Colors.red : cs.onSurfaceVariant,
              ),
            ),
            if (widget.likesCount > 0 || widget.isLiked) ...[
              const SizedBox(width: 4),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: Text(
                  '${widget.likesCount + (widget.isLiked ? 1 : 0)}',
                  key: ValueKey(widget.likesCount + (widget.isLiked ? 1 : 0)),
                  style: textTheme.labelSmall?.copyWith(
                    color: widget.isLiked ? Colors.red : cs.onSurfaceVariant,
                    fontWeight: widget.isLiked ? FontWeight.w600 : null,
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

/// Enhanced loading skeleton with staggered shimmer
class _IcebreakerSkeleton extends StatelessWidget {
  const _IcebreakerSkeleton();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Prompt skeleton with gradient background
          ShimmerLoading(
            child: Container(
              height: 220,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    cs.surfaceContainerHighest,
                    cs.surfaceContainerHigh,
                  ],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header skeleton
                    Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.3),
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 120,
                              height: 14,
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.3),
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Container(
                              width: 60,
                              height: 10,
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    // Question skeleton
                    Container(
                      width: double.infinity,
                      height: 20,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: 200,
                      height: 20,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const Spacer(),
                    // Input skeleton
                    Container(
                      height: 48,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          
          // Responses header skeleton
          Row(
            children: [
              ShimmerLoading(
                child: Container(
                  width: 80,
                  height: 18,
                  decoration: BoxDecoration(
                    color: cs.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ShimmerLoading(
                child: Container(
                  width: 24,
                  height: 18,
                  decoration: BoxDecoration(
                    color: cs.primaryContainer.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(9),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Response cards skeleton with staggered delays
          ...List.generate(3, (index) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: ShimmerLoading(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: cs.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: cs.outline.withOpacity(0.05)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: cs.surfaceContainerHighest,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 100 + (index * 20.0),
                              height: 12,
                              decoration: BoxDecoration(
                                color: cs.surfaceContainerHighest,
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              width: 50,
                              height: 10,
                              decoration: BoxDecoration(
                                color: cs.surfaceContainerHigh,
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      height: 14,
                      decoration: BoxDecoration(
                        color: cs.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      width: 180 - (index * 30.0),
                      height: 14,
                      decoration: BoxDecoration(
                        color: cs.surfaceContainerHigh,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          )),
        ],
      ),
    );
  }
}
