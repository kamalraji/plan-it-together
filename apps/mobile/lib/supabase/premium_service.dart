import 'package:flutter/foundation.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';

import 'package:thittam1hub/services/logging_service.dart';

/// Subscription plan types
enum PlanType { free, premium, vip }

/// Premium feature types
enum FeatureType { boost, superLike, rewind }

/// User subscription model
class UserSubscription {
  final String id;
  final String userId;
  final PlanType planType;
  final String status;
  final DateTime startedAt;
  final DateTime? expiresAt;
  final int boostCredits;
  final int superLikeCredits;
  final int rewindCredits;
  final int dailyRewindLimit;
  final DateTime lastCreditRefresh;

  const UserSubscription({
    required this.id,
    required this.userId,
    required this.planType,
    required this.status,
    required this.startedAt,
    this.expiresAt,
    required this.boostCredits,
    required this.superLikeCredits,
    required this.rewindCredits,
    required this.dailyRewindLimit,
    required this.lastCreditRefresh,
  });

  factory UserSubscription.fromMap(Map<String, dynamic> map) {
    return UserSubscription(
      id: map['id'] as String,
      userId: map['user_id'] as String,
      planType: _parsePlanType(map['plan_type'] as String? ?? 'FREE'),
      status: map['status'] as String? ?? 'ACTIVE',
      startedAt: DateTime.parse(map['started_at'] as String),
      expiresAt: map['expires_at'] != null ? DateTime.parse(map['expires_at'] as String) : null,
      boostCredits: map['boost_credits'] as int? ?? 0,
      superLikeCredits: map['super_like_credits'] as int? ?? 0,
      rewindCredits: map['rewind_credits'] as int? ?? 3,
      dailyRewindLimit: map['daily_rewind_limit'] as int? ?? 3,
      lastCreditRefresh: DateTime.parse(map['last_credit_refresh'] as String? ?? DateTime.now().toIso8601String()),
    );
  }

  static PlanType _parsePlanType(String type) {
    switch (type.toUpperCase()) {
      case 'PREMIUM':
        return PlanType.premium;
      case 'VIP':
        return PlanType.vip;
      default:
        return PlanType.free;
    }
  }

  bool get isPremium => planType == PlanType.premium || planType == PlanType.vip;
  bool get isVip => planType == PlanType.vip;
  bool get isActive => status == 'ACTIVE' && (expiresAt == null || expiresAt!.isAfter(DateTime.now()));
}

/// Service for managing premium subscriptions and features
class PremiumService {
  static PremiumService? _instance;
  static PremiumService get instance => _instance ??= PremiumService._();
  PremiumService._();
  
  static const String _tag = 'PremiumService';
  static final _log = LoggingService.instance;
  
  final _supabase = SupabaseConfig.client;

  /// Get current user's subscription
  Future<UserSubscription?> getMySubscription() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return null;

      final response = await _supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

      if (response == null) {
        // Create default free subscription
        return await _createDefaultSubscription(userId);
      }
      return UserSubscription.fromMap(response as Map<String, dynamic>);
    } catch (e) {
      _log.error('Error fetching subscription: $e', tag: _tag);
      return null;
    }
  }

  /// Create default free subscription for new users
  Future<UserSubscription?> _createDefaultSubscription(String userId) async {
    try {
      final data = {
        'user_id': userId,
        'plan_type': 'FREE',
        'status': 'ACTIVE',
        'rewind_credits': 3,
        'daily_rewind_limit': 3,
        'boost_credits': 0,
        'super_like_credits': 0,
      };
      final response = await _supabase
          .from('user_subscriptions')
          .insert(data)
          .select()
          .single();
      return UserSubscription.fromMap(response as Map<String, dynamic>);
    } catch (e) {
      _log.error('Error creating default subscription: $e', tag: _tag);
      return null;
    }
  }

  /// Upgrade to premium plan
  Future<bool> upgradeToPremium(PlanType planType) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return false;

      final planTypeStr = planType == PlanType.vip ? 'VIP' : 'PREMIUM';
      final boostCredits = planType == PlanType.vip ? 10 : 5;
      final superLikeCredits = planType == PlanType.vip ? 999 : 10;
      final rewindCredits = planType == PlanType.vip ? 999 : 50;

      await _supabase
          .from('user_subscriptions')
          .upsert({
            'user_id': userId,
            'plan_type': planTypeStr,
            'status': 'ACTIVE',
            'started_at': DateTime.now().toIso8601String(),
            'expires_at': DateTime.now().add(const Duration(days: 30)).toIso8601String(),
            'boost_credits': boostCredits,
            'super_like_credits': superLikeCredits,
            'rewind_credits': rewindCredits,
          });

      // Update impact_profile is_premium flag
      await _supabase
          .from('impact_profiles')
          .update({'is_premium': true})
          .eq('user_id', userId);

      _log.info('✅ Upgraded to $planTypeStr', tag: _tag);
      return true;
    } catch (e) {
      _log.error('❌ Error upgrading subscription: $e', tag: _tag);
      return false;
    }
  }

  /// Cancel subscription
  Future<bool> cancelSubscription() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return false;

      await _supabase
          .from('user_subscriptions')
          .update({'status': 'CANCELLED'})
          .eq('user_id', userId);

      await _supabase
          .from('impact_profiles')
          .update({'is_premium': false})
          .eq('user_id', userId);

      _log.info('✅ Subscription cancelled', tag: _tag);
      return true;
    } catch (e) {
      _log.error('❌ Error cancelling subscription: $e', tag: _tag);
      return false;
    }
  }

  /// Use a boost credit
  Future<bool> useBoostCredit() async {
    try {
      final sub = await getMySubscription();
      if (sub == null || sub.boostCredits <= 0) return false;

      final userId = _supabase.auth.currentUser!.id;

      // Decrement boost credits
      await _supabase
          .from('user_subscriptions')
          .update({'boost_credits': sub.boostCredits - 1})
          .eq('user_id', userId);

      // Log usage
      await _supabase.from('feature_usage').insert({
        'user_id': userId,
        'feature_type': 'BOOST',
      });

      // Activate boost on profile (30 minutes)
      await _supabase.from('impact_profiles').update({
        'is_boosted': true,
        'boost_expires_at': DateTime.now().add(const Duration(minutes: 30)).toIso8601String(),
      }).eq('user_id', userId);

      _log.debug('🚀 Boost activated', tag: _tag);
      return true;
    } catch (e) {
      _log.error('❌ Error using boost: $e', tag: _tag);
      return false;
    }
  }

  /// Use a super like credit
  Future<bool> useSuperLikeCredit(String targetUserId) async {
    try {
      final sub = await getMySubscription();
      if (sub == null || sub.superLikeCredits <= 0) return false;

      final userId = _supabase.auth.currentUser!.id;

      // Decrement super like credits
      await _supabase
          .from('user_subscriptions')
          .update({'super_like_credits': sub.superLikeCredits - 1})
          .eq('user_id', userId);

      // Log usage
      await _supabase.from('feature_usage').insert({
        'user_id': userId,
        'feature_type': 'SUPER_LIKE',
        'target_user_id': targetUserId,
      });

      // Increment super like count on target
      await _supabase.rpc('increment_super_like_count', params: {'target_id': targetUserId});

      _log.debug('⭐ Super like used', tag: _tag);
      return true;
    } catch (e) {
      _log.error('❌ Error using super like: $e', tag: _tag);
      return false;
    }
  }

  /// Use a rewind credit
  Future<bool> useRewindCredit(String targetUserId) async {
    try {
      final sub = await getMySubscription();
      if (sub == null || sub.rewindCredits <= 0) return false;

      final userId = _supabase.auth.currentUser!.id;

      // Decrement rewind credits
      await _supabase
          .from('user_subscriptions')
          .update({'rewind_credits': sub.rewindCredits - 1})
          .eq('user_id', userId);

      // Log usage
      await _supabase.from('feature_usage').insert({
        'user_id': userId,
        'feature_type': 'REWIND',
        'target_user_id': targetUserId,
      });

      _log.debug('⏪ Rewind used', tag: _tag);
      return true;
    } catch (e) {
      _log.error('❌ Error using rewind: $e', tag: _tag);
      return false;
    }
  }

  /// Refresh daily credits (call on app open)
  Future<void> refreshDailyCredits() async {
    try {
      final sub = await getMySubscription();
      if (sub == null) return;

      final now = DateTime.now();
      final lastRefresh = sub.lastCreditRefresh;

      // Check if we need to refresh (new day)
      if (now.day != lastRefresh.day || now.difference(lastRefresh).inHours >= 24) {
        await _supabase.from('user_subscriptions').update({
          'rewind_credits': sub.dailyRewindLimit,
          'last_credit_refresh': now.toIso8601String(),
        }).eq('user_id', sub.userId);
        _log.debug('🔄 Daily credits refreshed', tag: _tag);
      }
    } catch (e) {
      _log.error('❌ Error refreshing daily credits: $e', tag: _tag);
    }
  }

  /// Check if user can use boost
  Future<bool> canUseBoost() async {
    final sub = await getMySubscription();
    return sub != null && sub.boostCredits > 0;
  }

  /// Check if user can use super like
  Future<bool> canUseSuperLike() async {
    final sub = await getMySubscription();
    return sub != null && sub.superLikeCredits > 0;
  }

  /// Check if user can use rewind
  Future<bool> canUseRewind() async {
    final sub = await getMySubscription();
    return sub != null && sub.rewindCredits > 0;
  }

  /// Check if user can see who liked them
  Future<bool> canSeeWhoLikedYou() async {
    final sub = await getMySubscription();
    return sub != null && sub.isPremium && sub.isActive;
  }

  /// Get feature usage count for today
  Future<int> getTodayUsageCount(FeatureType feature) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return 0;

      final today = DateTime.now();
      final startOfDay = DateTime(today.year, today.month, today.day);

      final response = await _supabase
          .from('feature_usage')
          .select('id')
          .eq('user_id', userId)
          .eq('feature_type', feature.name.toUpperCase())
          .gte('used_at', startOfDay.toIso8601String());

      return (response as List).length;
    } catch (e) {
      _log.error('Error getting usage count: $e', tag: _tag);
      return 0;
    }
  }
}
