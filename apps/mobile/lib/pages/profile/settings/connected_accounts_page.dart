import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/settings_components.dart';
import 'package:thittam1hub/widgets/settings/settings_page_scaffold.dart';
import 'package:thittam1hub/widgets/common/settings_feedback.dart';

/// OAuth provider enum for Supabase authentication
enum OAuthProviderType { google, apple, github }

/// Connected Accounts Settings Page with real OAuth status
class ConnectedAccountsPage extends StatefulWidget {
  const ConnectedAccountsPage({super.key});

  @override
  State<ConnectedAccountsPage> createState() => _ConnectedAccountsPageState();
}

class _ConnectedAccountsPageState extends State<ConnectedAccountsPage> {
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, _LinkedIdentity> _identities = {};

  @override
  void initState() {
    super.initState();
    _loadIdentities();
  }

  Future<void> _loadIdentities() async {
    setState(() { _isLoading = true; _errorMessage = null; });
    try {
      final user = SupabaseConfig.auth.currentUser;
      final identities = user?.identities ?? [];
      final Map<String, _LinkedIdentity> result = {};
      for (final identity in identities) {
        result[identity.provider] = _LinkedIdentity(
          provider: identity.provider,
          email: identity.identityData?['email'] as String?,
          name: identity.identityData?['full_name'] as String? ?? identity.identityData?['name'] as String?,
          username: identity.identityData?['user_name'] as String? ?? identity.identityData?['preferred_username'] as String?,
          createdAt: identity.createdAt,
        );
      }
      if (mounted) setState(() { _identities = result; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _errorMessage = 'Failed to load connected accounts'; _isLoading = false; });
    }
  }

  Future<void> _connectAccount(String providerName) async {
    HapticFeedback.lightImpact();
    try {
      SettingsFeedback.showLoading(context, 'Connecting to $providerName...');
      final provider = _getProvider(providerName);
      await SupabaseConfig.auth.signInWithOAuth(provider, redirectTo: 'io.supabase.thittam1hub://login-callback/');
      await _loadIdentities();
      if (mounted) { SettingsFeedback.hideLoading(context); SettingsFeedback.showSuccess(context, '$providerName connected successfully'); }
    } catch (e) {
      if (mounted) { SettingsFeedback.hideLoading(context); SettingsFeedback.showError(context, 'Failed to connect $providerName'); }
    }
  }

  Future<void> _disconnectAccount(String provider) async {
    final user = SupabaseConfig.auth.currentUser;
    final identities = user?.identities ?? [];
    
    // Prevent lockout: require at least 2 identities to unlink
    if (identities.length < 2) {
      HapticFeedback.heavyImpact();
      SettingsFeedback.showError(
        context,
        'You need at least one other sign-in method before disconnecting $provider',
      );
      return;
    }
    
    // Find the identity to unlink
    final identity = identities.cast<UserIdentity?>().firstWhere(
      (i) => i?.provider.toLowerCase() == provider.toLowerCase(),
      orElse: () => null,
    );
    
    if (identity == null) {
      SettingsFeedback.showError(context, '$provider account not found');
      return;
    }
    
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Disconnect Account'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Are you sure you want to disconnect your $provider account?'),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.errorContainer.withOpacity(0.3),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: Theme.of(context).colorScheme.error, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'You won\'t be able to sign in with $provider after disconnecting.',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Disconnect'),
          ),
        ],
      ),
    );
    
    if (confirmed != true || !mounted) return;
    
    HapticFeedback.mediumImpact();
    SettingsFeedback.showLoading(context, 'Disconnecting $provider...');
    
    try {
      await SupabaseConfig.auth.unlinkIdentity(identity);
      await _loadIdentities();
      if (mounted) {
        SettingsFeedback.hideLoading(context);
        SettingsFeedback.showSuccess(context, '$provider disconnected successfully');
      }
    } catch (e) {
      if (mounted) {
        SettingsFeedback.hideLoading(context);
        SettingsFeedback.showError(context, 'Failed to disconnect $provider');
      }
    }
  }

  OAuthProvider _getProvider(String provider) {
    switch (provider.toLowerCase()) {
      case 'google': return OAuthProvider.google;
      case 'apple': return OAuthProvider.apple;
      case 'github': return OAuthProvider.github;
      default: return OAuthProvider.google;
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return SettingsPageScaffold(
      title: 'Connected Accounts', isLoading: _isLoading, errorMessage: _errorMessage,
      onRetry: _loadIdentities, onRefresh: _loadIdentities, skeletonSections: 1,
      body: Column(children: [
        SettingsSection(title: 'Social Accounts', icon: Icons.link, iconColor: Colors.cyan, children: [
          _LinkedAccountRow(icon: Icons.g_mobiledata, iconColor: Colors.red, name: 'Google', identity: _identities['google'], onConnect: () => _connectAccount('google'), onDisconnect: () => _disconnectAccount('google')),
          _LinkedAccountRow(icon: Icons.apple, iconColor: cs.onSurface, name: 'Apple', identity: _identities['apple'], onConnect: () => _connectAccount('apple'), onDisconnect: () => _disconnectAccount('apple')),
          _LinkedAccountRow(icon: Icons.code, iconColor: cs.onSurface, name: 'GitHub', identity: _identities['github'], onConnect: () => _connectAccount('github'), onDisconnect: () => _disconnectAccount('github')),
        ]),
        const SizedBox(height: AppSpacing.lg),
        Card(color: cs.surfaceContainerHighest, child: Padding(padding: const EdgeInsets.all(AppSpacing.md), child: Row(children: [
          Icon(Icons.info_outline, color: cs.onSurfaceVariant, size: 20), const SizedBox(width: AppSpacing.sm),
          Expanded(child: Text('Connect accounts for quick sign-in and enhanced features.', style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant))),
        ]))),
      ]),
    );
  }
}

class _LinkedIdentity { final String provider; final String? email, name, username, createdAt;
  const _LinkedIdentity({required this.provider, this.email, this.name, this.username, this.createdAt});
  String get displayStatus => username?.isNotEmpty == true ? '@$username' : (email?.isNotEmpty == true ? email! : (name?.isNotEmpty == true ? name! : 'Connected'));
}

class _LinkedAccountRow extends StatelessWidget {
  final IconData icon; final Color iconColor; final String name; final _LinkedIdentity? identity; final VoidCallback onConnect, onDisconnect;
  const _LinkedAccountRow({required this.icon, required this.iconColor, required this.name, required this.identity, required this.onConnect, required this.onDisconnect});
  bool get isConnected => identity != null;
  @override Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return InkWell(onTap: isConnected ? onDisconnect : onConnect, child: Padding(padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm), child: Row(children: [
      Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: iconColor.withOpacity(0.1), borderRadius: BorderRadius.circular(8)), child: Icon(icon, color: iconColor, size: 20)),
      const SizedBox(width: AppSpacing.md),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(name, style: context.textStyles.bodyMedium), Text(isConnected ? identity!.displayStatus : 'Not connected', style: context.textStyles.bodySmall?.withColor(isConnected ? Colors.green : cs.onSurfaceVariant))])),
      Icon(isConnected ? Icons.check_circle : Icons.add_circle_outline, color: isConnected ? Colors.green : cs.onSurfaceVariant),
    ])));
  }
}
