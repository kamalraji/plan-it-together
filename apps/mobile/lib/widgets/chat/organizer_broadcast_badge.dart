import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// Priority levels for broadcast messages
enum BroadcastPriority {
  normal,
  important,
  urgent,
}

/// Badge indicating a message is an organizer broadcast.
/// 
/// Displays with different styling based on priority level:
/// - Normal: Subtle primary color
/// - Important: Warning/amber color
/// - Urgent: Error/red color with pulse animation
class OrganizerBroadcastBadge extends StatefulWidget {
  final BroadcastPriority priority;
  final bool compact;
  
  const OrganizerBroadcastBadge({
    super.key,
    this.priority = BroadcastPriority.normal,
    this.compact = false,
  });
  
  @override
  State<OrganizerBroadcastBadge> createState() => _OrganizerBroadcastBadgeState();
}

class _OrganizerBroadcastBadgeState extends State<OrganizerBroadcastBadge>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  
  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    
    if (widget.priority == BroadcastPriority.urgent) {
      _pulseController.repeat(reverse: true);
    }
  }
  
  @override
  void didUpdateWidget(OrganizerBroadcastBadge oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.priority == BroadcastPriority.urgent && !_pulseController.isAnimating) {
      _pulseController.repeat(reverse: true);
    } else if (widget.priority != BroadcastPriority.urgent && _pulseController.isAnimating) {
      _pulseController.stop();
      _pulseController.reset();
    }
  }
  
  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final config = _getConfig(theme);
    
    Widget badge = Container(
      padding: EdgeInsets.symmetric(
        horizontal: widget.compact ? 6 : 8,
        vertical: widget.compact ? 2 : 4,
      ),
      decoration: BoxDecoration(
        color: config.backgroundColor,
        borderRadius: BorderRadius.circular(widget.compact ? 4 : 6),
        border: Border.all(color: config.borderColor, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            config.icon,
            size: widget.compact ? 12 : 14,
            color: config.iconColor,
          ),
          if (!widget.compact) ...[
            const SizedBox(width: 4),
            Text(
              config.label,
              style: context.textStyles.labelSmall?.copyWith(
                color: config.textColor,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
    );
    
    if (widget.priority == BroadcastPriority.urgent) {
      return ScaleTransition(
        scale: _pulseAnimation,
        child: badge,
      );
    }
    
    return badge;
  }
  
  _BadgeConfig _getConfig(ThemeData theme) {
    switch (widget.priority) {
      case BroadcastPriority.urgent:
        return _BadgeConfig(
          backgroundColor: theme.colorScheme.errorContainer,
          borderColor: theme.colorScheme.error,
          iconColor: theme.colorScheme.error,
          textColor: theme.colorScheme.onErrorContainer,
          icon: Icons.priority_high_rounded,
          label: 'URGENT',
        );
      case BroadcastPriority.important:
        return _BadgeConfig(
          backgroundColor: theme.colorScheme.tertiaryContainer,
          borderColor: theme.colorScheme.tertiary,
          iconColor: theme.colorScheme.tertiary,
          textColor: theme.colorScheme.onTertiaryContainer,
          icon: Icons.campaign_rounded,
          label: 'IMPORTANT',
        );
      case BroadcastPriority.normal:
      default:
        return _BadgeConfig(
          backgroundColor: theme.colorScheme.primaryContainer.withOpacity(0.7),
          borderColor: theme.colorScheme.primary.withOpacity(0.5),
          iconColor: theme.colorScheme.primary,
          textColor: theme.colorScheme.onPrimaryContainer,
          icon: Icons.notifications_active_rounded,
          label: 'ANNOUNCEMENT',
        );
    }
  }
}

class _BadgeConfig {
  final Color backgroundColor;
  final Color borderColor;
  final Color iconColor;
  final Color textColor;
  final IconData icon;
  final String label;
  
  _BadgeConfig({
    required this.backgroundColor,
    required this.borderColor,
    required this.iconColor,
    required this.textColor,
    required this.icon,
    required this.label,
  });
}

/// Message bubble wrapper for broadcast messages.
/// 
/// Wraps the standard message bubble with broadcast-specific styling
/// including the priority badge and special visual treatment.
class BroadcastMessageWrapper extends StatelessWidget {
  final Widget child;
  final BroadcastPriority priority;
  final String senderName;
  final DateTime timestamp;
  
  const BroadcastMessageWrapper({
    super.key,
    required this.child,
    this.priority = BroadcastPriority.normal,
    required this.senderName,
    required this.timestamp,
  });
  
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final borderColor = _getBorderColor(theme);
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: borderColor.withOpacity(0.15),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header with badge
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: borderColor.withOpacity(0.1),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(11)),
            ),
            child: Row(
              children: [
                OrganizerBroadcastBadge(priority: priority),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    senderName,
                    style: context.textStyles.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Text(
                  _formatTime(timestamp),
                  style: context.textStyles.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          
          // Message content
          Padding(
            padding: const EdgeInsets.all(12),
            child: child,
          ),
        ],
      ),
    );
  }
  
  Color _getBorderColor(ThemeData theme) {
    switch (priority) {
      case BroadcastPriority.urgent:
        return theme.colorScheme.error;
      case BroadcastPriority.important:
        return theme.colorScheme.tertiary;
      case BroadcastPriority.normal:
      default:
        return theme.colorScheme.primary;
    }
  }
  
  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);
    
    if (diff.inMinutes < 1) {
      return 'Just now';
    } else if (diff.inHours < 1) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inDays < 1) {
      return '${diff.inHours}h ago';
    } else if (diff.inDays < 7) {
      return '${diff.inDays}d ago';
    } else {
      return '${time.month}/${time.day}';
    }
  }
}

/// Extension to parse priority from message metadata
extension BroadcastPriorityExt on String {
  BroadcastPriority toBroadcastPriority() {
    switch (toLowerCase()) {
      case 'urgent':
        return BroadcastPriority.urgent;
      case 'important':
        return BroadcastPriority.important;
      default:
        return BroadcastPriority.normal;
    }
  }
}
