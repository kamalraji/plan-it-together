import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/widgets/styled_text_field.dart';

/// Bottom sheet for submitting a Q&A question
class QASubmitSheet extends StatefulWidget {
  final String sessionTitle;
  final Future<bool> Function(String text, bool isAnonymous) onSubmit;

  const QASubmitSheet({
    super.key,
    required this.sessionTitle,
    required this.onSubmit,
  });

  /// Show the Q&A submit sheet
  static Future<bool?> show(
    BuildContext context, {
    required String sessionTitle,
    required Future<bool> Function(String text, bool isAnonymous) onSubmit,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => QASubmitSheet(
        sessionTitle: sessionTitle,
        onSubmit: onSubmit,
      ),
    );
  }

  @override
  State<QASubmitSheet> createState() => _QASubmitSheetState();
}

class _QASubmitSheetState extends State<QASubmitSheet> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  bool _isAnonymous = false;
  bool _isSubmitting = false;
  String? _error;

  static const int _minLength = 10;
  static const int _maxLength = 500;

  @override
  void initState() {
    super.initState();
    // Auto-focus the text field
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  bool get _canSubmit {
    final text = _controller.text.trim();
    return text.length >= _minLength && text.length <= _maxLength && !_isSubmitting;
  }

  Future<void> _handleSubmit() async {
    final text = _controller.text.trim();
    
    if (text.length < _minLength) {
      setState(() => _error = 'Question must be at least $_minLength characters');
      return;
    }
    
    if (text.length > _maxLength) {
      setState(() => _error = 'Question must be at most $_maxLength characters');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      final success = await widget.onSubmit(text, _isAnonymous);
      
      if (!mounted) return;
      
      if (success) {
        HapticFeedback.mediumImpact();
        Navigator.of(context).pop(true);
      } else {
        setState(() {
          _isSubmitting = false;
          _error = 'Failed to submit question. Please try again.';
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
        _error = 'An error occurred. Please try again.';
      });
    }
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
      padding: EdgeInsets.only(bottom: bottomPadding),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: cs.onSurfaceVariant.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: cs.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.question_answer_rounded,
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
                        'Ask a Question',
                        style: textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        widget.sessionTitle,
                        style: textTheme.bodySmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Question input
            TextField(
              controller: _controller,
              focusNode: _focusNode,
              maxLines: 4,
              maxLength: _maxLength,
              textCapitalization: TextCapitalization.sentences,
              decoration: InputDecoration(
                hintText: 'Type your question here...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: cs.outline.withOpacity(0.3)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: cs.outline.withOpacity(0.3)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: cs.primary, width: 2),
                ),
                errorText: _error,
                errorBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: cs.error),
                ),
                filled: true,
                fillColor: cs.surfaceContainerHighest.withOpacity(0.5),
              ),
              onChanged: (_) => setState(() => _error = null),
            ),
            const SizedBox(height: 16),

            // Anonymous toggle
            GestureDetector(
              onTap: () => setState(() => _isAnonymous = !_isAnonymous),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: _isAnonymous ? cs.primary.withOpacity(0.1) : cs.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: _isAnonymous ? cs.primary.withOpacity(0.3) : Colors.transparent,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      _isAnonymous ? Icons.visibility_off : Icons.visibility,
                      size: 20,
                      color: _isAnonymous ? cs.primary : cs.onSurfaceVariant,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Ask anonymously',
                            style: textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            'Your name will not be shown with the question',
                            style: textTheme.bodySmall?.copyWith(
                              color: cs.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Switch.adaptive(
                      value: _isAnonymous,
                      onChanged: (v) => setState(() => _isAnonymous = v),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),

            // Info text
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.info_outline,
                    size: 18,
                    color: Colors.amber[700],
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Questions are reviewed by moderators before appearing publicly.',
                      style: textTheme.bodySmall?.copyWith(
                        color: Colors.amber[800],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Submit button
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _canSubmit ? _handleSubmit : null,
                style: FilledButton.styleFrom(
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
                          color: cs.onPrimary,
                        ),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.send_rounded, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'Submit Question',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
