import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/impact_profile.dart';
import 'package:thittam1hub/models/match_insight.dart';
import 'package:thittam1hub/models/networking_models.dart';
import 'package:thittam1hub/supabase/impact_service.dart';
import 'package:thittam1hub/widgets/match_insights_card.dart';
import 'package:thittam1hub/widgets/swipe_card_stack.dart';
import 'package:thittam1hub/widgets/follows_you_badge.dart';
import 'package:thittam1hub/utils/hero_animations.dart';
import 'package:thittam1hub/utils/intent_config.dart';
import 'package:thittam1hub/widgets/confetti_overlay.dart' show ConfettiOverlay, OnlineIndicatorPulse;
import 'package:thittam1hub/pages/impact/widgets/ai_match_badge.dart';

/// Profile card widget for the Pulse discovery page.
/// 
/// Displays a profile with:
/// - Avatar with online indicator
/// - AI match score, category and insights
/// - Looking for intentions
/// - Mutual followers
/// - Common skills/interests from AI matching
/// - Action buttons (skip, follow, save)
class PulseProfileCard extends StatefulWidget {
  final ImpactProfile profile;
  final int matchScore;
  final MatchResult? matchResult;
  final bool isOnline;
  final bool followsMe;
  final String? selectedIntent;
  final VoidCallback onSkip;
  final VoidCallback onFollow;
  final VoidCallback onSave;
  final VoidCallback? onTap;
  final bool enableHero;
  
  // AI matching fields
  final SmartMatch? smartMatch;
  final String? matchCategory;
  final List<String>? commonSkills;
  final List<String>? commonInterests;

  const PulseProfileCard({
    super.key,
    required this.profile,
    required this.matchScore,
    this.matchResult,
    required this.isOnline,
    this.followsMe = false,
    this.selectedIntent,
    required this.onSkip,
    required this.onFollow,
    required this.onSave,
    this.onTap,
    this.enableHero = true,
    this.smartMatch,
    this.matchCategory,
    this.commonSkills,
    this.commonInterests,
  });

  @override
  State<PulseProfileCard> createState() => _PulseProfileCardState();
}

class _PulseProfileCardState extends State<PulseProfileCard>
    with TickerProviderStateMixin {
  final ImpactService _impactService = ImpactService();
  final GlobalKey<SwipeableProfileCardState> _swipeKey = GlobalKey();
  List<ImpactProfile> _mutualFollowers = [];
  bool _loadingMutuals = false;
  bool _showInsights = false;

  // Entrance animation
  late AnimationController _entranceController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  // Match score animation
  late AnimationController _scoreController;
  late Animation<int> _scoreAnimation;

  @override
  void initState() {
    super.initState();
    _loadMutualFollowers();

    // Setup entrance animation
    _entranceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );

    _scaleAnimation = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _entranceController, curve: Curves.easeOutBack),
    );

    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _entranceController, curve: Curves.easeOut),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0.15, 0),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _entranceController, curve: Curves.easeOutCubic));

    // Setup score animation
    _scoreController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _scoreAnimation = IntTween(begin: 0, end: widget.matchScore).animate(
      CurvedAnimation(parent: _scoreController, curve: Curves.easeOutCubic),
    );

    // Start animations
    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted) {
        _entranceController.forward();
        _scoreController.forward();
      }
    });
  }

  Future<void> _loadMutualFollowers() async {
    setState(() => _loadingMutuals = true);
    final mutuals = await _impactService.getMutualFollowers(widget.profile.userId);
    if (mounted) {
      setState(() {
        _mutualFollowers = mutuals;
        _loadingMutuals = false;
      });
    }
  }

  void _onSwipeLeft() {
    HapticFeedback.mediumImpact();
    widget.onSkip();
  }

  void _onSwipeRight() {
    HapticFeedback.mediumImpact();
    widget.onFollow();
  }

  void _onSwipeUp() {
    HapticFeedback.mediumImpact();
    widget.onSave();
  }

  @override
  void dispose() {
    _entranceController.dispose();
    _scoreController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final avatarHeroTag = HeroConfig.profileAvatarTag(widget.profile.userId);
    final nameHeroTag = HeroConfig.profileNameTag(widget.profile.userId);

    final intentConfig = widget.selectedIntent != null
        ? IntentConfig.getByKey(widget.selectedIntent!)
        : null;

    return AnimatedBuilder(
      animation: _entranceController,
      builder: (context, child) {
        return FadeTransition(
          opacity: _fadeAnimation,
          child: SlideTransition(
            position: _slideAnimation,
            child: ScaleTransition(
              scale: _scaleAnimation,
              child: SwipeableProfileCard(
                key: _swipeKey,
                onSwipeLeft: _onSwipeLeft,
                onSwipeRight: _onSwipeRight,
                onSwipeUp: _onSwipeUp,
                child: GestureDetector(
                  onTap: widget.onTap,
                  child: Card(
                    margin: const EdgeInsets.all(16.0),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    elevation: 8,
                    shadowColor: cs.primary.withOpacity(0.2),
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            cs.surface,
                            cs.surfaceContainerHighest.withOpacity(0.5),
                          ],
                        ),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildHeader(cs, textTheme, avatarHeroTag, nameHeroTag, intentConfig),
                            if (_showInsights && widget.matchResult != null) ...[
                              const SizedBox(height: 16),
                              MatchInsightsCard(
                                matchResult: widget.matchResult!,
                                initiallyExpanded: true,
                                onTap: () => setState(() => _showInsights = false),
                              ),
                            ],
                            // AI Match highlights (shared skills/interests)
                            _buildAIMatchHighlights(cs),
                            const SizedBox(height: 16),
                            _buildLookingForSection(textTheme),
                            const SizedBox(height: 12),
                            _buildMutualFollowers(cs),
                            _buildInterests(cs),
                            const SizedBox(height: 16),
                            _buildVibeScore(cs, textTheme),
                            const Spacer(),
                            _buildActionButtons(cs),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildHeader(ColorScheme cs, TextTheme textTheme, String avatarHeroTag, String nameHeroTag, IntentConfig? intentConfig) {
    return Row(
      children: [
        Stack(
          children: [
            AnimatedHero(
              tag: avatarHeroTag,
              enabled: widget.enableHero,
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: cs.primary.withOpacity(0.3),
                      blurRadius: 12,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: CircleAvatar(
                  radius: 32,
                  backgroundImage: widget.profile.avatarUrl != null
                      ? NetworkImage(widget.profile.avatarUrl!)
                      : null,
                  child: widget.profile.avatarUrl == null
                      ? Text(widget.profile.fullName.substring(0, 1),
                          style: const TextStyle(fontSize: 26))
                      : null,
                ),
              ),
            ),
            if (widget.isOnline)
              Positioned(
                right: 0,
                bottom: 0,
                child: OnlineIndicatorPulse(
                  isOnline: widget.isOnline,
                  size: 16,
                ),
              ),
          ],
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextHero(
                tag: nameHeroTag,
                enabled: widget.enableHero,
                child: Text(
                  widget.profile.fullName,
                  style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
              ),
              if (widget.followsMe) ...[
                const SizedBox(height: 4),
                const FollowsYouChip(isMutual: false),
              ],
              const SizedBox(height: 4),
              Text(
                widget.profile.headline,
                style: textTheme.bodyMedium?.copyWith(color: cs.onSurfaceVariant),
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        _buildMatchScoreBadge(cs, intentConfig),
      ],
    );
  }

  Widget _buildMatchScoreBadge(ColorScheme cs, IntentConfig? intentConfig) {
    // Use AI match badge if we have a smart match
    if (widget.smartMatch != null || widget.matchCategory != null) {
      return GestureDetector(
        onTap: () => setState(() => _showInsights = !_showInsights),
        child: AIMatchBadge(
          matchScore: widget.matchScore,
          matchCategory: widget.smartMatch?.matchCategory ?? widget.matchCategory,
          compact: false,
          onTap: widget.matchResult != null 
              ? () => setState(() => _showInsights = !_showInsights)
              : null,
        ),
      );
    }
    
    if (widget.matchResult != null) {
      return GestureDetector(
        onTap: () => setState(() => _showInsights = !_showInsights),
        child: MatchInsightsCard(
          matchResult: widget.matchResult!,
          compact: true,
        ),
      );
    }

    return AnimatedBuilder(
      animation: _scoreAnimation,
      builder: (context, child) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                (intentConfig?.color ?? cs.primary),
                (intentConfig?.color ?? cs.primary).withOpacity(0.7),
              ],
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: (intentConfig?.color ?? cs.primary).withOpacity(0.3),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              const Icon(Icons.favorite, color: Colors.white, size: 16),
              const SizedBox(width: 6),
              Text(
                '${_scoreAnimation.value}%',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        );
      },
    );
  }

  /// Build common skills/interests chips from AI matching
  Widget _buildAIMatchHighlights(ColorScheme cs) {
    final skills = widget.smartMatch?.commonSkills ?? widget.commonSkills ?? [];
    final interests = widget.smartMatch?.commonInterests ?? widget.commonInterests ?? [];
    
    if (skills.isEmpty && interests.isEmpty) {
      return const SizedBox.shrink();
    }
    
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (skills.isNotEmpty) ...[
            Row(
              children: [
                Icon(Icons.code_rounded, size: 14, color: Colors.blue),
                const SizedBox(width: 4),
                Text(
                  'Shared skills: ',
                  style: TextStyle(
                    fontSize: 12,
                    color: cs.onSurfaceVariant,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: skills.take(3).map((skill) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue.withOpacity(0.2)),
                ),
                child: Text(
                  skill,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Colors.blue,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              )).toList(),
            ),
            const SizedBox(height: 8),
          ],
          if (interests.isNotEmpty) ...[
            Row(
              children: [
                Icon(Icons.favorite_rounded, size: 14, color: Colors.pink),
                const SizedBox(width: 4),
                Text(
                  'Common interests: ',
                  style: TextStyle(
                    fontSize: 12,
                    color: cs.onSurfaceVariant,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: interests.take(3).map((interest) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.pink.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.pink.withOpacity(0.2)),
                ),
                child: Text(
                  interest,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Colors.pink,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              )).toList(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildLookingForSection(TextTheme textTheme) {
    final cs = Theme.of(context).colorScheme;
    if (widget.profile.lookingFor.isEmpty) return const SizedBox.shrink();

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        Text(
          'Looking for: ',
          style: textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w500,
            color: cs.onSurfaceVariant,
          ),
        ),
        ...widget.profile.lookingFor.map((item) {
          final config = IntentConfig.getByKey(item);
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: (config?.color ?? cs.primary).withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: (config?.color ?? cs.primary).withOpacity(0.3),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (config != null)
                  Icon(config.icon, size: 14, color: config.color),
                if (config != null) const SizedBox(width: 4),
                Text(
                  config?.label ?? item,
                  style: TextStyle(
                    color: config?.color ?? cs.primary,
                    fontWeight: FontWeight.w500,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _buildMutualFollowers(ColorScheme cs) {
    if (_mutualFollowers.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.people, size: 16, color: cs.primary),
            const SizedBox(width: 4),
            Text(
              '${_mutualFollowers.length} mutual follower${_mutualFollowers.length > 1 ? 's' : ''}',
              style: TextStyle(color: cs.primary, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 36,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: _mutualFollowers.length.clamp(0, 5),
            itemBuilder: (context, i) => Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Tooltip(
                message: _mutualFollowers[i].fullName,
                child: CircleAvatar(
                  radius: 18,
                  backgroundImage: _mutualFollowers[i].avatarUrl != null
                      ? NetworkImage(_mutualFollowers[i].avatarUrl!)
                      : null,
                  child: _mutualFollowers[i].avatarUrl == null
                      ? Text(_mutualFollowers[i].fullName[0])
                      : null,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
      ],
    );
  }

  Widget _buildInterests(ColorScheme cs) {
    return Wrap(
      spacing: 8,
      runSpacing: 4,
      children: widget.profile.interests
          .take(3)
          .map((interest) => Chip(
                label: Text(interest),
                backgroundColor: cs.surfaceContainerHighest,
              ))
          .toList(),
    );
  }

  Widget _buildVibeScore(ColorScheme cs, TextTheme textTheme) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(Icons.auto_awesome_rounded, size: 18, color: cs.primary),
            const SizedBox(width: 6),
            Text(
              'Vibe',
              style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [Colors.orange, Colors.red]),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            '${widget.profile.impactScore}',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons(ColorScheme cs) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _buildSkipButton(cs),
        _buildFollowButton(cs),
        _buildSaveButton(),
      ],
    );
  }

  Widget _buildSkipButton(ColorScheme cs) {
    return _ActionButton(
      icon: Icons.close_rounded,
      color: cs.error,
      onTap: widget.onSkip,
      tooltip: 'Skip',
    );
  }

  Widget _buildFollowButton(ColorScheme cs) {
    return _ActionButton(
      icon: Icons.person_add_rounded,
      color: cs.primary,
      onTap: widget.onFollow,
      tooltip: 'Follow',
      isLarge: true,
    );
  }

  Widget _buildSaveButton() {
    return _ActionButton(
      icon: Icons.bookmark_rounded,
      color: Colors.amber[600]!,
      onTap: widget.onSave,
      tooltip: 'Save',
    );
  }
}

/// Action button for the profile card
class _ActionButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  final String tooltip;
  final bool isLarge;

  const _ActionButton({
    required this.icon,
    required this.color,
    required this.onTap,
    required this.tooltip,
    this.isLarge = false,
  });

  String _buildSemanticLabel() {
    switch (tooltip) {
      case 'Skip':
        return 'Skip this profile, swipe left';
      case 'Follow':
        return 'Follow this person, swipe right';
      case 'Save':
        return 'Save to favorites, swipe up';
      default:
        return tooltip;
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = isLarge ? 64.0 : 56.0;
    return Semantics(
      button: true,
      label: _buildSemanticLabel(),
      child: Tooltip(
        message: tooltip,
        child: Material(
          color: color.withOpacity(0.1),
          shape: const CircleBorder(),
          child: InkWell(
            onTap: () {
              HapticFeedback.mediumImpact();
              onTap();
            },
            customBorder: const CircleBorder(),
            child: Container(
              width: size,
              height: size,
              alignment: Alignment.center,
              child: Icon(icon, color: color, size: isLarge ? 28 : 24),
            ),
          ),
        ),
      ),
    );
  }
}

// ProfileCardSkeleton has been consolidated to lib/utils/animations.dart
// Use: import 'package:thittam1hub/utils/animations.dart';
// Then use ProfileCardSkeleton() from that file.
