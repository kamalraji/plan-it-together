import 'package:flutter/material.dart';

/// Banner image widget for event detail hero
class EventBannerImage extends StatelessWidget {
  final String urlOrAsset;
  const EventBannerImage({super.key, required this.urlOrAsset});
  
  @override
  Widget build(BuildContext context) {
    if (urlOrAsset.startsWith('http')) {
      return Image.network(
        urlOrAsset,
        fit: BoxFit.cover,
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Container(
            color: Theme.of(context).colorScheme.surfaceContainerHighest,
            child: Center(
              child: CircularProgressIndicator(
                value: loadingProgress.expectedTotalBytes != null
                    ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                    : null,
                strokeWidth: 2,
              ),
            ),
          );
        },
        errorBuilder: (_, __, ___) => Container(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          child: const Icon(Icons.image_not_supported, size: 48),
        ),
      );
    }
    return Image.asset(urlOrAsset, fit: BoxFit.cover);
  }
}

/// Get ImageProvider from URL or asset path
ImageProvider eventImageProvider(String urlOrAsset) {
  if (urlOrAsset.startsWith('http')) return NetworkImage(urlOrAsset);
  return AssetImage(urlOrAsset);
}
