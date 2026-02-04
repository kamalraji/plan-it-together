import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
export 'package:mobile_scanner/mobile_scanner.dart' 
    show MobileScannerController, MobileScanner, BarcodeCapture, Barcode, DetectionSpeed, CameraFacing;
import 'glassmorphism_bottom_sheet.dart';

/// Callback for when a QR code is scanned
typedef OnQRCodeScanned = void Function(String data);

/// Full-screen QR scanner sheet with camera controls
class QRScannerSheet extends StatefulWidget {
  final String title;
  final String? subtitle;
  final OnQRCodeScanned onScanned;
  final bool closeOnScan;

  const QRScannerSheet({
    super.key,
    required this.title,
    this.subtitle,
    required this.onScanned,
    this.closeOnScan = true,
  });

  /// Show the scanner as a modal bottom sheet
  static Future<String?> show(
    BuildContext context, {
    required String title,
    String? subtitle,
  }) {
    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => QRScannerSheet(
        title: title,
        subtitle: subtitle,
        onScanned: (data) {
          Navigator.of(context).pop(data);
        },
      ),
    );
  }

  @override
  State<QRScannerSheet> createState() => _QRScannerSheetState();
}

class _QRScannerSheetState extends State<QRScannerSheet> {
  late MobileScannerController _controller;
  bool _hasScanned = false;
  bool _isTorchOn = false;
  bool _isFrontCamera = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _controller = MobileScannerController(
      detectionSpeed: DetectionSpeed.normal,
      facing: CameraFacing.back,
      torchEnabled: false,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_hasScanned) return;

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final String? data = barcodes.first.rawValue;
    if (data == null || data.isEmpty) return;

    setState(() => _hasScanned = true);
    HapticFeedback.mediumImpact();

    widget.onScanned(data);

    if (widget.closeOnScan) {
      Navigator.of(context).pop();
    }
  }

  void _toggleTorch() {
    _controller.toggleTorch();
    setState(() => _isTorchOn = !_isTorchOn);
    HapticFeedback.lightImpact();
  }

  void _switchCamera() {
    _controller.switchCamera();
    setState(() => _isFrontCamera = !_isFrontCamera);
    HapticFeedback.lightImpact();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final size = MediaQuery.of(context).size;

    return Container(
      height: size.height * 0.85,
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: colorScheme.outline.withOpacity(0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close),
                ),
                Expanded(
                  child: Column(
                    children: [
                      Text(
                        widget.title,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (widget.subtitle != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          widget.subtitle!,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 48), // Balance close button
              ],
            ),
          ),
          // Camera view
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: colorScheme.outline.withOpacity(0.2),
                    width: 2,
                  ),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: Stack(
                    children: [
                      // Camera
                      MobileScanner(
                        controller: _controller,
                        onDetect: _onDetect,
                        errorBuilder: (context, error, child) {
                          return _buildErrorState(colorScheme, error.errorCode.name);
                        },
                      ),
                      // Scanning overlay
                      _buildScanOverlay(colorScheme),
                      // Success indicator
                      if (_hasScanned)
                        Container(
                          color: Colors.green.withOpacity(0.3),
                          child: const Center(
                            child: Icon(
                              Icons.check_circle,
                              color: Colors.white,
                              size: 80,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          // Controls
          Padding(
            padding: const EdgeInsets.all(24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildControlButton(
                  icon: _isTorchOn ? Icons.flash_on : Icons.flash_off,
                  label: 'Flash',
                  onTap: _toggleTorch,
                  isActive: _isTorchOn,
                  colorScheme: colorScheme,
                ),
                _buildControlButton(
                  icon: Icons.flip_camera_ios,
                  label: 'Flip',
                  onTap: _switchCamera,
                  isActive: _isFrontCamera,
                  colorScheme: colorScheme,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScanOverlay(ColorScheme colorScheme) {
    return CustomPaint(
      painter: _ScanOverlayPainter(
        borderColor: colorScheme.primary,
        overlayColor: Colors.black.withOpacity(0.5),
      ),
      child: const SizedBox.expand(),
    );
  }

  Widget _buildErrorState(ColorScheme colorScheme, String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.camera_alt_outlined,
              size: 64,
              color: colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              'Camera not available',
              style: TextStyle(
                color: colorScheme.error,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Please grant camera permission to scan QR codes.',
              style: TextStyle(color: colorScheme.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () => _controller.start(),
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required bool isActive,
    required ColorScheme colorScheme,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: isActive
                  ? colorScheme.primary
                  : colorScheme.surfaceContainerHighest,
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: isActive
                  ? colorScheme.onPrimary
                  : colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

/// Custom painter for the scanning overlay with corner brackets
class _ScanOverlayPainter extends CustomPainter {
  final Color borderColor;
  final Color overlayColor;

  _ScanOverlayPainter({
    required this.borderColor,
    required this.overlayColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = overlayColor;
    
    // Calculate scanning area (centered square)
    final scanSize = size.width * 0.7;
    final left = (size.width - scanSize) / 2;
    final top = (size.height - scanSize) / 2;
    final scanRect = Rect.fromLTWH(left, top, scanSize, scanSize);
    
    // Draw overlay with hole
    final path = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addRRect(RRect.fromRectAndRadius(scanRect, const Radius.circular(16)))
      ..fillType = PathFillType.evenOdd;
    canvas.drawPath(path, paint);
    
    // Draw corner brackets
    final bracketPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round;
    
    const bracketLength = 30.0;
    const cornerRadius = 16.0;
    
    // Top-left corner
    canvas.drawPath(
      Path()
        ..moveTo(left, top + bracketLength)
        ..lineTo(left, top + cornerRadius)
        ..quadraticBezierTo(left, top, left + cornerRadius, top)
        ..lineTo(left + bracketLength, top),
      bracketPaint,
    );
    
    // Top-right corner
    canvas.drawPath(
      Path()
        ..moveTo(left + scanSize - bracketLength, top)
        ..lineTo(left + scanSize - cornerRadius, top)
        ..quadraticBezierTo(left + scanSize, top, left + scanSize, top + cornerRadius)
        ..lineTo(left + scanSize, top + bracketLength),
      bracketPaint,
    );
    
    // Bottom-left corner
    canvas.drawPath(
      Path()
        ..moveTo(left, top + scanSize - bracketLength)
        ..lineTo(left, top + scanSize - cornerRadius)
        ..quadraticBezierTo(left, top + scanSize, left + cornerRadius, top + scanSize)
        ..lineTo(left + bracketLength, top + scanSize),
      bracketPaint,
    );
    
    // Bottom-right corner
    canvas.drawPath(
      Path()
        ..moveTo(left + scanSize - bracketLength, top + scanSize)
        ..lineTo(left + scanSize - cornerRadius, top + scanSize)
        ..quadraticBezierTo(left + scanSize, top + scanSize, left + scanSize, top + scanSize - cornerRadius)
        ..lineTo(left + scanSize, top + scanSize - bracketLength),
      bracketPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
