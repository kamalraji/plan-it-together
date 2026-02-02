/// Model for forwarded message metadata extracted from attachments
class ForwardedMessageAttachment {
  final String originalMessageId;
  final String originalSenderName;
  final String? originalSenderAvatar;
  final DateTime originalSentAt;
  final String originalContent;

  const ForwardedMessageAttachment({
    required this.originalMessageId,
    required this.originalSenderName,
    this.originalSenderAvatar,
    required this.originalSentAt,
    required this.originalContent,
  });

  /// Try to parse forwarded message metadata from raw attachment
  static ForwardedMessageAttachment? tryParse(dynamic raw) {
    if (raw == null || raw is! Map) return null;
    
    final map = Map<String, dynamic>.from(raw);
    if (map['type'] != 'forwarded_message') return null;

    try {
      return ForwardedMessageAttachment(
        originalMessageId: map['original_message_id'] as String? ?? '',
        originalSenderName: map['original_sender_name'] as String? ?? 'Unknown',
        originalSenderAvatar: map['original_sender_avatar'] as String?,
        originalSentAt: map['original_sent_at'] != null
            ? DateTime.parse(map['original_sent_at'] as String)
            : DateTime.now(),
        originalContent: map['original_content'] as String? ?? '',
      );
    } catch (_) {
      return null;
    }
  }
}
