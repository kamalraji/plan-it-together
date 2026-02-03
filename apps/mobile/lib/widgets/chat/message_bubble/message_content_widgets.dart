import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/forwarded_message_attachment.dart';
import 'package:thittam1hub/theme.dart';

/// Widget for displaying forwarded message content
class ForwardedMessageContent extends StatelessWidget {
  final ForwardedMessageAttachment forwarded;
  final String? additionalContent;
  final bool isOwn;

  const ForwardedMessageContent({
    super.key,
    required this.forwarded,
    this.additionalContent,
    required this.isOwn,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Forwarded header
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.forward_rounded,
                size: 14,
                color: cs.primary,
              ),
              const SizedBox(width: 6),
              Text(
                'Forwarded',
                style: textTheme.labelSmall?.copyWith(
                  color: cs.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Original message card
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest.withOpacity(0.5),
              borderRadius: BorderRadius.circular(10),
              border: Border(
                left: BorderSide(
                  color: cs.primary.withOpacity(0.6),
                  width: 3,
                ),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Original sender info
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (forwarded.originalSenderAvatar != null)
                      CircleAvatar(
                        radius: 10,
                        backgroundImage: NetworkImage(forwarded.originalSenderAvatar!),
                      )
                    else
                      CircleAvatar(
                        radius: 10,
                        backgroundColor: cs.primary.withOpacity(0.2),
                        child: Text(
                          forwarded.originalSenderName.isNotEmpty
                              ? forwarded.originalSenderName[0].toUpperCase()
                              : '?',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: cs.primary,
                          ),
                        ),
                      ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        forwarded.originalSenderName,
                        style: textTheme.labelMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: cs.onSurface,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),

                // Original message content
                if (forwarded.originalContent.isNotEmpty)
                  Text(
                    forwarded.originalContent,
                    style: textTheme.bodyMedium?.copyWith(
                      color: cs.onSurfaceVariant,
                      height: 1.4,
                    ),
                    maxLines: 5,
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),

          // Additional message from forwarder
          if (additionalContent != null && additionalContent!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              additionalContent!,
              style: textTheme.bodyMedium?.copyWith(
                color: cs.onSurface,
                height: 1.4,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Widget for displaying image content in messages
class ImageContent extends StatelessWidget {
  final List<MessageAttachment> attachments;
  final String? caption;
  final bool isOwn;

  const ImageContent({
    super.key,
    required this.attachments,
    this.caption,
    required this.isOwn,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
          child: CachedNetworkImage(
            imageUrl: attachments.first.url,
            width: double.infinity,
            fit: BoxFit.cover,
            placeholder: (_, __) => Container(
              height: 200,
              color: cs.surfaceContainerHighest,
              child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
            ),
            errorWidget: (_, __, ___) => Container(
              height: 150,
              color: cs.surfaceContainerHighest,
              child: const Center(child: Icon(Icons.broken_image)),
            ),
          ),
        ),
        if (caption != null)
          Padding(
            padding: const EdgeInsets.all(12),
            child: Text(
              caption!,
              style: context.textStyles.bodyMedium?.copyWith(
                color: cs.onSurface,
              ),
            ),
          ),
      ],
    );
  }
}
