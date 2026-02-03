import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/supabase/circle_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/widgets/styled_avatar.dart';
import 'package:thittam1hub/widgets/styled_widgets.dart';

/// Search and invite users to a Circle
class UserInviteSearch extends StatefulWidget {
  final String circleId;
  final Function(String userId) onInvite;

  const UserInviteSearch({
    super.key,
    required this.circleId,
    required this.onInvite,
  });

  @override
  State<UserInviteSearch> createState() => _UserInviteSearchState();
}

class _UserInviteSearchState extends State<UserInviteSearch> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  final CircleService _circleService = CircleService();

  List<_SearchResult> _results = [];
  Set<String> _invitedIds = {};
  Set<String> _memberIds = {};
  bool _isSearching = false;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _loadMembers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _focusNode.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _loadMembers() async {
    final members = await _circleService.getCircleMembers(widget.circleId);
    if (mounted) {
      setState(() {
        _memberIds = members.map((m) => m.userId).toSet();
      });
    }
  }

  void _onSearchChanged(String query) {
    _debounce?.cancel();
    if (query.isEmpty) {
      setState(() => _results = []);
      return;
    }

    _debounce = Timer(const Duration(milliseconds: 400), () {
      _performSearch(query);
    });
  }

  Future<void> _performSearch(String query) async {
    if (query.length < 2) return;

    setState(() => _isSearching = true);

    try {
      final response = await SupabaseConfig.client
          .from('user_profiles')
          .select('id, display_name, avatar_url, username')
          .or('display_name.ilike.%$query%,username.ilike.%$query%')
          .neq('id', SupabaseConfig.client.auth.currentUser?.id ?? '')
          .limit(20);

      if (mounted) {
        setState(() {
          _results = (response as List).map((data) {
            final id = data['id'] as String;
            return _SearchResult(
              id: id,
              name: data['display_name'] as String? ?? 'Unknown',
              username: data['username'] as String?,
              avatarUrl: data['avatar_url'] as String?,
              isMember: _memberIds.contains(id),
              isInvited: _invitedIds.contains(id),
            );
          }).toList();
          _isSearching = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSearching = false);
      }
    }
  }

  Future<void> _inviteUser(_SearchResult user) async {
    if (user.isMember || user.isInvited) return;

    HapticFeedback.lightImpact();
    setState(() {
      _invitedIds.add(user.id);
      // Update result
      final index = _results.indexWhere((r) => r.id == user.id);
      if (index != -1) {
        _results[index] = user.copyWith(isInvited: true);
      }
    });

    widget.onInvite(user.id);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Column(
      children: [
        // Search field
        Padding(
          padding: const EdgeInsets.all(16),
          child: StyledSearchField(
            controller: _searchController,
            focusNode: _focusNode,
            hintText: 'Search by name or username',
            onChanged: _onSearchChanged,
          ),
        ),

        // Results list
        Expanded(
          child: _isSearching
              ? const Center(child: CircularProgressIndicator())
              : _results.isEmpty
                  ? _buildEmptyState(cs, textTheme)
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _results.length,
                      itemBuilder: (context, index) {
                        return _UserResultTile(
                          result: _results[index],
                          onInvite: () => _inviteUser(_results[index]),
                        );
                      },
                    ),
        ),
      ],
    );
  }

  Widget _buildEmptyState(ColorScheme cs, TextTheme textTheme) {
    if (_searchController.text.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.search,
                size: 48,
                color: cs.onSurfaceVariant,
              ),
              const SizedBox(height: 16),
              Text(
                'Search for users',
                style: textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(
                'Find people by their name or username to invite them',
                style: textTheme.bodyMedium?.copyWith(
                  color: cs.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.person_search,
              size: 48,
              color: cs.onSurfaceVariant,
            ),
            const SizedBox(height: 16),
            Text(
              'No users found',
              style: textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Try a different search term',
              style: textTheme.bodyMedium?.copyWith(
                color: cs.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// User search result tile
class _UserResultTile extends StatelessWidget {
  final _SearchResult result;
  final VoidCallback onInvite;

  const _UserResultTile({
    required this.result,
    required this.onInvite,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 4,
        ),
        leading: StyledAvatar(
          size: 44,
          userId: result.id,
          imageUrl: result.avatarUrl,
        ),
        title: Text(
          result.name,
          style: textTheme.bodyLarge?.copyWith(
            fontWeight: FontWeight.w500,
          ),
        ),
        subtitle: result.username != null
            ? Text(
                '@${result.username}',
                style: textTheme.bodySmall?.copyWith(
                  color: cs.onSurfaceVariant,
                ),
              )
            : null,
        trailing: _buildTrailingButton(cs),
      ),
    );
  }

  Widget _buildTrailingButton(ColorScheme cs) {
    if (result.isMember) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.check, size: 16, color: cs.onSurfaceVariant),
            const SizedBox(width: 4),
            Text(
              'Member',
              style: TextStyle(
                fontSize: 12,
                color: cs.onSurfaceVariant,
              ),
            ),
          ],
        ),
      );
    }

    if (result.isInvited) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: cs.primaryContainer,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.mail_outline, size: 16, color: cs.onPrimaryContainer),
            const SizedBox(width: 4),
            Text(
              'Invited',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: cs.onPrimaryContainer,
              ),
            ),
          ],
        ),
      );
    }

    return FilledButton.icon(
      onPressed: onInvite,
      icon: const Icon(Icons.person_add, size: 16),
      label: const Text('Invite'),
      style: FilledButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        minimumSize: const Size(0, 36),
      ),
    );
  }
}

/// Search result model
class _SearchResult {
  final String id;
  final String name;
  final String? username;
  final String? avatarUrl;
  final bool isMember;
  final bool isInvited;

  const _SearchResult({
    required this.id,
    required this.name,
    this.username,
    this.avatarUrl,
    this.isMember = false,
    this.isInvited = false,
  });

  _SearchResult copyWith({
    String? id,
    String? name,
    String? username,
    String? avatarUrl,
    bool? isMember,
    bool? isInvited,
  }) {
    return _SearchResult(
      id: id ?? this.id,
      name: name ?? this.name,
      username: username ?? this.username,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      isMember: isMember ?? this.isMember,
      isInvited: isInvited ?? this.isInvited,
    );
  }
}
