import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/theme.dart';
import 'package:url_launcher/url_launcher.dart';

/// Location card with map preview and quick actions
class EventLocationCard extends StatelessWidget {
  final String? venueName;
  final String? address;
  final String? city;
  final double? latitude;
  final double? longitude;
  final bool isOnline;
  final String? meetingUrl;

  const EventLocationCard({
    super.key,
    this.venueName,
    this.address,
    this.city,
    this.latitude,
    this.longitude,
    this.isOnline = false,
    this.meetingUrl,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    if (isOnline) {
      return _buildOnlineCard(context, cs, text);
    }

    return _buildPhysicalCard(context, cs, text);
  }

  Widget _buildOnlineCard(BuildContext context, ColorScheme cs, TextTheme text) {
    return Semantics(
      label: 'Online event. Join from anywhere.${meetingUrl != null ? ' Tap to join meeting.' : ''}',
      child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.blue.withValues(alpha: 0.1),
            Colors.blue.withValues(alpha: 0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: Colors.blue.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.blue.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.videocam_rounded, color: Colors.blue, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Online Event',
                      style: text.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Join from anywhere',
                      style: text.bodySmall?.copyWith(color: AppColors.textMuted),
                    ),
                  ],
                ),
              ),
              if (meetingUrl != null)
                FilledButton.icon(
                  onPressed: () => _launchMeetingUrl(context),
                  icon: const Icon(Icons.open_in_new, size: 16),
                  label: const Text('Join'),
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.blue,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  ),
                ),
            ],
          ),
        ],
      ),
    ),
    );
  }

  Widget _buildPhysicalCard(BuildContext context, ColorScheme cs, TextTheme text) {
    final hasLocation = latitude != null && longitude != null;
    final displayAddress = [venueName, address, city]
        .where((s) => s != null && s.isNotEmpty)
        .join(', ');

    if (displayAddress.isEmpty) return const SizedBox.shrink();

    return Semantics(
      label: 'Event location: $displayAddress. Tap to open in maps.',
      child: Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: cs.outline),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Map preview placeholder
          if (hasLocation)
            GestureDetector(
              onTap: () => _openMaps(context),
              child: Container(
                height: 120,
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      cs.primary.withValues(alpha: 0.1),
                      cs.secondary.withValues(alpha: 0.05),
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: Stack(
                  children: [
                    // Grid pattern for map-like appearance
                    CustomPaint(
                      painter: _MapPatternPainter(cs.outline.withValues(alpha: 0.3)),
                      size: const Size(double.infinity, 120),
                    ),
                    // Pin marker
                    Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: cs.primary,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: cs.primary.withValues(alpha: 0.3),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: const Icon(Icons.place, color: Colors.white, size: 24),
                          ),
                          Container(
                            width: 3,
                            height: 12,
                            decoration: BoxDecoration(
                              color: cs.primary,
                              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(2)),
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Tap to open label
                    Positioned(
                      bottom: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: cs.surface.withValues(alpha: 0.9),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.open_in_new, size: 12, color: cs.primary),
                            const SizedBox(width: 4),
                            Text(
                              'Open in Maps',
                              style: text.labelSmall?.copyWith(
                                color: cs.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          // Location details
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.location_on, color: AppColors.success, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (venueName != null && venueName!.isNotEmpty)
                        Text(
                          venueName!,
                          style: text.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                        ),
                      if (address != null && address!.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          address!,
                          style: text.bodyMedium?.copyWith(color: AppColors.textMuted),
                        ),
                      ],
                      if (city != null && city!.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          city!,
                          style: text.bodySmall?.copyWith(color: AppColors.textMuted),
                        ),
                      ],
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.copy, size: 20),
                  color: AppColors.textMuted,
                  onPressed: () => _copyAddress(context, displayAddress),
                  tooltip: 'Copy address',
                ),
              ],
            ),
          ),
        ],
      ),
    ),
    );
  }

  void _openMaps(BuildContext context) async {
    HapticFeedback.lightImpact();
    if (latitude == null || longitude == null) return;

    final url = Uri.parse(
      'https://www.google.com/maps/search/?api=1&query=$latitude,$longitude',
    );
    
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  void _copyAddress(BuildContext context, String address) {
    Clipboard.setData(ClipboardData(text: address));
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Address copied to clipboard'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _launchMeetingUrl(BuildContext context) async {
    if (meetingUrl == null) return;

    final url = Uri.parse(meetingUrl!);
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } else {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open meeting link')),
        );
      }
    }
  }
}

/// Custom painter for map-like grid pattern
class _MapPatternPainter extends CustomPainter {
  final Color lineColor;

  _MapPatternPainter(this.lineColor);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = lineColor
      ..strokeWidth = 1;

    // Horizontal lines
    for (double y = 0; y < size.height; y += 20) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }

    // Vertical lines
    for (double x = 0; x < size.width; x += 20) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
