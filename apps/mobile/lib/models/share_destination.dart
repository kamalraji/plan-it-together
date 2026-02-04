import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/chat_group.dart';

/// Type of share destination
enum ShareDestinationType { dm, group, channel }

/// Unified model for share destinations across DMs, Groups, and Channels
class ShareDestination {
  final String id;
  final ShareDestinationType type;
  final String name;
  final String? avatarUrl;
  final String? subtitle;
  final DateTime? lastInteractionAt;
  final bool isOnline;

  const ShareDestination({
    required this.id,
    required this.type,
    required this.name,
    this.avatarUrl,
    this.subtitle,
    this.lastInteractionAt,
    this.isOnline = false,
  });

  /// Create from DMThread
  factory ShareDestination.fromDMThread(DMThread dm) {
    return ShareDestination(
      id: dm.channelId,
      type: ShareDestinationType.dm,
      name: dm.partnerName,
      avatarUrl: dm.partnerAvatar,
      subtitle: dm.lastMessage?.content,
      lastInteractionAt: dm.updatedAt,
      isOnline: false, // DMThread doesn't track online status
    );
  }

  /// Create from ChatGroup
  factory ShareDestination.fromChatGroup(ChatGroup group) {
    return ShareDestination(
      id: group.id,
      type: ShareDestinationType.group,
      name: group.name,
      avatarUrl: group.iconUrl,
      subtitle: '${group.memberCount} members',
      lastInteractionAt: group.updatedAt,
    );
  }

  /// Create from WorkspaceChannel
  factory ShareDestination.fromChannel(WorkspaceChannel channel) {
    return ShareDestination(
      id: channel.id,
      type: ShareDestinationType.channel,
      name: channel.name,
      avatarUrl: null,
      subtitle: channel.description,
      lastInteractionAt: null, // WorkspaceChannel doesn't have updatedAt
    );
  }

  /// Get icon for this destination type
  String get typeIcon {
    switch (type) {
      case ShareDestinationType.dm:
        return '👤';
      case ShareDestinationType.group:
        return '👥';
      case ShareDestinationType.channel:
        return '#';
    }
  }

  /// Get display label for type
  String get typeLabel {
    switch (type) {
      case ShareDestinationType.dm:
        return 'Direct';
      case ShareDestinationType.group:
        return 'Group';
      case ShareDestinationType.channel:
        return 'Channel';
    }
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ShareDestination &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          type == other.type;

  @override
  int get hashCode => id.hashCode ^ type.hashCode;
}
