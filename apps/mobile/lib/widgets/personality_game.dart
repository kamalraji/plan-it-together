import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

enum PersonalityType {
  builder('The Builder', Icons.build_rounded, 'Practical, hands-on problem solver', Colors.orange),
  innovator('The Innovator', Icons.lightbulb_rounded, 'Creative, ideas-focused visionary', Colors.purple),
  connector('The Connector', Icons.handshake_rounded, 'People-focused networker', Colors.blue),
  analyst('The Analyst', Icons.analytics_rounded, 'Data-driven, logical thinker', Colors.green);

  final String title;
  final IconData icon;
  final String description;
  final Color color;

  const PersonalityType(this.title, this.icon, this.description, this.color);
}

class PersonalityGameCard extends StatelessWidget {
  final PersonalityType? result;
  final VoidCallback onTakeQuiz;
  final VoidCallback? onViewResults;
  final VoidCallback? onFindSimilar;

  const PersonalityGameCard({
    Key? key,
    this.result,
    required this.onTakeQuiz,
    this.onViewResults,
    this.onFindSimilar,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final hasResult = result != null;

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
                colors: hasResult
                    ? [
                        result!.color.withOpacity(0.15),
                        result!.color.withOpacity(0.05),
                      ]
                    : [
                        (isDark ? Colors.white : Colors.black).withOpacity(0.08),
                        (isDark ? Colors.white : Colors.black).withOpacity(0.04),
                      ],
              ),
              border: Border.all(
                color: hasResult ? result!.color.withOpacity(0.3) : cs.outline.withOpacity(0.2),
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.psychology_rounded, size: 16, color: hasResult ? result!.color : cs.primary),
                      const SizedBox(width: 6),
                      Text(
                        'PERSONALITY TYPE',
                        style: TextStyle(
                          color: hasResult ? result!.color : cs.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (hasResult) ...[
                    Row(
                      children: [
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: result!.color.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Icon(result!.icon, size: 32, color: result!.color),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                result!.title,
                                style: textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: result!.color,
                                ),
                              ),
                              Text(
                                result!.description,
                                style: textTheme.bodySmall?.copyWith(
                                  color: cs.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: onViewResults,
                            icon: const Icon(Icons.insights, size: 18),
                            label: const Text('Details'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: result!.color,
                              side: BorderSide(color: result!.color),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: FilledButton.icon(
                            onPressed: onFindSimilar,
                            icon: const Icon(Icons.people, size: 18),
                            label: const Text('Find Similar'),
                            style: FilledButton.styleFrom(
                              backgroundColor: result!.color,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ] else ...[
                    Text(
                      'Discover your personality type!',
                      style: textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Answer 8 quick questions to find out if you\'re a Builder, Innovator, Connector, or Analyst.',
                      style: textTheme.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: onTakeQuiz,
                        icon: const Icon(Icons.psychology),
                        label: const Text('Take the Quiz'),
                      ),
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

class PersonalityQuizPage extends StatefulWidget {
  final Function(PersonalityType) onComplete;

  const PersonalityQuizPage({
    Key? key,
    required this.onComplete,
  }) : super(key: key);

  @override
  State<PersonalityQuizPage> createState() => _PersonalityQuizPageState();
}

class _PersonalityQuizPageState extends State<PersonalityQuizPage> {
  int _currentQuestion = 0;
  final Map<PersonalityType, int> _scores = {
    PersonalityType.builder: 0,
    PersonalityType.innovator: 0,
    PersonalityType.connector: 0,
    PersonalityType.analyst: 0,
  };

  static const List<_PersonalityQuestion> _questions = [
    _PersonalityQuestion(
      question: 'When faced with a new challenge, you typically...',
      options: [
        _PersonalityOption('Roll up your sleeves and start building', PersonalityType.builder),
        _PersonalityOption('Brainstorm creative solutions', PersonalityType.innovator),
        _PersonalityOption('Gather a team to collaborate', PersonalityType.connector),
        _PersonalityOption('Research and analyze the problem first', PersonalityType.analyst),
      ],
    ),
    _PersonalityQuestion(
      question: 'Your ideal weekend activity is...',
      options: [
        _PersonalityOption('Working on a hands-on project', PersonalityType.builder),
        _PersonalityOption('Exploring new ideas or art', PersonalityType.innovator),
        _PersonalityOption('Hanging out with friends', PersonalityType.connector),
        _PersonalityOption('Reading or learning something new', PersonalityType.analyst),
      ],
    ),
    _PersonalityQuestion(
      question: 'In a team meeting, you\'re usually the one who...',
      options: [
        _PersonalityOption('Suggests practical action items', PersonalityType.builder),
        _PersonalityOption('Proposes innovative ideas', PersonalityType.innovator),
        _PersonalityOption('Ensures everyone is heard', PersonalityType.connector),
        _PersonalityOption('Asks probing questions', PersonalityType.analyst),
      ],
    ),
    _PersonalityQuestion(
      question: 'What motivates you most at work?',
      options: [
        _PersonalityOption('Seeing tangible results', PersonalityType.builder),
        _PersonalityOption('Creating something new', PersonalityType.innovator),
        _PersonalityOption('Building relationships', PersonalityType.connector),
        _PersonalityOption('Solving complex problems', PersonalityType.analyst),
      ],
    ),
    _PersonalityQuestion(
      question: 'When learning something new, you prefer...',
      options: [
        _PersonalityOption('Learning by doing', PersonalityType.builder),
        _PersonalityOption('Experimenting freely', PersonalityType.innovator),
        _PersonalityOption('Learning with others', PersonalityType.connector),
        _PersonalityOption('Structured study materials', PersonalityType.analyst),
      ],
    ),
    _PersonalityQuestion(
      question: 'Your workspace is typically...',
      options: [
        _PersonalityOption('Functional with tools at hand', PersonalityType.builder),
        _PersonalityOption('Creative and inspiring', PersonalityType.innovator),
        _PersonalityOption('Open and collaborative', PersonalityType.connector),
        _PersonalityOption('Organized and efficient', PersonalityType.analyst),
      ],
    ),
    _PersonalityQuestion(
      question: 'When making decisions, you rely most on...',
      options: [
        _PersonalityOption('Past experience and what works', PersonalityType.builder),
        _PersonalityOption('Intuition and possibilities', PersonalityType.innovator),
        _PersonalityOption('Input from others', PersonalityType.connector),
        _PersonalityOption('Data and logic', PersonalityType.analyst),
      ],
    ),
    _PersonalityQuestion(
      question: 'Your biggest strength is...',
      options: [
        _PersonalityOption('Getting things done', PersonalityType.builder),
        _PersonalityOption('Thinking outside the box', PersonalityType.innovator),
        _PersonalityOption('Bringing people together', PersonalityType.connector),
        _PersonalityOption('Attention to detail', PersonalityType.analyst),
      ],
    ),
  ];

  void _selectOption(PersonalityType type) {
    HapticFeedback.lightImpact();
    setState(() {
      _scores[type] = (_scores[type] ?? 0) + 1;
      if (_currentQuestion < _questions.length - 1) {
        _currentQuestion++;
      } else {
        _finishQuiz();
      }
    });
  }

  void _finishQuiz() {
    final winner = _scores.entries.reduce(
      (a, b) => a.value >= b.value ? a : b,
    ).key;
    widget.onComplete(winner);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final question = _questions[_currentQuestion];
    final progress = (_currentQuestion + 1) / _questions.length;

    return Scaffold(
      appBar: AppBar(title: const Text('Personality Quiz')),
      body: SafeArea(
        child: Column(
          children: [
            LinearProgressIndicator(
              value: progress,
              backgroundColor: cs.surfaceContainerHighest,
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Text(
                'Question ${_currentQuestion + 1} of ${_questions.length}',
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
                      style: textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 32),
                    ...question.options.map((option) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: SizedBox(
                          width: double.infinity,
                          child: OutlinedButton(
                            onPressed: () => _selectOption(option.type),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.all(16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: Text(
                              option.text,
                              textAlign: TextAlign.center,
                            ),
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

class _PersonalityQuestion {
  final String question;
  final List<_PersonalityOption> options;

  const _PersonalityQuestion({
    required this.question,
    required this.options,
  });
}

class _PersonalityOption {
  final String text;
  final PersonalityType type;

  const _PersonalityOption(this.text, this.type);
}
