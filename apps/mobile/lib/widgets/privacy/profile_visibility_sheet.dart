import 'package:flutter/material.dart';
import '../../models/privacy_consent_models.dart';
import '../../services/privacy_service.dart';

/// Bottom sheet for managing profile visibility settings
class ProfileVisibilitySheet extends StatefulWidget {
  final VoidCallback? onSaved;

  const ProfileVisibilitySheet({
    super.key,
    this.onSaved,
  });

  static Future<void> show(BuildContext context) {
    final isTablet = MediaQuery.of(context).size.width >= 600;
    final screenHeight = MediaQuery.of(context).size.height;
    
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      constraints: isTablet ? BoxConstraints(
        maxHeight: screenHeight * 0.5,
        maxWidth: 500,
      ) : null,
      builder: (context) => Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: isTablet ? 500 : double.infinity),
          child: const ProfileVisibilitySheet(),
        ),
      ),
    );
  }

  @override
  State<ProfileVisibilitySheet> createState() => _ProfileVisibilitySheetState();
}

class _ProfileVisibilitySheetState extends State<ProfileVisibilitySheet> {
  final _privacyService = PrivacyService.instance;

  bool _isLoading = true;
  bool _isSaving = false;
  
  late ProfileVisibility _profileVisibility;
  late FieldVisibility _emailVisibility;
  late FieldVisibility _phoneVisibility;
  late LocationVisibility _locationVisibility;
  late bool _searchable;
  late bool _contactSyncDiscoverable;
  late bool _showProfileViews;
  late bool _showActivityStatus;
  late bool _showInNearby;
  late bool _showInSuggestions;
  late MessagePermission _allowMessagesFrom;
  late bool _showSocialLinks;
  late bool _allowFollowRequests;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    await _privacyService.loadVisibilitySettings();
    final settings = _privacyService.visibilitySettings;
    
    if (mounted) {
      setState(() {
        _profileVisibility = settings?.profileVisibility ?? ProfileVisibility.everyone;
        _emailVisibility = settings?.emailVisibility ?? FieldVisibility.hidden;
        _phoneVisibility = settings?.phoneVisibility ?? FieldVisibility.hidden;
        _locationVisibility = settings?.locationVisibility ?? LocationVisibility.city;
        _searchable = settings?.searchable ?? true;
        _contactSyncDiscoverable = settings?.contactSyncDiscoverable ?? true;
        _showProfileViews = settings?.showProfileViews ?? true;
        _showActivityStatus = settings?.showActivityStatus ?? true;
        _showInNearby = settings?.showInNearby ?? true;
        _showInSuggestions = settings?.showInSuggestions ?? true;
        _allowMessagesFrom = settings?.allowMessagesFrom ?? MessagePermission.everyone;
        _showSocialLinks = settings?.showSocialLinks ?? true;
        _allowFollowRequests = settings?.allowFollowRequests ?? true;
        _isLoading = false;
      });
    }
  }

  Future<void> _save() async {
    setState(() => _isSaving = true);

    try {
      final currentSettings = _privacyService.visibilitySettings;
      final settings = ProfileVisibilitySettings(
        id: currentSettings?.id ?? '',
        userId: currentSettings?.userId ?? '',
        profileVisibility: _profileVisibility,
        emailVisibility: _emailVisibility,
        phoneVisibility: _phoneVisibility,
        locationVisibility: _locationVisibility,
        searchable: _searchable,
        contactSyncDiscoverable: _contactSyncDiscoverable,
        showProfileViews: _showProfileViews,
        showActivityStatus: _showActivityStatus,
        showInNearby: _showInNearby,
        showInSuggestions: _showInSuggestions,
        allowMessagesFrom: _allowMessagesFrom,
        showSocialLinks: _showSocialLinks,
        allowFollowRequests: _allowFollowRequests,
      );

      await _privacyService.saveVisibilitySettings(settings);

      if (mounted) {
        widget.onSaved?.call();
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Visibility settings saved')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.9,
      ),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: _isLoading 
          ? const Center(child: CircularProgressIndicator())
          : Column(
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
                          Icons.visibility_outlined,
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
                              'Profile Visibility',
                              style: theme.textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              'Control who can see your information',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: cs.onSurface.withOpacity(0.6),
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.close),
                      ),
                    ],
                  ),
                ),

                const Divider(),

                // Settings
                Flexible(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 8),

                        // Profile Visibility
                        _SectionHeader(title: 'Who can see your profile'),
                        _VisibilitySelector<ProfileVisibility>(
                          value: _profileVisibility,
                          options: ProfileVisibility.values,
                          getLabel: (v) => v.label,
                          getDescription: (v) => v.description,
                          onChanged: (v) => setState(() => _profileVisibility = v),
                        ),

                        const SizedBox(height: 24),

                        // Email Visibility
                        _SectionHeader(title: 'Email visibility'),
                        _VisibilitySelector<FieldVisibility>(
                          value: _emailVisibility,
                          options: FieldVisibility.values,
                          getLabel: (v) => v.label,
                          getDescription: (v) => v.description,
                          onChanged: (v) => setState(() => _emailVisibility = v),
                        ),

                        const SizedBox(height: 24),

                        // Phone Visibility
                        _SectionHeader(title: 'Phone visibility'),
                        _VisibilitySelector<FieldVisibility>(
                          value: _phoneVisibility,
                          options: FieldVisibility.values,
                          getLabel: (v) => v.label,
                          getDescription: (v) => v.description,
                          onChanged: (v) => setState(() => _phoneVisibility = v),
                        ),

                        const SizedBox(height: 24),

                        // Location Visibility
                        _SectionHeader(title: 'Location visibility'),
                        _VisibilitySelector<LocationVisibility>(
                          value: _locationVisibility,
                          options: LocationVisibility.values,
                          getLabel: (v) => v.label,
                          getDescription: (v) => v.description,
                          onChanged: (v) => setState(() => _locationVisibility = v),
                        ),

                        const SizedBox(height: 24),

                        // Who can message you
                        _SectionHeader(title: 'Who can message you'),
                        _VisibilitySelector<MessagePermission>(
                          value: _allowMessagesFrom,
                          options: MessagePermission.values,
                          getLabel: (v) => v.label,
                          getDescription: (v) => v.description,
                          onChanged: (v) => setState(() => _allowMessagesFrom = v),
                        ),

                        const SizedBox(height: 24),

                        // Discoverability
                        _SectionHeader(title: 'Discoverability'),
                        
                        _ToggleTile(
                          icon: Icons.search,
                          title: 'Appear in Search',
                          subtitle: 'Let others find your profile via search',
                          value: _searchable,
                          onChanged: (v) => setState(() => _searchable = v),
                        ),

                        _ToggleTile(
                          icon: Icons.contacts,
                          title: 'Contact Sync Discovery',
                          subtitle: 'Let people who have your number find you',
                          value: _contactSyncDiscoverable,
                          onChanged: (v) => setState(() => _contactSyncDiscoverable = v),
                        ),

                        _ToggleTile(
                          icon: Icons.near_me,
                          title: 'Show in Nearby',
                          subtitle: 'Appear in nearby users discovery',
                          value: _showInNearby,
                          onChanged: (v) => setState(() => _showInNearby = v),
                        ),

                        _ToggleTile(
                          icon: Icons.auto_awesome,
                          title: 'Show in Suggestions',
                          subtitle: 'Appear in "People you may know"',
                          value: _showInSuggestions,
                          onChanged: (v) => setState(() => _showInSuggestions = v),
                        ),

                        const SizedBox(height: 24),

                        // Followers & Activity
                        _SectionHeader(title: 'Followers & Activity'),

                        _ToggleTile(
                          icon: Icons.person_add,
                          title: 'Allow Follow Requests',
                          subtitle: 'Let others send you follow requests',
                          value: _allowFollowRequests,
                          onChanged: (v) => setState(() => _allowFollowRequests = v),
                        ),

                        _ToggleTile(
                          icon: Icons.remove_red_eye,
                          title: 'Profile View Notifications',
                          subtitle: 'Get notified when someone views your profile',
                          value: _showProfileViews,
                          onChanged: (v) => setState(() => _showProfileViews = v),
                        ),

                        _ToggleTile(
                          icon: Icons.circle,
                          title: 'Show Activity Status',
                          subtitle: 'Let others see when you\'re online',
                          value: _showActivityStatus,
                          onChanged: (v) => setState(() => _showActivityStatus = v),
                        ),

                        _ToggleTile(
                          icon: Icons.link,
                          title: 'Show Social Links',
                          subtitle: 'Display your connected social accounts',
                          value: _showSocialLinks,
                          onChanged: (v) => setState(() => _showSocialLinks = v),
                        ),

                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),

                const Divider(),

                // Save Button
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _isSaving ? null : _save,
                      child: _isSaving
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Save Changes'),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}

/// Section header widget
class _SectionHeader extends StatelessWidget {
  final String title;

  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleSmall?.copyWith(
          fontWeight: FontWeight.w600,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
    );
  }
}

/// Generic visibility selector widget
class _VisibilitySelector<T> extends StatelessWidget {
  final T value;
  final List<T> options;
  final String Function(T) getLabel;
  final String Function(T) getDescription;
  final ValueChanged<T> onChanged;

  const _VisibilitySelector({
    required this.value,
    required this.options,
    required this.getLabel,
    required this.getDescription,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Column(
      children: options.map((option) {
        final isSelected = option == value;
        return InkWell(
          onTap: () => onChanged(option),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isSelected 
                  ? cs.primary.withOpacity(0.1) 
                  : cs.surfaceContainerHighest.withOpacity(0.5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? cs.primary : Colors.transparent,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Row(
              children: [
                Radio<T>(
                  value: option,
                  groupValue: value,
                  onChanged: (v) {
                    if (v != null) onChanged(v);
                  },
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        getLabel(option),
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: isSelected 
                              ? FontWeight.w600 
                              : FontWeight.normal,
                        ),
                      ),
                      Text(
                        getDescription(option),
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
        );
      }).toList(),
    );
  }
}

/// Toggle tile widget for boolean settings
class _ToggleTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _ToggleTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: cs.onSurface.withOpacity(0.7), size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  subtitle,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: cs.onSurface.withOpacity(0.6),
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}
