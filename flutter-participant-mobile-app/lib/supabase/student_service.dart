import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/models/study_group.dart';
import 'package:thittam1hub/models/impact_profile.dart';

class StudentService {
  final SupabaseClient _client = Supabase.instance.client;

  String? get _currentUserId => _client.auth.currentUser?.id;

  // ==================== Study Groups ====================

  /// Get all active study groups, optionally filtered by college/major
  Future<List<StudyGroup>> getStudyGroups({
    String? college,
    String? major,
    String? course,
  }) async {
    var query = _client
        .from('study_groups')
        .select()
        .eq('is_active', true);

    if (college != null && college.isNotEmpty) {
      query = query.eq('college', college);
    }
    if (major != null && major.isNotEmpty) {
      query = query.eq('major', major);
    }

    final response = await query.order('created_at', ascending: false);

    List<StudyGroup> groups = (response as List)
        .map((e) => StudyGroup.fromMap(e))
        .toList();

    // Filter by course if specified
    if (course != null && course.isNotEmpty) {
      groups = groups.where((g) => g.courses.contains(course)).toList();
    }

    return groups;
  }

  /// Get study groups that match the current user's academic profile
  Future<List<StudyGroup>> getMatchedStudyGroups() async {
    if (_currentUserId == null) return [];

    // Get user's academic info
    final profileResponse = await _client
        .from('impact_profiles')
        .select('college, major, current_courses')
        .eq('user_id', _currentUserId!)
        .maybeSingle();

    if (profileResponse == null) return getStudyGroups();

    final college = profileResponse['college'] as String?;
    final major = profileResponse['major'] as String?;
    final courses = List<String>.from(profileResponse['current_courses'] ?? []);

    // Get all groups and score them
    final allGroups = await getStudyGroups();
    
    // Sort by match score
    allGroups.sort((a, b) {
      int scoreA = _calculateMatchScore(a, college, major, courses);
      int scoreB = _calculateMatchScore(b, college, major, courses);
      return scoreB.compareTo(scoreA);
    });

    return allGroups;
  }

  int _calculateMatchScore(StudyGroup group, String? college, String? major, List<String> courses) {
    int score = 0;
    
    if (college != null && group.college == college) score += 30;
    if (major != null && group.major == major) score += 25;
    
    // Course overlap
    for (final course in courses) {
      if (group.courses.contains(course)) score += 15;
    }

    return score;
  }

  /// Create a new study group
  Future<StudyGroup?> createStudyGroup({
    required String name,
    String? description,
    String? college,
    String? major,
    List<String> courses = const [],
    int maxMembers = 10,
  }) async {
    if (_currentUserId == null) return null;

    final response = await _client.from('study_groups').insert({
      'name': name,
      'description': description,
      'college': college,
      'major': major,
      'courses': courses,
      'max_members': maxMembers,
      'created_by': _currentUserId,
    }).select().single();

    final group = StudyGroup.fromMap(response);

    // Auto-join as admin
    await joinStudyGroup(group.id, role: 'admin');

    return group;
  }

  /// Join a study group
  Future<bool> joinStudyGroup(String groupId, {String role = 'member'}) async {
    if (_currentUserId == null) return false;

    try {
      await _client.from('study_group_members').insert({
        'group_id': groupId,
        'user_id': _currentUserId,
        'role': role,
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Leave a study group
  Future<bool> leaveStudyGroup(String groupId) async {
    if (_currentUserId == null) return false;

    try {
      await _client
          .from('study_group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', _currentUserId!);
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Check if current user is a member of a group
  Future<bool> isMember(String groupId) async {
    if (_currentUserId == null) return false;

    final response = await _client
        .from('study_group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', _currentUserId!)
        .maybeSingle();

    return response != null;
  }

  /// Get members of a study group
  Future<List<StudyGroupMember>> getGroupMembers(String groupId) async {
    final response = await _client
        .from('study_group_members')
        .select()
        .eq('group_id', groupId)
        .order('joined_at');

    return (response as List).map((e) => StudyGroupMember.fromMap(e)).toList();
  }

  /// Get user's joined study groups
  Future<List<StudyGroup>> getMyStudyGroups() async {
    if (_currentUserId == null) return [];

    final memberships = await _client
        .from('study_group_members')
        .select('group_id')
        .eq('user_id', _currentUserId!);

    if (memberships.isEmpty) return [];

    final groupIds = (memberships as List).map((e) => e['group_id']).toList();

    final response = await _client
        .from('study_groups')
        .select()
        .inFilter('id', groupIds)
        .eq('is_active', true);

    return (response as List).map((e) => StudyGroup.fromMap(e)).toList();
  }

  // ==================== Study Partner Finder ====================

  /// Find potential study partners based on academic overlap
  Future<List<ImpactProfile>> findStudyPartners({
    String? college,
    String? major,
    List<String>? courses,
    List<String>? skills,
  }) async {
    if (_currentUserId == null) return [];

    var query = _client
        .from('impact_profiles')
        .select()
        .neq('user_id', _currentUserId!);

    if (college != null && college.isNotEmpty) {
      query = query.eq('college', college);
    }
    if (major != null && major.isNotEmpty) {
      query = query.eq('major', major);
    }

    final response = await query.limit(50);

    List<ImpactProfile> profiles = (response as List)
        .map((e) => ImpactProfile.fromMap(e))
        .toList();

    // Score and sort by relevance
    if (courses != null && courses.isNotEmpty || skills != null && skills.isNotEmpty) {
      profiles.sort((a, b) {
        int scoreA = _calculatePartnerScore(a, courses ?? [], skills ?? []);
        int scoreB = _calculatePartnerScore(b, courses ?? [], skills ?? []);
        return scoreB.compareTo(scoreA);
      });
    }

    return profiles;
  }

  int _calculatePartnerScore(ImpactProfile profile, List<String> courses, List<String> skills) {
    int score = 0;

    // Skill overlap (complementary skills are valuable)
    for (final skill in skills) {
      if (profile.skills.contains(skill)) score += 10;
    }

    // Interest overlap
    for (final interest in profile.interests) {
      if (skills.contains(interest)) score += 5;
    }

    return score;
  }

  // ==================== Academic Profile ====================

  /// Update user's academic info
  Future<bool> updateAcademicProfile({
    String? college,
    String? major,
    int? graduationYear,
    List<String>? currentCourses,
  }) async {
    if (_currentUserId == null) return false;

    try {
      final updates = <String, dynamic>{};
      if (college != null) updates['college'] = college;
      if (major != null) updates['major'] = major;
      if (graduationYear != null) updates['graduation_year'] = graduationYear;
      if (currentCourses != null) updates['current_courses'] = currentCourses;

      if (updates.isEmpty) return true;

      await _client
          .from('impact_profiles')
          .update(updates)
          .eq('user_id', _currentUserId!);

      return true;
    } catch (e) {
      return false;
    }
  }

  /// Get user's academic profile
  Future<Map<String, dynamic>?> getAcademicProfile(String userId) async {
    final response = await _client
        .from('impact_profiles')
        .select('college, major, graduation_year, current_courses')
        .eq('user_id', userId)
        .maybeSingle();

    return response;
  }
}
