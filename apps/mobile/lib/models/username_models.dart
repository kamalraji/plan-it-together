/// Result from server-side username availability check via RPC.
/// 
/// Maps to the JSON response from `check_username_availability` function:
/// ```sql
/// RETURN jsonb_build_object(
///   'available', true/false,
///   'reason', 'empty'|'invalid_format'|'reserved'|'taken'|null,
///   'message', 'Human readable message'
/// );
/// ```
class UsernameCheckResult {
  final bool available;
  final String? reason;
  final String message;

  const UsernameCheckResult({
    required this.available,
    this.reason,
    required this.message,
  });

  factory UsernameCheckResult.fromJson(Map<String, dynamic> json) {
    return UsernameCheckResult(
      available: json['available'] as bool,
      reason: json['reason'] as String?,
      message: json['message'] as String,
    );
  }

  /// Username is already taken by another user
  bool get isTaken => reason == 'taken';

  /// Username is in the reserved_usernames table
  bool get isReserved => reason == 'reserved';

  /// Username format is invalid (wrong chars, length, etc.)
  bool get isInvalidFormat => reason == 'invalid_format';

  /// Username is empty or null
  bool get isEmpty => reason == 'empty';

  /// An error occurred during the check
  bool get isError => reason == 'error';

  @override
  String toString() => 'UsernameCheckResult(available: $available, reason: $reason, message: $message)';
}
