import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/impact_profile.dart';
import 'package:thittam1hub/models/work_experience.dart';
import 'package:thittam1hub/models/portfolio_project.dart';
import 'package:thittam1hub/models/skill_endorsement.dart';
import 'package:thittam1hub/models/follower.dart';
import 'package:thittam1hub/models/networking_models.dart';
import 'package:thittam1hub/supabase/impact_service.dart';
import 'package:thittam1hub/supabase/professional_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/followers_service.dart';
import 'package:thittam1hub/services/chat_service.dart';
import 'package:thittam1hub/services/chat_security_service.dart';
import 'package:thittam1hub/services/ai_matching_service.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/utils/hero_animations.dart';
import 'package:thittam1hub/widgets/glassmorphism_bottom_sheet.dart';
import 'package:thittam1hub/widgets/work_experience_timeline.dart';
import 'package:thittam1hub/widgets/portfolio_showcase.dart';
import 'package:thittam1hub/widgets/skill_endorsements.dart';
import 'package:thittam1hub/widgets/follows_you_badge.dart';
import 'package:thittam1hub/widgets/share_profile_sheet.dart';
import 'package:thittam1hub/widgets/conversation_starters_card.dart';

class ProfileDetailPage extends StatefulWidget {
  final String profileId;
  final ImpactProfile? profile; // Pass for immediate hero display
  final SmartMatch? smartMatch; // Pass from Pulse for AI data
  
  const ProfileDetailPage({
    super.key,
    required this.profileId,
    this.profile,
    this.smartMatch,
  });

  @override
  State<ProfileDetailPage> createState() => _ProfileDetailPageState();
}

class _ProfileDetailPageState extends State<ProfileDetailPage> {
  final ImpactService _impactService = ImpactService();
  final ProfessionalService _professionalService = ProfessionalService();
  final FollowersService _followersService = FollowersService.instance;
  final AIMatchingService _aiMatchingService = AIMatchingService.instance;
  
  ImpactProfile? _profile;
  bool _isLoading = true;
  List<ImpactProfile> _mutualFollowers = [];
  FollowStatus _followStatus = FollowStatus.notFollowing;
  bool _isFollowing = false;
  bool _followsMe = false; // Whether this user follows the current user
  
  // Professional data
  List<WorkExperience> _workExperiences = [];
  List<PortfolioProject> _portfolioProjects = [];
  Map<String, SkillEndorsementSummary> _endorsements = {};
  
  // AI Insights
  String? _matchNarrative;
  List<String> _conversationStarters = [];
  List<String> _collaborationIdeas = [];
  bool _loadingInsights = false;

  @override
  void initState() {
    super.initState();
    // Use passed profile for immediate display (enables smooth hero)
    if (widget.profile != null) {
      _profile = widget.profile;
      _isLoading = false;
    }
    
    // Initialize with SmartMatch data if available
    if (widget.smartMatch != null) {
      _matchNarrative = widget.smartMatch!.matchNarrative;
      _conversationStarters = widget.smartMatch!.conversationStarters;
      _collaborationIdeas = widget.smartMatch!.collaborationIdeas;
    }
    
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    if (_profile == null) {
      setState(() => _isLoading = true);
    }
    try {
      final results = await Future.wait([
        _impactService.getProfileById(widget.profileId),
        _impactService.getMutualFollowers(widget.profileId),
        _followersService.getFollowStatus(widget.profileId),
        _followersService.checkFollowsMe(widget.profileId),
        _professionalService.getWorkExperience(widget.profileId),
        _professionalService.getPortfolioProjects(widget.profileId),
        _professionalService.getEndorsements(widget.profileId),
      ]);
      
      if (mounted) {
        setState(() {
          _profile = (results[0] as ImpactProfile?) ?? _profile;
          _mutualFollowers = results[1] as List<ImpactProfile>;
          _followStatus = results[2] as FollowStatus;
          _followsMe = results[3] as bool;
          _workExperiences = results[4] as List<WorkExperience>;
          _portfolioProjects = results[5] as List<PortfolioProject>;
          _endorsements = results[6] as Map<String, SkillEndorsementSummary>;
          _isLoading = false;
        });
        
        // Load AI insights if not already available
        if (_conversationStarters.isEmpty) {
          _loadAIInsights();
        }
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  /// Load AI-generated conversation starters and insights
  Future<void> _loadAIInsights() async {
    if (_loadingInsights) return;
    
    setState(() => _loadingInsights = true);
    
    try {
      // Create a minimal AIMatchResult to fetch insights
      final matchResult = AIMatchResult(
        userId: widget.profileId,
        fullName: _profile?.fullName ?? '',
        matchScore: widget.smartMatch?.matchScore ?? 50,
        sharedSkills: widget.smartMatch?.commonSkills ?? [],
        sharedInterests: widget.smartMatch?.commonInterests ?? [],
        sharedGoals: [],
        isOnline: _profile?.isOnline ?? false,
        isPremium: _profile?.isPremium ?? false,
        isVerified: _profile?.isVerified ?? false,
        matchCategory: widget.smartMatch?.matchCategory ?? 'discovery',
        behavioralScore: 0,
      );
      
      final enrichedMatch = await _aiMatchingService.getMatchInsights(
        match: matchResult,
        forceRefresh: false,
      );
      
      if (mounted) {
        setState(() {
          _matchNarrative = enrichedMatch.matchNarrative;
          _conversationStarters = enrichedMatch.conversationStarters ?? [];
          _collaborationIdeas = enrichedMatch.collaborationIdeas ?? [];
          _loadingInsights = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loadingInsights = false);
      }
    }
  }

  Future<void> _handleFollow() async {
    if (_profile == null) return;
    
    HapticFeedback.mediumImpact();
    setState(() => _isFollowing = true);
    
    try {
      final result = await _followersService.followUser(_profile!.userId);
      
      if (result.success) {
        setState(() {
          _followStatus = result.requestSent 
              ? FollowStatus.pending 
              : FollowStatus.following;
        });
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.requestSent 
                  ? 'Follow request sent to ${_profile!.fullName}'
                  : 'Now following ${_profile!.fullName}'),
              backgroundColor: AppColors.primary,
            ),
          );
        }
      } else if (result.error != null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result.error!)),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to follow user')),
        );
      }
    } finally {
      if (mounted) setState(() => _isFollowing = false);
    }
  }

  Future<void> _handleUnfollow() async {
    if (_profile == null) return;
    
    HapticFeedback.mediumImpact();
    final success = await _followersService.unfollowUser(_profile!.userId);
    
    if (success && mounted) {
      setState(() => _followStatus = FollowStatus.notFollowing);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unfollowed ${_profile!.fullName}')),
      );
    }
  }

  void _navigateToChat() {
    if (_profile == null) return;
    
    final currentUserId = SupabaseConfig.auth.currentUser?.id;
    if (currentUserId == null) return;
    
    // Generate deterministic DM channel ID
    final channelId = ChatService.dmChannelIdFor(currentUserId, _profile!.userId);
    
    // Navigate with DM metadata for proper header display
    context.push(
      AppRoutes.chatChannel(channelId),
      extra: {
        'dmUserId': _profile!.userId,
        'dmUserName': _profile!.fullName,
        'dmUserAvatar': _profile!.avatarUrl,
      },
    );
  }

  void _shareProfile() {
    if (_profile == null) return;
    
    showShareProfileSheet(
      context: context,
      userId: _profile!.userId,
      displayName: _profile!.fullName,
      headline: _profile!.headline,
      avatarUrl: _profile!.avatarUrl,
      impactScore: _profile!.impactScore,
      skills: _profile!.skills,
    );
  }

  void _showBlockConfirmation() {
    if (_profile == null) return;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Block User'),
        content: Text(
          'Are you sure you want to block ${_profile!.fullName}? '
          'They won\'t be able to see your profile or send you messages.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.pop(context);
              await _blockUser();
            },
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Block'),
          ),
        ],
      ),
    );
  }

  Future<void> _blockUser() async {
    if (_profile == null) return;
    
    HapticFeedback.heavyImpact();
    
    final result = await ChatSecurityService.instance.blockUser(_profile!.userId);
    
    if (mounted) {
      if (result.isSuccess) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${_profile!.fullName} has been blocked'),
            backgroundColor: Colors.red,
          ),
        );
        // Navigate back after blocking
        context.pop();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to block user: ${result.errorMessage}'),
          ),
        );
      }
    }
  }

  void _showMoreActions() {
    showGlassBottomSheet(
      context: context,
      child: GlassActionList(
        actions: [
          GlassActionButton(
            icon: Icons.chat_bubble_outline,
            label: 'Send Message',
            onTap: () {
              Navigator.pop(context);
              _navigateToChat();
            },
          ),
          GlassActionButton(
            icon: Icons.bookmark_outline,
            label: 'Save Profile',
            onTap: () async {
              Navigator.pop(context);
              await _impactService.saveProfile(widget.profileId);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Saved ${_profile?.fullName} to favorites')),
                );
              }
            },
          ),
          GlassActionButton(
            icon: Icons.share_outlined,
            label: 'Share Profile',
            onTap: () {
              Navigator.pop(context);
              _shareProfile();
            },
          ),
          GlassActionButton(
            icon: Icons.block_outlined,
            label: 'Block User',
            onTap: () {
              Navigator.pop(context);
              _showBlockConfirmation();
            },
            isDestructive: true,
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_isLoading && _profile == null) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
          ),
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final p = _profile;
    if (p == null) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
          ),
        ),
        body: const Center(child: Text('Profile not found')),
      );
    }

    final avatarHeroTag = HeroConfig.profileAvatarTag(widget.profileId);
    final nameHeroTag = HeroConfig.profileNameTag(widget.profileId);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: context.isTablet ? 340 : 280,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => context.pop(),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.more_vert, color: Colors.white),
                onPressed: _showMoreActions,
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  // Gradient background
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          cs.primary,
                          cs.primary.withValues(alpha: 0.7),
                          cs.secondary,
                        ],
                      ),
                    ),
                  ),
                  // Content
                  SafeArea(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(height: 40),
                        // Avatar with Hero
                        AnimatedHero(
                          tag: avatarHeroTag,
                          child: Stack(
                            children: [
                              CircleAvatar(
                                radius: 56,
                                backgroundColor: Colors.white,
                                child: CircleAvatar(
                                  radius: 52,
                                  backgroundImage: p.avatarUrl != null
                                      ? NetworkImage(p.avatarUrl!)
                                      : null,
                                  backgroundColor: cs.primary.withValues(alpha: 0.2),
                                  child: p.avatarUrl == null
                                      ? Text(
                                          p.fullName.isNotEmpty
                                              ? p.fullName[0].toUpperCase()
                                              : '?',
                                          style: const TextStyle(
                                            fontSize: 36,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.white,
                                          ),
                                        )
                                      : null,
                                ),
                              ),
                              if (p.isOnline)
                                Positioned(
                                  right: 4,
                                  bottom: 4,
                                  child: Container(
                                    width: 20,
                                    height: 20,
                                    decoration: BoxDecoration(
                                      color: AppColors.success,
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.white, width: 3),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Name with Hero
                        TextHero(
                          tag: nameHeroTag,
                          child: Text(
                            p.fullName,
                            style: text.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        // "Follows you" badge
                        if (_followsMe) ...[
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: _followStatus == FollowStatus.mutualFollow
                                  ? AppColors.success.withOpacity(0.2)
                                  : Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: _followStatus == FollowStatus.mutualFollow
                                    ? AppColors.success.withOpacity(0.4)
                                    : Colors.white.withOpacity(0.3),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  _followStatus == FollowStatus.mutualFollow
                                      ? Icons.sync_alt
                                      : Icons.person_add,
                                  size: 14,
                                  color: Colors.white,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  _followStatus == FollowStatus.mutualFollow
                                      ? 'Mutual'
                                      : 'Follows you',
                                  style: text.labelSmall?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                        if (p.headline.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            p.headline,
                            style: text.bodyMedium?.copyWith(
                              color: Colors.white70,
                            ),
                          ),
                        ],
                        const SizedBox(height: 8),
                        // Level badge
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.auto_awesome_rounded, size: 18, color: Colors.amber),
                              const SizedBox(width: 8),
                              Text(
                                'Level ${p.level}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Icon(Icons.bolt, color: Colors.amber, size: 16),
                              const SizedBox(width: 4),
                              Text(
                                '${p.impactScore}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Action buttons
                  Row(
                    children: [
                      Expanded(
                        child: _followStatus == FollowStatus.notFollowing
                            ? FilledButton.icon(
                                onPressed: _isFollowing ? null : _handleFollow,
                                icon: _isFollowing
                                    ? const SizedBox(
                                        width: 16,
                                        height: 16,
                                        child: CircularProgressIndicator(strokeWidth: 2),
                                      )
                                    : const Icon(Icons.person_add),
                                label: const Text('Follow'),
                                style: FilledButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                ),
                              )
                            : _followStatus == FollowStatus.pending
                                ? OutlinedButton.icon(
                                    onPressed: null,
                                    icon: const Icon(Icons.hourglass_empty),
                                    label: const Text('Requested'),
                                    style: OutlinedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(vertical: 14),
                                    ),
                                  )
                                : OutlinedButton.icon(
                                    onPressed: _handleUnfollow,
                                    icon: Icon(
                                      _followStatus == FollowStatus.mutualFollow
                                          ? Icons.people
                                          : Icons.check,
                                    ),
                                    label: Text(
                                      _followStatus == FollowStatus.mutualFollow
                                          ? 'Friends'
                                          : 'Following',
                                    ),
                                    style: OutlinedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(vertical: 14),
                                    ),
                                  ),
                      ),
                      const SizedBox(width: 12),
                      OutlinedButton.icon(
                        onPressed: _navigateToChat,
                        icon: const Icon(Icons.chat_bubble_outline),
                        label: const Text('Message'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // AI Conversation Starters
                  ConversationStartersCard(
                    conversationStarters: _conversationStarters,
                    collaborationIdeas: _collaborationIdeas,
                    matchNarrative: _matchNarrative,
                    isLoading: _loadingInsights,
                    onRefresh: () => _loadAIInsights(),
                    onStarterTap: (starter) {
                      // Navigate to chat with pre-filled message
                      _navigateToChat();
                    },
                  ),
                  const SizedBox(height: 16),

                  // About section
                  if (p.bio != null && p.bio!.isNotEmpty) ...[
                    Text('About', style: text.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text(p.bio!, style: text.bodyMedium),
                    const SizedBox(height: 24),
                  ],

                  // Organization
                  if (p.organization != null) ...[
                    _InfoTile(
                      icon: Icons.business,
                      title: 'Organization',
                      value: p.organization!,
                    ),
                    const SizedBox(height: 12),
                  ],

                  // Education
                  _InfoTile(
                    icon: Icons.school,
                    title: 'Education',
                    value: p.educationStatus,
                  ),
                  const SizedBox(height: 24),

                  // Looking for
                  if (p.lookingFor.isNotEmpty) ...[
                    Text('Looking for', style: text.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: p.lookingFor.map((item) => Chip(
                        label: Text(item),
                        backgroundColor: cs.primary.withValues(alpha: 0.1),
                        labelStyle: TextStyle(color: cs.primary),
                      )).toList(),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Work Experience Timeline
                  if (_workExperiences.isNotEmpty) ...[
                    WorkExperienceTimeline(
                      experiences: _workExperiences,
                      isEditable: false,
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Portfolio Showcase
                  if (_portfolioProjects.isNotEmpty) ...[
                    PortfolioShowcase(
                      projects: _portfolioProjects,
                      isEditable: false,
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Skills with Endorsements
                  if (p.skills.isNotEmpty) ...[
                    SkillEndorsements(
                      skills: p.skills,
                      endorsements: _endorsements,
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Interests
                  if (p.interests.isNotEmpty) ...[
                    Text('Interests', style: text.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: p.interests.map((interest) => Chip(
                        label: Text(interest),
                        backgroundColor: AppColors.accent.withValues(alpha: 0.1),
                        labelStyle: TextStyle(color: AppColors.accent),
                      )).toList(),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Badges
                  if (p.badges.isNotEmpty) ...[
                    Text('Badges', style: text.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: p.badges.map((badge) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              AppColors.amber500,
                              AppColors.amber500.withValues(alpha: 0.7),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.emoji_events, color: Colors.white, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              badge,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      )).toList(),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Mutual followers
                  if (_mutualFollowers.isNotEmpty) ...[
                    Text(
                      'Mutual Followers (${_mutualFollowers.length})',
                      style: text.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 80,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _mutualFollowers.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 12),
                        itemBuilder: (context, index) {
                          final mutual = _mutualFollowers[index];
                          return GestureDetector(
                            onTap: () => context.push(
                              '/impact/profile/${mutual.userId}',
                              extra: mutual,
                            ),
                            child: Column(
                              children: [
                                CircleAvatar(
                                  radius: 28,
                                  backgroundImage: mutual.avatarUrl != null
                                      ? NetworkImage(mutual.avatarUrl!)
                                      : null,
                                  child: mutual.avatarUrl == null
                                      ? Text(mutual.fullName[0])
                                      : null,
                                ),
                                const SizedBox(height: 4),
                                SizedBox(
                                  width: 64,
                                  child: Text(
                                    mutual.fullName.split(' ').first,
                                    textAlign: TextAlign.center,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: text.labelSmall,
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;

  const _InfoTile({
    required this.icon,
    required this.title,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: cs.primary, size: 20),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: text.labelSmall?.copyWith(color: AppColors.textMuted)),
              Text(value, style: text.bodyMedium?.copyWith(fontWeight: FontWeight.w500)),
            ],
          ),
        ],
      ),
    );
  }
}
