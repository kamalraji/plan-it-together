import 'dart:async';
import 'package:thittam1hub/services/logging_service.dart';

/// Performance monitoring utility for Zone feature operations.
/// Tracks query times, subscription health, and identifies slow operations.
class ZonePerformanceMonitor {
  static final ZonePerformanceMonitor _instance = ZonePerformanceMonitor._();
  static ZonePerformanceMonitor get instance => _instance;
  ZonePerformanceMonitor._();

  static final _log = LoggingService.instance;
  static const String _tag = 'ZonePerformance';

  // Performance thresholds
  static const Duration _slowQueryThreshold = Duration(milliseconds: 500);
  static const Duration _criticalQueryThreshold = Duration(seconds: 2);

  // Metrics storage
  final Map<String, _QueryMetrics> _queryMetrics = {};
  final List<_PerformanceEvent> _recentEvents = [];
  static const int _maxRecentEvents = 100;

  /// Measure an async operation and log if it exceeds thresholds.
  Future<T> measureAsync<T>(
    String operationName,
    Future<T> Function() operation, {
    Duration? customThreshold,
  }) async {
    final stopwatch = Stopwatch()..start();
    
    try {
      final result = await operation();
      stopwatch.stop();
      
      _recordMetrics(operationName, stopwatch.elapsed, success: true);
      _checkThreshold(operationName, stopwatch.elapsed, customThreshold);
      
      return result;
    } catch (e) {
      stopwatch.stop();
      _recordMetrics(operationName, stopwatch.elapsed, success: false);
      rethrow;
    }
  }

  /// Measure a sync operation.
  T measureSync<T>(
    String operationName,
    T Function() operation, {
    Duration? customThreshold,
  }) {
    final stopwatch = Stopwatch()..start();
    
    try {
      final result = operation();
      stopwatch.stop();
      
      _recordMetrics(operationName, stopwatch.elapsed, success: true);
      _checkThreshold(operationName, stopwatch.elapsed, customThreshold);
      
      return result;
    } catch (e) {
      stopwatch.stop();
      _recordMetrics(operationName, stopwatch.elapsed, success: false);
      rethrow;
    }
  }

  void _recordMetrics(String operation, Duration duration, {required bool success}) {
    final metrics = _queryMetrics.putIfAbsent(operation, () => _QueryMetrics());
    metrics.addSample(duration, success: success);

    // Add to recent events
    _recentEvents.add(_PerformanceEvent(
      operation: operation,
      duration: duration,
      success: success,
      timestamp: DateTime.now(),
    ));

    // Trim old events
    while (_recentEvents.length > _maxRecentEvents) {
      _recentEvents.removeAt(0);
    }
  }

  void _checkThreshold(String operation, Duration duration, Duration? customThreshold) {
    final threshold = customThreshold ?? _slowQueryThreshold;
    
    if (duration > _criticalQueryThreshold) {
      _log.error(
        'CRITICAL: $operation took ${duration.inMilliseconds}ms',
        tag: _tag,
      );
    } else if (duration > threshold) {
      _log.warning(
        'SLOW: $operation took ${duration.inMilliseconds}ms',
        tag: _tag,
      );
    }
  }

  /// Get metrics summary for an operation.
  QueryMetricsSummary? getMetrics(String operation) {
    final metrics = _queryMetrics[operation];
    if (metrics == null) return null;
    return metrics.summary;
  }

  /// Get all metrics summaries.
  Map<String, QueryMetricsSummary> getAllMetrics() {
    return _queryMetrics.map((key, value) => MapEntry(key, value.summary));
  }

  /// Get recent slow operations.
  List<_PerformanceEvent> getSlowOperations({Duration? threshold}) {
    final t = threshold ?? _slowQueryThreshold;
    return _recentEvents.where((e) => e.duration > t).toList();
  }

  /// Clear all metrics.
  void clearMetrics() {
    _queryMetrics.clear();
    _recentEvents.clear();
  }

  /// Log a metrics report.
  void logReport() {
    _log.info('=== Zone Performance Report ===', tag: _tag);
    
    for (final entry in _queryMetrics.entries) {
      final s = entry.value.summary;
      _log.info(
        '${entry.key}: avg=${s.avgMs}ms, p95=${s.p95Ms}ms, '
        'count=${s.count}, errors=${s.errorCount}',
        tag: _tag,
      );
    }
  }
}

class _QueryMetrics {
  final List<Duration> _samples = [];
  int _errorCount = 0;

  void addSample(Duration duration, {required bool success}) {
    _samples.add(duration);
    if (!success) _errorCount++;
    
    // Keep only last 100 samples
    while (_samples.length > 100) {
      _samples.removeAt(0);
    }
  }

  QueryMetricsSummary get summary {
    if (_samples.isEmpty) {
      return QueryMetricsSummary(
        avgMs: 0,
        minMs: 0,
        maxMs: 0,
        p95Ms: 0,
        count: 0,
        errorCount: 0,
      );
    }

    final sorted = List<Duration>.from(_samples)..sort();
    final total = _samples.fold<int>(0, (sum, d) => sum + d.inMilliseconds);
    final p95Index = (sorted.length * 0.95).floor().clamp(0, sorted.length - 1);

    return QueryMetricsSummary(
      avgMs: total ~/ _samples.length,
      minMs: sorted.first.inMilliseconds,
      maxMs: sorted.last.inMilliseconds,
      p95Ms: sorted[p95Index].inMilliseconds,
      count: _samples.length,
      errorCount: _errorCount,
    );
  }
}

class QueryMetricsSummary {
  final int avgMs;
  final int minMs;
  final int maxMs;
  final int p95Ms;
  final int count;
  final int errorCount;

  QueryMetricsSummary({
    required this.avgMs,
    required this.minMs,
    required this.maxMs,
    required this.p95Ms,
    required this.count,
    required this.errorCount,
  });

  @override
  String toString() =>
      'QueryMetrics(avg: ${avgMs}ms, p95: ${p95Ms}ms, count: $count, errors: $errorCount)';
}

class _PerformanceEvent {
  final String operation;
  final Duration duration;
  final bool success;
  final DateTime timestamp;

  _PerformanceEvent({
    required this.operation,
    required this.duration,
    required this.success,
    required this.timestamp,
  });
}
