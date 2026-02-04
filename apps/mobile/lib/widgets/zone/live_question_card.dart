import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../models/competition_models.dart';

/// Live quiz question card with countdown timer and answer options
class LiveQuestionCard extends StatefulWidget {
  final CompetitionQuestion question;
  final CompetitionResponse? existingResponse;
  final void Function(int selectedOption, int responseTimeMs) onSubmit;
  final VoidCallback? onTimeExpired;

  const LiveQuestionCard({
    super.key,
    required this.question,
    this.existingResponse,
    required this.onSubmit,
    this.onTimeExpired,
  });

  @override
  State<LiveQuestionCard> createState() => _LiveQuestionCardState();
}

class _LiveQuestionCardState extends State<LiveQuestionCard>
    with TickerProviderStateMixin {
  int? _selectedOption;
  bool _hasSubmitted = false;
  Timer? _countdownTimer;
  int _remainingSeconds = 0;
  DateTime? _questionStartTime;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _hasSubmitted = widget.existingResponse != null;
    _selectedOption = widget.existingResponse?.selectedOption;
    _questionStartTime = DateTime.now();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.1).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    if (widget.question.hasTimeLimit && !_hasSubmitted) {
      _startCountdown();
    }
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  void _startCountdown() {
    _remainingSeconds = widget.question.remainingSeconds;
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        _remainingSeconds--;
      });

      // Haptic feedback at key moments
      if (_remainingSeconds <= 5 && _remainingSeconds > 0) {
        HapticFeedback.lightImpact();
        _pulseController.forward().then((_) => _pulseController.reverse());
      }

      if (_remainingSeconds <= 0) {
        timer.cancel();
        if (!_hasSubmitted) {
          widget.onTimeExpired?.call();
        }
      }
    });
  }

  void _handleOptionSelect(int index) {
    if (_hasSubmitted) return;
    HapticFeedback.selectionClick();
    setState(() {
      _selectedOption = index;
    });
  }

  void _handleSubmit() {
    if (_selectedOption == null || _hasSubmitted) return;

    final responseTimeMs = _questionStartTime != null
        ? DateTime.now().difference(_questionStartTime!).inMilliseconds
        : 0;

    setState(() {
      _hasSubmitted = true;
    });

    HapticFeedback.mediumImpact();
    widget.onSubmit(_selectedOption!, responseTimeMs);
  }

  Color _getTimerColor() {
    if (_remainingSeconds > 10) return Colors.green;
    if (_remainingSeconds > 5) return Colors.orange;
    return Colors.red;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              colorScheme.surface,
              colorScheme.surface.withOpacity(0.95),
            ],
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with question number and timer
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.quiz,
                          size: 16,
                          color: colorScheme.onPrimaryContainer,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Question ${widget.question.questionNumber}',
                          style: theme.textTheme.labelMedium?.copyWith(
                            color: colorScheme.onPrimaryContainer,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (widget.question.hasTimeLimit && !_hasSubmitted)
                    ScaleTransition(
                      scale: _pulseAnimation,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: _getTimerColor().withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: _getTimerColor(),
                            width: 2,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.timer,
                              size: 16,
                              color: _getTimerColor(),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${_remainingSeconds}s',
                              style: theme.textTheme.labelMedium?.copyWith(
                                color: _getTimerColor(),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.amber.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.star, size: 14, color: Colors.amber),
                        const SizedBox(width: 4),
                        Text(
                          '${widget.question.points} pts',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: Colors.amber.shade700,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // Question text
              Text(
                widget.question.question,
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                  height: 1.3,
                ),
              ),

              const SizedBox(height: 24),

              // Answer options
              ...List.generate(
                widget.question.options.length,
                (index) => _buildOptionTile(index, theme, colorScheme),
              ),

              const SizedBox(height: 20),

              // Submit button
              if (!_hasSubmitted)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _selectedOption != null ? _handleSubmit : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: colorScheme.primary,
                      foregroundColor: colorScheme.onPrimary,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Submit Answer',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),

              // Submitted state
              if (_hasSubmitted)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: colorScheme.secondaryContainer.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: colorScheme.secondary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Answer submitted! Waiting for results...',
                        style: TextStyle(
                          color: colorScheme.onSecondaryContainer,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOptionTile(int index, ThemeData theme, ColorScheme colorScheme) {
    final isSelected = _selectedOption == index;
    final option = widget.question.options[index];
    final letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    final letter = index < letters.length ? letters[index] : '${index + 1}';

    // Show correct/incorrect after question is closed
    final showResult = widget.question.isClosed;
    final isCorrect = widget.question.correctOptionIndex == index;
    final wasMyAnswer = widget.existingResponse?.selectedOption == index;

    Color? backgroundColor;
    Color? borderColor;

    if (showResult) {
      if (isCorrect) {
        backgroundColor = Colors.green.withOpacity(0.2);
        borderColor = Colors.green;
      } else if (wasMyAnswer && !isCorrect) {
        backgroundColor = Colors.red.withOpacity(0.2);
        borderColor = Colors.red;
      }
    } else if (isSelected) {
      backgroundColor = colorScheme.primaryContainer;
      borderColor = colorScheme.primary;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: _hasSubmitted ? null : () => _handleOptionSelect(index),
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: backgroundColor ?? colorScheme.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: borderColor ?? colorScheme.outlineVariant,
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: isSelected
                          ? colorScheme.primary
                          : colorScheme.surfaceContainerHighest,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        letter,
                        style: TextStyle(
                          color: isSelected
                              ? colorScheme.onPrimary
                              : colorScheme.onSurfaceVariant,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      option,
                      style: theme.textTheme.bodyLarge?.copyWith(
                        fontWeight: isSelected ? FontWeight.w600 : null,
                      ),
                    ),
                  ),
                  if (showResult && isCorrect)
                    const Icon(Icons.check_circle, color: Colors.green),
                  if (showResult && wasMyAnswer && !isCorrect)
                    const Icon(Icons.cancel, color: Colors.red),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
