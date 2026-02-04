import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:thittam1hub/services/link_preview_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:url_launcher/url_launcher.dart';

/// Compact link preview card for chat messages.
///
/// Supports two usage patterns:
/// 1) Pass a pre-fetched [preview] (recommended for chat lists)
/// 2) Pass a [url] and let the widget fetch the preview
class LinkPreviewCard extends StatefulWidget {
  final String? url;
  final LinkPreview? preview;
  final bool compact;

  const LinkPreviewCard({
    super.key,
    this.url,
    this.preview,
    this.compact = false,
  }) : assert(url != null || preview != null, 'Either url or preview must be provided');

  @override
  State<LinkPreviewCard> createState() => _LinkPreviewCardState();
}

class _LinkPreviewCardState extends State<LinkPreviewCard> {
  LinkPreview? _preview;
  bool _isLoading = true;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();

    if (widget.preview != null) {
      _preview = widget.preview;
      _isLoading = false;
      return;
    }

    _loadPreview();
  }

  String get _url => widget.preview?.url ?? widget.url ?? '';

  Future<void> _loadPreview() async {
    final url = widget.url;
    if (url == null || url.trim().isEmpty) {
      setState(() {
        _hasError = true;
        _isLoading = false;
      });
      return;
    }

    try {
      final service = LinkPreviewService();
      final preview = await service.extractPreview(url);
      if (!mounted) return;

      setState(() {
        _preview = preview;
        _isLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _hasError = true;
        _isLoading = false;
      });
    }
  }

  Future<void> _openUrl() async {
    final uri = Uri.tryParse(_url);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (_isLoading) return _buildSkeleton(cs);

    // If preview failed or is empty, fall back to a minimal link row.
    if (_hasError || _preview == null || !_preview!.hasContent) {
      return _buildMinimalLink(cs);
    }

    return widget.compact ? _buildCompact(cs) : _buildFull(cs);
  }

  Widget _buildSkeleton(ColorScheme cs) {
    return Container(
      height: 80,
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Center(
        child: SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      ),
    );
  }

  Widget _buildMinimalLink(ColorScheme cs) {
    return GestureDetector(
      onTap: _openUrl,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: cs.outline.withOpacity(0.2)),
        ),
        child: Row(
          children: [
            Icon(Icons.link, size: 18, color: cs.primary),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                _extractDomain(_url),
                style: context.textStyles.bodySmall?.copyWith(
                  color: cs.primary,
                  decoration: TextDecoration.underline,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Icon(Icons.open_in_new, size: 14, color: cs.onSurfaceVariant),
          ],
        ),
      ),
    );
  }

  Widget _buildCompact(ColorScheme cs) {
    final p = _preview!;

    return GestureDetector(
      onTap: _openUrl,
      child: Container(
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: cs.outline.withOpacity(0.2)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Row(
          children: [
            if (p.image != null && p.image!.isNotEmpty)
              SizedBox(
                width: 80,
                height: 80,
                child: CachedNetworkImage(
                  imageUrl: p.image!,
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) => Container(
                    color: cs.primary.withOpacity(0.1),
                    child: Icon(Icons.link, color: cs.primary),
                  ),
                ),
              ),

            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        if (p.favicon != null && p.favicon!.isNotEmpty) ...[
                          SizedBox(
                            width: 14,
                            height: 14,
                            child: CachedNetworkImage(
                              imageUrl: p.favicon!,
                              errorWidget: (_, __, ___) => const SizedBox.shrink(),
                            ),
                          ),
                          const SizedBox(width: 6),
                        ],
                        Expanded(
                          child: Text(
                            _extractDomain(p.url),
                            style: context.textStyles.labelSmall?.copyWith(
                              color: cs.onSurfaceVariant,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      p.title ?? p.siteName ?? 'Link',
                      style: context.textStyles.labelMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFull(ColorScheme cs) {
    final p = _preview!;

    return GestureDetector(
      onTap: _openUrl,
      child: Container(
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: cs.outline.withOpacity(0.2)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (p.image != null && p.image!.isNotEmpty)
              AspectRatio(
                aspectRatio: 1.9,
                child: CachedNetworkImage(
                  imageUrl: p.image!,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(
                    color: cs.surfaceContainerHighest,
                    child: const Center(child: CircularProgressIndicator()),
                  ),
                  errorWidget: (_, __, ___) => Container(
                    color: cs.primary.withOpacity(0.1),
                    child: Center(child: Icon(Icons.link, size: 48, color: cs.primary)),
                  ),
                ),
              ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      if (p.favicon != null && p.favicon!.isNotEmpty) ...[
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: CachedNetworkImage(
                            imageUrl: p.favicon!,
                            errorWidget: (_, __, ___) => Icon(
                              Icons.public,
                              size: 16,
                              color: cs.onSurfaceVariant,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],
                      Text(
                        _extractDomain(p.url),
                        style: context.textStyles.labelSmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  Text(
                    p.title ?? p.url,
                    style: context.textStyles.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),

                  if (p.description != null && p.description!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      p.description!,
                      style: context.textStyles.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _extractDomain(String url) {
    try {
      final uri = Uri.parse(url);
      return uri.host.replaceFirst('www.', '');
    } catch (_) {
      return url;
    }
  }
}
