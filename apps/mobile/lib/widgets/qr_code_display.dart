import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:thittam1hub/theme.dart';

/// Reusable QR code display widget with customizable styling
/// Used for both profile QR codes and ticket QR codes
class QrCodeDisplay extends StatelessWidget {
  /// The data to encode in the QR code
  final String data;

  /// Size of the QR code
  final double size;

  /// Whether to display in bright mode (white background, max contrast)
  final bool brightMode;

  /// Optional foreground color for QR modules
  final Color? foregroundColor;

  /// Optional background color
  final Color? backgroundColor;

  /// Optional widget to embed in center (e.g., app logo)
  final Widget? embeddedImage;

  /// Size of embedded image relative to QR size (0.0 - 0.3 recommended)
  final double embeddedImageSize;

  /// Eye shape for QR corners
  final QrEyeShape eyeShape;

  /// Data module shape
  final QrDataModuleShape dataModuleShape;

  /// Optional caption below QR code
  final String? caption;

  /// Callback when QR code is tapped
  final VoidCallback? onTap;

  /// Whether to show shadow
  final bool showShadow;

  /// Border radius for the container
  final double borderRadius;

  /// Padding around the QR code
  final EdgeInsets padding;

  const QrCodeDisplay({
    super.key,
    required this.data,
    this.size = 200,
    this.brightMode = false,
    this.foregroundColor,
    this.backgroundColor,
    this.embeddedImage,
    this.embeddedImageSize = 0.2,
    this.eyeShape = QrEyeShape.square,
    this.dataModuleShape = QrDataModuleShape.square,
    this.caption,
    this.onTap,
    this.showShadow = true,
    this.borderRadius = 16,
    this.padding = const EdgeInsets.all(16),
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final effectiveBgColor = backgroundColor ?? Colors.white;
    final effectiveFgColor = foregroundColor ?? Colors.black;

    Widget qrWidget = QrImageView(
      data: data,
      version: QrVersions.auto,
      size: size,
      backgroundColor: effectiveBgColor,
      eyeStyle: QrEyeStyle(
        eyeShape: eyeShape,
        color: effectiveFgColor,
      ),
      dataModuleStyle: QrDataModuleStyle(
        dataModuleShape: dataModuleShape,
        color: effectiveFgColor,
      ),
      embeddedImage: embeddedImage != null ? null : null,
      embeddedImageStyle: embeddedImage != null
          ? QrEmbeddedImageStyle(
              size: Size(size * embeddedImageSize, size * embeddedImageSize),
            )
          : null,
    );

    // Wrap with embedded image overlay if provided
    if (embeddedImage != null) {
      qrWidget = Stack(
        alignment: Alignment.center,
        children: [
          qrWidget,
          Container(
            width: size * embeddedImageSize,
            height: size * embeddedImageSize,
            decoration: BoxDecoration(
              color: effectiveBgColor,
              borderRadius: BorderRadius.circular(8),
            ),
            padding: const EdgeInsets.all(4),
            child: embeddedImage,
          ),
        ],
      );
    }

    Widget container = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: brightMode ? Colors.white : effectiveBgColor,
        borderRadius: BorderRadius.circular(borderRadius),
        boxShadow: showShadow
            ? [
                BoxShadow(
                  color: Colors.black.withValues(alpha: brightMode ? 0.15 : 0.08),
                  blurRadius: brightMode ? 30 : 20,
                  offset: const Offset(0, 4),
                ),
              ]
            : null,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          qrWidget,
          if (caption != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              caption!,
              style: context.textStyles.labelSmall?.withColor(cs.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );

    if (onTap != null) {
      container = GestureDetector(
        onTap: onTap,
        child: container,
      );
    }

    return container;
  }
}

/// Shimmer loading skeleton for QR code
class QrCodeSkeleton extends StatefulWidget {
  final double size;
  final bool showProfileCard;

  const QrCodeSkeleton({
    super.key,
    this.size = 200,
    this.showProfileCard = false,
  });

  @override
  State<QrCodeSkeleton> createState() => _QrCodeSkeletonState();
}

class _QrCodeSkeletonState extends State<QrCodeSkeleton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 0.3, end: 0.6).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.showProfileCard) ...[
              Container(
                width: double.infinity,
                height: 72,
                decoration: BoxDecoration(
                  color: cs.surfaceContainerHighest.withValues(alpha: _animation.value),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
            ],
            Container(
              width: widget.size + 32,
              height: widget.size + 32,
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest.withValues(alpha: _animation.value),
                borderRadius: BorderRadius.circular(AppRadius.lg),
              ),
              child: Center(
                child: Icon(
                  Icons.qr_code_2,
                  size: 80,
                  color: cs.onSurfaceVariant.withValues(alpha: 0.3),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Container(
              width: 150,
              height: 20,
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest.withValues(alpha: _animation.value),
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Container(
              width: 100,
              height: 14,
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest.withValues(alpha: _animation.value),
                borderRadius: BorderRadius.circular(7),
              ),
            ),
          ],
        );
      },
    );
  }
}
