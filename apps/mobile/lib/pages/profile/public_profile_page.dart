import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/profile_stats.dart';
import 'package:thittam1hub/models/follower.dart';
import 'package:thittam1hub/services/profile_service.dart';
import 'package:thittam1hub/services/followers_service.dart';
import 'package:thittam1hub/services/route_analytics_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/utils/animations.dart';
import 'package:thittam1hub/widgets/cover_banner.dart';
import 'package:thittam1hub/widgets/cover_image_picker.dart';
import 'package:thittam1hub/widgets/profile/previous_usernames_card.dart';
import 'package:thittam1hub/widgets/styled_button.dart';
import 'package:thittam1hub/widgets/follows_you_badge.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/utils/hero_animations.dart';
import 'package:thittam1hub/services/profile_realtime_service.dart';
import 'dart:async';

import 'package:thittam1hub/services/logging_service.dart';

/// Public profile page - viewed when accessing via deep link
/// Supports both /p/:userId and /u/:username routes
class PublicProfilePage extends StatefulWidget {
  /// User ID (UUID) - used for /p/:userId route
  final String? profileId;
  
  /// Username - used for /u/:username route (preferred)
  final String? username;
  
  const PublicProfilePage({
    super.key,
    this.profileId,
    this.username,
  }) : assert(profileId != null || username != null, 
              'Either profileId or username must be provided');

  @override
  State<PublicProfilePage> createState() => _PublicProfilePageState();
}

class _PublicProfilePageState extends State<PublicProfilePage> with RouteAnalyticsMixin {
  @override
  String get analyticsRouteName => widget.username != null ? '/u/${widget.username}' : '/p/${widget.profileId}';
  
  @override
  String? get analyticsRouteParams => widget.username ?? widget.profileId;
  
  @override
  Map<String, dynamic>? get analyticsMetadata => {
    'page_type': 'public_profile',
    'view_type': widget.username != null ? 'username' : 'uuid',
  };

  static final _log = LoggingService.instance;
  static const String _tag = 'PublicProfilePage';
  
  final _profileService = ProfileService.instance;
  final _followersService = FollowersService.instance;
  final _realtimeService = ProfileRealtimeService.instance;
  
  UserProfile? _profile;
  ProfileStats? _stats;
  bool _isLoading = true;
  bool _isFollowing = false;
  FollowStatus _followStatus = FollowStatus.notFollowing;
  bool _followsMe = false; // Whether this user follows the current user
  bool _isOwnProfile = false;
  String? _resolvedProfileId;
  StreamSubscription<String>? _realtimeSubscription;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }
  
  @override
  void dispose() {
    _realtimeSubscription?.cancel();
    super.dispose();
  }
  
  void _subscribeToRealtime() {
    if (_resolvedProfileId == null) return;
    _realtimeService.subscribe(_resolvedProfileId!);
    _realtimeSubscription = _realtimeService.onProfileUpdated.listen((userId) {
      if (userId == _resolvedProfileId && mounted) {
        _loadProfile(); // Refresh on external update
      }
    });
  }

  Future<void> _loadProfile() async {
    try {
      final currentUserId = SupabaseConfig.auth.currentUser?.id;
      
      // Resolve profile ID - either directly provided or looked up by username
      String? profileId = widget.profileId;
      
      if (profileId == null && widget.username != null) {
        // Look up user by username
        profileId = await _profileService.getUserIdByUsername(widget.username!);
        if (profileId == null) {
          // Username not found
          if (mounted) setState(() => _isLoading = false);
          return;
        }
      }
      
      _resolvedProfileId = profileId;
      _isOwnProfile = currentUserId == profileId;
      
      // Load profile data with explicit futures (no conditional await)
      final profileFuture = _profileService.getUserProfile(profileId!);
      final statsFuture = _profileService.getProfileStats(profileId);
      
      final profile = await profileFuture;
      final stats = await statsFuture;
      
      // Load follow data only for non-own profiles when logged in
      FollowStatus followStatus = FollowStatus.notFollowing;
      bool followsMe = false;
      
      if (currentUserId != null && !_isOwnProfile) {
        final followStatusFuture = _followersService.getFollowStatus(profileId);
        final followsMeFuture = _followersService.checkFollowsMe(profileId);
        followStatus = await followStatusFuture;
        followsMe = await followsMeFuture;
      }
      
      if (mounted) {
        setState(() {
          _profile = profile;
          _stats = stats;
          _followStatus = followStatus;
          _followsMe = followsMe;
          _isLoading = false;
        });
        // Subscribe to real-time updates after initial load
        _subscribeToRealtime();
      }
    } catch (e) {
      _log.error('Failed to load public profile: $e', tag: _tag);
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleFollow() async {
    final currentUserId = SupabaseConfig.auth.currentUser?.id;
    if (currentUserId == null) {
      // Redirect to login
      context.go(AppRoutes.signIn);
      return;
    }
    
    // Store previous state for rollback
    final previousStatus = _followStatus;
    
    // OPTIMISTIC: Update UI immediately
    setState(() {
      _isFollowing = true;
      _followStatus = FollowStatus.pending;
    });
    
    try {
      final result = await _followersService.followUser(_resolvedProfileId!);
      
      if (result.success) {
        setState(() {
          _followStatus = result.requestSent 
              ? FollowStatus.pending 
              : FollowStatus.following;
          _isFollowing = false;
        });
        if (mounted) {
          HapticFeedback.lightImpact();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.requestSent 
                  ? 'Follow request sent!' 
                  : 'Now following ${_profile?.fullName}'),
              backgroundColor: AppColors.success,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          );
        }
      } else if (result.alreadyFollowing) {
        setState(() {
          _followStatus = FollowStatus.following;
          _isFollowing = false;
        });
      } else if (result.error != null) {
        // ROLLBACK on error
        setState(() {
          _followStatus = previousStatus;
          _isFollowing = false;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.error!),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    } catch (e) {
      // ROLLBACK on failure
      setState(() {
        _followStatus = previousStatus;
        _isFollowing = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to follow: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _handleUnfollow() async {
    // Store previous state for rollback
    final previousStatus = _followStatus;
    
    // OPTIMISTIC: Update UI immediately
    setState(() => _followStatus = FollowStatus.notFollowing);
    
    try {
      final success = await _followersService.unfollowUser(_resolvedProfileId!);
      if (success && mounted) {
        HapticFeedback.lightImpact();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Unfollowed ${_profile?.fullName}'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      } else if (!success) {
        throw Exception('Unfollow failed');
      }
    } catch (e) {
      // ROLLBACK on failure
      setState(() => _followStatus = previousStatus);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Failed to unfollow'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _handleMessage() {
    final currentUserId = SupabaseConfig.auth.currentUser?.id;
    if (currentUserId == null) {
      context.go(AppRoutes.signIn);
      return;
    }
    
    // Navigate to chat with this user
    context.push(AppRoutes.chatNew, extra: {
      'dmUserId': _resolvedProfileId,
      'dmUserName': _profile?.fullName ?? 'User',
      'dmUserAvatar': _profile?.avatarUrl,
    });
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_profile == null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.person_off, size: 64, color: cs.onSurfaceVariant),
              const SizedBox(height: 16),
              Text(
                'Profile not found',
                style: context.textStyles.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                'This profile may have been removed or is private',
                style: context.textStyles.bodyMedium?.withColor(cs.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    // Get gradient colors if gradient is set
    List<Color>? gradientColors;
    if (_profile?.coverGradientId != null) {
      final theme = CoverGradientTheme.presets.where((t) => t.id == _profile!.coverGradientId).firstOrNull;
      gradientColors = theme?.colors;
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App Bar with cover
          SliverAppBar(
            expandedHeight: context.isTablet ? 200 : 160,
            pinned: true,
            backgroundColor: cs.surface,
            flexibleSpace: FlexibleSpaceBar(
              background: CoverBanner(
                imageUrl: _profile?.coverImageUrl,
                gradientColors: gradientColors,
                height: 200,
                showEditButton: false,
              ),
            ),
          ),
          
          SliverToBoxAdapter(
            child: Column(
              children: [
                // Avatar and basic info
                Transform.translate(
                  offset: const Offset(0, -40),
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding),
                    child: Column(
                      children: [
                        // Avatar with Hero transition
                        AnimatedHero(
                          tag: HeroConfig.profileAvatarTag(_resolvedProfileId ?? ''),
                          child: Semantics(
                            label: '${_profile?.fullName ?? "User"} profile picture',
                            image: true,
                            child: Container(
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: cs.surface, width: 4),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.1),
                                    blurRadius: 8,
                                  ),
                                ],
                              ),
                              child: CircleAvatar(
                                radius: 50,
                                backgroundColor: cs.primary,
                                backgroundImage: _profile?.avatarUrl != null 
                                    ? NetworkImage(_profile!.avatarUrl!) 
                                    : null,
                                child: _profile?.avatarUrl == null
                                    ? Text(
                                        (_profile?.fullName ?? 'U')[0].toUpperCase(),
                                        style: context.textStyles.headlineLarge?.copyWith(color: cs.onPrimary),
                                      )
                                    : null,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        
                        // Name
                        FadeSlideTransition(
                          child: Text(
                            _profile?.fullName ?? 'User',
                            style: context.textStyles.headlineSmall?.bold,
                            textAlign: TextAlign.center,
                          ),
                        ),
                        
                        // Username handle
                        if (_profile?.username != null && _profile!.username!.isNotEmpty)
                          FadeSlideTransition(
                            delay: const Duration(milliseconds: 50),
                            child: Text(
                              '@${_profile!.username}',
                              style: context.textStyles.bodyMedium?.withColor(cs.primary),
                            ),
                          ),
                        
                        // "Follows you" badge
                        if (_followsMe && !_isOwnProfile)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: FadeSlideTransition(
                              delay: const Duration(milliseconds: 75),
                              child: FollowsYouBadge(
                                isMutual: _followStatus == FollowStatus.mutualFollow,
                              ),
                            ),
                          ),
                        
                        // Headline/Bio
                        if (_profile?.bio != null && _profile!.bio!.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: FadeSlideTransition(
                              delay: const Duration(milliseconds: 100),
                              child: Text(
                                _profile!.bio!,
                                style: context.textStyles.bodyMedium?.withColor(cs.onSurfaceVariant),
                                textAlign: TextAlign.center,
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ),
                        
                        // Organization
                        if (_profile?.organization != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.business, size: 14, color: cs.onSurfaceVariant),
                                const SizedBox(width: 4),
                                Text(
                                  _profile!.organization!,
                                  style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                                ),
                              ],
                            ),
                          ),
                        
                        const SizedBox(height: 16),
                        
                        // Stats row
                        if (_stats != null)
                          FadeSlideTransition(
                            delay: const Duration(milliseconds: 150),
                            child: _PublicStatsRow(stats: _stats!),
                          ),
                        
                        const SizedBox(height: 20),
                        
                        // Action buttons
                        if (!_isOwnProfile)
                          FadeSlideTransition(
                            delay: const Duration(milliseconds: 200),
                            child: _buildActionButtons(cs),
                          ),
                        
                        if (_isOwnProfile)
                          FadeSlideTransition(
                            delay: const Duration(milliseconds: 200),
                            child: FilledButton.icon(
                              onPressed: () => context.go('/profile'),
                              icon: const Icon(Icons.edit),
                              label: const Text('Edit My Profile'),
                              style: FilledButton.styleFrom(
                                minimumSize: const Size(200, 48),
                              ),
                            ),
                          ),
                        
                        const SizedBox(height: 24),
                        
                        // Previous Usernames Section
                        if (_resolvedProfileId != null)
                          FadeSlideTransition(
                            delay: const Duration(milliseconds: 250),
                            child: PreviousUsernamesCard(userId: _resolvedProfileId!),
                          ),
                        
                        const SizedBox(height: 16),
                        
                        // Skills section
                        if (_profile?.skills != null && _profile!.skills!.isNotEmpty)
                          _buildSkillsSection(cs),
                        
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons(ColorScheme cs) {
    final isLoggedIn = SupabaseConfig.auth.currentUser != null;
    
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Follow button based on status
        if (_followStatus == FollowStatus.notFollowing)
          FilledButton.icon(
            onPressed: _isFollowing ? null : _handleFollow,
            icon: _isFollowing 
                ? SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: cs.onPrimary),
                  )
                : const Icon(Icons.person_add),
            label: Text(isLoggedIn ? 'Follow' : 'Sign in to Follow'),
            style: FilledButton.styleFrom(
              minimumSize: const Size(140, 44),
            ),
          ),
        
        if (_followStatus == FollowStatus.pending)
          OutlinedButton.icon(
            onPressed: null,
            icon: const Icon(Icons.hourglass_empty),
            label: const Text('Requested'),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(140, 44),
            ),
          ),
        
        if (_followStatus == FollowStatus.following)
          OutlinedButton.icon(
            onPressed: _handleUnfollow,
            icon: const Icon(Icons.check),
            label: const Text('Following'),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(140, 44),
            ),
          ),
        
        if (_followStatus == FollowStatus.mutualFollow)
          FilledButton.icon(
            onPressed: _handleUnfollow,
            icon: const Icon(Icons.people),
            label: const Text('Friends'),
            style: FilledButton.styleFrom(
              minimumSize: const Size(140, 44),
              backgroundColor: AppColors.success,
            ),
          ),
        
        const SizedBox(width: 12),
        
        // Message button
        OutlinedButton.icon(
          onPressed: _handleMessage,
          icon: const Icon(Icons.chat_bubble_outline),
          label: const Text('Message'),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size(120, 44),
          ),
        ),
      ],
    );
  }

  Widget _buildSkillsSection(ColorScheme cs) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Skills',
          style: context.textStyles.titleMedium?.bold,
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _profile!.skills!.map((skill) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: cs.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                skill,
                style: context.textStyles.bodySmall?.withColor(cs.primary),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}

class _PublicStatsRow extends StatelessWidget {
  final ProfileStats stats;

  const _PublicStatsRow({required this.stats});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _StatColumn(
            value: stats.impactScore.toString(),
            label: 'Impact',
            icon: Icons.star,
            color: const Color(0xFFFFB800),
          ),
          _divider(cs),
          _StatColumn(
            value: stats.eventsAttended.toString(),
            label: 'Events',
            icon: Icons.event,
            color: cs.primary,
          ),
          _divider(cs),
          _StatColumn(
            value: stats.badgesEarned.toString(),
            label: 'Badges',
            icon: Icons.emoji_events,
            color: const Color(0xFFFF6B35),
          ),
          _divider(cs),
          _StatColumn(
            value: stats.followersCount.toString(),
            label: 'Followers',
            icon: Icons.people,
            color: const Color(0xFF4CAF50),
          ),
        ],
      ),
    );
  }

  Widget _divider(ColorScheme cs) {
    return Container(
      width: 1,
      height: 32,
      color: cs.outlineVariant.withOpacity(0.3),
    );
  }
}

class _StatColumn extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final Color color;

  const _StatColumn({
    required this.value,
    required this.label,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(height: 4),
        Text(
          value,
          style: context.textStyles.titleMedium?.bold,
        ),
        Text(
          label,
          style: context.textStyles.labelSmall?.withColor(
            Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}
