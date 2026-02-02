/// Statistics for a chat group
class GroupStats {
  final int messageCount;
  final int mediaCount;
  final int linkCount;
  final int fileCount;

  const GroupStats({
    required this.messageCount,
    required this.mediaCount,
    required this.linkCount,
    required this.fileCount,
  });

  factory GroupStats.empty() => const GroupStats(
        messageCount: 0,
        mediaCount: 0,
        linkCount: 0,
        fileCount: 0,
      );

  factory GroupStats.fromJson(Map<String, dynamic> json) {
    return GroupStats(
      messageCount: json['message_count'] as int? ?? 0,
      mediaCount: json['media_count'] as int? ?? 0,
      linkCount: json['link_count'] as int? ?? 0,
      fileCount: json['file_count'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'message_count': messageCount,
        'media_count': mediaCount,
        'link_count': linkCount,
        'file_count': fileCount,
      };

  /// Format count for display (e.g., 1234 -> 1.2K)
  static String formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }

  String get formattedMessageCount => formatCount(messageCount);
  String get formattedMediaCount => formatCount(mediaCount);
  String get formattedLinkCount => formatCount(linkCount);
  String get formattedFileCount => formatCount(fileCount);
}

/// Invite link for a chat group
class GroupInviteLink {
  final String id;
  final String groupId;
  final String createdBy;
  final String linkCode;
  final bool isActive;
  final DateTime createdAt;

  const GroupInviteLink({
    required this.id,
    required this.groupId,
    required this.createdBy,
    required this.linkCode,
    required this.isActive,
    required this.createdAt,
  });

  factory GroupInviteLink.fromJson(Map<String, dynamic> json) {
    return GroupInviteLink(
      id: json['id'] as String,
      groupId: json['group_id'] as String,
      createdBy: json['created_by'] as String,
      linkCode: json['link_code'] as String,
      isActive: json['is_active'] as bool? ?? true,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  /// Generate the full invite URL
  String get fullUrl => 'https://thittam1hub.app/join/$linkCode';

  /// Short display text for the link
  String get displayCode => linkCode;
}
