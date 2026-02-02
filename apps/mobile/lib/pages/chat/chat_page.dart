import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/models/chat_group.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';
import 'package:thittam1hub/widgets/chat_shimmer.dart';
import 'package:thittam1hub/widgets/unread_badge.dart';
import 'package:thittam1hub/widgets/chat/active_chats_bar.dart' as bar;
import 'package:thittam1hub/widgets/chat/quick_action_chip.dart';
import 'package:thittam1hub/widgets/chat/new_chat_options_sheet.dart';

import 'chat_page_controller.dart';
import 'create_group_wizard.dart';
import 'widgets/chat_page_components.dart';
import 'widgets/chat_tab_views.dart';

// Keyboard navigation intents
class _PreviousTabIntent extends Intent { const _PreviousTabIntent(); }
class _NextTabIntent extends Intent { const _NextTabIntent(); }

/// Main chat page displaying DMs, groups, and channels.
/// 
/// UI-only implementation delegating business logic to [ChatPageController].
class ChatPage extends StatefulWidget {
  final String? initialTab;
  final String? initialFilter;
  final String? initialSearch;
  
  const ChatPage({
    super.key,
    this.initialTab,
    this.initialFilter,
    this.initialSearch,
  });
  
  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> with TickerProviderStateMixin {
  final TextEditingController _search = TextEditingController();
  late final ChatPageController _controller;
  late final AnimationController _fabController;
  late final TabController _tabController;
  late final FocusNode _tabBarFocusNode;
  Timer? _urlSyncDebounce;

  @override
  void initState() {
    super.initState();
    
    _controller = ChatPageController(
      initialTab: widget.initialTab,
      initialFilter: widget.initialFilter,
      initialSearch: widget.initialSearch,
    );
    _controller.addListener(_onControllerChanged);
    
    _fabController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _tabBarFocusNode = FocusNode();
    
    _tabController = TabController(
      length: 4, 
      vsync: this, 
      initialIndex: _controller.tabIndex,
    );
    _tabController.addListener(_onTabChanged);
    
    if (widget.initialSearch != null && widget.initialSearch!.isNotEmpty) {
      _search.text = widget.initialSearch!;
    }
    
    _controller.loadChats().then((_) {
      if (mounted) _fabController.forward();
    });
  }
  
  void _onControllerChanged() {
    if (mounted) setState(() {});
  }
  
  void _onTabChanged() {
    if (!_tabController.indexIsChanging) {
      _controller.setSelectedTab(ChatTabFilter.values[_tabController.index]);
      _syncUrlState(addHistoryEntry: true);
    }
  }
  
  @override
  void didUpdateWidget(covariant ChatPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    if (widget.initialTab != oldWidget.initialTab ||
        widget.initialFilter != oldWidget.initialFilter ||
        widget.initialSearch != oldWidget.initialSearch) {
      _controller.updateFromNavigation(
        tab: widget.initialTab,
        filter: widget.initialFilter,
        search: widget.initialSearch,
      );
      
      final newTabIndex = _controller.tabIndex;
      if (_tabController.index != newTabIndex) {
        _tabController.animateTo(newTabIndex);
      }
      
      if (widget.initialSearch != null && _search.text != widget.initialSearch) {
        _search.text = widget.initialSearch!;
      }
    }
  }
  
  void _syncUrlState({bool addHistoryEntry = false}) {
    _urlSyncDebounce?.cancel();
    _urlSyncDebounce = Timer(const Duration(milliseconds: 100), () {
      if (!mounted) return;
      final newUrl = AppRoutes.chatWithFilters(
        tab: _controller.selectedTab.name,
        filter: _controller.listFilter.name,
        searchQuery: _search.text.isNotEmpty ? _search.text : null,
      );
      if (addHistoryEntry) {
        context.go(newUrl);
      } else {
        context.replace(newUrl);
      }
    });
  }

  @override
  void dispose() {
    _urlSyncDebounce?.cancel();
    _controller.removeListener(_onControllerChanged);
    _controller.dispose();
    _fabController.dispose();
    _tabController.dispose();
    _tabBarFocusNode.dispose();
    _search.dispose();
    super.dispose();
  }
  
  void _navigateToPreviousTab() {
    if (_tabController.index > 0) {
      _tabController.animateTo(_tabController.index - 1);
    }
  }

  void _navigateToNextTab() {
    if (_tabController.index < 3) {
      _tabController.animateTo(_tabController.index + 1);
    }
  }

  void _showNewChatOptions() {
    NewChatOptionsSheet.show(
      context,
      onNewMessage: () => context.push(AppRoutes.chatNew),
      onNewGroup: () async {
        final result = await Navigator.push<ChatGroup>(
          context,
          MaterialPageRoute(builder: (_) => const CreateGroupWizard()),
        );
        if (result != null) _controller.loadChats(forceRefresh: true);
      },
      onNewCircle: () => context.push(AppRoutes.pulseWithFilters(mode: 'groups', intent: 'create')),
      onNewChannel: () {},
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Shortcuts(
      shortcuts: {
        LogicalKeySet(LogicalKeyboardKey.arrowLeft): const _PreviousTabIntent(),
        LogicalKeySet(LogicalKeyboardKey.arrowRight): const _NextTabIntent(),
      },
      child: Actions(
        actions: {
          _PreviousTabIntent: CallbackAction<_PreviousTabIntent>(
            onInvoke: (_) { _navigateToPreviousTab(); return null; },
          ),
          _NextTabIntent: CallbackAction<_NextTabIntent>(
            onInvoke: (_) { _navigateToNextTab(); return null; },
          ),
        },
        child: Focus(
          focusNode: _tabBarFocusNode,
          child: Scaffold(
            body: SafeArea(
              child: Column(
                children: [
                  ConnectionBanner(isConnected: _controller.isConnected),
                  Expanded(
                    child: NestedScrollView(
                      headerSliverBuilder: (context, innerBoxIsScrolled) => [
                        _buildAppBar(theme),
                        _buildSearchFilterRow(),
                        if (!_controller.loading && _controller.activeChats.isNotEmpty)
                          _buildActiveChatsBar(),
                        _buildTabBar(),
                      ],
                      body: _buildBody(),
                    ),
                  ),
                ],
              ),
            ),
            floatingActionButton: _buildFab(theme),
          ),
        ),
      ),
    );
  }

  SliverAppBar _buildAppBar(ThemeData theme) {
    return SliverAppBar(
      pinned: true,
      floating: true,
      snap: true,
      expandedHeight: context.appBarHeight,
      toolbarHeight: context.appBarHeight,
      automaticallyImplyLeading: false,
      title: Row(
        children: [
          Text('Messages', style: context.textStyles.titleLarge),
          const SizedBox(width: 8),
          if (_controller.totalUnread > 0)
            UnreadBadge(count: _controller.totalUnread, size: 22),
        ],
      ),
      actions: [
        if (_controller.hasUnread)
          IconButton(
            tooltip: 'Mark all as read',
            onPressed: () {
              HapticFeedback.mediumImpact();
              _controller.markAllAsRead();
            },
            icon: Icon(Icons.done_all_rounded, color: theme.colorScheme.primary, size: 22),
          ),
        IconButton(
          tooltip: 'Settings',
          onPressed: () => context.push(AppRoutes.chatSettingsWithTab()),
          icon: Icon(Icons.tune_rounded, color: theme.colorScheme.onSurfaceVariant, size: 22),
        ),
        const SizedBox(width: 4),
      ],
      backgroundColor: theme.scaffoldBackgroundColor,
      surfaceTintColor: Colors.transparent,
    );
  }

  SliverToBoxAdapter _buildSearchFilterRow() {
    return SliverToBoxAdapter(
      child: Column(
        children: [
          Padding(
            padding: EdgeInsets.fromLTRB(context.horizontalPadding, 8, context.horizontalPadding, 12),
            child: Row(
              children: [
                Expanded(
                  child: EnhancedSearchBar(
                    controller: _search,
                    onChanged: (value) {
                      _controller.setSearchQuery(value);
                      _urlSyncDebounce?.cancel();
                      _urlSyncDebounce = Timer(const Duration(milliseconds: 500), () {
                        if (mounted) _syncUrlState();
                      });
                    },
                    onClear: () {
                      _urlSyncDebounce?.cancel();
                      _syncUrlState(addHistoryEntry: true);
                    },
                  ),
                ),
                const SizedBox(width: 8),
                FilterDropdown(
                  value: _controller.listFilter,
                  onChanged: (v) {
                    _controller.setListFilter(v);
                    _syncUrlState(addHistoryEntry: true);
                  },
                ),
              ],
            ),
          ),
          if (_controller.archivedCount > 0 || _controller.mutedCount > 0)
            _buildQuickActions(),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Padding(
      padding: EdgeInsets.only(
        left: context.horizontalPadding,
        right: context.horizontalPadding,
        bottom: 12,
      ),
      child: Row(
        children: [
          if (_controller.archivedCount > 0)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: QuickActionChip(
                icon: Icons.archive_outlined,
                label: 'Archived',
                count: _controller.archivedCount,
                isSelected: _controller.listFilter == ChatListFilter.archived,
                onTap: () {
                  final newFilter = _controller.listFilter == ChatListFilter.archived
                      ? ChatListFilter.all
                      : ChatListFilter.archived;
                  _controller.setListFilter(newFilter);
                  _syncUrlState(addHistoryEntry: true);
                },
              ),
            ),
          if (_controller.mutedCount > 0)
            QuickActionChip(
              icon: Icons.notifications_off_outlined,
              label: 'Muted',
              count: _controller.mutedCount,
              isSelected: _controller.listFilter == ChatListFilter.muted,
              onTap: () {
                final newFilter = _controller.listFilter == ChatListFilter.muted
                    ? ChatListFilter.all
                    : ChatListFilter.muted;
                _controller.setListFilter(newFilter);
                _syncUrlState(addHistoryEntry: true);
              },
            ),
        ],
      ),
    );
  }

  SliverToBoxAdapter _buildActiveChatsBar() {
    // Convert controller items to widget items
    final widgetItems = _controller.activeChats.map((item) => bar.ActiveChatItem(
      id: item.id,
      name: item.name,
      avatarUrl: item.avatarUrl,
      isOnline: item.isOnline,
      hasUnread: item.hasUnread,
      unreadCount: item.unreadCount,
      isGroup: item.isGroup,
      channelId: item.channelId,
    )).toList();
    
    return SliverToBoxAdapter(
      child: bar.ActiveChatsBar(
        items: widgetItems,
        onNewChatTap: _showNewChatOptions,
        onItemTap: (item) {
          if (item.isGroup) {
            final group = _controller.groups.firstWhere((g) => g.id == item.id);
            context.push('/chat/groups/${item.id}', extra: group);
          } else if (item.channelId != null) {
            final dm = _controller.dmThreads.firstWhere((d) => d.channelId == item.channelId);
            context.push('/chat/${item.channelId}', extra: {
              'dmUserId': dm.partnerUserId,
              'dmUserName': dm.partnerName,
              'dmUserAvatar': dm.partnerAvatar,
            });
          }
        },
      ),
    );
  }

  SliverPersistentHeader _buildTabBar() {
    return SliverPersistentHeader(
      pinned: true,
      delegate: ChatTabBarDelegate(
        tabController: _tabController,
        dmUnread: _controller.dmUnread,
        groupUnread: _controller.groupUnread,
        channelUnread: _controller.channelUnread,
      ),
    );
  }

  Widget _buildBody() {
    return BrandedRefreshIndicator(
      onRefresh: () async {
        HapticFeedback.mediumImpact();
        await _controller.loadChats(forceRefresh: true);
      },
      child: _controller.loading
          ? const ChatListShimmer(itemCount: 8)
          : TabBarView(
              controller: _tabController,
              children: [
                AllChatsTab(
                  dmThreads: _controller.filteredDMs,
                  groups: _controller.filteredGroups,
                  channels: _controller.filteredChannels,
                  unreadCounts: _controller.unreadCounts,
                  lastMessages: _controller.lastMessages,
                  pinnedIds: _controller.pinnedChatIds,
                  mutedIds: _controller.mutedChatIds,
                  onCreateGroup: _createGroup,
                  onPin: _controller.togglePin,
                  onMute: _controller.toggleMute,
                  onRefresh: () => _controller.loadChats(),
                ),
                DirectMessagesTab(
                  threads: _controller.filteredDMs,
                  unreadCounts: _controller.unreadCounts,
                  pinnedIds: _controller.pinnedChatIds,
                  mutedIds: _controller.mutedChatIds,
                  onPin: _controller.togglePin,
                  onMute: _controller.toggleMute,
                ),
                GroupsTab(
                  groups: _controller.filteredGroups,
                  circles: _controller.circles,
                  pinnedIds: _controller.pinnedChatIds,
                  mutedIds: _controller.mutedChatIds,
                  onCreateGroup: _createGroup,
                  onPin: _controller.togglePin,
                  onMute: _controller.toggleMute,
                ),
                ChannelsTab(
                  channels: _controller.filteredChannels,
                  lastMessages: _controller.lastMessages,
                  unreadCounts: _controller.unreadCounts,
                  pinnedIds: _controller.pinnedChatIds,
                  mutedIds: _controller.mutedChatIds,
                  onPin: _controller.togglePin,
                  onMute: _controller.toggleMute,
                ),
              ],
            ),
    );
  }

  void _createGroup() async {
    final result = await Navigator.push<ChatGroup>(
      context,
      MaterialPageRoute(builder: (_) => const CreateGroupWizard()),
    );
    if (result != null) _controller.loadChats(forceRefresh: true);
  }

  Widget _buildFab(ThemeData theme) {
    return ScaleTransition(
      scale: _fabController,
      child: FloatingActionButton(
        onPressed: () {
          HapticFeedback.lightImpact();
          _showNewChatOptions();
        },
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: theme.colorScheme.onPrimary,
        child: const Icon(Icons.add_rounded, size: 28),
      ),
    );
  }
}
