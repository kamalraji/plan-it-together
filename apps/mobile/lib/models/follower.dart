import 'package:flutter/foundation.dart';

/// Represents a follower relationship between two users
@immutable
class Follower {
  final String id;
  final String userId;
  final String otherUserName;
  final String? otherUserAvatar;
  final String? otherUserHeadline;
  final String? otherUserOrganization;
  final bool isOnline;
  final DateTime createdAt;
  final DateTime? acceptedAt;
  final String status;
  final bool isMutual; // true if both users follow each other
  final bool followsMe; // true if this user follows the current user

  const Follower({
    required this.id,
    required this.userId,
    required this.otherUserName,
    this.otherUserAvatar,
    this.otherUserHeadline,
    this.otherUserOrganization,
    this.isOnline = false,
    required this.createdAt,
    this.acceptedAt,
    required this.status,
    this.isMutual = false,
    this.followsMe = false,
  });

  bool get isPending => status == 'PENDING';
  bool get isAccepted => status == 'ACCEPTED';

  factory Follower.fromMap(Map<String, dynamic> json, {
    required Map<String, dynamic>? profile,
  }) {
    return Follower(
      id: json['id'] as String,
      userId: (profile?['user_id'] ?? json['follower_id'] ?? json['following_id']) as String,
      otherUserName: profile?['full_name'] as String? ?? 'Unknown',
      otherUserAvatar: profile?['avatar_url'] as String?,
      otherUserHeadline: profile?['headline'] as String?,
      otherUserOrganization: profile?['organization'] as String?,
      isOnline: profile?['is_online'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
      acceptedAt: json['accepted_at'] != null 
          ? DateTime.parse(json['accepted_at'] as String) 
          : null,
      status: json['status'] as String? ?? 'ACCEPTED',
    );
  }

  Follower copyWith({
    String? id,
    String? userId,
    String? otherUserName,
    String? otherUserAvatar,
    String? otherUserHeadline,
    String? otherUserOrganization,
    bool? isOnline,
    DateTime? createdAt,
    DateTime? acceptedAt,
    String? status,
    bool? isMutual,
    bool? followsMe,
  }) => Follower(
    id: id ?? this.id,
    userId: userId ?? this.userId,
    otherUserName: otherUserName ?? this.otherUserName,
    otherUserAvatar: otherUserAvatar ?? this.otherUserAvatar,
    otherUserHeadline: otherUserHeadline ?? this.otherUserHeadline,
    otherUserOrganization: otherUserOrganization ?? this.otherUserOrganization,
    isOnline: isOnline ?? this.isOnline,
    createdAt: createdAt ?? this.createdAt,
    acceptedAt: acceptedAt ?? this.acceptedAt,
    status: status ?? this.status,
    isMutual: isMutual ?? this.isMutual,
    followsMe: followsMe ?? this.followsMe,
  );
}

/// Statistics for a user's follower relationships
@immutable
class FollowStats {
  final int followersCount;
  final int followingCount;
  final int pendingRequestsCount;

  const FollowStats({
    required this.followersCount,
    required this.followingCount,
    this.pendingRequestsCount = 0,
  });

  factory FollowStats.empty() => const FollowStats(
    followersCount: 0,
    followingCount: 0,
    pendingRequestsCount: 0,
  );

  factory FollowStats.fromMap(Map<String, dynamic> json) {
    return FollowStats(
      followersCount: json['followers_count'] as int? ?? 0,
      followingCount: json['following_count'] as int? ?? 0,
      pendingRequestsCount: json['pending_requests_count'] as int? ?? 0,
    );
  }
}

/// Enum representing the follow status between two users
enum FollowStatus {
  notFollowing,
  pending,
  following,
  mutualFollow,
}

extension FollowStatusX on FollowStatus {
  String get displayName {
    switch (this) {
      case FollowStatus.notFollowing:
        return 'Follow';
      case FollowStatus.pending:
        return 'Requested';
      case FollowStatus.following:
        return 'Following';
      case FollowStatus.mutualFollow:
        return 'Friends';
    }
  }

  bool get canUnfollow => this == FollowStatus.following || this == FollowStatus.mutualFollow;
  bool get canCancelRequest => this == FollowStatus.pending;
  bool get canFollow => this == FollowStatus.notFollowing;
}

/// Result of a follow operation
@immutable
class FollowResult {
  final bool success;
  final bool requestSent;
  final bool alreadyFollowing;
  final bool blockedByTarget;
  final bool rateLimited;
  final int? remainingInWindow;
  final String? error;

  const FollowResult._({
    this.success = false,
    this.requestSent = false,
    this.alreadyFollowing = false,
    this.blockedByTarget = false,
    this.rateLimited = false,
    this.remainingInWindow,
    this.error,
  });

  factory FollowResult.success() => const FollowResult._(success: true);
  
  factory FollowResult.requestSent() => const FollowResult._(
    success: true, 
    requestSent: true,
  );
  
  factory FollowResult.alreadyFollowing() => const FollowResult._(
    alreadyFollowing: true,
  );
  
  factory FollowResult.blocked() => const FollowResult._(
    blockedByTarget: true,
  );
  
  factory FollowResult.rateLimited({int? remainingInWindow}) => FollowResult._(
    rateLimited: true,
    remainingInWindow: remainingInWindow,
  );
  
  factory FollowResult.failure(String error) => FollowResult._(
    error: error,
  );

  /// Whether the follow operation was successful
  bool get isSuccess => success;
  
  /// Whether a follow request was sent (for private accounts)
  bool get isRequestSent => requestSent;
  
  /// Whether the operation was rate limited
  bool get isRateLimited => rateLimited;
  
  /// Whether the operation failed
  bool get isFailure => !success && error != null;
}

/// Pending follow request item
@immutable
class FollowRequest {
  final String id;
  final String requesterId;
  final String requesterName;
  final String? requesterAvatar;
  final String? requesterHeadline;
  final DateTime createdAt;

  const FollowRequest({
    required this.id,
    required this.requesterId,
    required this.requesterName,
    this.requesterAvatar,
    this.requesterHeadline,
    required this.createdAt,
  });

  factory FollowRequest.fromMap(Map<String, dynamic> json, {
    Map<String, dynamic>? profile,
  }) {
    return FollowRequest(
      id: json['id'] as String,
      requesterId: json['follower_id'] as String,
      requesterName: profile?['full_name'] as String? ?? 'Unknown',
      requesterAvatar: profile?['avatar_url'] as String?,
      requesterHeadline: profile?['headline'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}
