import 'package:flutter/material.dart';
import '../models/chat_group.dart';
import '../theme.dart';

/// A badge widget that displays a user's role in a group
class RoleBadge extends StatelessWidget {
  final GroupMemberRole role;
  final bool compact;

  const RoleBadge({
    super.key,
    required this.role,
    this.compact = false,
  });

  Color get _color {
    switch (role) {
      case GroupMemberRole.owner:
        return AppColors.amber500;
      case GroupMemberRole.admin:
        return AppColors.indigo500;
      case GroupMemberRole.moderator:
        return AppColors.emerald500;
      case GroupMemberRole.member:
        return Colors.grey;
    }
  }

  IconData? get _icon {
    switch (role) {
      case GroupMemberRole.owner:
        return Icons.star;
      case GroupMemberRole.admin:
        return Icons.shield;
      case GroupMemberRole.moderator:
        return Icons.verified_user;
      case GroupMemberRole.member:
        return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    // Don't show badge for regular members
    if (role == GroupMemberRole.member) {
      return const SizedBox.shrink();
    }

    if (compact) {
      return Container(
        width: 16,
        height: 16,
        decoration: BoxDecoration(
          color: _color.withOpacity(0.15),
          shape: BoxShape.circle,
        ),
        child: Icon(
          _icon,
          size: 10,
          color: _color,
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: _color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(
          color: _color.withOpacity(0.3),
          width: 0.5,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_icon != null) ...[
            Icon(
              _icon,
              size: 10,
              color: _color,
            ),
            const SizedBox(width: 3),
          ],
          Text(
            role.displayName,
            style: TextStyle(
              fontSize: 10,
              color: _color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

/// A smaller role indicator for message bubbles
class MessageRoleBadge extends StatelessWidget {
  final GroupMemberRole role;
  final bool mini;

  const MessageRoleBadge({
    super.key,
    required this.role,
    this.mini = false,
  });

  @override
  Widget build(BuildContext context) {
    // Don't show for regular members
    if (role == GroupMemberRole.member) {
      return const SizedBox.shrink();
    }

    final color = switch (role) {
      GroupMemberRole.owner => AppColors.amber500,
      GroupMemberRole.admin => AppColors.indigo500,
      GroupMemberRole.moderator => AppColors.emerald500,
      _ => Colors.grey,
    };

    final icon = switch (role) {
      GroupMemberRole.owner => Icons.star_rounded,
      GroupMemberRole.admin => Icons.shield_rounded,
      GroupMemberRole.moderator => Icons.verified_user_rounded,
      _ => null,
    };

    return Container(
      margin: const EdgeInsets.only(left: 4),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(3),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null)
            Icon(icon, size: 9, color: color),
          const SizedBox(width: 2),
          Text(
            role.displayName,
            style: TextStyle(
              fontSize: 9,
              color: color,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }
}
