import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/models/session_question.dart';
import 'package:thittam1hub/services/zone_state_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';
import 'package:thittam1hub/widgets/zone/error_retry_card.dart';
import 'package:thittam1hub/widgets/zone/qa_question_card.dart';
import 'package:thittam1hub/widgets/zone/qa_submit_sheet.dart';
import 'package:thittam1hub/widgets/zone/sections/zone_section_utils.dart';

/// Enhanced Q&A section with Realtime updates and optimistic upvoting
class QASection extends StatefulWidget {
  final String eventId;

  const QASection({super.key, required this.eventId});

  @override
  State<QASection> createState() => _QASectionState();
}

class _QASectionState extends State<QASection>
    with SingleTickerProviderStateMixin {
  String? _selectedSessionId;
  List<SessionQuestion> _questions = [];
  bool _loading = true;
  String? _error;
  String _searchQuery = '';
  _QAFilter _filter = _QAFilter.all;

  // Animation controller for staggered list
  late final AnimationController _staggerController;

  // Realtime subscription
  RealtimeChannel? _questionsChannel;

  // Track new questions for pop-in animation
  final Set<String> _newQuestionIds = {};

  @override
  void initState() {
    super.initState();
    _staggerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _initializeSession();
  }

  @override
  void dispose() {
    _questionsChannel?.unsubscribe();
    _staggerController.dispose();
    super.dispose();
  }

  void _initializeSession() {
    final service = context.read<ZoneStateService>();
    if (service.liveSessions.isNotEmpty) {
      _selectedSessionId = service.liveSessions.first.id;
    } else if (service.upcomingSessions.isNotEmpty) {
      _selectedSessionId = service.upcomingSessions.first.id;
    }
    if (_selectedSessionId != null) {
      _loadQuestions();
      _subscribeToQuestions();
    } else {
      setState(() => _loading = false);
    }
  }

  void _subscribeToQuestions() {
    if (_selectedSessionId == null) return;

    _questionsChannel?.unsubscribe();
    _questionsChannel = SupabaseConfig.client
        .channel('qa:${_selectedSessionId}')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'session_questions',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'session_id',
            value: _selectedSessionId!,
          ),
          callback: _handleRealtimeUpdate,
        )
        .subscribe();
  }

  void _handleRealtimeUpdate(PostgresChangePayload payload) {
    if (!mounted) return;

    switch (payload.eventType) {
      case PostgresChangeEvent.insert:
        final newQuestion = SessionQuestion.fromJson(payload.newRecord);
        if (newQuestion.isVisible) {
          setState(() {
            _newQuestionIds.add(newQuestion.id);
            _questions.insert(0, newQuestion);
          });
          // Remove from new set after animation
          Future.delayed(const Duration(milliseconds: 500), () {
            if (mounted) {
              setState(() => _newQuestionIds.remove(newQuestion.id));
            }
          });
        }
        break;

      case PostgresChangeEvent.update:
        final updated = SessionQuestion.fromJson(payload.newRecord);
        setState(() {
          final index = _questions.indexWhere((q) => q.id == updated.id);
          if (index != -1) {
            // Preserve local upvote state
            final existing = _questions[index];
            _questions[index] = updated.copyWith(
              hasUpvoted: existing.hasUpvoted,
            );
          } else if (updated.isVisible) {
            // Question became visible (approved)
            _newQuestionIds.add(updated.id);
            _questions.insert(0, updated);
          }
        });
        break;

      case PostgresChangeEvent.delete:
        final deletedId = payload.oldRecord['id'] as String?;
        if (deletedId != null) {
          setState(() {
            _questions.removeWhere((q) => q.id == deletedId);
          });
        }
        break;

      default:
        break;
    }
  }

  Future<void> _loadQuestions() async {
    if (_selectedSessionId == null) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    final service = context.read<ZoneStateService>();
    final result = await service.getSessionQuestions(_selectedSessionId!);

    if (!mounted) return;
    setState(() {
      _loading = false;
      if (result.isSuccess) {
        _questions = result.data;
        _staggerController.forward(from: 0);
      } else {
        _error = result.error;
      }
    });
  }

  Future<void> _submitQuestion(String text, bool isAnonymous) async {
    if (_selectedSessionId == null) return;

    final service = context.read<ZoneStateService>();
    final result = await service.submitQuestion(
      sessionId: _selectedSessionId!,
      eventId: widget.eventId,
      questionText: text,
      isAnonymous: isAnonymous,
    );

    if (result.isSuccess) {
      HapticFeedback.mediumImpact();
      // Realtime will handle the UI update
    }
  }

  Future<void> _toggleUpvote(String questionId) async {
    // Find question and save previous state
    final index = _questions.indexWhere((q) => q.id == questionId);
    if (index == -1) return;

    final previousQuestion = _questions[index];
    final newHasUpvoted = !previousQuestion.hasUpvoted;
    final newCount = previousQuestion.upvoteCount + (newHasUpvoted ? 1 : -1);

    // Optimistic update
    setState(() {
      _questions[index] = previousQuestion.copyWith(
        hasUpvoted: newHasUpvoted,
        upvoteCount: newCount,
      );
    });
    HapticFeedback.lightImpact();

    // Server call
    final service = context.read<ZoneStateService>();
    final result = await service.toggleQuestionUpvote(questionId);

    // Rollback on failure
    if (!result.isSuccess && mounted) {
      setState(() {
        _questions[index] = previousQuestion;
      });
      HapticFeedback.heavyImpact();
    }
  }

  void _showSubmitSheet() {
    if (_selectedSessionId == null) return;

    final service = context.read<ZoneStateService>();
    final session = [
      ...service.liveSessions,
      ...service.upcomingSessions
    ].firstWhere(
      (s) => s.id == _selectedSessionId,
      orElse: () => service.liveSessions.first,
    );

    QASubmitSheet.show(
      context,
      sessionTitle: session.title,
      onSubmit: (text, isAnonymous) async {
        await _submitQuestion(text, isAnonymous);
        return true;
      },
    );
  }

  List<SessionQuestion> get _filteredQuestions {
    var filtered = _questions;

    // Apply filter
    final userId = SupabaseConfig.auth.currentUser?.id;
    switch (_filter) {
      case _QAFilter.all:
        break;
      case _QAFilter.answered:
        filtered = filtered.where((q) => q.isAnswered).toList();
        break;
      case _QAFilter.mine:
        filtered = filtered.where((q) => q.userId == userId).toList();
        break;
      case _QAFilter.topVoted:
        filtered = List.from(filtered)
          ..sort((a, b) => b.upvoteCount.compareTo(a.upvoteCount));
        break;
    }

    // Apply search
    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      filtered = filtered
          .where((q) => q.questionText.toLowerCase().contains(query))
          .toList();
    }

    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final service = context.watch<ZoneStateService>();
    final allSessions = [...service.liveSessions, ...service.upcomingSessions];

    if (allSessions.isEmpty) {
      return const ZoneSectionEmpty(
        icon: Icons.question_answer_rounded,
        title: 'No Active Sessions',
        subtitle: 'Q&A will be available during sessions',
      );
    }

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(
        children: [
          // Session selector
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedSessionId,
                isExpanded: true,
                hint: const Text('Select a session'),
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _selectedSessionId = value);
                    _loadQuestions();
                    _subscribeToQuestions();
                  }
                },
                items: allSessions.map((session) {
                  final isLive = service.liveSessions.contains(session);
                  return DropdownMenuItem(
                    value: session.id,
                    child: Row(
                      children: [
                        if (isLive) ...[
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                        ],
                        Expanded(
                          child: Text(
                            session.title,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          // Search and filter bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                // Search field
                TextField(
                  onChanged: (value) => setState(() => _searchQuery = value),
                  decoration: InputDecoration(
                    hintText: 'Search questions...',
                    prefixIcon: Icon(Icons.search, color: cs.onSurfaceVariant),
                    filled: true,
                    fillColor: cs.surfaceContainerHighest,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Filter chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _QAFilter.values.map((filter) {
                      final isSelected = _filter == filter;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(filter.label),
                          selected: isSelected,
                          onSelected: (_) {
                            HapticFeedback.selectionClick();
                            setState(() => _filter = filter);
                          },
                          avatar: Icon(
                            filter.icon,
                            size: 16,
                            color: isSelected ? cs.onPrimary : cs.onSurface,
                          ),
                          backgroundColor: cs.surfaceContainerHighest,
                          selectedColor: cs.primary,
                          labelStyle: TextStyle(
                            color: isSelected ? cs.onPrimary : cs.onSurface,
                          ),
                          showCheckmark: false,
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Questions list
          Expanded(
            child: _loading
                ? const _QALoadingSkeleton()
                : _error != null
                    ? ErrorRetryCard(
                        message: _error!,
                        onRetry: _loadQuestions,
                      )
                    : _filteredQuestions.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  _searchQuery.isNotEmpty
                                      ? Icons.search_off_rounded
                                      : Icons.chat_bubble_outline_rounded,
                                  size: 64,
                                  color: cs.onSurfaceVariant.withOpacity(0.4),
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  _searchQuery.isNotEmpty
                                      ? 'No matching questions'
                                      : 'No questions yet',
                                  style: textTheme.titleMedium?.copyWith(
                                    color: cs.onSurfaceVariant,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  _searchQuery.isNotEmpty
                                      ? 'Try a different search term'
                                      : 'Be the first to ask!',
                                  style: textTheme.bodyMedium?.copyWith(
                                    color: cs.onSurfaceVariant.withOpacity(0.7),
                                  ),
                                ),
                              ],
                            ),
                          )
                        : BrandedRefreshIndicator(
                            onRefresh: _loadQuestions,
                            child: ListView.builder(
                              padding: EdgeInsets.only(
                                left: 16,
                                right: 16,
                                bottom: context.bottomContentPadding + 80,
                              ),
                              itemCount: _filteredQuestions.length,
                              itemBuilder: (context, index) {
                                final question = _filteredQuestions[index];
                                final isNew =
                                    _newQuestionIds.contains(question.id);

                                return _AnimatedQuestionCard(
                                  key: ValueKey(question.id),
                                  question: question,
                                  index: index,
                                  isNew: isNew,
                                  staggerController: _staggerController,
                                  isOwner: question.userId ==
                                      SupabaseConfig.auth.currentUser?.id,
                                  canModerate: service.canManage,
                                  onUpvote: () => _toggleUpvote(question.id),
                                  onStatusChange: service.canManage
                                      ? (status) async {
                                          await service.updateQuestionStatus(
                                            question.id,
                                            status,
                                          );
                                        }
                                      : null,
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
      floatingActionButton: _selectedSessionId != null
          ? FloatingActionButton.extended(
              onPressed: _showSubmitSheet,
              icon: const Icon(Icons.add_comment_rounded),
              label: const Text('Ask a Question'),
            )
          : null,
    );
  }
}

/// Filter options for Q&A
enum _QAFilter {
  all('All', Icons.format_list_bulleted_rounded),
  answered('Answered', Icons.check_circle_outline_rounded),
  topVoted('Top Voted', Icons.trending_up_rounded),
  mine('My Questions', Icons.person_outline_rounded);

  const _QAFilter(this.label, this.icon);
  final String label;
  final IconData icon;
}

/// Animated question card with staggered entrance and pop-in effect
class _AnimatedQuestionCard extends StatelessWidget {
  final SessionQuestion question;
  final int index;
  final bool isNew;
  final AnimationController staggerController;
  final bool isOwner;
  final bool canModerate;
  final VoidCallback? onUpvote;
  final void Function(QuestionStatus)? onStatusChange;

  const _AnimatedQuestionCard({
    super.key,
    required this.question,
    required this.index,
    required this.isNew,
    required this.staggerController,
    required this.isOwner,
    required this.canModerate,
    this.onUpvote,
    this.onStatusChange,
  });

  @override
  Widget build(BuildContext context) {
    final animation = CurvedAnimation(
      parent: staggerController,
      curve: Interval(
        (index * 0.1).clamp(0.0, 0.6),
        ((index * 0.1) + 0.4).clamp(0.4, 1.0),
        curve: Curves.easeOutCubic,
      ),
    );

    Widget card = Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: QAQuestionCard(
        question: question,
        isOwner: isOwner,
        canModerate: canModerate,
        onUpvote: onUpvote,
        onStatusChange: onStatusChange,
      ),
    );

    // Pop-in animation for new questions from Realtime
    if (isNew) {
      return TweenAnimationBuilder<double>(
        tween: Tween(begin: 0.0, end: 1.0),
        duration: const Duration(milliseconds: 400),
        curve: Curves.elasticOut,
        builder: (context, value, child) {
          return Transform.scale(
            scale: value,
            child: Opacity(
              opacity: value.clamp(0.0, 1.0),
              child: child,
            ),
          );
        },
        child: card,
      );
    }

    // Staggered entrance animation
    return SlideTransition(
      position: Tween<Offset>(
        begin: const Offset(0, 0.3),
        end: Offset.zero,
      ).animate(animation),
      child: FadeTransition(
        opacity: animation,
        child: card,
      ),
    );
  }
}

/// Premium loading skeleton for Q&A section
class _QALoadingSkeleton extends StatelessWidget {
  const _QALoadingSkeleton();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 4,
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: cs.outline.withOpacity(0.1)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  _ShimmerBox(width: 32, height: 32, borderRadius: 16),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _ShimmerBox(width: 100, height: 12),
                      const SizedBox(height: 4),
                      _ShimmerBox(width: 60, height: 10),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _ShimmerBox(width: double.infinity, height: 14),
              const SizedBox(height: 8),
              _ShimmerBox(width: 200, height: 14),
              const SizedBox(height: 12),
              Row(
                children: [
                  _ShimmerBox(width: 60, height: 32, borderRadius: 16),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ShimmerBox extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;

  const _ShimmerBox({
    required this.width,
    required this.height,
    this.borderRadius = 6,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    );
  }
}
