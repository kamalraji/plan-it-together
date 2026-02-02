import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/widgets/thittam1hub_logo.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';

/// Animated splash screen with Thittam1hub branding
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _logoController;
  late AnimationController _textController;
  late AnimationController _taglineController;
  late AnimationController _exitController;

  late Animation<double> _logoScale;
  late Animation<double> _logoOpacity;
  late Animation<double> _textOpacity;
  late Animation<Offset> _textSlide;
  late Animation<double> _taglineOpacity;
  late Animation<Offset> _taglineSlide;
  late Animation<double> _exitScale;
  late Animation<double> _exitOpacity;

  bool _animationComplete = false;
  bool _initComplete = false;

  @override
  void initState() {
    super.initState();
    _initAnimations();
    _startAnimationSequence();
    _initializeApp();
  }

  void _initAnimations() {
    // Logo animation (0-600ms)
    _logoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    _logoScale = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _logoController, curve: Curves.elasticOut),
    );

    _logoOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _logoController, curve: Curves.easeOut),
    );

    // Text animation (400-800ms)
    _textController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );

    _textOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _textController, curve: Curves.easeOut),
    );

    _textSlide = Tween<Offset>(
      begin: const Offset(0, 0.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _textController, curve: Curves.easeOut));

    // Tagline animation (600-1000ms)
    _taglineController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );

    _taglineOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _taglineController, curve: Curves.easeOut),
    );

    _taglineSlide = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _taglineController, curve: Curves.easeOut));

    // Exit animation
    _exitController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );

    _exitScale = Tween<double>(begin: 1.0, end: 1.1).animate(
      CurvedAnimation(parent: _exitController, curve: Curves.easeIn),
    );

    _exitOpacity = Tween<double>(begin: 1.0, end: 0.0).animate(
      CurvedAnimation(parent: _exitController, curve: Curves.easeIn),
    );
  }

  Future<void> _startAnimationSequence() async {
    // Start logo animation immediately
    await _logoController.forward();

    // Start text animation
    await Future.delayed(const Duration(milliseconds: 200));
    await _textController.forward();

    // Start tagline animation
    await Future.delayed(const Duration(milliseconds: 200));
    await _taglineController.forward();

    // Mark animation complete
    setState(() => _animationComplete = true);

    // Check if we can navigate
    _checkAndNavigate();
  }

  Future<void> _initializeApp() async {
    // Minimum splash display time
    await Future.delayed(const Duration(milliseconds: 2500));
    
    setState(() => _initComplete = true);
    _checkAndNavigate();
  }

  Future<void> _checkAndNavigate() async {
    if (!_animationComplete || !_initComplete) return;

    // Play exit animation
    await _exitController.forward();

    if (!mounted) return;

    // Navigate based on auth state
    final loggedIn = SupabaseConfig.auth.currentUser != null;
    if (loggedIn) {
      context.go(AppRoutes.discover);
    } else {
      context.go(AppRoutes.signIn);
    }
  }

  @override
  void dispose() {
    _logoController.dispose();
    _textController.dispose();
    _taglineController.dispose();
    _exitController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textTheme = Theme.of(context).textTheme;

    // Brand colors
    const gradientStart = Color(0xFF8B5CF6);
    const gradientEnd = Color(0xFF06B6D4);

    return Scaffold(
      body: AnimatedBuilder(
        animation: _exitController,
        builder: (context, child) {
          return FadeTransition(
            opacity: _exitOpacity,
            child: ScaleTransition(
              scale: _exitScale,
              child: child,
            ),
          );
        },
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: isDark
                  ? [
                      const Color(0xFF0F0A1A),
                      const Color(0xFF1A1025),
                      const Color(0xFF0F172A),
                    ]
                  : [
                      const Color(0xFFF8F5FF),
                      const Color(0xFFF0FDFA),
                      Colors.white,
                    ],
            ),
          ),
          child: Stack(
            children: [
              // Decorative background circles
              _buildDecorativeCircles(gradientStart, gradientEnd),

              // Main content
              SafeArea(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Animated Logo
                      ScaleTransition(
                        scale: _logoScale,
                        child: FadeTransition(
                          opacity: _logoOpacity,
                          child: const Thittam1hubLogo(
                            size: 120,
                            showText: false,
                            animated: true,
                            showGlow: true,
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),

                      // App name with animation
                      SlideTransition(
                        position: _textSlide,
                        child: FadeTransition(
                          opacity: _textOpacity,
                          child: ShaderMask(
                            shaderCallback: (bounds) => const LinearGradient(
                              colors: [gradientStart, gradientEnd],
                            ).createShader(bounds),
                            child: Text(
                              'Thittam1hub',
                              style: textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                letterSpacing: 1,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Tagline with animation
                      SlideTransition(
                        position: _taglineSlide,
                        child: FadeTransition(
                          opacity: _taglineOpacity,
                          child: Text(
                            'Connect. Discover. Impact.',
                            style: textTheme.bodyMedium?.copyWith(
                              color: cs.onSurfaceVariant,
                              letterSpacing: 2,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Loading indicator at bottom
              Positioned(
                bottom: 60,
                left: 0,
                right: 0,
                child: FadeTransition(
                  opacity: _taglineOpacity,
                  child: Center(
                    child: SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          cs.primary.withOpacity(0.6),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDecorativeCircles(Color start, Color end) {
    return Stack(
      children: [
        // Top right circle
        Positioned(
          top: -80,
          right: -60,
          child: Container(
            width: 200,
            height: 200,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  start.withOpacity(0.2),
                  start.withOpacity(0.0),
                ],
              ),
            ),
          ),
        ),
        // Bottom left circle
        Positioned(
          bottom: -100,
          left: -80,
          child: Container(
            width: 250,
            height: 250,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  end.withOpacity(0.15),
                  end.withOpacity(0.0),
                ],
              ),
            ),
          ),
        ),
        // Center subtle glow
        Positioned.fill(
          child: Center(
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    start.withOpacity(0.08),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
