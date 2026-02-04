import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/nav.dart';
import 'package:intl/intl.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/confetti_overlay.dart';

/// Full-screen success celebration after registration
class RegistrationSuccessScreen extends StatefulWidget {
  final Event event;
  final Registration registration;
  final String ticketType;
  final int quantity;
  final String attendeeEmail;

  const RegistrationSuccessScreen({
    super.key,
    required this.event,
    required this.registration,
    required this.ticketType,
    required this.quantity,
    required this.attendeeEmail,
  });

  @override
  State<RegistrationSuccessScreen> createState() =>
      _RegistrationSuccessScreenState();
}

class _RegistrationSuccessScreenState extends State<RegistrationSuccessScreen>
    with TickerProviderStateMixin {
  late final AnimationController _checkController;
  late final AnimationController _contentController;
  late final Animation<double> _checkAnimation;
  late final Animation<double> _scaleAnimation;
  late final Animation<double> _fadeAnimation;

  bool _showConfetti = true;

  @override
  void initState() {
    super.initState();
    HapticFeedback.heavyImpact();

    _checkController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _contentController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _checkAnimation = CurvedAnimation(
      parent: _checkController,
      curve: Curves.elasticOut,
    );

    _scaleAnimation = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(
        parent: _contentController,
        curve: Curves.easeOutBack,
      ),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _contentController,
        curve: const Interval(0.3, 1.0, curve: Curves.easeOut),
      ),
    );

    // Start animations
    _checkController.forward();
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) _contentController.forward();
    });

    // Hide confetti after a delay
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) setState(() => _showConfetti = false);
    });
  }

  @override
  void dispose() {
    _checkController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dateFormat = DateFormat('EEE, MMM d, yyyy');
    final timeFormat = DateFormat('h:mm a');

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          context.go(AppRoutes.home);
        }
      },
      child: Scaffold(
        body: Stack(
          children: [
            // Background gradient
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    theme.colorScheme.primary.withOpacity(0.1),
                    theme.colorScheme.surface,
                  ],
                ),
              ),
            ),

            // Main content
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    const Spacer(),

                    // Success checkmark
                    ScaleTransition(
                      scale: _checkAnimation,
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.success.withOpacity(0.1),
                        ),
                        child: Container(
                          margin: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.success.withOpacity(0.2),
                          ),
                          child: Container(
                            margin: const EdgeInsets.all(8),
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppColors.success,
                            ),
                            child: const Icon(
                              Icons.check,
                              color: Colors.white,
                              size: 48,
                            ),
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Success text
                    ScaleTransition(
                      scale: _scaleAnimation,
                      child: Column(
                        children: [
                          Text(
                            "You're registered!",
                            style: theme.textTheme.headlineMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Get ready for an amazing experience',
                            style: theme.textTheme.bodyLarge?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Event summary card
                    FadeTransition(
                      opacity: _fadeAnimation,
                      child: Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surfaceContainerHighest
                              .withOpacity(0.5),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: theme.colorScheme.outline.withOpacity(0.2),
                          ),
                        ),
                        child: Column(
                          children: [
                            Text(
                              widget.event.name,
                              style: theme.textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.calendar_today,
                                  size: 16,
                                  color: theme.colorScheme.primary,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  '${dateFormat.format(widget.event.startDate)} • ${timeFormat.format(widget.event.startDate)}',
                                  style: theme.textTheme.bodyMedium,
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.confirmation_number,
                                  size: 16,
                                  color: theme.colorScheme.primary,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  '${widget.quantity} × ${widget.ticketType}',
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: theme.colorScheme.primaryContainer,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.email_outlined,
                                    size: 16,
                                    color: theme.colorScheme.primary,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Confirmation sent to ${widget.attendeeEmail}',
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: theme.colorScheme.primary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const Spacer(),

                    // Action buttons
                    FadeTransition(
                      opacity: _fadeAnimation,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // View ticket button
                          FilledButton.icon(
                            onPressed: () {
                              HapticFeedback.mediumImpact();
                              context.push(
                                '/profile/tickets/${widget.registration.id}',
                              );
                            },
                            icon: const Icon(Icons.confirmation_number),
                            label: const Text('View My Ticket'),
                            style: FilledButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),

                          const SizedBox(height: 12),

                          // Add to calendar button - use the UserTicket version
                          OutlinedButton.icon(
                            onPressed: () {
                              // Simple calendar functionality - can be enhanced
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Add to calendar from your ticket')),
                              );
                            },
                            icon: const Icon(Icons.calendar_month_outlined, size: 18),
                            label: const Text('Add to Calendar'),
                            style: OutlinedButton.styleFrom(
                              minimumSize: const Size.fromHeight(44),
                            ),
                          ),

                          const SizedBox(height: 24),

                          // Back to event
                          TextButton(
                            onPressed: () {
                              context.pop();
                            },
                            child: const Text('Back to Event'),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Confetti overlay
            if (_showConfetti)
              Positioned.fill(
                child: IgnorePointer(
                  child: ConfettiOverlay(isPlaying: _showConfetti),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
