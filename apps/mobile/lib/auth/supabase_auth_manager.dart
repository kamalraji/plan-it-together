import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as supabase;
import 'package:uuid/uuid.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/models/models.dart';
import 'auth_manager.dart';

import 'package:thittam1hub/services/logging_service.dart';
class SupabaseAuthManager extends AuthManager with EmailSignInManager, GoogleSignInManager, AppleSignInManager {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'SupabaseAuthManager';

  /// Platform-aware redirect URL for OAuth
  /// - Mobile (iOS/Android): Deep link scheme
  /// - Web: Current origin URL
  static String get _redirectUrl {
    // Use kIsWeb to detect web platform
    if (kIsWeb) {
      // For web, redirect to current origin (handled by Supabase JS automatically)
      // Return empty to let Supabase use the Site URL
      return '';
    }
    // Mobile platforms use deep link
    return 'io.supabase.thittam1hub://login-callback';
  }
  @override
  supabase.User? get currentUser => SupabaseConfig.auth.currentUser;

  @override
  Stream<supabase.AuthState> get authStateChanges => SupabaseConfig.auth.onAuthStateChange;

  @override
  Future<supabase.User?> signInWithEmail(
    BuildContext context,
    String email,
    String password,
  ) async {
    try {
      final response = await SupabaseConfig.auth.signInWithPassword(
        email: email,
        password: password,
      );
      _log.info('✅ Signed in: ${response.user?.email}', tag: _tag);
      return response.user;
    } catch (e) {
      _log.error('❌ Sign in error: $e', tag: _tag);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Sign in failed: ${e.toString()}')),
        );
      }
      rethrow;
    }
  }

  @override
  Future<supabase.User?> createAccountWithEmail(
    BuildContext context,
    String email,
    String password,
    String fullName, {
    String? username,
  }) async {
    try {
      final response = await SupabaseConfig.auth.signUp(
        email: email,
        password: password,
      );
      
      if (response.user != null) {
        _log.info('✅ Account created: ${response.user!.email}', tag: _tag);
        
        // Create user profile with QR code and optional username
        final qrCode = const Uuid().v4();
        final profileData = <String, dynamic>{
          'id': response.user!.id,
          'email': email,
          'full_name': fullName,
          'qr_code': qrCode,
        };
        
        // Add username if provided
        if (username != null && username.isNotEmpty) {
          profileData['username'] = username;
          profileData['username_changed_at'] = DateTime.now().toIso8601String();
        }
        
        await SupabaseConfig.client.from('user_profiles').insert(profileData);
        
        _log.info('User profile created${username != null ? ' with username @$username' : ''}', tag: _tag);
      }
      
      return response.user;
    } catch (e) {
      _log.error('❌ Sign up error: $e', tag: _tag);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Sign up failed: ${e.toString()}')),
        );
      }
      rethrow;
    }
  }

  @override
  Future signOut() async {
    try {
      await SupabaseConfig.auth.signOut();
      _log.info('✅ Signed out', tag: _tag);
    } catch (e) {
      _log.error('❌ Sign out error: $e', tag: _tag);
      rethrow;
    }
  }

  @override
  Future deleteUser(BuildContext context) async {
    try {
      final user = currentUser;
      if (user == null) throw Exception('No user logged in');
      
      // Delete user profile first (cascades to registrations)
      await SupabaseConfig.client.from('user_profiles').delete().eq('id', user.id);
      
      // Delete auth user
      await SupabaseConfig.client.rpc('delete_user');
      
      _log.info('✅ User deleted', tag: _tag);
    } catch (e) {
      _log.error('❌ Delete user error: $e', tag: _tag);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Delete account failed: ${e.toString()}')),
        );
      }
      rethrow;
    }
  }

  @override
  Future updateEmail({
    required String email,
    required BuildContext context,
  }) async {
    try {
      await SupabaseConfig.auth.updateUser(supabase.UserAttributes(email: email));
      
      // Update email in users table
      final user = currentUser;
      if (user != null) {
        await SupabaseConfig.client
            .from('user_profiles')
            .update({'email': email})
            .eq('id', user.id);
      }
      
      _log.info('✅ Email updated', tag: _tag);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Email updated successfully')),
        );
      }
    } catch (e) {
      _log.error('❌ Update email error: $e', tag: _tag);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Update email failed: ${e.toString()}')),
        );
      }
      rethrow;
    }
  }

  @override
  Future resetPassword({
    required String email,
    required BuildContext context,
  }) async {
    try {
      await SupabaseConfig.auth.resetPasswordForEmail(email);
      _log.info('✅ Password reset email sent', tag: _tag);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Password reset email sent')),
        );
      }
    } catch (e) {
      _log.error('❌ Reset password error: $e', tag: _tag);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Reset password failed: ${e.toString()}')),
        );
      }
      rethrow;
    }
  }

  /// Get user profile from database
  Future<UserProfile?> getUserProfile(String userId) async {
    try {
      final data = await SupabaseConfig.client
          .from('user_profiles')
          .select()
          .eq('id', userId)
          .maybeSingle();
      
      if (data == null) return null;
      return UserProfile.fromJson(data);
    } catch (e) {
      _log.error('❌ Get user profile error: $e', tag: _tag);
      return null;
    }
  }

  /// Update user profile
  Future<void> updateUserProfile(UserProfile profile) async {
    try {
      await SupabaseConfig.client
          .from('user_profiles')
          .update(profile.toJson())
          .eq('id', profile.id);
      _log.info('✅ User profile updated', tag: _tag);
    } catch (e) {
      _log.error('❌ Update user profile error: $e', tag: _tag);
      rethrow;
    }
  }

  @override
  Future<supabase.User?> signInWithGoogle(BuildContext context) async {
    try {
      final redirectUrl = _redirectUrl;
      _log.info('🔐 Starting Google OAuth flow', tag: _tag, metadata: {
        'redirectUrl': redirectUrl.isEmpty ? '(using Site URL)' : redirectUrl,
        'launchMode': kIsWeb ? 'inAppWebView' : 'externalApplication',
        'provider': 'google',
        'platform': kIsWeb ? 'web' : 'mobile',
      });
      
      // Check current session state before OAuth
      final existingSession = SupabaseConfig.auth.currentSession;
      _log.debug('Pre-OAuth session state', tag: _tag, metadata: {
        'hasExistingSession': existingSession != null,
        'existingUserId': existingSession?.user.id,
      });
      
      // For web, omit redirectTo to use Site URL from Supabase config
      // For mobile, use deep link scheme
      if (kIsWeb) {
        await SupabaseConfig.auth.signInWithOAuth(
          supabase.OAuthProvider.google,
          authScreenLaunchMode: supabase.LaunchMode.inAppWebView,
        );
      } else {
        await SupabaseConfig.auth.signInWithOAuth(
          supabase.OAuthProvider.google,
          redirectTo: redirectUrl,
          authScreenLaunchMode: supabase.LaunchMode.externalApplication,
        );
      }
      
      _log.info('✅ Google OAuth initiated - awaiting callback', tag: _tag);
      // OAuth flow handles the rest via deep linking (mobile) or page reload (web)
      return null; // User will be set via authStateChanges stream
    } catch (e, stackTrace) {
      _log.error('❌ Google OAuth failed', tag: _tag, error: e, stackTrace: stackTrace, metadata: {
        'redirectUrl': _redirectUrl,
        'errorType': e.runtimeType.toString(),
        'platform': kIsWeb ? 'web' : 'mobile',
      });
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Google sign in failed: ${e.toString()}')),
        );
      }
      rethrow;
    }
  }

  @override
  Future<supabase.User?> signInWithApple(BuildContext context) async {
    try {
      final redirectUrl = _redirectUrl;
      _log.info('🔐 Starting Apple OAuth flow', tag: _tag, metadata: {
        'redirectUrl': redirectUrl.isEmpty ? '(using Site URL)' : redirectUrl,
        'launchMode': kIsWeb ? 'inAppWebView' : 'externalApplication',
        'provider': 'apple',
        'platform': kIsWeb ? 'web' : 'mobile',
      });
      
      // For web, omit redirectTo to use Site URL from Supabase config
      // For mobile, use deep link scheme
      if (kIsWeb) {
        await SupabaseConfig.auth.signInWithOAuth(
          supabase.OAuthProvider.apple,
          authScreenLaunchMode: supabase.LaunchMode.inAppWebView,
        );
      } else {
        await SupabaseConfig.auth.signInWithOAuth(
          supabase.OAuthProvider.apple,
          redirectTo: redirectUrl,
          authScreenLaunchMode: supabase.LaunchMode.externalApplication,
        );
      }
      
      _log.info('✅ Apple OAuth initiated - awaiting callback', tag: _tag);
      return null;
    } catch (e, stackTrace) {
      _log.error('❌ Apple OAuth failed', tag: _tag, error: e, stackTrace: stackTrace, metadata: {
        'redirectUrl': _redirectUrl,
        'errorType': e.runtimeType.toString(),
        'platform': kIsWeb ? 'web' : 'mobile',
      });
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Apple sign in failed: ${e.toString()}')),
        );
      }
      rethrow;
    }
  }

  /// Handle OAuth callback - create profile for new social users
  Future<void> handleOAuthUser(supabase.User user) async {
    try {
      final provider = user.appMetadata['provider'] as String?;
      final identities = user.identities ?? [];
      
      _log.info('🔄 Processing OAuth callback', tag: _tag, metadata: {
        'userId': user.id,
        'email': user.email,
        'provider': provider,
        'identityCount': identities.length,
        'providers': identities.map((i) => i.provider).toList(),
      });
      
      // Check if profile exists
      final existingProfile = await getUserProfile(user.id);
      if (existingProfile != null) {
        _log.debug('Profile already exists for OAuth user', tag: _tag, metadata: {
          'userId': user.id,
          'provider': provider,
        });
        return;
      }

      // Create profile for new OAuth user
      final qrCode = const Uuid().v4();
      final profileData = {
        'id': user.id,
        'email': user.email ?? '',
        'full_name': user.userMetadata?['full_name'] ??
            user.userMetadata?['name'] ??
            'User',
        'qr_code': qrCode,
        'avatar_url': user.userMetadata?['avatar_url'] ??
            user.userMetadata?['picture'],
      };
      
      await SupabaseConfig.client.from('user_profiles').insert(profileData);
      _log.info('✅ OAuth user profile created', tag: _tag, metadata: {
        'userId': user.id,
        'provider': provider,
        'hasAvatar': profileData['avatar_url'] != null,
      });
    } catch (e, stackTrace) {
      _log.error('❌ Create OAuth profile error', tag: _tag, error: e, stackTrace: stackTrace, metadata: {
        'userId': user.id,
        'provider': user.appMetadata['provider'],
      });
    }
  }
}
