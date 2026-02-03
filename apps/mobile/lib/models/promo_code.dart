/// Promo code model for event discounts
class PromoCode {
  final String id;
  final String eventId;
  final String code;
  final PromoDiscountType discountType;
  final double discountValue;
  final int? maxUses;
  final int usedCount;
  final DateTime? validFrom;
  final DateTime? validTo;
  final bool isActive;
  final DateTime createdAt;

  PromoCode({
    required this.id,
    required this.eventId,
    required this.code,
    required this.discountType,
    required this.discountValue,
    this.maxUses,
    this.usedCount = 0,
    this.validFrom,
    this.validTo,
    this.isActive = true,
    required this.createdAt,
  });

  factory PromoCode.fromJson(Map<String, dynamic> json) {
    return PromoCode(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      code: json['code'] as String,
      discountType: PromoDiscountType.fromString(json['discount_type'] as String),
      discountValue: (json['discount_value'] as num).toDouble(),
      maxUses: json['max_uses'] as int?,
      usedCount: json['used_count'] as int? ?? 0,
      validFrom: json['valid_from'] != null 
          ? DateTime.parse(json['valid_from'] as String) 
          : null,
      validTo: json['valid_to'] != null 
          ? DateTime.parse(json['valid_to'] as String) 
          : null,
      isActive: json['is_active'] as bool? ?? true,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'event_id': eventId,
      'code': code,
      'discount_type': discountType.value,
      'discount_value': discountValue,
      'max_uses': maxUses,
      'used_count': usedCount,
      'valid_from': validFrom?.toIso8601String(),
      'valid_to': validTo?.toIso8601String(),
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
    };
  }

  /// Calculate the discount amount for a given subtotal
  double calculateDiscount(double subtotal) {
    if (discountType == PromoDiscountType.percentage) {
      return subtotal * (discountValue / 100);
    } else {
      return discountValue.clamp(0, subtotal);
    }
  }

  /// Check if the promo code is currently valid
  bool get isCurrentlyValid {
    if (!isActive) return false;
    
    final now = DateTime.now();
    if (validFrom != null && now.isBefore(validFrom!)) return false;
    if (validTo != null && now.isAfter(validTo!)) return false;
    if (maxUses != null && usedCount >= maxUses!) return false;
    
    return true;
  }

  /// Get remaining uses
  int? get remainingUses {
    if (maxUses == null) return null;
    return maxUses! - usedCount;
  }

  /// Get formatted discount display
  String get formattedDiscount {
    if (discountType == PromoDiscountType.percentage) {
      return '${discountValue.toStringAsFixed(0)}% OFF';
    } else {
      return '₹${discountValue.toStringAsFixed(0)} OFF';
    }
  }
}

enum PromoDiscountType {
  percentage('PERCENTAGE'),
  fixed('FIXED');

  final String value;
  const PromoDiscountType(this.value);

  static PromoDiscountType fromString(String value) {
    return PromoDiscountType.values.firstWhere(
      (e) => e.value == value.toUpperCase(),
      orElse: () => PromoDiscountType.percentage,
    );
  }
}

/// Result of promo code validation
class PromoCodeResult {
  final bool isValid;
  final PromoCode? promoCode;
  final String? errorMessage;
  final double discountAmount;

  PromoCodeResult({
    required this.isValid,
    this.promoCode,
    this.errorMessage,
    this.discountAmount = 0,
  });

  factory PromoCodeResult.valid(PromoCode code, double subtotal) {
    return PromoCodeResult(
      isValid: true,
      promoCode: code,
      discountAmount: code.calculateDiscount(subtotal),
    );
  }

  factory PromoCodeResult.invalid(String message) {
    return PromoCodeResult(
      isValid: false,
      errorMessage: message,
    );
  }
}
