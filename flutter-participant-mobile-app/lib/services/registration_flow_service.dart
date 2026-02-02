import 'package:flutter/material.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/promo_code.dart';
import 'package:thittam1hub/services/promo_code_service.dart';
import 'package:thittam1hub/services/registration_service.dart';

/// Registration flow state and orchestration service
class RegistrationFlowService extends ChangeNotifier {
  // Flow state
  TicketTier? _selectedTier;
  int _quantity = 1;
  PromoCode? _appliedPromoCode;
  double _discountAmount = 0;
  Map<String, dynamic> _formResponses = {};
  bool _agreedToTerms = false;
  
  // Loading states
  bool _isValidatingPromo = false;
  bool _isSubmitting = false;
  String? _error;

  // Getters
  TicketTier? get selectedTier => _selectedTier;
  int get quantity => _quantity;
  PromoCode? get appliedPromoCode => _appliedPromoCode;
  double get discountAmount => _discountAmount;
  Map<String, dynamic> get formResponses => _formResponses;
  bool get agreedToTerms => _agreedToTerms;
  bool get isValidatingPromo => _isValidatingPromo;
  bool get isSubmitting => _isSubmitting;
  String? get error => _error;

  // Calculated values
  double get unitPrice => _selectedTier?.price ?? 0;
  double get subtotal => unitPrice * _quantity;
  double get total => (subtotal - _discountAmount).clamp(0, double.infinity);
  bool get isFreeRegistration => total == 0;
  bool get hasValidSelection => 
      _selectedTier != null && 
      _quantity > 0 && 
      _selectedTier!.available >= _quantity;
  bool get canProceedToForm => hasValidSelection;
  bool get canProceedToSummary => canProceedToForm && _agreedToTerms;

  // Tier selection
  void selectTier(TicketTier tier) {
    // Don't allow selecting sold-out tiers
    if (tier.available <= 0) return;
    
    _selectedTier = tier;
    _quantity = 1;
    _recalculateDiscount();
    notifyListeners();
  }

  // Quantity control
  void setQuantity(int qty) {
    if (_selectedTier == null) return;
    
    final maxAllowed = _selectedTier!.maxPerOrder ?? 10;
    final available = _selectedTier!.available;
    final max = maxAllowed.clamp(1, available > 0 ? available : 1);
    
    _quantity = qty.clamp(1, max).toInt();
    _recalculateDiscount();
    notifyListeners();
  }

  void incrementQuantity() {
    setQuantity(_quantity + 1);
  }

  void decrementQuantity() {
    setQuantity(_quantity - 1);
  }

  int get maxQuantity {
    if (_selectedTier == null) return 1;
    final maxAllowed = _selectedTier!.maxPerOrder ?? 10;
    final available = _selectedTier!.available;
    return maxAllowed.clamp(1, available > 0 ? available : 1);
  }

  // Promo code handling
  Future<PromoCodeResult> validatePromoCode(String code, String eventId) async {
    _isValidatingPromo = true;
    _error = null;
    notifyListeners();

    final result = await PromoCodeService.validateCode(
      code: code,
      eventId: eventId,
      subtotal: subtotal,
    );

    _isValidatingPromo = false;

    if (result.isValid && result.promoCode != null) {
      _appliedPromoCode = result.promoCode;
      _discountAmount = result.discountAmount;
    } else {
      _error = result.errorMessage;
    }

    notifyListeners();
    return result;
  }

  void removePromoCode() {
    _appliedPromoCode = null;
    _discountAmount = 0;
    notifyListeners();
  }

  void _recalculateDiscount() {
    if (_appliedPromoCode != null) {
      _discountAmount = _appliedPromoCode!.calculateDiscount(subtotal);
    }
  }

  // Form handling
  void updateFormResponse(String key, dynamic value) {
    _formResponses[key] = value;
    notifyListeners();
  }

  void setFormResponses(Map<String, dynamic> responses) {
    _formResponses = Map.from(responses);
    notifyListeners();
  }

  void setAgreedToTerms(bool agreed) {
    _agreedToTerms = agreed;
    notifyListeners();
  }

  // Submit registration
  Future<RegistrationResult> submitRegistration({
    required String eventId,
    required String userId,
    required String userName,
    required String userEmail,
  }) async {
    if (!hasValidSelection) {
      return RegistrationResult.failure('No ticket selected');
    }
    
    // Double-check availability before submitting
    if (_selectedTier!.available < _quantity) {
      return RegistrationResult.failure(
        'Sorry, not enough tickets available. Please try a smaller quantity.'
      );
    }

    _isSubmitting = true;
    _error = null;
    notifyListeners();

    try {
      // Create registration
      final registration = await RegistrationService.registerForEvent(
        eventId: eventId,
        tierId: _selectedTier!.id,
        quantity: _quantity,
        userId: userId,
        userName: userName,
        userEmail: userEmail,
        formResponses: _formResponses,
        promoCodeId: _appliedPromoCode?.id,
        subtotal: subtotal,
        discountAmount: _discountAmount,
        totalAmount: total,
      );

      _isSubmitting = false;
      notifyListeners();

      if (registration != null) {
        // Apply promo code if used
        if (_appliedPromoCode != null) {
          await PromoCodeService.applyCode(
            promoCodeId: _appliedPromoCode!.id,
            registrationId: registration.id,
          );
        }
        return RegistrationResult.success(registration);
      } else {
        return RegistrationResult.failure('Failed to create registration');
      }
    } catch (e) {
      _isSubmitting = false;
      _error = e.toString();
      notifyListeners();
      return RegistrationResult.failure(e.toString());
    }
  }

  // Reset flow
  void reset() {
    _selectedTier = null;
    _quantity = 1;
    _appliedPromoCode = null;
    _discountAmount = 0;
    _formResponses = {};
    _agreedToTerms = false;
    _isValidatingPromo = false;
    _isSubmitting = false;
    _error = null;
    notifyListeners();
  }
}

/// Result of registration submission
class RegistrationResult {
  final bool isSuccess;
  final Registration? registration;
  final String? errorMessage;

  RegistrationResult._({
    required this.isSuccess,
    this.registration,
    this.errorMessage,
  });

  factory RegistrationResult.success(Registration reg) {
    return RegistrationResult._(isSuccess: true, registration: reg);
  }

  factory RegistrationResult.failure(String message) {
    return RegistrationResult._(isSuccess: false, errorMessage: message);
  }
}
