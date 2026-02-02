import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:thittam1hub/models/chat_group.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/styled_badge.dart';

/// App bar for group chat threads.
/// 
/// Displays group icon, name, member count, and action buttons.
class GroupAppBar extends StatelessWidget {
  final ChatGroup? group;
  final String groupId;
  final VoidCallback onSettingsTap;
  final VoidCallback? onSearchTap;
  final VoidCallback? onStarredTap;
  
  const GroupAppBar({
    super.key,
    this.group,
    required this.groupId,
    required this.onSettingsTap,
    this.onSearchTap,
    this.onStarredTap,
  });
  
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
          
          // Group icon
          _GroupIcon(group: group),
          const SizedBox(width: 12),
          
          Expanded(
            child: _GroupInfo(group: group),
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
              Icons.settings_outlined,
              color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
            ),
            onPressed: onSettingsTap,
          ),
        ],
      ),
    );
  }
}

/// Group icon widget
class _GroupIcon extends StatelessWidget {
  final ChatGroup? group;

  const _GroupIcon({this.group});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: theme.colorScheme.primary.withValues(alpha: 0.1),
      ),
      clipBehavior: Clip.antiAlias,
      child: group?.iconUrl != null && group!.iconUrl!.isNotEmpty
          ? CachedNetworkImage(
              imageUrl: group!.iconUrl!,
              fit: BoxFit.cover,
              placeholder: (_, __) => _GroupInitial(name: group!.name, theme: theme),
              errorWidget: (_, __, ___) => _GroupInitial(name: group!.name, theme: theme),
            )
          : _GroupInitial(name: group?.name ?? 'Group', theme: theme),
    );
  }
}

/// Group initial/placeholder widget
class _GroupInitial extends StatelessWidget {
  final String name;
  final ThemeData theme;

  const _GroupInitial({
    required this.name,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: theme.colorScheme.primary.withValues(alpha: 0.15),
      child: Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : 'G',
          style: TextStyle(
            color: theme.colorScheme.primary,
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
      ),
    );
  }
}

/// Group info section with name and member count
class _GroupInfo extends StatelessWidget {
  final ChatGroup? group;

  const _GroupInfo({this.group});

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
                group?.name ?? 'Group Chat',
                style: context.textStyles.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (group?.isPublic == false) ...[
              const SizedBox(width: 6),
              StyledBadge.private(),
            ],
          ],
        ),
        Text(
          '${group?.memberCount ?? 0} members',
          style: context.textStyles.bodySmall?.copyWith(
            color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
          ),
        ),
      ],
    );
  }
}

// _PrivateGroupBadge removed - use StyledBadge.private() from lib/widgets/styled_badge.dart
// Example: StyledBadge.private()
