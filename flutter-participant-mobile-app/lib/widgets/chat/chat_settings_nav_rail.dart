import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/chat_settings_section.dart';
import 'package:thittam1hub/theme.dart';

// Re-export for backward compatibility
export 'package:thittam1hub/models/chat_settings_section.dart';

/// Responsive navigation rail for Chat Settings master-detail layout
class ChatSettingsNavRail extends StatelessWidget {
  final ChatSettingsSection? selectedSection;
  final ValueChanged<ChatSettingsSection> onSectionSelected;
  final bool isExpanded;
  final VoidCallback? onToggleExpanded;

  const ChatSettingsNavRail({
    super.key,
    required this.selectedSection,
    required this.onSectionSelected,
    this.isExpanded = true,
    this.onToggleExpanded,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final width = isExpanded ? 220.0 : 72.0;
    
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOutCubic,
      width: width,
      decoration: BoxDecoration(
        color: cs.surfaceContainerLowest,
        border: Border(
          right: BorderSide(
            color: cs.outlineVariant.withOpacity(0.5),
            width: 1,
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          _buildHeader(context, cs),
          
          const SizedBox(height: AppSpacing.sm),
          
          // Section list
          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.symmetric(
                horizontal: isExpanded ? AppSpacing.sm : 8,
                vertical: AppSpacing.sm,
              ),
              itemCount: ChatSettingsSection.values.length,
              itemBuilder: (context, index) {
                final section = ChatSettingsSection.values[index];
                final isSelected = selectedSection == section;
                return _NavRailItem(
                  section: section,
                  isSelected: isSelected,
                  isExpanded: isExpanded,
                  onTap: () {
                    HapticFeedback.selectionClick();
                    onSectionSelected(section);
                  },
                );
              },
            ),
          ),
          
          // Collapse toggle (optional)
          if (onToggleExpanded != null)
            _buildCollapseButton(context, cs),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, ColorScheme cs) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: EdgeInsets.symmetric(
        horizontal: isExpanded ? AppSpacing.lg : AppSpacing.sm,
        vertical: AppSpacing.md,
      ),
      child: Row(
        children: [
          Icon(
            Icons.settings_outlined,
            size: 20,
            color: cs.primary,
          ),
          if (isExpanded) ...[
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Text(
                'Settings',
                style: context.textStyles.titleSmall?.copyWith(
                  color: cs.onSurface,
                  fontWeight: FontWeight.w600,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCollapseButton(BuildContext context, ColorScheme cs) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.sm),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            onToggleExpanded?.call();
          },
          borderRadius: BorderRadius.circular(AppRadius.md),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: EdgeInsets.symmetric(
              horizontal: isExpanded ? AppSpacing.md : AppSpacing.sm,
              vertical: AppSpacing.sm,
            ),
            child: Row(
              mainAxisAlignment: isExpanded 
                  ? MainAxisAlignment.start 
                  : MainAxisAlignment.center,
              children: [
                AnimatedRotation(
                  turns: isExpanded ? 0 : 0.5,
                  duration: const Duration(milliseconds: 200),
                  child: Icon(
                    Icons.chevron_left,
                    size: 20,
                    color: cs.onSurfaceVariant,
                  ),
                ),
                if (isExpanded) ...[
                  const SizedBox(width: AppSpacing.sm),
                  Text(
                    'Collapse',
                    style: context.textStyles.bodySmall?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Individual navigation rail item
class _NavRailItem extends StatelessWidget {
  final ChatSettingsSection section;
  final bool isSelected;
  final bool isExpanded;
  final VoidCallback onTap;

  const _NavRailItem({
    required this.section,
    required this.isSelected,
    required this.isExpanded,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadius.md),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: EdgeInsets.symmetric(
              horizontal: isExpanded ? AppSpacing.md : AppSpacing.sm,
              vertical: AppSpacing.sm + 2,
            ),
            decoration: BoxDecoration(
              color: isSelected 
                  ? cs.primaryContainer.withOpacity(0.8)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: isSelected
                  ? Border.all(
                      color: cs.primary.withOpacity(0.3),
                      width: 1,
                    )
                  : null,
            ),
            child: Row(
              mainAxisAlignment: isExpanded 
                  ? MainAxisAlignment.start 
                  : MainAxisAlignment.center,
              children: [
                Icon(
                  section.icon,
                  size: 20,
                  color: isSelected 
                      ? cs.onPrimaryContainer 
                      : cs.onSurfaceVariant,
                ),
                if (isExpanded) ...[
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Text(
                      section.label,
                      style: context.textStyles.bodyMedium?.copyWith(
                        color: isSelected 
                            ? cs.onPrimaryContainer 
                            : cs.onSurface,
                        fontWeight: isSelected 
                            ? FontWeight.w600 
                            : FontWeight.w500,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
