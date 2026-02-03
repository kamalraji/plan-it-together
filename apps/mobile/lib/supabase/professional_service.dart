import 'package:flutter/foundation.dart';
import 'package:thittam1hub/models/work_experience.dart';
import 'package:thittam1hub/models/portfolio_project.dart';
import 'package:thittam1hub/models/skill_endorsement.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';

import 'package:thittam1hub/services/logging_service.dart';
class ProfessionalService {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'ProfessionalService';

  final _supabase = SupabaseConfig.client;

  // ==================== Work Experience ====================

  Future<List<WorkExperience>> getWorkExperience(String userId) async {
    try {
      final rows = await _supabase
          .from('work_experience')
          .select('*')
          .eq('user_id', userId)
          .order('is_current', ascending: false)
          .order('start_date', ascending: false);
      
      return (rows as List)
          .map((e) => WorkExperience.fromMap(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Error fetching work experience: $e', tag: _tag);
      return [];
    }
  }

  // Backwards-compatible alias
  Future<List<WorkExperience>> getWorkExperiences(String userId) => getWorkExperience(userId);

  Future<WorkExperience?> addWorkExperience({
    required String title,
    required String company,
    String? companyLogoUrl,
    String? location,
    required DateTime startDate,
    DateTime? endDate,
    required bool isCurrent,
    String? description,
  }) async {
    try {
      final uid = _supabase.auth.currentUser?.id;
      if (uid == null) throw Exception('Not authenticated');

      final data = {
        'user_id': uid,
        'title': title,
        'company': company,
        'company_logo_url': companyLogoUrl,
        'location': location,
        'start_date': startDate.toIso8601String().split('T').first,
        'end_date': endDate?.toIso8601String().split('T').first,
        'is_current': isCurrent,
        'description': description,
      };

      final result = await _supabase
          .from('work_experience')
          .insert(data)
          .select()
          .single();

      return WorkExperience.fromMap(result);
    } catch (e) {
      _log.error('Error adding work experience: $e', tag: _tag);
      rethrow;
    }
  }

  Future<void> updateWorkExperience(WorkExperience experience) async {
    try {
      await _supabase
          .from('work_experience')
          .update(experience.toMap())
          .eq('id', experience.id);
    } catch (e) {
      _log.error('Error updating work experience: $e', tag: _tag);
      rethrow;
    }
  }

  Future<void> deleteWorkExperience(String id) async {
    try {
      await _supabase.from('work_experience').delete().eq('id', id);
    } catch (e) {
      _log.error('Error deleting work experience: $e', tag: _tag);
      rethrow;
    }
  }

  // ==================== Portfolio Projects ====================

  Future<List<PortfolioProject>> getPortfolioProjects(String userId) async {
    try {
      final rows = await _supabase
          .from('portfolio_projects')
          .select('*')
          .eq('user_id', userId)
          .order('project_date', ascending: false);
      
      return (rows as List)
          .map((e) => PortfolioProject.fromMap(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Error fetching portfolio projects: $e', tag: _tag);
      return [];
    }
  }

  Future<PortfolioProject?> addProject({
    required String title,
    String? description,
    String? imageUrl,
    String? projectUrl,
    required List<String> skills,
    DateTime? projectDate,
  }) async {
    try {
      final uid = _supabase.auth.currentUser?.id;
      if (uid == null) throw Exception('Not authenticated');

      final data = {
        'user_id': uid,
        'title': title,
        'description': description,
        'image_url': imageUrl,
        'project_url': projectUrl,
        'skills': skills,
        'project_date': projectDate?.toIso8601String().split('T').first,
      };

      final result = await _supabase
          .from('portfolio_projects')
          .insert(data)
          .select()
          .single();

      return PortfolioProject.fromMap(result);
    } catch (e) {
      _log.error('Error adding project: $e', tag: _tag);
      rethrow;
    }
  }

  Future<void> updateProject(PortfolioProject project) async {
    try {
      await _supabase
          .from('portfolio_projects')
          .update(project.toMap())
          .eq('id', project.id);
    } catch (e) {
      _log.error('Error updating project: $e', tag: _tag);
      rethrow;
    }
  }

  Future<void> deleteProject(String id) async {
    try {
      await _supabase.from('portfolio_projects').delete().eq('id', id);
    } catch (e) {
      _log.error('Error deleting project: $e', tag: _tag);
      rethrow;
    }
  }

  // ==================== Skill Endorsements ====================

  Future<Map<String, SkillEndorsementSummary>> getEndorsements(String userId) async {
    try {
      final rows = await _supabase
          .from('skill_endorsements')
          .select('*, impact_profiles!endorser_user_id(full_name, avatar_url)')
          .eq('endorsed_user_id', userId)
          .order('created_at', ascending: false);
      
      final Map<String, List<SkillEndorsement>> grouped = {};
      final Map<String, List<EndorserInfo>> endorsers = {};

      for (final row in rows as List) {
        final skill = row['skill'] as String;
        final endorsement = SkillEndorsement(
          id: row['id'] as String,
          endorsedUserId: row['endorsed_user_id'] as String,
          endorserUserId: row['endorser_user_id'] as String,
          skill: skill,
          createdAt: DateTime.tryParse(row['created_at'] ?? '') ?? DateTime.now(),
          endorserName: row['impact_profiles']?['full_name'] as String?,
          endorserAvatarUrl: row['impact_profiles']?['avatar_url'] as String?,
        );

        grouped.putIfAbsent(skill, () => []).add(endorsement);
        endorsers.putIfAbsent(skill, () => []).add(EndorserInfo(
          userId: endorsement.endorserUserId,
          name: endorsement.endorserName ?? 'User',
          avatarUrl: endorsement.endorserAvatarUrl,
        ));
      }

      return grouped.map((skill, list) => MapEntry(
        skill,
        SkillEndorsementSummary(
          skill: skill,
          count: list.length,
          topEndorsers: endorsers[skill]?.take(3).toList() ?? [],
        ),
      ));
    } catch (e) {
      _log.error('Error fetching endorsements: $e', tag: _tag);
      return {};
    }
  }

  Future<void> endorseSkill(String userId, String skill) async {
    try {
      final myId = _supabase.auth.currentUser?.id;
      if (myId == null) throw Exception('Not authenticated');
      if (myId == userId) throw Exception('Cannot endorse your own skill');

      await _supabase.from('skill_endorsements').insert({
        'endorsed_user_id': userId,
        'endorser_user_id': myId,
        'skill': skill,
      });
      
      _log.info('✅ Endorsed $skill for user $userId', tag: _tag);
    } catch (e) {
      _log.error('Error endorsing skill: $e', tag: _tag);
      rethrow;
    }
  }

  Future<void> removeEndorsement(String userId, String skill) async {
    try {
      final myId = _supabase.auth.currentUser?.id;
      if (myId == null) throw Exception('Not authenticated');

      await _supabase
          .from('skill_endorsements')
          .delete()
          .eq('endorsed_user_id', userId)
          .eq('endorser_user_id', myId)
          .eq('skill', skill);
      
      _log.error('❌ Removed endorsement for $skill', tag: _tag);
    } catch (e) {
      _log.error('Error removing endorsement: $e', tag: _tag);
      rethrow;
    }
  }

  Future<bool> hasEndorsed(String userId, String skill) async {
    try {
      final myId = _supabase.auth.currentUser?.id;
      if (myId == null) return false;

      final result = await _supabase
          .from('skill_endorsements')
          .select('id')
          .eq('endorsed_user_id', userId)
          .eq('endorser_user_id', myId)
          .eq('skill', skill)
          .maybeSingle();

      return result != null;
    } catch (e) {
      return false;
    }
  }
}
