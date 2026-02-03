import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class CompatibilityQuizCard extends StatelessWidget {
  final String partnerName;
  final String? partnerAvatarUrl;
  final bool isCompleted;
  final int? compatibilityScore;
  final VoidCallback onStart;
  final VoidCallback? onViewResults;

  const CompatibilityQuizCard({
    Key? key,
    required this.partnerName,
    this.partnerAvatarUrl,
    this.isCompleted = false,
    this.compatibilityScore,
    required this.onStart,
    this.onViewResults,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

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
                  (isDark ? Colors.white : Colors.black).withOpacity(0.08),
                  (isDark ? Colors.white : Colors.black).withOpacity(0.04),
                ],
              ),
              border: Border.all(color: cs.outline.withOpacity(0.2)),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  // Partner avatar
                  CircleAvatar(
                    radius: 28,
                    backgroundImage: partnerAvatarUrl != null
                        ? NetworkImage(partnerAvatarUrl!)
                        : null,
                    backgroundColor: cs.primary.withOpacity(0.2),
                    child: partnerAvatarUrl == null
                        ? Text(
                            partnerName.isNotEmpty ? partnerName[0] : '?',
                            style: TextStyle(
                              color: cs.primary,
                              fontWeight: FontWeight.bold,
                              fontSize: 20,
                            ),
                          )
                        : null,
                  ),
                  const SizedBox(width: 16),
                  // Content
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '💕 Compatibility Quiz',
                          style: TextStyle(
                            color: Colors.pink,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          isCompleted
                              ? 'You & $partnerName: $compatibilityScore% compatible!'
                              : 'Take quiz with $partnerName',
                          style: textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (!isCompleted)
                          Text(
                            'Answer 10 questions to find out!',
                            style: textTheme.bodySmall?.copyWith(
                              color: cs.onSurfaceVariant,
                            ),
                          ),
                      ],
                    ),
                  ),
                  // Action button
                  FilledButton(
                    onPressed: isCompleted ? onViewResults : onStart,
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.pink,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    ),
                    child: Text(isCompleted ? 'View' : 'Start'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class CompatibilityQuizPage extends StatefulWidget {
  final String quizId;
  final String partnerName;
  final List<CompatibilityQuestion> questions;
  final Function(List<int>) onComplete;

  const CompatibilityQuizPage({
    Key? key,
    required this.quizId,
    required this.partnerName,
    required this.questions,
    required this.onComplete,
  }) : super(key: key);

  @override
  State<CompatibilityQuizPage> createState() => _CompatibilityQuizPageState();
}

class _CompatibilityQuizPageState extends State<CompatibilityQuizPage> {
  int _currentQuestion = 0;
  final List<int> _answers = [];

  void _selectOption(int optionIndex) {
    HapticFeedback.lightImpact();
    setState(() {
      _answers.add(optionIndex);
      if (_currentQuestion < widget.questions.length - 1) {
        _currentQuestion++;
      } else {
        widget.onComplete(_answers);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final question = widget.questions[_currentQuestion];
    final progress = (_currentQuestion + 1) / widget.questions.length;

    return Scaffold(
      appBar: AppBar(
        title: Text('Quiz with ${widget.partnerName}'),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Progress bar
            LinearProgressIndicator(
              value: progress,
              backgroundColor: cs.surfaceContainerHighest,
              color: Colors.pink,
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Text(
                'Question ${_currentQuestion + 1} of ${widget.questions.length}',
                style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      question.question,
                      style: textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 32),
                    ...question.options.asMap().entries.map((entry) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: SizedBox(
                          width: double.infinity,
                          child: OutlinedButton(
                            onPressed: () => _selectOption(entry.key),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.all(16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: Text(entry.value),
                          ),
                        ),
                      );
                    }),
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

class CompatibilityQuestion {
  final String question;
  final List<String> options;

  const CompatibilityQuestion({
    required this.question,
    required this.options,
  });
}

class CompatibilityResultCard extends StatelessWidget {
  final int score;
  final String partnerName;
  final List<String> agreements;
  final List<String> disagreements;

  const CompatibilityResultCard({
    Key? key,
    required this.score,
    required this.partnerName,
    this.agreements = const [],
    this.disagreements = const [],
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    Color scoreColor;
    IconData scoreIcon;
    if (score >= 80) {
      scoreColor = Colors.green;
      scoreIcon = Icons.celebration_rounded;
    } else if (score >= 60) {
      scoreColor = Colors.blue;
      scoreIcon = Icons.sentiment_satisfied_alt_rounded;
    } else if (score >= 40) {
      scoreColor = Colors.orange;
      scoreIcon = Icons.sentiment_neutral_rounded;
    } else {
      scoreColor = Colors.red;
      scoreIcon = Icons.sentiment_dissatisfied_rounded;
    }

    return Card(
      margin: const EdgeInsets.all(16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(scoreIcon, size: 56, color: scoreColor),
            const SizedBox(height: 8),
            Text(
              '$score%',
              style: textTheme.displayMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: scoreColor,
              ),
            ),
            Text(
              'Compatible with $partnerName',
              style: textTheme.titleMedium?.copyWith(
                color: cs.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 24),
            if (agreements.isNotEmpty) ...[
              _buildSection(
                context,
                '✅ You both agree on',
                agreements,
                Colors.green,
              ),
              const SizedBox(height: 16),
            ],
            if (disagreements.isNotEmpty)
              _buildSection(
                context,
                '🔄 Different views on',
                disagreements,
                Colors.orange,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(
    BuildContext context,
    String title,
    List<String> items,
    Color color,
  ) {
    final textTheme = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: textTheme.labelLarge?.copyWith(color: color),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: items
              .map((item) => Chip(
                    label: Text(item),
                    backgroundColor: color.withOpacity(0.1),
                    labelStyle: TextStyle(color: color),
                  ))
              .toList(),
        ),
      ],
    );
  }
}
