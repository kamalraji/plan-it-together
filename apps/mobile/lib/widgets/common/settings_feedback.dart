import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Utility class for showing consistent settings feedback
/// across all settings pages in the app.
class SettingsFeedback {
  SettingsFeedback._();

  static OverlayEntry? _loadingOverlay;

  /// Show a success message with haptic feedback
  static void showSuccess(BuildContext context, String message) {
    HapticFeedback.lightImpact();
    _showSnackBar(
      context,
      message,
      backgroundColor: Colors.green.shade700,
      icon: Icons.check_circle_outline,
    );
  }

  /// Show an error message with haptic feedback
  static void showError(BuildContext context, String message) {
    HapticFeedback.heavyImpact();
    _showSnackBar(
      context,
      message,
      backgroundColor: Theme.of(context).colorScheme.error,
      icon: Icons.error_outline,
    );
  }

  /// Show an info message
  static void showInfo(BuildContext context, String message) {
    _showSnackBar(
      context,
      message,
      backgroundColor: Theme.of(context).colorScheme.primary,
      icon: Icons.info_outline,
    );
  }

  /// Show a warning message
  static void showWarning(BuildContext context, String message) {
    HapticFeedback.mediumImpact();
    _showSnackBar(
      context,
      message,
      backgroundColor: Colors.orange.shade700,
      icon: Icons.warning_amber_outlined,
    );
  }

  /// Show loading overlay
  static void showLoading(BuildContext context, String message) {
    hideLoading(context);
    
    _loadingOverlay = OverlayEntry(
      builder: (context) => Material(
        color: Colors.black54,
        child: Center(
          child: Card(
            margin: const EdgeInsets.all(32),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(
                    width: 48,
                    height: 48,
                    child: CircularProgressIndicator(strokeWidth: 3),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    message,
                    style: Theme.of(context).textTheme.bodyLarge,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );

    Overlay.of(context).insert(_loadingOverlay!);
  }

  /// Hide loading overlay
  static void hideLoading(BuildContext context) {
    _loadingOverlay?.remove();
    _loadingOverlay = null;
  }

  static void _showSnackBar(
    BuildContext context,
    String message, {
    required Color backgroundColor,
    required IconData icon,
  }) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
        backgroundColor: backgroundColor,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 3),
      ),
    );
  }
}
