/// Poll model for spark posts
class PostPoll {
  final List<String> options;
  final Duration duration;
  final DateTime? expiresAt;

  const PostPoll({
    required this.options,
    required this.duration,
    this.expiresAt,
  });

  /// Validate poll configuration
  String? validate() {
    if (options.length < 2) {
      return 'Poll requires at least 2 options';
    }
    
    if (options.length > 4) {
      return 'Poll can have at most 4 options';
    }
    
    final filledOptions = options.where((o) => o.trim().isNotEmpty).toList();
    
    if (filledOptions.length < 2) {
      return 'Fill in at least 2 options';
    }
    
    // Check for duplicates (case-insensitive)
    final normalized = filledOptions.map((o) => o.trim().toLowerCase()).toSet();
    if (normalized.length != filledOptions.length) {
      return 'Options must be unique';
    }
    
    // Check option length
    for (final option in filledOptions) {
      if (option.length > 100) {
        return 'Options must be under 100 characters';
      }
    }
    
    return null; // Valid
  }

  bool get isValid => validate() == null;

  /// Get filtered non-empty options
  List<String> get validOptions => 
      options.where((o) => o.trim().isNotEmpty).map((o) => o.trim()).toList();

  /// Calculate expiration time from now
  DateTime get calculatedExpiresAt => 
      expiresAt ?? DateTime.now().add(duration);

  /// Convert to map for database storage
  Map<String, dynamic> toMap() {
    return {
      'options': validOptions.asMap().map((i, opt) => MapEntry(
        'option_${i + 1}',
        {'text': opt, 'votes': 0},
      )),
      'expires_at': calculatedExpiresAt.toIso8601String(),
    };
  }

  /// Create copy with updated options
  PostPoll copyWith({
    List<String>? options,
    Duration? duration,
    DateTime? expiresAt,
  }) {
    return PostPoll(
      options: options ?? this.options,
      duration: duration ?? this.duration,
      expiresAt: expiresAt ?? this.expiresAt,
    );
  }
}

/// Available poll duration options
class PollDuration {
  static const Duration oneHour = Duration(hours: 1);
  static const Duration sixHours = Duration(hours: 6);
  static const Duration twelveHours = Duration(hours: 12);
  static const Duration oneDay = Duration(hours: 24);
  static const Duration threeDays = Duration(days: 3);
  static const Duration sevenDays = Duration(days: 7);

  static const List<({String label, Duration duration})> options = [
    (label: '1h', duration: oneHour),
    (label: '6h', duration: sixHours),
    (label: '12h', duration: twelveHours),
    (label: '24h', duration: oneDay),
    (label: '3d', duration: threeDays),
    (label: '7d', duration: sevenDays),
  ];
}
