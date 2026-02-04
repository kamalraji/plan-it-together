import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/icebreaker_models.dart';

/// Card for displaying and answering the daily icebreaker question
class EventIcebreakerCard extends StatefulWidget {
  final EventIcebreaker icebreaker;
  final Function(String answer) onSubmitAnswer;
  final VoidCallback? onSeeAnswers;

  const EventIcebreakerCard({
    super.key,
    required this.icebreaker,
    required this.onSubmitAnswer,
    this.onSeeAnswers,
  });

  @override
  State<EventIcebreakerCard> createState() => _EventIcebreakerCardState();
}

class _EventIcebreakerCardState extends State<EventIcebreakerCard> {
  final _controller = TextEditingController();
  bool _isEditing = false;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.icebreaker.myAnswer != null) {
      _controller.text = widget.icebreaker.myAnswer!;
    }
  }

  @override
  void didUpdateWidget(EventIcebreakerCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.icebreaker.myAnswer != oldWidget.icebreaker.myAnswer) {
      if (widget.icebreaker.myAnswer != null && !_isEditing) {
        _controller.text = widget.icebreaker.myAnswer!;
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submitAnswer() async {
    if (_controller.text.trim().isEmpty || _isSubmitting) return;
    
    setState(() => _isSubmitting = true);
    HapticFeedback.lightImpact();
    
    try {
      await Future.value(widget.onSubmitAnswer(_controller.text.trim()));
      setState(() => _isEditing = false);
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final hasAnswered = widget.icebreaker.myAnswer != null && !_isEditing;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 0,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.cyan.withOpacity(isDark ? 0.15 : 0.1),
                  Colors.cyan.withOpacity(isDark ? 0.05 : 0.02),
                ],
              ),
              border: Border.all(color: Colors.cyan.withOpacity(0.3)),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header row
                  Row(
                    children: [
                      const Icon(Icons.ac_unit_rounded, size: 14, color: Colors.cyan),
                      const SizedBox(width: 6),
                      const Text(
                        'ICEBREAKER OF THE DAY',
                        style: TextStyle(
                          color: Colors.cyan,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const Spacer(),
                      if (widget.icebreaker.streakDays > 0)
                        _StreakBadge(streakDays: widget.icebreaker.streakDays),
                    ],
                  ),
                  const SizedBox(height: 12),
                  
                  // Question
                  Text(
                    widget.icebreaker.question,
                    style: textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  if (hasAnswered) ...[
                    // Answered state
                    _AnsweredView(
                      answer: widget.icebreaker.myAnswer!,
                      answerCount: widget.icebreaker.answerCount,
                      onEdit: () => setState(() => _isEditing = true),
                      onSeeAnswers: widget.onSeeAnswers,
                    ),
                  ] else ...[
                    // Input state
                    _InputView(
                      controller: _controller,
                      answerCount: widget.icebreaker.answerCount,
                      isSubmitting: _isSubmitting,
                      onSubmit: _submitAnswer,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _StreakBadge extends StatelessWidget {
  final int streakDays;

  const _StreakBadge({required this.streakDays});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.orange.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.local_fire_department_rounded,
            size: 14,
            color: Colors.orange,
          ),
          const SizedBox(width: 4),
          Text(
            '$streakDays day${streakDays > 1 ? 's' : ''} streak',
            style: const TextStyle(
              color: Colors.orange,
              fontWeight: FontWeight.bold,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}

class _AnsweredView extends StatelessWidget {
  final String answer;
  final int answerCount;
  final VoidCallback onEdit;
  final VoidCallback? onSeeAnswers;

  const _AnsweredView({
    required this.answer,
    required this.answerCount,
    required this.onEdit,
    this.onSeeAnswers,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: cs.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Your answer:',
                style: textTheme.labelSmall?.copyWith(
                  color: cs.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                answer,
                style: textTheme.bodyMedium,
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            TextButton.icon(
              onPressed: onEdit,
              icon: const Icon(Icons.edit, size: 16),
              label: const Text('Edit'),
              style: TextButton.styleFrom(
                visualDensity: VisualDensity.compact,
              ),
            ),
            const Spacer(),
            if (onSeeAnswers != null)
              FilledButton.icon(
                onPressed: onSeeAnswers,
                icon: const Icon(Icons.people, size: 16),
                label: Text('See $answerCount answers'),
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.cyan,
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _InputView extends StatelessWidget {
  final TextEditingController controller;
  final int answerCount;
  final bool isSubmitting;
  final VoidCallback onSubmit;

  const _InputView({
    required this.controller,
    required this.answerCount,
    required this.isSubmitting,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Column(
      children: [
        TextField(
          controller: controller,
          enabled: !isSubmitting,
          decoration: InputDecoration(
            hintText: 'Type your answer...',
            filled: true,
            fillColor: cs.surfaceContainerHighest,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            contentPadding: const EdgeInsets.all(16),
          ),
          maxLines: 3,
          minLines: 1,
          maxLength: 500,
          textCapitalization: TextCapitalization.sentences,
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            if (answerCount > 0)
              Text(
                '$answerCount ${answerCount == 1 ? 'answer' : 'answers'}',
                style: textTheme.bodySmall?.copyWith(
                  color: cs.onSurfaceVariant,
                ),
              ),
            const Spacer(),
            FilledButton(
              onPressed: isSubmitting ? null : onSubmit,
              style: FilledButton.styleFrom(
                backgroundColor: Colors.cyan,
              ),
              child: isSubmitting
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text('Submit'),
            ),
          ],
        ),
      ],
    );
  }
}

/// Bottom sheet for viewing all icebreaker answers
class IcebreakerAnswersSheet extends StatelessWidget {
  final String question;
  final List<IcebreakerAnswer> answers;

  const IcebreakerAnswersSheet({
    super.key,
    required this.question,
    required this.answers,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          question,
          style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        if (answers.isEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                children: [
                  Icon(
                    Icons.chat_bubble_outline_rounded,
                    size: 48,
                    color: cs.onSurfaceVariant.withOpacity(0.5),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No answers yet',
                    style: textTheme.bodyLarge?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Be the first to share your answer!',
                    style: textTheme.bodySmall?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 400),
            child: ListView.separated(
              shrinkWrap: true,
              itemCount: answers.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final answer = answers[index];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundImage: answer.userAvatar != null
                        ? NetworkImage(answer.userAvatar!)
                        : null,
                    child: answer.userAvatar == null
                        ? Text(
                            (answer.userName ?? 'U')[0].toUpperCase(),
                          )
                        : null,
                  ),
                  title: Text(answer.userName ?? 'Anonymous'),
                  subtitle: Text(answer.answer),
                  contentPadding: EdgeInsets.zero,
                );
              },
            ),
          ),
      ],
    );
  }
}
