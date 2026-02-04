# Singleton Pattern Standard

## Standard Pattern

All services in this codebase use the following standardized singleton pattern:

```dart
class MyService {
  static MyService? _instance;
  static MyService get instance => _instance ??= MyService._();
  MyService._();
  
  // Service implementation...
}
```

## Usage

Access singletons via the `instance` getter:

```dart
final service = MyService.instance;
```

## Benefits

- **Lazy initialization**: Instance created only when first accessed
- **Testability**: `_instance` can be reset in tests
- **Consistency**: Same pattern across all services
- **Memory efficient**: Single instance guaranteed

## Migration from Factory Pattern

The old factory pattern has been deprecated:

```dart
// ❌ OLD - Don't use
static final MyService _instance = MyService._internal();
factory MyService() => _instance;

// ✅ NEW - Use this
static MyService? _instance;
static MyService get instance => _instance ??= MyService._();
```

## Services Updated (Phase 3)

- AnalyticsFacade
- BackupFacade
- BiometricService
- ChatService
- ChatSecurityService
- CommentService
- CommentAnalyticsService
- ConsentService
- DeviceFingerprintService
- EnhancedSecurityService
- FeedAnalyticsService
- FollowersService
- NotificationService
- PresenceService
- PrivacyService
- SecureStorageService
- VideoThumbnailService
- AccessibilityService
- LocaleService
