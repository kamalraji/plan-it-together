import 'package:flutter/foundation.dart';

/// Types of message attachments
enum AttachmentType {
  image,
  video,
  audio,
  file,
  gif;

  static AttachmentType fromMimeType(String mimeType) {
    if (mimeType.startsWith('image/gif')) return AttachmentType.gif;
    if (mimeType.startsWith('image/')) return AttachmentType.image;
    if (mimeType.startsWith('video/')) return AttachmentType.video;
    if (mimeType.startsWith('audio/')) return AttachmentType.audio;
    return AttachmentType.file;
  }
}

/// Attachment for a circle message
@immutable
class CircleMessageAttachment {
  final String filename;
  final String url;
  final String mimeType;
  final int? fileSize;
  final int? width;
  final int? height;
  final int? duration; // For audio/video in seconds
  final String? thumbnailUrl;

  const CircleMessageAttachment({
    required this.filename,
    required this.url,
    required this.mimeType,
    this.fileSize,
    this.width,
    this.height,
    this.duration,
    this.thumbnailUrl,
  });

  factory CircleMessageAttachment.fromMap(Map<String, dynamic> map) {
    return CircleMessageAttachment(
      filename: map['filename'] as String? ?? 'file',
      url: map['url'] as String,
      mimeType: map['mime_type'] as String? ?? 'application/octet-stream',
      fileSize: map['file_size'] as int?,
      width: map['width'] as int?,
      height: map['height'] as int?,
      duration: map['duration'] as int?,
      thumbnailUrl: map['thumbnail_url'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'filename': filename,
      'url': url,
      'mime_type': mimeType,
      if (fileSize != null) 'file_size': fileSize,
      if (width != null) 'width': width,
      if (height != null) 'height': height,
      if (duration != null) 'duration': duration,
      if (thumbnailUrl != null) 'thumbnail_url': thumbnailUrl,
    };
  }

  /// Get attachment type based on mime type
  AttachmentType get type => AttachmentType.fromMimeType(mimeType);

  /// Check if this is an image
  bool get isImage => type == AttachmentType.image || type == AttachmentType.gif;

  /// Check if this is a video
  bool get isVideo => type == AttachmentType.video;

  /// Check if this is an audio file
  bool get isAudio => type == AttachmentType.audio;

  /// Check if this is a GIF
  bool get isGif => type == AttachmentType.gif;

  /// Format file size for display
  String get formattedSize {
    if (fileSize == null) return '';
    if (fileSize! < 1024) return '$fileSize B';
    if (fileSize! < 1024 * 1024) return '${(fileSize! / 1024).toStringAsFixed(1)} KB';
    if (fileSize! < 1024 * 1024 * 1024) {
      return '${(fileSize! / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    return '${(fileSize! / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  /// Format duration for display
  String get formattedDuration {
    if (duration == null) return '';
    final minutes = duration! ~/ 60;
    final seconds = duration! % 60;
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }

  /// Get file extension
  String get extension {
    final parts = filename.split('.');
    return parts.length > 1 ? parts.last.toLowerCase() : '';
  }

  CircleMessageAttachment copyWith({
    String? filename,
    String? url,
    String? mimeType,
    int? fileSize,
    int? width,
    int? height,
    int? duration,
    String? thumbnailUrl,
  }) {
    return CircleMessageAttachment(
      filename: filename ?? this.filename,
      url: url ?? this.url,
      mimeType: mimeType ?? this.mimeType,
      fileSize: fileSize ?? this.fileSize,
      width: width ?? this.width,
      height: height ?? this.height,
      duration: duration ?? this.duration,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CircleMessageAttachment &&
          runtimeType == other.runtimeType &&
          url == other.url;

  @override
  int get hashCode => url.hashCode;
}
