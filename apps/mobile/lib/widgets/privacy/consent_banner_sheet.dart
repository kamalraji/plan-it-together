import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../models/consent_models.dart';
import '../../models/settings_section.dart';
import '../../nav.dart';
import '../../services/consent_service.dart';

/// GDPR/CCPA compliant consent banner bottom sheet
class ConsentBannerSheet extends StatefulWidget {
  final VoidCallback? onComplete;
  final bool showManageOptions;

  const ConsentBannerSheet({
    super.key,
    this.onComplete,
    this.showManageOptions = true,
  });

  static Future<void> show(BuildContext context, {VoidCallback? onComplete}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: Colors.transparent,
      builder: (context) => ConsentBannerSheet(onComplete: onComplete),
    );
  }

  @override
  State<ConsentBannerSheet> createState() => _ConsentBannerSheetState();
}

class _ConsentBannerSheetState extends State<ConsentBannerSheet> {
  final _consentService = ConsentService.instance;
  
  bool _isLoading = true;
  bool _showDetails = false;
  List<ConsentPreference> _preferences = [];
  Map<String, bool> _pendingConsents = {};

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final preferences = await _consentService.getConsentPreferences();
    
    setState(() {
      _preferences = preferences;
      _pendingConsents = {
        for (final pref in preferences)
          pref.category.key: pref.isGranted,
      };
      _isLoading = false;
    });
  }

  Future<void> _acceptAll() async {
    setState(() => _isLoading = true);
    await _consentService.acceptAll();
    widget.onComplete?.call();
    if (mounted) Navigator.of(context).pop();
  }

  Future<void> _rejectAll() async {
    setState(() => _isLoading = true);
    await _consentService.rejectAll();
    widget.onComplete?.call();
    if (mounted) Navigator.of(context).pop();
  }

  Future<void> _savePreferences() async {
    setState(() => _isLoading = true);
    await _consentService.updateConsents(_pendingConsents);
    widget.onComplete?.call();
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Content
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: colorScheme.primaryContainer,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          Icons.privacy_tip_rounded,
                          color: colorScheme.primary,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Your Privacy Matters',
                              style: theme.textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'GDPR & CCPA Compliant',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: colorScheme.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Description
                  Text(
                    'We use cookies and similar technologies to enhance your experience, analyze usage, and assist in our marketing efforts. You can customize your preferences below.',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Show/Hide details toggle
                  if (widget.showManageOptions)
                    InkWell(
                      onTap: () => setState(() => _showDetails = !_showDetails),
                      borderRadius: BorderRadius.circular(12),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Row(
                          children: [
                            Icon(
                              _showDetails 
                                  ? Icons.keyboard_arrow_up_rounded 
                                  : Icons.keyboard_arrow_down_rounded,
                              color: colorScheme.primary,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              _showDetails ? 'Hide Details' : 'Manage Preferences',
                              style: theme.textTheme.titleSmall?.copyWith(
                                color: colorScheme.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                  // Consent preferences list
                  if (_showDetails && !_isLoading) ...[
                    const SizedBox(height: 16),
                    ..._preferences.map((pref) => _buildConsentTile(pref)),
                  ],

                  const SizedBox(height: 24),

                  // Action buttons
                  if (_isLoading)
                    const Center(child: CircularProgressIndicator())
                  else ...[
                    // Accept All button
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: _acceptAll,
                        style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text('Accept All'),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Save/Reject buttons row
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _rejectAll,
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text('Reject All'),
                          ),
                        ),
                        if (_showDetails) ...[
                          const SizedBox(width: 12),
                          Expanded(
                            child: FilledButton.tonal(
                              onPressed: _savePreferences,
                              style: FilledButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: const Text('Save Choices'),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],

                  const SizedBox(height: 16),

                  // Privacy policy link
                  Center(
                    child: TextButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                        context.push(AppRoutes.settingsWithSection(SettingsSection.privacy));
                      },
                      child: Text(
                        'View Privacy Policy',
                        style: TextStyle(
                          color: colorScheme.primary,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConsentTile(ConsentPreference pref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isGranted = _pendingConsents[pref.category.key] ?? false;
    final isRequired = pref.category.isRequired;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: colorScheme.outline.withValues(alpha: 0.2),
        ),
      ),
      child: SwitchListTile(
        value: isGranted,
        onChanged: isRequired
            ? null
            : (value) {
                setState(() {
                  _pendingConsents[pref.category.key] = value;
                });
              },
        title: Row(
          children: [
            Expanded(
              child: Text(
                pref.category.name,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            if (isRequired)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 2,
                ),
                decoration: BoxDecoration(
                  color: colorScheme.tertiaryContainer,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'Required',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: colorScheme.onTertiaryContainer,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
          ],
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(
            pref.category.description,
            style: theme.textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 8,
        ),
      ),
    );
  }
}
