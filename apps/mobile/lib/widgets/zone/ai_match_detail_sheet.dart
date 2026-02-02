import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../models/networking_models.dart';
import '../../models/impact_profile.dart';
import '../../supabase/networking_service.dart';
import '../../services/interaction_tracking_service.dart';
import '../styled_avatar.dart';
import '../follows_you_badge.dart';

/// Full-screen bottom sheet showing detailed AI match insights
class AIMatchDetailSheet extends StatefulWidget {
  final SmartMatch match;
  final VoidCallback? onSayHi;
  final VoidCallback? onScheduleMeeting;
  final VoidCallback? onViewProfile;

  const AIMatchDetailSheet({
    super.key,
    required this.match,
    this.onSayHi,
    this.onScheduleMeeting,
    this.onViewProfile,
  });

  static Future<void> show(
    BuildContext context, {
    required SmartMatch match,
    VoidCallback? onSayHi,
    VoidCallback? onScheduleMeeting,
    VoidCallback? onViewProfile,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => AIMatchDetailSheet(
        match: match,
        onSayHi: onSayHi,
        onScheduleMeeting: onScheduleMeeting,
        onViewProfile: onViewProfile,
      ),
    );
  }

  @override
  State<AIMatchDetailSheet> createState() => _AIMatchDetailSheetState();
}

class _AIMatchDetailSheetState extends State<AIMatchDetailSheet> {
  final NetworkingService _networkingService = NetworkingService();
  final InteractionTrackingService _tracking = InteractionTrackingService.instance;
  Map<String, dynamic>? _matchExplanation;
  bool _isLoadingExplanation = false;

  @override
  void initState() {
    super.initState();
    _loadMatchExplanation();
    _trackDetailOpen();
  }

  void _trackDetailOpen() {
    _tracking.trackAIMatchDetailOpen(
      targetUserId: widget.match.profile.userId,
      matchScore: widget.match.matchScore,
      matchCategory: widget.match.matchCategory,
    );
  }

  Future<void> _loadMatchExplanation() async {
    if (_isLoadingExplanation) return;
    setState(() => _isLoadingExplanation = true);

    try {
      final explanation = await _networkingService.getMatchExplanation(
        widget.match.profile.userId,
      );
      if (mounted) {
        setState(() {
          _matchExplanation = explanation;
          _isLoadingExplanation = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingExplanation = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;
    final match = widget.match;
    final profile = match.profile;

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: Container(
              decoration: BoxDecoration(
                color: (isDark ? Colors.black : Colors.white).withOpacity(0.95),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                border: Border.all(
                  color: cs.outline.withOpacity(0.2),
                ),
              ),
              child: ListView(
                controller: scrollController,
                padding: EdgeInsets.zero,
                children: [
                  // Drag handle
                  Center(
                    child: Container(
                      margin: const EdgeInsets.only(top: 12),
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: cs.outlineVariant,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),

                  // Profile header
                  _buildProfileHeader(theme, cs, profile, match),

                  // Match score section
                  _buildMatchScoreSection(theme, cs, match),

                  // AI Narrative
                  if (match.matchNarrative != null || _matchExplanation?['explanation'] != null)
                    _buildNarrativeSection(theme, cs, match),

                  // Conversation starters
                  _buildConversationStarters(theme, cs, match),

                  // Common ground section
                  _buildCommonGround(theme, cs, match),

                  // Collaboration ideas
                  if (match.collaborationIdeas.isNotEmpty || 
                      (_matchExplanation?['collaboration_ideas'] as List?)?.isNotEmpty == true)
                    _buildCollaborationIdeas(theme, cs, match),

                  // Action buttons
                  _buildActionButtons(theme, cs),

                  SizedBox(height: MediaQuery.of(context).padding.bottom + 16),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildProfileHeader(ThemeData theme, ColorScheme cs, ImpactProfile profile, SmartMatch match) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Avatar with online indicator
          Stack(
            children: [
              StyledAvatar(
                imageUrl: profile.avatarUrl,
                name: profile.fullName,
                size: 80,
              ),
              if (match.isOnline)
                Positioned(
                  right: 4,
                  bottom: 4,
                  child: Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      color: Colors.green,
                      shape: BoxShape.circle,
                      border: Border.all(color: theme.cardColor, width: 3),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),

          // Name with badges
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                profile.fullName,
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (profile.isVerified) ...[
                const SizedBox(width: 8),
                Icon(Icons.verified, size: 20, color: cs.primary),
              ],
            ],
          ),

          if (match.followsYou) ...[
            const SizedBox(height: 8),
            const FollowsYouChip(),
          ],

          if (profile.headline.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              profile.headline,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: cs.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
          ],

          if (profile.organization != null) ...[
            const SizedBox(height: 2),
            Text(
              profile.organization!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: cs.onSurfaceVariant.withOpacity(0.7),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMatchScoreSection(ThemeData theme, ColorScheme cs, SmartMatch match) {
    final score = match.matchScore;
    final category = match.matchCategory ?? 'discovery';
    
    Color scoreColor;
    String scoreLabel;
    IconData scoreIcon;

    if (score >= 85) {
      scoreColor = Colors.green;
      scoreLabel = 'Excellent Match';
      scoreIcon = Icons.local_fire_department_rounded;
    } else if (score >= 70) {
      scoreColor = Colors.teal;
      scoreLabel = 'Strong Match';
      scoreIcon = Icons.star_rounded;
    } else if (score >= 50) {
      scoreColor = Colors.orange;
      scoreLabel = 'Good Match';
      scoreIcon = Icons.thumb_up_rounded;
    } else {
      scoreColor = cs.primary;
      scoreLabel = 'Potential Match';
      scoreIcon = Icons.person_add_rounded;
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            scoreColor.withOpacity(0.15),
            scoreColor.withOpacity(0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scoreColor.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [scoreColor, scoreColor.withOpacity(0.7)],
                  ),
                ),
                child: Center(
                  child: Text(
                    '$score%',
                    style: theme.textTheme.titleLarge?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(scoreIcon, color: scoreColor, size: 20),
                      const SizedBox(width: 6),
                      Text(
                        scoreLabel,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: scoreColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _getCategoryLabel(category),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Score breakdown
          if (match.embeddingSimilarity != null || match.interactionScore != null) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.center,
              children: [
                if (match.embeddingSimilarity != null)
                  _buildScoreChip('Profile', match.embeddingSimilarity!, Icons.person_outline, cs),
                if (match.interactionScore != null && match.interactionScore! > 0)
                  _buildScoreChip('Engagement', match.interactionScore!, Icons.touch_app_outlined, cs),
                if (match.freshnessScore != null)
                  _buildScoreChip('Active', match.freshnessScore!, Icons.schedule_outlined, cs),
                if (match.reciprocityScore != null && match.reciprocityScore! > 0)
                  _buildScoreChip('Mutual', match.reciprocityScore!, Icons.swap_horiz_rounded, cs),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildScoreChip(String label, double value, IconData icon, ColorScheme cs) {
    final percentage = (value * 100).round();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: cs.onSurfaceVariant),
          const SizedBox(width: 4),
          Text(
            '$label: $percentage%',
            style: TextStyle(
              fontSize: 12,
              color: cs.onSurfaceVariant,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNarrativeSection(ThemeData theme, ColorScheme cs, SmartMatch match) {
    final narrative = match.matchNarrative ?? 
        _matchExplanation?['explanation'] as String? ?? '';
    
    if (narrative.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.primaryContainer.withOpacity(0.3),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cs.primary.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.auto_awesome, size: 18, color: cs.primary),
              const SizedBox(width: 8),
              Text(
                'Why You Match',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: cs.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            narrative,
            style: theme.textTheme.bodyMedium?.copyWith(
              height: 1.5,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConversationStarters(ThemeData theme, ColorScheme cs, SmartMatch match) {
    List<String> starters = match.conversationStarters.isNotEmpty 
        ? match.conversationStarters 
        : List<String>.from(_matchExplanation?['conversation_starters'] ?? []);

    if (starters.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.chat_bubble_outline, size: 18, color: cs.secondary),
              const SizedBox(width: 8),
              Text(
                'Conversation Starters',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...starters.take(3).indexed.map((entry) => _buildStarterCard(theme, cs, entry.$2, index: entry.$1)),
        ],
      ),
    );
  }

  Widget _buildStarterCard(ThemeData theme, ColorScheme cs, String starter, {int index = 0}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: cs.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: () {
            // Track conversation starter tap
            _tracking.trackConversationStarterTap(
              targetUserId: widget.match.profile.userId,
              starterPreview: starter,
              starterIndex: index,
            );
            
            Clipboard.setData(ClipboardData(text: starter));
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Copied to clipboard!'),
                duration: Duration(seconds: 1),
              ),
            );
          },
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Icon(Icons.format_quote, size: 20, color: cs.onSurfaceVariant),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    starter,
                    style: theme.textTheme.bodyMedium,
                  ),
                ),
                Icon(Icons.copy, size: 16, color: cs.onSurfaceVariant.withOpacity(0.5)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCommonGround(ThemeData theme, ColorScheme cs, SmartMatch match) {
    final hasSkills = match.commonSkills.isNotEmpty;
    final hasInterests = match.commonInterests.isNotEmpty;

    if (!hasSkills && !hasInterests) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.handshake_outlined, size: 18, color: cs.tertiary),
              const SizedBox(width: 8),
              Text(
                'Common Ground',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          if (hasSkills) ...[
            Text(
              'Shared Skills',
              style: theme.textTheme.labelMedium?.copyWith(
                color: cs.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: match.commonSkills.map((skill) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.blue.withOpacity(0.3)),
                ),
                child: Text(
                  skill,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Colors.blue,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              )).toList(),
            ),
            const SizedBox(height: 16),
          ],

          if (hasInterests) ...[
            Text(
              'Shared Interests',
              style: theme.textTheme.labelMedium?.copyWith(
                color: cs.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: match.commonInterests.map((interest) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.purple.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.purple.withOpacity(0.3)),
                ),
                child: Text(
                  interest,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Colors.purple,
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

  Widget _buildCollaborationIdeas(ThemeData theme, ColorScheme cs, SmartMatch match) {
    List<String> ideas = match.collaborationIdeas.isNotEmpty 
        ? match.collaborationIdeas 
        : List<String>.from(_matchExplanation?['collaboration_ideas'] ?? []);

    if (ideas.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.lightbulb_outline, size: 18, color: Colors.amber),
              const SizedBox(width: 8),
              Text(
                'Collaboration Ideas',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...ideas.take(3).toList().asMap().entries.map((entry) => _buildCollaborationIdeaCard(
            theme, cs, entry.value, entry.key,
          )),
        ],
      ),
    );
  }

  Widget _buildCollaborationIdeaCard(ThemeData theme, ColorScheme cs, String idea, int index) {
    return GestureDetector(
      onTap: () {
        // Track collaboration idea tap
        _tracking.trackCollaborationIdeaTap(
          targetUserId: widget.match.profile.userId,
          ideaPreview: idea,
          ideaIndex: index,
        );
        
        HapticFeedback.lightImpact();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Great idea! Start a conversation about this.'),
            action: SnackBarAction(
              label: 'Say Hi',
              onPressed: () {
                Navigator.pop(context);
                widget.onSayHi?.call();
              },
            ),
            duration: const Duration(seconds: 3),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.amber.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.amber.withOpacity(0.3)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  '${index + 1}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.amber,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                idea,
                style: theme.textTheme.bodyMedium,
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              size: 14,
              color: Colors.amber.withOpacity(0.5),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons(ThemeData theme, ColorScheme cs) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 24, 20, 0),
      child: Column(
        children: [
          // Primary action
          FilledButton.icon(
            onPressed: () {
              Navigator.pop(context);
              widget.onSayHi?.call();
            },
            icon: const Icon(Icons.chat_bubble_rounded),
            label: Text(widget.match.followsYou ? 'Say Hi Back!' : 'Say Hi'),
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(48),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Secondary actions
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    widget.onScheduleMeeting?.call();
                  },
                  icon: const Icon(Icons.calendar_today_outlined),
                  label: const Text('Schedule'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(44),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    widget.onViewProfile?.call();
                  },
                  icon: const Icon(Icons.person_outline),
                  label: const Text('Profile'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(44),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _getCategoryLabel(String category) {
    switch (category) {
      case 'professional':
        return 'Professional synergy detected';
      case 'mutual_interest':
        return 'Mutual connections & interests';
      case 'similar_background':
        return 'Similar background & experience';
      case 'event_connection':
        return 'Connected through events';
      default:
        return 'New potential connection';
    }
  }
}
