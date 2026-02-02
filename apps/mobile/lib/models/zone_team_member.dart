/// Model representing a team member with Zone management access
class ZoneTeamMember {
  final String userId;
  final String role;
  final String workspaceName;
  final String? fullName;
  final String? avatarUrl;
  final DateTime? joinedAt;

  const ZoneTeamMember({
    required this.userId,
    required this.role,
    required this.workspaceName,
    this.fullName,
    this.avatarUrl,
    this.joinedAt,
  });

  factory ZoneTeamMember.fromJson(Map<String, dynamic> json) => ZoneTeamMember(
        userId: json['user_id'] as String,
        role: json['role'] as String,
        workspaceName: json['workspace_name'] as String,
        fullName: json['full_name'] as String?,
        avatarUrl: json['avatar_url'] as String?,
        joinedAt: json['joined_at'] != null
            ? DateTime.parse(json['joined_at'] as String)
            : null,
      );

  /// Display name with fallback to 'Team Member'
  String get displayName => fullName ?? 'Team Member';

  /// Formatted role label (e.g., 'CONTENT_MANAGER' -> 'Content Manager')
  String get roleLabel => role
      .replaceAll('_', ' ')
      .toLowerCase()
      .split(' ')
      .map((w) => w.isNotEmpty ? '${w[0].toUpperCase()}${w.substring(1)}' : '')
      .join(' ');

  /// First initial for avatar placeholder
  String get initial => displayName.isNotEmpty ? displayName[0].toUpperCase() : '?';
}
