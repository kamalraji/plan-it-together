import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:thittam1hub/models/product_with_org.dart';
import 'package:thittam1hub/widgets/product_card.dart';
import 'package:thittam1hub/theme.dart';

/// Product card for discovery view with organization info
class ProductDiscoveryCard extends StatelessWidget {
  final ProductWithOrg product;
  final VoidCallback? onTap;
  final VoidCallback? onOrganizationTap;

  const ProductDiscoveryCard({
    super.key,
    required this.product,
    this.onTap,
    this.onOrganizationTap,
  });

  Future<void> _handleTap(BuildContext context) async {
    HapticFeedback.lightImpact();

    if (onTap != null) {
      onTap!();
      return;
    }

    if (product.hasLink) {
      await ProductCardUtils.openProductLink(context, product.product);
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
                  : cs.outline.withValues(alpha: 0.5),
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
                      // Product name
                      Text(
                        product.name,
                        style: text.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          height: 1.2,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      // Organization info
                      _buildOrganizationRow(cs, text),
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
      height: 70,
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
              padding: const EdgeInsets.all(14),
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
                size: 22,
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
      top: 6,
      right: 6,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.amber500, AppColors.amber600],
          ),
          borderRadius: BorderRadius.circular(10),
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
            Icon(Icons.star, size: 10, color: Colors.white),
            SizedBox(width: 2),
            Text(
              'Featured',
              style: TextStyle(
                color: Colors.white,
                fontSize: 9,
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
      top: 6,
      left: 6,
      child: Tooltip(
        message: 'Opens external link',
        child: Container(
          padding: const EdgeInsets.all(5),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.9),
            shape: BoxShape.circle,
          ),
          child: Icon(
            Icons.open_in_new,
            size: 10,
            color: AppColors.textMuted,
          ),
        ),
      ),
    );
  }

  Widget _buildOrganizationRow(ColorScheme cs, TextTheme text) {
    return GestureDetector(
      onTap: onOrganizationTap,
      child: Row(
        children: [
          // Organization logo
          Container(
            width: 18,
            height: 18,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: cs.surfaceContainerHighest,
              border: Border.all(
                color: cs.outline.withValues(alpha: 0.3),
                width: 0.5,
              ),
            ),
            child: ClipOval(
              child: product.organizationLogoUrl != null
                  ? CachedNetworkImage(
                      imageUrl: product.organizationLogoUrl!,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Icon(
                        Icons.business,
                        size: 10,
                        color: cs.onSurfaceVariant,
                      ),
                      errorWidget: (_, __, ___) => Icon(
                        Icons.business,
                        size: 10,
                        color: cs.onSurfaceVariant,
                      ),
                    )
                  : Icon(
                      Icons.business,
                      size: 10,
                      color: cs.onSurfaceVariant,
                    ),
            ),
          ),
          const SizedBox(width: 6),
          // Organization name
          Expanded(
            child: Text(
              product.organizationName,
              style: text.bodySmall?.copyWith(
                color: cs.primary,
                fontWeight: FontWeight.w500,
                height: 1.2,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter(ColorScheme cs, Color catColor) {
    return Row(
      children: [
        if (product.displayCategory != null) ...[
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
              decoration: BoxDecoration(
                color: catColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                product.displayCategory!,
                style: TextStyle(
                  color: catColor,
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
        ],
        const Spacer(),
        if (product.hasPrice)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
            decoration: BoxDecoration(
              color: cs.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              product.displayPrice!,
              style: TextStyle(
                color: cs.primary,
                fontSize: 10,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
      ],
    );
  }

  String _buildSemanticLabel() {
    final parts = <String>[product.name];
    parts.add('by ${product.organizationName}');
    if (product.isFeatured) parts.add('Featured');
    if (product.displayCategory != null) parts.add(product.displayCategory!);
    if (product.hasPrice) parts.add(product.displayPrice!);
    if (product.hasLink) parts.add('Tap to open link');
    return parts.join(', ');
  }
}
