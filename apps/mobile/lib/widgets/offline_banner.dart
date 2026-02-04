import 'dart:async';
import 'package:flutter/material.dart';
import 'package:thittam1hub/services/connectivity_service.dart';

/// Animated offline banner that auto-shows/hides based on connectivity
class OfflineBanner extends StatefulWidget {
  final String? customMessage;
  
  const OfflineBanner({super.key, this.customMessage});

  @override
  State<OfflineBanner> createState() => _OfflineBannerState();
}

class _OfflineBannerState extends State<OfflineBanner> 
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _slideAnimation;
  late Animation<double> _fadeAnimation;
  
  bool _isOnline = true;
  Timer? _checkTimer;

  @override
  void initState() {
    super.initState();
    
    _animController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _slideAnimation = Tween<double>(begin: -1.0, end: 0.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic),
    );
    
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOut),
    );
    
    _isOnline = ConnectivityService.instance.isOnline;
    
    // Show banner immediately if offline
    if (!_isOnline) {
      _animController.forward();
    }
    
    // Listen for connectivity changes
    ConnectivityService.instance.addOnReconnectListener(_onReconnect);
    
    // Poll for connectivity changes (backup for listener)
    _checkTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      _checkConnectivity();
    });
  }

  @override
  void dispose() {
    _animController.dispose();
    _checkTimer?.cancel();
    ConnectivityService.instance.removeOnReconnectListener(_onReconnect);
    super.dispose();
  }

  void _onReconnect() {
    if (mounted) {
      setState(() => _isOnline = true);
      _animController.reverse();
    }
  }

  void _checkConnectivity() {
    final wasOnline = _isOnline;
    _isOnline = ConnectivityService.instance.isOnline;
    
    if (wasOnline != _isOnline && mounted) {
      setState(() {});
      if (_isOnline) {
        _animController.reverse();
      } else {
        _animController.forward();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return AnimatedBuilder(
      animation: _animController,
      builder: (context, child) {
        if (_animController.isDismissed) {
          return const SizedBox.shrink();
        }
        
        return ClipRect(
          child: SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0, -1),
              end: Offset.zero,
            ).animate(CurvedAnimation(
              parent: _animController,
              curve: Curves.easeOutCubic,
            )),
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isDark
                        ? [
                            const Color(0xFF2D1F1F),
                            const Color(0xFF1F1A1A),
                          ]
                        : [
                            theme.colorScheme.errorContainer,
                            theme.colorScheme.errorContainer.withOpacity(0.9),
                          ],
                  ),
                  border: Border(
                    bottom: BorderSide(
                      color: theme.colorScheme.error.withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: SafeArea(
                  bottom: false,
                  child: Row(
                    children: [
                      // Animated wifi icon
                      TweenAnimationBuilder<double>(
                        tween: Tween(begin: 0.8, end: 1.0),
                        duration: const Duration(milliseconds: 800),
                        curve: Curves.easeInOut,
                        builder: (context, value, child) {
                          return Transform.scale(
                            scale: value,
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: theme.colorScheme.error.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(
                                Icons.wifi_off_rounded,
                                size: 18,
                                color: isDark 
                                    ? const Color(0xFFFF6B6B)
                                    : theme.colorScheme.error,
                              ),
                            ),
                          );
                        },
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'You\'re offline',
                              style: theme.textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: isDark 
                                    ? Colors.white
                                    : theme.colorScheme.onErrorContainer,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              widget.customMessage ?? 
                                  'Viewing cached content. Changes will sync when reconnected.',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: isDark 
                                    ? Colors.white70
                                    : theme.colorScheme.onErrorContainer.withOpacity(0.8),
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Subtle reconnecting indicator
                      _ReconnectingDots(isDark: isDark),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Animated dots indicating reconnection attempt
class _ReconnectingDots extends StatefulWidget {
  final bool isDark;
  
  const _ReconnectingDots({required this.isDark});

  @override
  State<_ReconnectingDots> createState() => _ReconnectingDotsState();
}

class _ReconnectingDotsState extends State<_ReconnectingDots>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(3, (index) {
            final delay = index * 0.2;
            final progress = (_controller.value - delay).clamp(0.0, 1.0);
            final opacity = (progress < 0.5 
                ? progress * 2 
                : 2 - progress * 2).clamp(0.3, 1.0);
            
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 2),
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: (widget.isDark 
                    ? const Color(0xFFFF6B6B) 
                    : Theme.of(context).colorScheme.error)
                    .withOpacity(opacity),
              ),
            );
          }),
        );
      },
    );
  }
}
