import 'package:flutter/material.dart';
import 'package:thittam1hub/services/comment_service.dart';

/// Autocomplete dropdown for @mentions
class MentionPicker extends StatelessWidget {
  final List<MentionSuggestion> suggestions;
  final Function(MentionSuggestion) onSelect;
  final bool isLoading;

  const MentionPicker({
    super.key,
    required this.suggestions,
    required this.onSelect,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    if (isLoading) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: cs.outlineVariant.withOpacity(0.3)),
          boxShadow: [
            BoxShadow(
              color: cs.shadow.withOpacity(0.1),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: cs.primary,
              ),
            ),
            const SizedBox(width: 12),
            Text(
              'Searching...',
              style: textTheme.bodySmall?.copyWith(
                color: cs.onSurfaceVariant,
              ),
            ),
          ],
        ),
      );
    }

    if (suggestions.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      constraints: const BoxConstraints(maxHeight: 200),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outlineVariant.withOpacity(0.3)),
        boxShadow: [
          BoxShadow(
            color: cs.shadow.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: ListView.builder(
          shrinkWrap: true,
          padding: EdgeInsets.zero,
          itemCount: suggestions.length,
          itemBuilder: (context, index) {
            final suggestion = suggestions[index];
            return _MentionSuggestionTile(
              suggestion: suggestion,
              onTap: () => onSelect(suggestion),
              isFirst: index == 0,
              isLast: index == suggestions.length - 1,
            );
          },
        ),
      ),
    );
  }
}

class _MentionSuggestionTile extends StatelessWidget {
  final MentionSuggestion suggestion;
  final VoidCallback onTap;
  final bool isFirst;
  final bool isLast;

  const _MentionSuggestionTile({
    required this.suggestion,
    required this.onTap,
    this.isFirst = false,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          border: isLast
              ? null
              : Border(
                  bottom: BorderSide(
                    color: cs.outlineVariant.withOpacity(0.2),
                  ),
                ),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: cs.surfaceContainerHighest,
              backgroundImage: suggestion.avatarUrl != null
                  ? NetworkImage(suggestion.avatarUrl!)
                  : null,
              child: suggestion.avatarUrl == null
                  ? Text(
                      suggestion.displayName.isNotEmpty
                          ? suggestion.displayName[0].toUpperCase()
                          : '@',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: cs.onSurfaceVariant,
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    suggestion.displayName.isNotEmpty
                        ? suggestion.displayName
                        : '@${suggestion.username}',
                    style: textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (suggestion.username.isNotEmpty &&
                      suggestion.displayName.isNotEmpty)
                    Text(
                      '@${suggestion.username}',
                      style: textTheme.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              size: 14,
              color: cs.onSurfaceVariant.withOpacity(0.5),
            ),
          ],
        ),
      ),
    );
  }
}

/// Overlay wrapper to show mention picker above input
class MentionPickerOverlay extends StatelessWidget {
  final Widget child;
  final List<MentionSuggestion> suggestions;
  final Function(MentionSuggestion) onSelect;
  final bool isLoading;
  final bool show;

  const MentionPickerOverlay({
    super.key,
    required this.child,
    required this.suggestions,
    required this.onSelect,
    this.isLoading = false,
    this.show = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (show)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: MentionPicker(
              suggestions: suggestions,
              onSelect: onSelect,
              isLoading: isLoading,
            ),
          ),
        child,
      ],
    );
  }
}
