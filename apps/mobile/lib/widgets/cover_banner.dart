import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// Cover banner widget with gradient mesh or custom image
class CoverBanner extends StatelessWidget {
  final String? imageUrl;
  final List<Color>? gradientColors;
  final double height;
  final VoidCallback? onEditTap;
  final bool showEditButton;
  final Widget? overlay;

  const CoverBanner({
    super.key,
    this.imageUrl,
    this.gradientColors,
    this.height = 140,
    this.onEditTap,
    this.showEditButton = false,
    this.overlay,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SizedBox(
      height: height,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Background - Image, Custom Gradient, or Default Mesh
          if (imageUrl != null && imageUrl!.isNotEmpty)
            Image.network(
              imageUrl!,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => _buildGradientMesh(cs, isDark),
            )
          else if (gradientColors != null && gradientColors!.length >= 2)
            _buildCustomGradient(gradientColors!)
          else
            _buildGradientMesh(cs, isDark),

          // Noise texture overlay for depth
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    cs.surface.withValues(alpha: 0.3),
                  ],
                ),
              ),
            ),
          ),

          // Custom overlay widget (e.g., for avatar overlap)
          if (overlay != null) overlay!,

          // Edit button
          if (showEditButton && onEditTap != null)
            Positioned(
              top: 12,
              right: 12,
              child: _EditButton(onTap: onEditTap!),
            ),
        ],
      ),
    );
  }

  Widget _buildCustomGradient(List<Color> colors) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: colors,
        ),
      ),
    );
  }

  Widget _buildGradientMesh(ColorScheme cs, bool isDark) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [
                  cs.primary.withValues(alpha: 0.4),
                  cs.secondary.withValues(alpha: 0.3),
                  cs.surface,
                ]
              : [
                  cs.primary.withValues(alpha: 0.25),
                  cs.secondary.withValues(alpha: 0.2),
                  cs.surface.withValues(alpha: 0.9),
                ],
          stops: const [0.0, 0.5, 1.0],
        ),
      ),
      child: CustomPaint(
        painter: _MeshPatternPainter(
          color: isDark
              ? Colors.white.withValues(alpha: 0.03)
              : Colors.black.withValues(alpha: 0.02),
        ),
        size: Size.infinite,
      ),
    );
  }
}

class _EditButton extends StatelessWidget {
  final VoidCallback onTap;

  const _EditButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Material(
          color: Colors.black.withValues(alpha: 0.3),
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.camera_alt_outlined, size: 16, color: Colors.white),
                  const SizedBox(width: 4),
                  Text(
                    'Edit',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
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

/// Subtle mesh pattern painter for visual texture
class _MeshPatternPainter extends CustomPainter {
  final Color color;

  _MeshPatternPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 0.5
      ..style = PaintingStyle.stroke;

    const spacing = 30.0;
    
    // Draw diagonal lines for mesh effect
    for (double i = -size.height; i < size.width + size.height; i += spacing) {
      canvas.drawLine(
        Offset(i, 0),
        Offset(i + size.height, size.height),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
