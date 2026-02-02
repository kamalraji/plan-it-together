import 'package:uuid/uuid.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/utils/result.dart';

/// Registration service for managing event registrations
/// Extends BaseService for standardized error handling and logging
class RegistrationService extends BaseService {
  static RegistrationService? _instance;
  static RegistrationService get instance => _instance ??= RegistrationService._();
  RegistrationService._();

  @override
  String get tag => 'RegistrationService';

  /// Get all registrations for a user
  Future<Result<List<Registration>>> getUserRegistrations(String userId) {
    return execute(() async {
      final data = await SupabaseConfig.client
          .from('registrations')
          .select()
          .eq('user_id', userId)
          .order('created_at', ascending: false);

      final registrations = (data as List).map((json) => Registration.fromJson(json)).toList();
      logDbOperation('SELECT', 'registrations', rowCount: registrations.length);
      return registrations;
    }, operationName: 'getUserRegistrations');
  }

  /// Get registration by ID
  Future<Result<Registration?>> getRegistrationById(String registrationId) {
    return execute(() async {
      final data = await SupabaseConfig.client
          .from('registrations')
          .select()
          .eq('id', registrationId)
          .maybeSingle();

      if (data == null) return null;
      logDbOperation('SELECT', 'registrations', rowCount: 1);
      return Registration.fromJson(data);
    }, operationName: 'getRegistrationById');
  }

  /// Check if user is registered for an event
  Future<Result<bool>> isUserRegistered(String userId, String eventId) {
    return execute(() async {
      final data = await SupabaseConfig.client
          .from('registrations')
          .select('id')
          .eq('user_id', userId)
          .eq('event_id', eventId)
          .neq('status', RegistrationStatus.CANCELLED.name)
          .maybeSingle();

      return data != null;
    }, operationName: 'isUserRegistered');
  }

  /// Get user's registration for a specific event
  Future<Result<Registration?>> getUserEventRegistration(
    String userId,
    String eventId,
  ) {
    return execute(() async {
      final data = await SupabaseConfig.client
          .from('registrations')
          .select()
          .eq('user_id', userId)
          .eq('event_id', eventId)
          .neq('status', RegistrationStatus.CANCELLED.name)
          .maybeSingle();

      if (data == null) return null;
      return Registration.fromJson(data);
    }, operationName: 'getUserEventRegistration');
  }

  /// Create a new registration (static for use with RegistrationFlowService)
  static Future<Registration?> registerForEvent({
    required String eventId,
    required String tierId,
    required int quantity,
    required String userId,
    required String userName,
    required String userEmail,
    Map<String, dynamic>? formResponses,
    String? promoCodeId,
    double? subtotal,
    double? discountAmount,
    double? totalAmount,
  }) async {
    final result = await instance._registerForEventInternal(
      eventId: eventId,
      tierId: tierId,
      quantity: quantity,
      userId: userId,
      userName: userName,
      userEmail: userEmail,
      formResponses: formResponses,
      promoCodeId: promoCodeId,
      subtotal: subtotal,
      discountAmount: discountAmount,
      totalAmount: totalAmount,
    );
    return result is Success<Registration?> ? result.data : null;
  }

  /// Internal implementation for registerForEvent
  Future<Result<Registration?>> _registerForEventInternal({
    required String eventId,
    required String tierId,
    required int quantity,
    required String userId,
    required String userName,
    required String userEmail,
    Map<String, dynamic>? formResponses,
    String? promoCodeId,
    double? subtotal,
    double? discountAmount,
    double? totalAmount,
  }) {
    return execute(() async {
      final registrationId = const Uuid().v4();
      
      // Include attendee info in form responses
      final fullFormResponses = {
        ...?formResponses,
        'name': userName,
        'email': userEmail,
      };

      final registrationData = {
        'id': registrationId,
        'event_id': eventId,
        'user_id': userId,
        'ticket_tier_id': tierId,
        'status': RegistrationStatus.CONFIRMED.name,
        'quantity': quantity,
        'form_responses': fullFormResponses,
        'promo_code_id': promoCodeId,
        'subtotal': subtotal ?? 0,
        'discount_amount': discountAmount ?? 0,
        'total_amount': totalAmount ?? 0,
        'created_at': DateTime.now().toIso8601String(),
        'updated_at': DateTime.now().toIso8601String(),
      };

      final data = await SupabaseConfig.client
          .from('registrations')
          .insert(registrationData)
          .select()
          .single();

      // Update ticket tier sold count
      await _incrementTicketSoldCountInternal(tierId, quantity);

      logDbOperation('INSERT', 'registrations', rowCount: 1);
      return Registration.fromJson(data);
    }, operationName: 'registerForEvent');
  }

  /// Create a new registration (instance method)
  Future<Result<Registration?>> createRegistration({
    required String eventId,
    required String userId,
    String? ticketTierId,
    int quantity = 1,
    Map<String, dynamic>? formResponses,
    double? subtotal,
    double? discountAmount,
    double? totalAmount,
  }) {
    return execute(() async {
      final registration = Registration(
        id: const Uuid().v4(),
        eventId: eventId,
        userId: userId,
        ticketTierId: ticketTierId,
        status: RegistrationStatus.CONFIRMED,
        quantity: quantity,
        formResponses: formResponses ?? {},
        subtotal: subtotal ?? 0,
        discountAmount: discountAmount ?? 0,
        totalAmount: totalAmount ?? 0,
        promoCodeId: null,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final data = await SupabaseConfig.client
          .from('registrations')
          .insert(registration.toJson())
          .select()
          .single();

      // Update ticket tier sold count
      if (ticketTierId != null) {
        await _incrementTicketSoldCountInternal(ticketTierId, quantity);
      }

      logDbOperation('INSERT', 'registrations', rowCount: 1);
      return Registration.fromJson(data);
    }, operationName: 'createRegistration');
  }

  /// Update registration status
  Future<Result<bool>> updateRegistrationStatus(
    String registrationId,
    RegistrationStatus status,
  ) {
    return execute(() async {
      await SupabaseConfig.client
          .from('registrations')
          .update({'status': status.name})
          .eq('id', registrationId);

      logDbOperation('UPDATE status', 'registrations');
      return true;
    }, operationName: 'updateRegistrationStatus');
  }

  /// Cancel a registration
  Future<Result<bool>> cancelRegistration(String registrationId) {
    return execute(() async {
      final regResult = await getRegistrationById(registrationId);
      if (regResult is! Success<Registration?> || regResult.data == null) {
        return false;
      }
      final registration = regResult.data!;

      await SupabaseConfig.client
          .from('registrations')
          .update({'status': RegistrationStatus.CANCELLED.name})
          .eq('id', registrationId);

      // Decrement ticket tier sold count
      if (registration.ticketTierId != null) {
        await _decrementTicketSoldCountInternal(
          registration.ticketTierId!,
          registration.quantity,
        );
      }

      logInfo('Registration cancelled', metadata: {'id': registrationId});
      return true;
    }, operationName: 'cancelRegistration');
  }

  /// Delete a registration
  Future<Result<bool>> deleteRegistration(String registrationId) {
    return execute(() async {
      final regResult = await getRegistrationById(registrationId);
      if (regResult is! Success<Registration?> || regResult.data == null) {
        return false;
      }
      final registration = regResult.data!;

      await SupabaseConfig.client
          .from('registrations')
          .delete()
          .eq('id', registrationId);

      // Decrement ticket tier sold count
      if (registration.ticketTierId != null) {
        await _decrementTicketSoldCountInternal(
          registration.ticketTierId!,
          registration.quantity,
        );
      }

      logDbOperation('DELETE', 'registrations', rowCount: 1);
      return true;
    }, operationName: 'deleteRegistration');
  }

  /// Get event registration count
  Future<Result<int>> getEventRegistrationCount(String eventId) {
    return execute(() async {
      final data = await SupabaseConfig.client
          .from('registrations')
          .select('quantity')
          .eq('event_id', eventId)
          .neq('status', RegistrationStatus.CANCELLED.name);

      if (data.isEmpty) return 0;

      return (data as List).fold<int>(
        0,
        (sum, item) => sum + (item['quantity'] as int),
      );
    }, operationName: 'getEventRegistrationCount');
  }

  Future<void> _incrementTicketSoldCountInternal(String ticketTierId, int quantity) async {
    try {
      await SupabaseConfig.client.rpc('increment_ticket_sold_count', params: {
        'ticket_id': ticketTierId,
        'quantity': quantity,
      });
    } catch (e) {
      // Fallback: direct update
      try {
        final current = await SupabaseConfig.client
            .from('ticket_tiers')
            .select('sold_count')
            .eq('id', ticketTierId)
            .single();
        
        await SupabaseConfig.client
            .from('ticket_tiers')
            .update({'sold_count': (current['sold_count'] as int? ?? 0) + quantity})
            .eq('id', ticketTierId);
      } catch (e2) {
        logWarning('Increment ticket sold count fallback failed', error: e2);
      }
    }
  }

  Future<void> _decrementTicketSoldCountInternal(String ticketTierId, int quantity) async {
    try {
      await SupabaseConfig.client.rpc('decrement_ticket_sold_count', params: {
        'ticket_id': ticketTierId,
        'quantity': quantity,
      });
    } catch (e) {
      // Fallback: direct update
      try {
        final current = await SupabaseConfig.client
            .from('ticket_tiers')
            .select('sold_count')
            .eq('id', ticketTierId)
            .single();
        
        final newCount = ((current['sold_count'] as int? ?? 0) - quantity).clamp(0, 999999);
        await SupabaseConfig.client
            .from('ticket_tiers')
            .update({'sold_count': newCount})
            .eq('id', ticketTierId);
      } catch (e2) {
        logWarning('Decrement ticket sold count fallback failed', error: e2);
      }
    }
  }

  // ========== Static Convenience Methods ==========

  /// Fetch user registrations (unwrapped for simpler consumption)
  static Future<List<Registration>> fetchUserRegistrations(String userId) async {
    final result = await instance.getUserRegistrations(userId);
    return result is Success<List<Registration>> ? result.data : [];
  }

  /// Check if user is registered (unwrapped for simpler consumption)
  static Future<bool> checkUserRegistered(String userId, String eventId) async {
    final result = await instance.isUserRegistered(userId, eventId);
    return result is Success<bool> ? result.data : false;
  }

  /// Get event registration count (unwrapped for simpler consumption)
  static Future<int> fetchEventRegistrationCount(String eventId) async {
    final result = await instance.getEventRegistrationCount(eventId);
    return result is Success<int> ? result.data : 0;
  }
}
