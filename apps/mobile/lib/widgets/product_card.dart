import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:thittam1hub/models/product.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/services/product_service.dart';
import 'package:thittam1hub/utils/url_utils.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Product Card Utilities
// ─────────────────────────────────────────────────────────────────────────────

/// Shared utilities for product cards
class ProductCardUtils {
  ProductCardUtils._();

  /// Category color mapping for visual consistency
  static Color getCategoryColor(String? category) {
    if (category == null) return AppColors.accent;
    switch (category.toLowerCase()) {
      case 'software':
        return AppColors.violet500;
      case 'hardware':
        return AppColors.emerald500;
      case 'service':
        return AppColors.amber500;
      case 'course':
        return AppColors.pink500;
      case 'subscription':
        return AppColors.indigo500;
      case 'ebook':
        return AppColors.cyan500;
      case 'template':
        return AppColors.rose500;
      case 'saas':
        return AppColors.sky500;
      default:
        return AppColors.accent;
    }
  }

  /// Category icon mapping
  static IconData getCategoryIcon(String? category) {
    if (category == null) return Icons.inventory_2_outlined;
    switch (category.toLowerCase()) {
      case 'software':
        return Icons.code;
      case 'hardware':
        return Icons.memory;
      case 'service':
        return Icons.support_agent;
      case 'course':
        return Icons.school;
      case 'subscription':
        return Icons.autorenew;
      case 'ebook':
        return Icons.menu_book;
      case 'template':
        return Icons.dashboard_customize;
      case 'saas':
        return Icons.cloud_outlined;
      default:
        return Icons.inventory_2_outlined;
    }
  }

  /// Safely opens a product link with validation
  static Future<bool> openProductLink(
    BuildContext context,
    Product product, {
    bool recordAnalytics = true,
  }) async {
    // Validate URL before opening
    final safeUrl = product.safeLinkUrl;
    if (safeUrl == null) {
      _showErrorSnackBar(context, 'Invalid product link');
      return false;
    }

    final uri = Uri.tryParse(safeUrl);
    if (uri == null) {
      _showErrorSnackBar(context, 'Could not open link');
      return false;
    }

    try {
      // Check if we can launch
      if (!await canLaunchUrl(uri)) {
        _showErrorSnackBar(context, 'Cannot open this link');
        return false;
      }

      // Record analytics before opening
      if (recordAnalytics) {
        ProductService().recordClick(product.id);
      }

      // Launch in external browser for security
      await launchUrl(uri, mode: LaunchMode.externalApplication);
      return true;
    } catch (e) {
      _showErrorSnackBar(context, 'Failed to open link');
      return false;
    }
  }

  static void _showErrorSnackBar(BuildContext context, String message) {
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Grid View Product Card
// ─────────────────────────────────────────────────────────────────────────────

/// Grid view product card - compact square design with accessibility support
class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback? onTap;

  const ProductCard({
    super.key,
    required this.product,
    this.onTap,
  });

  Future<void> _handleTap(BuildContext context) async {
    HapticFeedback.lightImpact();

    if (onTap != null) {
      onTap!();
      return;
    }

    if (product.hasLink) {
      await ProductCardUtils.openProductLink(context, product);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    final catColor = ProductCardUtils.getCategoryColor(product.category);

    return Semantics(
      label: _buildSemanticLabel(),
      button: true,
      child: GestureDetector(
        onTap: () => _handleTap(context),
        child: Container(
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(
              color: product.isFeatured
                  ? AppColors.amber500.withValues(alpha: 0.5)
                  : cs.outline,
              width: product.isFeatured ? 1.5 : 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top section with gradient
              _buildHeader(catColor),
              // Content section
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Name
                      Text(
                        product.name,
                        style: text.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          height: 1.2,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const Spacer(),
                      // Bottom row: category + price
                      _buildFooter(cs, catColor),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(Color catColor) {
    return Container(
      height: 80,
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            catColor.withValues(alpha: 0.15),
            catColor.withValues(alpha: 0.05),
          ],
        ),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(AppRadius.lg - 1),
          topRight: Radius.circular(AppRadius.lg - 1),
        ),
      ),
      child: Stack(
        children: [
          // Product icon/placeholder
          Center(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.9),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: catColor.withValues(alpha: 0.2),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Icon(
                ProductCardUtils.getCategoryIcon(product.category),
                size: 24,
                color: catColor,
              ),
            ),
          ),
          // Featured badge
          if (product.isFeatured) _buildFeaturedBadge(),
          // Link indicator
          if (product.hasLink) _buildLinkIndicator(),
        ],
      ),
    );
  }

  Widget _buildFeaturedBadge() {
    return Positioned(
      top: 8,
      right: 8,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.amber500, AppColors.amber600],
          ),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: AppColors.amber500.withValues(alpha: 0.3),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.star, size: 12, color: Colors.white),
            SizedBox(width: 4),
            Text(
              'Featured',
              style: TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLinkIndicator() {
    return Positioned(
      top: 8,
      left: 8,
      child: Tooltip(
        message: 'Opens external link',
        child: Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.9),
            shape: BoxShape.circle,
          ),
          child: Icon(
            Icons.open_in_new,
            size: 12,
            color: AppColors.textMuted,
          ),
        ),
      ),
    );
  }

  Widget _buildFooter(ColorScheme cs, Color catColor) {
    return Row(
      children: [
        if (product.displayCategory != null) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: catColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              product.displayCategory!,
              style: TextStyle(
                color: catColor,
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
        const Spacer(),
        if (product.hasPrice)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: cs.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              product.displayPrice!,
              style: TextStyle(
                color: cs.primary,
                fontSize: 11,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
      ],
    );
  }

  String _buildSemanticLabel() {
    final parts = <String>[product.name];
    if (product.isFeatured) parts.add('Featured');
    if (product.displayCategory != null) parts.add(product.displayCategory!);
    if (product.hasPrice) parts.add(product.displayPrice!);
    if (product.hasLink) parts.add('Tap to open link');
    return parts.join(', ');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Featured Product Card
// ─────────────────────────────────────────────────────────────────────────────

/// Featured product card - larger horizontal design for showcasing
class FeaturedProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback? onTap;

  const FeaturedProductCard({
    super.key,
    required this.product,
    this.onTap,
  });

  Future<void> _handleTap(BuildContext context) async {
    HapticFeedback.lightImpact();

    if (onTap != null) {
      onTap!();
      return;
    }

    if (product.hasLink) {
      await ProductCardUtils.openProductLink(context, product);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    return Semantics(
      label: _buildSemanticLabel(),
      button: true,
      child: GestureDetector(
        onTap: () => _handleTap(context),
        child: Container(
          width: 280,
          margin: const EdgeInsets.only(right: 16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppColors.amber500.withValues(alpha: 0.1),
                AppColors.amber600.withValues(alpha: 0.05),
              ],
            ),
            borderRadius: BorderRadius.circular(AppRadius.xl),
            border: Border.all(
              color: AppColors.amber500.withValues(alpha: 0.3),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.amber500.withValues(alpha: 0.1),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header row
                _buildHeader(cs, text),
                const SizedBox(height: 12),
                // Description
                if (product.hasDescription)
                  Text(
                    product.description!,
                    style: text.bodyMedium?.copyWith(
                      color: AppColors.textMuted,
                      height: 1.4,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                const Spacer(),
                // Tags + CTA
                _buildFooter(cs, text),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(ColorScheme cs, TextTheme text) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.amber500, AppColors.amber600],
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(Icons.star, size: 20, color: Colors.white),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                product.name,
                style: text.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              if (product.displayCategory != null)
                Text(
                  product.displayCategory!,
                  style: text.bodySmall?.copyWith(
                    color: AppColors.amber600,
                    fontWeight: FontWeight.w600,
                  ),
                ),
            ],
          ),
        ),
        if (product.hasPrice)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 4,
                ),
              ],
            ),
            child: Text(
              product.displayPrice!,
              style: text.labelLarge?.copyWith(
                color: cs.primary,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildFooter(ColorScheme cs, TextTheme text) {
    return Row(
      children: [
        if (product.displayTags.isNotEmpty) ...[
          Expanded(
            child: Wrap(
              spacing: 6,
              runSpacing: 4,
              children: product.displayTags.take(3).map((tag) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.8),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    tag,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textMuted,
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ] else
          const Spacer(),
        if (product.hasLink)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: cs.primary,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'View',
                  style: text.labelMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(Icons.arrow_forward, size: 14, color: Colors.white),
              ],
            ),
          ),
      ],
    );
  }

  String _buildSemanticLabel() {
    final parts = <String>['Featured product', product.name];
    if (product.displayCategory != null) parts.add(product.displayCategory!);
    if (product.hasPrice) parts.add(product.displayPrice!);
    if (product.hasDescription) parts.add(product.description!);
    if (product.hasLink) parts.add('Tap to view');
    return parts.join(', ');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// List View Product Card
// ─────────────────────────────────────────────────────────────────────────────

/// List view product card - compact horizontal design
class ProductListCard extends StatelessWidget {
  final Product product;
  final VoidCallback? onTap;

  const ProductListCard({
    super.key,
    required this.product,
    this.onTap,
  });

  Future<void> _handleTap(BuildContext context) async {
    HapticFeedback.lightImpact();

    if (onTap != null) {
      onTap!();
      return;
    }

    if (product.hasLink) {
      await ProductCardUtils.openProductLink(context, product);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    final catColor = ProductCardUtils.getCategoryColor(product.category);

    return Semantics(
      label: _buildSemanticLabel(),
      button: true,
      child: GestureDetector(
        onTap: () => _handleTap(context),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(color: cs.outline),
          ),
          child: Row(
            children: [
              // Icon
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: catColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  ProductCardUtils.getCategoryIcon(product.category),
                  size: 20,
                  color: catColor,
                ),
              ),
              const SizedBox(width: 12),
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            product.name,
                            style: text.titleSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (product.isFeatured)
                          Padding(
                            padding: const EdgeInsets.only(left: 8),
                            child: Icon(
                              Icons.star,
                              size: 16,
                              color: AppColors.amber500,
                            ),
                          ),
                      ],
                    ),
                    if (product.hasDescription) ...[
                      const SizedBox(height: 2),
                      Text(
                        product.description!,
                        style: text.bodySmall?.copyWith(
                          color: AppColors.textMuted,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 12),
              // Price + Arrow
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (product.hasPrice)
                    Text(
                      product.displayPrice!,
                      style: text.labelLarge?.copyWith(
                        color: cs.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  if (product.hasLink)
                    Icon(
                      Icons.chevron_right,
                      size: 20,
                      color: AppColors.textMuted,
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _buildSemanticLabel() {
    final parts = <String>[product.name];
    if (product.isFeatured) parts.add('Featured');
    if (product.hasPrice) parts.add(product.displayPrice!);
    if (product.hasLink) parts.add('Tap to open');
    return parts.join(', ');
  }
}
