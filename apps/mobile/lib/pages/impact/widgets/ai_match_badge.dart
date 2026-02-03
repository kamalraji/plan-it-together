import 'package:flutter/material.dart';

/// Badge displaying AI match category and score
class AIMatchBadge extends StatelessWidget {
  final int matchScore;
  final String? matchCategory;
  final bool compact;
  final VoidCallback? onTap;

  const AIMatchBadge({
    super.key,
    required this.matchScore,
    this.matchCategory,
    this.compact = false,
    this.onTap,
  });

  String _buildSemanticLabel() {
    final config = _getCategoryConfig(matchCategory);
    return '$matchScore percent match${config.label.isNotEmpty ? ", ${config.label} connection" : ""}';
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final config = _getCategoryConfig(matchCategory);
    
    if (compact) {
      return Semantics(
        label: _buildSemanticLabel(),
        child: _buildCompactBadge(cs, config),
      );
    }
    
    return Semantics(
      button: onTap != null,
      label: _buildSemanticLabel(),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [config.color, config.color.withOpacity(0.7)],
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: config.color.withOpacity(0.3),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(config.icon, color: Colors.white, size: 16),
              const SizedBox(width: 6),
              Text(
                '$matchScore%',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              if (config.label.isNotEmpty) ...[
                const SizedBox(width: 4),
                Container(
                  width: 1,
                  height: 12,
                  color: Colors.white.withOpacity(0.5),
                ),
                const SizedBox(width: 4),
                Text(
                  config.label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCompactBadge(ColorScheme cs, _CategoryConfig config) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: config.color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: config.color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(config.icon, color: config.color, size: 14),
          const SizedBox(width: 4),
          Text(
            '$matchScore%',
            style: TextStyle(
              color: config.color,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  _CategoryConfig _getCategoryConfig(String? category) {
    switch (category) {
      case 'professional':
        return _CategoryConfig(
          icon: Icons.work_rounded,
          color: Colors.blue,
          label: 'Pro',
        );
      case 'mutual_interest':
        return _CategoryConfig(
          icon: Icons.people_rounded,
          color: Colors.indigo,
          label: 'Mutual',
        );
      case 'similar_background':
        return _CategoryConfig(
          icon: Icons.school_rounded,
          color: Colors.teal,
          label: 'Similar',
        );
      case 'event_connection':
        return _CategoryConfig(
          icon: Icons.event_rounded,
          color: Colors.purple,
          label: 'Event',
        );
      case 'goal_match':
        return _CategoryConfig(
          icon: Icons.handshake_rounded,
          color: Colors.orange,
          label: 'Goals',
        );
      case 'discovery':
      default:
        return _CategoryConfig(
          icon: Icons.auto_awesome_rounded,
          color: Colors.pink,
          label: '',
        );
    }
  }
}

class _CategoryConfig {
  final IconData icon;
  final Color color;
  final String label;

  const _CategoryConfig({
    required this.icon,
    required this.color,
    required this.label,
  });
}
