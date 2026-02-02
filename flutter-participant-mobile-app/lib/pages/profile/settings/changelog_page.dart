import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:thittam1hub/models/changelog_entry.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/settings/settings_page_scaffold.dart';

/// Premium changelog / What's New page with staggered animations
class ChangelogPage extends StatefulWidget {
  const ChangelogPage({super.key});

  @override
  State<ChangelogPage> createState() => _ChangelogPageState();
}

class _ChangelogPageState extends State<ChangelogPage>
    with SingleTickerProviderStateMixin {
  late final AnimationController _staggerController;
  String? _expandedEntryId;

  @override
  void initState() {
    super.initState();
    _staggerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _staggerController.forward();
  }

  @override
  void dispose() {
    _staggerController.dispose();
    super.dispose();
  }

  void _toggleEntry(String id) {
    HapticFeedback.selectionClick();
    setState(() {
      _expandedEntryId = _expandedEntryId == id ? null : id;
    });
  }

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: "What's New",
      body: ListView.builder(
        padding: EdgeInsets.only(bottom: context.bottomContentPadding),
        itemCount: AppChangelog.versions.length,
        itemBuilder: (context, versionIndex) {
          final version = AppChangelog.versions[versionIndex];
          return _VersionSection(
            version: version,
            staggerController: _staggerController,
            versionIndex: versionIndex,
            expandedEntryId: _expandedEntryId,
            onEntryTap: _toggleEntry,
          );
        },
      ),
    );
  }
}

class _VersionSection extends StatelessWidget {
  final ChangelogVersion version;
  final AnimationController staggerController;
  final int versionIndex;
  final String? expandedEntryId;
  final void Function(String) onEntryTap;

  const _VersionSection({
    required this.version,
    required this.staggerController,
    required this.versionIndex,
    required this.expandedEntryId,
    required this.onEntryTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isLatest = versionIndex == 0;
    final dateFormat = DateFormat('MMM d, y');

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Version header
          SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(-0.3, 0),
              end: Offset.zero,
            ).animate(CurvedAnimation(
              parent: staggerController,
              curve: Interval(
                (versionIndex * 0.1).clamp(0.0, 0.5),
                ((versionIndex * 0.1) + 0.3).clamp(0.3, 0.8),
                curve: Curves.easeOutCubic,
              ),
            )),
            child: FadeTransition(
              opacity: CurvedAnimation(
                parent: staggerController,
                curve: Interval(
                  (versionIndex * 0.1).clamp(0.0, 0.5),
                  ((versionIndex * 0.1) + 0.3).clamp(0.3, 0.8),
                ),
              ),
              child: Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: isLatest
                      ? LinearGradient(
                          colors: [
                            cs.primary.withOpacity(0.15),
                            cs.primary.withOpacity(0.05),
                          ],
                        )
                      : null,
                  color: isLatest ? null : cs.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(16),
                  border: isLatest
                      ? Border.all(color: cs.primary.withOpacity(0.3))
                      : null,
                ),
                child: Row(
                  children: [
                    // Version badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: isLatest ? cs.primary : cs.surfaceContainerHigh,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (isLatest) ...[
                            Icon(
                              Icons.star_rounded,
                              size: 14,
                              color: cs.onPrimary,
                            ),
                            const SizedBox(width: 4),
                          ],
                          Text(
                            'v${version.version}',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: isLatest ? cs.onPrimary : cs.onSurface,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (version.summary != null)
                            Text(
                              version.summary!,
                              style: context.textStyles.bodyMedium?.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          Text(
                            dateFormat.format(version.releaseDate),
                            style: context.textStyles.bodySmall?.copyWith(
                              color: cs.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Entries
          ...List.generate(version.entries.length, (entryIndex) {
            final entry = version.entries[entryIndex];
            final globalIndex = versionIndex * 10 + entryIndex;
            final isExpanded = expandedEntryId == entry.id;

            return SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(0, 0.3),
                end: Offset.zero,
              ).animate(CurvedAnimation(
                parent: staggerController,
                curve: Interval(
                  ((globalIndex * 0.05) + 0.2).clamp(0.2, 0.6),
                  ((globalIndex * 0.05) + 0.5).clamp(0.5, 1.0),
                  curve: Curves.easeOutCubic,
                ),
              )),
              child: FadeTransition(
                opacity: CurvedAnimation(
                  parent: staggerController,
                  curve: Interval(
                    ((globalIndex * 0.05) + 0.2).clamp(0.2, 0.6),
                    ((globalIndex * 0.05) + 0.5).clamp(0.5, 1.0),
                  ),
                ),
                child: _EntryCard(
                  entry: entry,
                  isExpanded: isExpanded,
                  onTap: () => onEntryTap(entry.id),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _EntryCard extends StatelessWidget {
  final ChangelogEntry entry;
  final bool isExpanded;
  final VoidCallback onTap;

  const _EntryCard({
    required this.entry,
    required this.isExpanded,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final hasDescription = entry.description != null;

    return GestureDetector(
      onTap: hasDescription ? onTap : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: entry.isHighlight
              ? entry.category.color.withOpacity(0.08)
              : cs.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: entry.isHighlight
                ? entry.category.color.withOpacity(0.3)
                : cs.outline.withOpacity(0.1),
          ),
          boxShadow: entry.isHighlight
              ? [
                  BoxShadow(
                    color: entry.category.color.withOpacity(0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Category icon
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: entry.category.color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    entry.icon,
                    size: 18,
                    color: entry.category.color,
                  ),
                ),
                const SizedBox(width: 12),

                // Title and category
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        entry.title,
                        style: context.textStyles.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 2),
                      _CategoryChip(category: entry.category),
                    ],
                  ),
                ),

                // Expand indicator
                if (hasDescription)
                  AnimatedRotation(
                    turns: isExpanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: Icon(
                      Icons.keyboard_arrow_down_rounded,
                      color: cs.onSurfaceVariant,
                      size: 20,
                    ),
                  ),

                // Highlight badge
                if (entry.isHighlight) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          entry.category.color,
                          entry.category.color.withOpacity(0.7),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      '✨ NEW',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ],
            ),

            // Expandable description
            AnimatedCrossFade(
              firstChild: const SizedBox.shrink(),
              secondChild: Padding(
                padding: const EdgeInsets.only(top: 12, left: 4),
                child: Text(
                  entry.description ?? '',
                  style: context.textStyles.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
                    height: 1.5,
                  ),
                ),
              ),
              crossFadeState:
                  isExpanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
              duration: const Duration(milliseconds: 200),
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final ChangelogCategory category;

  const _CategoryChip({required this.category});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: category.color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        category.label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: category.color,
        ),
      ),
    );
  }
}
