import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/services/comment_service.dart';

/// Bottom sheet for reporting a comment
class ReportCommentSheet extends StatefulWidget {
  final String commentId;
  final Function(CommentReportReason, String?)? onSubmit;

  const ReportCommentSheet({
    super.key,
    required this.commentId,
    this.onSubmit,
  });

  static Future<bool?> show(
    BuildContext context, {
    required String commentId,
    Function(CommentReportReason, String?)? onSubmit,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ReportCommentSheet(
        commentId: commentId,
        onSubmit: onSubmit,
      ),
    );
  }

  @override
  State<ReportCommentSheet> createState() => _ReportCommentSheetState();
}

class _ReportCommentSheetState extends State<ReportCommentSheet> {
  final _commentService = CommentService.instance;
  final _detailsController = TextEditingController();
  
  CommentReportReason? _selectedReason;
  bool _isSubmitting = false;
  bool _isSuccess = false;

  @override
  void dispose() {
    _detailsController.dispose();
    super.dispose();
  }

  Future<void> _submitReport() async {
    if (_selectedReason == null) return;

    setState(() => _isSubmitting = true);
    HapticFeedback.mediumImpact();

    try {
      final success = await _commentService.reportComment(
        widget.commentId,
        _selectedReason!,
        details: _detailsController.text.trim().isNotEmpty
            ? _detailsController.text.trim()
            : null,
      );

      if (success) {
        widget.onSubmit?.call(_selectedReason!, _detailsController.text.trim());
        setState(() => _isSuccess = true);
        await Future.delayed(const Duration(milliseconds: 1500));
        if (mounted) Navigator.pop(context, true);
      } else {
        _showError('Failed to submit report');
      }
    } catch (e) {
      _showError('Failed to submit report');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: _isSuccess ? _buildSuccessView(cs, textTheme) : _buildForm(cs, textTheme, bottomPadding),
    );
  }

  Widget _buildSuccessView(ColorScheme cs, TextTheme textTheme) {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.check_circle,
              color: Colors.green,
              size: 48,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Report Submitted',
            style: textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Thank you for helping keep our community safe.',
            style: textTheme.bodyMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildForm(ColorScheme cs, TextTheme textTheme, double bottomPadding) {
    return SingleChildScrollView(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: bottomPadding > 0 ? bottomPadding : 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.flag_outlined,
                  color: Colors.red,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'Report Comment',
                style: textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              IconButton(
                icon: Icon(Icons.close, color: cs.onSurfaceVariant),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Help us understand what\'s wrong with this comment.',
            style: textTheme.bodySmall?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 24),

          // Reason selection
          Text(
            'Select a reason',
            style: textTheme.labelLarge?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          ...CommentReportReason.values.map((reason) {
            final isSelected = _selectedReason == reason;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: InkWell(
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _selectedReason = reason);
                },
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? cs.primaryContainer
                        : cs.surfaceContainerHighest.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected ? cs.primary : Colors.transparent,
                      width: 1.5,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _getReasonIcon(reason),
                        size: 20,
                        color: isSelected ? cs.primary : cs.onSurfaceVariant,
                      ),
                      const SizedBox(width: 12),
                      Text(
                        reason.displayName,
                        style: textTheme.bodyMedium?.copyWith(
                          fontWeight: isSelected ? FontWeight.w600 : null,
                          color: isSelected ? cs.onPrimaryContainer : null,
                        ),
                      ),
                      const Spacer(),
                      if (isSelected)
                        Icon(
                          Icons.check_circle,
                          size: 20,
                          color: cs.primary,
                        ),
                    ],
                  ),
                ),
              ),
            );
          }),

          const SizedBox(height: 16),

          // Additional details
          Text(
            'Additional details (optional)',
            style: textTheme.labelLarge?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _detailsController,
            maxLines: 3,
            maxLength: 500,
            decoration: InputDecoration(
              hintText: 'Provide more context about this report...',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: cs.outlineVariant),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: cs.outlineVariant),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: cs.primary, width: 1.5),
              ),
              filled: true,
              fillColor: cs.surfaceContainerHighest.withOpacity(0.5),
            ),
          ),

          const SizedBox(height: 24),

          // Submit button
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _selectedReason == null || _isSubmitting
                  ? null
                  : _submitReport,
              style: FilledButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isSubmitting
                  ? SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      'Submit Report',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  IconData _getReasonIcon(CommentReportReason reason) {
    switch (reason) {
      case CommentReportReason.spam:
        return Icons.report_gmailerrorred;
      case CommentReportReason.harassment:
        return Icons.person_off;
      case CommentReportReason.hateSpeech:
        return Icons.warning_amber;
      case CommentReportReason.misinformation:
        return Icons.fact_check;
      case CommentReportReason.inappropriate:
        return Icons.visibility_off;
      case CommentReportReason.other:
        return Icons.more_horiz;
    }
  }
}
