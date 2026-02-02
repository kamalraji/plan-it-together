import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/circle_invitation.dart';
import 'package:thittam1hub/supabase/circle_service.dart';
import 'package:thittam1hub/widgets/circle/pending_invitations_list.dart';
import 'package:thittam1hub/widgets/styled_widgets.dart';

/// Page showing the current user's incoming Circle invitations
class MyCircleInvitationsPage extends StatefulWidget {
  const MyCircleInvitationsPage({super.key});

  @override
  State<MyCircleInvitationsPage> createState() => _MyCircleInvitationsPageState();
}

class _MyCircleInvitationsPageState extends State<MyCircleInvitationsPage> {
  final CircleService _circleService = CircleService();

  List<CircleInvitation> _invitations = [];
  bool _isLoading = true;
  Set<String> _loadingIds = {};

  @override
  void initState() {
    super.initState();
    _loadInvitations();
  }

  Future<void> _loadInvitations() async {
    setState(() => _isLoading = true);
    final invitations = await _circleService.getMyInvitations();
    if (mounted) {
      setState(() {
        _invitations = invitations;
        _isLoading = false;
      });
    }
  }

  Future<void> _acceptInvitation(CircleInvitation invitation) async {
    setState(() => _loadingIds.add(invitation.id));

    try {
      final success = await _circleService.respondToInvitation(
        invitation.id,
        accept: true,
      );

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Joined ${invitation.circleName ?? 'circle'}!'),
            action: SnackBarAction(
              label: 'View',
              onPressed: () => context.push('/circles/${invitation.circleId}'),
            ),
          ),
        );
        _loadInvitations();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to accept: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _loadingIds.remove(invitation.id));
      }
    }
  }

  Future<void> _declineInvitation(CircleInvitation invitation) async {
    setState(() => _loadingIds.add(invitation.id));

    try {
      await _circleService.respondToInvitation(
        invitation.id,
        accept: false,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Invitation declined')),
        );
        _loadInvitations();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to decline: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _loadingIds.remove(invitation.id));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Circle Invitations'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadInvitations,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _invitations.isEmpty
              ? _buildEmptyState(cs, textTheme)
              : RefreshIndicator(
                  onRefresh: _loadInvitations,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _invitations.length,
                    itemBuilder: (context, index) {
                      final invitation = _invitations[index];
                      return IncomingInvitationCard(
                        invitation: invitation,
                        isLoading: _loadingIds.contains(invitation.id),
                        onAccept: () => _acceptInvitation(invitation),
                        onDecline: () => _declineInvitation(invitation),
                      );
                    },
                  ),
                ),
    );
  }

  Widget _buildEmptyState(ColorScheme cs, TextTheme textTheme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.mail_outline,
                size: 40,
                color: cs.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'No invitations',
              style: textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'When someone invites you to join a circle, it will appear here',
              style: textTheme.bodyMedium?.copyWith(
                color: cs.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: () => context.push('/circles'),
              icon: const Icon(Icons.explore),
              label: const Text('Explore Circles'),
            ),
          ],
        ),
      ),
    );
  }
}
