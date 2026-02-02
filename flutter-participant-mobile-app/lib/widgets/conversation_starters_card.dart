import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Card displaying AI-generated conversation starters
class ConversationStartersCard extends StatefulWidget {
  final List<String> conversationStarters;
  final List<String>? collaborationIdeas;
  final String? matchNarrative;
  final bool isLoading;
  final VoidCallback? onRefresh;
  final void Function(String starter)? onStarterTap;

  const ConversationStartersCard({
    super.key,
    required this.conversationStarters,
    this.collaborationIdeas,
    this.matchNarrative,
    this.isLoading = false,
    this.onRefresh,
    this.onStarterTap,
  });

  @override
  State<ConversationStartersCard> createState() => _ConversationStartersCardState();
}

class _ConversationStartersCardState extends State<ConversationStartersCard> {
  bool _showCollaboration = false;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    if (widget.isLoading) {
      return _buildLoadingState(cs);
    }

    if (widget.conversationStarters.isEmpty && 
        (widget.collaborationIdeas?.isEmpty ?? true)) {
      return const SizedBox.shrink();
    }

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            cs.primaryContainer.withOpacity(0.3),
            cs.secondaryContainer.withOpacity(0.2),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: cs.primary.withOpacity(0.1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 8, 8),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: cs.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    Icons.auto_awesome_rounded,
                    color: cs.primary,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'AI Conversation Starters',
                        style: textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Personalized suggestions based on your match',
                        style: textTheme.bodySmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                if (widget.onRefresh != null)
                  IconButton(
                    icon: Icon(Icons.refresh_rounded, color: cs.primary, size: 20),
                    onPressed: widget.onRefresh,
                    tooltip: 'Refresh suggestions',
                  ),
              ],
            ),
          ),

          // Match Narrative
          if (widget.matchNarrative != null && widget.matchNarrative!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: cs.surface,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.lightbulb_outline_rounded,
                      color: Colors.amber,
                      size: 18,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        widget.matchNarrative!,
                        style: textTheme.bodyMedium?.copyWith(
                          fontStyle: FontStyle.italic,
                          color: cs.onSurface.withOpacity(0.8),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Toggle tabs
          if (widget.collaborationIdeas?.isNotEmpty ?? false)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _TabButton(
                    label: 'Starters',
                    isSelected: !_showCollaboration,
                    onTap: () => setState(() => _showCollaboration = false),
                  ),
                  const SizedBox(width: 8),
                  _TabButton(
                    label: 'Collab Ideas',
                    isSelected: _showCollaboration,
                    onTap: () => setState(() => _showCollaboration = true),
                  ),
                ],
              ),
            ),

          const SizedBox(height: 8),

          // Content
          AnimatedCrossFade(
            duration: const Duration(milliseconds: 200),
            crossFadeState: _showCollaboration
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            firstChild: _buildStartersList(cs, textTheme, widget.conversationStarters),
            secondChild: _buildStartersList(cs, textTheme, widget.collaborationIdeas ?? []),
          ),

          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildStartersList(ColorScheme cs, TextTheme textTheme, List<String> items) {
    if (items.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Text(
          'No suggestions available',
          style: textTheme.bodyMedium?.copyWith(color: cs.onSurfaceVariant),
        ),
      );
    }

    return Column(
      children: items.asMap().entries.map((entry) {
        final index = entry.key;
        final starter = entry.value;
        
        return _StarterItem(
          starter: starter,
          index: index,
          onTap: widget.onStarterTap != null ? () => widget.onStarterTap!(starter) : null,
        );
      }).toList(),
    );
  }

  Widget _buildLoadingState(ColorScheme cs) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(0.3),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: cs.primary,
            ),
          ),
          const SizedBox(width: 12),
          Text(
            'Generating personalized suggestions...',
            style: TextStyle(
              color: cs.onSurfaceVariant,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _TabButton({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? cs.primary : cs.surface,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? cs.onPrimary : cs.onSurfaceVariant,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}

class _StarterItem extends StatelessWidget {
  final String starter;
  final int index;
  final VoidCallback? onTap;

  const _StarterItem({
    required this.starter,
    required this.index,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return InkWell(
      onTap: () {
        HapticFeedback.lightImpact();
        Clipboard.setData(ClipboardData(text: starter));
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Copied to clipboard!'),
            backgroundColor: cs.primary,
            duration: const Duration(seconds: 1),
          ),
        );
        onTap?.call();
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: cs.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  '${index + 1}',
                  style: TextStyle(
                    color: cs.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                starter,
                style: textTheme.bodyMedium,
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              Icons.copy_rounded,
              size: 16,
              color: cs.onSurfaceVariant.withOpacity(0.5),
            ),
          ],
        ),
      ),
    );
  }
}
