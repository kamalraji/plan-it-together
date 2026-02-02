// ============================================
// CONNECTION REQUEST ITEM - COMPATIBILITY LAYER
// ============================================
// 
// @deprecated This file exists for backwards compatibility only.
// Use FollowRequest from lib/models/follower.dart instead.
//
// The app has migrated from a bidirectional "connections" model
// to a unidirectional "followers" model (Instagram/Twitter style).
// This file provides a bridge for legacy code.
// ============================================

import 'package:flutter/foundation.dart';

/// Legacy connection request item - now maps to follower requests
/// @deprecated Use FollowRequest from follower.dart instead
@immutable
class ConnectionRequestItem {
  final String id;
  final String requesterId;
  final String requesterName;
  final String? requesterAvatar;
  final String? requesterHeadline;
  final int matchScore;
  final String connectionType;
  final DateTime createdAt;

  const ConnectionRequestItem({
    required this.id,
    required this.requesterId,
    required this.requesterName,
    this.requesterAvatar,
    this.requesterHeadline,
    this.matchScore = 0,
    this.connectionType = 'Follow Request',
    required this.createdAt,
  });

  factory ConnectionRequestItem.fromMap(Map<String, dynamic> json, {
    Map<String, dynamic>? profile,
  }) {
    return ConnectionRequestItem(
      id: json['id'] as String,
      requesterId: json['follower_id'] as String? ?? json['requester_id'] as String? ?? '',
      requesterName: profile?['full_name'] as String? ?? 'Unknown',
      requesterAvatar: profile?['avatar_url'] as String?,
      requesterHeadline: profile?['headline'] as String?,
      matchScore: json['match_score'] as int? ?? 0,
      connectionType: json['connection_type'] as String? ?? 'Follow Request',
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}
