import 'dart:async';

/// Client-side rate limiter for debouncing high-frequency actions.
/// This provides immediate feedback before server-side rate limits kick in.
class RateLimiter {
  static final RateLimiter _instance = RateLimiter._();
  static RateLimiter get instance => _instance;
  RateLimiter._();

  final Map<String, _RateLimitEntry> _limits = {};

  /// Rate limit configurations for different actions
  static const Map<String, ({int maxRequests, Duration window})> _configs = {
    'question_submit': (maxRequests: 5, window: Duration(minutes: 5)),
    'upvote': (maxRequests: 30, window: Duration(minutes: 1)),
    'poll_vote': (maxRequests: 10, window: Duration(minutes: 1)),
    'bookmark': (maxRequests: 20, window: Duration(minutes: 1)),
    'booth_visit': (maxRequests: 10, window: Duration(minutes: 1)),
    'challenge_complete': (maxRequests: 10, window: Duration(minutes: 1)),
  };

  /// Check if action is allowed within rate limit.
  /// Returns true if allowed, false if rate limited.
  bool checkLimit(String action, {String? userId}) {
    final key = userId != null ? '$action:$userId' : action;
    final config = _configs[action];
    
    if (config == null) return true; // No limit configured
    
    final entry = _limits[key];
    final now = DateTime.now();
    
    if (entry == null || now.difference(entry.windowStart) > config.window) {
      // New window
      _limits[key] = _RateLimitEntry(windowStart: now, count: 1);
      return true;
    }
    
    if (entry.count >= config.maxRequests) {
      return false;
    }
    
    entry.count++;
    return true;
  }

  /// Get remaining requests for an action.
  int getRemainingRequests(String action, {String? userId}) {
    final key = userId != null ? '$action:$userId' : action;
    final config = _configs[action];
    
    if (config == null) return 999;
    
    final entry = _limits[key];
    final now = DateTime.now();
    
    if (entry == null || now.difference(entry.windowStart) > config.window) {
      return config.maxRequests;
    }
    
    return (config.maxRequests - entry.count).clamp(0, config.maxRequests);
  }

  /// Get time until rate limit resets.
  Duration? getResetTime(String action, {String? userId}) {
    final key = userId != null ? '$action:$userId' : action;
    final config = _configs[action];
    
    if (config == null) return null;
    
    final entry = _limits[key];
    if (entry == null) return null;
    
    final windowEnd = entry.windowStart.add(config.window);
    final remaining = windowEnd.difference(DateTime.now());
    
    return remaining.isNegative ? Duration.zero : remaining;
  }

  /// Clear all rate limit data.
  void clear() {
    _limits.clear();
  }

  /// Clear rate limit for specific action.
  void clearAction(String action, {String? userId}) {
    final key = userId != null ? '$action:$userId' : action;
    _limits.remove(key);
  }
}

class _RateLimitEntry {
  final DateTime windowStart;
  int count;

  _RateLimitEntry({required this.windowStart, required this.count});
}

/// Mixin for adding rate limiting to widgets/services.
mixin RateLimitMixin {
  final RateLimiter _rateLimiter = RateLimiter.instance;

  /// Execute action if within rate limit, otherwise call onRateLimited.
  Future<T?> withRateLimit<T>({
    required String action,
    String? userId,
    required Future<T> Function() execute,
    void Function(Duration resetIn)? onRateLimited,
  }) async {
    if (!_rateLimiter.checkLimit(action, userId: userId)) {
      final resetIn = _rateLimiter.getResetTime(action, userId: userId);
      onRateLimited?.call(resetIn ?? const Duration(seconds: 60));
      return null;
    }
    
    return execute();
  }

  /// Check if action is allowed.
  bool canPerformAction(String action, {String? userId}) {
    return _rateLimiter.checkLimit(action, userId: userId);
  }

  /// Get remaining requests for action.
  int remainingRequests(String action, {String? userId}) {
    return _rateLimiter.getRemainingRequests(action, userId: userId);
  }
}

/// Debouncer for preventing rapid repeated actions.
class Debouncer {
  final Duration delay;
  Timer? _timer;

  Debouncer({this.delay = const Duration(milliseconds: 300)});

  void run(void Function() action) {
    _timer?.cancel();
    _timer = Timer(delay, action);
  }

  void cancel() {
    _timer?.cancel();
    _timer = null;
  }

  bool get isActive => _timer?.isActive ?? false;
}

/// Throttler for limiting action frequency.
class Throttler {
  final Duration interval;
  DateTime? _lastRun;

  Throttler({this.interval = const Duration(milliseconds: 500)});

  bool run(void Function() action) {
    final now = DateTime.now();
    
    if (_lastRun == null || now.difference(_lastRun!) >= interval) {
      _lastRun = now;
      action();
      return true;
    }
    
    return false;
  }

  void reset() {
    _lastRun = null;
  }
}
