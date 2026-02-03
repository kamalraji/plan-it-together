import 'dart:typed_data';

import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:thittam1hub/supabase/supabase_config.dart';
import '../models/organizer_application.dart';
import '../utils/result.dart';
import '../utils/url_utils.dart';
import 'base_service.dart';
import 'logging_service.dart';

/// Service for managing organizer applications.
/// 
/// Follows industrial patterns:
/// - Singleton lazy initialization
/// - Result<T> pattern for all operations
/// - Input sanitization
/// - Centralized logging
/// - Document upload with signed URLs
class OrganizerApplicationService extends BaseService {
  // ===========================================================================
  // SINGLETON PATTERN
  // ===========================================================================
  
  static OrganizerApplicationService? _instance;
  static OrganizerApplicationService get instance => 
      _instance ??= OrganizerApplicationService._();
  OrganizerApplicationService._();

  @override
  String get tag => 'OrganizerApplicationService';

  // ===========================================================================
  // CONSTANTS
  // ===========================================================================

  static const String _tableName = 'organizer_applications';
  static const String _historyTableName = 'application_status_history';
  static const String _storageBucket = 'organizer-documents';
  static const int _maxDocumentSizeBytes = 5 * 1024 * 1024; // 5MB
  static const List<String> _allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  // ===========================================================================
  // CORE OPERATIONS
  // ===========================================================================

  /// Get the current user's application (if exists)
  Future<Result<OrganizerApplication?>> getCurrentApplication() => execute(
    () async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) {
        throw Exception('User not authenticated');
      }

      final response = await SupabaseConfig.client
          .from(_tableName)
          .select()
          .eq('user_id', userId)
          .maybeSingle();

      if (response == null) return null;
      
      logDbOperation('SELECT', _tableName);
      return OrganizerApplication.fromJson(response);
    },
    operationName: 'getCurrentApplication',
  );

  /// Get application by ID (for status tracking)
  Future<Result<OrganizerApplication>> getApplicationById(String applicationId) => execute(
    () async {
      final response = await SupabaseConfig.client
          .from(_tableName)
          .select()
          .eq('id', applicationId)
          .single();

      logDbOperation('SELECT', _tableName);
      return OrganizerApplication.fromJson(response);
    },
    operationName: 'getApplicationById',
  );

  /// Create a new draft application
  Future<Result<OrganizerApplication>> createApplication({
    String? initialOrgName,
    OrganizationType? initialOrgType,
  }) => execute(
    () async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) {
        throw Exception('User not authenticated');
      }

      // Check if application already exists
      final existing = await SupabaseConfig.client
          .from(_tableName)
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

      if (existing != null) {
        throw Exception('Application already exists. Use update instead.');
      }

      final sanitizedName = initialOrgName != null 
          ? InputSanitizer.sanitizeName(initialOrgName) 
          : '';

      final response = await SupabaseConfig.client
          .from(_tableName)
          .insert({
            'user_id': userId,
            'organization_name': sanitizedName,
            'organization_type': (initialOrgType ?? OrganizationType.individual).name,
            'status': ApplicationStatus.draft.toDbString(),
          })
          .select()
          .single();

      logDbOperation('INSERT', _tableName);
      logInfo('Application created', metadata: {'userId': userId});
      
      return OrganizerApplication.fromJson(response);
    },
    operationName: 'createApplication',
  );

  /// Update draft application (only allowed in draft/requires_more_info status)
  Future<Result<OrganizerApplication>> updateDraft(
    String applicationId,
    Map<String, dynamic> updates,
  ) => execute(
    () async {
      // Sanitize all user inputs
      final sanitized = _sanitizeUpdates(updates);

      final response = await SupabaseConfig.client
          .from(_tableName)
          .update(sanitized)
          .eq('id', applicationId)
          .select()
          .single();

      logDbOperation('UPDATE', _tableName);
      return OrganizerApplication.fromJson(response);
    },
    operationName: 'updateDraft',
  );

  /// Update specific step data
  Future<Result<OrganizerApplication>> updateStep(
    String applicationId,
    Map<String, dynamic> data,
  ) => execute(
    () async {
      final sanitized = _sanitizeUpdates(data);

      final response = await SupabaseConfig.client
          .from(_tableName)
          .update(sanitized)
          .eq('id', applicationId)
          .select()
          .single();

      logDbOperation('UPDATE', _tableName);
      logInfo('Step updated', metadata: {
        'applicationId': applicationId,
        'fieldsUpdated': sanitized.keys.toList(),
      });
      
      return OrganizerApplication.fromJson(response);
    },
    operationName: 'updateStep',
  );

  /// Submit application for review
  Future<Result<OrganizerApplication>> submitApplication(String applicationId) => execute(
    () async {
      // First verify application meets requirements
      final current = await SupabaseConfig.client
          .from(_tableName)
          .select()
          .eq('id', applicationId)
          .single();

      final app = OrganizerApplication.fromJson(current);
      
      if (!app.canSubmit) {
        throw Exception('Application does not meet minimum requirements for submission');
      }

      if (!app.canEdit) {
        throw Exception('Application cannot be submitted in current status: ${app.status.displayLabel}');
      }

      final response = await SupabaseConfig.client
          .from(_tableName)
          .update({
            'status': ApplicationStatus.submitted.toDbString(),
            'submitted_at': DateTime.now().toUtc().toIso8601String(),
            // Clear any previous rejection data on resubmission
            'rejection_reason': null,
            'admin_request_message': null,
          })
          .eq('id', applicationId)
          .select()
          .single();

      logDbOperation('UPDATE', _tableName);
      logInfo('Application submitted', metadata: {'applicationId': applicationId});

      // Trigger email notification (fire and forget - don't block submission)
      _triggerEmailNotification(applicationId, 'submitted').catchError((e) {
        logWarning('Failed to send submission notification', metadata: {'error': e.toString()});
      });

      return OrganizerApplication.fromJson(response);
    },
    operationName: 'submitApplication',
  );

  /// Resubmit a rejected or requires_more_info application
  Future<Result<OrganizerApplication>> resubmitApplication(String applicationId) => execute(
    () async {
      final current = await SupabaseConfig.client
          .from(_tableName)
          .select()
          .eq('id', applicationId)
          .single();

      final app = OrganizerApplication.fromJson(current);
      
      if (app.status != ApplicationStatus.rejected && 
          app.status != ApplicationStatus.requiresMoreInfo) {
        throw Exception('Only rejected or "more info required" applications can be resubmitted');
      }

      if (!app.canSubmit) {
        throw Exception('Please complete required fields before resubmitting');
      }

      final response = await SupabaseConfig.client
          .from(_tableName)
          .update({
            'status': ApplicationStatus.submitted.toDbString(),
            'submitted_at': DateTime.now().toUtc().toIso8601String(),
            'rejection_reason': null,
            'admin_request_message': null,
          })
          .eq('id', applicationId)
          .select()
          .single();

      logDbOperation('UPDATE', _tableName);
      logInfo('Application resubmitted', metadata: {'applicationId': applicationId});

      return OrganizerApplication.fromJson(response);
    },
    operationName: 'resubmitApplication',
  );

  // ===========================================================================
  // DOCUMENT MANAGEMENT
  // ===========================================================================

  /// Upload verification document
  Future<Result<String>> uploadDocument({
    required Uint8List bytes,
    required String fileName,
    required String mimeType,
  }) => executeWithRetry(
    () async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) {
        throw Exception('User not authenticated');
      }

      // Validate file size
      if (bytes.length > _maxDocumentSizeBytes) {
        throw Exception('File size exceeds maximum allowed (5MB)');
      }

      // Validate MIME type
      if (!_allowedMimeTypes.contains(mimeType.toLowerCase())) {
        throw Exception('File type not allowed. Allowed: PDF, JPEG, PNG, WebP');
      }

      // Generate unique path: userId/timestamp_filename
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final sanitizedFileName = _sanitizeFileName(fileName);
      final path = '$userId/${timestamp}_$sanitizedFileName';

      // Upload to storage
      await SupabaseConfig.client.storage
          .from(_storageBucket)
          .uploadBinary(
            path,
            bytes,
            fileOptions: FileOptions(
              contentType: mimeType,
              upsert: true,
            ),
          );

      // Create signed URL (1 year validity for private bucket)
      final signedUrl = await SupabaseConfig.client.storage
          .from(_storageBucket)
          .createSignedUrl(path, 60 * 60 * 24 * 365);

      logInfo('Document uploaded', metadata: {
        'path': path,
        'size': bytes.length,
        'mimeType': mimeType,
      });

      return signedUrl;
    },
    operationName: 'uploadDocument',
    maxAttempts: 2,
  );

  /// Delete a previously uploaded document
  Future<Result<void>> deleteDocument(String documentUrl) => execute(
    () async {
      final path = _extractPathFromSignedUrl(documentUrl);
      if (path == null) {
        throw Exception('Invalid document URL');
      }

      await SupabaseConfig.client.storage
          .from(_storageBucket)
          .remove([path]);

      logInfo('Document deleted', metadata: {'path': path});
    },
    operationName: 'deleteDocument',
  );

  /// Add additional document to application
  Future<Result<OrganizerApplication>> addAdditionalDocument(
    String applicationId, {
    required Uint8List bytes,
    required String fileName,
    required String mimeType,
    required String documentType,
  }) => execute(
    () async {
      // Upload document first
      final uploadResult = await uploadDocument(
        bytes: bytes,
        fileName: fileName,
        mimeType: mimeType,
      );

      if (uploadResult.isFailure) {
        throw Exception(uploadResult.errorMessage);
      }

      final documentUrl = uploadResult.data!;

      // Get current application
      final current = await SupabaseConfig.client
          .from(_tableName)
          .select('additional_documents')
          .eq('id', applicationId)
          .single();

      final existingDocs = (current['additional_documents'] as List?) ?? [];
      final newDoc = ApplicationDocument(
        url: documentUrl,
        type: documentType,
        name: fileName,
        sizeBytes: bytes.length,
        uploadedAt: DateTime.now(),
      );

      // Update application with new document
      final response = await SupabaseConfig.client
          .from(_tableName)
          .update({
            'additional_documents': [...existingDocs, newDoc.toJson()],
          })
          .eq('id', applicationId)
          .select()
          .single();

      logDbOperation('UPDATE', _tableName);
      return OrganizerApplication.fromJson(response);
    },
    operationName: 'addAdditionalDocument',
  );

  /// Remove additional document from application
  Future<Result<OrganizerApplication>> removeAdditionalDocument(
    String applicationId,
    String documentUrl,
  ) => execute(
    () async {
      // Delete from storage
      await deleteDocument(documentUrl);

      // Get current documents
      final current = await SupabaseConfig.client
          .from(_tableName)
          .select('additional_documents')
          .eq('id', applicationId)
          .single();

      final existingDocs = (current['additional_documents'] as List?) ?? [];
      final updatedDocs = existingDocs
          .where((doc) => (doc as Map)['url'] != documentUrl)
          .toList();

      // Update application
      final response = await SupabaseConfig.client
          .from(_tableName)
          .update({
            'additional_documents': updatedDocs,
          })
          .eq('id', applicationId)
          .select()
          .single();

      logDbOperation('UPDATE', _tableName);
      return OrganizerApplication.fromJson(response);
    },
    operationName: 'removeAdditionalDocument',
  );

  // ===========================================================================
  // STATUS HISTORY
  // ===========================================================================

  /// Get application status history for timeline display
  Future<Result<List<ApplicationStatusEntry>>> getStatusHistory(
    String applicationId,
  ) => execute(
    () async {
      final response = await SupabaseConfig.client
          .from(_historyTableName)
          .select()
          .eq('application_id', applicationId)
          .order('created_at', ascending: false);

      logDbOperation('SELECT', _historyTableName);
      
      return (response as List)
          .map((e) => ApplicationStatusEntry.fromJson(e as Map<String, dynamic>))
          .toList();
    },
    operationName: 'getStatusHistory',
  );

  // ===========================================================================
  // ROLE CHECKING
  // ===========================================================================

  /// Check if current user has organizer role
  Future<Result<bool>> hasOrganizerRole() => execute(
    () async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return false;

      final response = await SupabaseConfig.client
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'organizer')
          .maybeSingle();

      return response != null;
    },
    operationName: 'hasOrganizerRole',
  );

  /// Get current user's primary role
  Future<Result<String>> getCurrentUserRole() => execute(
    () async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return 'participant';

      final response = await SupabaseConfig.client
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .order('role') // admin > organizer > participant alphabetically
          .limit(1)
          .maybeSingle();

      return (response?['role'] as String?) ?? 'participant';
    },
    operationName: 'getCurrentUserRole',
  );

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /// Sanitize user inputs before database update
  Map<String, dynamic> _sanitizeUpdates(Map<String, dynamic> updates) {
    final sanitized = <String, dynamic>{};

    for (final entry in updates.entries) {
      final key = entry.key;
      final value = entry.value;

      if (value == null) {
        sanitized[key] = null;
        continue;
      }

      sanitized[key] = switch (key) {
        'organization_name' => InputSanitizer.sanitizeName(value as String),
        'organization_description' => InputSanitizer.sanitizeDescription(value as String),
        'experience_description' => InputSanitizer.sanitizeDescription(value as String),
        'organization_website' => UrlUtils.sanitizeUrl(value as String),
        'portfolio_links' => (value as List).map((url) => UrlUtils.sanitizeUrl(url as String)).toList(),
        _ => value,
      };
    }

    return sanitized;
  }

  /// Sanitize filename for storage path
  String _sanitizeFileName(String fileName) {
    return fileName
        .replaceAll(RegExp(r'[^\w\s\-\.]'), '')
        .replaceAll(RegExp(r'\s+'), '_')
        .toLowerCase();
  }

  /// Extract storage path from signed URL
  String? _extractPathFromSignedUrl(String url) {
    try {
      final uri = Uri.parse(url);
      final pathSegments = uri.pathSegments;
      
      // Find the bucket name and extract path after it
      final bucketIndex = pathSegments.indexOf(_storageBucket);
      if (bucketIndex == -1 || bucketIndex >= pathSegments.length - 1) {
        return null;
      }

      return pathSegments.sublist(bucketIndex + 1).join('/');
    } catch (e) {
      return null;
    }
  }

  /// Trigger email notification via edge function
  Future<void> _triggerEmailNotification(
    String applicationId, 
    String notificationType, {
    String? rejectionReason,
    String? adminMessage,
  }) async {
    try {
      final user = SupabaseConfig.auth.currentUser;
      if (user?.email == null) return;

      await SupabaseConfig.client.functions.invoke(
        'organizer-application-notification',
        body: {
          'applicationId': applicationId,
          'type': notificationType,
          'userEmail': user!.email,
          'userName': user.userMetadata?['full_name'] ?? 'User',
          if (rejectionReason != null) 'rejectionReason': rejectionReason,
          if (adminMessage != null) 'adminMessage': adminMessage,
        },
      );
      
      logInfo('Email notification sent', metadata: {
        'applicationId': applicationId,
        'type': notificationType,
      });
    } catch (e) {
      // Non-critical, just log warning
      LoggingService.instance.warning(
        'Email notification failed',
        tag: tag,
        metadata: {'error': e.toString(), 'type': notificationType},
      );
    }
  }
}

// =============================================================================
// STATIC HELPERS (for simplified UI consumption)
// =============================================================================

extension OrganizerApplicationServiceHelpers on OrganizerApplicationService {
  /// Quick check if user has pending or approved application
  static Future<({bool hasApplication, ApplicationStatus? status})> quickStatus() async {
    final result = await OrganizerApplicationService.instance.getCurrentApplication();
    if (result.isFailure || result.data == null) {
      return (hasApplication: false, status: null);
    }
    return (hasApplication: true, status: result.data!.status);
  }
}
