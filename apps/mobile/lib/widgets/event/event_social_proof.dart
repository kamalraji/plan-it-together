import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// Social proof widget showing attendee avatars and registration count
class EventSocialProof extends StatelessWidget {
  final int registeredCount;
  final int? capacity;
  final List<String> attendeeAvatars;
  final VoidCallback? onTap;

  const EventSocialProof({
    super.key,
    required this.registeredCount,
    this.capacity,
    this.attendeeAvatars = const [],
    this.onTap,
  });

  String _buildSemanticLabel() {
    if (registeredCount == 0) return 'Be the first to register';
    final countText = registeredCount == 1 
        ? '1 person registered' 
        : '$registeredCount people registered';
    if (capacity != null) {
      final remaining = capacity! - registeredCount;
      return '$countText, $remaining spots left';
    }
    return countText;
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    if (registeredCount == 0) {
      return _buildEmptyState(cs, text);
    }

    return Semantics(
      label: _buildSemanticLabel(),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: cs.outline),
        ),
        child: Row(
          children: [
            // Stacked avatars
            _buildAvatarStack(cs),
            const SizedBox(width: 12),
            // Count text
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _getCountText(),
                    style: text.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    capacity != null
                        ? '${((registeredCount / capacity!) * 100).toInt()}% of spots filled'
                        : 'Join them at this event',
                    style: text.bodySmall?.copyWith(color: AppColors.textMuted),
                  ),
                ],
              ),
            ),
            // Capacity indicator
            if (capacity != null) _buildCapacityIndicator(cs, text),
          ],
        ),
      ),
    ),
    );
  }

  Widget _buildEmptyState(ColorScheme cs, TextTheme text) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cs.primary.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: cs.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: cs.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.celebration_rounded, color: cs.primary, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Be the first to register!',
                  style: text.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 2),
                Text(
                  'Secure your spot at this event',
                  style: text.bodySmall?.copyWith(color: AppColors.textMuted),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatarStack(ColorScheme cs) {
    final maxAvatars = 4;
    final displayAvatars = attendeeAvatars.take(maxAvatars).toList();
    final hasOverflow = registeredCount > maxAvatars;

    return SizedBox(
      width: 16.0 * (displayAvatars.length.clamp(1, maxAvatars)) + 24,
      height: 40,
      child: Stack(
        children: [
          // Show placeholder avatars if no real avatars
          for (int i = 0; i < (displayAvatars.isEmpty ? 3.clamp(0, registeredCount) : displayAvatars.length); i++)
            Positioned(
              left: i * 16.0,
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: cs.surface, width: 2),
                  color: displayAvatars.isEmpty
                      ? _getPlaceholderColor(i)
                      : null,
                ),
                child: displayAvatars.isEmpty
                    ? Center(
                        child: Icon(
                          Icons.person,
                          size: 20,
                          color: Colors.white.withValues(alpha: 0.8),
                        ),
                      )
                    : ClipOval(
                        child: displayAvatars[i].startsWith('http')
                            ? Image.network(
                                displayAvatars[i],
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => _buildPlaceholderAvatar(i),
                              )
                            : _buildPlaceholderAvatar(i),
                      ),
              ),
            ),
          // Overflow indicator
          if (hasOverflow)
            Positioned(
              left: (displayAvatars.isEmpty ? 3.clamp(0, registeredCount) : displayAvatars.length) * 16.0,
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: cs.surface, width: 2),
                  color: cs.surfaceContainerHighest,
                ),
                child: Center(
                  child: Text(
                    '+${registeredCount - maxAvatars}',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPlaceholderAvatar(int index) {
    return Container(
      color: _getPlaceholderColor(index),
      child: Center(
        child: Icon(
          Icons.person,
          size: 20,
          color: Colors.white.withValues(alpha: 0.8),
        ),
      ),
    );
  }

  Color _getPlaceholderColor(int index) {
    final colors = [
      AppColors.violet500,
      AppColors.emerald500,
      AppColors.amber500,
      AppColors.rose500,
      AppColors.indigo500,
    ];
    return colors[index % colors.length];
  }

  Widget _buildCapacityIndicator(ColorScheme cs, TextTheme text) {
    final percentage = (registeredCount / capacity!) * 100;
    final isAlmostFull = percentage >= 80;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isAlmostFull
            ? AppColors.warning.withValues(alpha: 0.1)
            : cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isAlmostFull) ...[
            Icon(Icons.local_fire_department, size: 14, color: AppColors.warning),
            const SizedBox(width: 4),
          ],
          Text(
            '${capacity! - registeredCount} left',
            style: text.labelMedium?.copyWith(
              color: isAlmostFull ? AppColors.warning : AppColors.textMuted,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  String _getCountText() {
    if (registeredCount == 1) return '1 person registered';
    if (registeredCount < 100) return '$registeredCount people registered';
    if (registeredCount < 1000) return '$registeredCount+ people registered';
    return '${(registeredCount / 1000).toStringAsFixed(1)}k+ people registered';
  }
}
