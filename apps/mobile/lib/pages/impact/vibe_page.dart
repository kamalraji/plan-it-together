import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/supabase/gamification_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/utils/animations.dart';
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';
import 'package:thittam1hub/widgets/glassmorphism_bottom_sheet.dart';
import 'package:thittam1hub/widgets/would_you_rather_card.dart';
import 'package:thittam1hub/widgets/compatibility_quiz.dart';
import 'package:thittam1hub/widgets/personality_game.dart';
import 'package:thittam1hub/widgets/icebreaker_card.dart';

import 'package:thittam1hub/services/logging_service.dart';
class VibePage extends StatefulWidget {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'VibePage';

  final String? searchQuery;

  const VibePage({Key? key, this.searchQuery}) : super(key: key);

  @override
  State<VibePage> createState() => _VibePageState();
}

class _VibePageState extends State<VibePage> {
  static const String _tag = 'VibePage';
  static final _log = LoggingService.instance;
  
  final GamificationService _svc = GamificationService.instance;
  VibeGameItem? _quick;
  VibeGameItem? _trivia;
  bool _loading = true;
  int? _selectedQuick;
  int? _selectedTrivia;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        _svc.getActiveQuickMatch(),
        _svc.getActiveTrivia(),
      ]);
      if (!mounted) return;
      setState(() {
        _quick = results[0] as VibeGameItem?;
        _trivia = results[1] as VibeGameItem?;
        _loading = false;
      });
    } catch (e) {
      _log.error('VibePage load error: $e', tag: _tag);
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showVibeHistorySheet() {
    showGlassBottomSheet(
      context: context,
      title: 'Your Vibe History',
      child: const VibeHistoryContent(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: cs.surface,
        elevation: 0,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.sports_esports_rounded, color: cs.primary, size: 24),
            const SizedBox(width: 8),
            Text('Vibe Check',
                style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              _showVibeHistorySheet();
            },
            style: TextButton.styleFrom(foregroundColor: cs.primary),
            child: const Text('Your Vibes'),
          )
        ],
      ),
      body: SafeArea(
        child: _loading
            ? ListView(
                padding: EdgeInsets.only(
                    bottom: MediaQuery.of(context).padding.bottom + 16),
                children: List.generate(2, (_) => const VibeGameSkeleton()),
              )
            : BrandedRefreshIndicator(
                onRefresh: _load,
                child: ListView(
                  padding: EdgeInsets.only(
                      bottom: MediaQuery.of(context).padding.bottom + 16),
                  children: [
                    _buildSectionTitle('Live Now', Icons.whatshot_rounded, Colors.orange),
                    if (_quick != null)
                      QuickMatchCard(
                        game: _quick!,
                        selectedIndex: _selectedQuick,
                        onOption: (i) async {
                          final previousSelected = _selectedQuick;
                          setState(() => _selectedQuick = i);
                          HapticFeedback.mediumImpact();
                          try {
                            await _svc.submitQuickMatch(
                                gameId: _quick!.id, optionIndex: i);
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text(
                                        'Answer submitted. Finding matches...')));
                          } catch (e) {
                            _log.error('Quick match submit error: $e', tag: _tag);
                            // Rollback on failure
                            if (mounted) {
                              setState(() => _selectedQuick = previousSelected);
                              ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content: Text('Failed to submit. Try again.')));
                            }
                          }
                        },
                      )
                    else
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Text('No live quick match right now.',
                            style: textTheme.bodyMedium
                                ?.copyWith(color: cs.onSurfaceVariant)),
                      ),
                    _buildSectionTitle('Trivia Challenge', Icons.emoji_events_rounded, Colors.amber),
                    if (_trivia != null)
                      TriviaCard(
                        trivia: _trivia!,
                        selectedIndex: _selectedTrivia,
                        onOption: (i) async {
                          final previousSelected = _selectedTrivia;
                          setState(() => _selectedTrivia = i);
                          HapticFeedback.mediumImpact();
                          try {
                            final correct = await _svc.submitTrivia(
                                trivia: _trivia!, optionIndex: i);
                            if (correct) {
                              await _svc.addImpactPoints(50);
                              await _svc.awardBadgeIfMissing('quiz_whiz');
                            }
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                                content: Text(correct
                                    ? 'Correct! +50 pts 🧠'
                                    : 'Nice try!')));
                          } catch (e) {
                            _log.error('Trivia submit error: $e', tag: _tag);
                            // Rollback on failure
                            if (mounted) {
                              setState(() => _selectedTrivia = previousSelected);
                              ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content: Text('Failed to submit. Try again.')));
                            }
                          }
                        },
                      )
                    else
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Text('No active trivia at the moment.',
                            style: textTheme.bodyMedium
                                ?.copyWith(color: cs.onSurfaceVariant)),
                      ),
                    _buildSectionTitle('Icebreaker of the Day', Icons.ac_unit_rounded, Colors.cyan),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: IcebreakerCard(
                        id: 'icebreaker_1',
                        question:
                            "What's the most underrated skill in your field?",
                        onSubmitAnswer: (answer) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content:
                                    Text('Answer shared with the community!')),
                          );
                        },
                        onSeeAnswers: () {
                          showModalBottomSheet(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (context) => IcebreakerAnswersSheet(
                              question:
                                  "What's the most underrated skill in your field?",
                              answers: [
                                IcebreakerAnswer(
                                  id: 'a1',
                                  userName: 'Alex',
                                  avatarUrl: null,
                                  answer: 'Communication skills',
                                  createdAt: DateTime(2025, 1, 1),
                                ),
                                IcebreakerAnswer(
                                  id: 'a2',
                                  userName: 'Sam',
                                  avatarUrl: null,
                                  answer: 'Time management',
                                  createdAt: DateTime(2025, 1, 1),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildSectionTitle('Would You Rather', Icons.chat_bubble_outline_rounded, Colors.purple),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: WouldYouRatherCard(
                        id: 'wyr_1',
                        optionA: 'Work remotely forever',
                        optionB: 'Work in office forever',
                        onVote: (choice) async {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('You chose: $choice')),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildSectionTitle('Personality Quiz', Icons.psychology_rounded, Colors.indigo),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: PersonalityGameCard(
                        onTakeQuiz: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => PersonalityQuizPage(
                                onComplete: (type) {
                                  Navigator.of(context).pop();
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                        content:
                                            Text('You are: ${type.title}!')),
                                  );
                                },
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildSectionTitle('Compatibility Check', Icons.favorite_border_rounded, Colors.pink),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: CompatibilityQuizCard(
                        partnerName: 'Find a partner',
                        onStart: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text(
                                    'Select a friend to take the quiz with!')),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon, Color iconColor) {
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding, vertical: 8.0),
      child: Row(
        children: [
          Icon(icon, size: 20, color: iconColor),
          const SizedBox(width: 8),
          Text(title,
              style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}

class QuickMatchCard extends StatelessWidget {
  final VibeGameItem game;
  final int? selectedIndex;
  final ValueChanged<int> onOption;

  const QuickMatchCard(
      {Key? key,
      required this.game,
      required this.selectedIndex,
      required this.onOption})
      : super(key: key);

  String _buildSemanticLabel() {
    final parts = ['Quick Match game: ${game.question}'];
    parts.add('${game.options.length} options');
    parts.add('${game.participantCount} participants');
    if (selectedIndex != null) {
      parts.add('You selected ${game.options[selectedIndex!]}');
    }
    return parts.join('. ');
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Semantics(
      label: _buildSemanticLabel(),
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 2,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(
              children: [
                Icon(Icons.bolt_rounded, size: 16, color: cs.primary),
                const SizedBox(width: 4),
                Text('QUICK MATCH',
                    style: TextStyle(color: cs.primary, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 8),
            Text(game.question,
                style:
                    textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            for (int i = 0; i < game.options.length; i++)
              _buildOption(context, i, game.options[i]),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.timer_outlined, size: 14, color: cs.onSurfaceVariant),
                const SizedBox(width: 4),
                Text('ends soon • ${game.participantCount} playing',
                    style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
              ],
            ),
          ]),
        ),
      ),
    );
  }

  Widget _buildOption(BuildContext context, int index, String text) {
    final cs = Theme.of(context).colorScheme;
    final isSelected = selectedIndex == index;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: ElevatedButton(
        onPressed: () => onOption(index),
        style: ElevatedButton.styleFrom(
          backgroundColor: isSelected ? cs.primary : cs.surfaceContainerHighest,
          foregroundColor: isSelected ? cs.onPrimary : cs.onSurface,
          elevation: 0,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          minimumSize: const Size(double.infinity, 40),
        ),
        child: Text(text),
      ),
    );
  }
}

class TriviaCard extends StatelessWidget {
  final VibeGameItem trivia; // type TRIVIA
  final int? selectedIndex;
  final ValueChanged<int> onOption;

  const TriviaCard(
      {Key? key,
      required this.trivia,
      required this.selectedIndex,
      required this.onOption})
      : super(key: key);

  String _buildSemanticLabel() {
    final parts = ['Trivia challenge: ${trivia.question}'];
    parts.add('${trivia.options.length} options');
    parts.add('${trivia.participantCount} participants');
    if (selectedIndex != null) {
      parts.add('You selected ${trivia.options[selectedIndex!]}');
    }
    return parts.join('. ');
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Semantics(
      label: _buildSemanticLabel(),
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 2,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(
              children: [
                Icon(Icons.emoji_events_rounded, size: 16, color: cs.primary),
                const SizedBox(width: 4),
                Text('TRIVIA',
                    style: TextStyle(color: cs.primary, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 8),
            Text(trivia.question,
                style:
                    textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            for (int i = 0; i < trivia.options.length; i++)
              _buildOption(context, i, trivia.options[i]),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.timer_outlined, size: 14, color: cs.onSurfaceVariant),
                const SizedBox(width: 4),
                Text(
                    '${(trivia.expiresAt.difference(DateTime.now()).inMinutes).clamp(0, 59)} min left • ${trivia.participantCount} playing',
                    style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
              ],
            ),
          ]),
        ),
      ),
    );
  }

  Widget _buildOption(BuildContext context, int index, String text) {
    final cs = Theme.of(context).colorScheme;
    final isSelected = selectedIndex == index;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: ElevatedButton(
        onPressed: () => onOption(index),
        style: ElevatedButton.styleFrom(
          backgroundColor: isSelected ? cs.primary : cs.surfaceContainerHighest,
          foregroundColor: isSelected ? cs.onPrimary : cs.onSurface,
          elevation: 0,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          minimumSize: const Size(double.infinity, 40),
        ),
        child: Text(text),
      ),
    );
  }
}

/// Content for vibe history glassmorphism sheet
class VibeHistoryContent extends StatelessWidget {
  const VibeHistoryContent({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          height: 300,
          child: ListView.builder(
            itemCount: 3,
            itemBuilder: (context, index) => ListTile(
              leading: Icon(Icons.history, color: cs.primary),
              title:
                  Text('Vibe game #${index + 1}', style: textTheme.bodyMedium),
              subtitle: Text('Played recently',
                  style: textTheme.bodySmall
                      ?.copyWith(color: cs.onSurfaceVariant)),
            ),
          ),
        ),
      ],
    );
  }
}

class VibeGameSkeleton extends StatelessWidget {
  const VibeGameSkeleton({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
                height: 14, width: 100, color: cs.surfaceContainerHighest),
            const SizedBox(height: 12),
            Container(
                height: 18,
                width: double.infinity,
                color: cs.surfaceContainerHighest),
            const SizedBox(height: 16),
            ...List.generate(
                3,
                (_) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Container(
                          height: 40,
                          decoration: BoxDecoration(
                              color: cs.surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(10))),
                    )),
          ],
        ),
      ),
    );
  }
}
