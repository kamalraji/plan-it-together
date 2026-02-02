import 'package:flutter/material.dart';
import 'package:thittam1hub/models/circle.dart';
import 'package:thittam1hub/supabase/circle_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/widgets/styled_avatar.dart';
import 'package:thittam1hub/widgets/circle/circle_shimmer.dart';

/// Full member list for a Circle
class CircleMembersPage extends StatefulWidget {
  final String circleId;
  final Circle? circle;

  const CircleMembersPage({
    super.key,
    required this.circleId,
    this.circle,
  });

  @override
  State<CircleMembersPage> createState() => _CircleMembersPageState();
}

class _CircleMembersPageState extends State<CircleMembersPage> {
  final CircleService _circleService = CircleService();
  final TextEditingController _searchController = TextEditingController();

  List<CircleMember> _members = [];
  List<CircleMember> _filteredMembers = [];
  bool _isLoading = true;
  String? _currentUserRole;

  @override
  void initState() {
    super.initState();
    _loadMembers();
    _searchController.addListener(_filterMembers);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadMembers() async {
    setState(() => _isLoading = true);

    try {
      final members = await _circleService.getCircleMembers(widget.circleId);
      _currentUserRole = await _circleService.getUserRole(widget.circleId);

      // Sort by role: ADMIN > MODERATOR > MEMBER
      members.sort((a, b) {
        final roleOrder = {'ADMIN': 0, 'MODERATOR': 1, 'MEMBER': 2};
        final aOrder = roleOrder[a.role] ?? 3;
        final bOrder = roleOrder[b.role] ?? 3;
        if (aOrder != bOrder) return aOrder.compareTo(bOrder);
        return a.joinedAt.compareTo(b.joinedAt);
      });

      setState(() {
        _members = members;
        _filteredMembers = members;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _filterMembers() {
    final query = _searchController.text.toLowerCase();
    if (query.isEmpty) {
      setState(() => _filteredMembers = _members);
      return;
    }

    setState(() {
      _filteredMembers = _members.where((m) {
        // TODO: Filter by member name when available
        return m.userId.toLowerCase().contains(query);
      }).toList();
    });
  }

  bool get _isAdmin => _currentUserRole == 'ADMIN';
  bool get _isModerator => _currentUserRole == 'MODERATOR';
  bool get _canManageMembers => _isAdmin || _isModerator;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.circle?.name ?? 'Members'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search members...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: colorScheme.surfaceContainerHighest,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16),
              ),
            ),
          ),
        ),
      ),
      body: _isLoading
          ? const CircleMembersShimmer()
          : _filteredMembers.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.people_outline,
                        size: 64,
                        color: colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _searchController.text.isNotEmpty
                            ? 'No members found'
                            : 'No members yet',
                        style: TextStyle(color: colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadMembers,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: _filteredMembers.length,
                    itemBuilder: (context, index) {
                      final member = _filteredMembers[index];
                      return _MemberTile(
                        member: member,
                        canManage: _canManageMembers && member.role != 'ADMIN',
                        isCurrentUser: member.userId == SupabaseConfig.client.auth.currentUser?.id,
                        onRoleChange: (newRole) => _changeMemberRole(member, newRole),
                        onRemove: () => _removeMember(member),
                      );
                    },
                  ),
                ),
    );
  }

  Future<void> _changeMemberRole(CircleMember member, String newRole) async {
    try {
      await _circleService.updateMemberRole(
        circleId: widget.circleId,
        targetUserId: member.userId,
        newRole: newRole,
      );
      await _loadMembers();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Role updated to $newRole')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to update role')),
        );
      }
    }
  }

  Future<void> _removeMember(CircleMember member) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Member?'),
        content: const Text('Are you sure you want to remove this member?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _circleService.removeMember(
          circleId: widget.circleId,
          targetUserId: member.userId,
        );
        await _loadMembers();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Member removed')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to remove member')),
          );
        }
      }
    }
  }
}

class _MemberTile extends StatelessWidget {
  final CircleMember member;
  final bool canManage;
  final bool isCurrentUser;
  final Function(String) onRoleChange;
  final VoidCallback onRemove;

  const _MemberTile({
    required this.member,
    required this.canManage,
    required this.isCurrentUser,
    required this.onRoleChange,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return ListTile(
      leading: StyledAvatar(
        size: 44,
        name: isCurrentUser ? 'You' : 'Member',
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              isCurrentUser ? 'You' : 'Member',
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (member.role != 'MEMBER')
            Container(
              margin: const EdgeInsets.only(left: 8),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: member.role == 'ADMIN'
                    ? colorScheme.primaryContainer
                    : colorScheme.secondaryContainer,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                member.role,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: member.role == 'ADMIN'
                      ? colorScheme.onPrimaryContainer
                      : colorScheme.onSecondaryContainer,
                ),
              ),
            ),
        ],
      ),
      subtitle: Text(
        'Joined ${_formatDate(member.joinedAt)}',
        style: TextStyle(
          fontSize: 12,
          color: colorScheme.onSurfaceVariant,
        ),
      ),
      trailing: canManage && !isCurrentUser
          ? PopupMenuButton<String>(
              onSelected: (value) {
                if (value == 'remove') {
                  onRemove();
                } else {
                  onRoleChange(value);
                }
              },
              itemBuilder: (context) => [
                if (member.role != 'MODERATOR')
                  const PopupMenuItem(
                    value: 'MODERATOR',
                    child: Text('Make Moderator'),
                  ),
                if (member.role != 'MEMBER')
                  const PopupMenuItem(
                    value: 'MEMBER',
                    child: Text('Demote to Member'),
                  ),
                const PopupMenuDivider(),
                const PopupMenuItem(
                  value: 'remove',
                  child: Text('Remove', style: TextStyle(color: Colors.red)),
                ),
              ],
            )
          : null,
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inDays == 0) return 'today';
    if (diff.inDays == 1) return 'yesterday';
    if (diff.inDays < 7) return '${diff.inDays} days ago';
    if (diff.inDays < 30) return '${(diff.inDays / 7).floor()} weeks ago';
    if (diff.inDays < 365) return '${(diff.inDays / 30).floor()} months ago';
    return '${(diff.inDays / 365).floor()} years ago';
  }
}
