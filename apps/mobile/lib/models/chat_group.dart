/// Group member roles with hierarchical permissions
enum GroupMemberRole {
  owner,
  admin,
  moderator,
  member;

  String get displayName {
    switch (this) {
      case GroupMemberRole.owner:
        return 'Owner';
      case GroupMemberRole.admin:
        return 'Admin';
      case GroupMemberRole.moderator:
        return 'Moderator';
      case GroupMemberRole.member:
        return 'Member';
    }
  }

  bool get canManageMembers =>
      this == GroupMemberRole.owner || this == GroupMemberRole.admin;

  bool get canEditGroup =>
      this == GroupMemberRole.owner || this == GroupMemberRole.admin;

  bool get canModerate =>
      this == GroupMemberRole.owner ||
      this == GroupMemberRole.admin ||
      this == GroupMemberRole.moderator;

  static GroupMemberRole fromString(String value) {
    switch (value.toLowerCase()) {
      case 'owner':
        return GroupMemberRole.owner;
      case 'admin':
        return GroupMemberRole.admin;
      case 'moderator':
        return GroupMemberRole.moderator;
      default:
        return GroupMemberRole.member;
    }
  }
}

/// Chat group model
class ChatGroup {
  final String id;
  final String name;
  final String? description;
  final String? iconUrl;
  final String createdBy;
  final bool isPublic;
  final int maxMembers;
  final int memberCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  // WhatsApp-level admin controls
  final bool onlyAdminsCanSend;
  final bool onlyAdminsCanEdit;

  // Optional: last message preview
  final String? lastMessage;
  final DateTime? lastMessageAt;
  final int unreadCount;

  const ChatGroup({
    required this.id,
    required this.name,
    this.description,
    this.iconUrl,
    required this.createdBy,
    this.isPublic = false,
    this.maxMembers = 100,
    this.memberCount = 1,
    required this.createdAt,
    required this.updatedAt,
    this.onlyAdminsCanSend = false,
    this.onlyAdminsCanEdit = false,
    this.lastMessage,
    this.lastMessageAt,
    this.unreadCount = 0,
  });

  factory ChatGroup.fromJson(Map<String, dynamic> json) {
    return ChatGroup(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      iconUrl: json['icon_url'] as String?,
      createdBy: json['created_by'] as String,
      isPublic: json['is_public'] as bool? ?? false,
      maxMembers: json['max_members'] as int? ?? 100,
      memberCount: json['member_count'] as int? ?? 1,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      onlyAdminsCanSend: json['only_admins_can_send'] as bool? ?? false,
      onlyAdminsCanEdit: json['only_admins_can_edit'] as bool? ?? false,
      lastMessage: json['last_message'] as String?,
      lastMessageAt: json['last_message_at'] != null
          ? DateTime.parse(json['last_message_at'] as String)
          : null,
      unreadCount: json['unread_count'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'icon_url': iconUrl,
      'created_by': createdBy,
      'is_public': isPublic,
      'max_members': maxMembers,
      'member_count': memberCount,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'only_admins_can_send': onlyAdminsCanSend,
      'only_admins_can_edit': onlyAdminsCanEdit,
    };
  }

  ChatGroup copyWith({
    String? id,
    String? name,
    String? description,
    String? iconUrl,
    String? createdBy,
    bool? isPublic,
    int? maxMembers,
    int? memberCount,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? onlyAdminsCanSend,
    bool? onlyAdminsCanEdit,
    String? lastMessage,
    DateTime? lastMessageAt,
    int? unreadCount,
  }) {
    return ChatGroup(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      iconUrl: iconUrl ?? this.iconUrl,
      createdBy: createdBy ?? this.createdBy,
      isPublic: isPublic ?? this.isPublic,
      maxMembers: maxMembers ?? this.maxMembers,
      memberCount: memberCount ?? this.memberCount,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      onlyAdminsCanSend: onlyAdminsCanSend ?? this.onlyAdminsCanSend,
      onlyAdminsCanEdit: onlyAdminsCanEdit ?? this.onlyAdminsCanEdit,
      lastMessage: lastMessage ?? this.lastMessage,
      lastMessageAt: lastMessageAt ?? this.lastMessageAt,
      unreadCount: unreadCount ?? this.unreadCount,
    );
  }
}

/// Chat group member model
class ChatGroupMember {
  final String id;
  final String groupId;
  final String userId;
  final GroupMemberRole role;
  final String? nickname;
  final DateTime joinedAt;
  final String? invitedBy;
  final bool isMuted;
  final DateTime? mutedUntil;
  final DateTime? lastReadAt;

  // WhatsApp-level member settings
  final bool isPinned;
  final bool isHidden;
  final DateTime? clearedAt;

  // Joined profile data
  final String? userName;
  final String? userAvatar;
  final bool? isOnline;

  const ChatGroupMember({
    required this.id,
    required this.groupId,
    required this.userId,
    required this.role,
    this.nickname,
    required this.joinedAt,
    this.invitedBy,
    this.isMuted = false,
    this.mutedUntil,
    this.lastReadAt,
    this.isPinned = false,
    this.isHidden = false,
    this.clearedAt,
    this.userName,
    this.userAvatar,
    this.isOnline,
  });

  factory ChatGroupMember.fromJson(Map<String, dynamic> json) {
    // Handle joined profile data
    final profile = json['impact_profiles'] as Map<String, dynamic>?;

    return ChatGroupMember(
      id: json['id'] as String,
      groupId: json['group_id'] as String,
      userId: json['user_id'] as String,
      role: GroupMemberRole.fromString(json['role'] as String? ?? 'member'),
      nickname: json['nickname'] as String?,
      joinedAt: DateTime.parse(json['joined_at'] as String),
      invitedBy: json['invited_by'] as String?,
      isMuted: json['is_muted'] as bool? ?? false,
      mutedUntil: json['muted_until'] != null
          ? DateTime.parse(json['muted_until'] as String)
          : null,
      lastReadAt: json['last_read_at'] != null
          ? DateTime.parse(json['last_read_at'] as String)
          : null,
      isPinned: json['is_pinned'] as bool? ?? false,
      isHidden: json['is_hidden'] as bool? ?? false,
      clearedAt: json['cleared_at'] != null
          ? DateTime.parse(json['cleared_at'] as String)
          : null,
      userName: profile?['full_name'] as String?,
      userAvatar: profile?['avatar_url'] as String?,
      isOnline: profile?['is_online'] as bool?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'group_id': groupId,
      'user_id': userId,
      'role': role.name,
      'nickname': nickname,
      'joined_at': joinedAt.toIso8601String(),
      'invited_by': invitedBy,
      'is_muted': isMuted,
      'muted_until': mutedUntil?.toIso8601String(),
      'last_read_at': lastReadAt?.toIso8601String(),
      'is_pinned': isPinned,
      'is_hidden': isHidden,
      'cleared_at': clearedAt?.toIso8601String(),
    };
  }

  String get displayName => nickname ?? userName ?? 'Unknown';

  ChatGroupMember copyWith({
    String? id,
    String? groupId,
    String? userId,
    GroupMemberRole? role,
    String? nickname,
    DateTime? joinedAt,
    String? invitedBy,
    bool? isMuted,
    DateTime? mutedUntil,
    DateTime? lastReadAt,
    bool? isPinned,
    bool? isHidden,
    DateTime? clearedAt,
    String? userName,
    String? userAvatar,
    bool? isOnline,
  }) {
    return ChatGroupMember(
      id: id ?? this.id,
      groupId: groupId ?? this.groupId,
      userId: userId ?? this.userId,
      role: role ?? this.role,
      nickname: nickname ?? this.nickname,
      joinedAt: joinedAt ?? this.joinedAt,
      invitedBy: invitedBy ?? this.invitedBy,
      isMuted: isMuted ?? this.isMuted,
      mutedUntil: mutedUntil ?? this.mutedUntil,
      lastReadAt: lastReadAt ?? this.lastReadAt,
      isPinned: isPinned ?? this.isPinned,
      isHidden: isHidden ?? this.isHidden,
      clearedAt: clearedAt ?? this.clearedAt,
      userName: userName ?? this.userName,
      userAvatar: userAvatar ?? this.userAvatar,
      isOnline: isOnline ?? this.isOnline,
    );
  }
}
