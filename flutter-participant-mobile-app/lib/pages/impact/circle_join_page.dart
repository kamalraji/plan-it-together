import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/circle.dart';
import 'package:thittam1hub/supabase/circle_service.dart';
import 'package:thittam1hub/widgets/styled_widgets.dart';

/// Page for joining a circle via invite link
class CircleJoinPage extends StatefulWidget {
  final String linkCode;

  const CircleJoinPage({
    super.key,
    required this.linkCode,
  });

  @override
  State<CircleJoinPage> createState() => _CircleJoinPageState();
}

class _CircleJoinPageState extends State<CircleJoinPage> {
  final CircleService _circleService = CircleService();

  Map<String, dynamic>? _linkInfo;
  Circle? _circle;
  bool _isLoading = true;
  bool _isJoining = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadLinkInfo();
  }

  Future<void> _loadLinkInfo() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final info = await _circleService.getInviteLinkInfo(widget.linkCode);
      
      if (info == null) {
        setState(() {
          _error = 'This invite link is invalid or has expired';
          _isLoading = false;
        });
        return;
      }

      final circleData = info['circles'] as Map<String, dynamic>?;
      if (circleData != null) {
        _circle = Circle.fromMap(circleData);
      }

      setState(() {
        _linkInfo = info;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load invite: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _joinCircle() async {
    setState(() => _isJoining = true);

    try {
      final success = await _circleService.joinViaInviteLink(widget.linkCode);
      
      if (success && mounted) {
        final circleId = _linkInfo?['circle_id'] as String?;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Joined ${_circle?.name ?? 'circle'}!'),
          ),
        );
        if (circleId != null) {
          context.go('/circles/$circleId');
        } else {
          context.go('/circles');
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to join: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
        setState(() => _isJoining = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorState(cs, textTheme)
              : _buildJoinContent(cs, textTheme),
    );
  }

  Widget _buildErrorState(ColorScheme cs, TextTheme textTheme) {
    return SafeArea(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: cs.errorContainer,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.link_off,
                  size: 40,
                  color: cs.onErrorContainer,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Invalid Invite',
                style: textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                _error!,
                style: textTheme.bodyMedium?.copyWith(
                  color: cs.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              FilledButton.icon(
                onPressed: () => context.go('/circles'),
                icon: const Icon(Icons.explore),
                label: const Text('Explore Circles'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildJoinContent(ColorScheme cs, TextTheme textTheme) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            cs.primary.withValues(alpha: 0.1),
            cs.surface,
          ],
        ),
      ),
      child: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Circle icon
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: cs.surface,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: cs.shadow.withValues(alpha: 0.1),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    _circle?.icon ?? '💬',
                    style: const TextStyle(fontSize: 48),
                  ),
                ),

                const SizedBox(height: 24),

                // Circle name
                Text(
                  _circle?.name ?? 'Circle',
                  style: textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 8),

                // Member count
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.people,
                      size: 18,
                      color: cs.onSurfaceVariant,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '${_circle?.memberCount ?? 0} members',
                      style: textTheme.bodyMedium?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Description
                if (_circle?.description != null &&
                    _circle!.description!.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _circle!.description!,
                      style: textTheme.bodyMedium?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),

                const SizedBox(height: 32),

                // Tags
                if (_circle?.tags.isNotEmpty == true)
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    alignment: WrapAlignment.center,
                    children: _circle!.tags.take(5).map((tag) {
                      return Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: cs.primaryContainer,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          tag,
                          style: textTheme.labelMedium?.copyWith(
                            color: cs.onPrimaryContainer,
                          ),
                        ),
                      );
                    }).toList(),
                  ),

                const SizedBox(height: 40),

                // Join button
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _isJoining ? null : _joinCircle,
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: _isJoining
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.group_add),
                              const SizedBox(width: 8),
                              Text(
                                'Join Circle',
                                style: textTheme.titleMedium?.copyWith(
                                  color: cs.onPrimary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                  ),
                ),

                const SizedBox(height: 16),

                // Back button
                TextButton(
                  onPressed: () => context.go('/circles'),
                  child: const Text('Explore other circles'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
