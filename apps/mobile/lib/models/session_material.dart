/// Model for Session Materials/Resources
import 'package:flutter/material.dart';

class SessionMaterial {
  final String id;
  final String sessionId;
  final String eventId;
  final String title;
  final String? description;
  final String fileUrl;
  final String fileType; // 'pdf', 'slides', 'video', 'link', 'code', 'other'
  final int? fileSizeBytes;
  final int downloadCount;
  final bool isDownloadable;
  final int sortOrder;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const SessionMaterial({
    required this.id,
    required this.sessionId,
    required this.eventId,
    required this.title,
    this.description,
    required this.fileUrl,
    required this.fileType,
    this.fileSizeBytes,
    this.downloadCount = 0,
    this.isDownloadable = true,
    this.sortOrder = 0,
    required this.createdAt,
    this.updatedAt,
  });

  factory SessionMaterial.fromJson(Map<String, dynamic> json) {
    return SessionMaterial(
      id: json['id'] as String,
      sessionId: json['session_id'] as String,
      eventId: json['event_id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      fileUrl: json['file_url'] as String,
      fileType: json['file_type'] as String,
      fileSizeBytes: json['file_size_bytes'] as int?,
      downloadCount: json['download_count'] as int? ?? 0,
      isDownloadable: json['is_downloadable'] as bool? ?? true,
      sortOrder: json['sort_order'] as int? ?? 0,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'session_id': sessionId,
        'event_id': eventId,
        'title': title,
        'description': description,
        'file_url': fileUrl,
        'file_type': fileType,
        'file_size_bytes': fileSizeBytes,
        'is_downloadable': isDownloadable,
        'sort_order': sortOrder,
      };

  /// Get icon based on file type
  IconData get typeIcon {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return Icons.picture_as_pdf_rounded;
      case 'slides':
        return Icons.slideshow_rounded;
      case 'video':
        return Icons.video_library_rounded;
      case 'link':
        return Icons.link_rounded;
      case 'code':
        return Icons.code_rounded;
      default:
        return Icons.insert_drive_file_rounded;
    }
  }

  /// Get color based on file type
  Color get typeColor {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return Colors.red;
      case 'slides':
        return Colors.orange;
      case 'video':
        return Colors.purple;
      case 'link':
        return Colors.blue;
      case 'code':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  /// Format file size for display
  String get formattedSize {
    if (fileSizeBytes == null) return '';
    final bytes = fileSizeBytes!;
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  /// Alias for formattedSize for compatibility
  String? get fileSizeFormatted => fileSizeBytes != null ? formattedSize : null;

  SessionMaterial copyWith({
    String? id,
    String? sessionId,
    String? eventId,
    String? title,
    String? description,
    String? fileUrl,
    String? fileType,
    int? fileSizeBytes,
    int? downloadCount,
    bool? isDownloadable,
    int? sortOrder,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return SessionMaterial(
      id: id ?? this.id,
      sessionId: sessionId ?? this.sessionId,
      eventId: eventId ?? this.eventId,
      title: title ?? this.title,
      description: description ?? this.description,
      fileUrl: fileUrl ?? this.fileUrl,
      fileType: fileType ?? this.fileType,
      fileSizeBytes: fileSizeBytes ?? this.fileSizeBytes,
      downloadCount: downloadCount ?? this.downloadCount,
      isDownloadable: isDownloadable ?? this.isDownloadable,
      sortOrder: sortOrder ?? this.sortOrder,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
