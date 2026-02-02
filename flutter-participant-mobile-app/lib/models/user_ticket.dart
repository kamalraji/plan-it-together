import 'package:flutter/material.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/services/qr_code_service.dart';

/// User ticket model with full event and tier details
class UserTicket {
  final String registrationId;
  final String eventId;
  final String eventName;
  final DateTime startDate;
  final DateTime endDate;
  final EventMode mode;
  final String? bannerUrl;
  final String organizationName;
  final String? organizationLogo;
  final String tierName;
  final double tierPrice;
  final String currency;
  final int quantity;
  final RegistrationStatus status;
  final double totalAmount;
  final DateTime purchasedAt;

  const UserTicket({
    required this.registrationId,
    required this.eventId,
    required this.eventName,
    required this.startDate,
    required this.endDate,
    required this.mode,
    this.bannerUrl,
    required this.organizationName,
    this.organizationLogo,
    required this.tierName,
    required this.tierPrice,
    required this.currency,
    required this.quantity,
    required this.status,
    required this.totalAmount,
    required this.purchasedAt,
  });

  /// Generate unique QR code for this ticket using centralized service
  String get ticketQrCode => QrCodeService.generateTicketQrData(
        registrationId: registrationId,
        eventId: eventId,
        purchasedAt: purchasedAt,
      );

  /// Check if event is upcoming
  bool get isUpcoming => startDate.isAfter(DateTime.now());

  /// Check if event is ongoing
  bool get isOngoing {
    final now = DateTime.now();
    return now.isAfter(startDate) && now.isBefore(endDate);
  }

  /// Check if event has passed
  bool get isPast => endDate.isBefore(DateTime.now());

  /// Get time until event starts
  Duration get timeUntilStart => startDate.difference(DateTime.now());

  /// Check if ticket is free
  bool get isFree => tierPrice == 0;

  /// Get status color
  Color get statusColor {
    switch (status) {
      case RegistrationStatus.CONFIRMED:
        return const Color(0xFF22C55E);
      case RegistrationStatus.PENDING:
        return const Color(0xFFF59E0B);
      case RegistrationStatus.WAITLISTED:
        return const Color(0xFF3B82F6);
      case RegistrationStatus.CANCELLED:
        return const Color(0xFFEF4444);
    }
  }

  /// Get status label
  String get statusLabel {
    switch (status) {
      case RegistrationStatus.CONFIRMED:
        return 'Confirmed';
      case RegistrationStatus.PENDING:
        return 'Pending';
      case RegistrationStatus.WAITLISTED:
        return 'Waitlisted';
      case RegistrationStatus.CANCELLED:
        return 'Cancelled';
    }
  }

  /// Get mode icon
  IconData get modeIcon {
    switch (mode) {
      case EventMode.ONLINE:
        return Icons.videocam_outlined;
      case EventMode.OFFLINE:
        return Icons.location_on_outlined;
      case EventMode.HYBRID:
        return Icons.lan_outlined;
    }
  }

  /// Get mode label
  String get modeLabel {
    switch (mode) {
      case EventMode.ONLINE:
        return 'Online';
      case EventMode.OFFLINE:
        return 'In-Person';
      case EventMode.HYBRID:
        return 'Hybrid';
    }
  }

  factory UserTicket.fromJson(Map<String, dynamic> json) {
    String _s(dynamic v, [String d = '']) => v is String ? v : (v?.toString() ?? d);
    double _d(dynamic v, [double d = 0]) => v is num ? v.toDouble() : d;
    int _i(dynamic v, [int d = 1]) => v is int ? v : (v is num ? v.toInt() : d);
    DateTime _dt(dynamic v, [DateTime? d]) {
      if (v == null) return d ?? DateTime.now();
      if (v is String) {
        try {
          return DateTime.parse(v);
        } catch (_) {
          return d ?? DateTime.now();
        }
      }
      return d ?? DateTime.now();
    }

    // Parse mode
    final modeStr = _s(json['mode']).toUpperCase();
    EventMode mode = EventMode.OFFLINE;
    for (final m in EventMode.values) {
      if (m.name == modeStr) {
        mode = m;
        break;
      }
    }

    // Parse status
    final statusStr = _s(json['status']).toUpperCase();
    RegistrationStatus status = RegistrationStatus.CONFIRMED;
    for (final s in RegistrationStatus.values) {
      if (s.name == statusStr) {
        status = s;
        break;
      }
    }

    // Extract banner URL from branding
    String? bannerUrl;
    final branding = json['branding'];
    if (branding is Map) {
      bannerUrl = branding['banner_url'] as String?;
    }

    // Extract organization info
    String orgName = 'Unknown Organization';
    String? orgLogo;
    final org = json['organization'];
    if (org is Map) {
      orgName = _s(org['name'], orgName);
      orgLogo = org['logo_url'] as String?;
    }

    // Extract tier info
    String tierName = 'General Admission';
    double tierPrice = 0;
    String currency = 'INR';
    final tier = json['ticket_tier'];
    if (tier is Map) {
      tierName = _s(tier['name'], tierName);
      tierPrice = _d(tier['price']);
      currency = _s(tier['currency'], currency);
    }

    return UserTicket(
      registrationId: _s(json['id']),
      eventId: _s(json['event_id']),
      eventName: _s(json['event_name'], 'Untitled Event'),
      startDate: _dt(json['start_date']),
      endDate: _dt(json['end_date']),
      mode: mode,
      bannerUrl: bannerUrl,
      organizationName: orgName,
      organizationLogo: orgLogo,
      tierName: tierName,
      tierPrice: tierPrice,
      currency: currency,
      quantity: _i(json['quantity']),
      status: status,
      totalAmount: _d(json['total_amount']),
      purchasedAt: _dt(json['created_at']),
    );
  }
}
