import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// A standard, theme-aware empty state component.
/// 
/// For premium animated experiences, use `EnhancedEmptyState` instead.
/// 
/// Factory constructors provide common presets:
/// - `StyledEmptyState.noResults()` - No search results
/// - `StyledEmptyState.noData()` - No data available
/// - `StyledEmptyState.noConnection()` - Network error
/// - `StyledEmptyState.noPermission()` - Access denied
/// 
/// Usage:
/// ```dart
/// StyledEmptyState.noResults(
///   query: 'flutter',
///   onAction: () => _clearSearch(),
/// )
/// ```
class StyledEmptyState extends StatelessWidget {
  /// The icon to display
  final IconData icon;
  
  /// The title text
  final String title;
  
  /// Optional subtitle text
  final String? subtitle;
  
  /// Optional action widget (typically a button)
  final Widget? action;
  
  /// Optional icon color (defaults to primary)
  final Color? iconColor;
  
  /// Whether to use compact layout
  final bool compact;
  
  /// Whether to use inline card layout (with border and background)
  final bool inline;

  const StyledEmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.action,
    this.iconColor,
    this.compact = false,
    this.inline = false,
  });
  
  /// Inline empty state for embedded sections (portfolio, work experience, etc.)
  factory StyledEmptyState.inline({
    Key? key,
    required IconData icon,
    required String title,
    String? message,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    return StyledEmptyState(
      key: key,
      icon: icon,
      title: title,
      subtitle: message,
      inline: true,
      action: onAction != null
          ? Builder(
              builder: (context) => TextButton.icon(
                onPressed: onAction,
                icon: const Icon(Icons.add),
                label: Text(actionLabel ?? 'Add'),
              ),
            )
          : null,
    );
  }

  /// Empty state for no search results
  factory StyledEmptyState.noResults({
    Key? key,
    String? query,
    VoidCallback? onAction,
    String? actionLabel,
  }) {
    return StyledEmptyState(
      key: key,
      icon: Icons.search_off_rounded,
      title: 'No results found',
      subtitle: query != null
          ? 'No matches for "$query"'
          : 'Try adjusting your search',
      action: onAction != null
          ? _EmptyStateActionButton(
              label: actionLabel ?? 'Clear search',
              onPressed: onAction,
            )
          : null,
    );
  }

  /// Empty state for no data
  factory StyledEmptyState.noData({
    Key? key,
    String? message,
    String? title,
    IconData? icon,
    VoidCallback? onRefresh,
  }) {
    return StyledEmptyState(
      key: key,
      icon: icon ?? Icons.inbox_outlined,
      title: title ?? 'Nothing here yet',
      subtitle: message ?? 'Check back later',
      action: onRefresh != null
          ? _EmptyStateActionButton(
              label: 'Refresh',
              icon: Icons.refresh,
              onPressed: onRefresh,
            )
          : null,
    );
  }

  /// Empty state for network error
  factory StyledEmptyState.noConnection({
    Key? key,
    VoidCallback? onRetry,
  }) {
    return StyledEmptyState(
      key: key,
      icon: Icons.wifi_off_rounded,
      title: 'No connection',
      subtitle: 'Check your internet and try again',
      action: onRetry != null
          ? _EmptyStateActionButton(
              label: 'Try again',
              icon: Icons.refresh,
              onPressed: onRetry,
            )
          : null,
    );
  }

  /// Empty state for permission denied
  factory StyledEmptyState.noPermission({
    Key? key,
    String? message,
  }) {
    return StyledEmptyState(
      key: key,
      icon: Icons.lock_outline_rounded,
      title: 'Access denied',
      subtitle: message ?? "You don't have permission to view this",
    );
  }

  /// Empty state for error
  factory StyledEmptyState.error({
    Key? key,
    String? message,
    VoidCallback? onRetry,
  }) {
    return StyledEmptyState(
      key: key,
      icon: Icons.error_outline_rounded,
      title: 'Something went wrong',
      subtitle: message ?? 'An unexpected error occurred',
      iconColor: null, // Will use error color
      action: onRetry != null
          ? _EmptyStateActionButton(
              label: 'Try again',
              icon: Icons.refresh,
              onPressed: onRetry,
              isError: true,
            )
          : null,
    );
  }

  // ============================================================================
  // CHAT-SPECIFIC FACTORY CONSTRUCTORS
  // ============================================================================

  /// Empty state for no messages in a conversation thread
  factory StyledEmptyState.noMessages({
    Key? key,
    String? title,
    String? message,
  }) {
    return StyledEmptyState(
      key: key,
      icon: Icons.chat_bubble_outline_rounded,
      title: title ?? 'Start the conversation',
      subtitle: message ?? 'Be the first to send a message!',
    );
  }

  /// Empty state for no DM conversations
  factory StyledEmptyState.noConversations({
    Key? key,
    String? message,
    VoidCallback? onStartChat,
  }) {
    return StyledEmptyState(
      key: key,
      icon: Icons.forum_outlined,
      title: 'No conversations yet',
      subtitle: message ?? 'Start chatting with someone!',
      action: onStartChat != null
          ? _EmptyStateActionButton(
              label: 'Start a chat',
              icon: Icons.add_comment_outlined,
              onPressed: onStartChat,
            )
          : null,
    );
  }

  /// Empty state for no groups
  factory StyledEmptyState.noGroups({
    Key? key,
    String? message,
    VoidCallback? onCreateGroup,
  }) {
    return StyledEmptyState(
      key: key,
      icon: Icons.groups_outlined,
      title: 'No groups yet',
      subtitle: message ?? 'Create or join a group to start chatting',
      action: onCreateGroup != null
          ? _EmptyStateActionButton(
              label: 'Create group',
              icon: Icons.group_add_outlined,
              onPressed: onCreateGroup,
            )
          : null,
    );
  }

  /// Empty state for no channels
  factory StyledEmptyState.noChannels({
    Key? key,
    String? message,
    VoidCallback? onBrowseChannels,
  }) {
    return StyledEmptyState(
      key: key,
      icon: Icons.tag_rounded,
      title: 'No channels',
      subtitle: message ?? 'Join a channel to participate in discussions',
      action: onBrowseChannels != null
          ? _EmptyStateActionButton(
              label: 'Browse channels',
              icon: Icons.explore_outlined,
              onPressed: onBrowseChannels,
            )
          : null,
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isError = icon == Icons.error_outline_rounded;
    
    final effectiveIconColor = iconColor ?? 
        (isError ? cs.error : cs.onSurfaceVariant);
    
    // Inline variant uses smaller, card-embedded layout
    if (inline) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest.withOpacity(0.5),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: cs.outlineVariant.withOpacity(0.3)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 48, color: effectiveIconColor),
            const SizedBox(height: 12),
            Text(
              title,
              style: context.textStyles.bodyMedium?.copyWith(
                color: cs.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            if (action != null) ...[
              const SizedBox(height: 12),
              action!,
            ],
          ],
        ),
      );
    }
    
    final double iconContainerSize = compact ? 56 : 72;
    final double iconSize = compact ? 28 : 36;

    return Center(
      child: Padding(
        padding: EdgeInsets.all(compact ? AppSpacing.md : AppSpacing.xl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon container
            Container(
              width: iconContainerSize,
              height: iconContainerSize,
              decoration: BoxDecoration(
                color: effectiveIconColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: iconSize,
                color: effectiveIconColor,
              ),
            ),
            SizedBox(height: compact ? AppSpacing.md : AppSpacing.lg),
            
            // Title
            Text(
              title,
              style: compact
                  ? context.textStyles.titleSmall?.copyWith(
                      color: cs.onSurface,
                      fontWeight: FontWeight.w600,
                    )
                  : context.textStyles.titleMedium?.copyWith(
                      color: cs.onSurface,
                      fontWeight: FontWeight.w600,
                    ),
              textAlign: TextAlign.center,
            ),
            
            // Subtitle
            if (subtitle != null) ...[
              SizedBox(height: compact ? AppSpacing.xs : AppSpacing.sm),
              Text(
                subtitle!,
                style: context.textStyles.bodyMedium?.copyWith(
                  color: cs.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            
            // Action
            if (action != null) ...[
              SizedBox(height: compact ? AppSpacing.md : AppSpacing.lg),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

/// Internal action button for empty states
class _EmptyStateActionButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback onPressed;
  final bool isError;

  const _EmptyStateActionButton({
    required this.label,
    this.icon,
    required this.onPressed,
    this.isError = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    if (icon != null) {
      return FilledButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, size: 18),
        label: Text(label),
        style: FilledButton.styleFrom(
          backgroundColor: isError ? cs.error : cs.primary,
          foregroundColor: isError ? cs.onError : cs.onPrimary,
        ),
      );
    }
    
    return FilledButton(
      onPressed: onPressed,
      style: FilledButton.styleFrom(
        backgroundColor: isError ? cs.error : cs.primary,
        foregroundColor: isError ? cs.onError : cs.onPrimary,
      ),
      child: Text(label),
    );
  }
}
