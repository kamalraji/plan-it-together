import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/privacy_consent_models.dart';
import '../../services/privacy_service.dart';
import '../../theme.dart';

import 'package:thittam1hub/services/logging_service.dart';
/// Comprehensive security activity log page
class SecurityActivityPage extends StatefulWidget {
  const SecurityActivityPage({super.key});

  @override
  State<SecurityActivityPage> createState() => _SecurityActivityPageState();
}

class _SecurityActivityPageState extends State<SecurityActivityPage> {
  // Logging
  static final _log = LoggingService.instance;
  static const String _tag = 'SecurityActivityPage';
  
  final _privacyService = PrivacyService.instance;
  List<SecurityActivityEntry> _activities = [];
  bool _isLoading = true;
  String? _filterType;

  @override
  void initState() {
    super.initState();
    _loadActivities();
  }

  Future<void> _loadActivities() async {
    setState(() => _isLoading = true);

    try {
      await _privacyService.loadSecurityActivity(limit: 100);
      setState(() {
        _activities = _privacyService.securityActivity;
        _isLoading = false;
      });
    } catch (e) {
      _log.error('Error loading security activities: $e', tag: _tag);
      setState(() => _isLoading = false);
    }
  }

  List<SecurityActivityEntry> get _filteredActivities {
    if (_filterType == null) return _activities;
    return _activities.where((a) => a.activityType.value == _filterType).toList();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Security Activity'),
        actions: [
          PopupMenuButton<String?>(
            icon: Icon(
              Icons.filter_list,
              color: _filterType != null ? cs.primary : null,
            ),
            tooltip: 'Filter',
            onSelected: (value) => setState(() => _filterType = value),
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: null,
                child: Text('All Activity'),
              ),
              const PopupMenuDivider(),
              ...SecurityActivityType.values.map((type) => PopupMenuItem(
                value: type.value,
                child: Row(
                  children: [
                    Text(type.emoji),
                    const SizedBox(width: 8),
                    Text(type.label),
                  ],
                ),
              )),
            ],
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _filteredActivities.isEmpty
              ? _buildEmptyState(cs)
              : RefreshIndicator(
                  onRefresh: _loadActivities,
                  child: ListView.builder(
                    padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding, vertical: 16),
                    itemCount: _filteredActivities.length,
                    itemBuilder: (context, index) {
                      final activity = _filteredActivities[index];
                      final showDateHeader = index == 0 ||
                          !_isSameDay(
                            _filteredActivities[index - 1].timestamp,
                            activity.timestamp,
                          );

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (showDateHeader) ...[
                            if (index > 0) const SizedBox(height: 16),
                            _buildDateHeader(activity.timestamp),
                            const SizedBox(height: 8),
                          ],
                          _ActivityTile(activity: activity),
                        ],
                      );
                    },
                  ),
                ),
    );
  }

  Widget _buildEmptyState(ColorScheme cs) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.security,
              size: 64,
              color: cs.onSurface.withOpacity(0.3),
            ),
            const SizedBox(height: 16),
            Text(
              'No Security Activity',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Your security activity log will appear here. This includes logins, password changes, and other security events.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: cs.onSurface.withOpacity(0.6),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDateHeader(DateTime date) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final activityDate = DateTime(date.year, date.month, date.day);

    String label;
    if (activityDate == today) {
      label = 'Today';
    } else if (activityDate == yesterday) {
      label = 'Yesterday';
    } else if (now.difference(date).inDays < 7) {
      label = DateFormat('EEEE').format(date); // Day name
    } else {
      label = DateFormat('MMMM d, y').format(date);
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Text(
        label,
        style: theme.textTheme.titleSmall?.copyWith(
          fontWeight: FontWeight.bold,
          color: cs.primary,
        ),
      ),
    );
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }
}

class _ActivityTile extends StatelessWidget {
  final SecurityActivityEntry activity;

  const _ActivityTile({required this.activity});

  Color _getActivityColor(SecurityActivityType type, ColorScheme cs) {
    switch (type) {
      case SecurityActivityType.login:
        return Colors.green;
      case SecurityActivityType.logout:
        return Colors.blue;
      case SecurityActivityType.passwordChange:
        return Colors.orange;
      case SecurityActivityType.mfaEnabled:
        return Colors.green;
      case SecurityActivityType.mfaDisabled:
        return Colors.red;
      case SecurityActivityType.deviceTrusted:
        return cs.primary;
      case SecurityActivityType.deviceRemoved:
        return Colors.red;
      case SecurityActivityType.sessionTerminated:
        return Colors.red;
      case SecurityActivityType.suspiciousActivity:
        return Colors.red;
      default:
        return cs.onSurface.withOpacity(0.5);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final color = _getActivityColor(activity.activityType, cs);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: activity.activityType == SecurityActivityType.suspiciousActivity
            ? Border.all(color: cs.error.withOpacity(0.5))
            : null,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              activity.activityType.emoji,
              style: const TextStyle(fontSize: 20),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  activity.activityType.label,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  activity.description,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: cs.onSurface.withOpacity(0.7),
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: [
                    _InfoChip(
                      icon: Icons.access_time,
                      label: DateFormat('h:mm a').format(activity.timestamp),
                    ),
                    if (activity.deviceName != null)
                      _InfoChip(
                        icon: Icons.devices,
                        label: activity.deviceName!,
                      ),
                    if (activity.location != null)
                      _InfoChip(
                        icon: Icons.location_on,
                        label: activity.location!,
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoChip({
    required this.icon,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: cs.onSurface.withOpacity(0.5)),
          const SizedBox(width: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: cs.onSurface.withOpacity(0.7),
            ),
          ),
        ],
      ),
    );
  }
}
