/// Comprehensive input validation and sanitization for Zone feature forms
/// 
/// Security: All inputs are sanitized to prevent XSS and injection attacks.
/// All validators use trimmed values and have length limits.
class ZoneValidators {
  // ========== Sanitization Helpers ==========
  
  /// Sanitize text input - removes HTML tags, normalizes whitespace, trims
  static String sanitize(String? value) {
    if (value == null || value.isEmpty) return '';
    // Remove HTML tags
    String sanitized = value.replaceAll(RegExp(r'<[^>]*>'), '');
    // Remove script-like content
    sanitized = sanitized.replaceAll(RegExp(r'javascript:', caseSensitive: false), '');
    sanitized = sanitized.replaceAll(RegExp(r'on\w+\s*=', caseSensitive: false), '');
    // Normalize whitespace
    sanitized = sanitized.trim().replaceAll(RegExp(r'\s+'), ' ');
    return sanitized;
  }
  
  /// Sanitize for safe URL parameter usage
  static String sanitizeForUrl(String? value) {
    if (value == null || value.isEmpty) return '';
    // Only allow alphanumeric, hyphens, underscores
    return value.replaceAll(RegExp(r'[^a-zA-Z0-9\-_]'), '');
  }
  
  /// Encode value for URL query parameter
  static String encodeUrlParam(String value) {
    return Uri.encodeComponent(value);
  }
  
  /// Decode URL query parameter safely
  static String? decodeUrlParam(String? value) {
    if (value == null || value.isEmpty) return null;
    try {
      return Uri.decodeComponent(value);
    } catch (_) {
      return value; // Return as-is if decoding fails
    }
  }
  
  /// Validate UUID format
  static bool isValidUuid(String? value) {
    if (value == null || value.isEmpty) return false;
    final uuidRegex = RegExp(
      r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    );
    return uuidRegex.hasMatch(value);
  }
  
  /// Sanitize and validate event ID
  static String? sanitizeEventId(String? eventId) {
    if (eventId == null || eventId.isEmpty) return null;
    final trimmed = eventId.trim();
    return isValidUuid(trimmed) ? trimmed : null;
  }
  
  /// Sanitize tab name for deep linking
  static String? sanitizeTabName(String? tab, List<String> validTabs) {
    if (tab == null || tab.isEmpty) return null;
    final sanitized = tab.toLowerCase().trim();
    return validTabs.contains(sanitized) ? sanitized : null;
  }

  // ========== Session Validation ==========

  /// Validate session title (required, 3-100 chars)
  static String? validateSessionTitle(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Session title is required';
    }
    final sanitized = sanitize(value);
    if (sanitized.length < 3) {
      return 'Title must be at least 3 characters';
    }
    if (sanitized.length > 100) {
      return 'Title must be less than 100 characters';
    }
    return null;
  }

  /// Validate session description (optional, max 500 chars)
  static String? validateSessionDescription(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // Optional field
    }
    final sanitized = sanitize(value);
    if (sanitized.length > 500) {
      return 'Description must be less than 500 characters';
    }
    return null;
  }

  /// Validate speaker name (optional, max 100 chars)
  static String? validateSpeakerName(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // Optional field
    }
    final sanitized = sanitize(value);
    if (sanitized.length > 100) {
      return 'Speaker name must be less than 100 characters';
    }
    return null;
  }

  /// Validate room/location (optional, max 50 chars)
  static String? validateRoom(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // Optional field
    }
    final sanitized = sanitize(value);
    if (sanitized.length > 50) {
      return 'Room name must be less than 50 characters';
    }
    return null;
  }

  /// Validate session time range
  static String? validateSessionTimes(DateTime? start, DateTime? end) {
    if (start == null) return 'Start time is required';
    if (end == null) return 'End time is required';
    if (end.isBefore(start)) {
      return 'End time must be after start time';
    }
    if (end.difference(start).inMinutes < 5) {
      return 'Session must be at least 5 minutes long';
    }
    if (end.difference(start).inHours > 8) {
      return 'Session cannot exceed 8 hours';
    }
    return null;
  }

  // ========== Poll Validation ==========

  /// Validate poll question (required, 5-200 chars)
  static String? validatePollQuestion(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Poll question is required';
    }
    final sanitized = sanitize(value);
    if (sanitized.length < 5) {
      return 'Question must be at least 5 characters';
    }
    if (sanitized.length > 200) {
      return 'Question must be less than 200 characters';
    }
    return null;
  }

  /// Validate poll options list (2-6 unique options)
  static String? validatePollOptions(List<String> options) {
    final validOptions = options
        .map((o) => sanitize(o))
        .where((o) => o.isNotEmpty)
        .toList();
    
    if (validOptions.length < 2) {
      return 'At least 2 options are required';
    }
    if (validOptions.length > 6) {
      return 'Maximum 6 options allowed';
    }
    
    // Check for duplicates (case-insensitive)
    final uniqueOptions = validOptions.map((o) => o.toLowerCase()).toSet();
    if (uniqueOptions.length != validOptions.length) {
      return 'Options must be unique';
    }
    
    // Check individual option lengths
    for (final opt in validOptions) {
      if (opt.length > 100) {
        return 'Each option must be less than 100 characters';
      }
    }
    
    return null;
  }

  /// Validate a single poll option
  static String? validatePollOption(String? value, {bool isRequired = false}) {
    if (value == null || value.trim().isEmpty) {
      return isRequired ? 'Option text is required' : null;
    }
    final sanitized = sanitize(value);
    if (sanitized.length > 100) {
      return 'Option must be less than 100 characters';
    }
    return null;
  }

  // ========== Announcement Validation ==========

  /// Validate announcement title (required, 3-100 chars)
  static String? validateAnnouncementTitle(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Announcement title is required';
    }
    final sanitized = sanitize(value);
    if (sanitized.length < 3) {
      return 'Title must be at least 3 characters';
    }
    if (sanitized.length > 100) {
      return 'Title must be less than 100 characters';
    }
    return null;
  }

  /// Validate announcement content (required, max 1000 chars)
  static String? validateAnnouncementContent(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Announcement content is required';
    }
    final sanitized = sanitize(value);
    if (sanitized.length > 1000) {
      return 'Content must be less than 1000 characters';
    }
    return null;
  }

  /// Validate announcement type
  static String? validateAnnouncementType(String? value) {
    const validTypes = ['info', 'alert', 'update', 'sponsor'];
    if (value == null || !validTypes.contains(value.toLowerCase())) {
      return 'Invalid announcement type';
    }
    return null;
  }

  // ========== URL Validation ==========

  /// Check if a string is a valid URL
  static bool isValidUrl(String? url) {
    if (url == null || url.isEmpty) return false;
    final uri = Uri.tryParse(url);
    return uri != null && (uri.isScheme('http') || uri.isScheme('https'));
  }

  /// Sanitize URL - only allow http/https schemes
  static String? sanitizeUrl(String? url) {
    if (url == null || url.isEmpty) return null;
    final trimmed = url.trim();
    final uri = Uri.tryParse(trimmed);
    if (uri == null) return null;
    if (!uri.isScheme('http') && !uri.isScheme('https')) return null;
    return trimmed;
  }
}
