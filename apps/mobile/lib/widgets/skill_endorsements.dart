import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/skill_endorsement.dart';

class SkillEndorsements extends StatelessWidget {
  final List<String> skills;
  final Map<String, SkillEndorsementSummary> endorsements;
  final bool canEndorse;
  final Set<String> myEndorsedSkills;
  final Function(String skill)? onEndorse;
  final Function(String skill)? onRemoveEndorsement;

  const SkillEndorsements({
    super.key,
    required this.skills,
    required this.endorsements,
    this.canEndorse = false,
    this.myEndorsedSkills = const {},
    this.onEndorse,
    this.onRemoveEndorsement,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    if (skills.isEmpty) return const SizedBox.shrink();

    // Sort skills by endorsement count
    final sortedSkills = List<String>.from(skills)
      ..sort((a, b) {
        final countA = endorsements[a]?.count ?? 0;
        final countB = endorsements[b]?.count ?? 0;
        return countB.compareTo(countA);
      });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.thumb_up_outlined, size: 20, color: cs.tertiary),
            const SizedBox(width: 8),
            Text(
              'Skills',
              style: text.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: sortedSkills.map((skill) {
            final summary = endorsements[skill];
            final hasEndorsed = myEndorsedSkills.contains(skill);
            
            return _SkillChip(
              skill: skill,
              endorsementCount: summary?.count ?? 0,
              topEndorsers: summary?.topEndorsers ?? [],
              canEndorse: canEndorse,
              hasEndorsed: hasEndorsed,
              onEndorse: onEndorse,
              onRemoveEndorsement: onRemoveEndorsement,
            );
          }).toList(),
        ),
      ],
    );
  }
}

class _SkillChip extends StatefulWidget {
  final String skill;
  final int endorsementCount;
  final List<EndorserInfo> topEndorsers;
  final bool canEndorse;
  final bool hasEndorsed;
  final Function(String)? onEndorse;
  final Function(String)? onRemoveEndorsement;

  const _SkillChip({
    required this.skill,
    required this.endorsementCount,
    required this.topEndorsers,
    required this.canEndorse,
    required this.hasEndorsed,
    this.onEndorse,
    this.onRemoveEndorsement,
  });

  @override
  State<_SkillChip> createState() => _SkillChipState();
}

class _SkillChipState extends State<_SkillChip> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _scaleAnimation;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  Future<void> _handleTap() async {
    if (!widget.canEndorse || _isLoading) return;
    
    HapticFeedback.lightImpact();
    _animController.forward().then((_) => _animController.reverse());
    
    setState(() => _isLoading = true);
    
    try {
      if (widget.hasEndorsed) {
        await widget.onRemoveEndorsement?.call(widget.skill);
      } else {
        await widget.onEndorse?.call(widget.skill);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final hasEndorsements = widget.endorsementCount > 0;
    final isEndorsed = widget.hasEndorsed;

    return GestureDetector(
      onTap: widget.canEndorse ? _handleTap : null,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: isEndorsed
                ? cs.primary.withValues(alpha: 0.15)
                : hasEndorsements
                    ? (isDark ? cs.surfaceContainerHighest : cs.surface)
                    : cs.surfaceContainerHighest.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isEndorsed
                  ? cs.primary
                  : hasEndorsements
                      ? cs.outlineVariant
                      : cs.outlineVariant.withValues(alpha: 0.3),
              width: isEndorsed ? 1.5 : 1,
            ),
            boxShadow: hasEndorsements
                ? [
                    BoxShadow(
                      color: cs.shadow.withValues(alpha: 0.05),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Skill name
              Text(
                widget.skill,
                style: text.bodyMedium?.copyWith(
                  fontWeight: hasEndorsements ? FontWeight.w600 : FontWeight.normal,
                  color: isEndorsed ? cs.primary : cs.onSurface,
                ),
              ),
              
              // Endorsement count
              if (hasEndorsements) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: isEndorsed
                        ? cs.primary.withValues(alpha: 0.2)
                        : cs.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isEndorsed ? Icons.thumb_up : Icons.thumb_up_outlined,
                        size: 12,
                        color: cs.primary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${widget.endorsementCount}',
                        style: text.labelSmall?.copyWith(
                          color: cs.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              // Top endorsers avatars
              if (widget.topEndorsers.isNotEmpty) ...[
                const SizedBox(width: 8),
                SizedBox(
                  width: _calculateEndorsersWidth(),
                  height: 20,
                  child: Stack(
                    children: widget.topEndorsers.take(3).toList().asMap().entries.map((entry) {
                      final index = entry.key;
                      final endorser = entry.value;
                      return Positioned(
                        left: index * 14.0,
                        child: Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: cs.surface, width: 1.5),
                          ),
                          child: CircleAvatar(
                            radius: 9,
                            backgroundColor: cs.primary.withValues(alpha: 0.2),
                            backgroundImage: endorser.avatarUrl != null
                                ? NetworkImage(endorser.avatarUrl!)
                                : null,
                            child: endorser.avatarUrl == null
                                ? Text(
                                    endorser.name.isNotEmpty ? endorser.name[0].toUpperCase() : '?',
                                    style: TextStyle(
                                      fontSize: 8,
                                      fontWeight: FontWeight.bold,
                                      color: cs.primary,
                                    ),
                                  )
                                : null,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],

              // Loading indicator
              if (_isLoading) ...[
                const SizedBox(width: 8),
                SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: cs.primary,
                  ),
                ),
              ],

              // Endorse hint for followers
              if (widget.canEndorse && !hasEndorsements && !_isLoading) ...[
                const SizedBox(width: 4),
                Icon(
                  Icons.add,
                  size: 14,
                  color: cs.onSurfaceVariant,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  double _calculateEndorsersWidth() {
    final count = widget.topEndorsers.take(3).length;
    if (count == 0) return 0;
    return 20.0 + (count - 1) * 14.0;
  }
}
