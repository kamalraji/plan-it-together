import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/models/promo_code.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Service for promo code validation and application
class PromoCodeService {
  static const String _tag = 'PromoCodeService';
  static final LoggingService _log = LoggingService.instance;
  static final SupabaseClient _supabase = Supabase.instance.client;

  /// Validate a promo code for an event
  static Future<PromoCodeResult> validateCode({
    required String code,
    required String eventId,
    required double subtotal,
  }) async {
    try {
      final response = await _supabase
          .from('promo_codes')
          .select()
          .eq('event_id', eventId)
          .ilike('code', code.trim())
          .eq('is_active', true)
          .maybeSingle();

      if (response == null) {
        return PromoCodeResult.invalid('Invalid promo code');
      }

      final promoCode = PromoCode.fromJson(response);

      // Check validity
      if (!promoCode.isCurrentlyValid) {
        if (promoCode.maxUses != null && promoCode.usedCount >= promoCode.maxUses!) {
          return PromoCodeResult.invalid('This code has reached its usage limit');
        }
        if (promoCode.validFrom != null && DateTime.now().isBefore(promoCode.validFrom!)) {
          return PromoCodeResult.invalid('This code is not yet active');
        }
        if (promoCode.validTo != null && DateTime.now().isAfter(promoCode.validTo!)) {
          return PromoCodeResult.invalid('This code has expired');
        }
        return PromoCodeResult.invalid('This code is no longer valid');
      }

      _log.info('Promo code validated', tag: _tag, metadata: {'code': code, 'eventId': eventId});
      return PromoCodeResult.valid(promoCode, subtotal);
    } catch (e) {
      _log.error('Validate promo code failed', tag: _tag, error: e);
      return PromoCodeResult.invalid('Error validating code: ${e.toString()}');
    }
  }

  /// Apply a promo code to a registration (increment usage count)
  static Future<bool> applyCode({
    required String promoCodeId,
    required String registrationId,
  }) async {
    try {
      // Increment the used_count
      await _supabase.rpc('increment_promo_code_usage', params: {
        'promo_id': promoCodeId,
      });

      // Update the registration with the promo code
      await _supabase
          .from('registrations')
          .update({'promo_code_id': promoCodeId})
          .eq('id', registrationId);

      _log.info('Promo code applied', tag: _tag, metadata: {
        'promoCodeId': promoCodeId,
        'registrationId': registrationId,
      });
      return true;
    } catch (e) {
      // If the RPC doesn't exist, try direct update
      try {
        final current = await _supabase
            .from('promo_codes')
            .select('used_count')
            .eq('id', promoCodeId)
            .single();

        await _supabase
            .from('promo_codes')
            .update({'used_count': (current['used_count'] as int) + 1})
            .eq('id', promoCodeId);

        _log.debug('Promo code applied via fallback', tag: _tag);
        return true;
      } catch (e2) {
        _log.error('Apply promo code failed', tag: _tag, error: e2);
        return false;
      }
    }
  }

  /// Get all promo codes for an event (admin use)
  static Future<List<PromoCode>> getEventPromoCodes(String eventId) async {
    try {
      final response = await _supabase
          .from('promo_codes')
          .select()
          .eq('event_id', eventId)
          .order('created_at', ascending: false);

      final codes = (response as List)
          .map((json) => PromoCode.fromJson(json))
          .toList();
      
      _log.dbOperation('SELECT', 'promo_codes', rowCount: codes.length, tag: _tag);
      return codes;
    } catch (e) {
      _log.error('Get event promo codes failed', tag: _tag, error: e);
      return [];
    }
  }
}
