import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/settings_components.dart';
import 'package:thittam1hub/widgets/settings/settings_tab_scaffold.dart';
import 'package:thittam1hub/services/chat_theme_service.dart';
import 'package:thittam1hub/models/chat_theme_settings.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/widgets/chat/chat_settings_shimmer.dart';

import 'package:thittam1hub/services/logging_service.dart';
/// Theme tab for Chat Settings
class ChatThemeTab extends StatefulWidget {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'ChatThemeTab';

  const ChatThemeTab({super.key});

  @override
  State<ChatThemeTab> createState() => _ChatThemeTabState();
}

class _ChatThemeTabState extends State<ChatThemeTab> {
  static const String _tag = 'ChatThemeTab';
  static final _log = LoggingService.instance;
  
  bool _isLoading = true;
  String? _error;
  ChatThemeSettings? _themeSettings;

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
      final settings = await ChatThemeService.instance.loadSettings();
      if (mounted) {
        setState(() {
          _themeSettings = settings;
          _isLoading = false;
        });
      }
    } catch (e) {
      _log.error('Failed to load theme settings: $e', tag: _tag);
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = 'Failed to load theme settings';
        });
      }
    }
  }

  Future<void> _updateSetting(ChatThemeSettings newSettings) async {
    setState(() => _themeSettings = newSettings);
    try {
      await ChatThemeService.instance.updateSettings(newSettings);
      HapticFeedback.selectionClick();
    } catch (e) {
      _log.error('Failed to update theme settings: $e', tag: _tag);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to save theme setting')),
        );
      }
    }
  }

  Future<void> _resetToDefaults() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Reset Theme?'),
        content: const Text('This will reset all chat theme settings to their defaults.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Reset'),
          ),
        ],
      ),
    );
    
    if (confirmed == true) {
      await ChatThemeService.instance.resetToDefaults();
      await _loadSettings();
      if (mounted) {
        HapticFeedback.mediumImpact();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Theme reset to defaults')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = _themeSettings ?? ChatThemeSettings.defaults(
      SupabaseConfig.auth.currentUser?.id ?? '',
    );

    // Convert accent color presets to Color objects
    final themeColors = ChatThemeSettings.accentColorPresets.map((hex) {
      final cleanHex = hex.replaceFirst('#', '');
      return Color(int.parse('FF$cleanHex', radix: 16));
    }).toList();

    return SettingsTabScaffold(
      isLoading: _isLoading,
      error: _error,
      onRetry: _loadSettings,
      onRefresh: _loadSettings,
      skeletonSections: 1,
      children: [
        SettingsSection(
          title: 'Chat Theme',
          icon: Icons.palette_outlined,
          iconColor: AppColors.pink500,
          children: [
            _ThemeSelector(
              selectedTheme: theme.selectedTheme,
              themes: ChatThemeSettings.themeOptions,
              onChanged: (v) {
                if (_themeSettings != null) {
                  _updateSetting(_themeSettings!.copyWith(selectedTheme: v));
                }
              },
            ),
            const SettingsDivider(),
            SettingsColorPicker(
              label: 'Accent Color',
              selectedColor: theme.accentColorValue,
              colors: themeColors,
              onChanged: (c) {
                if (_themeSettings != null) {
                  final hexColor = '#${c.value.toRadixString(16).substring(2).toUpperCase()}';
                  _updateSetting(_themeSettings!.copyWith(accentColor: hexColor));
                }
              },
            ),
            const SettingsDivider(),
            _BubbleStyleSelector(
              value: theme.bubbleStyle,
              styles: ChatThemeSettings.bubbleStyleOptions,
              onChanged: (v) {
                if (_themeSettings != null) {
                  _updateSetting(_themeSettings!.copyWith(bubbleStyle: v));
                }
              },
            ),
            const SettingsDivider(),
            SettingsSlider(
              label: 'Message Font Size',
              icon: Icons.text_fields,
              value: theme.fontSize.toDouble(),
              min: ChatThemeSettings.minFontSize.toDouble(),
              max: ChatThemeSettings.maxFontSize.toDouble(),
              divisions: (ChatThemeSettings.maxFontSize - ChatThemeSettings.minFontSize),
              valueLabel: (v) => '${v.toInt()}px',
              onChanged: (v) {
                if (_themeSettings != null) {
                  _updateSetting(_themeSettings!.copyWith(fontSize: v.toInt()));
                }
              },
            ),
            const SettingsDivider(),
            SettingsToggle(
              label: 'Reduced Motion',
              subtitle: 'Minimize animations in chat',
              icon: Icons.slow_motion_video,
              value: theme.reducedMotion,
              onChanged: (v) {
                if (_themeSettings != null) {
                  _updateSetting(_themeSettings!.copyWith(reducedMotion: v));
                }
              },
            ),
            const SettingsDivider(),
            SettingsAction(
              label: 'Reset to Defaults',
              subtitle: 'Restore original theme settings',
              icon: Icons.restore,
              onTap: _resetToDefaults,
            ),
          ],
        ),
      ],
    );
  }
}

/// Theme selector widget
class _ThemeSelector extends StatelessWidget {
  final String selectedTheme;
  final List<String> themes;
  final ValueChanged<String> onChanged;

  const _ThemeSelector({
    required this.selectedTheme,
    required this.themes,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
          child: Row(
            children: [
              Icon(Icons.format_paint_outlined, size: 20, color: cs.onSurfaceVariant),
              const SizedBox(width: AppSpacing.sm),
              Text(
                'Chat Background',
                style: context.textStyles.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        SizedBox(
          height: 80,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
            itemCount: themes.length,
            separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
            itemBuilder: (context, index) {
              final theme = themes[index];
              final isSelected = theme == selectedTheme;
              return _ThemeCard(
                theme: theme,
                isSelected: isSelected,
                onTap: () => onChanged(theme),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _ThemeCard extends StatelessWidget {
  final String theme;
  final bool isSelected;
  final VoidCallback onTap;

  const _ThemeCard({
    required this.theme,
    required this.isSelected,
    required this.onTap,
  });

  Color _getThemeColor() {
    switch (theme.toLowerCase()) {
      case 'default':
        return Colors.blueGrey;
      case 'dark':
        return Colors.grey[850]!;
      case 'light':
        return Colors.grey[200]!;
      case 'minimal':
        return Colors.white;
      case 'gradient':
        return Colors.purple;
      case 'nature':
        return Colors.green;
      default:
        return Colors.blueGrey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 72,
        decoration: BoxDecoration(
          color: _getThemeColor(),
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(
            color: isSelected ? cs.primary : cs.outline.withOpacity(0.2),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [BoxShadow(color: cs.primary.withOpacity(0.3), blurRadius: 8)]
              : null,
        ),
        child: Stack(
          children: [
            if (theme.toLowerCase() == 'gradient')
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppRadius.md - 1),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Colors.purple, Colors.blue],
                  ),
                ),
              ),
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (isSelected)
                    Icon(Icons.check_circle, color: cs.primary, size: 20)
                  else
                    const SizedBox(height: 20),
                  const SizedBox(height: 4),
                  Text(
                    theme,
                    style: context.textStyles.labelSmall?.copyWith(
                      color: theme.toLowerCase() == 'light' || theme.toLowerCase() == 'minimal'
                          ? Colors.black87
                          : Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Bubble style selector widget
class _BubbleStyleSelector extends StatelessWidget {
  final String value;
  final List<String> styles;
  final ValueChanged<String> onChanged;

  const _BubbleStyleSelector({
    required this.value,
    required this.styles,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
          child: Row(
            children: [
              Icon(Icons.chat_bubble_outline, size: 20, color: cs.onSurfaceVariant),
              const SizedBox(width: AppSpacing.sm),
              Text(
                'Bubble Style',
                style: context.textStyles.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: styles.map((style) {
            final isSelected = style == value;
            return ChoiceChip(
              label: Text(style),
              selected: isSelected,
              onSelected: (_) {
                HapticFeedback.selectionClick();
                onChanged(style);
              },
            );
          }).toList(),
        ),
      ],
    );
  }
}
