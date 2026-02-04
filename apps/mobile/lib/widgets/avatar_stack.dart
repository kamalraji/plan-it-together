import 'package:flutter/material.dart';
import 'styled_avatar.dart';
import '../theme.dart';

/// Overlapping avatar stack widget for displaying multiple members
/// WhatsApp/Telegram-style stacked avatars with overflow indicator
class AvatarStack extends StatelessWidget {
  final List<AvatarData> avatars;
  final int maxDisplay;
  final double avatarSize;
  final double overlapOffset;
  final VoidCallback? onTap;
  final bool showOnlineIndicator;

  const AvatarStack({
    super.key,
    required this.avatars,
    this.maxDisplay = 3,
    this.avatarSize = 32,
    this.overlapOffset = 0.6,
    this.onTap,
    this.showOnlineIndicator = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final displayAvatars = avatars.take(maxDisplay).toList();
    final overflow = avatars.length - maxDisplay;
    final effectiveWidth = avatarSize + 
        (displayAvatars.length - 1) * avatarSize * overlapOffset +
        (overflow > 0 ? avatarSize * overlapOffset : 0);

    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: effectiveWidth,
        height: avatarSize,
        child: Stack(
          children: [
            // Render avatars in reverse order so first is on top
            for (int i = displayAvatars.length - 1; i >= 0; i--)
              Positioned(
                left: i * avatarSize * overlapOffset,
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: cs.surface,
                      width: 2,
                    ),
                  ),
                  child: StyledAvatar(
                    name: displayAvatars[i].name,
                    url: displayAvatars[i].imageUrl,
                    size: avatarSize - 4,
                    isOnline: showOnlineIndicator && (displayAvatars[i].isOnline ?? false),
                  ),
                ),
              ),
            // Overflow indicator
            if (overflow > 0)
              Positioned(
                left: displayAvatars.length * avatarSize * overlapOffset,
                child: Container(
                  width: avatarSize,
                  height: avatarSize,
                  decoration: BoxDecoration(
                    color: cs.surfaceContainerHighest,
                    shape: BoxShape.circle,
                    border: Border.all(color: cs.surface, width: 2),
                  ),
                  child: Center(
                    child: Text(
                      '+$overflow',
                      style: TextStyle(
                        fontSize: avatarSize * 0.35,
                        fontWeight: FontWeight.w600,
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Data model for avatar in stack
class AvatarData {
  final String name;
  final String? imageUrl;
  final bool? isOnline;
  final String? userId;

  const AvatarData({
    required this.name,
    this.imageUrl,
    this.isOnline,
    this.userId,
  });

  factory AvatarData.fromMember(Map<String, dynamic> member) {
    return AvatarData(
      name: member['display_name'] ?? member['name'] ?? 'User',
      imageUrl: member['avatar_url'] ?? member['image_url'],
      isOnline: member['is_online'] as bool?,
      userId: member['user_id'] as String?,
    );
  }
}

/// Compact avatar stack with count label
class AvatarStackWithLabel extends StatelessWidget {
  final List<AvatarData> avatars;
  final String label;
  final int maxDisplay;
  final double avatarSize;
  final VoidCallback? onTap;

  const AvatarStackWithLabel({
    super.key,
    required this.avatars,
    required this.label,
    this.maxDisplay = 3,
    this.avatarSize = 28,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: onTap,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (avatars.isNotEmpty)
            AvatarStack(
              avatars: avatars,
              maxDisplay: maxDisplay,
              avatarSize: avatarSize,
            ),
          const SizedBox(width: AppSpacing.sm),
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              color: cs.onSurfaceVariant,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
