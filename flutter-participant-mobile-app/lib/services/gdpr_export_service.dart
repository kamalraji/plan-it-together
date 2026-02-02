import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/utils/result.dart';

/// Options for GDPR data export
class GdprExportOptions {
  final bool includeProfile;
  final bool includePosts;
  final bool includeActivity;
  final bool includeFollowers;
  final bool includeMessages;
  final bool includeSettings;
  final bool includeBadges;
  final bool includeRegistrations;

  const GdprExportOptions({
    this.includeProfile = true,
    this.includePosts = true,
    this.includeActivity = true,
    this.includeFollowers = true,
    this.includeMessages = false, // Opt-in due to size
    this.includeSettings = true,
    this.includeBadges = true,
    this.includeRegistrations = true,
  });

  Map<String, dynamic> toJson() => {
    'includeProfile': includeProfile,
    'includePosts': includePosts,
    'includeActivity': includeActivity,
    'includeFollowers': includeFollowers,
    'includeMessages': includeMessages,
    'includeSettings': includeSettings,
    'includeBadges': includeBadges,
    'includeRegistrations': includeRegistrations,
  };

  GdprExportOptions copyWith({
    bool? includeProfile,
    bool? includePosts,
    bool? includeActivity,
    bool? includeFollowers,
    bool? includeMessages,
    bool? includeSettings,
    bool? includeBadges,
    bool? includeRegistrations,
  }) {
    return GdprExportOptions(
      includeProfile: includeProfile ?? this.includeProfile,
      includePosts: includePosts ?? this.includePosts,
      includeActivity: includeActivity ?? this.includeActivity,
      includeFollowers: includeFollowers ?? this.includeFollowers,
      includeMessages: includeMessages ?? this.includeMessages,
      includeSettings: includeSettings ?? this.includeSettings,
      includeBadges: includeBadges ?? this.includeBadges,
      includeRegistrations: includeRegistrations ?? this.includeRegistrations,
    );
  }

  int get selectedCount {
    int count = 0;
    if (includeProfile) count++;
    if (includePosts) count++;
    if (includeActivity) count++;
    if (includeFollowers) count++;
    if (includeMessages) count++;
    if (includeSettings) count++;
    if (includeBadges) count++;
    if (includeRegistrations) count++;
    return count;
  }

  bool get hasSelection => selectedCount > 0;
}

/// Result of a GDPR export operation
class GdprExportResult {
  final Map<String, dynamic> data;
  final String? filePath;
  final int dataSizeBytes;
  final DateTime exportedAt;

  GdprExportResult({
    required this.data,
    this.filePath,
    required this.dataSizeBytes,
    required this.exportedAt,
  });

  String get formattedSize {
    if (dataSizeBytes < 1024) return '$dataSizeBytes B';
    if (dataSizeBytes < 1024 * 1024) return '${(dataSizeBytes / 1024).toStringAsFixed(1)} KB';
    return '${(dataSizeBytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}

/// Service for GDPR-compliant data export
/// 
/// Allows users to download all their personal data as required by
/// GDPR Article 15 (Right of Access).
/// 
/// ## Usage
/// ```dart
/// final service = GdprExportService.instance;
/// final result = await service.exportData(
///   options: GdprExportOptions(
///     includeProfile: true,
///     includePosts: true,
///   ),
/// );
/// if (result.isSuccess) {
///   await service.shareExport(result.data);
/// }
/// ```
class GdprExportService {
  static GdprExportService? _instance;
  static GdprExportService get instance => _instance ??= GdprExportService._();
  GdprExportService._();

  static final _log = LoggingService.instance;
  static const String _tag = 'GdprExportService';

  /// Export user data via edge function
  Future<Result<GdprExportResult>> exportData({
    GdprExportOptions options = const GdprExportOptions(),
  }) async {
    try {
      _log.info('Starting GDPR data export', tag: _tag, metadata: {
        'selectedCategories': options.selectedCount,
      });

      final response = await SupabaseConfig.client.functions.invoke(
        'export-user-data',
        body: options.toJson(),
      );

      if (response.status != 200) {
        final errorMessage = response.data?['error'] ?? 'Export failed';
        _log.error('GDPR export failed: $errorMessage', tag: _tag);
        return Result.failure(errorMessage);
      }

      final data = response.data as Map<String, dynamic>;
      final jsonString = const JsonEncoder.withIndent('  ').convert(data);
      final sizeBytes = utf8.encode(jsonString).length;

      _log.info('GDPR export completed', tag: _tag, metadata: {
        'sizeBytes': sizeBytes,
        'categories': (data['_metadata'] as Map?)?['dataCategories'],
      });

      return Result.success(GdprExportResult(
        data: data,
        dataSizeBytes: sizeBytes,
        exportedAt: DateTime.now(),
      ));
    } catch (e) {
      _log.error('GDPR export error', tag: _tag, error: e);
      return Result.failure('Failed to export data: ${e.toString()}');
    }
  }

  /// Save export to file and share
  Future<Result<String>> saveAndShareExport(GdprExportResult export) async {
    try {
      final jsonString = const JsonEncoder.withIndent('  ').convert(export.data);
      final timestamp = DateTime.now().toIso8601String().replaceAll(':', '-').split('.').first;
      final fileName = 'thittam1hub_data_export_$timestamp.json';

      if (kIsWeb) {
        // Web: Copy to clipboard or download
        _log.info('Web export - data prepared for download', tag: _tag);
        return Result.success(jsonString);
      }

      // Mobile: Save to temp and share
      final directory = await getTemporaryDirectory();
      final filePath = '${directory.path}/$fileName';
      final file = File(filePath);
      await file.writeAsString(jsonString);

      _log.info('Export saved to file', tag: _tag, metadata: {'path': filePath});

      // Share the file
      await Share.shareXFiles(
        [XFile(filePath)],
        subject: 'Thittam1Hub Data Export',
        text: 'Your personal data export from Thittam1Hub (GDPR Article 15)',
      );

      return Result.success(filePath);
    } catch (e) {
      _log.error('Failed to save/share export', tag: _tag, error: e);
      return Result.failure('Failed to save export: ${e.toString()}');
    }
  }

  /// Get JSON string for clipboard copy
  String getExportAsString(GdprExportResult export) {
    return const JsonEncoder.withIndent('  ').convert(export.data);
  }
}
