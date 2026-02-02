import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/auth/supabase_auth_manager.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/social_login_button.dart';
import 'package:thittam1hub/widgets/thittam1hub_logo.dart';

import 'package:thittam1hub/services/logging_service.dart';

class SignInPage extends StatefulWidget {
  const SignInPage({super.key});

  @override
  State<SignInPage> createState() => _SignInPageState();
}

class _SignInPageState extends State<SignInPage> with TickerProviderStateMixin {
  static final _log = LoggingService.instance;
  static const String _tag = 'SignInPage';
  
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  final _auth = SupabaseAuthManager();
  bool _loading = false;
  bool _obscure = true;
  bool _googleLoading = false;
  bool _appleLoading = false;

  late AnimationController _entryController;
  late AnimationController _logoController;
  late AnimationController _waveController;
  late List<Animation<double>> _fieldAnimations;
  late Animation<double> _logoScale;
  late Animation<double> _waveRotation;

  @override
  void initState() {
    super.initState();
    _initAnimations();
  }

  void _initAnimations() {
    // Entry animations for staggered form fields
    _entryController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _fieldAnimations = List.generate(5, (index) {
      return Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(
          parent: _entryController,
          curve: Interval(
            index * 0.12,
            0.4 + index * 0.12,
            curve: Curves.easeOutCubic,
          ),
        ),
      );
    });

    // Logo pulse animation
    _logoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    );
    _logoScale = Tween<double>(begin: 1.0, end: 1.08).animate(
      CurvedAnimation(parent: _logoController, curve: Curves.easeInOut),
    );
    _logoController.repeat(reverse: true);

    // Wave emoji animation
    _waveController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _waveRotation = Tween<double>(begin: -0.15, end: 0.15).animate(
      CurvedAnimation(parent: _waveController, curve: Curves.easeInOut),
    );
    _waveController.repeat(reverse: true);

    _entryController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _entryController.dispose();
    _logoController.dispose();
    _waveController.dispose();
    super.dispose();
  }

  Future<void> _signIn() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await _auth.signInWithEmail(context, _emailController.text.trim(), _passwordController.text);
      if (!mounted) return;
      context.go(AppRoutes.discover);
    } catch (e) {
      _log.error('Sign in failed: $e', tag: _tag);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isDark
                ? [cs.surface, const Color(0xFF1a1025)]
                : [cs.surface, const Color(0xFFF5F0FF)],
          ),
        ),
        child: Stack(
          children: [
            // Decorative background circles
            Positioned(
              top: -100,
              right: -80,
              child: Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      cs.primary.withOpacity(0.15),
                      cs.primary.withOpacity(0.0),
                    ],
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: -50,
              left: -60,
              child: Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      cs.tertiary.withOpacity(0.12),
                      cs.tertiary.withOpacity(0.0),
                    ],
                  ),
                ),
              ),
            ),
            // Main content
            SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding, vertical: 24),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 400),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Animated Logo
                        _buildAnimatedField(0, _buildLogo(cs, isDark)),
                        const SizedBox(height: 20),
                        // Greeting with wave
                        _buildAnimatedField(1, _buildGreeting(cs)),
                        const SizedBox(height: 8),
                        _buildAnimatedField(
                          1,
                          Text(
                            'Sign in to discover and register for events',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: cs.onSurfaceVariant,
                                ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                        const SizedBox(height: 28),
                        // Glassmorphism form card
                        _buildAnimatedField(2, _buildFormCard(cs, isDark)),
                        const SizedBox(height: 16),
                        // Create account link
                        _buildAnimatedField(
                          4,
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                "No account?",
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                      color: cs.onSurfaceVariant,
                                    ),
                              ),
                              TextButton(
                                onPressed: () => context.go(AppRoutes.signUp),
                                child: Text(
                                  'Create one',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: cs.primary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAnimatedField(int index, Widget child) {
    return FadeTransition(
      opacity: _fieldAnimations[index.clamp(0, _fieldAnimations.length - 1)],
      child: SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0, 0.2),
          end: Offset.zero,
        ).animate(_fieldAnimations[index.clamp(0, _fieldAnimations.length - 1)]),
        child: child,
      ),
    );
  }

  Widget _buildLogo(ColorScheme cs, bool isDark) {
    return Center(
      child: ScaleTransition(
        scale: _logoScale,
        child: const Thittam1hubLogo(
          size: 88,
          showText: false,
          animated: true,
          showGlow: true,
        ),
      ),
    );
  }

  Widget _buildGreeting(ColorScheme cs) {
    return Center(
      child: Text(
        'Welcome back',
        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
              color: cs.onSurface,
            ),
      ),
    );
  }

  Widget _buildFormCard(ColorScheme cs, bool isDark) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: cs.surfaceContainerHighest.withOpacity(isDark ? 0.6 : 0.85),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: cs.outline.withOpacity(isDark ? 0.15 : 0.1),
            ),
            boxShadow: isDark
                ? null
                : [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 30,
                      offset: const Offset(0, 10),
                    ),
                  ],
          ),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildTextField(
                  controller: _emailController,
                  label: 'Email',
                  icon: Icons.alternate_email_rounded,
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) => v != null && v.contains('@') ? null : 'Enter a valid email',
                  cs: cs,
                  isDark: isDark,
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _passwordController,
                  label: 'Password',
                  icon: Icons.lock_outline_rounded,
                  obscureText: _obscure,
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscure ? Icons.visibility_rounded : Icons.visibility_off_rounded,
                      color: cs.onSurfaceVariant,
                    ),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                  validator: (v) => v != null && v.length >= 6 ? null : 'Min 6 characters',
                  cs: cs,
                  isDark: isDark,
                ),
                const SizedBox(height: 20),
                _buildGradientButton(cs),
                const SizedBox(height: 12),
                Center(
                  child: TextButton(
                    onPressed: _loading
                        ? null
                        : () async {
                            final email = _emailController.text.trim();
                            if (email.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: const Text('Enter your email to reset password'),
                                  backgroundColor: cs.error,
                                ),
                              );
                              return;
                            }
                            try {
                              await _auth.resetPassword(email: email, context: context);
                            } catch (_) {}
                          },
                    child: Text(
                      'Forgot password?',
                      style: TextStyle(color: cs.onSurfaceVariant),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                const SocialLoginDivider(),
                const SizedBox(height: 20),
                _buildSocialButtons(cs, isDark),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSocialButtons(ColorScheme cs, bool isDark) {
    return Row(
      children: [
        Expanded(
          child: SocialLoginButton(
            label: 'Google',
            onTap: _signInWithGoogle,
            isLoading: _googleLoading,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: SocialLoginButton(
            label: 'Apple',
            onTap: _signInWithApple,
            isApple: true,
            isLoading: _appleLoading,
          ),
        ),
      ],
    );
  }

  Future<void> _signInWithGoogle() async {
    setState(() => _googleLoading = true);
    try {
      await _auth.signInWithGoogle(context);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _googleLoading = false);
    }
  }

  Future<void> _signInWithApple() async {
    setState(() => _appleLoading = true);
    try {
      await _auth.signInWithApple(context);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _appleLoading = false);
    }
  }
  

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    bool obscureText = false,
    Widget? suffixIcon,
    String? Function(String?)? validator,
    required ColorScheme cs,
    required bool isDark,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      style: TextStyle(color: cs.onSurface),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: cs.onSurfaceVariant),
        prefixIcon: Container(
          margin: const EdgeInsets.all(12),
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: cs.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 20, color: cs.primary),
        ),
        suffixIcon: suffixIcon,
        filled: true,
        fillColor: cs.surface.withOpacity(isDark ? 0.3 : 0.5),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: cs.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: cs.error, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: cs.error, width: 2),
        ),
      ),
      validator: validator,
    );
  }

  Widget _buildGradientButton(ColorScheme cs) {
    return GestureDetector(
      onTap: _loading ? null : _signIn,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
            colors: [cs.primary, cs.primary.withBlue(220)],
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: cs.primary.withOpacity(0.4),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: _loading
            ? const Center(
                child: SizedBox(
                  height: 22,
                  width: 22,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    valueColor: AlwaysStoppedAnimation(Colors.white),
                  ),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(Icons.login_rounded, color: Colors.white, size: 20),
                  SizedBox(width: 10),
                  Text(
                    'Sign In',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
