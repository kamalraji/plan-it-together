import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../services/biometric_service.dart';
import '../../services/secure_storage_service.dart';

/// PIN/Biometric lock screen for chat access with real authentication
class ChatLockScreen extends StatefulWidget {
  final VoidCallback onUnlocked;
  final bool allowBiometric;

  const ChatLockScreen({
    super.key,
    required this.onUnlocked,
    this.allowBiometric = true,
  });

  @override
  State<ChatLockScreen> createState() => _ChatLockScreenState();
}

class _ChatLockScreenState extends State<ChatLockScreen>
    with SingleTickerProviderStateMixin {
  final List<int> _enteredPin = [];
  static const int _pinLength = 4;
  int _failedAttempts = 0;
  bool _isLocked = false;
  DateTime? _lockUntil;
  bool _isVerifying = false;
  String? _errorMessage;
  bool _biometricAvailable = false;
  BiometricType _biometricType = BiometricType.none;

  final BiometricService _biometricService = BiometricService.instance;
  final SecureStorageService _secureStorage = SecureStorageService.instance;

  late AnimationController _shakeController;
  late Animation<double> _shakeAnimation;

  @override
  void initState() {
    super.initState();
    _shakeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _shakeAnimation = Tween<double>(begin: 0, end: 10).animate(
      CurvedAnimation(parent: _shakeController, curve: Curves.elasticIn),
    );

    _initializeBiometric();
  }

  Future<void> _initializeBiometric() async {
    if (!widget.allowBiometric) return;

    // Check if biometric is available and enrolled
    final hasEnrolled = await _biometricService.hasBiometricEnrolled();
    final appEnrolled = await _biometricService.isAppBiometricEnrolled();
    final biometricType = await _biometricService.getPrimaryBiometricType();

    if (mounted) {
      setState(() {
        _biometricAvailable = hasEnrolled && appEnrolled;
        _biometricType = biometricType;
      });

      // Auto-trigger biometric if available
      if (_biometricAvailable) {
        await Future.delayed(const Duration(milliseconds: 300));
        if (mounted) {
          _tryBiometric();
        }
      }
    }
  }

  @override
  void dispose() {
    _shakeController.dispose();
    _biometricService.stopAuthentication();
    super.dispose();
  }

  Future<void> _tryBiometric() async {
    if (!_biometricAvailable || _isLocked || _isVerifying) return;

    setState(() {
      _isVerifying = true;
      _errorMessage = null;
    });

    final result = await _biometricService.authenticate(
      reason: 'Unlock your chats',
      biometricOnly: true,
    );

    if (!mounted) return;

    if (result.success) {
      await _secureStorage.recordUnlockTime();
      widget.onUnlocked();
    } else {
      setState(() {
        _isVerifying = false;
        if (result.isLocked) {
          _errorMessage = result.errorMessage;
        }
      });
    }
  }

  void _addDigit(int digit) {
    if (_isLocked || _enteredPin.length >= _pinLength || _isVerifying) return;

    HapticFeedback.lightImpact();
    setState(() {
      _enteredPin.add(digit);
      _errorMessage = null;
    });

    if (_enteredPin.length == _pinLength) {
      _verifyPin();
    }
  }

  void _removeDigit() {
    if (_enteredPin.isEmpty || _isVerifying) return;

    HapticFeedback.lightImpact();
    setState(() => _enteredPin.removeLast());
  }

  Future<void> _verifyPin() async {
    setState(() => _isVerifying = true);

    final enteredPin = _enteredPin.join();
    
    // Verify against securely stored PIN hash
    final isValid = await _secureStorage.verifyPin(enteredPin);

    if (!mounted) return;

    if (isValid) {
      await _secureStorage.recordUnlockTime();
      widget.onUnlocked();
    } else {
      _failedAttempts++;
      _shakeController.forward().then((_) => _shakeController.reset());
      HapticFeedback.heavyImpact();

      if (_failedAttempts >= 5) {
        // Lock for 30 seconds after 5 failed attempts
        setState(() {
          _isLocked = true;
          _lockUntil = DateTime.now().add(const Duration(seconds: 30));
          _errorMessage = 'Too many attempts. Locked for 30 seconds.';
        });
        _startLockTimer();
      } else {
        setState(() {
          _errorMessage = 'Incorrect PIN. ${5 - _failedAttempts} attempts remaining.';
        });
      }

      setState(() => _enteredPin.clear());
    }

    setState(() => _isVerifying = false);
  }

  void _startLockTimer() {
    Future.delayed(const Duration(seconds: 30), () {
      if (mounted) {
        setState(() {
          _isLocked = false;
          _failedAttempts = 0;
          _errorMessage = null;
        });
      }
    });
  }

  String get _biometricLabel {
    switch (_biometricType) {
      case BiometricType.faceId:
        return 'Use Face ID';
      case BiometricType.fingerprint:
        return 'Use Fingerprint';
      case BiometricType.iris:
        return 'Use Iris Scan';
      case BiometricType.none:
        return 'Use Biometric';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Scaffold(
      backgroundColor: cs.surface,
      body: SafeArea(
        child: Column(
          children: [
            const Spacer(flex: 2),

            // Lock icon with biometric type indicator
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: cs.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _biometricAvailable && _biometricType == BiometricType.faceId
                    ? Icons.face
                    : _biometricAvailable
                        ? Icons.fingerprint
                        : Icons.lock_rounded,
                size: 48,
                color: cs.primary,
              ),
            ),
            const SizedBox(height: 24),

            // Title
            Text(
              'Chat Locked',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _isLocked
                  ? 'Too many attempts. Try again later.'
                  : _biometricAvailable
                      ? '$_biometricLabel or enter PIN'
                      : 'Enter your PIN to access chats',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: cs.onSurface.withOpacity(0.6),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 40),

            // PIN dots with shake animation
            AnimatedBuilder(
              animation: _shakeAnimation,
              builder: (context, child) {
                return Transform.translate(
                  offset: Offset(_shakeAnimation.value, 0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      _pinLength,
                      (index) => AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        width: 20,
                        height: 20,
                        margin: const EdgeInsets.symmetric(horizontal: 8),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: index < _enteredPin.length
                              ? cs.primary
                              : cs.surfaceContainerHighest,
                          border: Border.all(
                            color: _errorMessage != null
                                ? cs.error.withOpacity(0.5)
                                : cs.outline.withOpacity(0.3),
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),

            // Error/status message
            if (_errorMessage != null) ...[
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Text(
                  _errorMessage!,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: cs.error,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ],

            // Loading indicator
            if (_isVerifying) ...[
              const SizedBox(height: 16),
              SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: cs.primary,
                ),
              ),
            ],

            const Spacer(),

            // Number pad
            if (!_isLocked)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 48),
                child: _NumberPad(
                  onDigit: _addDigit,
                  onDelete: _removeDigit,
                  onBiometric: _biometricAvailable ? _tryBiometric : null,
                  biometricType: _biometricType,
                  isVerifying: _isVerifying,
                ),
              ),

            const Spacer(),

            // Forgot PIN
            if (!_isLocked)
              TextButton(
                onPressed: () => _showForgotPinDialog(),
                child: Text(
                  'Forgot PIN?',
                  style: TextStyle(color: cs.primary),
                ),
              ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  void _showForgotPinDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Forgot PIN?'),
        content: const Text(
          'You can reset your PIN from Settings > Security after signing in with your account password.\n\n'
          'For security, this will require you to verify your identity.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              _showResetPinFlow();
            },
            child: const Text('Reset PIN'),
          ),
        ],
      ),
    );
  }

  void _showResetPinFlow() {
    // In a real app, this would trigger password verification
    // then allow PIN reset
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Please verify your account password to reset PIN'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

class _NumberPad extends StatelessWidget {
  final void Function(int) onDigit;
  final VoidCallback onDelete;
  final VoidCallback? onBiometric;
  final BiometricType biometricType;
  final bool isVerifying;

  const _NumberPad({
    required this.onDigit,
    required this.onDelete,
    this.onBiometric,
    this.biometricType = BiometricType.none,
    this.isVerifying = false,
  });

  IconData get _biometricIcon {
    switch (biometricType) {
      case BiometricType.faceId:
        return Icons.face;
      case BiometricType.fingerprint:
        return Icons.fingerprint;
      case BiometricType.iris:
        return Icons.remove_red_eye;
      case BiometricType.none:
        return Icons.fingerprint;
    }
  }

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      ignoring: isVerifying,
      child: Opacity(
        opacity: isVerifying ? 0.5 : 1.0,
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _NumberButton(digit: 1, onTap: () => onDigit(1)),
                _NumberButton(digit: 2, onTap: () => onDigit(2)),
                _NumberButton(digit: 3, onTap: () => onDigit(3)),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _NumberButton(digit: 4, onTap: () => onDigit(4)),
                _NumberButton(digit: 5, onTap: () => onDigit(5)),
                _NumberButton(digit: 6, onTap: () => onDigit(6)),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _NumberButton(digit: 7, onTap: () => onDigit(7)),
                _NumberButton(digit: 8, onTap: () => onDigit(8)),
                _NumberButton(digit: 9, onTap: () => onDigit(9)),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _ActionButton(
                  icon: onBiometric != null
                      ? _biometricIcon
                      : Icons.circle_outlined,
                  onTap: onBiometric ?? () {},
                  isEnabled: onBiometric != null,
                ),
                _NumberButton(digit: 0, onTap: () => onDigit(0)),
                _ActionButton(
                  icon: Icons.backspace_outlined,
                  onTap: onDelete,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _NumberButton extends StatelessWidget {
  final int digit;
  final VoidCallback onTap;

  const _NumberButton({required this.digit, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(40),
        splashColor: cs.primary.withOpacity(0.2),
        highlightColor: cs.primary.withOpacity(0.1),
        child: Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            color: cs.surfaceContainerHighest,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              '$digit',
              style: theme.textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool isEnabled;

  const _ActionButton({
    required this.icon,
    required this.onTap,
    this.isEnabled = true,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: isEnabled ? onTap : null,
        borderRadius: BorderRadius.circular(40),
        splashColor: cs.primary.withOpacity(0.2),
        child: SizedBox(
          width: 72,
          height: 72,
          child: Center(
            child: Icon(
              icon,
              size: 28,
              color: isEnabled
                  ? cs.onSurface
                  : cs.onSurface.withOpacity(0.3),
            ),
          ),
        ),
      ),
    );
  }
}
