#!/usr/bin/env dart
/// Automated migration script to replace debugPrint/print() calls with LoggingService.
///
/// Usage:
///   dart run tools/migrate_debug_prints.dart [--dry-run] [--file=<path>]
///
/// Options:
///   --dry-run    Show what would be changed without modifying files
///   --file=path  Process only a specific file
///
/// This script:
/// 1. Scans lib/ directory for debugPrint() and print() calls
/// 2. Adds LoggingService import if missing
/// 3. Adds static _log field if missing
/// 4. Replaces debugPrint/print with appropriate log.* methods
///
/// Approved Exceptions (not migrated):
/// - BackupSchedulerService: Background isolates can't access LoggingService
/// - E2EEncryptionService: Uses security-aware _secureLogDebug helpers
/// - SecureStorageService: Uses masking helpers for sensitive data
/// - DeviceFingerprintService: Uses _maskFingerprint for security

import 'dart:io';

// Files that are explicitly excluded from migration
const excludedFiles = <String>{
  'lib/services/backup_scheduler_service.dart', // Background isolate - can't use LoggingService
  'lib/services/e2e_encryption_service.dart', // Security-aware logging pattern
  'lib/services/secure_storage_service.dart', // Uses masking helpers
  'lib/services/device_fingerprint_service.dart', // Uses _maskFingerprint
  'lib/utils/navigation_audit.dart', // CLI audit tool - intentional print() usage
};

// Pattern matchers
final debugPrintPattern = RegExp(r"debugPrint\s*\(\s*'([^']*)'", multiLine: true);
final debugPrintPatternDouble = RegExp(r'debugPrint\s*\(\s*"([^"]*)"', multiLine: true);
final debugPrintPatternInterp = RegExp(r"debugPrint\s*\(\s*'([^']*)\$", multiLine: true);
final printPattern = RegExp(r"(?<!debug)print\s*\(\s*'([^']*)'", multiLine: true);

// Log level detection patterns
final errorPatterns = [
  RegExp(r'error', caseSensitive: false),
  RegExp(r'❌'),
  RegExp(r'failed', caseSensitive: false),
  RegExp(r'exception', caseSensitive: false),
];

final warningPatterns = [
  RegExp(r'warning', caseSensitive: false),
  RegExp(r'⚠️'),
  RegExp(r'warn', caseSensitive: false),
];

final infoPatterns = [
  RegExp(r'✅'),
  RegExp(r'loaded', caseSensitive: false),
  RegExp(r'created', caseSensitive: false),
  RegExp(r'success', caseSensitive: false),
  RegExp(r'completed', caseSensitive: false),
];

/// Determines the appropriate log level based on message content
String determineLogLevel(String message) {
  for (final pattern in errorPatterns) {
    if (pattern.hasMatch(message)) return 'error';
  }
  for (final pattern in warningPatterns) {
    if (pattern.hasMatch(message)) return 'warning';
  }
  for (final pattern in infoPatterns) {
    if (pattern.hasMatch(message)) return 'info';
  }
  return 'debug';
}

/// Extracts class name from file content
String? extractClassName(String content) {
  final classMatch = RegExp(r'class\s+(\w+)').firstMatch(content);
  return classMatch?.group(1);
}

/// Checks if file already has LoggingService import
bool hasLoggingImport(String content) {
  return content.contains("import 'package:thittam1hub/services/logging_service.dart'") ||
         content.contains('import "package:thittam1hub/services/logging_service.dart"');
}

/// Checks if file already has _log field
bool hasLogField(String content) {
  return content.contains('static final _log = LoggingService.instance') ||
         content.contains('final _log = LoggingService.instance') ||
         content.contains('LoggingService _log');
}

/// Checks if file extends BaseService (already has logging)
bool extendsBaseService(String content) {
  return content.contains('extends BaseService');
}

/// Checks if file uses composition pattern for ChangeNotifier
bool usesCompositionPattern(String content) {
  return content.contains('extends ChangeNotifier') ||
         content.contains('with ChangeNotifier');
}

/// Process a single file
Future<FileResult> processFile(File file, {bool dryRun = true}) async {
  final path = file.path;
  final relativePath = path.replaceFirst(RegExp(r'^.*?lib/'), 'lib/');
  
  // Check exclusions
  if (excludedFiles.contains(relativePath)) {
    return FileResult(relativePath, skipped: true, reason: 'Excluded (approved exception)');
  }
  
  var content = await file.readAsString();
  final originalContent = content;
  
  // Count occurrences
  final debugPrintCount = 'debugPrint('.allMatches(content).length;
  final printCount = RegExp(r'(?<!debug)print\(').allMatches(content).length;
  
  if (debugPrintCount == 0 && printCount == 0) {
    return FileResult(relativePath, skipped: true, reason: 'No debugPrint/print calls');
  }
  
  final className = extractClassName(content);
  final usesBase = extendsBaseService(content);
  final usesComposition = usesCompositionPattern(content);
  
  // Build replacement strategy
  final replacements = <Replacement>[];
  
  // If extends BaseService, use logDebug/logInfo/logError/logWarning directly
  // Otherwise, need to add _log field and use _log.debug etc.
  
  if (!usesBase && !hasLogField(content)) {
    // Need to add logging infrastructure
    if (!hasLoggingImport(content)) {
      // Add import after last import statement
      final lastImportMatch = RegExp(r"import '[^']+';[\r\n]*").allMatches(content).lastOrNull;
      if (lastImportMatch != null) {
        final insertPos = lastImportMatch.end;
        content = content.substring(0, insertPos) +
            "import 'package:thittam1hub/services/logging_service.dart';\n" +
            content.substring(insertPos);
        replacements.add(Replacement('Added LoggingService import'));
      }
    }
    
    // Add _log field after class declaration
    if (className != null) {
      final classMatch = RegExp('class\\s+$className[^{]*\\{').firstMatch(content);
      if (classMatch != null) {
        final insertPos = classMatch.end;
        final tagName = className;
        final indent = '  ';
        content = content.substring(0, insertPos) +
            "\n$indent// Logging\n" +
            "$indent static final _log = LoggingService.instance;\n" +
            "$indent static const String _tag = '$tagName';\n" +
            content.substring(insertPos);
        replacements.add(Replacement('Added _log field and _tag constant'));
      }
    }
  }
  
  // Replace debugPrint calls with simple strings
  content = content.replaceAllMapped(
    RegExp(r"debugPrint\s*\(\s*'([^']*)'\s*\)"),
    (match) {
      final message = match.group(1) ?? '';
      final level = determineLogLevel(message);
      
      if (usesBase) {
        // Use BaseService methods
        return 'log${level[0].toUpperCase()}${level.substring(1)}(\'$message\')';
      } else {
        // Use _log instance
        return '_log.$level(\'$message\', tag: _tag)';
      }
    },
  );
  
  // Replace debugPrint calls with double quotes
  content = content.replaceAllMapped(
    RegExp(r'debugPrint\s*\(\s*"([^"]*)"\s*\)'),
    (match) {
      final message = match.group(1) ?? '';
      final level = determineLogLevel(message);
      
      if (usesBase) {
        return 'log${level[0].toUpperCase()}${level.substring(1)}(\'$message\')';
      } else {
        return '_log.$level(\'$message\', tag: _tag)';
      }
    },
  );
  
  // Replace print() calls (not debugPrint) with simple strings
  content = content.replaceAllMapped(
    RegExp(r"(?<!debug)print\s*\(\s*'([^']*)'\s*\)"),
    (match) {
      final message = match.group(1) ?? '';
      
      if (usesBase) {
        return 'logDebug(\'$message\')';
      } else {
        return '_log.debug(\'$message\', tag: _tag)';
      }
    },
  );
  
  // Replace print() calls with double quotes
  content = content.replaceAllMapped(
    RegExp(r'(?<!debug)print\s*\(\s*"([^"]*)"\s*\)'),
    (match) {
      final message = match.group(1) ?? '';
      
      if (usesBase) {
        return 'logDebug(\'$message\')';
      } else {
        return '_log.debug(\'$message\', tag: _tag)';
      }
    },
  );
  
  if (content == originalContent) {
    return FileResult(relativePath, skipped: true, reason: 'No changes needed');
  }
  
  if (!dryRun) {
    await file.writeAsString(content);
  }
  
  return FileResult(
    relativePath,
    modified: true,
    debugPrintCount: debugPrintCount,
    printCount: printCount,
    replacements: replacements,
  );
}

class FileResult {
  final String path;
  final bool skipped;
  final bool modified;
  final String? reason;
  final int debugPrintCount;
  final int printCount;
  final List<Replacement> replacements;
  
  FileResult(
    this.path, {
    this.skipped = false,
    this.modified = false,
    this.reason,
    this.debugPrintCount = 0,
    this.printCount = 0,
    this.replacements = const [],
  });
}

class Replacement {
  final String description;
  Replacement(this.description);
}

Future<void> main(List<String> args) async {
  final dryRun = args.contains('--dry-run');
  final specificFile = args.where((a) => a.startsWith('--file=')).map((a) => a.substring(7)).firstOrNull;
  
  print('╔══════════════════════════════════════════════════════════════╗');
  print('║  debugPrint → LoggingService Migration Tool                  ║');
  print('║  Phase 2 of Industrial Best Practice Refactoring             ║');
  print('╚══════════════════════════════════════════════════════════════╝');
  print('');
  print('Mode: ${dryRun ? "DRY RUN (no files modified)" : "LIVE (files will be modified)"}');
  print('');
  
  final libDir = Directory('lib');
  if (!await libDir.exists()) {
    print('❌ Error: lib/ directory not found. Run from project root.');
    exit(1);
  }
  
  final files = <File>[];
  
  if (specificFile != null) {
    final file = File(specificFile);
    if (await file.exists()) {
      files.add(file);
    } else {
      print('❌ Error: File not found: $specificFile');
      exit(1);
    }
  } else {
    await for (final entity in libDir.list(recursive: true)) {
      if (entity is File && entity.path.endsWith('.dart')) {
        files.add(entity);
      }
    }
  }
  
  print('📂 Found ${files.length} Dart files to scan');
  print('');
  
  var modifiedCount = 0;
  var skippedCount = 0;
  var totalDebugPrints = 0;
  var totalPrints = 0;
  final excludedResults = <FileResult>[];
  final modifiedResults = <FileResult>[];
  
  for (final file in files) {
    final result = await processFile(file, dryRun: dryRun);
    
    if (result.skipped) {
      skippedCount++;
      if (result.reason?.contains('Excluded') ?? false) {
        excludedResults.add(result);
      }
    } else if (result.modified) {
      modifiedCount++;
      totalDebugPrints += result.debugPrintCount;
      totalPrints += result.printCount;
      modifiedResults.add(result);
    }
  }
  
  // Print summary
  print('═══════════════════════════════════════════════════════════════');
  print('SUMMARY');
  print('═══════════════════════════════════════════════════════════════');
  print('');
  
  if (excludedResults.isNotEmpty) {
    print('📋 Excluded Files (Approved Exceptions):');
    for (final result in excludedResults) {
      print('   • ${result.path}');
    }
    print('');
  }
  
  if (modifiedResults.isNotEmpty) {
    print('✏️  ${dryRun ? "Would modify" : "Modified"} Files:');
    for (final result in modifiedResults) {
      print('   • ${result.path}');
      print('     debugPrint: ${result.debugPrintCount}, print: ${result.printCount}');
    }
    print('');
  }
  
  print('📊 Statistics:');
  print('   Files scanned:     ${files.length}');
  print('   Files ${dryRun ? "to modify" : "modified"}:    $modifiedCount');
  print('   Files skipped:     $skippedCount');
  print('   debugPrint calls:  $totalDebugPrints');
  print('   print calls:       $totalPrints');
  print('   Total replaced:    ${totalDebugPrints + totalPrints}');
  print('');
  
  if (dryRun) {
    print('ℹ️  Run without --dry-run to apply changes');
  } else {
    print('✅ Migration complete!');
    print('');
    print('Next steps:');
    print('1. Run "flutter analyze" to check for issues');
    print('2. Run "flutter test" to verify functionality');
    print('3. Review changes with "git diff"');
  }
}
