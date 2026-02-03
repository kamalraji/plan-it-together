import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/follower.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/follows_you_badge.dart';

/// Card widget for displaying a follower/following user
class FollowerCard extends StatelessWidget {
  final Follower follower;
  final VoidCallback? onTap;
  final VoidCallback? onRemove;
  final VoidCallback? onMessage;
  final VoidCallback? onUnfollow;
  final bool isFollowing; // true if this is in "Following" list
  final bool showActions;

  const FollowerCard({
    super.key,
    required this.follower,
    this.onTap,
    this.onRemove,
    this.onMessage,
    this.onUnfollow,
    this.isFollowing = false,
    this.showActions = true,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap?.call();
      },
      child: Container(
        margin: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs,
        ),
        decoration: BoxDecoration(
          color: cs.surface.withOpacity(0.8),
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(
            color: cs.outline.withOpacity(0.1),
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Row(
                children: [
                  // Avatar with online indicator
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: cs.primary.withOpacity(0.1),
                        backgroundImage: follower.otherUserAvatar != null
                            ? NetworkImage(follower.otherUserAvatar!)
                            : null,
                        child: follower.otherUserAvatar == null
                            ? Text(
                                follower.otherUserName.isNotEmpty
                                    ? follower.otherUserName[0].toUpperCase()
                                    : '?',
                                style: TextStyle(
                                  color: cs.primary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 20,
                                ),
                              )
                            : null,
                      ),
                      if (follower.isOnline)
                        Positioned(
                          bottom: 2,
                          right: 2,
                          child: Container(
                            width: 14,
                            height: 14,
                            decoration: BoxDecoration(
                              color: AppColors.success,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: cs.surface,
                                width: 2,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(width: AppSpacing.md),

                  // User info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                follower.otherUserName,
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            // Show mutual badge for followers who we also follow
                            if (follower.isMutual || follower.followsMe) ...[
                              const SizedBox(width: 8),
                              FollowsYouChip(isMutual: follower.isMutual),
                            ],
                          ],
                        ),
                        if (follower.otherUserHeadline != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            follower.otherUserHeadline!,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: cs.onSurface.withOpacity(0.7),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                        if (follower.otherUserOrganization != null) ...[
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              Icon(
                                Icons.business_outlined,
                                size: 12,
                                color: cs.onSurface.withOpacity(0.5),
                              ),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  follower.otherUserOrganization!,
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: cs.onSurface.withOpacity(0.5),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),

                  // Actions
                  if (showActions) _buildActions(context, cs),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildActions(BuildContext context, ColorScheme cs) {
    if (isFollowing) {
      // Following list - show Unfollow button
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (onMessage != null)
            IconButton(
              onPressed: () {
                HapticFeedback.lightImpact();
                onMessage?.call();
              },
              icon: Icon(
                Icons.chat_bubble_outline,
                color: cs.primary,
              ),
              tooltip: 'Message',
            ),
          if (onUnfollow != null)
            TextButton(
              onPressed: () {
                HapticFeedback.mediumImpact();
                onUnfollow?.call();
              },
              style: TextButton.styleFrom(
                backgroundColor: cs.outline.withOpacity(0.1),
                foregroundColor: cs.onSurface,
              ),
              child: const Text('Following'),
            ),
        ],
      );
    } else {
      // Followers list - show Remove button
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (onMessage != null)
            IconButton(
              onPressed: () {
                HapticFeedback.lightImpact();
                onMessage?.call();
              },
              icon: Icon(
                Icons.chat_bubble_outline,
                color: cs.primary,
              ),
              tooltip: 'Message',
            ),
          if (onRemove != null)
            TextButton(
              onPressed: () {
                HapticFeedback.mediumImpact();
                _showRemoveConfirmation(context);
              },
              style: TextButton.styleFrom(
                backgroundColor: cs.outline.withOpacity(0.1),
                foregroundColor: cs.onSurface,
              ),
              child: const Text('Remove'),
            ),
        ],
      );
    }
  }

  void _showRemoveConfirmation(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Follower?'),
        content: Text(
          '${follower.otherUserName} will no longer be able to see your posts. They won\'t be notified.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              onRemove?.call();
            },
            style: TextButton.styleFrom(
              foregroundColor: cs.error,
            ),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
  }
}

/// Card widget for displaying a pending follow request
class FollowRequestCard extends StatelessWidget {
  final FollowRequest request;
  final VoidCallback? onTap;
  final VoidCallback? onAccept;
  final VoidCallback? onDecline;

  const FollowRequestCard({
    super.key,
    required this.request,
    this.onTap,
    this.onAccept,
    this.onDecline,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap?.call();
      },
      child: Container(
        margin: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs,
        ),
        decoration: BoxDecoration(
          color: cs.surface.withOpacity(0.8),
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(
            color: cs.primary.withOpacity(0.2),
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Row(
                children: [
                  // Avatar
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: cs.primary.withOpacity(0.1),
                    backgroundImage: request.requesterAvatar != null
                        ? NetworkImage(request.requesterAvatar!)
                        : null,
                    child: request.requesterAvatar == null
                        ? Text(
                            request.requesterName.isNotEmpty
                                ? request.requesterName[0].toUpperCase()
                                : '?',
                            style: TextStyle(
                              color: cs.primary,
                              fontWeight: FontWeight.bold,
                              fontSize: 20,
                            ),
                          )
                        : null,
                  ),
                  const SizedBox(width: AppSpacing.md),

                  // User info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          request.requesterName,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (request.requesterHeadline != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            request.requesterHeadline!,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: cs.onSurface.withOpacity(0.7),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                        const SizedBox(height: 4),
                        Text(
                          'wants to follow you',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: cs.primary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Accept/Decline buttons
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Decline button
                      IconButton(
                        onPressed: () {
                          HapticFeedback.mediumImpact();
                          onDecline?.call();
                        },
                        icon: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: cs.outline.withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.close,
                            color: cs.onSurface.withOpacity(0.7),
                            size: 18,
                          ),
                        ),
                        tooltip: 'Decline',
                      ),
                      // Accept button
                      IconButton(
                        onPressed: () {
                          HapticFeedback.mediumImpact();
                          onAccept?.call();
                        },
                        icon: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: cs.primary,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.check,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                        tooltip: 'Accept',
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Card widget for suggesting a user to follow
class SuggestedUserCard extends StatelessWidget {
  final Map<String, dynamic> profile;
  final VoidCallback? onTap;
  final VoidCallback? onFollow;
  final VoidCallback? onDismiss;

  const SuggestedUserCard({
    super.key,
    required this.profile,
    this.onTap,
    this.onFollow,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final name = profile['full_name'] as String? ?? 'Unknown';
    final avatar = profile['avatar_url'] as String?;
    final headline = profile['headline'] as String?;
    final isOnline = profile['is_online'] as bool? ?? false;

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap?.call();
      },
      child: Container(
        margin: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs,
        ),
        decoration: BoxDecoration(
          color: cs.surface.withOpacity(0.8),
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(
            color: cs.outline.withOpacity(0.1),
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Row(
                children: [
                  // Avatar with online indicator
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: cs.primary.withOpacity(0.1),
                        backgroundImage: avatar != null
                            ? NetworkImage(avatar)
                            : null,
                        child: avatar == null
                            ? Text(
                                name.isNotEmpty ? name[0].toUpperCase() : '?',
                                style: TextStyle(
                                  color: cs.primary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 20,
                                ),
                              )
                            : null,
                      ),
                      if (isOnline)
                        Positioned(
                          bottom: 2,
                          right: 2,
                          child: Container(
                            width: 14,
                            height: 14,
                            decoration: BoxDecoration(
                              color: AppColors.success,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: cs.surface,
                                width: 2,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(width: AppSpacing.md),

                  // User info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (headline != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            headline,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: cs.onSurface.withOpacity(0.7),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                        const SizedBox(height: 4),
                        Text(
                          'Suggested for you',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: cs.onSurface.withOpacity(0.5),
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Actions
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (onDismiss != null)
                        IconButton(
                          onPressed: () {
                            HapticFeedback.lightImpact();
                            onDismiss?.call();
                          },
                          icon: Icon(
                            Icons.close,
                            color: cs.onSurface.withOpacity(0.5),
                          ),
                          tooltip: 'Dismiss',
                        ),
                      if (onFollow != null)
                        ElevatedButton(
                          onPressed: () {
                            HapticFeedback.mediumImpact();
                            onFollow?.call();
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: cs.primary,
                            foregroundColor: cs.onPrimary,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                          ),
                          child: const Text('Follow'),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
