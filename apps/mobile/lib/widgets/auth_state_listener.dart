import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../supabase/supabase_config.dart';
import '../providers/chat_provider.dart';
import '../providers/profile_provider.dart';
import '../providers/event_provider.dart';
import '../providers/notification_provider.dart';
import '../services/logging_service.dart';

/// Widget that listens to auth state changes and clears all provider state on logout.
/// 
/// Wrap this around your app (below MultiProvider) to ensure all providers
/// are properly cleared when the user signs out.
/// 
/// Usage:
/// ```dart
/// MultiProvider(
///   providers: [...],
///   child: AuthStateListener(
///     child: MyApp(),
///   ),
/// )
/// ```
class AuthStateListener extends StatefulWidget {
  final Widget child;

  const AuthStateListener({
    super.key,
    required this.child,
  });

  @override
  State<AuthStateListener> createState() => _AuthStateListenerState();
}

class _AuthStateListenerState extends State<AuthStateListener> {
  static const _tag = 'AuthStateListener';
  StreamSubscription<AuthState>? _authSubscription;

  @override
  void initState() {
    super.initState();
    _setupAuthListener();
  }

  void _setupAuthListener() {
    _authSubscription = SupabaseConfig.auth.onAuthStateChange.listen(
      (data) {
        final event = data.event;
        final session = data.session;
        final user = session?.user;
        
        // Detailed OAuth flow logging
        log.info('🔔 Auth state changed: ${event.name}', tag: _tag, metadata: {
          'event': event.name,
          'hasSession': session != null,
          'userId': user?.id,
          'email': user?.email,
          'provider': user?.appMetadata['provider'],
          'identities': user?.identities?.map((i) => {
              'provider': i.provider,
              'identityId': i.identityId,
              'createdAt': i.createdAt,
            }).toList(),
          'accessTokenExpiry': session?.expiresAt,
          'isExpired': session?.isExpired,
        });

        switch (event) {
          case AuthChangeEvent.signedOut:
            log.info('👋 User signed out - clearing providers', tag: _tag);
            _clearAllProviders();
            break;
          case AuthChangeEvent.signedIn:
            _logOAuthSuccess(user, session);
            _initializeProviders();
            break;
          case AuthChangeEvent.tokenRefreshed:
            log.debug('🔄 Token refreshed', tag: _tag, metadata: {
              'userId': user?.id,
              'newExpiry': session?.expiresAt,
            });
            _initializeProviders();
            break;
          case AuthChangeEvent.userUpdated:
            log.info('👤 User updated - refreshing profile', tag: _tag);
            _refreshProfile();
            break;
          default:
            log.debug('Unhandled auth event: ${event.name}', tag: _tag);
            break;
        }
      },
      onError: (error, stackTrace) {
        log.error('Auth listener error', tag: _tag, error: error, stackTrace: stackTrace);
      },
    );
  }

  void _logOAuthSuccess(User? user, Session? session) {
    if (user == null) return;
    
    final provider = user.appMetadata['provider'] as String?;
    final isOAuth = provider != null && provider != 'email';
    
    log.info('✅ User signed in successfully', tag: _tag, metadata: {
      'userId': user.id,
      'email': user.email,
      'provider': provider ?? 'email',
      'isOAuth': isOAuth,
      'fullName': user.userMetadata?['full_name'] ?? user.userMetadata?['name'],
      'avatarUrl': user.userMetadata?['avatar_url'] ?? user.userMetadata?['picture'],
      'emailConfirmed': user.emailConfirmedAt != null,
      'createdAt': user.createdAt,
      'lastSignIn': user.lastSignInAt,
      'identityProviders': user.identities?.map((i) => i.provider).toList(),
    });
    
    if (isOAuth) {
      log.info('🔐 OAuth flow completed', tag: _tag, metadata: {
        'provider': provider,
        'sessionExpiresAt': session?.expiresAt,
        'tokenType': session?.tokenType,
      });
    }
  }

  void _clearAllProviders() {
    log.info('Clearing all provider state on logout', tag: _tag);

    try {
      // Clear chat state
      if (context.mounted) {
        context.read<ChatProvider>().clearAll();
      }
    } catch (_) {}

    try {
      // Clear profile state
      if (context.mounted) {
        context.read<ProfileProvider>().clearAll();
      }
    } catch (_) {}

    try {
      // Clear event state
      if (context.mounted) {
        context.read<EventProvider>().clearAll();
      }
    } catch (_) {}

    try {
      // Clear notification state
      if (context.mounted) {
        context.read<NotificationProvider>().clearAll();
      }
    } catch (_) {}
  }

  void _initializeProviders() {
    log.info('Initializing providers on sign in', tag: _tag);

    try {
      // Initialize notification provider for real-time updates
      if (context.mounted) {
        context.read<NotificationProvider>().initialize();
      }
    } catch (_) {}

    try {
      // Load current user profile
      if (context.mounted) {
        context.read<ProfileProvider>().loadCurrentUserProfile();
      }
    } catch (_) {}
  }

  void _refreshProfile() {
    try {
      if (context.mounted) {
        context.read<ProfileProvider>().loadCurrentUserProfile(forceRefresh: true);
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
