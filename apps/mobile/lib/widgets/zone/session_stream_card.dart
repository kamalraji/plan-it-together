/// Session Stream Card
/// 
/// Premium card displayed in the Zone Schedule section when a session has 
/// an active live stream. Features:
/// - Thumbnail with live indicator
/// - Session title and speaker info
/// - Viewer count
/// - Watch Now CTA button

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/live_stream.dart';
import 'package:thittam1hub/models/zone_models.dart';
import 'package:thittam1hub/widgets/zone/youtube_live_player.dart';
import 'package:cached_network_image/cached_network_image.dart';

class SessionStreamCard extends StatelessWidget {
  final EventSession session;
  final LiveStream stream;
  final VoidCallback? onWatchTap;
  final bool compact;

  const SessionStreamCard({
    super.key,
    required this.session,
    required this.stream,
    this.onWatchTap,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    if (compact) {
      return _buildCompactCard(context, cs, tt);
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: stream.isLive 
            ? Colors.red.withOpacity(0.3) 
            : cs.outlineVariant.withOpacity(0.5),
          width: stream.isLive ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: stream.isLive 
              ? Colors.red.withOpacity(0.1) 
              : cs.shadow.withOpacity(0.08),
            blurRadius: stream.isLive ? 16 : 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            onWatchTap?.call();
          },
          borderRadius: BorderRadius.circular(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Thumbnail section
              _buildThumbnail(cs),

              // Info section
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Session title
                    Text(
                      session.title,
                      style: tt.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        height: 1.2,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),

                    const SizedBox(height: 8),

                    // Speaker info
                    if (session.speakerName != null) ...[
                      Row(
                        children: [
                          // Speaker avatar
                          CircleAvatar(
                            radius: 14,
                            backgroundColor: cs.primaryContainer,
                            backgroundImage: session.speakerAvatar != null
                              ? CachedNetworkImageProvider(session.speakerAvatar!)
                              : null,
                            child: session.speakerAvatar == null
                              ? Text(
                                  session.speakerName![0].toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: cs.onPrimaryContainer,
                                    fontWeight: FontWeight.w600,
                                  ),
                                )
                              : null,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              session.speakerName!,
                              style: tt.bodyMedium?.copyWith(
                                color: cs.onSurfaceVariant,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                    ],

                    // Bottom row: Room + Watch button
                    Row(
                      children: [
                        // Room/Location
                        if (session.room != null) ...[
                          Icon(
                            Icons.meeting_room_rounded,
                            size: 16,
                            color: cs.onSurfaceVariant,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            session.room!,
                            style: tt.bodySmall?.copyWith(
                              color: cs.onSurfaceVariant,
                            ),
                          ),
                        ],
                        const Spacer(),

                        // Watch Now button
                        _buildWatchButton(cs),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildThumbnail(ColorScheme cs) {
    return Stack(
      children: [
        // Thumbnail
        ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
          child: AspectRatio(
            aspectRatio: 16 / 9,
            child: CachedNetworkImage(
              imageUrl: stream.thumbnailUrl,
              fit: BoxFit.cover,
              placeholder: (_, __) => Container(
                color: cs.surfaceContainerHighest,
                child: Center(
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: cs.primary,
                  ),
                ),
              ),
              errorWidget: (_, __, ___) => Container(
                color: cs.surfaceContainerHighest,
                child: Icon(
                  Icons.live_tv_rounded,
                  size: 48,
                  color: cs.onSurfaceVariant,
                ),
              ),
            ),
          ),
        ),

        // Gradient overlay
        Positioned.fill(
          child: ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withOpacity(0.5),
                  ],
                  stops: const [0.5, 1.0],
                ),
              ),
            ),
          ),
        ),

        // Live badge
        Positioned(
          top: 12,
          left: 12,
          child: _buildLiveBadge(cs),
        ),

        // Viewer count
        if (stream.viewerCount > 0)
          Positioned(
            top: 12,
            right: 12,
            child: _buildViewerCount(cs),
          ),

        // Play button overlay
        Positioned.fill(
          child: Center(
            child: Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.9),
                borderRadius: BorderRadius.circular(32),
                boxShadow: [
                  BoxShadow(
                    color: Colors.red.withOpacity(0.4),
                    blurRadius: 16,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: const Icon(
                Icons.play_arrow_rounded,
                color: Colors.white,
                size: 36,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLiveBadge(ColorScheme cs) {
    final isLive = stream.isLive;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: isLive ? Colors.red : cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(20),
        boxShadow: isLive ? [
          BoxShadow(
            color: Colors.red.withOpacity(0.4),
            blurRadius: 8,
            spreadRadius: 1,
          ),
        ] : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isLive)
            Container(
              width: 6,
              height: 6,
              margin: const EdgeInsets.only(right: 6),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
            ),
          Text(
            isLive ? 'LIVE' : stream.status.value.toUpperCase(),
            style: TextStyle(
              color: isLive ? Colors.white : cs.onSurfaceVariant,
              fontSize: 11,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildViewerCount(ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.6),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.visibility_rounded,
            size: 14,
            color: Colors.white,
          ),
          const SizedBox(width: 4),
          Text(
            stream.formattedViewerCount,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWatchButton(ColorScheme cs) {
    final isLive = stream.isLive;

    return FilledButton.icon(
      onPressed: () {
        HapticFeedback.mediumImpact();
        onWatchTap?.call();
      },
      icon: Icon(
        isLive ? Icons.live_tv_rounded : Icons.play_arrow_rounded,
        size: 18,
      ),
      label: Text(isLive ? 'Watch Live' : 'Watch'),
      style: FilledButton.styleFrom(
        backgroundColor: isLive ? Colors.red : cs.primary,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
      ),
    );
  }

  Widget _buildCompactCard(BuildContext context, ColorScheme cs, TextTheme tt) {
    return Container(
      height: 80,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: stream.isLive 
            ? Colors.red.withOpacity(0.3) 
            : cs.outlineVariant.withOpacity(0.3),
          width: stream.isLive ? 1.5 : 1,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            onWatchTap?.call();
          },
          borderRadius: BorderRadius.circular(12),
          child: Row(
            children: [
              // Thumbnail
              ClipRRect(
                borderRadius: const BorderRadius.horizontal(left: Radius.circular(11)),
                child: SizedBox(
                  width: 120,
                  height: 80,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      CachedNetworkImage(
                        imageUrl: stream.thumbnailMediumUrl,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => Container(
                          color: cs.surfaceContainerHighest,
                          child: Icon(
                            Icons.live_tv_rounded,
                            color: cs.onSurfaceVariant,
                          ),
                        ),
                      ),
                      // Live indicator
                      if (stream.isLive)
                        Positioned(
                          top: 6,
                          left: 6,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.red,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'LIVE',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),

              // Info
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        session.title,
                        style: tt.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      if (session.speakerName != null)
                        Text(
                          session.speakerName!,
                          style: tt.bodySmall?.copyWith(
                            color: cs.onSurfaceVariant,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      if (stream.viewerCount > 0) ...[
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              Icons.visibility_rounded,
                              size: 12,
                              color: cs.onSurfaceVariant,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${stream.formattedViewerCount} watching',
                              style: tt.bodySmall?.copyWith(
                                color: cs.onSurfaceVariant,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              // Play icon
              Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Icon(
                  Icons.play_circle_filled_rounded,
                  size: 36,
                  color: stream.isLive ? Colors.red : cs.primary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
