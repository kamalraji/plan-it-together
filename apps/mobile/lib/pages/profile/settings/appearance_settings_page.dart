import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:thittam1hub/services/theme_service.dart';
import 'package:thittam1hub/services/accessibility_service.dart';
import 'package:thittam1hub/mixins/settings_audit_mixin.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/settings_components.dart';
import 'package:thittam1hub/widgets/settings/settings_page_scaffold.dart';
import 'package:thittam1hub/widgets/common/settings_feedback.dart';

/// Appearance Settings - Theme, Accessibility
class AppearanceSettingsPage extends StatefulWidget {
  const AppearanceSettingsPage({super.key});

  @override
  State<AppearanceSettingsPage> createState() => _AppearanceSettingsPageState();
}

class _AppearanceSettingsPageState extends State<AppearanceSettingsPage>
    with SettingsAuditMixin {
  final _accessibilityService = AccessibilityService.instance;
  bool _isLoading = true;

  @override
  String get auditSettingType => 'appearance';

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    await _accessibilityService.loadSettings();
    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  /// Update accessibility setting with audit logging and optimistic feedback
  Future<void> _updateAccessibilitySetting({
    required String key,
    required dynamic oldValue,
    required dynamic newValue,
    required Future<void> Function() updateFn,
  }) async {
    HapticFeedback.selectionClick();
    
    try {
      await updateFn();
      logSettingChange(key: key, oldValue: oldValue, newValue: newValue);
    } catch (e) {
      HapticFeedback.heavyImpact();
      if (mounted) {
        SettingsFeedback.showError(context, 'Failed to save setting');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final themeService = context.watch<ThemeService>();

    return SettingsPageScaffold(
      title: 'Appearance',
      isLoading: _isLoading,
      onRefresh: _loadSettings,
      skeletonSections: 2,
      body: Column(
        children: [
          // Theme Section
          SettingsSection(
            title: 'Theme',
            icon: Icons.palette_outlined,
            iconColor: cs.primary,
            children: [
              _ThemeModeSelector(
                themeService: themeService,
                onThemeChanged: (oldMode, newMode) {
                  logSettingChange(
                    key: 'themeMode',
                    oldValue: oldMode.name,
                    newValue: newMode.name,
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // Accessibility Section
          ListenableBuilder(
            listenable: _accessibilityService,
            builder: (context, _) {
              return SettingsSection(
                title: 'Accessibility',
                icon: Icons.accessibility_new_outlined,
                iconColor: Colors.teal,
                children: [
                  SettingsSlider(
                    label: 'Text Size',
                    subtitle: 'Adjust text scaling',
                    value: _accessibilityService.textScaleFactor,
                    min: 0.8,
                    max: 1.5,
                    onChanged: (v) => _updateAccessibilitySetting(
                      key: 'textScaleFactor',
                      oldValue: _accessibilityService.textScaleFactor,
                      newValue: v,
                      updateFn: () => _accessibilityService.setTextScaleFactor(v),
                    ),
                  ),
                  SettingsToggle(
                    label: 'Bold Text',
                    subtitle: 'Make all text bolder for readability',
                    icon: Icons.format_bold_outlined,
                    value: _accessibilityService.boldTextEnabled,
                    onChanged: (v) => _updateAccessibilitySetting(
                      key: 'boldTextEnabled',
                      oldValue: _accessibilityService.boldTextEnabled,
                      newValue: v,
                      updateFn: () => _accessibilityService.setBoldTextEnabled(v),
                    ),
                  ),
                  SettingsToggle(
                    label: 'High Contrast',
                    subtitle: 'Increase color contrast for visibility',
                    icon: Icons.contrast_outlined,
                    value: _accessibilityService.highContrastEnabled,
                    onChanged: (v) => _updateAccessibilitySetting(
                      key: 'highContrastEnabled',
                      oldValue: _accessibilityService.highContrastEnabled,
                      newValue: v,
                      updateFn: () => _accessibilityService.setHighContrastEnabled(v),
                    ),
                  ),
                  SettingsToggle(
                    label: 'Reduce Motion',
                    subtitle: 'Minimize animations throughout the app',
                    icon: Icons.animation_outlined,
                    value: _accessibilityService.reduceMotionEnabled,
                    onChanged: (v) => _updateAccessibilitySetting(
                      key: 'reduceMotionEnabled',
                      oldValue: _accessibilityService.reduceMotionEnabled,
                      newValue: v,
                      updateFn: () => _accessibilityService.setReduceMotionEnabled(v),
                    ),
                  ),
                  SettingsToggle(
                    label: 'Larger Touch Targets',
                    subtitle: 'Increase button and control sizes',
                    icon: Icons.touch_app_outlined,
                    value: _accessibilityService.largerTouchTargets,
                    onChanged: (v) => _updateAccessibilitySetting(
                      key: 'largerTouchTargets',
                      oldValue: _accessibilityService.largerTouchTargets,
                      newValue: v,
                      updateFn: () => _accessibilityService.setLargerTouchTargets(v),
                    ),
                  ),
                  SettingsToggle(
                    label: 'Screen Reader Optimized',
                    subtitle: 'Enhanced labels for assistive technologies',
                    icon: Icons.record_voice_over_outlined,
                    value: _accessibilityService.screenReaderOptimized,
                    onChanged: (v) => _updateAccessibilitySetting(
                      key: 'screenReaderOptimized',
                      oldValue: _accessibilityService.screenReaderOptimized,
                      newValue: v,
                      updateFn: () => _accessibilityService.setScreenReaderOptimized(v),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _ThemeModeSelector extends StatefulWidget {
  final ThemeService themeService;
  final void Function(ThemeMode oldMode, ThemeMode newMode)? onThemeChanged;

  const _ThemeModeSelector({
    required this.themeService,
    this.onThemeChanged,
  });

  @override
  State<_ThemeModeSelector> createState() => _ThemeModeSelectorState();
}

class _ThemeModeSelectorState extends State<_ThemeModeSelector>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    // Respect reduce motion setting
    final duration = AccessibilityService.instance.effectiveDuration(
      const Duration(milliseconds: 300),
    );
    _animationController = AnimationController(
      duration: duration,
      vsync: this,
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _onThemeChanged(ThemeMode mode) {
    final oldMode = widget.themeService.themeMode;
    HapticFeedback.selectionClick();
    
    if (AccessibilityService.instance.reduceMotionEnabled) {
      widget.themeService.setThemeMode(mode);
      widget.onThemeChanged?.call(oldMode, mode);
    } else {
      _animationController.forward().then((_) {
        widget.themeService.setThemeMode(mode);
        widget.onThemeChanged?.call(oldMode, mode);
        _animationController.reverse();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDarkMode = widget.themeService.themeMode == ThemeMode.dark ||
        (widget.themeService.themeMode == ThemeMode.system &&
            MediaQuery.platformBrightnessOf(context) == Brightness.dark);

    // Use effective duration for animations
    final animDuration = AccessibilityService.instance.effectiveDuration(
      const Duration(milliseconds: 400),
    );

    return Semantics(
      label: 'Theme mode selector',
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text('Theme Mode', style: context.textStyles.bodyMedium),
                const Spacer(),
                AnimatedContainer(
                  duration: animDuration,
                  curve: Curves.easeInOut,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isDarkMode
                        ? cs.primary.withOpacity(0.15)
                        : Colors.amber.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: AnimatedSwitcher(
                    duration: animDuration,
                    transitionBuilder: (child, animation) {
                      if (AccessibilityService.instance.reduceMotionEnabled) {
                        return FadeTransition(opacity: animation, child: child);
                      }
                      return RotationTransition(
                        turns: Tween(begin: 0.0, end: 1.0).animate(
                          CurvedAnimation(parent: animation, curve: Curves.easeOutBack),
                        ),
                        child: ScaleTransition(scale: animation, child: child),
                      );
                    },
                    child: Icon(
                      isDarkMode ? Icons.dark_mode_rounded : Icons.light_mode_rounded,
                      key: ValueKey(isDarkMode),
                      color: isDarkMode ? cs.primary : Colors.amber.shade700,
                      size: 22,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: ThemeMode.values.map((mode) {
                final isSelected = widget.themeService.themeMode == mode;
                return Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(
                      right: mode != ThemeMode.values.last ? AppSpacing.sm : 0,
                    ),
                    child: _ThemeOptionButton(
                      icon: widget.themeService.getThemeModeIcon(mode),
                      label: widget.themeService.getThemeModeDisplayName(mode),
                      isSelected: isSelected,
                      onTap: () => _onThemeChanged(mode),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}

class _ThemeOptionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _ThemeOptionButton({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final animDuration = AccessibilityService.instance.effectiveDuration(
      const Duration(milliseconds: 250),
    );

    return Semantics(
      label: '$label theme',
      selected: isSelected,
      button: true,
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: animDuration,
          curve: Curves.easeOutCubic,
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm + 2),
          decoration: BoxDecoration(
            color: isSelected ? cs.primary : cs.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(AppRadius.sm),
            border: Border.all(
              color: isSelected ? cs.primary : cs.outline,
              width: isSelected ? 2 : 1,
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: cs.primary.withOpacity(0.3),
                      blurRadius: 12,
                      spreadRadius: 0,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Column(
            children: [
              Icon(
                icon,
                color: isSelected ? cs.onPrimary : cs.onSurfaceVariant,
                size: 22,
              ),
              const SizedBox(height: 6),
              Text(
                label,
                style: context.textStyles.labelSmall?.copyWith(
                  color: isSelected ? cs.onPrimary : cs.onSurface,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
