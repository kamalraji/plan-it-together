import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/auth/supabase_auth_manager.dart';
import 'package:thittam1hub/pages/profile/settings/changelog_page.dart';
import 'package:thittam1hub/widgets/settings_components.dart';
import 'package:thittam1hub/widgets/settings/settings_page_scaffold.dart';
import 'package:thittam1hub/widgets/common/settings_feedback.dart';

/// About & Help Settings Page
class AboutSettingsPage extends StatelessWidget {
  const AboutSettingsPage({super.key});

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _requestDataExport(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Download Your Data'),
        content: const Text(
          'We\'ll prepare a copy of your data and send it to your email address. This may take up to 48 hours.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Request Export'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      SettingsFeedback.showSuccess(context, 'Data export request submitted');
    }
  }

  Future<void> _handleDeleteAccount(BuildContext context) async {
    final authManager = SupabaseAuthManager();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Account'),
        content: const Text(
          'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      try {
        await authManager.deleteUser(context);
      } catch (e) {
        if (context.mounted) {
          SettingsFeedback.showError(context, 'Failed to delete account: $e');
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return SettingsPageScaffold(
      title: 'Help & About',
      body: Column(
        children: [
          // Help Section
          SettingsSection(
            title: 'Help & Support',
            icon: Icons.help_outline,
            iconColor: Colors.orange,
            children: [
              SettingsAction(
                label: 'Help Center',
                subtitle: 'Browse FAQs and guides',
                icon: Icons.menu_book_outlined,
                onTap: () => _openUrl('https://help.thittam1hub.com'),
              ),
              SettingsAction(
                label: 'Contact Support',
                subtitle: 'Get help from our team',
                icon: Icons.support_agent_outlined,
                onTap: () => _openUrl('mailto:support@thittam1hub.com'),
              ),
              SettingsAction(
                label: 'Report a Bug',
                subtitle: 'Help us improve the app',
                icon: Icons.bug_report_outlined,
                onTap: () => _openUrl('https://thittam1hub.com/bug-report'),
              ),
              SettingsAction(
                label: 'Feature Request',
                subtitle: 'Suggest new features',
                icon: Icons.lightbulb_outline,
                onTap: () => _openUrl('https://thittam1hub.com/feature-request'),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // Data & Privacy
          SettingsSection(
            title: 'Data & Privacy',
            icon: Icons.privacy_tip_outlined,
            iconColor: Colors.purple,
            children: [
              SettingsAction(
                label: 'Download My Data',
                subtitle: 'Export all your personal data',
                icon: Icons.download_outlined,
                onTap: () => _requestDataExport(context),
              ),
              SettingsAction(
                label: 'Privacy Policy',
                subtitle: 'Review how we handle your data',
                icon: Icons.policy_outlined,
                onTap: () => _openUrl('https://thittam1hub.com/privacy'),
              ),
              SettingsAction(
                label: 'Terms of Service',
                subtitle: 'Review our terms',
                icon: Icons.description_outlined,
                onTap: () => _openUrl('https://thittam1hub.com/terms'),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // About Section
          SettingsSection(
            title: 'About',
            icon: Icons.info_outline,
            iconColor: cs.tertiary,
            children: [
              SettingsInfo(
                label: 'App Version',
                value: '1.0.0 (Build 42)',
                icon: Icons.info_outline,
                canCopy: true,
              ),
              SettingsAction(
                label: "What's New",
                subtitle: 'View recent updates',
                icon: Icons.new_releases_outlined,
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ChangelogPage()),
                ),
              ),
              SettingsAction(
                label: 'Rate the App',
                subtitle: 'Leave a review',
                icon: Icons.star_outline,
                onTap: () => _openUrl('https://play.google.com/store/apps/details?id=com.thittam1hub'),
              ),
              SettingsAction(
                label: 'Open Source Licenses',
                subtitle: 'Third-party libraries',
                icon: Icons.code_outlined,
                onTap: () => showLicensePage(
                  context: context,
                  applicationName: 'Thittam1Hub',
                  applicationVersion: '1.0.0',
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),

          // Danger Zone
          Semantics(
            label: 'Danger zone - account deletion',
            child: Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.md),
                side: BorderSide(color: AppColors.error.withOpacity(0.5)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'DANGER ZONE',
                      style: context.textStyles.labelSmall?.withColor(AppColors.error),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    OutlinedButton(
                      onPressed: () => _handleDeleteAccount(context),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: const BorderSide(color: AppColors.error),
                        minimumSize: const Size.fromHeight(48),
                      ),
                      child: const Text('Delete Account'),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}
