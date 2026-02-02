import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// =============================================================================
// RESPONSIVE BREAKPOINTS
// =============================================================================

/// Responsive breakpoint definitions (Material 3 aligned)
class AppBreakpoints {
  static const double compact = 0;     // Phones (0-599)
  static const double medium = 600;    // Tablets (600-839)
  static const double expanded = 840;  // Large tablets/desktop (840-1199)
  static const double large = 1200;    // Desktop (1200+)
}

/// Extension to provide device-detection utilities
extension ResponsiveContext on BuildContext {
  double get screenWidth => MediaQuery.of(this).size.width;
  double get screenHeight => MediaQuery.of(this).size.height;

  bool get isCompact => screenWidth < AppBreakpoints.medium;
  bool get isMedium => screenWidth >= AppBreakpoints.medium && screenWidth < AppBreakpoints.expanded;
  bool get isExpanded => screenWidth >= AppBreakpoints.expanded && screenWidth < AppBreakpoints.large;
  bool get isLarge => screenWidth >= AppBreakpoints.large;

  // Convenience aliases
  bool get isPhone => isCompact;
  bool get isTablet => isMedium || isExpanded;
  bool get isDesktop => isLarge;

  // For master-detail layouts
  bool get showMasterDetail => screenWidth >= AppBreakpoints.expanded;
}

/// Extension to provide device-aware layout values
extension ResponsiveLayout on BuildContext {
  // App bar height (slightly taller on tablets for touch targets)
  double get appBarHeight => isCompact ? 56.0 : 64.0;

  // Stories bar height
  double get storiesBarHeight => isCompact ? 90.0 : 110.0;

  // Content horizontal padding
  double get horizontalPadding => isCompact ? 16.0 : (isTablet ? 24.0 : 32.0);

  // Grid columns for cards
  int get gridColumns => isCompact ? 1 : (isMedium ? 2 : (isExpanded ? 3 : 4));

  // Card width constraints
  double get cardMaxWidth => isCompact ? double.infinity : 400.0;

  // Bottom content padding (accounts for bottom nav + FAB)
  double get bottomContentPadding => isCompact ? 80.0 : 24.0;

  // Master list width for master-detail layouts
  double get masterListWidth => 380.0;

  // EdgeInsets helpers
  EdgeInsets get contentPadding => EdgeInsets.symmetric(
    horizontal: horizontalPadding,
    vertical: isCompact ? 8.0 : 12.0,
  );
}

// =============================================================================
// RESPONSIVE BUILDER WIDGET
// =============================================================================

/// A widget that automatically rebuilds when crossing responsive breakpoints.
/// Useful for complex layout switches that need to respond to size changes.
class ResponsiveBuilder extends StatelessWidget {
  final Widget Function(BuildContext context, bool isPhone, bool isTablet, bool isDesktop) builder;

  const ResponsiveBuilder({
    super.key,
    required this.builder,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final isPhone = width < AppBreakpoints.medium;
        final isTablet = width >= AppBreakpoints.medium && width < AppBreakpoints.large;
        final isDesktop = width >= AppBreakpoints.large;

        return builder(context, isPhone, isTablet, isDesktop);
      },
    );
  }
}

/// Responsive wrapper that shows different widgets based on screen size
class AdaptiveLayout extends StatelessWidget {
  final Widget phone;
  final Widget? tablet;
  final Widget? desktop;

  const AdaptiveLayout({
    super.key,
    required this.phone,
    this.tablet,
    this.desktop,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        
        if (width >= AppBreakpoints.large && desktop != null) {
          return desktop!;
        }
        if (width >= AppBreakpoints.medium && tablet != null) {
          return tablet!;
        }
        return phone;
      },
    );
  }
}

// =============================================================================
// SPACING
// =============================================================================

/// Compact spacing values for elite modern design
class AppSpacing {
  static const double xs = 2.0;
  static const double sm = 6.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 24.0;
  static const double xxl = 32.0;

  // Border radius values (for convenience)
  static const double radiusXs = 4.0;
  static const double radiusSm = 6.0;
  static const double radiusMd = 10.0;
  static const double radiusLg = 14.0;
  static const double radiusXl = 20.0;
  static const double radiusFull = 999.0;

  // Edge insets shortcuts
  static const EdgeInsets paddingXs = EdgeInsets.all(xs);
  static const EdgeInsets paddingSm = EdgeInsets.all(sm);
  static const EdgeInsets paddingMd = EdgeInsets.all(md);
  static const EdgeInsets paddingLg = EdgeInsets.all(lg);
  static const EdgeInsets paddingXl = EdgeInsets.all(xl);

  // Horizontal padding
  static const EdgeInsets horizontalXs = EdgeInsets.symmetric(horizontal: xs);
  static const EdgeInsets horizontalSm = EdgeInsets.symmetric(horizontal: sm);
  static const EdgeInsets horizontalMd = EdgeInsets.symmetric(horizontal: md);
  static const EdgeInsets horizontalLg = EdgeInsets.symmetric(horizontal: lg);
  static const EdgeInsets horizontalXl = EdgeInsets.symmetric(horizontal: xl);

  // Vertical padding
  static const EdgeInsets verticalXs = EdgeInsets.symmetric(vertical: xs);
  static const EdgeInsets verticalSm = EdgeInsets.symmetric(vertical: sm);
  static const EdgeInsets verticalMd = EdgeInsets.symmetric(vertical: md);
  static const EdgeInsets verticalLg = EdgeInsets.symmetric(vertical: lg);
  static const EdgeInsets verticalXl = EdgeInsets.symmetric(vertical: xl);
}

/// Compact border radius for sleeker look
class AppRadius {
  static const double xs = 4.0;
  static const double sm = 6.0;
  static const double md = 10.0;
  static const double lg = 14.0;
  static const double xl = 20.0;
}

/// Standard layout constants for consistent sizing across all tabs
class AppLayout {
  // Standard app bar heights - compact and consistent
  static const double appBarHeight = 56.0;
  static const double toolbarHeight = 56.0;
  
  // Bottom navigation
  static const double bottomNavHeight = 56.0;
  
  // Content padding (accounts for bottom nav + FAB clearance)
  static const double bottomContentPadding = 80.0;
  
  // Content component heights for consistent sizing
  static const double storiesBarHeight = 90.0;
  static const double filterChipsHeight = 44.0;
  
  // Standard content insets
  static const EdgeInsets horizontalPadding = EdgeInsets.symmetric(horizontal: 16.0);
  static const EdgeInsets contentPadding = EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0);
}

// =============================================================================
// TEXT STYLE EXTENSIONS
// =============================================================================

/// Extension to add text style utilities to BuildContext
/// Access via context.textStyles
extension TextStyleContext on BuildContext {
  TextTheme get textStyles => Theme.of(this).textTheme;
}

/// Helper methods for common text style modifications
extension TextStyleExtensions on TextStyle {
  /// Make text bold
  TextStyle get bold => copyWith(fontWeight: FontWeight.bold);

  /// Make text semi-bold
  TextStyle get semiBold => copyWith(fontWeight: FontWeight.w600);

  /// Make text medium weight
  TextStyle get medium => copyWith(fontWeight: FontWeight.w500);

  /// Make text normal weight
  TextStyle get normal => copyWith(fontWeight: FontWeight.w400);

  /// Make text light
  TextStyle get light => copyWith(fontWeight: FontWeight.w300);

  /// Add custom color
  TextStyle withColor(Color color) => copyWith(color: color);

  /// Add custom size
  TextStyle withSize(double size) => copyWith(fontSize: size);
}

// =============================================================================
// THEME CONTEXT EXTENSION
// =============================================================================

/// Extension to provide easy access to theme-aware colors and utilities
extension ThemeContext on BuildContext {
  /// Get the current ColorScheme
  ColorScheme get colors => Theme.of(this).colorScheme;
  
  /// Check if dark mode is active
  bool get isDarkMode => Theme.of(this).brightness == Brightness.dark;
  
  /// Semantic background color (adapts to theme)
  Color get backgroundColor => colors.surface;
  
  /// Semantic card color (adapts to theme)
  Color get cardColor => colors.surfaceContainerHighest;
  
  /// Semantic border color (adapts to theme)
  Color get borderColor => colors.outline;
  
  /// Semantic primary text color (adapts to theme)
  Color get textPrimary => colors.onSurface;
  
  /// Semantic muted text color (adapts to theme)
  Color get textMuted => colors.onSurfaceVariant;
  
  /// Semantic divider color (adapts to theme)
  Color get dividerColor => colors.outline.withAlpha(128);
}

// =============================================================================
// COLORS
// =============================================================================

/// Thittam1Hub color system (Light/Dark)
class AppColors {
  // Brand
  static const primary = Color(0xFF8B5CF6); // Purple
  static const accent = Color(0xFF06B6D4); // Cyan

  // Light mode surfaces
  static const background = Color(0xFFFFFFFF);
  static const card = Color(0xFFF9FAFB);
  static const border = Color(0xFFE5E7EB);

  // Dark mode surfaces
  static const backgroundDark = Color(0xFF0B0B0D);
  static const cardDark = Color(0xFF15171A);
  static const borderDark = Color(0xFF2E3136);

  // Light mode text
  static const textPrimary = Color(0xFF111827);
  static const textMuted = Color(0xFF6B7280);
  static const textSecondary = Color(0xFF6B7280); // Alias for textMuted

  // Dark mode text
  static const textPrimaryDark = Colors.white;
  static const textMutedDark = Color(0xFFB5BAC1);

  // Feedback
  static const success = Color(0xFF10B981);
  static const warning = Color(0xFFF59E0B);
  static const error = Color(0xFFEF4444);
  static const info = Color(0xFF3B82F6); // Blue info color

  // Category colors (approx Tailwind 500s & 700s)
  static const violet500 = Color(0xFF8B5CF6);
  static const violet700 = Color(0xFF6D28D9);
  static const amber500 = Color(0xFFF59E0B);
  static const amber600 = Color(0xFFD97706);
  static const amber700 = Color(0xFFB45309);
  static const rose500 = Color(0xFFF43F5E);
  static const emerald500 = Color(0xFF10B981);
  static const pink500 = Color(0xFFEC4899);
  static const pink700 = Color(0xFFBE185D);
  static const indigo500 = Color(0xFF6366F1);
  static const teal500 = Color(0xFF14B8A6);
  static const fuchsia500 = Color(0xFFD946EF);
  static const red500 = Color(0xFFEF4444);
  static const cyan500 = Color(0xFF06B6D4);
  static const sky500 = Color(0xFF0EA5E9);
  
  // Blue colors
  static const blue500 = Color(0xFF3B82F6);
  static const blue700 = Color(0xFF1D4ED8);
  
  // Orange colors
  static const orange500 = Color(0xFFF97316);
  static const orange700 = Color(0xFFC2410C);
  
  // Slate/gray colors
  static const slate500 = Color(0xFF64748B);
  static const slate700 = Color(0xFF334155);
}

/// Compact font sizes for elite modern design
class FontSizes {
  static const double displayLarge = 48.0;
  static const double displayMedium = 38.0;
  static const double displaySmall = 30.0;
  static const double headlineLarge = 26.0;
  static const double headlineMedium = 22.0;
  static const double headlineSmall = 18.0;
  static const double titleLarge = 18.0;
  static const double titleMedium = 14.0;
  static const double titleSmall = 13.0;
  static const double labelLarge = 13.0;
  static const double labelMedium = 11.0;
  static const double labelSmall = 10.0;
  static const double bodyLarge = 14.0;
  static const double bodyMedium = 13.0;
  static const double bodySmall = 11.0;
}

// =============================================================================
// THEMES
// =============================================================================

/// Light theme aligned with Thittam1Hub brand
ThemeData get lightTheme => ThemeData(
  useMaterial3: true,
  colorScheme: const ColorScheme.light(
    primary: AppColors.primary,
    onPrimary: Colors.white,
    secondary: AppColors.accent,
    onSecondary: Colors.white,
    error: AppColors.error,
    onError: Colors.white,
    surface: AppColors.background,
    onSurface: AppColors.textPrimary,
    surfaceContainerHighest: AppColors.card,
    onSurfaceVariant: AppColors.textMuted,
    outline: AppColors.border,
    shadow: Colors.black,
    inversePrimary: AppColors.accent,
  ),
  brightness: Brightness.light,
  scaffoldBackgroundColor: AppColors.background,
  appBarTheme: const AppBarTheme(
    backgroundColor: Colors.transparent,
    foregroundColor: AppColors.textPrimary,
    elevation: 0,
    scrolledUnderElevation: 0,
  ),
  cardTheme: CardThemeData(
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
      side: BorderSide(
        color: AppColors.border.withAlpha(153),
        width: 1,
      ),
    ),
  ),
  dividerTheme: const DividerThemeData(
    color: AppColors.border,
    thickness: 1,
  ),
  switchTheme: SwitchThemeData(
    thumbColor: WidgetStateProperty.resolveWith((states) {
      if (states.contains(WidgetState.selected)) return AppColors.primary;
      return Colors.grey[400];
    }),
    trackColor: WidgetStateProperty.resolveWith((states) {
      if (states.contains(WidgetState.selected)) return AppColors.primary.withAlpha(128);
      return Colors.grey[300];
    }),
  ),
  textTheme: _buildTextTheme(Brightness.light),
);

/// Dark theme tuned for readability
ThemeData get darkTheme => ThemeData(
  useMaterial3: true,
  colorScheme: const ColorScheme.dark(
    primary: AppColors.primary,
    onPrimary: Colors.white,
    secondary: AppColors.accent,
    onSecondary: Colors.white,
    error: AppColors.error,
    onError: Colors.white,
    surface: AppColors.backgroundDark,
    onSurface: AppColors.textPrimaryDark,
    surfaceContainerHighest: AppColors.cardDark,
    onSurfaceVariant: AppColors.textMutedDark,
    outline: AppColors.borderDark,
    shadow: Colors.black,
    inversePrimary: AppColors.accent,
  ),
  brightness: Brightness.dark,
  scaffoldBackgroundColor: AppColors.backgroundDark,
  appBarTheme: const AppBarTheme(
    backgroundColor: Colors.transparent,
    foregroundColor: AppColors.textPrimaryDark,
    elevation: 0,
    scrolledUnderElevation: 0,
  ),
  cardTheme: CardThemeData(
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
      side: BorderSide(
        color: AppColors.borderDark.withAlpha(153),
        width: 1,
      ),
    ),
  ),
  dividerTheme: const DividerThemeData(
    color: AppColors.borderDark,
    thickness: 1,
  ),
  switchTheme: SwitchThemeData(
    thumbColor: WidgetStateProperty.resolveWith((states) {
      if (states.contains(WidgetState.selected)) return AppColors.primary;
      return Colors.grey[600];
    }),
    trackColor: WidgetStateProperty.resolveWith((states) {
      if (states.contains(WidgetState.selected)) return AppColors.primary.withAlpha(128);
      return Colors.grey[800];
    }),
  ),
  textTheme: _buildTextTheme(Brightness.dark),
);

/// Build text theme using Inter font family
TextTheme _buildTextTheme(Brightness brightness) {
  return TextTheme(
    displayLarge: GoogleFonts.inter(
      fontSize: FontSizes.displayLarge,
      fontWeight: FontWeight.w400,
      letterSpacing: -0.25,
    ),
    displayMedium: GoogleFonts.inter(
      fontSize: FontSizes.displayMedium,
      fontWeight: FontWeight.w400,
    ),
    displaySmall: GoogleFonts.inter(
      fontSize: FontSizes.displaySmall,
      fontWeight: FontWeight.w400,
    ),
    headlineLarge: GoogleFonts.inter(
      fontSize: FontSizes.headlineLarge,
      fontWeight: FontWeight.w600,
      letterSpacing: -0.5,
    ),
    headlineMedium: GoogleFonts.inter(
      fontSize: FontSizes.headlineMedium,
      fontWeight: FontWeight.w600,
    ),
    headlineSmall: GoogleFonts.inter(
      fontSize: FontSizes.headlineSmall,
      fontWeight: FontWeight.w600,
    ),
    titleLarge: GoogleFonts.inter(
      fontSize: FontSizes.titleLarge,
      fontWeight: FontWeight.w600,
    ),
    titleMedium: GoogleFonts.inter(
      fontSize: FontSizes.titleMedium,
      fontWeight: FontWeight.w500,
    ),
    titleSmall: GoogleFonts.inter(
      fontSize: FontSizes.titleSmall,
      fontWeight: FontWeight.w500,
    ),
    labelLarge: GoogleFonts.inter(
      fontSize: FontSizes.labelLarge,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.1,
    ),
    labelMedium: GoogleFonts.inter(
      fontSize: FontSizes.labelMedium,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.5,
    ),
    labelSmall: GoogleFonts.inter(
      fontSize: FontSizes.labelSmall,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.5,
    ),
    bodyLarge: GoogleFonts.inter(
      fontSize: FontSizes.bodyLarge,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.15,
    ),
    bodyMedium: GoogleFonts.inter(
      fontSize: FontSizes.bodyMedium,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.25,
    ),
    bodySmall: GoogleFonts.inter(
      fontSize: FontSizes.bodySmall,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.4,
    ),
  );
}
