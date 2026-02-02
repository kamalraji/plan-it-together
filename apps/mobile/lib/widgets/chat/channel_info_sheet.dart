import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';

/// Bottom sheet displaying channel details and participant list.
/// Provides channel info, member list, and channel settings access.
class ChannelInfoSheet extends StatefulWidget {
  final String channelId;
  final String channelName;
  final String? description;
  final String channelType;
  final bool isParticipantChannel;
  final VoidCallback? onLeaveChannel;
  final VoidCallback? onMuteChannel;

  const ChannelInfoSheet({
    super.key,
    required this.channelId,
    required this.channelName,
    this.description,
    required this.channelType,
    this.isParticipantChannel = false,
    this.onLeaveChannel,
    this.onMuteChannel,
  });

  @override
  State<ChannelInfoSheet> createState() => _ChannelInfoSheetState();
}

class _ChannelInfoSheetState extends State<ChannelInfoSheet> {
  List<Map<String, dynamic>> _members = [];
  bool _isLoading = true;
  int _memberCount = 0;

  @override
  void initState() {
    super.initState();
    _loadMembers();
  }

  Future<void> _loadMembers() async {
    try {
      final response = await SupabaseConfig.client
          .from('channel_members')
          .select('user_id, user_name, joined_at, is_muted')
          .eq('channel_id', widget.channelId)
          .order('joined_at', ascending: true)
          .limit(50);

      if (mounted) {
        setState(() {
          _members = List<Map<String, dynamic>>.from(response);
          _memberCount = _members.length;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  IconData _getChannelIcon() {
    switch (widget.channelType) {
      case 'announcement':
        return Icons.campaign_outlined;
      case 'private':
        return Icons.lock_outlined;
      case 'task':
        return Icons.task_alt_outlined;
      default:
        return Icons.tag;
    }
  }

  Color _getChannelColor(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    switch (widget.channelType) {
      case 'announcement':
        return Colors.orange;
      case 'private':
        return Colors.purple;
      case 'task':
        return Colors.green;
      default:
        return colorScheme.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.9,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: colorScheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Drag handle
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: colorScheme.onSurfaceVariant.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              // Channel header
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _getChannelColor(context).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        _getChannelIcon(),
                        color: _getChannelColor(context),
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '#${widget.channelName}',
                            style: theme.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if (widget.description != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              widget.description!,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: colorScheme.onSurfaceVariant,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Stats row
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    _StatChip(
                      icon: Icons.people_outline,
                      label: '$_memberCount members',
                    ),
                    const SizedBox(width: 8),
                    _StatChip(
                      icon: Icons.label_outline,
                      label: widget.channelType,
                    ),
                    if (widget.isParticipantChannel) ...[
                      const SizedBox(width: 8),
                      _StatChip(
                        icon: Icons.public,
                        label: 'Participant',
                        color: Colors.green,
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 16),
              const Divider(height: 1),

              // Actions
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    if (widget.onMuteChannel != null)
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: widget.onMuteChannel,
                          icon: const Icon(Icons.notifications_off_outlined, size: 18),
                          label: const Text('Mute'),
                        ),
                      ),
                    if (widget.onMuteChannel != null && widget.onLeaveChannel != null)
                      const SizedBox(width: 12),
                    if (widget.onLeaveChannel != null)
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: widget.onLeaveChannel,
                          icon: const Icon(Icons.logout, size: 18),
                          label: const Text('Leave'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: colorScheme.error,
                          ),
                        ),
                      ),
                  ],
                ),
              ),

              const Divider(height: 1),

              // Members list header
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(
                      Icons.people_outline,
                      size: 20,
                      color: colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Members',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '$_memberCount',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),

              // Members list
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _members.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.people_outline,
                                  size: 48,
                                  color: colorScheme.onSurfaceVariant.withOpacity(0.5),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'No members yet',
                                  style: theme.textTheme.bodyLarge?.copyWith(
                                    color: colorScheme.onSurfaceVariant,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            controller: scrollController,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _members.length,
                            itemBuilder: (context, index) {
                              final member = _members[index];
                              return _MemberTile(
                                name: member['user_name'] ?? 'Unknown',
                                userId: member['user_id'],
                                joinedAt: member['joined_at'],
                                isMuted: member['is_muted'] == true,
                              );
                            },
                          ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _StatChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? color;

  const _StatChip({
    required this.icon,
    required this.label,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final chipColor = color ?? colorScheme.primary;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: chipColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: chipColor),
          const SizedBox(width: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: chipColor,
                  fontWeight: FontWeight.w500,
                ),
          ),
        ],
      ),
    );
  }
}

class _MemberTile extends StatelessWidget {
  final String name;
  final String userId;
  final String? joinedAt;
  final bool isMuted;

  const _MemberTile({
    required this.name,
    required this.userId,
    this.joinedAt,
    this.isMuted = false,
  });

  String _getInitials() {
    final parts = name.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: CircleAvatar(
        backgroundColor: colorScheme.primaryContainer,
        child: Text(
          _getInitials(),
          style: TextStyle(
            color: colorScheme.onPrimaryContainer,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      title: Row(
        children: [
          Text(
            name,
            style: theme.textTheme.bodyLarge?.copyWith(
              fontWeight: FontWeight.w500,
            ),
          ),
          if (isMuted) ...[
            const SizedBox(width: 8),
            Icon(
              Icons.notifications_off,
              size: 14,
              color: colorScheme.onSurfaceVariant,
            ),
          ],
        ],
      ),
      subtitle: joinedAt != null
          ? Text(
              'Joined ${_formatDate(joinedAt!)}',
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            )
          : null,
      trailing: IconButton(
        icon: const Icon(Icons.more_vert, size: 20),
        onPressed: () {
          // TODO: Show member actions menu
        },
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inDays == 0) {
        return 'today';
      } else if (diff.inDays == 1) {
        return 'yesterday';
      } else if (diff.inDays < 7) {
        return '${diff.inDays} days ago';
      } else {
        return '${date.day}/${date.month}/${date.year}';
      }
    } catch (e) {
      return 'recently';
    }
  }
}
