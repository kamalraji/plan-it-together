import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:thittam1hub/models/circle.dart';
import 'package:thittam1hub/models/circle_invite_link.dart';
import 'package:thittam1hub/supabase/circle_service.dart';
import 'package:thittam1hub/widgets/qr_code_display.dart';

/// Bottom sheet for Circle invite management
class CircleInviteSheet extends StatefulWidget {
  final String circleId;
  final Circle? circle;
  final CircleInviteLink? inviteLink;
  final Function(CircleInviteLink)? onInviteLinkGenerated;

  const CircleInviteSheet({
    super.key,
    required this.circleId,
    this.circle,
    this.inviteLink,
    this.onInviteLinkGenerated,
  });

  @override
  State<CircleInviteSheet> createState() => _CircleInviteSheetState();
}

class _CircleInviteSheetState extends State<CircleInviteSheet> {
  final CircleService _circleService = CircleService();
  CircleInviteLink? _inviteLink;
  bool _isLoading = false;
  bool _showQr = false;

  @override
  void initState() {
    super.initState();
    _inviteLink = widget.inviteLink;
    if (_inviteLink == null) {
      _generateInviteLink();
    }
  }

  Future<void> _generateInviteLink() async {
    setState(() => _isLoading = true);

    try {
      final link = await _circleService.getOrCreateInviteLink(widget.circleId);
      setState(() {
        _inviteLink = link;
        _isLoading = false;
      });
      if (link != null) {
        widget.onInviteLinkGenerated?.call(link);
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _revokeAndRegenerate() async {
    if (_inviteLink == null) return;

    setState(() => _isLoading = true);

    try {
      // Use the combined revoke and create method
      final newLink = await _circleService.revokeAndCreateInviteLink(widget.circleId);
      setState(() {
        _inviteLink = newLink;
        _isLoading = false;
      });
      if (newLink != null) {
        widget.onInviteLinkGenerated?.call(newLink);
      }
    } catch (e) {
      setState(() => _isLoading = false);
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

    final circleName = widget.circle?.name ?? 'our Circle';
    Share.share(
      'Join $circleName on Thittam1Hub!\n${_inviteLink!.fullUrl}',
      subject: 'Join $circleName',
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final bottomPadding = MediaQuery.of(context).viewPadding.bottom;

    return Container(
      padding: EdgeInsets.fromLTRB(24, 16, 24, bottomPadding + 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Handle bar
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: colorScheme.onSurfaceVariant.withOpacity(0.4),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Title
          Row(
            children: [
              if (widget.circle != null)
                Text(
                  widget.circle!.icon,
                  style: const TextStyle(fontSize: 28),
                ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Invite to ${widget.circle?.name ?? 'Circle'}',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      'Share this link to invite people',
                      style: TextStyle(
                        color: colorScheme.onSurfaceVariant,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // QR Code / Link toggle
          if (_showQr && _inviteLink != null)
            Column(
              children: [
                Center(
                  child: QrCodeDisplay(
                    data: _inviteLink!.fullUrl,
                    size: 200,
                    caption: _inviteLink!.displayCode,
                  ),
                ),
                const SizedBox(height: 16),
                TextButton.icon(
                  onPressed: () => setState(() => _showQr = false),
                  icon: const Icon(Icons.link),
                  label: const Text('Show Link'),
                ),
              ],
            )
          else
            Column(
              children: [
                // Link display
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: colorScheme.outline.withOpacity(0.2),
                    ),
                  ),
                  child: _isLoading
                      ? const Center(
                          child: SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        )
                      : _inviteLink != null
                          ? Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        _inviteLink!.fullUrl,
                                        style: TextStyle(
                                          color: colorScheme.primary,
                                          fontWeight: FontWeight.w500,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.copy, size: 20),
                                      onPressed: _copyLink,
                                      tooltip: 'Copy link',
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _inviteLink!.expiryStatus,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: colorScheme.onSurfaceVariant,
                                  ),
                                ),
                              ],
                            )
                          : Text(
                              'Failed to generate link',
                              style: TextStyle(color: colorScheme.error),
                            ),
                ),
                const SizedBox(height: 12),

                // QR toggle
                if (_inviteLink != null)
                  TextButton.icon(
                    onPressed: () => setState(() => _showQr = true),
                    icon: const Icon(Icons.qr_code),
                    label: const Text('Show QR Code'),
                  ),
              ],
            ),

          const SizedBox(height: 24),

          // Actions
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _isLoading ? null : _revokeAndRegenerate,
                  icon: const Icon(Icons.refresh, size: 18),
                  label: const Text('Reset Link'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton.icon(
                  onPressed: _inviteLink != null ? _shareLink : null,
                  icon: const Icon(Icons.share, size: 18),
                  label: const Text('Share'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
