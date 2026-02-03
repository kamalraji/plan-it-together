import 'package:hive_flutter/hive_flutter.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/utils/result.dart';

/// Hive Cache Service
/// Provides persistent storage initialization for non-web platforms.
class HiveCacheService extends BaseService {
  HiveCacheService._();
  static HiveCacheService? _instance;
  static HiveCacheService get instance => _instance ??= HiveCacheService._();

  @override
  String get tag => 'HiveCache';

  bool _isInitialized = false;

  /// Initialize Hive cache for non-web platforms
  /// This provides better offline support with persistent storage
  Future<Result<void>> initialize() => execute(() async {
    if (_isInitialized) {
      logDebug('Already initialized');
      return;
    }
    
    await Hive.initFlutter();
    _isInitialized = true;
    logInfo('Hive initialized for enhanced caching');
  }, operationName: 'initialize');
}

/// Legacy function for backwards compatibility
Future<void> initHiveCache() async {
  final result = await HiveCacheService.instance.initialize();
  if (result is Failure) {
    // Silently handle - warning already logged by BaseService
  }
}
