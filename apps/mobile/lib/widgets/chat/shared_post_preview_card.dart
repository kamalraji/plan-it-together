import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/models/shared_post_attachment.dart';
import 'package:thittam1hub/theme.dart';

/// Rich preview card for shared posts in chat messages
class SharedPostPreviewCard extends StatelessWidget {
  final SharedPostAttachment post;
  final bool isOwnMessage;

  const SharedPostPreviewCard({
    super.key,
    required this.post,
    this.isOwnMessage = false,
  });

  void _openPost(BuildContext context) {
    HapticFeedback.lightImpact();
    context.push(AppRoutes.postDetail(post.postId));
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final hasImage = post.imageUrl != null && post.imageUrl!.isNotEmpty;

    return GestureDetector(
      onTap: () => _openPost(context),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 280),
        decoration: BoxDecoration(
          color: isOwnMessage
              ? cs.primary.withOpacity(0.08)
              : cs.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isOwnMessage
                ? cs.primary.withOpacity(0.2)
                : cs.outline.withOpacity(0.15),
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Image banner (if available)
            if (hasImage)
              AspectRatio(
                aspectRatio: 16 / 9,
                child: CachedNetworkImage(
                  imageUrl: post.imageUrl!,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(
                    color: cs.surfaceContainerHighest,
                    child: Center(
                      child: Icon(
                        Icons.image_rounded,
                        color: cs.outline,
                        size: 32,
                      ),
                    ),
                  ),
                  errorWidget: (_, __, ___) => Container(
                    color: cs.surfaceContainerHighest,
                    child: Center(
                      child: Icon(
                        Icons.broken_image_rounded,
                        color: cs.outline,
                        size: 32,
                      ),
                    ),
                  ),
                ),
              ),

            // Content section
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header row with icon
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: cs.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          Icons.article_rounded,
                          size: 14,
                          color: cs.primary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Shared Post',
                        style: context.textStyles.labelSmall?.copyWith(
                          color: cs.primary,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const Spacer(),
                      Icon(
                        Icons.open_in_new_rounded,
                        size: 14,
                        color: cs.outline,
                      ),
                    ],
                  ),

                  const SizedBox(height: 10),

                  // Title
                  Text(
                    post.title,
                    style: context.textStyles.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: cs.onSurface,
                      height: 1.3,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),

                  // Content preview
                  if (post.contentPreview.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      post.contentPreview,
                      style: context.textStyles.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],

                  const SizedBox(height: 10),

                  // Author row
                  Row(
                    children: [
                      // Author avatar
                      _buildAuthorAvatar(cs),
                      const SizedBox(width: 8),
                      // Author name
                      Expanded(
                        child: Text(
                          post.authorName,
                          style: context.textStyles.labelSmall?.copyWith(
                            color: cs.onSurfaceVariant,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAuthorAvatar(ColorScheme cs) {
    if (post.authorAvatar != null && post.authorAvatar!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: CachedNetworkImage(
          imageUrl: post.authorAvatar!,
          width: 20,
          height: 20,
          fit: BoxFit.cover,
          placeholder: (_, __) => _buildAvatarPlaceholder(cs),
          errorWidget: (_, __, ___) => _buildAvatarPlaceholder(cs),
        ),
      );
    }
    return _buildAvatarPlaceholder(cs);
  }

  Widget _buildAvatarPlaceholder(ColorScheme cs) {
    final initial = post.authorName.isNotEmpty
        ? post.authorName[0].toUpperCase()
        : '?';
    
    return Container(
      width: 20,
      height: 20,
      decoration: BoxDecoration(
        color: cs.primary.withOpacity(0.15),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Center(
        child: Text(
          initial,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: cs.primary,
          ),
        ),
      ),
    );
  }
}
