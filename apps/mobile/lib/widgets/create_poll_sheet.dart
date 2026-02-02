import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/post_poll.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Callback for poll creation
typedef OnPollCreated = Future<void> Function({
  required String question,
  required List<String> options,
  required Duration duration,
});

/// Standalone poll creation sheet with full validation
class CreatePollSheet extends StatefulWidget {
  final OnPollCreated onPollCreated;
  final VoidCallback? onCancel;

  const CreatePollSheet({
    super.key,
    required this.onPollCreated,
    this.onCancel,
  });

  /// Show the poll creation sheet as a modal
  static Future<void> show(
    BuildContext context, {
    required OnPollCreated onPollCreated,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        builder: (context, scrollController) => Container(
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: CreatePollSheet(
            onPollCreated: onPollCreated,
          ),
        ),
      ),
    );
  }

  @override
  State<CreatePollSheet> createState() => _CreatePollSheetState();
}

class _CreatePollSheetState extends State<CreatePollSheet> {
  static const String _tag = 'CreatePollSheet';
  static final _log = LoggingService.instance;

  final _questionController = TextEditingController();
  final List<TextEditingController> _optionControllers = [
    TextEditingController(),
    TextEditingController(),
  ];
  Duration _selectedDuration = PollDuration.oneDay;
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _questionController.dispose();
    for (final controller in _optionControllers) {
      controller.dispose();
    }
    super.dispose();
  }

  void _addOption() {
    if (_optionControllers.length < 4) {
      HapticFeedback.lightImpact();
      setState(() {
        _optionControllers.add(TextEditingController());
        _errorMessage = null;
      });
    }
  }

  void _removeOption(int index) {
    if (_optionControllers.length > 2) {
      HapticFeedback.lightImpact();
      setState(() {
        _optionControllers[index].dispose();
        _optionControllers.removeAt(index);
        _errorMessage = null;
      });
    }
  }

  String? _validate() {
    // Validate question
    final question = _questionController.text.trim();
    if (question.isEmpty) {
      return 'Please enter a question';
    }
    if (question.length < 5) {
      return 'Question must be at least 5 characters';
    }
    if (question.length > 280) {
      return 'Question must be under 280 characters';
    }

    // Use PostPoll model for option validation
    final options = _optionControllers.map((c) => c.text).toList();
    final poll = PostPoll(options: options, duration: _selectedDuration);
    return poll.validate();
  }

  Future<void> _submit() async {
    final error = _validate();
    if (error != null) {
      HapticFeedback.heavyImpact();
      setState(() => _errorMessage = error);
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });
    HapticFeedback.mediumImpact();

    try {
      final question = _questionController.text.trim();
      final options = _optionControllers
          .map((c) => c.text.trim())
          .where((o) => o.isNotEmpty)
          .toList();

      await widget.onPollCreated(
        question: question,
        options: options,
        duration: _selectedDuration,
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('📊 Poll created!'),
            backgroundColor: Theme.of(context).colorScheme.primary,
          ),
        );
      }
    } catch (e) {
      _log.error('Failed to create poll: $e', tag: _tag);
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to create poll. Please try again.';
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 8,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: cs.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Header
          Row(
            children: [
              Icon(Icons.poll_rounded, color: cs.primary),
              const SizedBox(width: 8),
              Text(
                'Create Poll',
                style: textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () {
                  widget.onCancel?.call();
                  Navigator.pop(context);
                },
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Question field
          TextField(
            controller: _questionController,
            maxLength: 280,
            maxLines: 2,
            textCapitalization: TextCapitalization.sentences,
            decoration: InputDecoration(
              labelText: 'Question',
              hintText: 'What do you want to ask?',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              prefixIcon: const Icon(Icons.help_outline_rounded),
            ),
            onChanged: (_) => setState(() => _errorMessage = null),
          ),

          const SizedBox(height: 16),

          // Duration selector
          Text(
            'Poll Duration',
            style: textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: PollDuration.options.map((option) {
              final isSelected = _selectedDuration == option.duration;
              return _DurationChip(
                label: option.label,
                isSelected: isSelected,
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _selectedDuration = option.duration);
                },
              );
            }).toList(),
          ),

          const SizedBox(height: 16),

          // Options
          Text(
            'Options (${_optionControllers.length}/4)',
            style: textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),

          Expanded(
            child: ListView.builder(
              itemCount: _optionControllers.length + 1, // +1 for add button
              itemBuilder: (context, index) {
                if (index == _optionControllers.length) {
                  // Add option button
                  if (_optionControllers.length >= 4) return const SizedBox();
                  return Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: OutlinedButton.icon(
                      onPressed: _addOption,
                      icon: const Icon(Icons.add_circle_outline, size: 18),
                      label: const Text('Add Option'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: cs.primary,
                      ),
                    ),
                  );
                }

                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      // Option indicator
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: cs.outline),
                        ),
                        child: Center(
                          child: Text(
                            '${index + 1}',
                            style: textTheme.labelSmall?.copyWith(
                              color: cs.onSurfaceVariant,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Option text field
                      Expanded(
                        child: TextField(
                          controller: _optionControllers[index],
                          maxLength: 100,
                          decoration: InputDecoration(
                            hintText: 'Option ${index + 1}',
                            counterText: '',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(AppRadius.sm),
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 10,
                            ),
                            isDense: true,
                          ),
                          onChanged: (_) => setState(() => _errorMessage = null),
                        ),
                      ),
                      // Remove button
                      if (_optionControllers.length > 2) ...[
                        const SizedBox(width: 8),
                        IconButton(
                          icon: Icon(Icons.remove_circle_outline,
                              color: cs.error, size: 20),
                          onPressed: () => _removeOption(index),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(
                            minWidth: 32,
                            minHeight: 32,
                          ),
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
          ),

          // Error message
          if (_errorMessage != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: cs.errorContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, color: cs.error, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: textTheme.bodySmall?.copyWith(
                          color: cs.onErrorContainer,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Submit button
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _isSubmitting ? null : _submit,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Create Poll'),
            ),
          ),
        ],
      ),
    );
  }
}

/// Duration selection chip
class _DurationChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _DurationChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? cs.primary : cs.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? cs.primary : cs.outline.withOpacity(0.3),
          ),
        ),
        child: Text(
          label,
          style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: isSelected ? cs.onPrimary : cs.onSurfaceVariant,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
        ),
      ),
    );
  }
}
