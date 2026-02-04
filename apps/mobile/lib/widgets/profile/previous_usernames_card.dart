import 'package:flutter/material.dart';
import 'package:thittam1hub/services/profile_history_service.dart';
import 'package:thittam1hub/theme.dart';

import 'package:thittam1hub/services/logging_service.dart';
/// Displays previous usernames on a public profile
class PreviousUsernamesCard extends StatefulWidget {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'PreviousUsernamesCard';

  final String userId;
  final int maxDisplay;
  
  const PreviousUsernamesCard({
    super.key,
    required this.userId,
    this.maxDisplay = 3,
  });

  @override
  State<PreviousUsernamesCard> createState() => _PreviousUsernamesCardState();
}

class _PreviousUsernamesCardState extends State<PreviousUsernamesCard> {
  static const String _tag = 'PreviousUsernamesCard';
  static final _log = LoggingService.instance;
  
  final _historyService = ProfileHistoryService.instance;
  List<ProfileChangeRecord> _usernameHistory = [];
  bool _isLoading = true;
  bool _showAll = false;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    try {
      final historyResult = await _historyService.getUsernameHistory(widget.userId);
      final history = historyResult.isSuccess ? historyResult.data : <ProfileChangeRecord>[];
      if (mounted) {
        setState(() {
          _usernameHistory = history;
          _isLoading = false;
        });
      }
    } catch (e) {
      _log.error('Failed to load username history: $e', tag: _tag);
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    
    if (diff.inDays == 0) {
      return 'Today';
    } else if (diff.inDays == 1) {
      return 'Yesterday';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} days ago';
    } else if (diff.inDays < 30) {
      final weeks = (diff.inDays / 7).floor();
      return '$weeks ${weeks == 1 ? 'week' : 'weeks'} ago';
    } else if (diff.inDays < 365) {
      final months = (diff.inDays / 30).floor();
      return '$months ${months == 1 ? 'month' : 'months'} ago';
    } else {
      final years = (diff.inDays / 365).floor();
      return '$years ${years == 1 ? 'year' : 'years'} ago';
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    // Don't show if loading or no history
    if (_isLoading) {
      return const SizedBox.shrink();
    }
    
    // Filter to only get old username values (not the new ones)
    final previousUsernames = _usernameHistory
        .where((r) => r.oldValue != null && r.oldValue!.isNotEmpty)
        .toList();
    
    if (previousUsernames.isEmpty) {
      return const SizedBox.shrink();
    }

    final displayList = _showAll 
        ? previousUsernames 
        : previousUsernames.take(widget.maxDisplay).toList();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(0.3),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: cs.outlineVariant.withOpacity(0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.history,
                size: 18,
                color: cs.onSurfaceVariant,
              ),
              const SizedBox(width: 8),
              Text(
                'Previously known as',
                style: context.textStyles.titleSmall?.copyWith(
                  color: cs.onSurfaceVariant,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // Username list
          ...displayList.map((record) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: cs.primaryContainer.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '@${record.oldValue}',
                    style: context.textStyles.bodyMedium?.copyWith(
                      color: cs.primary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  _formatDate(record.changedAt),
                  style: context.textStyles.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant.withOpacity(0.7),
                  ),
                ),
              ],
            ),
          )),
          
          // Show more/less toggle
          if (previousUsernames.length > widget.maxDisplay) ...[
            const SizedBox(height: 4),
            GestureDetector(
              onTap: () => setState(() => _showAll = !_showAll),
              child: Row(
                children: [
                  Icon(
                    _showAll ? Icons.expand_less : Icons.expand_more,
                    size: 16,
                    color: cs.primary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _showAll 
                        ? 'Show less' 
                        : 'Show ${previousUsernames.length - widget.maxDisplay} more',
                    style: context.textStyles.bodySmall?.copyWith(
                      color: cs.primary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
