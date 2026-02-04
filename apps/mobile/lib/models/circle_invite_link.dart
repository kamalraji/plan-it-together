import 'package:flutter/foundation.dart';

/// Invite link for a Circle community
@immutable
class CircleInviteLink {
  final String id;
  final String circleId;
  final String linkCode;
  final String createdBy;
  final bool isActive;
  final DateTime? expiresAt;
  final int? maxUses;
  final int useCount;
  final DateTime createdAt;

  const CircleInviteLink({
    required this.id,
    required this.circleId,
    required this.linkCode,
    required this.createdBy,
    required this.isActive,
    this.expiresAt,
    this.maxUses,
    required this.useCount,
    required this.createdAt,
  });

  factory CircleInviteLink.fromMap(Map<String, dynamic> map) {
    return CircleInviteLink(
      id: map['id'] as String,
      circleId: map['circle_id'] as String,
      linkCode: map['link_code'] as String,
      createdBy: map['created_by'] as String,
      isActive: map['is_active'] as bool? ?? true,
      expiresAt: map['expires_at'] != null
          ? DateTime.parse(map['expires_at'] as String)
          : null,
      maxUses: map['max_uses'] as int?,
      useCount: map['use_count'] as int? ?? 0,
      createdAt: DateTime.parse(map['created_at'] as String),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'circle_id': circleId,
      'link_code': linkCode,
      'created_by': createdBy,
      'is_active': isActive,
      'expires_at': expiresAt?.toIso8601String(),
      'max_uses': maxUses,
      'use_count': useCount,
      'created_at': createdAt.toIso8601String(),
    };
  }

  /// Generate the full invite URL
  String get fullUrl => 'https://thittam1hub.app/c/$linkCode';

  /// Short display text for the link
  String get displayCode => linkCode.toUpperCase();

  /// Check if the link is still valid
  bool get isValid {
    if (!isActive) return false;
    if (expiresAt != null && DateTime.now().isAfter(expiresAt!)) return false;
    if (maxUses != null && useCount >= maxUses!) return false;
    return true;
  }

  /// Remaining uses (null if unlimited)
  int? get remainingUses => maxUses != null ? maxUses! - useCount : null;

  /// Human-readable expiry status
  String get expiryStatus {
    if (expiresAt == null) return 'Never expires';
    final now = DateTime.now();
    if (now.isAfter(expiresAt!)) return 'Expired';
    final diff = expiresAt!.difference(now);
    if (diff.inDays > 0) return 'Expires in ${diff.inDays}d';
    if (diff.inHours > 0) return 'Expires in ${diff.inHours}h';
    return 'Expires in ${diff.inMinutes}m';
  }

  CircleInviteLink copyWith({
    String? id,
    String? circleId,
    String? linkCode,
    String? createdBy,
    bool? isActive,
    DateTime? expiresAt,
    int? maxUses,
    int? useCount,
    DateTime? createdAt,
  }) {
    return CircleInviteLink(
      id: id ?? this.id,
      circleId: circleId ?? this.circleId,
      linkCode: linkCode ?? this.linkCode,
      createdBy: createdBy ?? this.createdBy,
      isActive: isActive ?? this.isActive,
      expiresAt: expiresAt ?? this.expiresAt,
      maxUses: maxUses ?? this.maxUses,
      useCount: useCount ?? this.useCount,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CircleInviteLink &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;
}
