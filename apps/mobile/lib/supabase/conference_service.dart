import 'package:supabase_flutter/supabase_flutter.dart';
export 'package:supabase_flutter/supabase_flutter.dart' show SupabaseClient, Supabase;
import '../models/conference_models.dart';

/// Service for conference/workshop-specific Zone features
class ConferenceService {
  // Singleton pattern
  static ConferenceService? _instance;
  static ConferenceService get instance => _instance ??= ConferenceService._();
  
  final SupabaseClient _supabase;

  ConferenceService._() : _supabase = Supabase.instance.client;

  String? get _currentUserId => _supabase.auth.currentUser?.id;

  // ==================== TRACKS ====================

  /// Get all tracks for an event
  Future<List<EventTrack>> getEventTracks(String eventId) async {
    final response = await _supabase
        .from('event_tracks')
        .select()
        .eq('event_id', eventId)
        .order('sort_order');

    return (response as List)
        .map((json) => EventTrack.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  // ==================== SPONSOR BOOTHS ====================

  /// Get all sponsor booths for an event
  Future<List<SponsorBooth>> getSponsorBooths(String eventId) async {
    final response = await _supabase
        .from('sponsor_booths')
        .select()
        .eq('event_id', eventId)
        .eq('is_active', true)
        .order('tier');

    // Get user's visited booths
    Set<String> visitedBoothIds = {};
    if (_currentUserId != null) {
      final visits = await _supabase
          .from('booth_visits')
          .select('booth_id')
          .eq('user_id', _currentUserId!);
      visitedBoothIds = (visits as List)
          .map((v) => v['booth_id'] as String)
          .toSet();
    }

    return (response as List)
        .map((json) => SponsorBooth.fromJson(
              json as Map<String, dynamic>,
              hasVisited: visitedBoothIds.contains(json['id']),
            ))
        .toList()
      ..sort((a, b) => a.tierPriority.compareTo(b.tierPriority));
  }

  /// Get booths by tier
  Future<Map<String, List<SponsorBooth>>> getBoothsByTier(String eventId) async {
    final booths = await getSponsorBooths(eventId);
    final Map<String, List<SponsorBooth>> byTier = {};
    
    for (final booth in booths) {
      byTier.putIfAbsent(booth.tier, () => []).add(booth);
    }
    
    return byTier;
  }

  /// Record booth visit
  Future<void> visitBooth(String boothId, {bool scannedQr = false}) async {
    if (_currentUserId == null) return;

    await _supabase.from('booth_visits').upsert({
      'booth_id': boothId,
      'user_id': _currentUserId,
      'scanned_qr': scannedQr,
      'visited_at': DateTime.now().toIso8601String(),
    });

    // Increment visit count
    await _supabase.rpc('increment_booth_visit', params: {'p_booth_id': boothId});
  }

  /// Get user's visited booths count
  Future<int> getUserVisitedBoothsCount(String eventId) async {
    if (_currentUserId == null) return 0;

    final response = await _supabase
        .from('booth_visits')
        .select('booth_id, sponsor_booths!inner(event_id)')
        .eq('user_id', _currentUserId!)
        .eq('sponsor_booths.event_id', eventId);

    return (response as List).length;
  }

  // ==================== MATERIALS ====================

  /// Get all materials for an event
  Future<List<EventMaterial>> getEventMaterials(String eventId) async {
    final response = await _supabase
        .from('event_materials')
        .select()
        .eq('event_id', eventId)
        .order('sort_order');

    // Get user's downloads
    Set<String> downloadedIds = {};
    if (_currentUserId != null) {
      final downloads = await _supabase
          .from('material_downloads')
          .select('material_id')
          .eq('user_id', _currentUserId!);
      downloadedIds = (downloads as List)
          .map((d) => d['material_id'] as String)
          .toSet();
    }

    return (response as List)
        .map((json) => EventMaterial.fromJson(
              json as Map<String, dynamic>,
              hasDownloaded: downloadedIds.contains(json['id']),
            ))
        .toList();
  }

  /// Get materials for a specific session
  Future<List<EventMaterial>> getSessionMaterials(String sessionId) async {
    final response = await _supabase
        .from('event_materials')
        .select()
        .eq('session_id', sessionId)
        .order('sort_order');

    return (response as List)
        .map((json) => EventMaterial.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  /// Get materials grouped by type
  Future<Map<String, List<EventMaterial>>> getMaterialsByType(String eventId) async {
    final materials = await getEventMaterials(eventId);
    final Map<String, List<EventMaterial>> byType = {};
    
    for (final material in materials) {
      byType.putIfAbsent(material.materialType, () => []).add(material);
    }
    
    return byType;
  }

  /// Record material download
  Future<void> recordDownload(String materialId) async {
    if (_currentUserId == null) return;

    await _supabase.from('material_downloads').insert({
      'material_id': materialId,
      'user_id': _currentUserId,
    });
  }

  // ==================== WORKSHOP PROGRESS ====================

  /// Get user's workshop progress
  Future<WorkshopProgress?> getWorkshopProgress(String eventId) async {
    if (_currentUserId == null) return null;

    final response = await _supabase
        .from('workshop_progress')
        .select()
        .eq('event_id', eventId)
        .eq('user_id', _currentUserId!)
        .maybeSingle();

    if (response == null) return null;
    return WorkshopProgress.fromJson(response as Map<String, dynamic>);
  }

  /// Start or update workshop progress
  Future<WorkshopProgress> upsertProgress({
    required String eventId,
    required int currentStep,
    required int totalSteps,
    Map<String, dynamic>? notes,
  }) async {
    final isComplete = currentStep >= totalSteps;
    
    final response = await _supabase
        .from('workshop_progress')
        .upsert({
          'event_id': eventId,
          'user_id': _currentUserId,
          'current_step': currentStep,
          'total_steps': totalSteps,
          'last_activity_at': DateTime.now().toIso8601String(),
          'completed_at': isComplete ? DateTime.now().toIso8601String() : null,
          if (notes != null) 'notes': notes,
        })
        .select()
        .single();

    return WorkshopProgress.fromJson(response as Map<String, dynamic>);
  }

  /// Mark workshop as complete
  Future<void> completeWorkshop(String eventId) async {
    if (_currentUserId == null) return;

    await _supabase
        .from('workshop_progress')
        .update({
          'completed_at': DateTime.now().toIso8601String(),
          'last_activity_at': DateTime.now().toIso8601String(),
        })
        .eq('event_id', eventId)
        .eq('user_id', _currentUserId!);
  }
}
