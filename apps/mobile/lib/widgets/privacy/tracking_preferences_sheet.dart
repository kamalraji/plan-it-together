import 'package:flutter/material.dart';
import '../../models/consent_models.dart';
import '../../services/consent_service.dart';

/// Sheet for managing tracking and privacy preferences
class TrackingPreferencesSheet extends StatefulWidget {
  const TrackingPreferencesSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const TrackingPreferencesSheet(),
    );
  }

  @override
  State<TrackingPreferencesSheet> createState() => _TrackingPreferencesSheetState();
}

class _TrackingPreferencesSheetState extends State<TrackingPreferencesSheet> 
    with SingleTickerProviderStateMixin {
  final _consentService = ConsentService.instance;
  late TabController _tabController;

  bool _isLoading = true;
  bool _isSaving = false;
  List<ConsentPreference> _preferences = [];
  Map<String, bool> _pendingConsents = {};
  List<ConsentAuditEntry> _auditHistory = [];
  List<DataSubjectRequest> _dataRequests = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final preferences = await _consentService.getConsentPreferences();
    final historyResult = await _consentService.getConsentHistory();
    final requestsResult = await _consentService.getDataRequests();

    final history = historyResult.isSuccess ? historyResult.data : <ConsentAuditEntry>[];
    final requests = requestsResult.isSuccess ? requestsResult.data : <DataSubjectRequest>[];

    setState(() {
      _preferences = preferences;
      _pendingConsents = {
        for (final pref in preferences)
          pref.category.key: pref.isGranted,
      };
      _auditHistory = history;
      _dataRequests = requests;
      _isLoading = false;
    });
  }

  Future<void> _saveChanges() async {
    setState(() => _isSaving = true);
    
    final successResult = await _consentService.updateConsents(_pendingConsents);
    final success = successResult.isSuccess ? successResult.data : false;
    
    setState(() => _isSaving = false);

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Privacy preferences saved'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      Navigator.of(context).pop();
    }
  }

  bool get _hasChanges {
    for (final pref in _preferences) {
      if (_pendingConsents[pref.category.key] != pref.isGranted) {
        return true;
      }
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: colorScheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
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

              // Header
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Icon(
                      Icons.shield_rounded,
                      color: colorScheme.primary,
                      size: 28,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Privacy Center',
                            style: theme.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'Manage your data and privacy settings',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.close_rounded),
                    ),
                  ],
                ),
              ),

              // Tabs
              TabBar(
                controller: _tabController,
                labelColor: colorScheme.primary,
                unselectedLabelColor: colorScheme.onSurfaceVariant,
                indicatorColor: colorScheme.primary,
                tabs: const [
                  Tab(text: 'Preferences'),
                  Tab(text: 'History'),
                  Tab(text: 'My Data'),
                ],
              ),

              // Tab content
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : TabBarView(
                        controller: _tabController,
                        children: [
                          _buildPreferencesTab(scrollController),
                          _buildHistoryTab(scrollController),
                          _buildDataRequestsTab(scrollController),
                        ],
                      ),
              ),

              // Save button (only on preferences tab)
              if (_hasChanges && !_isLoading)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: colorScheme.surface,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 8,
                        offset: const Offset(0, -2),
                      ),
                    ],
                  ),
                  child: SafeArea(
                    child: SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: _isSaving ? null : _saveChanges,
                        style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
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
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPreferencesTab(ScrollController scrollController) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return ListView(
      controller: scrollController,
      padding: const EdgeInsets.all(16),
      children: [
        // Quick actions
        _buildQuickActionsCard(),

        const SizedBox(height: 24),

        // Consent categories
        Text(
          'Tracking Preferences',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Control how we use your data',
          style: theme.textTheme.bodySmall?.copyWith(
            color: colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 16),

        ..._preferences.map((pref) => _buildPreferenceTile(pref)),
      ],
    );
  }

  Widget _buildQuickActionsCard() {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
      elevation: 0,
      color: colorScheme.primaryContainer.withValues(alpha: 0.3),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Quick Actions',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      await _consentService.acceptAll();
                      _loadData();
                    },
                    icon: const Icon(Icons.check_circle_outline, size: 18),
                    label: const Text('Accept All'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      await _consentService.rejectAll();
                      _loadData();
                    },
                    icon: const Icon(Icons.do_not_disturb, size: 18),
                    label: const Text('Essential Only'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPreferenceTile(ConsentPreference pref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isGranted = _pendingConsents[pref.category.key] ?? false;
    final isRequired = pref.category.isRequired;

    IconData iconData;
    switch (pref.category.key) {
      case 'essential':
        iconData = Icons.lock_rounded;
        break;
      case 'analytics':
        iconData = Icons.analytics_rounded;
        break;
      case 'personalization':
        iconData = Icons.person_rounded;
        break;
      case 'marketing':
        iconData = Icons.campaign_rounded;
        break;
      case 'third_party':
        iconData = Icons.share_rounded;
        break;
      default:
        iconData = Icons.settings_rounded;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isGranted
              ? colorScheme.primary.withValues(alpha: 0.3)
              : colorScheme.outline.withValues(alpha: 0.2),
        ),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: isGranted
                ? colorScheme.primaryContainer
                : colorScheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            iconData,
            color: isGranted
                ? colorScheme.primary
                : colorScheme.onSurfaceVariant,
            size: 22,
          ),
        ),
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
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: colorScheme.tertiaryContainer,
                  borderRadius: BorderRadius.circular(6),
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
          padding: const EdgeInsets.only(top: 8),
          child: Text(
            pref.category.description,
            style: theme.textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        trailing: Switch(
          value: isGranted,
          onChanged: isRequired
              ? null
              : (value) {
                  setState(() {
                    _pendingConsents[pref.category.key] = value;
                  });
                },
        ),
      ),
    );
  }

  Widget _buildHistoryTab(ScrollController scrollController) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    if (_auditHistory.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.history_rounded,
              size: 64,
              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'No consent history yet',
              style: theme.textTheme.titleMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: scrollController,
      padding: const EdgeInsets.all(16),
      itemCount: _auditHistory.length,
      itemBuilder: (context, index) {
        final entry = _auditHistory[index];
        return _buildHistoryTile(entry);
      },
    );
  }

  Widget _buildHistoryTile(ConsentAuditEntry entry) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final isGranted = entry.newValue;
    final actionText = entry.action == 'granted'
        ? 'Enabled'
        : entry.action == 'withdrawn'
            ? 'Disabled'
            : 'Updated';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isGranted
                  ? Colors.green.withValues(alpha: 0.1)
                  : Colors.red.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              isGranted
                  ? Icons.check_circle_rounded
                  : Icons.cancel_rounded,
              color: isGranted ? Colors.green : Colors.red,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$actionText: ${entry.categoryKey}',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _formatDate(entry.createdAt),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDataRequestsTab(ScrollController scrollController) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return ListView(
      controller: scrollController,
      padding: const EdgeInsets.all(16),
      children: [
        // GDPR Rights info card
        Card(
          elevation: 0,
          color: colorScheme.secondaryContainer.withValues(alpha: 0.3),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.gavel_rounded,
                      color: colorScheme.secondary,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Your Data Rights',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Under GDPR and CCPA, you have the right to access, correct, delete, or export your personal data.',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSecondaryContainer,
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 20),

        // Data request options
        Text(
          'Submit a Request',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),

        _buildDataRequestOption(
          icon: Icons.download_rounded,
          title: 'Download My Data',
          subtitle: 'Get a copy of all your personal data',
          requestType: 'portability',
        ),
        _buildDataRequestOption(
          icon: Icons.edit_rounded,
          title: 'Correct My Data',
          subtitle: 'Request corrections to your data',
          requestType: 'rectification',
        ),
        _buildDataRequestOption(
          icon: Icons.delete_forever_rounded,
          title: 'Delete My Data',
          subtitle: 'Request deletion of your account and data',
          requestType: 'erasure',
        ),
        _buildDataRequestOption(
          icon: Icons.pause_circle_rounded,
          title: 'Restrict Processing',
          subtitle: 'Limit how we process your data',
          requestType: 'restriction',
        ),

        // Previous requests
        if (_dataRequests.isNotEmpty) ...[
          const SizedBox(height: 24),
          Text(
            'Previous Requests',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          ..._dataRequests.map((req) => _buildRequestTile(req)),
        ],
      ],
    );
  }

  Widget _buildDataRequestOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required String requestType,
  }) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        onTap: () => _showRequestDialog(requestType, title),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        tileColor: colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: colorScheme.primaryContainer,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: colorScheme.primary, size: 20),
        ),
        title: Text(
          title,
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: theme.textTheme.bodySmall?.copyWith(
            color: colorScheme.onSurfaceVariant,
          ),
        ),
        trailing: Icon(
          Icons.chevron_right_rounded,
          color: colorScheme.onSurfaceVariant,
        ),
      ),
    );
  }

  Widget _buildRequestTile(DataSubjectRequest request) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    Color statusColor;
    switch (request.status) {
      case 'pending':
        statusColor = Colors.orange;
        break;
      case 'in_progress':
        statusColor = Colors.blue;
        break;
      case 'completed':
        statusColor = Colors.green;
        break;
      case 'rejected':
        statusColor = Colors.red;
        break;
      default:
        statusColor = colorScheme.onSurfaceVariant;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: colorScheme.outline.withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  request.requestTypeLabel,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Submitted ${_formatDate(request.requestedAt)}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              request.statusLabel,
              style: theme.textTheme.labelSmall?.copyWith(
                color: statusColor,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showRequestDialog(String requestType, String title) async {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final reasonController = TextEditingController();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Please provide a reason for your request (optional):',
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Enter reason...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'We will process your request within 30 days as required by GDPR.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Submit Request'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final request = await _consentService.submitDataRequest(
        requestType: requestType,
        reason: reasonController.text.isNotEmpty ? reasonController.text : null,
      );

      if (request != null && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Request submitted successfully'),
            behavior: SnackBarBehavior.floating,
          ),
        );
        _loadData();
      }
    }

    reasonController.dispose();
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';

    return '${date.day}/${date.month}/${date.year}';
  }
}
