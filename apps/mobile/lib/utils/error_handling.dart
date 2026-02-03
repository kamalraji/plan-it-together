/// Error handling and logging infrastructure.
/// 
/// This barrel file exports all error handling utilities for easy importing:
/// ```dart
/// import 'package:thittam1hub/utils/error_handling.dart';
/// ```
library;

// Core error types and handler
export '../services/error_handler.dart';

// Logging service
export '../services/logging_service.dart';

// Result pattern and extensions
export 'result.dart';
export 'result_extensions.dart';

// Async utilities
export 'async_utils.dart';

// Feedback utilities
export 'feedback_utils.dart';
