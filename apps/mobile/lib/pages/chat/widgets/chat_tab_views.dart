import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/chat_group.dart';
import 'package:thittam1hub/models/circle.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/enhanced_empty_state.dart';
import 'chat_tile_widgets.dart';

// ============================================================================
// ALL CHATS TAB
// ============================================================================

class AllChatsTab extends StatelessWidget {
  final List<DMThread> dmThreads;
  final List<ChatGroup> groups;
  final List<WorkspaceChannel> channels;
  final Map<String, int> unreadCounts;
  final Map<String, Message?> lastMessages;
  final Set<String> pinnedIds;
  final Set<String> mutedIds;
  final VoidCallback onCreateGroup;
  final Function(String) onPin;
  final Function(String) onMute;
  final VoidCallback onRefresh;

  const AllChatsTab({
    super.key,
    required this.dmThreads,
    required this.groups,
    required this.channels,
    required this.unreadCounts,
    required this.lastMessages,
    required this.pinnedIds,
    required this.mutedIds,
    required this.onCreateGroup,
    required this.onPin,
    required this.onMute,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    if (dmThreads.isEmpty && groups.isEmpty && channels.isEmpty) {
      return ChatEmptyState(
        title: 'No conversations yet',
        subtitle: 'Start chatting with your team or people you follow',
        buttonLabel: 'Start a Chat',
        onTap: () => context.push(AppRoutes.chatNew),
      );
    }

    final grouped = _groupChannels(channels);

    return ListView(
      padding: const EdgeInsets.only(bottom: 100),
      children: [
        if (pinnedIds.isNotEmpty) ...[
          const SectionHeader(title: '📌 Pinned'),
          ..._buildPinnedItems(context),
        ],
        
        if (dmThreads.isNotEmpty) ...[
          const SectionHeader(title: '💬 Direct Messages'),
          ...dmThreads.map((t) => EnhancedDMTile(
            thread: t,
            unreadCount: unreadCounts[t.channelId] ?? 0,
            isPinned: pinnedIds.contains(t.channelId),
            isMuted: mutedIds.contains(t.channelId),
            onPin: () => onPin(t.channelId),
            onMute: () => onMute(t.channelId),
          )),
        ],
        
        SectionHeader(title: '👥 Groups', trailing: CreateButton(onTap: onCreateGroup)),
        if (groups.isEmpty)
          const EmptySection(message: 'No groups yet. Create one!')
        else
          ...groups.map((g) => EnhancedGroupTile(
            group: g,
            isPinned: pinnedIds.contains(g.id),
            isMuted: mutedIds.contains(g.id),
            onPin: () => onPin(g.id),
            onMute: () => onMute(g.id),
          )),
        
        if (grouped[ChannelType.ANNOUNCEMENT]!.isNotEmpty) ...[
          const SectionHeader(title: '📢 Announcements'),
          ...grouped[ChannelType.ANNOUNCEMENT]!.map((c) => EnhancedChannelTile(
            channel: c,
            last: lastMessages[c.id],
            unreadCount: unreadCounts[c.id] ?? 0,
            isPinned: pinnedIds.contains(c.id),
            isMuted: mutedIds.contains(c.id),
            onPin: () => onPin(c.id),
            onMute: () => onMute(c.id),
          )),
        ],
        
        if (grouped[ChannelType.GENERAL]!.isNotEmpty) ...[
          const SectionHeader(title: '💬 General'),
          ...grouped[ChannelType.GENERAL]!.map((c) => EnhancedChannelTile(
            channel: c,
            last: lastMessages[c.id],
            unreadCount: unreadCounts[c.id] ?? 0,
            isPinned: pinnedIds.contains(c.id),
            isMuted: mutedIds.contains(c.id),
            onPin: () => onPin(c.id),
            onMute: () => onMute(c.id),
          )),
        ],
        
        if (grouped[ChannelType.ROLE_BASED]!.isNotEmpty) ...[
          const SectionHeader(title: '👥 Teams'),
          ...grouped[ChannelType.ROLE_BASED]!.map((c) => EnhancedChannelTile(
            channel: c,
            last: lastMessages[c.id],
            unreadCount: unreadCounts[c.id] ?? 0,
            isPinned: pinnedIds.contains(c.id),
            isMuted: mutedIds.contains(c.id),
            onPin: () => onPin(c.id),
            onMute: () => onMute(c.id),
          )),
        ],
        
        if (grouped[ChannelType.TASK_SPECIFIC]!.isNotEmpty) ...[
          const SectionHeader(title: '📋 Tasks'),
          ...grouped[ChannelType.TASK_SPECIFIC]!.map((c) => EnhancedChannelTile(
            channel: c,
            last: lastMessages[c.id],
            unreadCount: unreadCounts[c.id] ?? 0,
            isPinned: pinnedIds.contains(c.id),
            isMuted: mutedIds.contains(c.id),
            onPin: () => onPin(c.id),
            onMute: () => onMute(c.id),
          )),
        ],
      ],
    );
  }

  List<Widget> _buildPinnedItems(BuildContext context) {
    final List<Widget> items = [];
    
    for (final id in pinnedIds) {
      final dm = dmThreads.where((t) => t.channelId == id).firstOrNull;
      if (dm != null) {
        items.add(EnhancedDMTile(
          thread: dm,
          unreadCount: unreadCounts[dm.channelId] ?? 0,
          isPinned: true,
          isMuted: mutedIds.contains(dm.channelId),
          onPin: () => onPin(dm.channelId),
          onMute: () => onMute(dm.channelId),
        ));
        continue;
      }
      
      final group = groups.where((g) => g.id == id).firstOrNull;
      if (group != null) {
        items.add(EnhancedGroupTile(
          group: group,
          isPinned: true,
          isMuted: mutedIds.contains(group.id),
          onPin: () => onPin(group.id),
          onMute: () => onMute(group.id),
        ));
        continue;
      }
      
      final channel = channels.where((c) => c.id == id).firstOrNull;
      if (channel != null) {
        items.add(EnhancedChannelTile(
          channel: channel,
          last: lastMessages[channel.id],
          unreadCount: unreadCounts[channel.id] ?? 0,
          isPinned: true,
          isMuted: mutedIds.contains(channel.id),
          onPin: () => onPin(channel.id),
          onMute: () => onMute(channel.id),
        ));
      }
    }
    
    return items;
  }

  Map<ChannelType, List<WorkspaceChannel>> _groupChannels(List<WorkspaceChannel> items) {
    final map = {
      ChannelType.ANNOUNCEMENT: <WorkspaceChannel>[],
      ChannelType.GENERAL: <WorkspaceChannel>[],
      ChannelType.ROLE_BASED: <WorkspaceChannel>[],
      ChannelType.TASK_SPECIFIC: <WorkspaceChannel>[],
    };
    for (final c in items) {
      map[c.type]?.add(c);
    }
    return map;
  }
}

// ============================================================================
// DIRECT MESSAGES TAB
// ============================================================================

class DirectMessagesTab extends StatelessWidget {
  final List<DMThread> threads;
  final Map<String, int> unreadCounts;
  final Set<String> pinnedIds;
  final Set<String> mutedIds;
  final Function(String) onPin;
  final Function(String) onMute;

  const DirectMessagesTab({
    super.key,
    required this.threads,
    required this.unreadCounts,
    required this.pinnedIds,
    required this.mutedIds,
    required this.onPin,
    required this.onMute,
  });

  @override
  Widget build(BuildContext context) {
    if (threads.isEmpty) {
      return ChatEmptyState(
        title: 'No direct messages',
        subtitle: 'Start a conversation with someone',
        buttonLabel: 'New Message',
        onTap: () => context.push(AppRoutes.chatNew),
      );
    }

    final pinned = threads.where((t) => pinnedIds.contains(t.channelId)).toList();
    final unpinned = threads.where((t) => !pinnedIds.contains(t.channelId)).toList();

    return ListView(
      padding: const EdgeInsets.only(bottom: 100),
      children: [
        if (pinned.isNotEmpty) ...[
          const SectionHeader(title: '📌 Pinned'),
          ...pinned.map((t) => EnhancedDMTile(
            thread: t,
            unreadCount: unreadCounts[t.channelId] ?? 0,
            isPinned: true,
            isMuted: mutedIds.contains(t.channelId),
            onPin: () => onPin(t.channelId),
            onMute: () => onMute(t.channelId),
          )),
        ],
        if (unpinned.isNotEmpty) ...[
          if (pinned.isNotEmpty) const SectionHeader(title: '💬 Messages'),
          ...unpinned.map((t) => EnhancedDMTile(
            thread: t,
            unreadCount: unreadCounts[t.channelId] ?? 0,
            isPinned: false,
            isMuted: mutedIds.contains(t.channelId),
            onPin: () => onPin(t.channelId),
            onMute: () => onMute(t.channelId),
          )),
        ],
      ],
    );
  }
}

// ============================================================================
// GROUPS TAB
// ============================================================================

class GroupsTab extends StatelessWidget {
  final List<ChatGroup> groups;
  final List<Circle> circles;
  final Set<String> pinnedIds;
  final Set<String> mutedIds;
  final VoidCallback onCreateGroup;
  final Function(String) onPin;
  final Function(String) onMute;

  const GroupsTab({
    super.key,
    required this.groups,
    required this.circles,
    required this.pinnedIds,
    required this.mutedIds,
    required this.onCreateGroup,
    required this.onPin,
    required this.onMute,
  });

  @override
  Widget build(BuildContext context) {
    if (groups.isEmpty && circles.isEmpty) {
      return ChatEmptyState(
        title: 'No groups or circles yet',
        subtitle: 'Create a group or discover circles in the Pulse tab',
        buttonLabel: 'Create Group',
        onTap: onCreateGroup,
      );
    }

    final pinnedGroups = groups.where((g) => pinnedIds.contains(g.id)).toList();
    final unpinnedGroups = groups.where((g) => !pinnedIds.contains(g.id)).toList();

    return ListView(
      padding: const EdgeInsets.only(bottom: 100),
      children: [
        if (pinnedGroups.isNotEmpty) ...[
          const SectionHeader(title: '📌 Pinned'),
          ...pinnedGroups.map((g) => EnhancedGroupTile(
            group: g,
            isPinned: true,
            isMuted: mutedIds.contains(g.id),
            onPin: () => onPin(g.id),
            onMute: () => onMute(g.id),
          )),
        ],
        
        SectionHeader(
          title: pinnedGroups.isNotEmpty ? '👥 All Groups' : '👥 Groups',
          trailing: CreateButton(onTap: onCreateGroup),
        ),
        if (unpinnedGroups.isEmpty)
          const EmptySection(message: 'No groups yet. Create one!')
        else
          ...unpinnedGroups.map((g) => EnhancedGroupTile(
            group: g,
            isPinned: false,
            isMuted: mutedIds.contains(g.id),
            onPin: () => onPin(g.id),
            onMute: () => onMute(g.id),
          )),
        
        if (circles.isNotEmpty) ...[
          SectionHeader(
            title: '🔵 Circles',
            trailing: DiscoverButton(onTap: () => context.push(AppRoutes.pulseWithFilters(mode: 'groups'))),
          ),
          ...circles.map((circle) => CircleTile(circle: circle)),
        ],
      ],
    );
  }
}

// ============================================================================
// CHANNELS TAB
// ============================================================================

class ChannelsTab extends StatelessWidget {
  final List<WorkspaceChannel> channels;
  final Map<String, Message?> lastMessages;
  final Map<String, int> unreadCounts;
  final Set<String> pinnedIds;
  final Set<String> mutedIds;
  final Function(String) onPin;
  final Function(String) onMute;

  const ChannelsTab({
    super.key,
    required this.channels,
    required this.lastMessages,
    required this.unreadCounts,
    required this.pinnedIds,
    required this.mutedIds,
    required this.onPin,
    required this.onMute,
  });

  @override
  Widget build(BuildContext context) {
    if (channels.isEmpty) {
      return ChatEmptyState(
        title: 'No channels available',
        subtitle: 'Channels are created by workspace admins',
        buttonLabel: 'Refresh',
        onTap: () {},
      );
    }

    final grouped = _groupChannels();

    return ListView(
      padding: const EdgeInsets.only(bottom: 100),
      children: [
        if (grouped[ChannelType.ANNOUNCEMENT]!.isNotEmpty) ...[
          const SectionHeader(title: '📢 Announcements'),
          ...grouped[ChannelType.ANNOUNCEMENT]!.map((c) => EnhancedChannelTile(
            channel: c,
            last: lastMessages[c.id],
            unreadCount: unreadCounts[c.id] ?? 0,
            isPinned: pinnedIds.contains(c.id),
            isMuted: mutedIds.contains(c.id),
            onPin: () => onPin(c.id),
            onMute: () => onMute(c.id),
          )),
        ],
        
        if (grouped[ChannelType.GENERAL]!.isNotEmpty) ...[
          const SectionHeader(title: '💬 General'),
          ...grouped[ChannelType.GENERAL]!.map((c) => EnhancedChannelTile(
            channel: c,
            last: lastMessages[c.id],
            unreadCount: unreadCounts[c.id] ?? 0,
            isPinned: pinnedIds.contains(c.id),
            isMuted: mutedIds.contains(c.id),
            onPin: () => onPin(c.id),
            onMute: () => onMute(c.id),
          )),
        ],
        
        if (grouped[ChannelType.ROLE_BASED]!.isNotEmpty) ...[
          const SectionHeader(title: '👥 Teams'),
          ...grouped[ChannelType.ROLE_BASED]!.map((c) => EnhancedChannelTile(
            channel: c,
            last: lastMessages[c.id],
            unreadCount: unreadCounts[c.id] ?? 0,
            isPinned: pinnedIds.contains(c.id),
            isMuted: mutedIds.contains(c.id),
            onPin: () => onPin(c.id),
            onMute: () => onMute(c.id),
          )),
        ],
        
        if (grouped[ChannelType.TASK_SPECIFIC]!.isNotEmpty) ...[
          const SectionHeader(title: '📋 Tasks'),
          ...grouped[ChannelType.TASK_SPECIFIC]!.map((c) => EnhancedChannelTile(
            channel: c,
            last: lastMessages[c.id],
            unreadCount: unreadCounts[c.id] ?? 0,
            isPinned: pinnedIds.contains(c.id),
            isMuted: mutedIds.contains(c.id),
            onPin: () => onPin(c.id),
            onMute: () => onMute(c.id),
          )),
        ],
      ],
    );
  }

  Map<ChannelType, List<WorkspaceChannel>> _groupChannels() {
    final map = {
      ChannelType.ANNOUNCEMENT: <WorkspaceChannel>[],
      ChannelType.GENERAL: <WorkspaceChannel>[],
      ChannelType.ROLE_BASED: <WorkspaceChannel>[],
      ChannelType.TASK_SPECIFIC: <WorkspaceChannel>[],
    };
    for (final c in channels) {
      map[c.type]?.add(c);
    }
    return map;
  }
}

// ============================================================================
// SHARED WIDGETS
// ============================================================================

class SectionHeader extends StatelessWidget {
  final String title;
  final Widget? trailing;

  const SectionHeader({super.key, required this.title, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: context.textStyles.labelLarge?.copyWith(
              fontWeight: FontWeight.w600,
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
              letterSpacing: 0.5,
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

class CreateButton extends StatelessWidget {
  final VoidCallback onTap;

  const CreateButton({super.key, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: theme.colorScheme.primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.add, size: 14, color: theme.colorScheme.primary),
            const SizedBox(width: 4),
            Text(
              'New',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: theme.colorScheme.primary),
            ),
          ],
        ),
      ),
    );
  }
}

class DiscoverButton extends StatelessWidget {
  final VoidCallback onTap;

  const DiscoverButton({super.key, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: theme.colorScheme.secondary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.explore_rounded, size: 14, color: theme.colorScheme.secondary),
            const SizedBox(width: 4),
            Text(
              'Discover',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: theme.colorScheme.secondary),
            ),
          ],
        ),
      ),
    );
  }
}

class EmptySection extends StatelessWidget {
  final String message;

  const EmptySection({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
      child: Center(
        child: Text(
          message,
          style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant, fontSize: 14),
        ),
      ),
    );
  }
}

class ChatEmptyState extends StatelessWidget {
  final String title;
  final String subtitle;
  final String buttonLabel;
  final VoidCallback onTap;

  const ChatEmptyState({
    super.key,
    required this.title,
    required this.subtitle,
    required this.buttonLabel,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return EnhancedEmptyState(
      icon: Icons.chat_bubble_outline_rounded,
      title: title,
      subtitle: subtitle,
      primaryButtonLabel: buttonLabel,
      onPrimaryAction: onTap,
    );
  }
}
