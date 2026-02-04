import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/services/chat_service.dart';
import 'package:thittam1hub/services/pagination_mixin.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/nav.dart';

import 'package:thittam1hub/services/logging_service.dart';

class NewMessagePage extends StatefulWidget {
  const NewMessagePage({super.key});
  @override
  State<NewMessagePage> createState() => _NewMessagePageState();
}

class _NewMessagePageState extends State<NewMessagePage> {
  static final _log = LoggingService.instance;
  static const String _tag = 'NewMessagePage';
  
  final TextEditingController _search = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  bool _loading = false;
  bool _isLoadingMore = false;
  List<UserProfile> _results = [];
  String? _nextCursor;
  String _lastQuery = '';

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _runSearch();
  }
  
  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _search.dispose();
    super.dispose();
  }
  
  void _onScroll() {
    if (_scrollController.position.pixels >= 
        _scrollController.position.maxScrollExtent - 200) {
      _loadMoreUsers();
    }
  }

  Future<void> _runSearch() async {
    final query = _search.text;
    _lastQuery = query;
    
    setState(() {
      _loading = true;
      _results = [];
      _nextCursor = null;
    });
    
    try {
      final result = await ChatService.instance.searchUsersPaginated(
        query: query,
        pageSize: 50,
      );
      if (mounted && _lastQuery == query) {
        setState(() {
          _results = result.items;
          _nextCursor = result.hasMore ? result.nextCursor : null;
        });
      }
    } catch (e) {
      _log.error('NewMessagePage search error: $e', tag: _tag);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
  
  Future<void> _loadMoreUsers() async {
    if (_isLoadingMore || _nextCursor == null) return;
    
    setState(() => _isLoadingMore = true);
    
    try {
      final result = await ChatService.instance.searchUsersPaginated(
        query: _lastQuery,
        cursor: _nextCursor,
        pageSize: 50,
      );
      
      if (mounted) {
        setState(() {
          _results.addAll(result.items);
          _nextCursor = result.hasMore ? result.nextCursor : null;
        });
      }
    } catch (e) {
      _log.error('NewMessagePage load more error: $e', tag: _tag);
    } finally {
      if (mounted) setState(() => _isLoadingMore = false);
    }
  }

  void _openDM(UserProfile user) {
    final me = SupabaseConfig.auth.currentUser?.id;
    if (me == null) return;
    final channelId = ChatService.dmChannelIdFor(me, user.id);
    context.push(AppRoutes.chatChannel(channelId), extra: {
      'dmUserId': user.id,
      'dmUserName': user.fullName?.isNotEmpty == true ? user.fullName : user.email,
      'dmUserAvatar': user.avatarUrl,
    });
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(
          padding: EdgeInsets.fromLTRB(context.horizontalPadding, 10, context.horizontalPadding, 10),
          child: Row(children: [
            IconButton(onPressed: () => context.pop(), icon: const Icon(Icons.arrow_back)),
            const SizedBox(width: 8),
            Text('New Message', style: context.textStyles.titleLarge),
          ]),
        ),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding),
          child: _SearchField(controller: _search, onChanged: (_) => _runSearch()),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : ListView.builder(
                  controller: _scrollController,
                  padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding),
                  itemCount: _results.length + (_isLoadingMore ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index == _results.length) {
                      return const Padding(
                        padding: EdgeInsets.all(16),
                        child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                      );
                    }
                    return _UserTile(user: _results[index], onTap: _openDM);
                  },
                ),
        ),
      ]),
    );
  }
}

class _SearchField extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  const _SearchField({required this.controller, required this.onChanged});
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.6)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(children: [
        const Icon(Icons.search, color: AppColors.textMuted),
        const SizedBox(width: 8),
        Expanded(
          child: TextField(
            controller: controller,
            onChanged: onChanged,
            decoration: const InputDecoration(
              hintText: 'Search participants by name or email...',
              border: InputBorder.none,
            ),
          ),
        ),
      ]),
    );
  }
}

class _UserTile extends StatelessWidget {
  final UserProfile user;
  final void Function(UserProfile) onTap;
  const _UserTile({required this.user, required this.onTap});
  @override
  Widget build(BuildContext context) {
    final name = user.fullName?.isNotEmpty == true ? user.fullName! : user.email;
    return InkWell(
      borderRadius: BorderRadius.circular(AppRadius.md),
      onTap: () => onTap(user),
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.6)),
        ),
        padding: const EdgeInsets.all(12),
        margin: const EdgeInsets.only(bottom: 10),
        child: Row(children: [
          CircleAvatar(
            radius: 18,
            backgroundImage: (user.avatarUrl != null && user.avatarUrl!.isNotEmpty) ? NetworkImage(user.avatarUrl!) : null,
            child: (user.avatarUrl == null || user.avatarUrl!.isEmpty) ? const Icon(Icons.person, color: AppColors.textPrimary) : null,
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(name, style: context.textStyles.titleMedium?.semiBold, overflow: TextOverflow.ellipsis)),
        ]),
      ),
    );
  }
}
