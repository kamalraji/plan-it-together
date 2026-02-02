import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/organizer_application.dart';
import 'logging_service.dart';

/// Local draft persistence service for organizer applications.
/// 
/// Follows the ProfileDraftService pattern for auto-save functionality.
/// Stores form progress locally to prevent data loss during form filling.
class OrganizerApplicationDraftService {
  static const String _tag = 'OrganizerApplicationDraftService';
  
  // Storage keys
  static const String _draftKey = 'organizer_application_draft';
  static const String _draftTimestampKey = 'organizer_application_draft_timestamp';
  static const String _draftStepKey = 'organizer_application_draft_step';
  
  // Configuration
  static const int _maxDraftAgeHours = 48;

  final _log = LoggingService.instance;

  // ===========================================================================
  // SAVE OPERATIONS
  // ===========================================================================

  /// Save current form state as draft
  Future<void> saveDraft(OrganizerApplicationDraft draft) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      await prefs.setString(_draftKey, jsonEncode(draft.toJson()));
      await prefs.setString(_draftTimestampKey, DateTime.now().toIso8601String());
      await prefs.setInt(_draftStepKey, draft.currentStep);
      
      _log.debug('Draft saved', tag: _tag, metadata: {
        'step': draft.currentStep,
        'fieldsCount': draft.allFields.length,
      });
    } catch (e) {
      _log.warning('Failed to save draft', tag: _tag, metadata: {'error': e.toString()});
    }
  }

  /// Save only specific step data (for incremental saves)
  Future<void> saveStepData(int step, Map<String, dynamic> data) async {
    try {
      final existingDraft = await loadDraft();
      final updatedDraft = existingDraft?.copyWithStepData(step, data) ??
          OrganizerApplicationDraft(
            step1Data: step == 1 ? data : {},
            step2Data: step == 2 ? data : {},
            step3Data: step == 3 ? data : {},
            currentStep: step,
            savedAt: DateTime.now(),
          );
      
      await saveDraft(updatedDraft);
    } catch (e) {
      _log.warning('Failed to save step data', tag: _tag, metadata: {
        'step': step,
        'error': e.toString(),
      });
    }
  }

  // ===========================================================================
  // LOAD OPERATIONS
  // ===========================================================================

  /// Load saved draft (if exists and not expired)
  Future<OrganizerApplicationDraft?> loadDraft() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      final draftJson = prefs.getString(_draftKey);
      if (draftJson == null) return null;
      
      // Check age
      final timestampStr = prefs.getString(_draftTimestampKey);
      if (timestampStr != null) {
        final timestamp = DateTime.tryParse(timestampStr);
        if (timestamp != null) {
          final age = DateTime.now().difference(timestamp);
          if (age.inHours > _maxDraftAgeHours) {
            _log.info('Draft expired, clearing', tag: _tag);
            await clearDraft();
            return null;
          }
        }
      }

      final json = jsonDecode(draftJson) as Map<String, dynamic>;
      final step = prefs.getInt(_draftStepKey) ?? 0;
      
      return OrganizerApplicationDraft.fromJson(json, step);
    } catch (e) {
      _log.warning('Failed to load draft', tag: _tag, metadata: {'error': e.toString()});
      return null;
    }
  }

  /// Get draft age for display purposes
  Future<Duration?> getDraftAge() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final timestampStr = prefs.getString(_draftTimestampKey);
      
      if (timestampStr == null) return null;
      
      final timestamp = DateTime.tryParse(timestampStr);
      if (timestamp == null) return null;
      
      return DateTime.now().difference(timestamp);
    } catch (e) {
      return null;
    }
  }

  /// Check if a draft exists
  Future<bool> hasDraft() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.containsKey(_draftKey);
    } catch (e) {
      return false;
    }
  }

  /// Get the step the user was on
  Future<int> getLastStep() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getInt(_draftStepKey) ?? 0;
    } catch (e) {
      return 0;
    }
  }

  // ===========================================================================
  // CLEAR OPERATIONS
  // ===========================================================================

  /// Clear saved draft
  Future<void> clearDraft() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_draftKey);
      await prefs.remove(_draftTimestampKey);
      await prefs.remove(_draftStepKey);
      
      _log.debug('Draft cleared', tag: _tag);
    } catch (e) {
      _log.warning('Failed to clear draft', tag: _tag, metadata: {'error': e.toString()});
    }
  }

  // ===========================================================================
  // UTILITY
  // ===========================================================================

  /// Merge draft data with existing application (for resume flow)
  OrganizerApplication mergeWithApplication(
    OrganizerApplication app,
    OrganizerApplicationDraft draft,
  ) {
    return app.copyWith(
      // Step 1
      organizationName: draft.step1Data['organization_name'] as String? ?? app.organizationName,
      organizationType: draft.step1Data['organization_type'] != null
          ? OrganizationType.fromString(draft.step1Data['organization_type'] as String)
          : app.organizationType,
      organizationWebsite: draft.step1Data['organization_website'] as String? ?? app.organizationWebsite,
      organizationSize: draft.step1Data['organization_size'] != null
          ? OrganizationSize.fromString(draft.step1Data['organization_size'] as String)
          : app.organizationSize,
      organizationDescription: draft.step1Data['organization_description'] as String? ?? app.organizationDescription,
      
      // Step 2
      pastEventsCount: draft.step2Data['past_events_count'] != null
          ? PastEventsCount.fromString(draft.step2Data['past_events_count'] as String)
          : app.pastEventsCount,
      eventTypes: (draft.step2Data['event_types'] as List?)?.cast<String>() ?? app.eventTypes,
      largestEventSize: draft.step2Data['largest_event_size'] != null
          ? LargestEventSize.fromString(draft.step2Data['largest_event_size'] as String)
          : app.largestEventSize,
      experienceDescription: draft.step2Data['experience_description'] as String? ?? app.experienceDescription,
      portfolioLinks: (draft.step2Data['portfolio_links'] as List?)?.cast<String>() ?? app.portfolioLinks,
      
      // Step 3 - documents are handled separately via uploads
    );
  }
}

// =============================================================================
// DRAFT MODEL
// =============================================================================

/// Local draft model for form persistence
class OrganizerApplicationDraft {
  final Map<String, dynamic> step1Data;
  final Map<String, dynamic> step2Data;
  final Map<String, dynamic> step3Data;
  final int currentStep;
  final DateTime savedAt;

  const OrganizerApplicationDraft({
    required this.step1Data,
    required this.step2Data,
    required this.step3Data,
    required this.currentStep,
    required this.savedAt,
  });

  /// All fields combined
  Map<String, dynamic> get allFields => {
    ...step1Data,
    ...step2Data,
    ...step3Data,
  };

  /// Check if draft has any data
  bool get hasData => 
      step1Data.isNotEmpty || 
      step2Data.isNotEmpty || 
      step3Data.isNotEmpty;

  /// Get completion percentage
  int get completionPercentage {
    int score = 0;
    
    // Step 1: 40%
    if (step1Data['organization_name']?.toString().isNotEmpty == true) score += 15;
    if (step1Data['organization_description']?.toString().isNotEmpty == true) score += 15;
    if (step1Data['organization_website']?.toString().isNotEmpty == true) score += 5;
    if (step1Data['organization_size'] != null) score += 5;
    
    // Step 2: 30%
    if (step2Data['past_events_count'] != null) score += 10;
    if ((step2Data['event_types'] as List?)?.isNotEmpty == true) score += 10;
    if (step2Data['experience_description']?.toString().isNotEmpty == true) score += 10;
    
    // Step 3: 30%
    if (step3Data['verification_document_url'] != null) score += 25;
    if ((step3Data['additional_documents'] as List?)?.isNotEmpty == true) score += 5;
    
    return score.clamp(0, 100);
  }

  /// Create from JSON
  factory OrganizerApplicationDraft.fromJson(Map<String, dynamic> json, int step) {
    return OrganizerApplicationDraft(
      step1Data: (json['step1'] as Map<String, dynamic>?) ?? {},
      step2Data: (json['step2'] as Map<String, dynamic>?) ?? {},
      step3Data: (json['step3'] as Map<String, dynamic>?) ?? {},
      currentStep: step,
      savedAt: DateTime.tryParse(json['saved_at'] as String? ?? '') ?? DateTime.now(),
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() => {
    'step1': step1Data,
    'step2': step2Data,
    'step3': step3Data,
    'saved_at': savedAt.toIso8601String(),
  };

  /// Create from application (for initial load)
  factory OrganizerApplicationDraft.fromApplication(OrganizerApplication app) {
    return OrganizerApplicationDraft(
      step1Data: {
        'organization_name': app.organizationName,
        'organization_type': app.organizationType.name,
        'organization_website': app.organizationWebsite,
        'organization_size': app.organizationSize?.toDbString(),
        'organization_description': app.organizationDescription,
      },
      step2Data: {
        'past_events_count': app.pastEventsCount?.toDbString(),
        'event_types': app.eventTypes,
        'largest_event_size': app.largestEventSize?.toDbString(),
        'experience_description': app.experienceDescription,
        'portfolio_links': app.portfolioLinks,
      },
      step3Data: {
        'verification_document_url': app.verificationDocumentUrl,
        'verification_document_type': app.verificationDocumentType?.toDbString(),
        'additional_documents': app.additionalDocuments.map((d) => d.toJson()).toList(),
      },
      currentStep: 0,
      savedAt: DateTime.now(),
    );
  }

  /// Copy with updated step data
  OrganizerApplicationDraft copyWithStepData(int step, Map<String, dynamic> data) {
    return OrganizerApplicationDraft(
      step1Data: step == 1 ? {...step1Data, ...data} : step1Data,
      step2Data: step == 2 ? {...step2Data, ...data} : step2Data,
      step3Data: step == 3 ? {...step3Data, ...data} : step3Data,
      currentStep: step,
      savedAt: DateTime.now(),
    );
  }

  /// Copy with current step
  OrganizerApplicationDraft copyWithStep(int step) {
    return OrganizerApplicationDraft(
      step1Data: step1Data,
      step2Data: step2Data,
      step3Data: step3Data,
      currentStep: step,
      savedAt: savedAt,
    );
  }
}
