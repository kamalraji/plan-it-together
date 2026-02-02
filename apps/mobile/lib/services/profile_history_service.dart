import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/utils/result.dart';

/// A single profile change record
class ProfileChangeRecord {
  final String id;
  final String userId;
  final String fieldName;
  final String? oldValue;
  final String? newValue;
  final DateTime changedAt;

  const ProfileChangeRecord({
    required this.id,
    required this.userId,
    required this.fieldName,
    this.oldValue,
    this.newValue,
    required this.changedAt,
  });

  factory ProfileChangeRecord.fromJson(Map<String, dynamic> json) {
    return ProfileChangeRecord(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      fieldName: json['field_name'] as String,
      oldValue: json['old_value'] as String?,
      newValue: json['new_value'] as String?,
      changedAt: DateTime.parse(json['changed_at'] as String),
    );
  }

  /// Returns a human-readable field name
  String get displayFieldName {
    switch (fieldName) {
      case 'username':
        return 'Username';
      case 'full_name':
        return 'Full Name';
      case 'avatar_url':
        return 'Profile Photo';
      case 'cover_image_url':
        return 'Cover Image';
      case 'cover_gradient_id':
        return 'Cover Theme';
      case 'bio':
        return 'Bio';
      case 'organization':
        return 'Organization';
      case 'phone':
        return 'Phone';
      case 'website':
        return 'Website';
      case 'linkedin_url':
        return 'LinkedIn';
      case 'twitter_url':
        return 'X/Twitter';
      case 'github_url':
        return 'GitHub';
      default:
        return fieldName.replaceAll('_', ' ').split(' ').map((word) =>
            word.isNotEmpty ? '${word[0].toUpperCase()}${word.substring(1)}' : ''
        ).join(' ');
    }
  }

  /// Returns icon name for the field
  String get iconName {
    switch (fieldName) {
      case 'username':
        return 'alternate_email';
      case 'full_name':
        return 'person';
      case 'avatar_url':
        return 'account_circle';
      case 'cover_image_url':
      case 'cover_gradient_id':
        return 'wallpaper';
      case 'bio':
        return 'description';
      case 'organization':
        return 'business';
      case 'phone':
        return 'phone';
      case 'website':
        return 'language';
      case 'linkedin_url':
        return 'work';
      case 'twitter_url':
        return 'tag';
      case 'github_url':
        return 'code';
      default:
        return 'edit';
    }
  }

  /// Format the change description
  String get changeDescription {
    if (oldValue == null && newValue != null) {
      return 'Set to "${_truncate(newValue!)}"';
    } else if (oldValue != null && newValue == null) {
      return 'Removed "${_truncate(oldValue!)}"';
    } else if (oldValue != null && newValue != null) {
      if (fieldName.contains('_url') || fieldName == 'avatar_url') {
        return 'Updated';
      }
      return 'Changed from "${_truncate(oldValue!)}" to "${_truncate(newValue!)}"';
    }
    return 'Updated';
  }

  String _truncate(String value, {int maxLength = 30}) {
    if (value.length <= maxLength) return value;
    return '${value.substring(0, maxLength)}...';
  }
}

/// Service for tracking and retrieving profile change history
class ProfileHistoryService extends BaseService {
  static ProfileHistoryService? _instance;
  static ProfileHistoryService get instance => _instance ??= ProfileHistoryService._();
  ProfileHistoryService._();

  @override
  String get tag => 'ProfileHistory';

  final _supabase = SupabaseConfig.client;

  /// Tracks a single field change
  Future<Result<void>> trackChange({
    required String userId,
    required String fieldName,
    String? oldValue,
    String? newValue,
  }) => execute(() async {
    // Don't track if values are the same
    if (oldValue == newValue) return;
    
    // Don't track if both are null/empty
    if ((oldValue == null || oldValue.isEmpty) && 
        (newValue == null || newValue.isEmpty)) {
      return;
    }

    await _supabase.from('profile_change_history').insert({
      'user_id': userId,
      'field_name': fieldName,
      'old_value': oldValue,
      'new_value': newValue,
      'changed_at': DateTime.now().toIso8601String(),
    });
    
    logDbOperation('INSERT', 'profile_change_history', rowCount: 1);
    logDebug('Tracked change', metadata: {'field': fieldName});
  }, operationName: 'trackChange');

  /// Tracks multiple field changes at once
  Future<void> trackChanges({
    required String userId,
    required Map<String, dynamic> oldProfile,
    required Map<String, dynamic> newProfile,
    List<String>? fieldsToTrack,
  }) async {
    final fields = fieldsToTrack ?? [
      'username',
      'full_name',
      'avatar_url',
      'cover_image_url',
      'cover_gradient_id',
      'bio',
      'organization',
      'phone',
      'website',
      'linkedin_url',
      'twitter_url',
      'github_url',
    ];

    for (final field in fields) {
      final oldValue = oldProfile[field]?.toString();
      final newValue = newProfile[field]?.toString();
      
      if (oldValue != newValue) {
        await trackChange(
          userId: userId,
          fieldName: field,
          oldValue: oldValue,
          newValue: newValue,
        );
      }
    }
  }

  /// Gets change history for a user
  Future<Result<List<ProfileChangeRecord>>> getChangeHistory({
    required String userId,
    String? fieldName,
    int limit = 50,
  }) => execute(() async {
    var query = _supabase
        .from('profile_change_history')
        .select()
        .eq('user_id', userId);

    if (fieldName != null) {
      query = query.eq('field_name', fieldName);
    }

    final response = await query
        .order('changed_at', ascending: false)
        .limit(limit);

    final records = (response as List)
        .map((json) => ProfileChangeRecord.fromJson(json as Map<String, dynamic>))
        .toList();
    
    logDbOperation('SELECT', 'profile_change_history', rowCount: records.length);
    return records;
  }, operationName: 'getChangeHistory');

  /// Gets username change history specifically
  Future<Result<List<ProfileChangeRecord>>> getUsernameHistory(String userId) {
    return getChangeHistory(userId: userId, fieldName: 'username');
  }

  /// Gets avatar change history specifically
  Future<Result<List<ProfileChangeRecord>>> getAvatarHistory(String userId) {
    return getChangeHistory(userId: userId, fieldName: 'avatar_url');
  }

  /// Gets grouped history by date
  Future<Map<DateTime, List<ProfileChangeRecord>>> getGroupedHistory({
    required String userId,
    int limit = 100,
  }) async {
    final result = await getChangeHistory(userId: userId, limit: limit);
    final history = result is Success<List<ProfileChangeRecord>> 
        ? result.data 
        : <ProfileChangeRecord>[];
    
    final grouped = <DateTime, List<ProfileChangeRecord>>{};
    for (final record in history) {
      final dateKey = DateTime(
        record.changedAt.year,
        record.changedAt.month,
        record.changedAt.day,
      );
      grouped.putIfAbsent(dateKey, () => []).add(record);
    }
    
    return grouped;
  }
}
