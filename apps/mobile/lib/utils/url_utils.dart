import 'dart:convert';

/// Comprehensive URL and input validation utilities
/// Following OWASP security guidelines for input validation
class UrlUtils {
  UrlUtils._();

  /// Allowed URL schemes for external links
  static const _allowedSchemes = {'http', 'https', 'mailto', 'tel'};
  
  /// Blocked URL schemes that could be malicious
  static const _blockedSchemes = {'javascript', 'data', 'vbscript', 'file'};
  
  /// Maximum URL length to prevent DoS attacks
  static const maxUrlLength = 2048;
  
  /// Maximum slug length
  static const maxSlugLength = 100;

  /// Validates and sanitizes a URL for external use
  /// Returns null if URL is invalid or potentially malicious
  static String? sanitizeUrl(String? url) {
    if (url == null || url.isEmpty) return null;
    
    // Trim whitespace
    final trimmed = url.trim();
    
    // Check length
    if (trimmed.length > maxUrlLength) return null;
    
    // Try parsing
    final uri = Uri.tryParse(trimmed);
    if (uri == null) return null;
    
    // Check for blocked schemes
    final scheme = uri.scheme.toLowerCase();
    if (_blockedSchemes.contains(scheme)) return null;
    
    // If no scheme, assume https
    if (scheme.isEmpty) {
      return sanitizeUrl('https://$trimmed');
    }
    
    // Validate allowed schemes
    if (!_allowedSchemes.contains(scheme)) return null;
    
    // For http/https, ensure host is present
    if ((scheme == 'http' || scheme == 'https') && uri.host.isEmpty) {
      return null;
    }
    
    return trimmed;
  }

  /// Validates if a string is a valid URL
  /// This is the primary URL validation method for the app
  static bool isValidUrl(String? url) {
    return sanitizeUrl(url) != null;
  }

  /// Validates if a URL is safe to open externally
  /// Alias for isValidUrl for semantic clarity
  static bool isValidExternalUrl(String? url) {
    return isValidUrl(url);
  }

  /// Prepends https:// if no scheme is present
  static String ensureHttps(String url) {
    final trimmed = url.trim();
    if (trimmed.isEmpty) return trimmed;
    
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return 'https://$trimmed';
    }
    return trimmed;
  }

  /// Validates a mailto URL
  static bool isValidMailtoUrl(String? url) {
    if (url == null || url.isEmpty) return false;
    final uri = Uri.tryParse(url);
    return uri != null && uri.scheme == 'mailto' && uri.path.isNotEmpty;
  }

  /// Creates a safe mailto URL from an email address
  static String? createMailtoUrl(String? email) {
    final sanitized = InputSanitizer.sanitizeEmail(email);
    if (sanitized == null) return null;
    return 'mailto:$sanitized';
  }

  /// Creates a safe tel URL from a phone number
  static String? createTelUrl(String? phone) {
    final sanitized = InputSanitizer.sanitizePhone(phone);
    if (sanitized == null) return null;
    return 'tel:$sanitized';
  }

  /// Validates a slug format (alphanumeric, hyphens, lowercase)
  static bool isValidSlug(String? slug) {
    if (slug == null || slug.isEmpty) return false;
    if (slug.length > maxSlugLength) return false;
    return RegExp(r'^[a-z0-9]+(?:-[a-z0-9]+)*$').hasMatch(slug);
  }

  /// Sanitizes a slug by converting to lowercase and replacing invalid chars
  static String sanitizeSlug(String input) {
    return input
        .toLowerCase()
        .trim()
        .replaceAll(RegExp(r'[^a-z0-9\s-]'), '')
        .replaceAll(RegExp(r'\s+'), '-')
        .replaceAll(RegExp(r'-+'), '-')
        .replaceAll(RegExp(r'^-+|-+$'), '');
  }

  /// Extracts domain from URL for display
  static String? extractDomain(String? url) {
    if (url == null || url.isEmpty) return null;
    final sanitized = sanitizeUrl(url);
    if (sanitized == null) return null;
    
    final uri = Uri.tryParse(sanitized);
    if (uri == null || uri.host.isEmpty) return null;
    
    // Remove www. prefix for cleaner display
    String host = uri.host;
    if (host.startsWith('www.')) {
      host = host.substring(4);
    }
    return host;
  }
}

/// Input sanitization utilities for user-provided content
class InputSanitizer {
  InputSanitizer._();

  /// Maximum lengths for various inputs
  static const maxNameLength = 100;
  static const maxDescriptionLength = 2000;
  static const maxCategoryLength = 50;
  static const maxSearchQueryLength = 100;
  static const maxTagLength = 30;
  static const maxTagCount = 10;
  static const maxPriceLength = 50;

  /// Sanitizes a name/title field
  static String? sanitizeName(String? name) {
    if (name == null || name.isEmpty) return null;
    
    final trimmed = name.trim();
    if (trimmed.isEmpty) return null;
    
    // Remove potentially dangerous characters
    final sanitized = _removeControlCharacters(trimmed);
    
    // Enforce max length
    if (sanitized.length > maxNameLength) {
      return sanitized.substring(0, maxNameLength);
    }
    
    return sanitized;
  }

  /// Sanitizes a description field
  static String? sanitizeDescription(String? description) {
    if (description == null || description.isEmpty) return null;
    
    final trimmed = description.trim();
    if (trimmed.isEmpty) return null;
    
    // Remove potentially dangerous characters
    final sanitized = _removeControlCharacters(trimmed);
    
    // Enforce max length
    if (sanitized.length > maxDescriptionLength) {
      return sanitized.substring(0, maxDescriptionLength);
    }
    
    return sanitized;
  }

  /// Sanitizes a search query
  static String? sanitizeSearchQuery(String? query) {
    if (query == null || query.isEmpty) return null;
    
    final trimmed = query.trim();
    if (trimmed.isEmpty) return null;
    
    // Remove potentially dangerous characters
    final sanitized = _removeControlCharacters(trimmed);
    
    // Enforce max length
    if (sanitized.length > maxSearchQueryLength) {
      return sanitized.substring(0, maxSearchQueryLength);
    }
    
    return sanitized;
  }

  /// Sanitizes a category field
  static String? sanitizeCategory(String? category) {
    if (category == null || category.isEmpty) return null;
    
    final trimmed = category.trim();
    if (trimmed.isEmpty) return null;
    
    // Remove potentially dangerous characters
    final sanitized = _removeControlCharacters(trimmed);
    
    // Enforce max length
    if (sanitized.length > maxCategoryLength) {
      return sanitized.substring(0, maxCategoryLength);
    }
    
    return sanitized;
  }

  /// Sanitizes a list of tags
  static List<String> sanitizeTags(List<dynamic>? tags) {
    if (tags == null || tags.isEmpty) return [];
    
    return tags
        .take(maxTagCount)
        .map((tag) => tag.toString().trim())
        .where((tag) => tag.isNotEmpty && tag.length <= maxTagLength)
        .map((tag) => _removeControlCharacters(tag))
        .toList();
  }

  /// Sanitizes a price string
  static String? sanitizePrice(String? price) {
    if (price == null || price.isEmpty) return null;
    
    final trimmed = price.trim();
    if (trimmed.isEmpty) return null;
    
    // Remove potentially dangerous characters, allow currency symbols
    final sanitized = _removeControlCharacters(trimmed);
    
    // Enforce max length
    if (sanitized.length > maxPriceLength) {
      return sanitized.substring(0, maxPriceLength);
    }
    
    return sanitized;
  }

  /// Validates and sanitizes an email address
  static String? sanitizeEmail(String? email) {
    if (email == null || email.isEmpty) return null;
    
    final trimmed = email.trim().toLowerCase();
    if (trimmed.isEmpty) return null;
    
    // Basic email regex validation
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );
    
    if (!emailRegex.hasMatch(trimmed)) return null;
    if (trimmed.length > 255) return null;
    
    return trimmed;
  }

  /// Sanitizes a phone number (keeps only digits and common symbols)
  static String? sanitizePhone(String? phone) {
    if (phone == null || phone.isEmpty) return null;
    
    final trimmed = phone.trim();
    if (trimmed.isEmpty) return null;
    
    // Remove all characters except digits, +, -, (, ), and spaces
    final sanitized = trimmed.replaceAll(RegExp(r'[^\d+\-() ]'), '');
    
    if (sanitized.isEmpty) return null;
    if (sanitized.length > 20) return null;
    
    return sanitized;
  }

  /// Validates a hex color string
  static String? sanitizeHexColor(String? color) {
    if (color == null || color.isEmpty) return null;
    
    final trimmed = color.trim();
    if (trimmed.isEmpty) return null;
    
    // Match #RGB, #RRGGBB, or #RRGGBBAA formats
    final colorRegex = RegExp(r'^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$');
    
    if (!colorRegex.hasMatch(trimmed)) return null;
    
    return trimmed.toUpperCase();
  }

  /// Removes control characters and null bytes
  static String _removeControlCharacters(String input) {
    // Remove control characters (except newlines and tabs for descriptions)
    return input.replaceAll(RegExp(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'), '');
  }

  /// Escapes HTML entities to prevent XSS
  static String escapeHtml(String input) {
    return const HtmlEscape().convert(input);
  }

  /// Validates UUID format
  static bool isValidUuid(String? uuid) {
    if (uuid == null || uuid.isEmpty) return false;
    return RegExp(
      r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    ).hasMatch(uuid);
  }
}

/// Validation result with error messages
class ValidationResult {
  final bool isValid;
  final String? errorMessage;
  
  const ValidationResult.valid() : isValid = true, errorMessage = null;
  const ValidationResult.invalid(this.errorMessage) : isValid = false;
  
  factory ValidationResult.fromCondition(bool condition, String errorMessage) {
    return condition ? const ValidationResult.valid() : ValidationResult.invalid(errorMessage);
  }
}
