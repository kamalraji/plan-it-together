import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/styled_avatar.dart';
import 'package:thittam1hub/widgets/styled_badge.dart';
import 'package:thittam1hub/widgets/unread_badge.dart';

/// App bar for DM and channel chat threads.
/// 
/// Displays user/channel info with online status, search, and starred message actions.
/// Supports Hero transitions for smooth avatar animations.
class ThreadAppBar extends StatelessWidget {
  final WorkspaceChannel? channel;
  final String? dmUserName;
  final String? dmUserAvatar;
  final String? channelId;
  final VoidCallback? onSearchTap;
  final VoidCallback? onStarredTap;
  final VoidCallback? onMoreTap;
  
  const ThreadAppBar({
    super.key,
    this.channel, 
    this.dmUserName, 
    this.dmUserAvatar,
    this.channelId,
    this.onSearchTap,
    this.onStarredTap,
    this.onMoreTap,
  });
  
  bool get _isDM => dmUserName != null;
  
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        border: Border(
          bottom: BorderSide(color: theme.colorScheme.outline.withValues(alpha: 0.2)),
        ),
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, size: 20),
            onPressed: () => context.pop(),
          ),
          const SizedBox(width: 4),
          
          if (_isDM) ...[
            _DMAvatar(
              userName: dmUserName!,
              avatarUrl: dmUserAvatar,
              channelId: channelId,
            ),
            const SizedBox(width: 12),
          ],
          
          Expanded(
            child: _isDM
                ? _DMUserInfo(userName: dmUserName!)
                : _ChannelInfo(channel: channel),
          ),
          
          IconButton(
            icon: Icon(
              Icons.search,
              color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
              size: 22,
            ),
            onPressed: onSearchTap,
          ),
          IconButton(
            icon: Icon(
              Icons.star_border,
              color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
              size: 22,
            ),
            onPressed: onStarredTap,
          ),
          IconButton(
            icon: Icon(
              Icons.more_vert,
              color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
            ),
            onPressed: onMoreTap,
          ),
        ],
      ),
    );
  }
}

/// DM user avatar with online indicator - uses StyledAvatar for consistency
/// Supports Hero transitions for smooth navigation animations
class _DMAvatar extends StatelessWidget {
  final String userName;
  final String? avatarUrl;
  final String? channelId;

  const _DMAvatar({
    required this.userName,
    this.avatarUrl,
    this.channelId,
  });

  @override
  Widget build(BuildContext context) {
    final avatar = Stack(
      clipBehavior: Clip.none,
      children: [
        StyledAvatar(
          url: avatarUrl,
          name: userName,
          size: 40,
        ),
        const Positioned(
          right: -2,
          bottom: -2,
          child: OnlineIndicator(isOnline: true, size: 12),
        ),
      ],
    );
    
    // Wrap in Hero if channelId is provided for smooth transitions
    if (channelId != null) {
      return Hero(
        tag: 'chat_avatar_$channelId',
        child: avatar,
      );
    }
    
    return avatar;
  }
}

/// DM user info section
class _DMUserInfo extends StatelessWidget {
  final String userName;

  const _DMUserInfo({required this.userName});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          userName,
          style: context.textStyles.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          overflow: TextOverflow.ellipsis,
        ),
        Row(
          children: [
            Container(
              width: 6,
              height: 6,
              decoration: const BoxDecoration(
                color: AppColors.success,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              'Online',
              style: context.textStyles.bodySmall?.copyWith(
                color: AppColors.success,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

/// Channel info section
class _ChannelInfo extends StatelessWidget {
  final WorkspaceChannel? channel;

  const _ChannelInfo({this.channel});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Flexible(
              child: Text(
                '#${channel?.name ?? 'channel'}',
                style: context.textStyles.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (channel?.isPrivate == true) ...[
              const SizedBox(width: 6),
              StyledBadge.private(),
            ],
          ],
        ),
        if ((channel?.description ?? '').isNotEmpty)
          Text(
            channel!.description!,
            style: context.textStyles.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
      ],
    );
  }
}

// _PrivateBadge removed - use StyledBadge.private() from lib/widgets/styled_badge.dart
