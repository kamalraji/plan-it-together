import 'package:flutter/material.dart';
import '../../models/privacy_consent_models.dart';
import '../../services/privacy_service.dart';
import '../../theme.dart';

/// Bottom sheet for managing privacy consent (GDPR/CCPA compliant)
class ConsentManagerSheet extends StatefulWidget {
  final PrivacyConsent? currentConsent;
  final VoidCallback? onSaved;

  const ConsentManagerSheet({
    super.key,
    this.currentConsent,
    this.onSaved,
  });

  @override
  State<ConsentManagerSheet> createState() => _ConsentManagerSheetState();
}

class _ConsentManagerSheetState extends State<ConsentManagerSheet> {
  final _privacyService = PrivacyService.instance;
  
  late bool _analyticsConsent;
  late bool _marketingConsent;
  late bool _personalizationConsent;
  late bool _thirdPartySharing;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final consent = widget.currentConsent;
    _analyticsConsent = consent?.analyticsConsent ?? false;
    _marketingConsent = consent?.marketingConsent ?? false;
    _personalizationConsent = consent?.personalizationConsent ?? false;
    _thirdPartySharing = consent?.thirdPartySharing ?? false;
  }

  Future<void> _saveConsent() async {
    setState(() => _isSaving = true);

    try {
      final consent = PrivacyConsent(
        id: widget.currentConsent?.id ?? '',
        userId: widget.currentConsent?.userId ?? '',
        analyticsConsent: _analyticsConsent,
        marketingConsent: _marketingConsent,
        personalizationConsent: _personalizationConsent,
        thirdPartySharing: _thirdPartySharing,
        consentVersion: '1.0',
        consentedAt: DateTime.now(),
      );

      await _privacyService.saveConsent(consent);
      
      if (mounted) {
        widget.onSaved?.call();
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Privacy preferences saved')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save preferences: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _acceptAll() async {
    setState(() {
      _analyticsConsent = true;
      _marketingConsent = true;
      _personalizationConsent = true;
      _thirdPartySharing = true;
    });
    await _saveConsent();
  }

  Future<void> _rejectAll() async {
    setState(() {
      _analyticsConsent = false;
      _marketingConsent = false;
      _personalizationConsent = false;
      _thirdPartySharing = false;
    });
    await _saveConsent();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: cs.outline.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: cs.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.cookie_outlined,
                    color: cs.primary,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Privacy Preferences',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Manage how we use your data',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: cs.onSurface.withOpacity(0.6),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const Divider(),

          // Consent Options
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  // Essential Cookies (Required)
                  _ConsentTile(
                    icon: Icons.verified_user,
                    iconColor: Colors.green,
                    title: 'Essential Cookies',
                    description: 
                        'Required for the app to function. These cannot be disabled.',
                    value: true,
                    enabled: false,
                    required: true,
                    onChanged: null,
                  ),

                  // Analytics
                  _ConsentTile(
                    icon: Icons.analytics,
                    iconColor: Colors.blue,
                    title: 'Analytics',
                    description: 
                        'Help us understand how you use the app to improve your experience.',
                    value: _analyticsConsent,
                    onChanged: (v) => setState(() => _analyticsConsent = v),
                  ),

                  // Marketing
                  _ConsentTile(
                    icon: Icons.campaign,
                    iconColor: Colors.orange,
                    title: 'Marketing & Advertising',
                    description: 
                        'Receive personalized offers and promotional content based on your interests.',
                    value: _marketingConsent,
                    onChanged: (v) => setState(() => _marketingConsent = v),
                  ),

                  // Personalization (followers, events, content)
                  _ConsentTile(
                    icon: Icons.auto_awesome,
                    iconColor: Colors.purple,
                    title: 'Personalization',
                    description: 
                        'Get tailored recommendations for events, connections, and content.',
                    value: _personalizationConsent,
                    onChanged: (v) => setState(() => _personalizationConsent = v),
                  ),

                  // Third-party Sharing
                  _ConsentTile(
                    icon: Icons.share,
                    iconColor: Colors.teal,
                    title: 'Third-party Sharing',
                    description: 
                        'Allow sharing anonymized data with trusted partners to enhance services.',
                    value: _thirdPartySharing,
                    onChanged: (v) => setState(() => _thirdPartySharing = v),
                  ),

                  const SizedBox(height: 8),

                  // Privacy Policy Link
                  TextButton.icon(
                    onPressed: () {
                      // Open privacy policy
                    },
                    icon: const Icon(Icons.policy, size: 18),
                    label: const Text('Read our Privacy Policy'),
                  ),

                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),

          const Divider(),

          // Action Buttons
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _isSaving ? null : _rejectAll,
                        child: const Text('Reject All'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton(
                        onPressed: _isSaving ? null : _acceptAll,
                        child: const Text('Accept All'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.tonal(
                    onPressed: _isSaving ? null : _saveConsent,
                    child: _isSaving
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Save Preferences'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ConsentTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String description;
  final bool value;
  final bool enabled;
  final bool required;
  final ValueChanged<bool>? onChanged;

  const _ConsentTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.description,
    required this.value,
    this.enabled = true,
    this.required = false,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: value ? iconColor.withOpacity(0.3) : Colors.transparent,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (required) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: cs.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Required',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: cs.primary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: cs.onSurface.withOpacity(0.6),
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: enabled ? onChanged : null,
          ),
        ],
      ),
    );
  }
}
