import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/chat_group.dart';
import 'package:thittam1hub/theme.dart';

/// Horizontal bar displaying grouped message reactions
class ReactionsBar extends StatelessWidget {
  final List<Map<String, dynamic>> reactions;
  final Function(String)? onReaction;

  const ReactionsBar({
    super.key,
    required this.reactions,
    this.onReaction,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    // Group reactions by emoji
    final Map<String, int> grouped = {};
    for (final r in reactions) {
      final emoji = r['emoji'] as String? ?? '👍';
      grouped[emoji] = (grouped[emoji] ?? 0) + 1;
    }

    return Wrap(
      spacing: 4,
      runSpacing: 4,
      children: grouped.entries.map((entry) {
        return GestureDetector(
          onTap: () {
            HapticFeedback.lightImpact();
            onReaction?.call(entry.key);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: cs.outline.withOpacity(0.2)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(entry.key, style: const TextStyle(fontSize: 14)),
                if (entry.value > 1) ...[
                  const SizedBox(width: 4),
                  Text(
                    '${entry.value}',
                    style: context.textStyles.labelSmall?.copyWith(
                      color: cs.onSurfaceVariant,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

/// Badge displaying member role (Owner, Admin, Moderator)
class RoleBadge extends StatelessWidget {
  final GroupMemberRole role;

  const RoleBadge({super.key, required this.role});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final color = switch (role) {
      GroupMemberRole.owner => AppColors.amber500,
      GroupMemberRole.admin => AppColors.violet500,
      GroupMemberRole.moderator => AppColors.teal500,
      GroupMemberRole.member => cs.primary,
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        role.name.toUpperCase(),
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w700,
          color: color,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
