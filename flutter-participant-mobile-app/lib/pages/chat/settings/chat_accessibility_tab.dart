import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/settings_components.dart';
import 'package:thittam1hub/widgets/settings/settings_tab_scaffold.dart';
import 'package:thittam1hub/services/accessibility_service.dart';

import 'package:thittam1hub/services/logging_service.dart';
/// Accessibility tab for Chat Settings
class ChatAccessibilityTab extends StatefulWidget {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'ChatAccessibilityTab';

  const ChatAccessibilityTab({super.key});

  @override
  State<ChatAccessibilityTab> createState() => _ChatAccessibilityTabState();
}

class _ChatAccessibilityTabState extends State<ChatAccessibilityTab> {
  static const String _tag = 'ChatAccessibilityTab';
  static final _log = LoggingService.instance;
  
  bool _isLoading = true;
  String? _error;

  // Accessibility settings
  bool _highContrast = false;
  bool _largerTouchTargets = false;
  bool _screenReaderOptimized = false;
  bool _boldText = false;
  double _textScaleFactor = 1.0;
  bool _reduceMotion = false;

  final _accessibilityService = AccessibilityService.instance;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await _accessibilityService.loadSettings();
      if (mounted) {
        setState(() {
          _highContrast = _accessibilityService.highContrastEnabled;
          _largerTouchTargets = _accessibilityService.largerTouchTargets;
          _screenReaderOptimized = _accessibilityService.screenReaderOptimized;
          _boldText = _accessibilityService.boldTextEnabled;
          _textScaleFactor = _accessibilityService.textScaleFactor;
          _reduceMotion = _accessibilityService.reduceMotionEnabled;
          _isLoading = false;
        });
      }
    } catch (e) {
      _log.error('Failed to load accessibility settings: $e', tag: _tag);
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = 'Failed to load settings';
        });
      }
    }
  }

  Future<void> _updateSetting(Future<void> Function() update) async {
    try {
      await update();
      HapticFeedback.selectionClick();
    } catch (e) {
      _log.error('Failed to update accessibility setting: $e', tag: _tag);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Failed to save setting'),
            backgroundColor: Theme.of(context).colorScheme.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return SettingsTabScaffold(
      isLoading: _isLoading,
      error: _error,
      onRetry: _loadSettings,
      onRefresh: _loadSettings,
      header: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.amber500.withOpacity(0.1),
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.amber500.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            Icon(Icons.accessibility_new, color: AppColors.amber500, size: 24),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Text(
                'These settings help make the chat experience more accessible for everyone.',
                style: context.textStyles.bodySmall?.copyWith(
                  color: cs.onSurfaceVariant,
                ),
              ),
            ),
          ],
        ),
      ),
      children: [
        SettingsSection(
          title: 'Accessibility',
          icon: Icons.accessibility_new,
          iconColor: AppColors.amber500,
          children: [
            SettingsToggle(
              label: 'High Contrast Mode',
              subtitle: 'Increase text and UI contrast',
              icon: Icons.contrast,
              value: _highContrast,
              onChanged: (v) {
                setState(() => _highContrast = v);
                _updateSetting(() => _accessibilityService.setHighContrastEnabled(v));
              },
            ),
            const SettingsDivider(),
            SettingsToggle(
              label: 'Larger Touch Targets',
              subtitle: 'Make buttons and links easier to tap',
              icon: Icons.touch_app,
              value: _largerTouchTargets,
              onChanged: (v) {
                setState(() => _largerTouchTargets = v);
                _updateSetting(() => _accessibilityService.setLargerTouchTargets(v));
              },
            ),
            const SettingsDivider(),
            SettingsToggle(
              label: 'Screen Reader Optimized',
              subtitle: 'Improve compatibility with screen readers',
              icon: Icons.record_voice_over,
              value: _screenReaderOptimized,
              onChanged: (v) {
                setState(() => _screenReaderOptimized = v);
                _updateSetting(() => _accessibilityService.setScreenReaderOptimized(v));
              },
            ),
            const SettingsDivider(),
            SettingsToggle(
              label: 'Bold Text',
              subtitle: 'Use heavier font weights for better readability',
              icon: Icons.format_bold,
              value: _boldText,
              onChanged: (v) {
                setState(() => _boldText = v);
                _updateSetting(() => _accessibilityService.setBoldTextEnabled(v));
              },
            ),
            const SettingsDivider(),
            SettingsSlider(
              label: 'Text Size',
              icon: Icons.text_fields,
              value: _textScaleFactor,
              min: 0.8,
              max: 1.5,
              divisions: 7,
              valueLabel: (v) => '${(v * 100).toInt()}%',
              onChanged: (v) {
                setState(() => _textScaleFactor = v);
                _updateSetting(() => _accessibilityService.setTextScaleFactor(v));
              },
            ),
            const SettingsDivider(),
            SettingsToggle(
              label: 'Reduce Motion',
              subtitle: 'Minimize animations throughout the app',
              icon: Icons.slow_motion_video,
              value: _reduceMotion,
              onChanged: (v) {
                setState(() => _reduceMotion = v);
                _updateSetting(() => _accessibilityService.setReduceMotionEnabled(v));
              },
            ),
          ],
        ),

        // Preview section
        SettingsSection(
          title: 'Preview',
          icon: Icons.preview,
          iconColor: cs.primary,
          helpText: 'See how your accessibility settings affect the chat experience',
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: cs.surfaceContainerLow,
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Sample message bubbles
                  _SampleMessageBubble(
                    message: 'Hello! How are you?',
                    isMe: false,
                    textScale: _textScaleFactor,
                    highContrast: _highContrast,
                    boldText: _boldText,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  _SampleMessageBubble(
                    message: "I'm doing great, thanks for asking!",
                    isMe: true,
                    textScale: _textScaleFactor,
                    highContrast: _highContrast,
                    boldText: _boldText,
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }
}

/// Sample message bubble for preview
class _SampleMessageBubble extends StatelessWidget {
  final String message;
  final bool isMe;
  final double textScale;
  final bool highContrast;
  final bool boldText;

  const _SampleMessageBubble({
    required this.message,
    required this.isMe,
    required this.textScale,
    required this.highContrast,
    required this.boldText,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.65,
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        decoration: BoxDecoration(
          color: isMe
              ? (highContrast ? cs.primary : cs.primaryContainer)
              : (highContrast ? cs.surfaceContainerHighest : cs.surfaceContainerHigh),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 16),
          ),
          border: highContrast
              ? Border.all(
                  color: isMe ? cs.primary : cs.outline,
                  width: 1.5,
                )
              : null,
        ),
        child: Text(
          message,
          style: TextStyle(
            fontSize: 14 * textScale,
            fontWeight: boldText ? FontWeight.w600 : FontWeight.normal,
            color: isMe
                ? (highContrast ? cs.onPrimary : cs.onPrimaryContainer)
                : (highContrast ? cs.onSurface : cs.onSurfaceVariant),
          ),
        ),
      ),
    );
  }
}
