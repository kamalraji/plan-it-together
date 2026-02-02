import 'package:flutter/foundation.dart';

/// Status of a circle invitation
enum CircleInvitationStatus {
  pending,
  accepted,
  declined,
  expired;

  static CircleInvitationStatus fromString(String value) {
    switch (value.toUpperCase()) {
      case 'ACCEPTED':
        return CircleInvitationStatus.accepted;
      case 'DECLINED':
        return CircleInvitationStatus.declined;
      case 'EXPIRED':
        return CircleInvitationStatus.expired;
      default:
        return CircleInvitationStatus.pending;
    }
  }

  String toDbValue() => name.toUpperCase();
}

/// Direct invitation to join a Circle
@immutable
class CircleInvitation {
  final String id;
  final String circleId;
  final String inviterId;
  final String? inviteeId;
  final String? inviteeEmail;
  final CircleInvitationStatus status;
  final DateTime createdAt;
  final DateTime? respondedAt;

  // Joined fields (optional)
  final String? inviterName;
  final String? inviterAvatar;
  final String? circleName;
  final String? circleIcon;

  const CircleInvitation({
    required this.id,
    required this.circleId,
    required this.inviterId,
    this.inviteeId,
    this.inviteeEmail,
    required this.status,
    required this.createdAt,
    this.respondedAt,
    this.inviterName,
    this.inviterAvatar,
    this.circleName,
    this.circleIcon,
  });

  factory CircleInvitation.fromMap(Map<String, dynamic> map) {
    return CircleInvitation(
      id: map['id'] as String,
      circleId: map['circle_id'] as String,
      inviterId: map['inviter_id'] as String,
      inviteeId: map['invitee_id'] as String?,
      inviteeEmail: map['invitee_email'] as String?,
      status: CircleInvitationStatus.fromString(
        map['status'] as String? ?? 'PENDING',
      ),
      createdAt: DateTime.parse(map['created_at'] as String),
      respondedAt: map['responded_at'] != null
          ? DateTime.parse(map['responded_at'] as String)
          : null,
      inviterName: map['inviter_name'] as String?,
      inviterAvatar: map['inviter_avatar'] as String?,
      circleName: map['circle_name'] as String?,
      circleIcon: map['circle_icon'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'circle_id': circleId,
      'inviter_id': inviterId,
      'invitee_id': inviteeId,
      'invitee_email': inviteeEmail,
      'status': status.toDbValue(),
      'created_at': createdAt.toIso8601String(),
      'responded_at': respondedAt?.toIso8601String(),
    };
  }

  /// Check if invitation is still pending
  bool get isPending => status == CircleInvitationStatus.pending;

  /// Check if invitation can still be responded to
  bool get canRespond => status == CircleInvitationStatus.pending;

  /// Time since invitation was sent
  Duration get timeSinceCreated => DateTime.now().difference(createdAt);

  /// Human-readable time ago
  String get timeAgo {
    final diff = timeSinceCreated;
    if (diff.inDays > 0) return '${diff.inDays}d ago';
    if (diff.inHours > 0) return '${diff.inHours}h ago';
    if (diff.inMinutes > 0) return '${diff.inMinutes}m ago';
    return 'Just now';
  }

  CircleInvitation copyWith({
    String? id,
    String? circleId,
    String? inviterId,
    String? inviteeId,
    String? inviteeEmail,
    CircleInvitationStatus? status,
    DateTime? createdAt,
    DateTime? respondedAt,
    String? inviterName,
    String? inviterAvatar,
    String? circleName,
    String? circleIcon,
  }) {
    return CircleInvitation(
      id: id ?? this.id,
      circleId: circleId ?? this.circleId,
      inviterId: inviterId ?? this.inviterId,
      inviteeId: inviteeId ?? this.inviteeId,
      inviteeEmail: inviteeEmail ?? this.inviteeEmail,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      respondedAt: respondedAt ?? this.respondedAt,
      inviterName: inviterName ?? this.inviterName,
      inviterAvatar: inviterAvatar ?? this.inviterAvatar,
      circleName: circleName ?? this.circleName,
      circleIcon: circleIcon ?? this.circleIcon,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CircleInvitation &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;
}
