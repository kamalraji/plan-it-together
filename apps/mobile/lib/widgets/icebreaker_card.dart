import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class IcebreakerCard extends StatefulWidget {
  final String id;
  final String question;
  final String? myAnswer;
  final int answerCount;
  final int streakDays;
  final Function(String) onSubmitAnswer;
  final VoidCallback? onSeeAnswers;

  const IcebreakerCard({
    Key? key,
    required this.id,
    required this.question,
    this.myAnswer,
    this.answerCount = 0,
    this.streakDays = 0,
    required this.onSubmitAnswer,
    this.onSeeAnswers,
  }) : super(key: key);

  @override
  State<IcebreakerCard> createState() => _IcebreakerCardState();
}

class _IcebreakerCardState extends State<IcebreakerCard> {
  final _controller = TextEditingController();
  bool _isEditing = false;

  @override
  void initState() {
    super.initState();
    if (widget.myAnswer != null) {
      _controller.text = widget.myAnswer!;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submitAnswer() {
    if (_controller.text.trim().isEmpty) return;
    HapticFeedback.lightImpact();
    widget.onSubmitAnswer(_controller.text.trim());
    setState(() => _isEditing = false);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final hasAnswered = widget.myAnswer != null && !_isEditing;

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
                    Row(
                    children: [
                      Icon(Icons.ac_unit_rounded, size: 14, color: Colors.cyan),
                      const SizedBox(width: 6),
                      Text(
                        'ICEBREAKER OF THE DAY',
                        style: TextStyle(
                          color: Colors.cyan,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const Spacer(),
                      if (widget.streakDays > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.orange.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.local_fire_department_rounded, size: 14, color: Colors.orange),
                              const SizedBox(width: 4),
                              Text(
                                '${widget.streakDays} day streak',
                                style: TextStyle(
                                  color: Colors.orange,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    widget.question,
                    style: textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (hasAnswered) ...[
                    // Show answered state
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
                            widget.myAnswer!,
                            style: textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        TextButton.icon(
                          onPressed: () => setState(() => _isEditing = true),
                          icon: const Icon(Icons.edit, size: 16),
                          label: const Text('Edit'),
                          style: TextButton.styleFrom(
                            visualDensity: VisualDensity.compact,
                          ),
                        ),
                        const Spacer(),
                        if (widget.onSeeAnswers != null)
                          FilledButton.icon(
                            onPressed: () {
                              HapticFeedback.lightImpact();
                              widget.onSeeAnswers!();
                            },
                            icon: const Icon(Icons.people, size: 16),
                            label: Text('See ${widget.answerCount} answers'),
                            style: FilledButton.styleFrom(
                              backgroundColor: Colors.cyan,
                            ),
                          ),
                      ],
                    ),
                  ] else ...[
                    // Show input
                    TextField(
                      controller: _controller,
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
                      textCapitalization: TextCapitalization.sentences,
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        if (widget.answerCount > 0)
                          Text(
                            '${widget.answerCount} answers',
                            style: textTheme.bodySmall?.copyWith(
                              color: cs.onSurfaceVariant,
                            ),
                          ),
                        const Spacer(),
                        FilledButton(
                          onPressed: _submitAnswer,
                          style: FilledButton.styleFrom(
                            backgroundColor: Colors.cyan,
                          ),
                          child: const Text('Submit'),
                        ),
                      ],
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

class IcebreakerAnswersSheet extends StatelessWidget {
  final String question;
  final List<IcebreakerAnswer> answers;

  const IcebreakerAnswersSheet({
    Key? key,
    required this.question,
    required this.answers,
  }) : super(key: key);

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
        ConstrainedBox(
          constraints: BoxConstraints(maxHeight: 400),
          child: ListView.separated(
            shrinkWrap: true,
            itemCount: answers.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final answer = answers[index];
              return ListTile(
                leading: CircleAvatar(
                  backgroundImage: answer.avatarUrl != null
                      ? NetworkImage(answer.avatarUrl!)
                      : null,
                  child: answer.avatarUrl == null
                      ? Text(answer.userName[0].toUpperCase())
                      : null,
                ),
                title: Text(answer.userName),
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

class IcebreakerAnswer {
  final String id;
  final String userName;
  final String? avatarUrl;
  final String answer;
  final DateTime createdAt;

  const IcebreakerAnswer({
    required this.id,
    required this.userName,
    this.avatarUrl,
    required this.answer,
    required this.createdAt,
  });
}
