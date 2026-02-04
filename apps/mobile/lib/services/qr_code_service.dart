import 'package:flutter/foundation.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Centralized service for QR code generation and validation
/// Supports both profile QR codes and event ticket QR codes
class QrCodeService {
  static const String _baseUrl = 'https://thittam1hub.app';
  static const String _ticketPrefix = 'THB-TICKET';
  static const String _tag = 'QrCodeService';
  static final _log = LoggingService.instance;

  // ============= PROFILE QR =============

  /// Generate profile deep link URL for QR encoding
  /// Prefers username-based URL (/u/:username) when available, falls back to UUID (/p/:id)
  static String generateProfileQrData(String userId, {String? username}) {
    if (userId.isEmpty) {
      throw ArgumentError('User ID cannot be empty');
    }
    // Prefer username-based URL for better UX
    if (username != null && username.isNotEmpty) {
      return '$_baseUrl/u/$username';
    }
    return '$_baseUrl/p/$userId';
  }

  /// Generate short profile URL - prefers username when available
  static String getShortProfileUrl(String userId, {String? username}) {
    return generateProfileQrData(userId, username: username);
  }

  /// Generate vCard format for contact exchange (RFC 6350 compliant)
  static String generateVCard({
    required String fullName,
    String? email,
    String? phone,
    String? organization,
    String? title,
    String? website,
    String? linkedinUrl,
    String? twitterHandle,
  }) {
    final buffer = StringBuffer();
    buffer.writeln('BEGIN:VCARD');
    buffer.writeln('VERSION:3.0');
    buffer.writeln('FN:$fullName');

    // Parse name into parts
    final nameParts = fullName.split(' ');
    if (nameParts.length >= 2) {
      buffer.writeln('N:${nameParts.last};${nameParts.first};;;');
    } else {
      buffer.writeln('N:;$fullName;;;');
    }

    if (organization != null && organization.isNotEmpty) {
      buffer.writeln('ORG:$organization');
    }
    if (title != null && title.isNotEmpty) {
      buffer.writeln('TITLE:$title');
    }
    if (email != null && email.isNotEmpty) {
      buffer.writeln('EMAIL;TYPE=INTERNET:$email');
    }
    if (phone != null && phone.isNotEmpty) {
      buffer.writeln('TEL;TYPE=CELL:$phone');
    }
    if (website != null && website.isNotEmpty) {
      buffer.writeln('URL:$website');
    }
    if (linkedinUrl != null && linkedinUrl.isNotEmpty) {
      buffer.writeln('X-SOCIALPROFILE;TYPE=linkedin:$linkedinUrl');
    }
    if (twitterHandle != null && twitterHandle.isNotEmpty) {
      buffer.writeln('X-SOCIALPROFILE;TYPE=twitter:https://twitter.com/$twitterHandle');
    }

    buffer.writeln('END:VCARD');
    return buffer.toString();
  }

  // ============= TICKET QR =============

  /// Generate ticket QR data in standardized format
  /// Format: THB-TICKET:{registrationId}:{eventId}:{timestamp}
  static String generateTicketQrData({
    required String registrationId,
    required String eventId,
    required DateTime purchasedAt,
  }) {
    if (registrationId.isEmpty || eventId.isEmpty) {
      throw ArgumentError('Registration ID and Event ID cannot be empty');
    }
    return '$_ticketPrefix:$registrationId:$eventId:${purchasedAt.millisecondsSinceEpoch}';
  }

  /// Parse and validate ticket QR data
  static TicketQrData? parseTicketQrData(String data) {
    if (!data.startsWith('$_ticketPrefix:')) {
      return null;
    }

    final parts = data.split(':');
    if (parts.length != 4) {
      return null;
    }

    try {
      return TicketQrData(
        registrationId: parts[1],
        eventId: parts[2],
        timestamp: int.parse(parts[3]),
        isValid: true,
      );
    } catch (e) {
      _log.warning('Failed to parse ticket QR data', tag: _tag, error: e);
      return null;
    }
  }

  // ============= VALIDATION =============

  /// Identify the type of QR code from scanned data
  static QrCodeType identifyQrType(String data) {
    if (data.isEmpty) {
      return QrCodeType.unknown;
    }

    // Check for ticket format
    if (data.startsWith('$_ticketPrefix:')) {
      return QrCodeType.ticket;
    }

    // Check for vCard format
    if (data.startsWith('BEGIN:VCARD')) {
      return QrCodeType.vCard;
    }

    // Check for profile URL (both /u/:username and /p/:userId formats)
    if (data.startsWith('$_baseUrl/p/') || 
        data.startsWith('$_baseUrl/u/') || 
        data.startsWith('$_baseUrl/profile/')) {
      return QrCodeType.profile;
    }

    // Check for Circle invite URL
    if (data.startsWith('$_baseUrl/c/')) {
      return QrCodeType.circleInvite;
    }

    // Check if it's a URL
    if (data.startsWith('http://') || data.startsWith('https://')) {
      return QrCodeType.external;
    }

    return QrCodeType.unknown;
  }

  // ============= CIRCLE INVITE QR =============

  /// Generate Circle invite QR data
  static String generateCircleInviteQrData(String linkCode) {
    if (linkCode.isEmpty) {
      throw ArgumentError('Link code cannot be empty');
    }
    return '$_baseUrl/c/$linkCode';
  }

  /// Extract Circle link code from QR data
  static String? extractCircleLinkCode(String data) {
    if (!data.startsWith('$_baseUrl/c/')) return null;
    final uri = Uri.tryParse(data);
    if (uri == null || uri.pathSegments.length < 2) return null;
    return uri.pathSegments[1];
  }

  /// Check if data is a valid Circle invite
  static bool isValidCircleInvite(String data) {
    return identifyQrType(data) == QrCodeType.circleInvite &&
        extractCircleLinkCode(data) != null;
  }

  /// Validate QR data for a specific type
  static bool isValidQrData(String data, QrCodeType expectedType) {
    final actualType = identifyQrType(data);
    
    if (actualType != expectedType) {
      return false;
    }

    switch (expectedType) {
      case QrCodeType.profile:
        // Extract user ID and validate UUID format
        final uri = Uri.tryParse(data);
        if (uri == null) return false;
        final pathParts = uri.pathSegments;
        if (pathParts.isEmpty) return false;
        final userId = pathParts.last;
        return _isValidUuid(userId);

      case QrCodeType.ticket:
        return parseTicketQrData(data) != null;

      case QrCodeType.vCard:
        return data.contains('END:VCARD');

      case QrCodeType.circleInvite:
        return isValidCircleInvite(data);

      case QrCodeType.external:
        return Uri.tryParse(data)?.hasAbsolutePath ?? false;

      case QrCodeType.unknown:
        return false;
    }
  }

  /// Extract user ID or username from profile QR data
  /// Returns a record with either userId (for /p/ URLs) or username (for /u/ URLs)
  static ({String? userId, String? username}) extractProfileIdentifier(String data) {
    if (identifyQrType(data) != QrCodeType.profile) {
      return (userId: null, username: null);
    }

    final uri = Uri.tryParse(data);
    if (uri == null) return (userId: null, username: null);

    final pathParts = uri.pathSegments;
    if (pathParts.length < 2) return (userId: null, username: null);

    final prefix = pathParts[0];
    final identifier = pathParts[1];

    if (prefix == 'u') {
      // Username-based URL
      return (userId: null, username: identifier);
    } else if (prefix == 'p' && _isValidUuid(identifier)) {
      // UUID-based URL
      return (userId: identifier, username: null);
    }

    return (userId: null, username: null);
  }

  /// Extract user ID from profile QR data (legacy support)
  static String? extractUserIdFromProfileQr(String data) {
    final result = extractProfileIdentifier(data);
    return result.userId;
  }

  /// Extract username from profile QR data
  static String? extractUsernameFromProfileQr(String data) {
    final result = extractProfileIdentifier(data);
    return result.username;
  }

  /// Validate UUID format
  static bool _isValidUuid(String value) {
    final uuidRegex = RegExp(
      r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    );
    return uuidRegex.hasMatch(value);
  }
}

/// Types of QR codes supported by the app
enum QrCodeType {
  /// Profile deep link QR
  profile,

  /// Event ticket QR for check-in
  ticket,

  /// vCard contact exchange
  vCard,

  /// Circle invite QR
  circleInvite,

  /// External URL
  external,

  /// Unknown or invalid format
  unknown,
}

/// Parsed ticket QR data
class TicketQrData {
  final String registrationId;
  final String eventId;
  final int timestamp;
  final bool isValid;

  const TicketQrData({
    required this.registrationId,
    required this.eventId,
    required this.timestamp,
    required this.isValid,
  });

  DateTime get purchasedAt => DateTime.fromMillisecondsSinceEpoch(timestamp);
}
