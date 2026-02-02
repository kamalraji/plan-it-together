import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
export 'package:supabase_flutter/supabase_flutter.dart' show RealtimeChannel;
import '../../models/competition_models.dart';
import '../../supabase/competition_service.dart';
import '../animated_stat_counter.dart';
import 'live_question_card.dart';
import 'competition_leaderboard.dart';
import 'team_competition_leaderboard.dart';
import 'competition_badge_card.dart';
import 'presence_indicator.dart';
import 'score_celebration.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Competition zone card for quiz and competition events
/// Includes real-time leaderboard, round progression, and live quiz
class CompetitionZoneCard extends StatefulWidget {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'CompetitionZoneCard';

  final String eventId;
  final VoidCallback? onScoreUpdated;

  const CompetitionZoneCard({
    super.key,
    required this.eventId,
    this.onScoreUpdated,
  });

  @override
  State<CompetitionZoneCard> createState() => _CompetitionZoneCardState();
}

class _CompetitionZoneCardState extends State<CompetitionZoneCard>
    with TickerProviderStateMixin {
  static const String _tag = 'CompetitionZoneCard';
  static final _log = LoggingService.instance;
  
  final CompetitionService _service = CompetitionService.instance;

  bool _isLoading = true;
  List<CompetitionRound> _rounds = [];
  CompetitionRound? _currentRound;
  CompetitionQuestion? _activeQuestion;
  CompetitionScore? _myScore;
  List<CompetitionLeaderboardEntry> _leaderboard = [];
  CompetitionResponse? _myResponse;

  // Presence & badges
  CompetitionPresence? _presence;
  List<CompetitionBadge> _badges = [];
  
  // Team mode
  bool _isTeamMode = false;
  CompetitionTeamScore? _myTeamScore;
  List<CompetitionTeamScore> _teamLeaderboard = [];

  // Real-time subscriptions
  RealtimeChannel? _questionChannel;
  RealtimeChannel? _leaderboardChannel;
  RealtimeChannel? _presenceChannel;
  RealtimeChannel? _teamLeaderboardChannel;

  // Celebration state
  bool _showCelebration = false;
  bool _celebrationIsCorrect = false;
  int _celebrationPoints = 0;
  int _celebrationStreak = 0;

  // Expanded sections
  bool _showFullLeaderboard = false;
  bool _showRoundHistory = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _unsubscribeAll();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    try {
      // Check if team mode
      final teamResult = await _service.isTeamCompetition(widget.eventId);
      _isTeamMode = teamResult.isSuccess ? teamResult.data : false;
      
      await Future.wait([
        _loadRounds(),
        _loadMyScore(),
        _loadLeaderboard(),
        _loadPresence(),
        _loadBadges(),
        if (_isTeamMode) _loadTeamData(),
      ]);

      if (_currentRound != null) {
        await _loadActiveQuestion();
        _subscribeToQuestions();
      }
      _subscribeToLeaderboard();
      _subscribeToPresence();
      if (_isTeamMode) _subscribeToTeamLeaderboard();
      
      // Update presence
      await _service.updatePresence(widget.eventId);
    } catch (e) {
      _log.debug('Error loading competition data: $e', tag: _tag);
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _loadRounds() async {
    final result = await _service.getRounds(widget.eventId);
    if (mounted && result.isSuccess) {
      final rounds = result.data;
      setState(() {
        _rounds = rounds;
        _currentRound = rounds.where((r) => r.isActive).firstOrNull;
      });
    }
  }

  Future<void> _loadActiveQuestion() async {
    if (_currentRound == null) return;

    final result = await _service.getActiveQuestion(_currentRound!.id);
    if (mounted) {
      final question = result.dataOrNull;
      setState(() => _activeQuestion = question);
      if (question != null) {
        _loadMyResponse(question.id);
      }
    }
  }

  Future<void> _loadMyResponse(String questionId) async {
    final result = await _service.getMyResponse(questionId);
    if (mounted) {
      setState(() => _myResponse = result.dataOrNull);
    }
  }

  Future<void> _loadMyScore() async {
    final result = await _service.getMyScore(widget.eventId);
    if (mounted) {
      setState(() => _myScore = result.dataOrNull);
    }
  }

  Future<void> _loadLeaderboard() async {
    final result = await _service.getLeaderboard(widget.eventId);
    if (mounted && result.isSuccess) {
      setState(() => _leaderboard = result.data);
    }
  }

  void _subscribeToQuestions() {
    if (_currentRound == null) return;

    _questionChannel = _service.subscribeToQuestions(
      _currentRound!.id,
      onQuestionUpdate: (question) {
        if (mounted) {
          setState(() {
            _activeQuestion = question;
            _myResponse = null;
          });
          if (question != null) {
            _loadMyResponse(question.id);
          }
        }
      },
    );
  }

  void _subscribeToLeaderboard() {
    _leaderboardChannel = _service.subscribeToLeaderboard(
      widget.eventId,
      onLeaderboardUpdate: () {
        _loadLeaderboard();
        _loadMyScore();
      },
    );
  }

  void _unsubscribeAll() {
    if (_questionChannel != null) _service.unsubscribe(_questionChannel!);
    if (_leaderboardChannel != null) _service.unsubscribe(_leaderboardChannel!);
    if (_presenceChannel != null) _service.unsubscribe(_presenceChannel!);
    if (_teamLeaderboardChannel != null) _service.unsubscribe(_teamLeaderboardChannel!);
    _service.goOffline(widget.eventId);
  }
  
  Future<void> _loadPresence() async {
    final result = await _service.getPresenceStats(widget.eventId);
    if (mounted && result.isSuccess) setState(() => _presence = result.data);
  }
  
  Future<void> _loadBadges() async {
    final result = await _service.getBadgesWithStatus(widget.eventId);
    if (mounted && result.isSuccess) setState(() => _badges = result.data);
  }
  
  Future<void> _loadTeamData() async {
    final teamScoreResult = await _service.getMyTeamScore(widget.eventId);
    final teamLeaderboardResult = await _service.getTeamLeaderboard(widget.eventId);
    if (mounted) {
      setState(() {
        _myTeamScore = teamScoreResult.dataOrNull;
        _teamLeaderboard = teamLeaderboardResult.isSuccess ? teamLeaderboardResult.data : [];
      });
    }
  }
  
  void _subscribeToPresence() {
    _presenceChannel = _service.subscribeToPresence(
      widget.eventId,
      onPresenceUpdate: (presence) {
        if (mounted) setState(() => _presence = presence);
      },
    );
  }
  
  void _subscribeToTeamLeaderboard() {
    _teamLeaderboardChannel = _service.subscribeToTeamLeaderboard(
      widget.eventId,
      onUpdate: () => _loadTeamData(),
    );
  }

  Future<void> _handleSubmitAnswer(int selectedOption, int responseTimeMs) async {
    if (_activeQuestion == null) return;

    final result = await _service.submitAnswer(
      questionId: _activeQuestion!.id,
      selectedOption: selectedOption,
      responseTimeMs: responseTimeMs,
    );

    final response = result.dataOrNull;
    if (response != null && mounted) {
      setState(() {
        _myResponse = response;
        _showCelebration = true;
        _celebrationIsCorrect = response.isCorrect;
        _celebrationPoints = response.pointsEarned;
        _celebrationStreak = response.isCorrect
            ? (_myScore?.currentStreak ?? 0) + 1
            : 0;
      });

      widget.onScoreUpdated?.call();
    }
  }

  void _handleCelebrationComplete() {
    if (mounted) {
      setState(() => _showCelebration = false);
      _loadMyScore();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Stack(
      children: [
        RefreshIndicator(
          onRefresh: _loadData,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Round Progress
                _buildRoundProgressCard(),
                const SizedBox(height: 16),

                // Live Question
                if (_activeQuestion != null && _activeQuestion!.isActive)
                  ...[
                    LiveQuestionCard(
                      question: _activeQuestion!,
                      existingResponse: _myResponse,
                      onSubmit: _handleSubmitAnswer,
                      onTimeExpired: () {
                        // Auto-submit with no answer
                      },
                    ),
                    const SizedBox(height: 16),
                  ],

                // Waiting for question
                if (_currentRound != null && _activeQuestion == null)
                  _buildWaitingCard(),

                // No active round
                if (_currentRound == null && _rounds.isNotEmpty)
                  _buildNoActiveRoundCard(),

                // My Score
                _buildMyScoreCard(),
                const SizedBox(height: 16),

                // Leaderboard
                CompetitionLeaderboard(
                  entries: _leaderboard,
                  showFullList: _showFullLeaderboard,
                  onViewAll: () {
                    setState(() => _showFullLeaderboard = true);
                  },
                ),
                const SizedBox(height: 16),

                // Round History
                if (_rounds.where((r) => r.isCompleted).isNotEmpty)
                  _buildRoundHistoryCard(),
              ],
            ),
          ),
        ),

        // Celebration overlay
        if (_showCelebration)
          Positioned.fill(
            child: ScoreCelebration(
              isCorrect: _celebrationIsCorrect,
              pointsEarned: _celebrationPoints,
              newStreak: _celebrationStreak,
              onComplete: _handleCelebrationComplete,
            ),
          ),
      ],
    );
  }

  Widget _buildRoundProgressCard() {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    if (_rounds.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Icon(
                Icons.emoji_events,
                size: 48,
                color: colorScheme.outline,
              ),
              const SizedBox(height: 12),
              Text(
                'Competition Coming Soon',
                style: theme.textTheme.titleMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      );
    }

    final activeRound = _currentRound;
    final completedRounds = _rounds.where((r) => r.isCompleted).length;
    final totalRounds = _rounds.length;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.flag,
                    color: colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        activeRound?.name ?? 'Competition',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        activeRound != null
                            ? 'Round ${activeRound.roundNumber} of $totalRounds'
                            : '$completedRounds of $totalRounds rounds completed',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: colorScheme.outline,
                        ),
                      ),
                    ],
                  ),
                ),
                if (activeRound != null)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.green),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Colors.green,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'LIVE',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: Colors.green,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            if (activeRound != null) ...[
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: activeRound.progress,
                  minHeight: 8,
                  backgroundColor: colorScheme.surfaceContainerHighest,
                  valueColor: AlwaysStoppedAnimation(colorScheme.primary),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '${activeRound.completedQuestions} of ${activeRound.questionCount} questions completed',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colorScheme.outline,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildWaitingCard() {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(32),
        child: Column(
          children: [
            SizedBox(
              width: 60,
              height: 60,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                color: colorScheme.primary,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Waiting for next question...',
              style: theme.textTheme.titleMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Get ready!',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colorScheme.outline,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoActiveRoundCard() {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final upcomingRound = _rounds.where((r) => r.isUpcoming).firstOrNull;

    return Card(
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Icon(
              Icons.schedule,
              size: 48,
              color: colorScheme.outline,
            ),
            const SizedBox(height: 12),
            Text(
              'No Active Round',
              style: theme.textTheme.titleMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            if (upcomingRound != null) ...[
              const SizedBox(height: 8),
              Text(
                'Next: ${upcomingRound.name}',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: colorScheme.primary,
                ),
              ),
              if (upcomingRound.startTime != null) ...[
                const SizedBox(height: 4),
                Text(
                  'Starting at ${_formatTime(upcomingRound.startTime!)}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.outline,
                  ),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildMyScoreCard() {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              colorScheme.primaryContainer.withOpacity(0.5),
              colorScheme.secondaryContainer.withOpacity(0.3),
            ],
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.stars, color: colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  'Your Score',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                if (_myScore != null && _myScore!.rank > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: _myScore!.rank <= 3
                          ? Colors.amber.withOpacity(0.2)
                          : colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Rank #${_myScore!.rank}',
                      style: theme.textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: _myScore!.rank <= 3
                            ? Colors.amber.shade700
                            : colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildScoreStat(
                  context,
                  icon: Icons.star,
                  label: 'Points',
                  value: _myScore?.totalScore ?? 0,
                  color: Colors.amber,
                ),
                _buildScoreStat(
                  context,
                  icon: Icons.check_circle,
                  label: 'Correct',
                  value: _myScore?.correctAnswers ?? 0,
                  suffix: '/${_myScore?.totalAnswers ?? 0}',
                  color: Colors.green,
                ),
                _buildScoreStat(
                  context,
                  icon: Icons.local_fire_department,
                  label: 'Streak',
                  value: _myScore?.currentStreak ?? 0,
                  color: Colors.orange,
                ),
                _buildScoreStat(
                  context,
                  icon: Icons.percent,
                  label: 'Accuracy',
                  value: _myScore?.accuracyPercent ?? 0,
                  suffix: '%',
                  color: Colors.blue,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScoreStat(
    BuildContext context, {
    required IconData icon,
    required String label,
    required int value,
    String? suffix,
    required Color color,
  }) {
    final theme = Theme.of(context);

    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 4),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedStatCounter(
              value: value,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            if (suffix != null)
              Text(
                suffix,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
          ],
        ),
        Text(
          label,
          style: theme.textTheme.labelSmall?.copyWith(
            color: theme.colorScheme.outline,
          ),
        ),
      ],
    );
  }

  Widget _buildRoundHistoryCard() {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final completedRounds = _rounds.where((r) => r.isCompleted).toList();

    return Card(
      child: Column(
        children: [
          ListTile(
            leading: Icon(Icons.history, color: colorScheme.primary),
            title: const Text('Round History'),
            trailing: IconButton(
              icon: Icon(
                _showRoundHistory
                    ? Icons.keyboard_arrow_up
                    : Icons.keyboard_arrow_down,
              ),
              onPressed: () {
                setState(() => _showRoundHistory = !_showRoundHistory);
              },
            ),
          ),
          if (_showRoundHistory)
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: completedRounds.length,
              itemBuilder: (context, index) {
                final round = completedRounds[index];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: colorScheme.surfaceContainerHighest,
                    child: Text('${round.roundNumber}'),
                  ),
                  title: Text(round.name),
                  subtitle: Text('${round.questionCount} questions'),
                  trailing: const Icon(Icons.check_circle, color: Colors.green),
                );
              },
            ),
        ],
      ),
    );
  }

  String _formatTime(DateTime time) {
    final hour = time.hour;
    final minute = time.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'PM' : 'AM';
    final hour12 = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
    return '$hour12:$minute $period';
  }
}
