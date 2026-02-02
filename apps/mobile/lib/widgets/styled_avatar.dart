import 'package:flutter/material.dart';
import '../theme.dart';

enum StyledAvatarSize { xs, sm, md, lg, xl }

class StyledAvatar extends StatelessWidget {
  final String? imageUrl;
  final String? url; // Alias for imageUrl
  final String? initials;
  final String? name;
  final double? size;
  final StyledAvatarSize avatarSize;
  final bool isOnline;
  final VoidCallback? onTap;
  final Color? backgroundColor;
  final IconData? fallbackIcon;

  const StyledAvatar({
    super.key,
    this.imageUrl,
    this.url,
    this.initials,
    this.name,
    this.size,
    this.avatarSize = StyledAvatarSize.md,
    this.isOnline = false,
    this.onTap,
    this.backgroundColor,
    this.fallbackIcon,
  });

  /// Effective image URL (url takes precedence as alias)
  String? get _effectiveImageUrl => url ?? imageUrl;

  String? get _effectiveInitials {
    if (initials != null && initials!.isNotEmpty) return initials;
    if (name != null && name!.isNotEmpty) return name![0];
    return null;
  }

  double get _effectiveSize {
    if (size != null) return size!;
    return switch (avatarSize) {
      StyledAvatarSize.xs => 24,
      StyledAvatarSize.sm => 32,
      StyledAvatarSize.md => 48,
      StyledAvatarSize.lg => 64,
      StyledAvatarSize.xl => 96,
    };
  }

  double get _fontSize {
    final s = _effectiveSize;
    if (s <= 24) return 10;
    if (s <= 32) return 12;
    if (s <= 48) return 18;
    if (s <= 64) return 24;
    return 36;
  }

  double get _iconSize {
    final s = _effectiveSize;
    if (s <= 24) return 14;
    if (s <= 32) return 18;
    if (s <= 48) return 24;
    if (s <= 64) return 32;
    return 48;
  }

  double get _indicatorSize {
    final s = _effectiveSize;
    if (s <= 24) return 8;
    if (s <= 32) return 10;
    if (s <= 48) return 14;
    if (s <= 64) return 16;
    return 20;
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final bgColor = backgroundColor ?? cs.primaryContainer;

    return GestureDetector(
      onTap: onTap,
      child: Stack(
        children: [
          Container(
            width: _effectiveSize,
            height: _effectiveSize,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: bgColor,
              border: Border.all(
                color: cs.outline.withOpacity(0.3),
                width: 1,
              ),
            ),
            child: ClipOval(
              child: _buildContent(context, cs),
            ),
          ),
          if (isOnline)
            Positioned(
              right: 0,
              bottom: 0,
              child: Container(
                width: _indicatorSize,
                height: _indicatorSize,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.success,
                  border: Border.all(
                    color: cs.surface,
                    width: 2,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildContent(BuildContext context, ColorScheme cs) {
    final effectiveUrl = _effectiveImageUrl;
    if (effectiveUrl != null && effectiveUrl.isNotEmpty) {
      return Image.network(
        effectiveUrl,
        fit: BoxFit.cover,
        width: _effectiveSize,
        height: _effectiveSize,
        errorBuilder: (context, error, stackTrace) => _buildFallback(context, cs),
      );
    }
    return _buildFallback(context, cs);
  }

  Widget _buildFallback(BuildContext context, ColorScheme cs) {
    final displayInitials = _effectiveInitials;
    if (displayInitials != null && displayInitials.isNotEmpty) {
      return Center(
        child: Text(
          displayInitials.toUpperCase(),
          style: TextStyle(
            fontSize: _fontSize,
            fontWeight: FontWeight.w600,
            color: cs.onPrimaryContainer,
          ),
        ),
      );
    }
    return Center(
      child: Icon(
        fallbackIcon ?? Icons.person,
        size: _iconSize,
        color: cs.onPrimaryContainer,
      ),
    );
  }
}
