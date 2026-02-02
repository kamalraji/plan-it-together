/// Username validation utilities following industry best practices.
/// 
/// Rules:
/// - Length: 3-30 characters
/// - Format: Start with letter, alphanumeric + underscores only
/// - Case-insensitive uniqueness (stored as entered, compared lowercase)
/// - Reserved words blacklist with leetspeak detection
/// - Homoglyph/unicode attack protection
/// - Comprehensive profanity filter
class UsernameValidators {
  static const int minLength = 3;
  static const int maxLength = 30;
  
  /// Cooldown period for username changes (in days)
  static const int changesCooldownDays = 30;

  /// Reserved usernames that cannot be used (lowercase)
  static const Set<String> reservedUsernames = {
    // System & Admin
    'admin', 'administrator', 'support', 'help', 'info', 'root', 'system',
    'moderator', 'mod', 'sysadmin', 'superuser', 'sudo', 'master',
    
    // Brand Protection
    'thittam1hub', 'thittamhub', 'thittam', 'official', 'verified',
    'team', 'staff', 'employee', 'founder', 'ceo', 'cto', 'cfo',
    
    // Technical/API
    'api', 'oauth', 'auth', 'login', 'signup', 'register', 'signin',
    'signout', 'logout', 'callback', 'webhook', 'graphql', 'rest',
    
    // Web/Network
    'www', 'web', 'mail', 'email', 'ftp', 'smtp', 'imap', 'pop',
    'dns', 'ssl', 'cdn', 'proxy', 'vpn', 'ssh', 'sftp',
    
    // Common Routes
    'home', 'dashboard', 'profile', 'settings', 'account', 'accounts',
    'user', 'users', 'member', 'members', 'about', 'contact', 'privacy',
    'terms', 'tos', 'legal', 'dmca', 'copyright', 'sitemap', 'robots',
    
    // App-specific
    'explore', 'discover', 'search', 'notifications', 'messages', 'chat',
    'events', 'tickets', 'zones', 'impact', 'spark', 'feed', 'create',
    'new', 'edit', 'delete', 'update', 'post', 'posts', 'story', 'stories',
    'circle', 'circles', 'space', 'spaces', 'connection', 'connections',
    
    // Generic/Testing
    'test', 'testing', 'demo', 'example', 'sample', 'temp', 'temporary',
    'null', 'undefined', 'anonymous', 'guest', 'unknown', 'nobody',
    'everyone', 'all', 'public', 'private', 'default', 'bot', 'robot',
    
    // Security-related
    'security', 'abuse', 'spam', 'report', 'block', 'blocked', 'ban',
    'banned', 'suspend', 'suspended', 'hack', 'hacker', 'phishing',
  };

  /// Profanity and offensive terms (minimal list - extend with library)
  static const Set<String> _profanityList = {
    'fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'dick', 'cock',
    'pussy', 'cunt', 'bastard', 'slut', 'whore', 'nigger', 'nigga',
    'fag', 'faggot', 'retard', 'rape', 'nazi', 'hitler', 'porn',
  };

  /// Leetspeak substitution map for detection
  static const Map<String, List<String>> _leetMap = {
    'a': ['4', '@', '^', 'λ'],
    'b': ['8', '6', 'ß'],
    'c': ['(', '{', '[', '<'],
    'd': [')', ']'],
    'e': ['3', '€', '£'],
    'g': ['6', '9', '&'],
    'h': ['#', '|-|'],
    'i': ['1', '!', '|', 'l'],
    'l': ['1', '|', 'i', '7'],
    'o': ['0', 'ø', 'ö'],
    's': ['5', '\$', 'z'],
    't': ['7', '+', '†'],
    'u': ['v', 'µ'],
    'x': ['%', '×'],
    'z': ['2', 's'],
  };

  /// Validate username format and constraints
  /// Returns null if valid, error message if invalid
  static String? validateUsername(String? value) {
    if (value == null || value.isEmpty) {
      return 'Username is required';
    }

    final trimmed = value.trim();

    // Check length
    if (trimmed.length < minLength) {
      return 'Username must be at least $minLength characters';
    }
    if (trimmed.length > maxLength) {
      return 'Username must be at most $maxLength characters';
    }

    // Check format
    final formatError = validateUsernameFormat(trimmed);
    if (formatError != null) return formatError;

    // Check reserved words (with leetspeak detection)
    if (isReserved(trimmed)) {
      return 'This username is reserved';
    }

    // Check profanity (with leetspeak detection)
    if (_containsProfanity(trimmed)) {
      return 'Username contains inappropriate content';
    }

    // Check for repetitive patterns
    if (_hasRepetitivePattern(trimmed)) {
      return 'Username cannot have repetitive patterns';
    }

    return null;
  }

  /// Validate only the format (alphanumeric rules)
  static String? validateUsernameFormat(String? value) {
    if (value == null || value.isEmpty) return null;

    // Must start with a letter
    if (!RegExp(r'^[a-zA-Z]').hasMatch(value)) {
      return 'Username must start with a letter';
    }

    // Only letters, numbers, and underscores
    if (!RegExp(r'^[a-zA-Z][a-zA-Z0-9_]*$').hasMatch(value)) {
      return 'Username can only contain letters, numbers, and underscores';
    }

    // No consecutive underscores
    if (value.contains('__')) {
      return 'Username cannot have consecutive underscores';
    }

    // Cannot end with underscore
    if (value.endsWith('_')) {
      return 'Username cannot end with an underscore';
    }

    // Check for confusing patterns (e.g., l1l1, O0O0)
    if (_hasConfusingCharacters(value)) {
      return 'Username has confusing character combinations';
    }

    return null;
  }

  /// Check if username is reserved (includes leetspeak variants)
  static bool isReserved(String username) {
    final lower = username.toLowerCase();
    
    // Direct match
    if (reservedUsernames.contains(lower)) return true;
    
    // Normalized (leetspeak decoded) match
    final normalized = _normalizeLeetspeak(lower);
    if (reservedUsernames.contains(normalized)) return true;
    
    // Partial match for critical terms
    const criticalTerms = ['admin', 'official', 'support', 'thittam', 'moderator'];
    for (final term in criticalTerms) {
      if (lower.contains(term) || normalized.contains(term)) return true;
    }
    
    return false;
  }

  /// Check if username contains profanity (with leetspeak detection)
  static bool _containsProfanity(String username) {
    final lower = username.toLowerCase();
    final normalized = _normalizeLeetspeak(lower);
    
    for (final word in _profanityList) {
      if (lower.contains(word) || normalized.contains(word)) return true;
    }
    return false;
  }

  /// Normalize leetspeak to regular text for detection
  static String _normalizeLeetspeak(String input) {
    String result = input.toLowerCase();
    
    _leetMap.forEach((letter, substitutes) {
      for (final sub in substitutes) {
        result = result.replaceAll(sub, letter);
      }
    });
    
    // Remove repeated characters (e.g., "aaadmin" -> "admin")
    result = result.replaceAllMapped(
      RegExp(r'(.)\1{2,}'),
      (match) => match.group(1)!,
    );
    
    return result;
  }

  /// Check for repetitive patterns like "aaa", "123123", "abcabc"
  static bool _hasRepetitivePattern(String username) {
    // More than 2 consecutive same characters
    if (RegExp(r'(.)\1{2,}').hasMatch(username)) return true;
    
    // Repeating sequences (e.g., "abcabc")
    final length = username.length;
    for (int patternLen = 2; patternLen <= length ~/ 2; patternLen++) {
      final pattern = username.substring(0, patternLen);
      final repeated = pattern * (length ~/ patternLen);
      if (username.startsWith(repeated) && repeated.length >= length - patternLen) {
        return true;
      }
    }
    
    return false;
  }

  /// Check for confusing character combinations (l/1, O/0)
  static bool _hasConfusingCharacters(String username) {
    // Mix of l, 1, I in close proximity
    if (RegExp(r'[l1I]{2,}').hasMatch(username)) return true;
    
    // Mix of O, 0 in close proximity
    if (RegExp(r'[O0]{2,}').hasMatch(username)) return true;
    
    return false;
  }

  /// Sanitize username input (removes invalid characters)
  static String sanitizeUsername(String? value) {
    if (value == null || value.isEmpty) return '';
    
    // Remove leading/trailing whitespace
    String sanitized = value.trim();
    
    // Remove invalid characters (keep only alphanumeric and underscores)
    sanitized = sanitized.replaceAll(RegExp(r'[^a-zA-Z0-9_]'), '');
    
    // Remove leading numbers/underscores
    sanitized = sanitized.replaceFirst(RegExp(r'^[0-9_]+'), '');
    
    // Remove consecutive underscores
    while (sanitized.contains('__')) {
      sanitized = sanitized.replaceAll('__', '_');
    }
    
    // Remove trailing underscore
    if (sanitized.endsWith('_')) {
      sanitized = sanitized.substring(0, sanitized.length - 1);
    }
    
    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  }

  /// Generate username suggestions based on full name
  static List<String> generateSuggestions(String fullName, {int count = 6}) {
    final suggestions = <String>[];
    
    if (fullName.isEmpty) return suggestions;
    
    // Sanitize and split name
    final parts = fullName.trim().toLowerCase().split(RegExp(r'\s+'));
    final firstName = parts.isNotEmpty ? _sanitizePart(parts.first) : '';
    final lastName = parts.length > 1 ? _sanitizePart(parts.last) : '';
    
    if (firstName.isEmpty) return suggestions;
    
    // Base variations
    _addIfValid(suggestions, firstName);
    
    if (lastName.isNotEmpty) {
      _addIfValid(suggestions, '${firstName}_$lastName');
      _addIfValid(suggestions, '$firstName$lastName');
      _addIfValid(suggestions, '${firstName}${lastName[0]}');
      _addIfValid(suggestions, '${lastName}_$firstName');
      
      // Initials + name
      if (firstName.isNotEmpty && lastName.isNotEmpty) {
        _addIfValid(suggestions, '${firstName[0]}$lastName');
        _addIfValid(suggestions, '${firstName[0]}_$lastName');
      }
    }
    
    // Add creative suffixes
    final creativeSuffixes = ['dev', 'io', 'hq', 'hub', 'pro', 'x'];
    for (final suffix in creativeSuffixes) {
      if (suggestions.length >= count) break;
      _addIfValid(suggestions, '${firstName}_$suffix');
    }
    
    // Add year-based (current year last 2 digits)
    final year = DateTime.now().year.toString().substring(2);
    _addIfValid(suggestions, '$firstName$year');
    if (lastName.isNotEmpty) {
      _addIfValid(suggestions, '$firstName${lastName[0]}$year');
    }
    
    // Add numbered variations as fallback
    for (int i = 1; i <= 99 && suggestions.length < count; i++) {
      _addIfValid(suggestions, '${firstName}_$i');
      if (lastName.isNotEmpty) {
        _addIfValid(suggestions, '${firstName}${lastName[0]}$i');
      }
    }
    
    return suggestions.take(count).toList();
  }

  static void _addIfValid(List<String> list, String username) {
    if (list.contains(username)) return;
    if (username.length < minLength || username.length > maxLength) return;
    if (isReserved(username)) return;
    if (validateUsernameFormat(username) != null) return;
    if (_containsProfanity(username)) return;
    list.add(username);
  }

  static String _sanitizePart(String part) {
    return part.replaceAll(RegExp(r'[^a-z0-9]'), '');
  }

  /// Check if user can change username (30-day cooldown)
  static bool canChangeUsername(DateTime? lastChanged) {
    if (lastChanged == null) return true;
    final daysSinceChange = DateTime.now().difference(lastChanged).inDays;
    return daysSinceChange >= changesCooldownDays;
  }

  /// Get remaining days until username can be changed
  static int daysUntilCanChange(DateTime? lastChanged) {
    if (lastChanged == null) return 0;
    final daysSinceChange = DateTime.now().difference(lastChanged).inDays;
    final remaining = changesCooldownDays - daysSinceChange;
    return remaining > 0 ? remaining : 0;
  }

  /// Calculate username strength score (0-100)
  static int calculateStrength(String username) {
    if (username.isEmpty) return 0;
    
    int score = 0;
    
    // Length bonus (up to 30 points)
    score += (username.length.clamp(3, 15) - 3) * 2 + 6;
    
    // Has letters (20 points)
    if (RegExp(r'[a-zA-Z]').hasMatch(username)) score += 20;
    
    // Has numbers (15 points)
    if (RegExp(r'[0-9]').hasMatch(username)) score += 15;
    
    // Has underscore separator (10 points)
    if (username.contains('_')) score += 10;
    
    // Mixed case (10 points)
    if (username != username.toLowerCase() && 
        username != username.toUpperCase()) score += 10;
    
    // Memorability - no confusing chars (15 points)
    if (!_hasConfusingCharacters(username)) score += 15;
    
    return score.clamp(0, 100);
  }
}
