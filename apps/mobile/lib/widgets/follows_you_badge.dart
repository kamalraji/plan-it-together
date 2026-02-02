import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// Badge indicating that a user follows the current user
class FollowsYouBadge extends StatelessWidget {
  final bool isMutual;
  final double? fontSize;

  const FollowsYouBadge({
    super.key,
    this.isMutual = false,
    this.fontSize,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: isMutual 
            ? AppColors.success.withOpacity(0.15)
            : cs.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: isMutual 
              ? AppColors.success.withOpacity(0.3)
              : cs.primary.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isMutual ? Icons.sync_alt : Icons.person_add,
            size: (fontSize ?? 11) + 2,
            color: isMutual ? AppColors.success : cs.primary,
          ),
          const SizedBox(width: 4),
          Text(
            isMutual ? 'Mutual' : 'Follows you',
            style: TextStyle(
              fontSize: fontSize ?? 11,
              fontWeight: FontWeight.w600,
              color: isMutual ? AppColors.success : cs.primary,
            ),
          ),
        ],
      ),
    );
  }
}

/// Compact badge for lists
class FollowsYouChip extends StatelessWidget {
  final bool isMutual;

  const FollowsYouChip({
    super.key,
    this.isMutual = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: isMutual 
            ? AppColors.success.withOpacity(0.1)
            : cs.primary.withOpacity(0.08),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        isMutual ? 'Mutual' : 'Follows you',
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: isMutual ? AppColors.success : cs.primary,
        ),
      ),
    );
  }
}
