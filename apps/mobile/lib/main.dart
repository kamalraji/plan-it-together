import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'theme.dart';
import 'nav.dart';
import 'services/theme_service.dart';
import 'services/cache_service.dart';
import 'services/connectivity_service.dart';
import 'services/background_sync_service.dart';
import 'services/offline_action_queue.dart';
import 'services/presence_service.dart';
import 'services/zone_state_service.dart';
import 'services/spark_batch_processor.dart';
import 'services/notification_service.dart';
import 'services/chat_sync_service.dart';
import 'services/local_message_store.dart';
import 'services/logging_service.dart';
import 'services/analytics_facade.dart';
import 'services/pip_controller.dart';
import 'services/accessibility_service.dart';
import 'widgets/common/error_boundary.dart';
import 'widgets/auth_state_listener.dart';
import 'widgets/zone/floating_pip_player.dart';
import 'repositories/supabase_zone_repository.dart';
import 'repositories/supabase_chat_repository.dart';
import 'repositories/supabase_profile_repository.dart';
import 'repositories/supabase_event_repository.dart';
import 'repositories/supabase_notification_repository.dart';
import 'providers/chat_provider.dart';
import 'providers/profile_provider.dart';
import 'providers/event_provider.dart';
import 'providers/notification_provider.dart';
import 'supabase/supabase_config.dart';

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/// Safe async initializer with logging
Future<void> _safeInit(
  Future<void> Function() init,
  String name,
  LoggingService log,
) async {
  try {
    await init();
    log.info('$name initialized', tag: 'Init');
  } catch (e) {
    log.error('Failed to initialize $name', tag: 'Init', error: e);
  }
}

/// Safe sync initializer with logging (fire-and-forget)
void _safeInitSync(void Function() init, String name, LoggingService log) {
  try {
    init();
    log.info('$name started', tag: 'Init');
  } catch (e) {
    log.error('Failed to start $name', tag: 'Init', error: e);
  }
}

/// Parallel service initialization with dependency tiers
Future<void> _initializeServices(LoggingService log) async {
  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 1: Core infrastructure (no dependencies) - run in parallel
  // ═══════════════════════════════════════════════════════════════════════════
  await Future.wait([
    _safeInit(() => SupabaseConfig.initialize(), 'Supabase', log),
    _safeInit(() => CacheService.instance.init(), 'CacheService', log),
    _safeInit(() => ConnectivityService.instance.init(), 'ConnectivityService', log),
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 2: Depends on Tier 1 (cache, connectivity) - run in parallel
  // ═══════════════════════════════════════════════════════════════════════════
  await Future.wait([
    _safeInit(() => OfflineActionQueue.instance.init(), 'OfflineActionQueue', log),
    _safeInit(() async => BackgroundSyncService.instance.init(), 'BackgroundSync', log),
    _safeInit(() => ChatSyncService.instance.init(), 'ChatSyncService', log),
    _safeInit(() => LocalMessageStore.instance.init(), 'LocalMessageStore', log),
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 3: Fire-and-forget services (no await needed)
  // ═══════════════════════════════════════════════════════════════════════════
  _safeInitSync(() => PresenceService.instance.init(), 'PresenceService', log);
  _safeInitSync(
    () => SparkBatchProcessor.startPeriodicBatchProcessing(
      interval: const Duration(seconds: 30),
    ),
    'SparkBatchProcessor',
    log,
  );
  _safeInitSync(
    () => NotificationService.initializeBatchProcessing(),
    'NotificationService',
    log,
  );
}

/// Main entry point for the application
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await SentryFlutter.init(
    (options) {
      options.dsn = const String.fromEnvironment(
        'SENTRY_DSN',
        defaultValue: '', // Set via --dart-define=SENTRY_DSN=your_dsn
      );
      options.tracesSampleRate = kDebugMode ? 1.0 : 0.1;
      options.environment = kDebugMode ? 'development' : 'production';
      options.sendDefaultPii = false;
      options.attachScreenshot = !kDebugMode;
      options.attachViewHierarchy = !kDebugMode;
    },
    appRunner: () async => _runApp(),
  );
}

/// App initialization and run logic (separated for Sentry wrapper)
Future<void> _runApp() async {
  // Initialize global error handler for production safety
  GlobalErrorHandler.initialize(
    onError: (error, stack) {
      final log = LoggingService.instance;
      log.error(
        'Uncaught error',
        tag: 'Global',
        error: error,
        stackTrace: stack,
      );
      
      // Production: Send to Sentry
      if (!kDebugMode) {
        Sentry.captureException(error, stackTrace: stack);
      }
    },
  );
  
  // Configure logging for production vs debug
  final log = LoggingService.instance;
  if (!kDebugMode) {
    log.minLevel = LogLevel.warning;
    log.onProductionError = (error, stack, context) {
      Sentry.captureException(
        error,
        stackTrace: stack,
        hint: Hint.withMap({'context': context}),
      );
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PARALLEL SERVICE INITIALIZATION (~450-900ms faster cold start)
  // ═══════════════════════════════════════════════════════════════════════════
  await _initializeServices(log);

  // Initialize theme service (quick, sequential is fine)
  final themeService = ThemeService();
  await themeService.loadThemeMode();

  // Initialize accessibility service for app-wide propagation
  final accessibilityService = AccessibilityService.instance;
  await accessibilityService.loadSettings();

  // Initialize Zone state service with repository
  final zoneStateService = ZoneStateService(SupabaseZoneRepository());
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE REPOSITORIES
  // ═══════════════════════════════════════════════════════════════════════════
  
  final chatRepository = SupabaseChatRepository();
  final profileRepository = SupabaseProfileRepository();
  final eventRepository = SupabaseEventRepository();
  final notificationRepository = SupabaseNotificationRepository();
  
  // Start analytics session
  AnalyticsFacade.instance.startSession();
  
  // Initialize PiP controller
  final pipController = PipController.instance;

  runApp(
    MultiProvider(
      providers: [
        // ═══════════════════════════════════════════════════════════════════════
        // CORE SERVICES
        // ═══════════════════════════════════════════════════════════════════════
        ChangeNotifierProvider.value(value: themeService),
        ChangeNotifierProvider.value(value: accessibilityService),
        ChangeNotifierProvider.value(value: zoneStateService),
        ChangeNotifierProvider.value(value: pipController),
        
        // ═══════════════════════════════════════════════════════════════════════
        // FEATURE PROVIDERS (with repository injection)
        // ═══════════════════════════════════════════════════════════════════════
        
        /// Chat provider for DMs, groups, and channels
        ChangeNotifierProvider(
          create: (_) => ChatProvider(chatRepository),
        ),
        
        /// Profile provider for current user and viewed profiles
        ChangeNotifierProvider(
          create: (_) => ProfileProvider(profileRepository),
        ),
        
        /// Event provider for discovery, filtering, and saved events
        ChangeNotifierProvider(
          create: (_) => EventProvider(eventRepository),
        ),
        
        /// Notification provider for alerts and unread counts
        ChangeNotifierProvider(
          create: (_) => NotificationProvider(notificationRepository),
        ),
      ],
      child: const AuthStateListener(
        child: MyApp(),
      ),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Use Selector for granular rebuilds - only rebuilds when themeMode changes
    return Selector<ThemeService, ThemeMode>(
      selector: (_, service) => service.themeMode,
      builder: (context, themeMode, _) => TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: 1),
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOutCubic,
        builder: (context, value, child) => MaterialApp.router(
          title: 'Thittam1hub',
          debugShowCheckedModeBanner: false,

          // Theme configuration with smooth transition
          theme: lightTheme,
          darkTheme: darkTheme,
          themeMode: themeMode,
          
          // App-wide builder with accessibility and PiP overlay
          builder: (context, child) {
            return _AccessibilityWrapper(
              child: AnimatedTheme(
                data: Theme.of(context),
                duration: const Duration(milliseconds: 350),
                curve: Curves.easeOutCubic,
                child: FloatingPipOverlay(
                  child: child ?? const SizedBox.shrink(),
                ),
              ),
            );
          },

          // Router configuration
          routerConfig: AppRouter.createRouter(),
        ),
      ),
    );
  }
}

/// Wrapper widget that applies accessibility settings app-wide
class _AccessibilityWrapper extends StatelessWidget {
  final Widget child;

  const _AccessibilityWrapper({required this.child});

  @override
  Widget build(BuildContext context) {
    // Watch accessibility settings for changes
    final accessibilityService = context.watch<AccessibilityService>();
    
    final textScaleFactor = accessibilityService.textScaleFactor;
    final boldText = accessibilityService.boldTextEnabled;
    final highContrast = accessibilityService.highContrastEnabled;
    
    return MediaQuery(
      data: MediaQuery.of(context).copyWith(
        // Apply text scaling from user preferences (clamp between 0.8 - 1.5)
        textScaler: TextScaler.linear(textScaleFactor.clamp(0.8, 1.5)),
        // Apply bold text preference
        boldText: boldText,
        // Apply high contrast preference
        highContrast: highContrast,
      ),
      child: child,
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});
  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  int _counter = 0;

  void _incrementCounter() {
    setState(() {
      _counter++;
    });
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Scaffold(
      appBar: AppBar(
        backgroundColor: cs.surface,
        title: Text(widget.title),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Text(
              'You have pushed the button this many times:',
              style: TextStyle(color: cs.onSurface),
            ),
            Text(
              '$_counter',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                color: cs.onSurface,
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter,
        tooltip: 'Increment',
        backgroundColor: cs.primary,
        foregroundColor: cs.onPrimary,
        child: const Icon(Icons.add),
      ),
    );
  }
}
