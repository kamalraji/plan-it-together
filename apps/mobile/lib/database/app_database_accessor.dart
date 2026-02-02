/// App Database - Platform-aware barrel export
/// Uses conditional imports to provide native Drift database on mobile
/// and a no-op stub on web platform.
library app_database;

export 'database_interface.dart';

import 'database_interface.dart';

// Conditional import - uses web stub on web, native implementation elsewhere
import 'app_database_web.dart'
    if (dart.library.io) 'app_database_native.dart';

/// Database accessor singleton
class AppDatabaseAccessor {
  static AppDatabaseInterface? _instance;
  
  /// Get the singleton database instance
  static AppDatabaseInterface get instance {
    _instance ??= createAppDatabase();
    return _instance!;
  }
  
  // Prevent instantiation
  AppDatabaseAccessor._();
}
