import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/ai_matching_privacy_settings.dart';
import 'package:thittam1hub/services/ai_matching_privacy_service.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/settings_components.dart';
import 'package:thittam1hub/widgets/styled_bottom_sheet.dart';

/// Bottom sheet for managing AI Matching privacy settings
/// 
/// Provides controls for:
/// - Enabling/disabling AI matching
/// - Visibility in recommendations
/// - Data source inclusion
/// - Hidden users management
class AIMatchingPrivacySheet extends StatefulWidget {
  const AIMatchingPrivacySheet({super.key});

  /// Show the sheet as a modal bottom sheet
  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const AIMatchingPrivacySheet(),
    );
  }

  @override
  State<AIMatchingPrivacySheet> createState() => _AIMatchingPrivacySheetState();
}

class _AIMatchingPrivacySheetState extends State<AIMatchingPrivacySheet> {
  static const String _tag = 'AIMatchingPrivacySheet';
  static final _log = LoggingService.instance;

  final _service = AIMatchingPrivacyService.instance;
  
  AIMatchingPrivacySettings? _settings;
  bool _isLoading = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    try {
      final settings = await _service.getSettings();
      if (mounted) {
        setState(() {
          _settings = settings;
          _isLoading = false;
        });
      }
    } catch (e) {
      _log.error('Failed to load settings: $e', tag: _tag);
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _updateSetting(AIMatchingPrivacySettings newSettings) async {
    setState(() {
      _settings = newSettings;
      _isSaving = true;
    });

    try {
      await _service.updateSettings(newSettings);
      HapticFeedback.lightImpact();
    } catch (e) {
      _log.error('Failed to save settings: $e', tag: _tag);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to save settings')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return StyledBottomSheet(
      title: 'AI Matching Privacy',
      subtitle: 'Control how AI matching uses your data',
      icon: Icons.psychology_outlined,
      iconColor: cs.primary,
      child: _isLoading
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(AppSpacing.xl),
                child: CircularProgressIndicator(),
              ),
            )
          : _buildContent(cs),
    );
  }

  Widget _buildContent(ColorScheme cs) {
    if (_settings == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, size: 48, color: cs.error),
              const SizedBox(height: AppSpacing.md),
              Text(
                'Failed to load settings',
                style: context.textStyles.bodyMedium,
              ),
              const SizedBox(height: AppSpacing.md),
              FilledButton(
                onPressed: _loadSettings,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Master Toggle
          _buildMasterToggle(cs),
          const SizedBox(height: AppSpacing.lg),

          // Only show other settings if AI matching is enabled
          if (_settings!.aiMatchingEnabled) ...[
            // Visibility Section
            _buildVisibilitySection(cs),
            const SizedBox(height: AppSpacing.lg),

            // Data Sources Section
            _buildDataSourcesSection(cs),
            const SizedBox(height: AppSpacing.lg),

            // Hidden Users Section
            _buildHiddenUsersSection(cs),
            const SizedBox(height: AppSpacing.lg),

            // AI Insights Toggle
            _buildInsightsSection(cs),
          ],

          // Consent Info
          _buildConsentInfo(cs),
          const SizedBox(height: AppSpacing.xl),
        ],
      ),
    );
  }

  Widget _buildMasterToggle(ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: _settings!.aiMatchingEnabled
              ? [cs.primaryContainer, cs.primaryContainer.withOpacity(0.7)]
              : [cs.surfaceContainerHighest, cs.surfaceContainerHighest.withOpacity(0.7)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(
          color: _settings!.aiMatchingEnabled
              ? cs.primary.withOpacity(0.3)
              : cs.outline.withOpacity(0.2),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.sm),
            decoration: BoxDecoration(
              color: _settings!.aiMatchingEnabled
                  ? cs.primary.withOpacity(0.2)
                  : cs.onSurface.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            ),
            child: Icon(
              Icons.auto_awesome,
              color: _settings!.aiMatchingEnabled ? cs.primary : cs.onSurfaceVariant,
              size: 28,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AI-Powered Matching',
                  style: context.textStyles.titleMedium?.semiBold,
                ),
                const SizedBox(height: 2),
                Text(
                  _settings!.aiMatchingEnabled
                      ? 'Finding your best connections'
                      : 'Disabled - using basic matching only',
                  style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                ),
              ],
            ),
          ),
          Switch.adaptive(
            value: _settings!.aiMatchingEnabled,
            onChanged: (value) {
              _updateSetting(_settings!.copyWith(
                aiMatchingEnabled: value,
                consentGivenAt: value && !_settings!.hasConsent
                    ? DateTime.now()
                    : _settings!.consentGivenAt,
              ));
            },
          ),
        ],
      ),
    );
  }

  Widget _buildVisibilitySection(ColorScheme cs) {
    return SettingsSection(
      title: 'Visibility',
      icon: Icons.visibility_outlined,
      iconColor: Colors.blue,
      helpText: 'Control who can see you in AI-powered recommendations',
      children: [
        SettingsToggle(
          label: 'Show in Recommendations',
          subtitle: 'Appear in other users\' match suggestions',
          icon: Icons.recommend_outlined,
          value: _settings!.showInRecommendations,
          onChanged: (value) {
            _updateSetting(_settings!.copyWith(showInRecommendations: value));
          },
        ),
        SettingsToggle(
          label: 'Mutual Interests Only',
          subtitle: 'Only show me to users with shared interests',
          icon: Icons.handshake_outlined,
          value: _settings!.onlyShowToMutualInterests,
          onChanged: (value) {
            _updateSetting(_settings!.copyWith(onlyShowToMutualInterests: value));
          },
        ),
      ],
    );
  }

  Widget _buildDataSourcesSection(ColorScheme cs) {
    return SettingsSection(
      title: 'Data Sources',
      icon: Icons.data_usage_outlined,
      iconColor: Colors.orange,
      helpText: 'Choose what information AI uses to find matches. '
          'More data = better matches, but you control what\'s shared.',
      children: [
        SettingsToggle(
          label: 'Skills & Expertise',
          subtitle: 'Use your skills to find complementary matches',
          icon: Icons.psychology_alt_outlined,
          value: _settings!.includeSkillsInMatching,
          onChanged: (value) {
            _updateSetting(_settings!.copyWith(includeSkillsInMatching: value));
          },
        ),
        SettingsToggle(
          label: 'Interests & Topics',
          subtitle: 'Match based on shared interests',
          icon: Icons.interests_outlined,
          value: _settings!.includeInterestsInMatching,
          onChanged: (value) {
            _updateSetting(_settings!.copyWith(includeInterestsInMatching: value));
          },
        ),
        SettingsToggle(
          label: 'Bio & About',
          subtitle: 'Include your profile bio in matching',
          icon: Icons.description_outlined,
          value: _settings!.includeBioInMatching,
          onChanged: (value) {
            _updateSetting(_settings!.copyWith(includeBioInMatching: value));
          },
        ),
        SettingsToggle(
          label: 'Activity & Engagement',
          subtitle: 'Consider event attendance and activity patterns',
          icon: Icons.trending_up_outlined,
          value: _settings!.includeActivityInMatching,
          onChanged: (value) {
            _updateSetting(_settings!.copyWith(includeActivityInMatching: value));
          },
        ),
      ],
    );
  }

  Widget _buildHiddenUsersSection(ColorScheme cs) {
    final hiddenCount = _settings!.hideFromUsers.length;

    return SettingsSection(
      title: 'Hidden Users',
      icon: Icons.person_off_outlined,
      iconColor: Colors.red,
      children: [
        SettingsAction(
          label: 'Manage Hidden Users',
          subtitle: hiddenCount == 0
              ? 'No users hidden from your matches'
              : '$hiddenCount user${hiddenCount == 1 ? '' : 's'} hidden',
          icon: Icons.block_outlined,
          trailing: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.sm,
              vertical: AppSpacing.xs,
            ),
            decoration: BoxDecoration(
              color: hiddenCount > 0 ? cs.errorContainer : cs.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
            ),
            child: Text(
              '$hiddenCount',
              style: context.textStyles.labelSmall?.copyWith(
                color: hiddenCount > 0 ? cs.onErrorContainer : cs.onSurfaceVariant,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          onTap: () => _showHiddenUsersDialog(cs),
        ),
      ],
    );
  }

  Widget _buildInsightsSection(ColorScheme cs) {
    return SettingsSection(
      title: 'AI Insights',
      icon: Icons.lightbulb_outlined,
      iconColor: Colors.amber,
      helpText: 'AI insights provide conversation starters and connection tips',
      children: [
        SettingsToggle(
          label: 'Enable AI Insights',
          subtitle: 'Get personalized tips for connecting with matches',
          icon: Icons.tips_and_updates_outlined,
          value: _settings!.allowAiInsights,
          onChanged: (value) {
            _updateSetting(_settings!.copyWith(allowAiInsights: value));
          },
        ),
      ],
    );
  }

  Widget _buildConsentInfo(ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(color: cs.outline.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info_outline, size: 16, color: cs.onSurfaceVariant),
              const SizedBox(width: AppSpacing.xs),
              Text(
                'Privacy Information',
                style: context.textStyles.labelMedium?.semiBold,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Your data is processed locally and securely. AI matching uses '
            'anonymized patterns to find connections. You can withdraw consent '
            'at any time by disabling AI matching.',
            style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
          ),
          if (_settings!.hasConsent) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Consent given: ${_formatDate(_settings!.consentGivenAt!)}',
              style: context.textStyles.labelSmall?.withColor(cs.outline),
            ),
          ],
          if (_settings!.lastReviewedAt != null) ...[
            Text(
              'Last reviewed: ${_formatDate(_settings!.lastReviewedAt!)}',
              style: context.textStyles.labelSmall?.withColor(cs.outline),
            ),
          ],
          const SizedBox(height: AppSpacing.md),
          if (_settings!.aiMatchingEnabled)
            TextButton.icon(
              onPressed: _showRevokeConsentDialog,
              icon: Icon(Icons.cancel_outlined, size: 18, color: cs.error),
              label: Text(
                'Revoke Consent & Disable',
                style: TextStyle(color: cs.error),
              ),
            ),
        ],
      ),
    );
  }

  void _showHiddenUsersDialog(ColorScheme cs) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hidden Users'),
        content: _settings!.hideFromUsers.isEmpty
            ? const Text(
                'You haven\'t hidden any users yet.\n\n'
                'You can hide users from your profile or match cards to prevent '
                'them from appearing in your recommendations.',
              )
            : Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'These users are hidden from your matches:',
                    style: context.textStyles.bodyMedium,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  ..._settings!.hideFromUsers.map((userId) => ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: CircleAvatar(
                          backgroundColor: cs.surfaceContainerHighest,
                          child: Icon(Icons.person, color: cs.onSurfaceVariant),
                        ),
                        title: Text(
                          'User ${userId.substring(0, 8)}...',
                          style: context.textStyles.bodyMedium,
                        ),
                        trailing: IconButton(
                          icon: Icon(Icons.visibility, color: cs.primary),
                          tooltip: 'Unhide',
                          onPressed: () async {
                            await _service.unhideUser(userId);
                            await _loadSettings();
                            if (mounted) Navigator.pop(context);
                          },
                        ),
                      )),
                ],
              ),
        actions: [
          if (_settings!.hideFromUsers.isNotEmpty)
            TextButton(
              onPressed: () async {
                await _service.clearHiddenUsers();
                await _loadSettings();
                if (mounted) Navigator.pop(context);
              },
              child: Text('Unhide All', style: TextStyle(color: cs.error)),
            ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _showRevokeConsentDialog() {
    final cs = Theme.of(context).colorScheme;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: cs.error),
            const SizedBox(width: AppSpacing.sm),
            const Text('Revoke Consent?'),
          ],
        ),
        content: const Text(
          'This will:\n\n'
          '• Disable AI-powered matching\n'
          '• Remove your data from AI recommendations\n'
          '• Delete your AI match insights\n\n'
          'You can re-enable this at any time.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.pop(context);
              await _service.revokeConsent();
              await _loadSettings();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('AI matching consent revoked')),
                );
              }
            },
            style: FilledButton.styleFrom(backgroundColor: cs.error),
            child: const Text('Revoke'),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
