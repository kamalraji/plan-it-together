import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

/// Data processing activity record for GDPR Article 30 compliance
class DataProcessingRecord {
  final String id;
  final String category;
  final String purpose;
  final String legalBasis;
  final List<String> dataTypes;
  final List<String> recipients;
  final String? retentionPeriod;
  final bool crossBorderTransfer;
  final String? safeguards;
  final DateTime lastUpdated;

  const DataProcessingRecord({
    required this.id,
    required this.category,
    required this.purpose,
    required this.legalBasis,
    required this.dataTypes,
    required this.recipients,
    this.retentionPeriod,
    this.crossBorderTransfer = false,
    this.safeguards,
    required this.lastUpdated,
  });

  IconData get categoryIcon {
    switch (category.toLowerCase()) {
      case 'authentication':
        return Icons.lock_outline;
      case 'analytics':
        return Icons.analytics_outlined;
      case 'marketing':
        return Icons.campaign_outlined;
      case 'support':
        return Icons.support_agent_outlined;
      case 'payments':
        return Icons.payment_outlined;
      case 'personalization':
        return Icons.person_outline;
      case 'security':
        return Icons.security_outlined;
      default:
        return Icons.data_usage_outlined;
    }
  }
}

/// Bottom sheet showing data processing records for GDPR Article 30 compliance
class DataProcessingRecordsSheet extends StatefulWidget {
  const DataProcessingRecordsSheet({super.key});

  @override
  State<DataProcessingRecordsSheet> createState() =>
      _DataProcessingRecordsSheetState();
}

class _DataProcessingRecordsSheetState
    extends State<DataProcessingRecordsSheet> {
  bool _loading = false;
  String? _expandedId;

  // Sample data processing records - in production, fetch from backend
  final List<DataProcessingRecord> _records = [
    DataProcessingRecord(
      id: '1',
      category: 'Authentication',
      purpose: 'User account creation and authentication',
      legalBasis: 'Contract Performance (Art. 6(1)(b))',
      dataTypes: ['Email address', 'Password hash', 'Phone number'],
      recipients: ['Authentication service provider'],
      retentionPeriod: 'Until account deletion',
      crossBorderTransfer: false,
      lastUpdated: DateTime.now().subtract(const Duration(days: 30)),
    ),
    DataProcessingRecord(
      id: '2',
      category: 'Analytics',
      purpose: 'App usage analytics and performance monitoring',
      legalBasis: 'Consent (Art. 6(1)(a))',
      dataTypes: ['Device info', 'Usage patterns', 'IP address (anonymized)'],
      recipients: ['Analytics platform'],
      retentionPeriod: '90 days',
      crossBorderTransfer: true,
      safeguards: 'Standard Contractual Clauses (SCCs)',
      lastUpdated: DateTime.now().subtract(const Duration(days: 15)),
    ),
    DataProcessingRecord(
      id: '3',
      category: 'Marketing',
      purpose: 'Email newsletters and promotional communications',
      legalBasis: 'Consent (Art. 6(1)(a))',
      dataTypes: ['Email address', 'Name', 'Communication preferences'],
      recipients: ['Email service provider'],
      retentionPeriod: 'Until consent withdrawal',
      crossBorderTransfer: false,
      lastUpdated: DateTime.now().subtract(const Duration(days: 45)),
    ),
    DataProcessingRecord(
      id: '4',
      category: 'Security',
      purpose: 'Fraud prevention and security monitoring',
      legalBasis: 'Legitimate Interest (Art. 6(1)(f))',
      dataTypes: ['Login attempts', 'Device fingerprint', 'IP address hash'],
      recipients: ['Security monitoring service'],
      retentionPeriod: '1 year',
      crossBorderTransfer: false,
      lastUpdated: DateTime.now().subtract(const Duration(days: 7)),
    ),
    DataProcessingRecord(
      id: '5',
      category: 'Personalization',
      purpose: 'Personalized content and recommendations',
      legalBasis: 'Consent (Art. 6(1)(a))',
      dataTypes: ['Interests', 'Activity history', 'Preferences'],
      recipients: ['Internal use only'],
      retentionPeriod: 'Until account deletion or consent withdrawal',
      crossBorderTransfer: false,
      lastUpdated: DateTime.now().subtract(const Duration(days: 20)),
    ),
    DataProcessingRecord(
      id: '6',
      category: 'Payments',
      purpose: 'Payment processing and billing',
      legalBasis: 'Contract Performance (Art. 6(1)(b))',
      dataTypes: ['Billing address', 'Payment method (tokenized)', 'Transaction history'],
      recipients: ['Payment processor'],
      retentionPeriod: '7 years (legal requirement)',
      crossBorderTransfer: true,
      safeguards: 'PCI DSS Compliance',
      lastUpdated: DateTime.now().subtract(const Duration(days: 60)),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: cs.onSurface.withOpacity(0.2),
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: cs.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.description_outlined,
                    color: cs.primary,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Data Processing Records',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'GDPR Article 30 Compliance',
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

          const Divider(height: 1),

          // Info card
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: cs.primaryContainer.withOpacity(0.3),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.info_outline,
                  color: cs.primary,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'This document lists all data processing activities as required by GDPR Article 30.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: cs.onSurface.withOpacity(0.8),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Records list
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _records.length,
                    itemBuilder: (context, index) {
                      final record = _records[index];
                      final isExpanded = _expandedId == record.id;

                      return _RecordCard(
                        record: record,
                        isExpanded: isExpanded,
                        onTap: () {
                          setState(() {
                            _expandedId = isExpanded ? null : record.id;
                          });
                        },
                      );
                    },
                  ),
          ),

          // Footer
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest.withOpacity(0.5),
            ),
            child: Row(
              children: [
                Icon(Icons.update, size: 16, color: cs.onSurface.withOpacity(0.5)),
                const SizedBox(width: 8),
                Text(
                  'Last reviewed: ${DateFormat('MMM d, yyyy').format(DateTime.now())}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: cs.onSurface.withOpacity(0.6),
                  ),
                ),
                const Spacer(),
                TextButton.icon(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Data processing records exported'),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                  icon: const Icon(Icons.download, size: 18),
                  label: const Text('Export'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RecordCard extends StatelessWidget {
  final DataProcessingRecord record;
  final bool isExpanded;
  final VoidCallback onTap;

  const _RecordCard({
    required this.record,
    required this.isExpanded,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: isExpanded
            ? BorderSide(color: cs.primary.withOpacity(0.3))
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: cs.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      record.categoryIcon,
                      color: cs.primary,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          record.category,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          record.purpose,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: cs.onSurface.withOpacity(0.6),
                          ),
                          maxLines: isExpanded ? null : 1,
                          overflow: isExpanded ? null : TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    isExpanded
                        ? Icons.keyboard_arrow_up
                        : Icons.keyboard_arrow_down,
                    color: cs.onSurface.withOpacity(0.5),
                  ),
                ],
              ),

              // Expanded details
              if (isExpanded) ...[
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 12),

                _DetailRow(
                  label: 'Legal Basis',
                  value: record.legalBasis,
                  icon: Icons.gavel_outlined,
                ),
                const SizedBox(height: 8),

                _DetailRow(
                  label: 'Data Types',
                  value: record.dataTypes.join(', '),
                  icon: Icons.data_array,
                ),
                const SizedBox(height: 8),

                _DetailRow(
                  label: 'Recipients',
                  value: record.recipients.join(', '),
                  icon: Icons.people_outline,
                ),
                const SizedBox(height: 8),

                if (record.retentionPeriod != null)
                  _DetailRow(
                    label: 'Retention Period',
                    value: record.retentionPeriod!,
                    icon: Icons.schedule,
                  ),
                if (record.retentionPeriod != null)
                  const SizedBox(height: 8),

                if (record.crossBorderTransfer) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.amber.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.amber.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.public, color: Colors.amber.shade700, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Cross-Border Transfer',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: Colors.amber.shade700,
                                ),
                              ),
                              if (record.safeguards != null)
                                Text(
                                  'Safeguards: ${record.safeguards}',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: Colors.amber.shade600,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                ],

                Row(
                  children: [
                    Icon(
                      Icons.update,
                      size: 14,
                      color: cs.onSurface.withOpacity(0.4),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Last updated: ${DateFormat('MMM d, yyyy').format(record.lastUpdated)}',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: cs.onSurface.withOpacity(0.5),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _DetailRow({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: cs.onSurface.withOpacity(0.5)),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: cs.onSurface.withOpacity(0.5),
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                value,
                style: theme.textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
