import 'package:flutter/material.dart';
import '../../services/enhanced_security_service.dart';
import '../../models/security_preferences_models.dart';

/// Card showing recent failed login attempts and lockout status
class RateLimitingCard extends StatefulWidget {
  const RateLimitingCard({super.key});

  @override
  State<RateLimitingCard> createState() => _RateLimitingCardState();
}

class _RateLimitingCardState extends State<RateLimitingCard> {
  final _securityService = EnhancedSecurityService.instance;
  
  bool _isLoading = true;
  int _failedAttempts = 0;
  List<LoginAttempt> _recentAttempts = [];
  bool _isLockedOut = false;
  Duration? _lockoutRemaining;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    try {
      final failedCount = await _securityService.getRecentFailedAttempts();
      final attempts = await _securityService.getRecentLoginAttempts(limit: 5);
      
      // Check if locked out (5+ failed attempts in 24 hours)
      final isLocked = failedCount >= 5;
      Duration? remaining;
      
      if (isLocked && attempts.isNotEmpty) {
        // Find most recent failed attempt
        final lastFailed = attempts.where((a) => !a.success).firstOrNull;
        if (lastFailed != null) {
          final unlockTime = lastFailed.createdAt.add(const Duration(minutes: 30));
          if (unlockTime.isAfter(DateTime.now())) {
            remaining = unlockTime.difference(DateTime.now());
          }
        }
      }

      if (mounted) {
        setState(() {
          _failedAttempts = failedCount;
          _recentAttempts = attempts;
          _isLockedOut = isLocked && remaining != null;
          _lockoutRemaining = remaining;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (_isLoading) {
      return Card(
        child: Container(
          padding: const EdgeInsets.all(24),
          child: const Center(child: CircularProgressIndicator()),
        ),
      );
    }

    // No failed attempts - show success state
    if (_failedAttempts == 0) {
      return Card(
        child: Container(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.check_circle, color: Colors.green),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'No Failed Login Attempts',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'No suspicious activity in the last 24 hours',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Card(
      child: Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with warning
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: _isLockedOut 
                        ? cs.error.withOpacity(0.1)
                        : Colors.orange.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    _isLockedOut ? Icons.lock : Icons.warning_amber_rounded,
                    color: _isLockedOut ? cs.error : Colors.orange,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _isLockedOut 
                            ? 'Account Temporarily Locked'
                            : 'Failed Login Attempts',
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: _isLockedOut ? cs.error : null,
                        ),
                      ),
                      const SizedBox(height: 4),
                      if (_isLockedOut && _lockoutRemaining != null)
                        Text(
                          'Unlocks in ${_lockoutRemaining!.inMinutes} minutes',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: cs.error,
                          ),
                        )
                      else
                        Text(
                          '$_failedAttempts failed ${_failedAttempts == 1 ? 'attempt' : 'attempts'} in last 24 hours',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: cs.onSurfaceVariant,
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),

            if (_recentAttempts.isNotEmpty) ...[
              const SizedBox(height: 16),
              const Divider(height: 1),
              const SizedBox(height: 12),

              // Recent attempts list
              Text(
                'Recent Attempts',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: cs.onSurfaceVariant,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),

              ...(_recentAttempts.take(3).map((attempt) => _buildAttemptTile(attempt, cs))),

              if (_recentAttempts.length > 3) ...[
                const SizedBox(height: 8),
                TextButton.icon(
                  onPressed: () => _showAllAttempts(context),
                  icon: const Icon(Icons.list, size: 18),
                  label: Text('View all ${_recentAttempts.length} attempts'),
                ),
              ],
            ],

            // Security tip
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest.withOpacity(0.5),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.lightbulb_outline, size: 18, color: cs.primary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _failedAttempts >= 3
                          ? 'Consider changing your password and enabling 2FA for better security.'
                          : 'If you don\'t recognize these attempts, consider changing your password.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAttemptTile(LoginAttempt attempt, ColorScheme cs) {
    final timeAgo = _formatTimeAgo(attempt.createdAt);
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(
            attempt.success ? Icons.check_circle : Icons.cancel,
            size: 18,
            color: attempt.success ? Colors.green : cs.error,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  attempt.success ? 'Successful login' : 'Failed login',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (attempt.city != null || attempt.country != null)
                  Text(
                    [attempt.city, attempt.country].whereType<String>().join(', '),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: cs.onSurfaceVariant,
                      fontSize: 11,
                    ),
                  ),
              ],
            ),
          ),
          Text(
            timeAgo,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: cs.onSurfaceVariant,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }

  String _formatTimeAgo(DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  void _showAllAttempts(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        expand: false,
        builder: (_, controller) => _AllAttemptsSheet(
          attempts: _recentAttempts,
          scrollController: controller,
        ),
      ),
    );
  }
}

class _AllAttemptsSheet extends StatelessWidget {
  final List<LoginAttempt> attempts;
  final ScrollController scrollController;

  const _AllAttemptsSheet({
    required this.attempts,
    required this.scrollController,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Handle
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: cs.outline.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              children: [
                Icon(Icons.history, color: cs.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Login Attempts',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          const Divider(),

          // Attempts list
          Expanded(
            child: ListView.separated(
              controller: scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: attempts.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (ctx, index) {
                final attempt = attempts[index];
                return _buildDetailedAttemptTile(ctx, attempt, cs);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailedAttemptTile(BuildContext context, LoginAttempt attempt, ColorScheme cs) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: attempt.success 
              ? Colors.green.withOpacity(0.1) 
              : cs.error.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          attempt.success ? Icons.check_circle : Icons.cancel,
          color: attempt.success ? Colors.green : cs.error,
        ),
      ),
      title: Text(
        attempt.success ? 'Successful Login' : 'Failed Login',
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
          fontWeight: FontWeight.w600,
        ),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (attempt.city != null || attempt.country != null)
            Text(
              [attempt.city, attempt.country].whereType<String>().join(', '),
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: cs.onSurfaceVariant,
              ),
            ),
          Text(
            _formatDateTime(attempt.createdAt),
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
        ],
      ),
      trailing: attempt.ipAddressHash != null
          ? Tooltip(
              message: 'IP: ${attempt.ipAddressHash!.substring(0, 8)}...',
              child: Icon(Icons.info_outline, size: 18, color: cs.onSurfaceVariant),
            )
          : null,
    );
  }

  String _formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);
    
    if (diff.inDays == 0) {
      return 'Today at ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    } else if (diff.inDays == 1) {
      return 'Yesterday at ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    } else {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    }
  }
}
