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
import 'package:thittam1hub/widgets/username_field.dart';

import 'package:thittam1hub/services/logging_service.dart';

class SignUpPage extends StatefulWidget {
  const SignUpPage({super.key});

  @override
  State<SignUpPage> createState() => _SignUpPageState();
}

class _SignUpPageState extends State<SignUpPage> with TickerProviderStateMixin {
  static final _log = LoggingService.instance;
  static const String _tag = 'SignUpPage';
  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  final _auth = SupabaseAuthManager();
  bool _loading = false;
  bool _obscure = true;
  double _passwordStrength = 0.0;
  bool _googleLoading = false;
  bool _appleLoading = false;
  bool _usernameAvailable = true;


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
    _passwordController.addListener(_updatePasswordStrength);
  }

  void _initAnimations() {
    // Entry animations for staggered form fields
    _entryController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );

    _fieldAnimations = List.generate(6, (index) {
      return Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(
          parent: _entryController,
          curve: Interval(
            index * 0.1,
            0.4 + index * 0.1,
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

    // Celebration emoji animation
    _waveController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _waveRotation = Tween<double>(begin: -0.1, end: 0.1).animate(
      CurvedAnimation(parent: _waveController, curve: Curves.easeInOut),
    );
    _waveController.repeat(reverse: true);

    _entryController.forward();
  }

  void _updatePasswordStrength() {
    final password = _passwordController.text;
    double strength = 0.0;

    if (password.length >= 6) strength += 0.25;
    if (password.length >= 10) strength += 0.25;
    if (password.contains(RegExp(r'[A-Z]'))) strength += 0.15;
    if (password.contains(RegExp(r'[a-z]'))) strength += 0.1;
    if (password.contains(RegExp(r'[0-9]'))) strength += 0.15;
    if (password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))) strength += 0.1;

    setState(() => _passwordStrength = strength.clamp(0.0, 1.0));
  }

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _entryController.dispose();
    _logoController.dispose();
    _waveController.dispose();
    super.dispose();
  }

  Future<void> _signUp() async {
    if (!_formKey.currentState!.validate()) return;
    
    // Check if username is filled but not available
    final username = _usernameController.text.trim();
    if (username.isNotEmpty && !_usernameAvailable) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please choose an available username')),
      );
      return;
    }
    
    setState(() => _loading = true);
    try {
      await _auth.createAccountWithEmail(
        context,
        _emailController.text.trim(),
        _passwordController.text,
        _nameController.text.trim(),
        username: username.isEmpty ? null : username,
      );
      if (!mounted) return;
      context.go(AppRoutes.discover);
    } catch (e) {
      _log.error('Sign up failed: $e', tag: _tag);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Color _getStrengthColor(ColorScheme cs) {
    if (_passwordStrength < 0.3) return cs.error;
    if (_passwordStrength < 0.6) return Colors.orange;
    if (_passwordStrength < 0.8) return Colors.amber;
    return Colors.green;
  }

  String _getStrengthLabel() {
    if (_passwordStrength < 0.3) return 'Weak';
    if (_passwordStrength < 0.6) return 'Fair';
    if (_passwordStrength < 0.8) return 'Good';
    return 'Strong';
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
              top: -80,
              left: -60,
              child: Container(
                width: 220,
                height: 220,
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
              bottom: -80,
              right: -50,
              child: Container(
                width: 240,
                height: 240,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      cs.secondary.withOpacity(0.12),
                      cs.secondary.withOpacity(0.0),
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
                        // Greeting with celebration
                        _buildAnimatedField(1, _buildGreeting(cs)),
                        const SizedBox(height: 8),
                        _buildAnimatedField(
                          1,
                          Text(
                            'Join Thittam1Hub to register and get QR tickets',
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
                        // Sign in link
                        _buildAnimatedField(
                          5,
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                "Already have an account?",
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                      color: cs.onSurfaceVariant,
                                    ),
                              ),
                              TextButton(
                                onPressed: () => context.go(AppRoutes.signIn),
                                child: Text(
                                  'Sign in',
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
        'Create your account',
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
                  controller: _nameController,
                  label: 'Full name',
                  icon: Icons.person_outline_rounded,
                  textCapitalization: TextCapitalization.words,
                  validator: (v) => v != null && v.trim().length >= 2 ? null : 'Enter your name',
                  cs: cs,
                  isDark: isDark,
                ),
                const SizedBox(height: 16),
                // Username field with real-time availability check
                UsernameField(
                  controller: _usernameController,
                  fullName: _nameController.text,
                  onAvailabilityChanged: (available) {
                    setState(() => _usernameAvailable = available);
                  },
                ),
                const SizedBox(height: 16),
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
                // Password strength indicator
                if (_passwordController.text.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  _buildPasswordStrengthIndicator(cs),
                ],
                const SizedBox(height: 24),
                _buildGradientButton(cs),
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
  

  Widget _buildPasswordStrengthIndicator(ColorScheme cs) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                height: 4,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(2),
                  color: cs.surfaceContainerHighest,
                ),
                child: FractionallySizedBox(
                  alignment: Alignment.centerLeft,
                  widthFactor: _passwordStrength,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(2),
                      color: _getStrengthColor(cs),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Text(
              _getStrengthLabel(),
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: _getStrengthColor(cs),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    TextCapitalization textCapitalization = TextCapitalization.none,
    bool obscureText = false,
    Widget? suffixIcon,
    String? Function(String?)? validator,
    required ColorScheme cs,
    required bool isDark,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      textCapitalization: textCapitalization,
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
      onTap: _loading ? null : _signUp,
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
                  Icon(Icons.person_add_alt_1_rounded, color: Colors.white, size: 20),
                  SizedBox(width: 10),
                  Text(
                    'Sign Up',
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
