import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/nav.dart';

/// Bottom sheet for story/content creation options
class CreateStorySheet extends StatelessWidget {
  final VoidCallback? onPostCreated;

  const CreateStorySheet({Key? key, this.onPostCreated}) : super(key: key);

  static void show(BuildContext context, {VoidCallback? onPostCreated}) {
    HapticFeedback.mediumImpact();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => CreateStorySheet(onPostCreated: onPostCreated),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: cs.outline.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            Text(
              'Create',
              style: textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),

            // Options grid
            Row(
              children: [
                Expanded(
                  child: _CreateOption(
                    icon: Icons.edit_rounded,
                    label: 'Quick Post',
                    subtitle: 'Share a thought',
                    color: Colors.blue,
                    onTap: () {
                      Navigator.pop(context);
                      // Trigger post creation FAB
                      onPostCreated?.call();
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _CreateOption(
                    icon: Icons.mic_rounded,
                    label: 'Go Live',
                    subtitle: 'Start a space',
                    color: Colors.red,
                    onTap: () {
                      Navigator.pop(context);
                      context.push(AppRoutes.impactWithTab('spaces'));
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _CreateOption(
                    icon: Icons.poll_rounded,
                    label: 'Create Poll',
                    subtitle: 'Ask a question',
                    color: Colors.purple,
                    onTap: () {
                      Navigator.pop(context);
                      context.push(AppRoutes.impactWithTab('vibe'));
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _CreateOption(
                    icon: Icons.people_rounded,
                    label: 'Start Circle',
                    subtitle: 'Create a group',
                    color: Colors.green,
                    onTap: () {
                      Navigator.pop(context);
                      context.push(AppRoutes.impactWithTab('circles'));
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

/// Single create option card
class _CreateOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _CreateOption({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color),
            ),
            const SizedBox(height: 12),
            Text(
              label,
              style: textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: cs.onSurface,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: textTheme.bodySmall?.copyWith(
                color: cs.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
