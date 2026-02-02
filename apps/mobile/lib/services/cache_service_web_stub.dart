import 'package:thittam1hub/services/logging_service.dart';

/// Web stub for Hive initialization
/// On web, we rely only on SharedPreferences
Future<void> initHiveCache() async {
  LoggingService.instance.info(
    'Hive skipped on web - using SharedPreferences only',
    tag: 'CacheService',
  );
}
