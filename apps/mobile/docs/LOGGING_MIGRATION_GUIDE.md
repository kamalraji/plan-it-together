# Logging Migration Guide

## Overview

This guide documents the Phase 2 migration from `debugPrint()` to the centralized `LoggingService`. The migration ensures consistent, structured logging across all 77+ services.

## Migration Tool

### Location
```
tools/migrate_debug_prints.dart
```

### Usage

```bash
# Dry run - see what would change
dart run tools/migrate_debug_prints.dart --dry-run

# Apply changes
dart run tools/migrate_debug_prints.dart

# Process single file
dart run tools/migrate_debug_prints.dart --file=lib/supabase/circle_service.dart
```

## Approved Exceptions

The following files are **excluded** from migration due to specific technical requirements:

| File | Reason |
|------|--------|
| `lib/services/backup_scheduler_service.dart` | Background isolates cannot access `LoggingService` singleton |
| `lib/services/e2e_encryption_service.dart` | Uses `_secureLogDebug` helper that strips sensitive cryptographic data |
| `lib/services/secure_storage_service.dart` | Uses `_maskKey` helper to obscure key names in logs |
| `lib/services/device_fingerprint_service.dart` | Uses `_maskFingerprint` to protect device identifiers |

## Logging Patterns

### 1. Services Extending BaseService

```dart
class MyService extends BaseService {
  @override
  String get tag => 'MyService';

  Future<void> doSomething() async {
    logDebug('Starting operation');
    logInfo('Operation completed successfully');
    logWarning('Resource usage high', metadata: {'usage': 95});
    logError('Operation failed', error: e, stackTrace: stackTrace);
  }
}
```

### 2. ChangeNotifier Classes (Composition Pattern)

```dart
class MyProvider extends ChangeNotifier {
  static final _log = LoggingService.instance;
  static const String _tag = 'MyProvider';

  void doSomething() {
    _log.debug('Starting operation', tag: _tag);
    _log.info('Operation completed', tag: _tag);
    _log.warning('Resource usage high', tag: _tag, metadata: {'usage': 95});
    _log.error('Operation failed', tag: _tag, error: e);
  }
}
```

### 3. Static/Utility Classes

```dart
class MyUtils {
  static final _log = LoggingService.instance;
  static const String _tag = 'MyUtils';

  static void process() {
    _log.debug('Processing...', tag: _tag);
  }
}
```

## Log Level Guidelines

| Level | When to Use | Examples |
|-------|-------------|----------|
| `debug` | Development diagnostics, verbose tracing | State changes, method entry/exit |
| `info` | Notable runtime events | User login, feature activation, sync completed |
| `warning` | Potential issues, recoverable errors | Rate limit approaching, deprecated API use |
| `error` | Failures requiring attention | Network errors, auth failures, data corruption |

## Message Formatting

### ✅ Good Practices

```dart
// Include context
logInfo('User logged in', metadata: {'userId': userId});

// Be specific about failures
logError('Failed to sync messages', error: e, metadata: {
  'channelId': channelId,
  'messageCount': pending.length,
});

// Use consistent prefixes for categories
logDebug('DB: Fetched 15 records from events table');
logDebug('API: Request to /users completed in 45ms');
```

### ❌ Avoid

```dart
// Too vague
logError('Error occurred');

// Sensitive data in logs
logInfo('Password: $password');  // NEVER do this

// Emoji spam (legacy pattern being replaced)
debugPrint('🚀🔥✨ Starting app ✨🔥🚀');
```

## Verification Checklist

After migration, verify:

1. [ ] No `debugPrint` calls remain (except approved exceptions)
2. [ ] No raw `print()` calls remain
3. [ ] All logs have appropriate tags
4. [ ] Sensitive data is masked or excluded
5. [ ] `flutter analyze` passes
6. [ ] `flutter test` passes

## Related Documentation

- [BaseService Pattern](../lib/services/base_service.dart)
- [LoggingService API](../lib/services/logging_service.dart)
- [Error Handling Guide](../lib/services/error_handler.dart)
