import 'dart:ui';
import 'package:flutter/material.dart';

/// Glassmorphism social login button with Google and Apple styling
class SocialLoginButton extends StatefulWidget {
  final String label;
  final VoidCallback onTap;
  final bool isApple;
  final bool isLoading;

  const SocialLoginButton({
    super.key,
    required this.label,
    required this.onTap,
    this.isApple = false,
    this.isLoading = false,
  });

  @override
  State<SocialLoginButton> createState() => _SocialLoginButtonState();
}

class _SocialLoginButtonState extends State<SocialLoginButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      onTap: widget.isLoading ? null : widget.onTap,
      child: AnimatedScale(
        scale: _isPressed ? 0.96 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
              decoration: BoxDecoration(
                color: widget.isApple && !isDark
                    ? Colors.black
                    : cs.surfaceContainerHighest.withOpacity(isDark ? 0.5 : 0.7),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: cs.outline.withOpacity(isDark ? 0.2 : 0.15),
                ),
                boxShadow: isDark
                    ? null
                    : [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
              ),
              child: widget.isLoading
                  ? Center(
                      child: SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: widget.isApple && !isDark
                              ? Colors.white
                              : cs.onSurface,
                        ),
                      ),
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (widget.isApple)
                          Icon(
                            Icons.apple,
                            size: 22,
                            color: widget.isApple && !isDark
                                ? Colors.white
                                : cs.onSurface,
                          )
                        else
                          const GoogleIcon(size: 22),
                        const SizedBox(width: 10),
                        Text(
                          widget.label,
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                            color: widget.isApple && !isDark
                                ? Colors.white
                                : cs.onSurface,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Custom Google icon painter (no external assets needed)
class GoogleIcon extends StatelessWidget {
  final double size;
  const GoogleIcon({super.key, this.size = 24});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(size, size),
      painter: _GoogleLogoPainter(),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final double s = size.width;
    final center = Offset(s / 2, s / 2);
    final radius = s / 2;

    // Google colors
    const blue = Color(0xFF4285F4);
    const green = Color(0xFF34A853);
    const yellow = Color(0xFFFBBC05);
    const red = Color(0xFFEA4335);

    final Paint paint = Paint()..style = PaintingStyle.fill;

    // Draw arcs for each color segment
    final rect = Rect.fromCircle(center: center, radius: radius);

    // Blue (right side)
    paint.color = blue;
    canvas.drawArc(rect, -0.4, 1.4, true, paint);

    // Green (bottom right)
    paint.color = green;
    canvas.drawArc(rect, 1.0, 0.9, true, paint);

    // Yellow (bottom left)
    paint.color = yellow;
    canvas.drawArc(rect, 1.9, 0.9, true, paint);

    // Red (top)
    paint.color = red;
    canvas.drawArc(rect, 2.8, 0.9, true, paint);

    // White inner circle
    paint.color = Colors.white;
    canvas.drawCircle(center, radius * 0.55, paint);

    // Blue horizontal bar
    paint.color = blue;
    canvas.drawRect(
      Rect.fromLTWH(s * 0.48, s * 0.38, s * 0.52, s * 0.24),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Social login divider with "or continue with" text
class SocialLoginDivider extends StatelessWidget {
  const SocialLoginDivider({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Row(
      children: [
        Expanded(child: Divider(color: cs.outline.withOpacity(0.3))),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'or continue with',
            style: TextStyle(
              color: cs.onSurfaceVariant,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Expanded(child: Divider(color: cs.outline.withOpacity(0.3))),
      ],
    );
  }
}
