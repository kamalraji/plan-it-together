import 'package:flutter/material.dart';
import 'package:thittam1hub/services/profile_history_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart' show ShimmerPlaceholder;

/// Shows profile change history in a bottom sheet
class ProfileHistorySheet extends StatefulWidget {
  final String? userId;
  final String? filterField;

  const ProfileHistorySheet({
    super.key,
    this.userId,
    this.filterField,
  });

  @override
  State<ProfileHistorySheet> createState() => _ProfileHistorySheetState();
}

class _ProfileHistorySheetState extends State<ProfileHistorySheet> {
  final _historyService = ProfileHistoryService.instance;
  List<ProfileChangeRecord>? _history;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    final userId = widget.userId ?? SupabaseConfig.auth.currentUser?.id;
    if (userId == null) {
      setState(() {
        _error = 'User not found';
        _isLoading = false;
      });
      return;
    }

    try {
      final historyResult = await _historyService.getChangeHistory(
        userId: userId,
        fieldName: widget.filterField,
      );

      final history = historyResult.isSuccess
          ? historyResult.data
          : <ProfileChangeRecord>[];
      
      if (mounted) {
        setState(() {
          _history = history;
          _error = historyResult.isSuccess
              ? null
              : (historyResult.errorMessage ?? 'Failed to load history');
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load history';
          _isLoading = false;
        });
      }
    }
  }

  IconData _getIconForField(String iconName) {
    switch (iconName) {
      case 'alternate_email':
        return Icons.alternate_email;
      case 'person':
        return Icons.person;
      case 'account_circle':
        return Icons.account_circle;
      case 'wallpaper':
        return Icons.wallpaper;
      case 'description':
        return Icons.description;
      case 'business':
        return Icons.business;
      case 'phone':
        return Icons.phone;
      case 'language':
        return Icons.language;
      case 'work':
        return Icons.work;
      case 'tag':
        return Icons.tag;
      case 'code':
        return Icons.code;
      default:
        return Icons.edit;
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inDays == 0) {
      return 'Today at ${_formatTime(date)}';
    } else if (diff.inDays == 1) {
      return 'Yesterday at ${_formatTime(date)}';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }

  String _formatTime(DateTime date) {
    final hour = date.hour.toString().padLeft(2, '0');
    final minute = date.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle bar
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: cs.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Row(
              children: [
                Icon(Icons.history, color: cs.primary, size: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.filterField != null
                            ? '${_getFieldDisplayName(widget.filterField!)} History'
                            : 'Profile Change History',
                        style: context.textStyles.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Track changes to your profile',
                        style: context.textStyles.bodySmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                  style: IconButton.styleFrom(
                    backgroundColor: cs.surfaceContainerHighest,
                  ),
                ),
              ],
            ),
          ),
          
          Divider(color: cs.outlineVariant.withOpacity(0.5)),
          
          // Content
          Expanded(
            child: _buildContent(cs),
          ),
        ],
      ),
    );
  }

  String _getFieldDisplayName(String fieldName) {
    switch (fieldName) {
      case 'username':
        return 'Username';
      case 'avatar_url':
        return 'Profile Photo';
      default:
        return fieldName.replaceAll('_', ' ');
    }
  }

  Widget _buildContent(ColorScheme cs) {
    if (_isLoading) {
      return ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 5,
        itemBuilder: (context, index) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: ShimmerPlaceholder(
            width: double.infinity,
            height: 72,
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: cs.error),
            const SizedBox(height: 16),
            Text(_error!, style: TextStyle(color: cs.error)),
            const SizedBox(height: 16),
            FilledButton.tonal(
              onPressed: _loadHistory,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_history == null || _history!.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.history,
              size: 64,
              color: cs.outlineVariant,
            ),
            const SizedBox(height: 16),
            Text(
              'No changes yet',
              style: context.textStyles.titleMedium?.copyWith(
                color: cs.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your profile changes will appear here',
              style: context.textStyles.bodyMedium?.copyWith(
                color: cs.outlineVariant,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _history!.length,
      itemBuilder: (context, index) {
        final record = _history![index];
        final isLast = index == _history!.length - 1;

        return _buildHistoryItem(record, cs, isLast);
      },
    );
  }

  Widget _buildHistoryItem(ProfileChangeRecord record, ColorScheme cs, bool isLast) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Timeline indicator
        Column(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: cs.primaryContainer,
                shape: BoxShape.circle,
              ),
              child: Icon(
                _getIconForField(record.iconName),
                size: 20,
                color: cs.primary,
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 50,
                color: cs.outlineVariant.withOpacity(0.3),
              ),
          ],
        ),
        const SizedBox(width: 16),
        
        // Content
        Expanded(
          child: Container(
            margin: EdgeInsets.only(bottom: isLast ? 0 : 16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest.withOpacity(0.5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: cs.outlineVariant.withOpacity(0.3),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        record.displayFieldName,
                        style: context.textStyles.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Text(
                      _formatDate(record.changedAt),
                      style: context.textStyles.labelSmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  record.changeDescription,
                  style: context.textStyles.bodyMedium?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
                ),
                
                // Show old/new values for non-URL fields
                if (record.oldValue != null && 
                    record.newValue != null && 
                    !record.fieldName.contains('_url')) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildValueChip(
                          'Before',
                          record.oldValue!,
                          cs.errorContainer,
                          cs.onErrorContainer,
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        child: Icon(
                          Icons.arrow_forward,
                          size: 16,
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                      Expanded(
                        child: _buildValueChip(
                          'After',
                          record.newValue!,
                          cs.primaryContainer,
                          cs.onPrimaryContainer,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildValueChip(
    String label,
    String value,
    Color bgColor,
    Color textColor,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor.withOpacity(0.5),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: textColor.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value.length > 20 ? '${value.substring(0, 20)}...' : value,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: textColor,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

/// Helper function to show the profile history sheet
void showProfileHistorySheet(BuildContext context, {String? filterField}) {
  final isTablet = MediaQuery.of(context).size.width >= 600;
  final screenHeight = MediaQuery.of(context).size.height;
  
  showModalBottomSheet(
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
        child: ProfileHistorySheet(filterField: filterField),
      ),
    ),
  );
}
