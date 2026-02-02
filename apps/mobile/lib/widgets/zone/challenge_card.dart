import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/zone_challenge.dart';
import 'package:thittam1hub/widgets/styled_card.dart';
import 'package:thittam1hub/widgets/styled_button.dart';

/// Challenge card for scavenger hunt / gamification
/// Shows progress, points reward, and completion state
class ChallengeCard extends StatelessWidget {
  final ZoneChallenge challenge;
  final VoidCallback? onComplete;
  final bool isLoading;

  const ChallengeCard({
    super.key,
    required this.challenge,
    this.onComplete,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return StyledCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: challenge.isCompleted
                    ? [cs.primaryContainer, cs.primaryContainer.withOpacity(0.5)]
                    : [cs.surfaceContainerHighest, cs.surfaceContainerHigh],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                // Icon
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: challenge.isCompleted 
                        ? cs.primary 
                        : cs.surface,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      if (!challenge.isCompleted)
                        BoxShadow(
                          color: cs.shadow.withOpacity(0.1),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                    ],
                  ),
                  child: Center(
                    child: challenge.isCompleted
                        ? Icon(
                            Icons.check_rounded,
                            color: cs.onPrimary,
                            size: 28,
                          )
                        : Text(
                            challenge.icon,
                            style: const TextStyle(fontSize: 24),
                          ),
                  ),
                ),
                const SizedBox(width: 12),
                // Title and type
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        challenge.title,
                        style: tt.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          decoration: challenge.isCompleted 
                              ? TextDecoration.lineThrough 
                              : null,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            _getChallengeTypeIcon(),
                            size: 14,
                            color: cs.onSurfaceVariant,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            challenge.challengeType.label,
                            style: tt.bodySmall?.copyWith(
                              color: cs.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // Points badge
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: challenge.isCompleted 
                        ? cs.primary 
                        : Colors.amber.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.star_rounded,
                        size: 16,
                        color: challenge.isCompleted 
                            ? cs.onPrimary 
                            : Colors.amber.shade700,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '+${challenge.pointsReward}',
                        style: tt.labelMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: challenge.isCompleted 
                              ? cs.onPrimary 
                              : Colors.amber.shade700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Description
                if (challenge.description != null) ...[
                  Text(
                    challenge.description!,
                    style: tt.bodyMedium?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 12),
                ],
                // Progress / Limited slots
                if (challenge.maxCompletions != null) ...[
                  Row(
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: challenge.progressPercentage,
                            backgroundColor: cs.surfaceContainerHighest,
                            valueColor: AlwaysStoppedAnimation(
                              challenge.remainingSlots == 0 
                                  ? cs.error 
                                  : cs.primary,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '${challenge.currentCompletions}/${challenge.maxCompletions}',
                        style: tt.bodySmall?.copyWith(
                          color: cs.onSurfaceVariant,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  if (challenge.remainingSlots != null && challenge.remainingSlots! > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        '${challenge.remainingSlots} spots left!',
                        style: tt.bodySmall?.copyWith(
                          color: cs.error,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  const SizedBox(height: 12),
                ],
                // Action button
                if (!challenge.isCompleted && challenge.isAvailable)
                  SizedBox(
                    width: double.infinity,
                    child: StyledButton(
                      onPressed: () {
                        HapticFeedback.mediumImpact();
                        onComplete?.call();
                      },
                      isLoading: isLoading,
                      label: _getActionLabel(),
                      icon: _getActionIcon(),
                      variant: StyledButtonVariant.primary,
                    ),
                  )
                else if (challenge.isCompleted)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: cs.primaryContainer.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.check_circle_rounded,
                          size: 20,
                          color: cs.primary,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Completed!',
                          style: tt.labelLarge?.copyWith(
                            color: cs.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: cs.errorContainer.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.lock_rounded,
                          size: 20,
                          color: cs.error,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Not Available',
                          style: tt.labelLarge?.copyWith(
                            color: cs.error,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  IconData _getChallengeTypeIcon() {
    switch (challenge.challengeType) {
      case ChallengeType.checkin:
        return Icons.location_on_rounded;
      case ChallengeType.qrScan:
        return Icons.qr_code_scanner_rounded;
      case ChallengeType.quiz:
        return Icons.quiz_rounded;
      case ChallengeType.photo:
        return Icons.camera_alt_rounded;
      case ChallengeType.social:
        return Icons.share_rounded;
      case ChallengeType.session:
        return Icons.event_rounded;
      case ChallengeType.booth:
        return Icons.storefront_rounded;
    }
  }

  String _getActionLabel() {
    switch (challenge.challengeType) {
      case ChallengeType.checkin:
        return 'Check In Here';
      case ChallengeType.qrScan:
        return 'Scan QR Code';
      case ChallengeType.quiz:
        return 'Take Quiz';
      case ChallengeType.photo:
        return 'Upload Photo';
      case ChallengeType.social:
        return 'Share & Complete';
      case ChallengeType.session:
        return 'Attend Session';
      case ChallengeType.booth:
        return 'Visit Booth';
    }
  }

  IconData _getActionIcon() {
    switch (challenge.challengeType) {
      case ChallengeType.checkin:
        return Icons.my_location_rounded;
      case ChallengeType.qrScan:
        return Icons.qr_code_scanner_rounded;
      case ChallengeType.quiz:
        return Icons.play_arrow_rounded;
      case ChallengeType.photo:
        return Icons.camera_alt_rounded;
      case ChallengeType.social:
        return Icons.share_rounded;
      case ChallengeType.session:
        return Icons.event_available_rounded;
      case ChallengeType.booth:
        return Icons.storefront_rounded;
    }
  }
}
