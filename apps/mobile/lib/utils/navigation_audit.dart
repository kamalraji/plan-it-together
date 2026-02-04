/// Navigation Audit Utility
/// 
/// This utility analyzes navigation calls across the codebase to ensure
/// consistency with AppRoutes helpers and flag hardcoded paths.
/// 
/// Usage: Run `dart run lib/utils/navigation_audit.dart` from project root
/// or call `NavigationAudit.runAudit()` programmatically.

import 'dart:io';

import 'package:thittam1hub/services/logging_service.dart';
/// Represents a navigation call found in the codebase
class NavigationCall {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'NavigationCall';

  final String filePath;
  final int lineNumber;
  final String callType; // go, push, replace, goNamed, pushNamed
  final String rawCall;
  final String? extractedPath;
  final bool isHardcoded;
  final String? suggestedFix;
  final AuditSeverity severity;

  const NavigationCall({
    required this.filePath,
    required this.lineNumber,
    required this.callType,
    required this.rawCall,
    this.extractedPath,
    required this.isHardcoded,
    this.suggestedFix,
    required this.severity,
  });

  @override
  String toString() {
    final severityIcon = switch (severity) {
      AuditSeverity.error => '❌',
      AuditSeverity.warning => '⚠️',
      AuditSeverity.info => 'ℹ️',
      AuditSeverity.ok => '✅',
    };
    return '$severityIcon [$callType] $filePath:$lineNumber\n'
        '   Raw: $rawCall\n'
        '   ${isHardcoded ? "HARDCODED" : "Uses AppRoutes"}${suggestedFix != null ? "\n   Suggestion: $suggestedFix" : ""}';
  }
}

enum AuditSeverity { error, warning, info, ok }

/// Known AppRoutes constants and helpers for validation
class AppRoutesRegistry {
  // Static route constants that should be used instead of hardcoded strings
  static const Map<String, String> staticRoutes = {
    '/': 'AppRoutes.home',
    '/discover': 'AppRoutes.discover',
    '/chat': 'AppRoutes.chat',
    '/profile': 'AppRoutes.profile',
    '/notifications': 'AppRoutes.notifications',
    '/sign-in': 'AppRoutes.signIn',
    '/sign-up': 'AppRoutes.signUp',
    '/onboarding': 'AppRoutes.onboarding',
    '/profile/settings': 'AppRoutes.settings',
    '/profile/edit': 'AppRoutes.editProfile',
    '/profile/followers': 'AppRoutes.followers',
    '/profile/saved': 'AppRoutes.savedEvents',
    '/profile/tickets': 'AppRoutes.tickets',
    '/profile/achievements': 'AppRoutes.achievements',
    '/chat/settings': 'AppRoutes.chatSettings',
  };

  // Pattern-based routes that have helper methods
  static const List<RoutePattern> dynamicRoutes = [
    RoutePattern(
      pattern: r'^/events?/([a-zA-Z0-9-]+)$',
      helper: 'AppRoutes.eventDetail(eventId)',
      description: 'Event detail page',
    ),
    RoutePattern(
      pattern: r'^/profile/tickets/([a-zA-Z0-9-]+)$',
      helper: 'AppRoutes.ticketDetail(ticketId)',
      description: 'Ticket detail page',
    ),
    RoutePattern(
      pattern: r'^/users?/([a-zA-Z0-9-]+)$',
      helper: 'AppRoutes.userProfile(userId)',
      description: 'User profile page',
    ),
    RoutePattern(
      pattern: r'^/chat/([a-zA-Z0-9-]+)$',
      helper: 'AppRoutes.chatDetail(channelId)',
      description: 'Chat detail page',
    ),
    RoutePattern(
      pattern: r'^/workspaces?/([a-zA-Z0-9-]+)$',
      helper: 'AppRoutes.workspaceDetail(workspaceId)',
      description: 'Workspace detail page',
    ),
    RoutePattern(
      pattern: r'^/circles?/([a-zA-Z0-9-]+)$',
      helper: 'AppRoutes.circleDetail(circleId)',
      description: 'Circle detail page',
    ),
  ];

  // Routes with query parameter helpers
  static const List<QueryParamRoute> queryParamRoutes = [
    QueryParamRoute(
      basePath: '/chat',
      params: ['tab', 'filter', 'search'],
      helper: 'AppRoutes.chatWithFilters(tab, filter, search)',
    ),
    QueryParamRoute(
      basePath: '/profile/followers',
      params: ['tab'],
      helper: 'AppRoutes.followersWithTab(tab)',
    ),
    QueryParamRoute(
      basePath: '/profile/tickets',
      params: ['tab'],
      helper: 'AppRoutes.ticketsWithTab(tab)',
    ),
    QueryParamRoute(
      basePath: '/profile/saved',
      params: ['filter'],
      helper: 'AppRoutes.savedEventsWithFilter(filter)',
    ),
    QueryParamRoute(
      basePath: '/notifications',
      params: ['category'],
      helper: 'AppRoutes.notificationsWithCategory(category)',
    ),
    QueryParamRoute(
      basePath: '/profile/settings',
      params: ['tab'],
      helper: 'AppRoutes.settingsWithSection(section) or settingsWithTab(tab)',
    ),
    QueryParamRoute(
      basePath: '/chat/settings',
      params: ['tab', 'channelId', 'channelName', 'isDM'],
      helper: 'AppRoutes.chatSettingsWithSection(section) or chatSettingsWithTab(tab)',
    ),
  ];

  /// Get suggestion for a hardcoded path
  static String? getSuggestion(String path) {
    // Check static routes first
    if (staticRoutes.containsKey(path)) {
      return 'Use ${staticRoutes[path]}';
    }

    // Check for query params
    final uri = Uri.tryParse(path);
    if (uri != null && uri.queryParameters.isNotEmpty) {
      for (final route in queryParamRoutes) {
        if (uri.path == route.basePath) {
          return 'Use ${route.helper}';
        }
      }
    }

    // Check dynamic routes
    for (final route in dynamicRoutes) {
      if (RegExp(route.pattern).hasMatch(path)) {
        return 'Use ${route.helper}';
      }
    }

    return null;
  }
}

class RoutePattern {
  final String pattern;
  final String helper;
  final String description;

  const RoutePattern({
    required this.pattern,
    required this.helper,
    required this.description,
  });
}

class QueryParamRoute {
  final String basePath;
  final List<String> params;
  final String helper;

  const QueryParamRoute({
    required this.basePath,
    required this.params,
    required this.helper,
  });
}

/// Main audit class
class NavigationAudit {
  // Regex patterns for finding navigation calls
  static final _goPattern = RegExp(
    r'context\s*\.\s*go\s*\(\s*([^)]+)\)',
    multiLine: true,
  );
  static final _pushPattern = RegExp(
    r'context\s*\.\s*push\s*\(\s*([^)]+)\)',
    multiLine: true,
  );
  static final _replacePattern = RegExp(
    r'context\s*\.\s*replace\s*\(\s*([^)]+)\)',
    multiLine: true,
  );
  static final _goNamedPattern = RegExp(
    r'context\s*\.\s*goNamed\s*\(\s*([^)]+)\)',
    multiLine: true,
  );
  static final _pushNamedPattern = RegExp(
    r'context\s*\.\s*pushNamed\s*\(\s*([^)]+)\)',
    multiLine: true,
  );

  // Pattern to detect hardcoded string paths
  static final _hardcodedPathPattern = RegExp(
    r'''['"](/[^'"]*)['"]\s*(?:,|\))''',
  );

  // Pattern to detect AppRoutes usage
  static final _appRoutesPattern = RegExp(
    r'AppRoutes\.[a-zA-Z_][a-zA-Z0-9_]*',
  );

  /// Run a full audit on the lib directory
  static Future<AuditReport> runAudit({String? directory}) async {
    final dir = Directory(directory ?? 'lib');
    if (!await dir.exists()) {
      throw Exception('Directory ${dir.path} does not exist');
    }

    final calls = <NavigationCall>[];
    final dartFiles = await _findDartFiles(dir);

    for (final file in dartFiles) {
      final fileCalls = await _auditFile(file);
      calls.addAll(fileCalls);
    }

    return AuditReport(calls: calls);
  }

  static Future<List<File>> _findDartFiles(Directory dir) async {
    final files = <File>[];
    await for (final entity in dir.list(recursive: true)) {
      if (entity is File && entity.path.endsWith('.dart')) {
        // Skip generated files and test files for main audit
        if (!entity.path.contains('.g.dart') &&
            !entity.path.contains('.freezed.dart') &&
            !entity.path.contains('navigation_audit.dart')) {
          files.add(entity);
        }
      }
    }
    return files;
  }

  static Future<List<NavigationCall>> _auditFile(File file) async {
    final content = await file.readAsString();
    final lines = content.split('\n');
    final calls = <NavigationCall>[];

    // Find all navigation calls with their line numbers
    calls.addAll(_findPatternCalls(file.path, content, lines, _goPattern, 'go'));
    calls.addAll(_findPatternCalls(file.path, content, lines, _pushPattern, 'push'));
    calls.addAll(_findPatternCalls(file.path, content, lines, _replacePattern, 'replace'));
    calls.addAll(_findPatternCalls(file.path, content, lines, _goNamedPattern, 'goNamed'));
    calls.addAll(_findPatternCalls(file.path, content, lines, _pushNamedPattern, 'pushNamed'));

    return calls;
  }

  static List<NavigationCall> _findPatternCalls(
    String filePath,
    String content,
    List<String> lines,
    RegExp pattern,
    String callType,
  ) {
    final calls = <NavigationCall>[];
    
    for (final match in pattern.allMatches(content)) {
      final rawCall = match.group(0) ?? '';
      final argument = match.group(1) ?? '';
      
      // Calculate line number
      final beforeMatch = content.substring(0, match.start);
      final lineNumber = '\n'.allMatches(beforeMatch).length + 1;

      // Check if it's a hardcoded path or uses AppRoutes
      final isHardcoded = _hardcodedPathPattern.hasMatch(argument) &&
          !_appRoutesPattern.hasMatch(argument);
      
      String? extractedPath;
      String? suggestedFix;
      AuditSeverity severity;

      if (isHardcoded) {
        final pathMatch = _hardcodedPathPattern.firstMatch(argument);
        extractedPath = pathMatch?.group(1);
        if (extractedPath != null) {
          suggestedFix = AppRoutesRegistry.getSuggestion(extractedPath);
        }
        severity = suggestedFix != null ? AuditSeverity.error : AuditSeverity.warning;
      } else if (_appRoutesPattern.hasMatch(argument)) {
        severity = AuditSeverity.ok;
      } else {
        // Variable or expression - needs manual review
        severity = AuditSeverity.info;
        suggestedFix = 'Manual review required - ensure variable uses AppRoutes';
      }

      calls.add(NavigationCall(
        filePath: filePath,
        lineNumber: lineNumber,
        callType: callType,
        rawCall: rawCall.trim(),
        extractedPath: extractedPath,
        isHardcoded: isHardcoded,
        suggestedFix: suggestedFix,
        severity: severity,
      ));
    }

    return calls;
  }
}

/// Audit report with analysis methods
class AuditReport {
  final List<NavigationCall> calls;

  const AuditReport({required this.calls});

  int get totalCalls => calls.length;
  
  List<NavigationCall> get errors => 
      calls.where((c) => c.severity == AuditSeverity.error).toList();
  
  List<NavigationCall> get warnings => 
      calls.where((c) => c.severity == AuditSeverity.warning).toList();
  
  List<NavigationCall> get needsReview => 
      calls.where((c) => c.severity == AuditSeverity.info).toList();
  
  List<NavigationCall> get compliant => 
      calls.where((c) => c.severity == AuditSeverity.ok).toList();

  double get complianceRate => 
      totalCalls > 0 ? (compliant.length / totalCalls) * 100 : 100;

  /// Group calls by file
  Map<String, List<NavigationCall>> get byFile {
    final map = <String, List<NavigationCall>>{};
    for (final call in calls) {
      map.putIfAbsent(call.filePath, () => []).add(call);
    }
    return map;
  }

  /// Print a formatted report
  void printReport({bool verbose = false}) {
    print('\n${'=' * 60}');
    _log.debug('NAVIGATION AUDIT REPORT', tag: _tag);
    print('=' * 60);
    _log.debug('', tag: _tag);
    _log.debug('📊 Summary:', tag: _tag);
    _log.debug('   Total navigation calls: $totalCalls', tag: _tag);
    _log.debug('   ✅ Compliant (using AppRoutes): ${compliant.length}', tag: _tag);
    _log.debug('   ❌ Errors (hardcoded with known fix): ${errors.length}', tag: _tag);
    _log.debug('   ⚠️  Warnings (hardcoded, no known fix): ${warnings.length}', tag: _tag);
    _log.debug('   ℹ️  Needs review: ${needsReview.length}', tag: _tag);
    _log.debug('   📈 Compliance rate: ${complianceRate.toStringAsFixed(1)}%', tag: _tag);
    _log.debug('', tag: _tag);

    if (errors.isNotEmpty) {
      print('${'─' * 60}');
      _log.debug('❌ ERRORS (Must Fix):', tag: _tag);
      print('${'─' * 60}');
      for (final call in errors) {
        print(call);
        _log.debug('', tag: _tag);
      }
    }

    if (warnings.isNotEmpty) {
      print('${'─' * 60}');
      _log.debug('⚠️  WARNINGS (Should Fix):', tag: _tag);
      print('${'─' * 60}');
      for (final call in warnings) {
        print(call);
        _log.debug('', tag: _tag);
      }
    }

    if (verbose && needsReview.isNotEmpty) {
      print('${'─' * 60}');
      _log.debug('ℹ️  NEEDS MANUAL REVIEW:', tag: _tag);
      print('${'─' * 60}');
      for (final call in needsReview) {
        print(call);
        _log.debug('', tag: _tag);
      }
    }

    if (verbose && compliant.isNotEmpty) {
      print('${'─' * 60}');
      _log.debug('✅ COMPLIANT CALLS:', tag: _tag);
      print('${'─' * 60}');
      for (final call in compliant) {
        _log.debug('   ${call.filePath}:${call.lineNumber} - ${call.callType}', tag: _tag);
      }
    }

    _log.debug('', tag: _tag);
    print('=' * 60);
    _log.debug('END OF REPORT', tag: _tag);
    print('=' * 60);
  }

  /// Export report as JSON for CI integration
  Map<String, dynamic> toJson() => {
    'summary': {
      'total': totalCalls,
      'compliant': compliant.length,
      'errors': errors.length,
      'warnings': warnings.length,
      'needsReview': needsReview.length,
      'complianceRate': complianceRate,
    },
    'errors': errors.map((c) => {
      return {
        'file': c.filePath,
        'line': c.lineNumber,
        'call': c.rawCall,
        'path': c.extractedPath,
        'suggestion': c.suggestedFix,
      };
    }).toList(),
    'warnings': warnings.map((c) => {
      return {
        'file': c.filePath,
        'line': c.lineNumber,
        'call': c.rawCall,
        'path': c.extractedPath,
      };
    }).toList(),
  };
}

/// CLI entry point
Future<void> main(List<String> args) async {
  final verbose = args.contains('-v') || args.contains('--verbose');
  final jsonOutput = args.contains('--json');
  
  _log.debug('🔍 Running Navigation Audit...\n', tag: _tag);
  
  try {
    final report = await NavigationAudit.runAudit();
    
    if (jsonOutput) {
      print(report.toJson());
    } else {
      report.printReport(verbose: verbose);
    }
    
    // Exit with error code if there are errors (useful for CI)
    if (report.errors.isNotEmpty) {
      exit(1);
    }
  } catch (e) {
    _log.debug('❌ Audit failed: $e', tag: _tag);
    exit(2);
  }
}
