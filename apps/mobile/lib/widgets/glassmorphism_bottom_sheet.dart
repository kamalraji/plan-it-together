import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Theme-aware glassmorphism configuration
class GlassConfig {
  // Light mode values
  static const double lightBlur = 20.0;
  static const double lightOpacity = 0.85;
  static const Color lightSurface = Colors.white;
  static const Color lightBorder = Color(0x0D000000); // 5% black
  
  // Dark mode values (enhanced for contrast)
  static const double darkBlur = 25.0;        // More blur for depth
  static const double darkOpacity = 0.75;     // Less opacity = more translucent
  static const Color darkSurface = Color(0xFF1A1B2E);
  static const Color darkBorder = Color(0x1AFFFFFF); // 10% white
  static const Color darkGlow = Color(0x0D8B5CF6);   // Subtle primary glow
  
  /// Get config based on theme
  static ({double blur, double opacity, Color surface, Color border}) forTheme(bool isDark) {
    if (isDark) {
      return (
        blur: darkBlur,
        opacity: darkOpacity,
        surface: darkSurface,
        border: darkBorder,
      );
    }
    return (
      blur: lightBlur,
      opacity: lightOpacity,
      surface: lightSurface,
      border: lightBorder,
    );
  }
}

/// Shows a glassmorphism bottom sheet with blur effect
Future<T?> showGlassBottomSheet<T>({
  required BuildContext context,
  required Widget child,
  String? title,
  bool isDismissible = true,
  bool enableDrag = true,
  bool showDragHandle = true,
  double? maxHeight,
  List<Widget>? actions,
}) {
  HapticFeedback.lightImpact();
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    isDismissible: isDismissible,
    enableDrag: enableDrag,
    backgroundColor: Colors.transparent,
    builder: (context) => GlassBottomSheet(
      title: title,
      showDragHandle: showDragHandle,
      maxHeight: maxHeight,
      actions: actions,
      child: child,
    ),
  );
}

/// A glassmorphism-styled bottom sheet with blur effect
class GlassBottomSheet extends StatelessWidget {
  final Widget child;
  final String? title;
  final bool showDragHandle;
  final double? maxHeight;
  final List<Widget>? actions;
  final EdgeInsetsGeometry? padding;
  final double? blurAmount;
  final double? opacity;
  final Color? borderColor;

  const GlassBottomSheet({
    super.key,
    required this.child,
    this.title,
    this.showDragHandle = true,
    this.maxHeight,
    this.actions,
    this.padding,
    this.blurAmount,
    this.opacity,
    this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final config = GlassConfig.forTheme(isDark);
    
    // Use configured values with overrides
    final effectiveBlur = blurAmount ?? config.blur;
    final effectiveOpacity = opacity ?? config.opacity;
    final effectiveSurface = config.surface.withValues(alpha: effectiveOpacity);
    final effectiveBorder = borderColor ?? config.border;

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: effectiveBlur, sigmaY: effectiveBlur),
        child: Container(
          constraints: BoxConstraints(
            maxHeight: maxHeight ?? MediaQuery.of(context).size.height * 0.85,
          ),
          decoration: BoxDecoration(
            // Dark mode: use gradient for depth effect
            color: isDark ? null : effectiveSurface,
            gradient: isDark ? LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                config.surface.withValues(alpha: effectiveOpacity + 0.05),
                config.surface.withValues(alpha: effectiveOpacity),
              ],
            ) : null,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            border: Border(
              top: BorderSide(color: effectiveBorder, width: 1),
              left: BorderSide(color: effectiveBorder, width: 0.5),
              right: BorderSide(color: effectiveBorder, width: 0.5),
            ),
            boxShadow: [
              BoxShadow(
                color: isDark 
                    ? Colors.black.withValues(alpha: 0.4) 
                    : Colors.black.withValues(alpha: 0.15),
                blurRadius: isDark ? 30 : 20,
                offset: const Offset(0, -5),
              ),
              // Dark mode: subtle glow effect
              if (isDark)
                BoxShadow(
                  color: GlassConfig.darkGlow,
                  blurRadius: 40,
                  offset: const Offset(0, -10),
                ),
            ],
          ),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (showDragHandle) _buildDragHandle(context),
                if (title != null || actions != null)
                  _buildHeader(context),
                Flexible(
                  child: SingleChildScrollView(
                    padding: padding ?? const EdgeInsets.fromLTRB(20, 0, 20, 20),
                    child: child,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDragHandle(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.only(top: 12, bottom: 8),
      width: 40,
      height: 4,
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.3) : Colors.black.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 12, 12),
      child: Row(
        children: [
          if (title != null)
            Expanded(
              child: Text(
                title!,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          if (actions != null) ...actions!,
        ],
      ),
    );
  }
}

/// Glass action button with hover/tap feedback
class GlassActionButton extends StatefulWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;
  final bool isDestructive;

  const GlassActionButton({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
    this.color,
    this.isDestructive = false,
  });

  @override
  State<GlassActionButton> createState() => _GlassActionButtonState();
}

class _GlassActionButtonState extends State<GlassActionButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    // Enhanced colors for dark mode
    final color = widget.isDestructive
        ? Colors.red
        : widget.color ?? Theme.of(context).colorScheme.primary;
    
    final textColor = widget.isDestructive
        ? Colors.red
        : (isDark ? Colors.white.withValues(alpha: 0.95) : Colors.black87);
    
    // Brighter press state for dark mode
    final pressedColor = isDark 
        ? Colors.white.withValues(alpha: 0.12)
        : Colors.black.withValues(alpha: 0.05);
    
    // Enhanced icon background for dark mode
    final iconBgOpacity = isDark ? 0.2 : 0.15;

    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      onTap: () {
        HapticFeedback.lightImpact();
        widget.onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 100),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: _isPressed ? pressedColor : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color.withValues(alpha: iconBgOpacity),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(widget.icon, color: color, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                widget.label,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: textColor,
                ),
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: isDark ? Colors.white38 : Colors.black26,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}

/// Glass action list for bottom sheet menus
class GlassActionList extends StatelessWidget {
  final List<GlassActionButton> actions;

  const GlassActionList({
    super.key,
    required this.actions,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (int i = 0; i < actions.length; i++) ...[
          actions[i],
          if (i < actions.length - 1)
            Divider(
              height: 1,
              color: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.08),
              indent: 70,
            ),
        ],
      ],
    );
  }
}

/// Glass profile header for bottom sheets
class GlassProfileHeader extends StatelessWidget {
  final String? avatarUrl;
  final String name;
  final String? subtitle;

  const GlassProfileHeader({
    super.key,
    this.avatarUrl,
    required this.name,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl!) : null,
            backgroundColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.2),
            child: avatarUrl == null
                ? Text(
                    name.isNotEmpty ? name[0].toUpperCase() : '?',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: isDark ? Colors.white60 : Colors.black54,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Glassmorphism card with theme-aware styling
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double? blurAmount;
  final double? opacity;
  final BorderRadius? borderRadius;

  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.blurAmount,
    this.opacity,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final config = GlassConfig.forTheme(isDark);
    final effectiveBlur = blurAmount ?? config.blur * 0.5;
    final effectiveOpacity = opacity ?? config.opacity * 0.8;
    final effectiveRadius = borderRadius ?? BorderRadius.circular(16);

    return ClipRRect(
      borderRadius: effectiveRadius,
      child: BackdropFilter(
        filter: ImageFilter.blur(
          sigmaX: effectiveBlur,
          sigmaY: effectiveBlur,
        ),
        child: Container(
          padding: padding ?? const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? null : config.surface.withValues(alpha: effectiveOpacity),
            gradient: isDark ? LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                config.surface.withValues(alpha: effectiveOpacity + 0.05),
                config.surface.withValues(alpha: effectiveOpacity - 0.05),
              ],
            ) : null,
            borderRadius: effectiveRadius,
            border: Border.all(color: config.border),
            boxShadow: isDark ? [
              BoxShadow(
                color: GlassConfig.darkGlow.withValues(alpha: 0.1),
                blurRadius: 20,
                spreadRadius: -5,
              ),
            ] : null,
          ),
          child: child,
        ),
      ),
    );
  }
}
