import 'package:thittam1hub/models/username_models.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/utils/username_validators.dart';

/// Service for username availability checking and management.
/// 
/// Features:
/// - Server-side validation via RPC function
/// - Real-time availability checking with reserved username support
/// - Username suggestions
/// - Rate limiting for username changes (30-day cooldown enforced by DB trigger)
class UsernameService {
  static UsernameService? _instance;
  static UsernameService get instance => _instance ??= UsernameService._();
  UsernameService._();
  
  static final _log = LoggingService.instance;
  static const String _tag = 'UsernameService';

  /// Check username availability using server-side validation RPC.
  /// 
  /// Uses the `check_username_availability` PostgreSQL function which:
  /// - Validates format (3-30 chars, starts with letter, alphanumeric + underscores)
  /// - Checks against reserved_usernames table
  /// - Checks for existing users (case-insensitive)
  /// 
  /// Returns detailed [UsernameCheckResult] with reason and message.
  Future<UsernameCheckResult> checkUsernameAvailability(
    String username, {
    String? excludeUserId,
  }) async {
    try {
      final result = await SupabaseConfig.client.rpc(
        'check_username_availability',
        params: {
          '_username': username,
          '_user_id': excludeUserId,
        },
      );

      final checkResult = UsernameCheckResult.fromJson(result as Map<String, dynamic>);
      
      _log.debug(
        checkResult.available
            ? 'Username available'
            : 'Username unavailable: ${checkResult.message}',
        tag: _tag,
        metadata: {'username': username},
      );
      
      return checkResult;
    } catch (e) {
      _log.error('Username availability check failed', tag: _tag, error: e);
      return UsernameCheckResult(
        available: false,
        reason: 'error',
        message: 'Unable to check availability. Please try again.',
      );
    }
  }

  /// Simple boolean check for backward compatibility.
  /// 
  /// For detailed results, use [checkUsernameAvailability] instead.
  Future<bool> isUsernameAvailable(String username, {String? excludeUserId}) async {
    // Quick client-side validation first
    final validationError = UsernameValidators.validateUsername(username);
    if (validationError != null) {
      _log.debug('Username validation failed locally', tag: _tag, metadata: {'error': validationError});
      return false;
    }

    final result = await checkUsernameAvailability(username, excludeUserId: excludeUserId);
    return result.available;
  }
  
  /// Check availability returning a simple result object with isAvailable flag.
  /// This is for backwards compatibility with UI code.
  Future<({bool isAvailable, String? message})> checkAvailability(String username, {String? excludeUserId}) async {
    final result = await checkUsernameAvailability(username, excludeUserId: excludeUserId);
    return (isAvailable: result.available, message: result.message);
  }
  
  /// Update username for a user. 
  /// This is an alias for claimUsername for backwards compatibility.
  Future<void> updateUsername(String userId, String username) async {
    final success = await claimUsername(userId, username);
    if (!success) {
      throw Exception('Failed to update username. It may be taken or you need to wait for cooldown.');
    }
  }

  /// Fetch reserved usernames from database for client-side hints.
  /// 
  /// Useful for pre-populating the client-side reserved list.
  Future<Set<String>> fetchReservedUsernames() async {
    try {
      final results = await SupabaseConfig.client
          .from('reserved_usernames')
          .select('username');

      final reserved = (results as List)
          .map((r) => (r['username'] as String).toLowerCase())
          .toSet();
      
      _log.debug('Fetched reserved usernames', tag: _tag, metadata: {'count': reserved.length});
      return reserved;
    } catch (e) {
      _log.warning('Failed to fetch reserved usernames', tag: _tag, error: e);
      return {};
    }
  }

  /// Get suggested usernames based on full name
  /// 
  /// Returns list of available username suggestions
  Future<List<String>> suggestUsernames(String fullName) async {
    final suggestions = UsernameValidators.generateSuggestions(fullName);
    final availableSuggestions = <String>[];

    for (final suggestion in suggestions) {
      if (await isUsernameAvailable(suggestion)) {
        availableSuggestions.add(suggestion);
        // Limit to 5 available suggestions
        if (availableSuggestions.length >= 5) break;
      }
    }

    return availableSuggestions;
  }

  /// Claim username for a user (atomic operation)
  /// 
  /// Returns true if successfully claimed, false if taken or error
  Future<bool> claimUsername(String userId, String username) async {
    // Validate username
    final validationError = UsernameValidators.validateUsername(username);
    if (validationError != null) {
      _log.warning('Cannot claim username: validation failed', tag: _tag, metadata: {'error': validationError});
      return false;
    }

    try {
      // Check availability first
      if (!await isUsernameAvailable(username, excludeUserId: userId)) {
        return false;
      }

      // Attempt to update (unique constraint will prevent duplicates)
      await SupabaseConfig.client
          .from('user_profiles')
          .update({
            'username': username,
            'username_changed_at': DateTime.now().toIso8601String(),
          })
          .eq('id', userId);

      _log.info('Username claimed successfully', tag: _tag, metadata: {'username': username});
      return true;
    } catch (e) {
      _log.error('Claim username failed', tag: _tag, error: e);
      // If constraint violation, username was taken between check and update
      return false;
    }
  }

  /// Check if user can change their username (30-day cooldown)
  /// 
  /// Returns null if can change, or DateTime of when they can change next
  Future<DateTime?> getNextUsernameChangeDate(String userId) async {
    try {
      final result = await SupabaseConfig.client
          .from('user_profiles')
          .select('username_changed_at')
          .eq('id', userId)
          .maybeSingle();

      if (result == null || result['username_changed_at'] == null) {
        return null; // Never changed, can change now
      }

      final lastChanged = DateTime.parse(result['username_changed_at'] as String);
      final nextChangeDate = lastChanged.add(const Duration(days: 30));

      if (DateTime.now().isAfter(nextChangeDate)) {
        return null; // Cooldown expired, can change now
      }

      return nextChangeDate;
    } catch (e) {
      _log.error('Failed to get next username change date', tag: _tag, error: e);
      return null;
    }
  }

  /// Get user profile by username
  /// 
  /// Returns user ID if found, null if not found
  Future<String?> getUserIdByUsername(String username) async {
    try {
      final result = await SupabaseConfig.client
          .from('user_profiles')
          .select('id')
          .ilike('username', username)
          .maybeSingle();

      return result?['id'] as String?;
    } catch (e) {
      _log.error('Failed to get user by username', tag: _tag, error: e);
      return null;
    }
  }

  /// Get username for a user ID
  Future<String?> getUsername(String userId) async {
    try {
      final result = await SupabaseConfig.client
          .from('user_profiles')
          .select('username')
          .eq('id', userId)
          .maybeSingle();

      return result?['username'] as String?;
    } catch (e) {
      _log.error('Failed to get username', tag: _tag, error: e);
      return null;
    }
  }
}
