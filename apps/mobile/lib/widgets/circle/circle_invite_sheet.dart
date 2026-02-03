import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:thittam1hub/models/circle.dart';
import 'package:thittam1hub/models/circle_invite_link.dart';
import 'package:thittam1hub/models/circle_invitation.dart';
import 'package:thittam1hub/supabase/circle_service.dart';
import 'package:thittam1hub/widgets/circle/circle_qr_code.dart';
import 'package:thittam1hub/widgets/circle/user_invite_search.dart';
import 'package:thittam1hub/widgets/circle/pending_invitations_list.dart';
import 'package:thittam1hub/widgets/styled_avatar.dart';

/// Bottom sheet for managing Circle invitations
class CircleInviteSheet extends StatefulWidget {
  final Circle circle;
  final bool isAdmin;

  const CircleInviteSheet({
    super.key,
    required this.circle,
    this.isAdmin = false,
  });

  static Future<void> show(BuildContext context, Circle circle, {bool isAdmin = false}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CircleInviteSheet(circle: circle, isAdmin: isAdmin),
    );
  }

  @override
  State<CircleInviteSheet> createState() => _CircleInviteSheetState();
}

class _CircleInviteSheetState extends State<CircleInviteSheet>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final CircleService _circleService = CircleService();

  CircleInviteLink? _inviteLink;
  List<CircleInvitation> _pendingInvitations = [];
  bool _isLoadingLink = true;
  bool _isLoadingInvitations = true;
  bool _isGeneratingNewLink = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadInviteLink();
    _loadPendingInvitations();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadInviteLink() async {
    setState(() => _isLoadingLink = true);
    final link = await _circleService.getOrCreateInviteLink(widget.circle.id);
    if (mounted) {
      setState(() {
        _inviteLink = link;
        _isLoadingLink = false;
      });
    }
  }

  Future<void> _loadPendingInvitations() async {
    setState(() => _isLoadingInvitations = true);
    final invitations = await _circleService.getPendingInvitations(widget.circle.id);
    if (mounted) {
      setState(() {
        _pendingInvitations = invitations;
        _isLoadingInvitations = false;
      });
    }
  }

  Future<void> _regenerateLink() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Regenerate Link?'),
        content: const Text(
          'This will invalidate the current invite link. Anyone with the old link will no longer be able to join.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Regenerate'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isGeneratingNewLink = true);
    final newLink = await _circleService.revokeAndCreateInviteLink(widget.circle.id);
    if (mounted) {
      setState(() {
        _inviteLink = newLink;
        _isGeneratingNewLink = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('New invite link generated')),
      );
    }
  }

  void _copyLink() {
    if (_inviteLink == null) return;
    Clipboard.setData(ClipboardData(text: _inviteLink!.fullUrl));
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Link copied to clipboard'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _shareLink() {
    if (_inviteLink == null) return;
    Share.share(
      'Join "${widget.circle.name}" on Thittam1Hub!\n\n${_inviteLink!.fullUrl}',
      subject: 'Join ${widget.circle.name}',
    );
  }

  void _showQrCode() {
    if (_inviteLink == null) return;
    showDialog(
      context: context,
      builder: (context) => CircleQrCodeDialog(
        circle: widget.circle,
        inviteLink: _inviteLink!,
      ),
    );
  }

  Future<void> _inviteUser(String userId) async {
    final result = await _circleService.inviteUser(widget.circle.id, userId);
    if (result != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invitation sent')),
      );
      _loadPendingInvitations();
    }
  }

  Future<void> _cancelInvitation(CircleInvitation invitation) async {
    await _circleService.cancelInvitation(invitation.id);
    if (mounted) {
      _loadPendingInvitations();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invitation cancelled')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: BoxDecoration(
            color: cs.surface.withValues(alpha: 0.95),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Handle
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: cs.outline.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              // Header
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: cs.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        widget.circle.icon,
                        style: const TextStyle(fontSize: 24),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Invite to ${widget.circle.name}',
                            style: textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            '${widget.circle.memberCount} members',
                            style: textTheme.bodySmall?.copyWith(
                              color: cs.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),

              // Tab bar
              TabBar(
                controller: _tabController,
                labelColor: cs.primary,
                unselectedLabelColor: cs.onSurfaceVariant,
                indicatorColor: cs.primary,
                tabs: const [
                  Tab(text: 'Link', icon: Icon(Icons.link, size: 20)),
                  Tab(text: 'Invite', icon: Icon(Icons.person_add, size: 20)),
                  Tab(text: 'Pending', icon: Icon(Icons.pending, size: 20)),
                ],
              ),

              // Tab content
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildLinkTab(cs, textTheme),
                    _buildInviteTab(cs, textTheme),
                    _buildPendingTab(cs, textTheme),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLinkTab(ColorScheme cs, TextTheme textTheme) {
    if (_isLoadingLink) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_inviteLink == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.link_off, size: 48, color: cs.onSurfaceVariant),
            const SizedBox(height: 16),
            Text(
              'Unable to generate invite link',
              style: textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: _loadInviteLink,
              child: const Text('Try Again'),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Link card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  cs.primaryContainer,
                  cs.primaryContainer.withValues(alpha: 0.7),
                ],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.link,
                  size: 40,
                  color: cs.onPrimaryContainer,
                ),
                const SizedBox(height: 12),
                Text(
                  'Share Invite Link',
                  style: textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: cs.onPrimaryContainer,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: cs.surface,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          _inviteLink!.fullUrl,
                          style: textTheme.bodySmall?.copyWith(
                            fontFamily: 'monospace',
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.copy, size: 20),
                        onPressed: _copyLink,
                        visualDensity: VisualDensity.compact,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: _shareLink,
                        icon: const Icon(Icons.share, size: 18),
                        label: const Text('Share'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _showQrCode,
                        icon: const Icon(Icons.qr_code, size: 18),
                        label: const Text('QR Code'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Link info
          _LinkInfoRow(
            icon: Icons.people,
            label: 'Uses',
            value: _inviteLink!.maxUses != null
                ? '${_inviteLink!.useCount} / ${_inviteLink!.maxUses}'
                : '${_inviteLink!.useCount} (unlimited)',
          ),
          _LinkInfoRow(
            icon: Icons.schedule,
            label: 'Expires',
            value: _inviteLink!.expiryStatus,
          ),
          _LinkInfoRow(
            icon: _inviteLink!.isValid ? Icons.check_circle : Icons.error,
            label: 'Status',
            value: _inviteLink!.isValid ? 'Active' : 'Expired',
            valueColor: _inviteLink!.isValid ? Colors.green : cs.error,
          ),

          const SizedBox(height: 24),

          // Regenerate button
          if (widget.isAdmin)
            OutlinedButton.icon(
              onPressed: _isGeneratingNewLink ? null : _regenerateLink,
              icon: _isGeneratingNewLink
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.refresh),
              label: const Text('Generate New Link'),
              style: OutlinedButton.styleFrom(
                foregroundColor: cs.error,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildInviteTab(ColorScheme cs, TextTheme textTheme) {
    return UserInviteSearch(
      circleId: widget.circle.id,
      onInvite: _inviteUser,
    );
  }

  Widget _buildPendingTab(ColorScheme cs, TextTheme textTheme) {
    if (_isLoadingInvitations) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_pendingInvitations.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.mail_outline,
              size: 48,
              color: cs.onSurfaceVariant,
            ),
            const SizedBox(height: 16),
            Text(
              'No pending invitations',
              style: textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Invite users from the Invite tab',
              style: textTheme.bodyMedium?.copyWith(
                color: cs.onSurfaceVariant,
              ),
            ),
          ],
        ),
      );
    }

    return PendingInvitationsList(
      invitations: _pendingInvitations,
      onCancel: _cancelInvitation,
      onRefresh: _loadPendingInvitations,
    );
  }
}

/// Info row for link details
class _LinkInfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  const _LinkInfoRow({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: cs.onSurfaceVariant),
          const SizedBox(width: 12),
          Text(
            label,
            style: textTheme.bodyMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
          const Spacer(),
          Text(
            value,
            style: textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: valueColor,
            ),
          ),
        ],
      ),
    );
  }
}
