import 'package:flutter/material.dart';

/// Badge displaying session overlap count for event-scoped matching
class SessionOverlapBadge extends StatelessWidget {
  final int overlapCount;
  final String? currentSession;
  final bool compact;

  const SessionOverlapBadge({
    super.key,
    required this.overlapCount,
    this.currentSession,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    if (overlapCount <= 0 && currentSession == null) {
      return const SizedBox.shrink();
    }

    final cs = Theme.of(context).colorScheme;
    
    if (compact) {
      return _buildCompactBadge(cs);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: cs.secondaryContainer,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.secondary.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.event_seat_rounded,
            size: 14,
            color: cs.secondary,
          ),
          const SizedBox(width: 4),
          if (currentSession != null)
            Text(
              currentSession!,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: cs.secondary,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            )
          else if (overlapCount > 0) ...[
            Text(
              '$overlapCount',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: cs.secondary,
              ),
            ),
            const SizedBox(width: 2),
            Text(
              overlapCount == 1 ? 'session' : 'sessions',
              style: TextStyle(
                fontSize: 10,
                color: cs.onSecondaryContainer,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCompactBadge(ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: cs.secondaryContainer.withOpacity(0.8),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.event_seat_rounded,
            size: 12,
            color: cs.secondary,
          ),
          if (overlapCount > 0) ...[
            const SizedBox(width: 2),
            Text(
              '$overlapCount',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: cs.secondary,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Same session indicator - shows when attendee is in the same session
class SameSessionBadge extends StatelessWidget {
  final String sessionName;
  
  const SameSessionBadge({
    super.key,
    required this.sessionName,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [cs.primary, cs.primary.withOpacity(0.8)],
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.location_on_rounded,
            size: 12,
            color: Colors.white,
          ),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              'Same room',
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
