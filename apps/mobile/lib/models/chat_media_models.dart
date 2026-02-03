/// Models for chat media gallery

enum MediaType {
  photo,
  video,
  document,
  link;

  String get label {
    switch (this) {
      case photo:
        return 'Photos';
      case video:
        return 'Videos';
      case document:
        return 'Documents';
      case link:
        return 'Links';
    }
  }

  String get icon {
    switch (this) {
      case photo:
        return '📷';
      case video:
        return '🎬';
      case document:
        return '📄';
      case link:
        return '🔗';
    }
  }
}

/// Represents a media item in chat
class ChatMediaItem {
  final String id;
  final String messageId;
  final String channelId;
  final String senderId;
  final String? senderName;
  final MediaType type;
  final String url;
  final String? thumbnailUrl;
  final String? fileName;
  final String? mimeType;
  final int? fileSizeBytes;
  final int? width;
  final int? height;
  final int? durationSeconds;
  final String? linkTitle;
  final String? linkDescription;
  final String? linkDomain;
  final DateTime createdAt;

  ChatMediaItem({
    required this.id,
    required this.messageId,
    required this.channelId,
    required this.senderId,
    this.senderName,
    required this.type,
    required this.url,
    this.thumbnailUrl,
    this.fileName,
    this.mimeType,
    this.fileSizeBytes,
    this.width,
    this.height,
    this.durationSeconds,
    this.linkTitle,
    this.linkDescription,
    this.linkDomain,
    required this.createdAt,
  });

  factory ChatMediaItem.fromJson(Map<String, dynamic> json) {
    return ChatMediaItem(
      id: json['id'] as String,
      messageId: json['message_id'] as String,
      channelId: json['channel_id'] as String,
      senderId: json['sender_id'] as String,
      senderName: json['sender_name'] as String?,
      type: _parseMediaType(json),
      url: json['url'] as String? ?? '',
      thumbnailUrl: json['thumbnail_url'] as String?,
      fileName: json['file_name'] as String?,
      mimeType: json['mime_type'] as String?,
      fileSizeBytes: json['file_size_bytes'] as int?,
      width: json['width'] as int?,
      height: json['height'] as int?,
      durationSeconds: json['duration_seconds'] as int?,
      linkTitle: json['link_title'] as String?,
      linkDescription: json['link_description'] as String?,
      linkDomain: json['link_domain'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  static MediaType _parseMediaType(Map<String, dynamic> json) {
    final typeStr = json['type'] as String? ?? '';
    final mimeType = json['mime_type'] as String? ?? '';

    if (typeStr == 'link' || json['link_url'] != null) return MediaType.link;
    if (mimeType.startsWith('image/')) return MediaType.photo;
    if (mimeType.startsWith('video/')) return MediaType.video;
    if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) {
      return MediaType.document;
    }

    switch (typeStr) {
      case 'photo':
      case 'image':
        return MediaType.photo;
      case 'video':
        return MediaType.video;
      case 'document':
      case 'file':
        return MediaType.document;
      case 'link':
        return MediaType.link;
      default:
        return MediaType.document;
    }
  }

  String get fileSizeFormatted {
    if (fileSizeBytes == null) return '';
    if (fileSizeBytes! < 1024) return '$fileSizeBytes B';
    if (fileSizeBytes! < 1024 * 1024) {
      return '${(fileSizeBytes! / 1024).toStringAsFixed(1)} KB';
    }
    if (fileSizeBytes! < 1024 * 1024 * 1024) {
      return '${(fileSizeBytes! / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    return '${(fileSizeBytes! / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
  }

  String get durationFormatted {
    if (durationSeconds == null) return '';
    final mins = durationSeconds! ~/ 60;
    final secs = durationSeconds! % 60;
    return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }
}

/// Grouped media items by date
class MediaDateGroup {
  final DateTime date;
  final List<ChatMediaItem> items;

  MediaDateGroup({
    required this.date,
    required this.items,
  });

  String get dateLabel {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final groupDate = DateTime(date.year, date.month, date.day);

    if (groupDate == today) return 'Today';
    if (groupDate == yesterday) return 'Yesterday';
    if (now.difference(date).inDays < 7) {
      return _weekdayName(date.weekday);
    }
    if (date.year == now.year) {
      return '${_monthName(date.month)} ${date.day}';
    }
    return '${_monthName(date.month)} ${date.day}, ${date.year}';
  }

  static String _weekdayName(int weekday) {
    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ];
    return days[weekday - 1];
  }

  static String _monthName(int month) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    return months[month - 1];
  }
}
