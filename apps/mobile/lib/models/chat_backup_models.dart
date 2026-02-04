/// Chat Backup Models
/// 
/// Defines data models for chat backup and restore functionality
/// with AES-256-GCM encryption support.

/// Backup frequency options for scheduled backups
enum BackupFrequency {
  daily,
  weekly,
  monthly,
  never;
  
  String get label {
    switch (this) {
      case BackupFrequency.daily:
        return 'Daily';
      case BackupFrequency.weekly:
        return 'Weekly';
      case BackupFrequency.monthly:
        return 'Monthly';
      case BackupFrequency.never:
        return 'Never';
    }
  }
  
  static BackupFrequency fromString(String value) {
    switch (value.toLowerCase()) {
      case 'daily':
        return BackupFrequency.daily;
      case 'weekly':
        return BackupFrequency.weekly;
      case 'monthly':
        return BackupFrequency.monthly;
      default:
        return BackupFrequency.never;
    }
  }
}

/// Backup type - manual or automated
enum BackupType {
  manual,
  scheduled;
  
  String get label {
    switch (this) {
      case BackupType.manual:
        return 'Manual';
      case BackupType.scheduled:
        return 'Scheduled';
    }
  }
  
  static BackupType fromString(String value) {
    return value.toLowerCase() == 'scheduled' 
        ? BackupType.scheduled 
        : BackupType.manual;
  }
}

/// Backup status during the backup process
enum BackupStatus {
  pending,
  inProgress,
  completed,
  failed;
  
  String get label {
    switch (this) {
      case BackupStatus.pending:
        return 'Pending';
      case BackupStatus.inProgress:
        return 'In Progress';
      case BackupStatus.completed:
        return 'Completed';
      case BackupStatus.failed:
        return 'Failed';
    }
  }
  
  static BackupStatus fromString(String value) {
    switch (value.toLowerCase().replaceAll('_', '')) {
      case 'pending':
        return BackupStatus.pending;
      case 'inprogress':
        return BackupStatus.inProgress;
      case 'completed':
        return BackupStatus.completed;
      case 'failed':
        return BackupStatus.failed;
      default:
        return BackupStatus.pending;
    }
  }
}

/// Represents a single chat backup record
class ChatBackup {
  final String id;
  final String userId;
  final BackupType backupType;
  final BackupStatus status;
  final int messageCount;
  final int? channelCount;
  final int? fileSizeBytes;
  final bool includeMedia;
  final String? storagePath;
  final String? encryptionKeyHash;
  final String? errorMessage;
  final Map<String, dynamic>? metadata;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final DateTime? expiresAt;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  const ChatBackup({
    required this.id,
    required this.userId,
    required this.backupType,
    required this.status,
    this.messageCount = 0,
    this.channelCount,
    this.fileSizeBytes,
    this.includeMedia = false,
    this.storagePath,
    this.encryptionKeyHash,
    this.errorMessage,
    this.metadata,
    this.startedAt,
    this.completedAt,
    this.expiresAt,
    required this.createdAt,
    required this.updatedAt,
  });
  
  /// Human-readable file size
  String get formattedSize {
    if (fileSizeBytes == null || fileSizeBytes == 0) return '0 B';
    final bytes = fileSizeBytes!;
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
  }
  
  /// Duration of backup process
  Duration? get duration {
    if (startedAt == null || completedAt == null) return null;
    return completedAt!.difference(startedAt!);
  }
  
  /// Whether this backup is encrypted
  bool get isEncrypted => encryptionKeyHash != null && encryptionKeyHash!.isNotEmpty;
  
  /// Whether this backup has expired
  bool get isExpired => expiresAt != null && DateTime.now().isAfter(expiresAt!);
  
  Map<String, dynamic> toJson() => {
    'id': id,
    'user_id': userId,
    'backup_type': backupType.name,
    'status': status.name,
    'message_count': messageCount,
    'channel_count': channelCount,
    'file_size_bytes': fileSizeBytes,
    'include_media': includeMedia,
    'storage_path': storagePath,
    'encryption_key_hash': encryptionKeyHash,
    'error_message': errorMessage,
    'metadata': metadata,
    'started_at': startedAt?.toIso8601String(),
    'completed_at': completedAt?.toIso8601String(),
    'expires_at': expiresAt?.toIso8601String(),
    'created_at': createdAt.toIso8601String(),
    'updated_at': updatedAt.toIso8601String(),
  };
  
  factory ChatBackup.fromJson(Map<String, dynamic> json) {
    DateTime? parseDateTime(dynamic value) {
      if (value == null) return null;
      if (value is String) {
        try { return DateTime.parse(value); } catch (_) { return null; }
      }
      return null;
    }
    
    return ChatBackup(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      backupType: BackupType.fromString(json['backup_type'] as String? ?? 'manual'),
      status: BackupStatus.fromString(json['status'] as String? ?? 'pending'),
      messageCount: json['message_count'] as int? ?? 0,
      channelCount: json['channel_count'] as int?,
      fileSizeBytes: json['file_size_bytes'] as int?,
      includeMedia: json['include_media'] as bool? ?? false,
      storagePath: json['storage_path'] as String?,
      encryptionKeyHash: json['encryption_key_hash'] as String?,
      errorMessage: json['error_message'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      startedAt: parseDateTime(json['started_at']),
      completedAt: parseDateTime(json['completed_at']),
      expiresAt: parseDateTime(json['expires_at']),
      createdAt: parseDateTime(json['created_at']) ?? DateTime.now(),
      updatedAt: parseDateTime(json['updated_at']) ?? DateTime.now(),
    );
  }
  
  ChatBackup copyWith({
    String? id,
    String? userId,
    BackupType? backupType,
    BackupStatus? status,
    int? messageCount,
    int? channelCount,
    int? fileSizeBytes,
    bool? includeMedia,
    String? storagePath,
    String? encryptionKeyHash,
    String? errorMessage,
    Map<String, dynamic>? metadata,
    DateTime? startedAt,
    DateTime? completedAt,
    DateTime? expiresAt,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => ChatBackup(
    id: id ?? this.id,
    userId: userId ?? this.userId,
    backupType: backupType ?? this.backupType,
    status: status ?? this.status,
    messageCount: messageCount ?? this.messageCount,
    channelCount: channelCount ?? this.channelCount,
    fileSizeBytes: fileSizeBytes ?? this.fileSizeBytes,
    includeMedia: includeMedia ?? this.includeMedia,
    storagePath: storagePath ?? this.storagePath,
    encryptionKeyHash: encryptionKeyHash ?? this.encryptionKeyHash,
    errorMessage: errorMessage ?? this.errorMessage,
    metadata: metadata ?? this.metadata,
    startedAt: startedAt ?? this.startedAt,
    completedAt: completedAt ?? this.completedAt,
    expiresAt: expiresAt ?? this.expiresAt,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
  );
}

/// Backup schedule configuration
class BackupSchedule {
  final String id;
  final String userId;
  final bool enabled;
  final BackupFrequency frequency;
  final bool includeMedia;
  final int retainCount;
  final DateTime? lastBackupAt;
  final DateTime? nextBackupAt;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  const BackupSchedule({
    required this.id,
    required this.userId,
    required this.enabled,
    required this.frequency,
    this.includeMedia = true,
    this.retainCount = 5,
    this.lastBackupAt,
    this.nextBackupAt,
    required this.createdAt,
    required this.updatedAt,
  });
  
  /// Get next scheduled backup time based on frequency
  DateTime? get calculatedNextBackup {
    if (!enabled || frequency == BackupFrequency.never) return null;
    
    final base = lastBackupAt ?? createdAt;
    switch (frequency) {
      case BackupFrequency.daily:
        return base.add(const Duration(days: 1));
      case BackupFrequency.weekly:
        return base.add(const Duration(days: 7));
      case BackupFrequency.monthly:
        return DateTime(base.year, base.month + 1, base.day);
      case BackupFrequency.never:
        return null;
    }
  }
  
  /// Check if backup is due now
  bool get isDue {
    if (!enabled || frequency == BackupFrequency.never) return false;
    final next = nextBackupAt ?? calculatedNextBackup;
    return next != null && DateTime.now().isAfter(next);
  }
  
  Map<String, dynamic> toJson() => {
    'id': id,
    'user_id': userId,
    'enabled': enabled,
    'frequency': frequency.name,
    'include_media': includeMedia,
    'retain_count': retainCount,
    'last_backup_at': lastBackupAt?.toIso8601String(),
    'next_backup_at': nextBackupAt?.toIso8601String(),
    'created_at': createdAt.toIso8601String(),
    'updated_at': updatedAt.toIso8601String(),
  };
  
  factory BackupSchedule.fromJson(Map<String, dynamic> json) {
    DateTime? parseDateTime(dynamic value) {
      if (value == null) return null;
      if (value is String) {
        try { return DateTime.parse(value); } catch (_) { return null; }
      }
      return null;
    }
    
    return BackupSchedule(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      enabled: json['enabled'] as bool? ?? false,
      frequency: BackupFrequency.fromString(json['frequency'] as String? ?? 'weekly'),
      includeMedia: json['include_media'] as bool? ?? true,
      retainCount: json['retain_count'] as int? ?? 5,
      lastBackupAt: parseDateTime(json['last_backup_at']),
      nextBackupAt: parseDateTime(json['next_backup_at']),
      createdAt: parseDateTime(json['created_at']) ?? DateTime.now(),
      updatedAt: parseDateTime(json['updated_at']) ?? DateTime.now(),
    );
  }
  
  BackupSchedule copyWith({
    String? id,
    String? userId,
    bool? enabled,
    BackupFrequency? frequency,
    bool? includeMedia,
    int? retainCount,
    DateTime? lastBackupAt,
    DateTime? nextBackupAt,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => BackupSchedule(
    id: id ?? this.id,
    userId: userId ?? this.userId,
    enabled: enabled ?? this.enabled,
    frequency: frequency ?? this.frequency,
    includeMedia: includeMedia ?? this.includeMedia,
    retainCount: retainCount ?? this.retainCount,
    lastBackupAt: lastBackupAt ?? this.lastBackupAt,
    nextBackupAt: nextBackupAt ?? this.nextBackupAt,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
  );
}

/// Backup progress callback information
class BackupProgress {
  final double progress; // 0.0 to 1.0
  final String status;
  final int processedMessages;
  final int totalMessages;
  final int processedChannels;
  final int totalChannels;
  
  const BackupProgress({
    required this.progress,
    required this.status,
    this.processedMessages = 0,
    this.totalMessages = 0,
    this.processedChannels = 0,
    this.totalChannels = 0,
  });
  
  /// Formatted progress percentage
  String get formattedProgress => '${(progress * 100).toInt()}%';
  
  /// Whether the backup is complete
  bool get isComplete => progress >= 1.0;
}
