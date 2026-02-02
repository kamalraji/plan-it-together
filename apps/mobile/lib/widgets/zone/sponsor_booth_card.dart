import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/sponsor_booth.dart';
import 'package:thittam1hub/widgets/styled_card.dart';
import 'package:thittam1hub/widgets/styled_button.dart';
import 'package:thittam1hub/widgets/styled_chip.dart';
import 'package:url_launcher/url_launcher.dart';

/// Premium sponsor booth card with visit tracking
class SponsorBoothCard extends StatelessWidget {
  final SponsorBooth booth;
  final VoidCallback? onVisit;
  final bool isLoading;

  const SponsorBoothCard({
    super.key,
    required this.booth,
    this.onVisit,
    this.isLoading = false,
  });

  Color _getTierColor(BuildContext context) {
    switch (booth.tier.toLowerCase()) {
      case 'platinum':
        return const Color(0xFFE5E4E2);
      case 'gold':
        return const Color(0xFFFFD700);
      case 'silver':
        return const Color(0xFFC0C0C0);
      case 'bronze':
        return const Color(0xFFCD7F32);
      default:
        return Theme.of(context).colorScheme.outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final tierColor = _getTierColor(context);

    return StyledCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header with tier badge
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  tierColor.withOpacity(0.2),
                  tierColor.withOpacity(0.05),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                // Logo
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: cs.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: tierColor, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: tierColor.withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: booth.sponsorLogo != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: Image.network(
                            booth.sponsorLogo!,
                            fit: BoxFit.contain,
                            errorBuilder: (_, __, ___) => _buildLogoPlaceholder(cs),
                          ),
                        )
                      : _buildLogoPlaceholder(cs),
                ),
                const SizedBox(width: 12),
                // Name and tier
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        booth.sponsorName,
                        style: tt.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                        StyledChip(
                          label: booth.tier.toUpperCase(),
                          color: tierColor,
                          variant: ChipVariant.secondary,
                          size: ChipSize.small,
                        ),
                          if (booth.boothNumber != null) ...[
                            const SizedBox(width: 8),
                            Text(
                              'Booth ${booth.boothNumber}',
                              style: tt.bodySmall?.copyWith(
                                color: cs.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                // Visited badge
                if (booth.hasVisited)
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: cs.primaryContainer,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.check_rounded,
                      size: 20,
                      color: cs.primary,
                    ),
                  ),
              ],
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Description
                if (booth.description != null) ...[
                  Text(
                    booth.description!,
                    style: tt.bodyMedium?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 12),
                ],
                // Offerings
                if (booth.offerings.isNotEmpty) ...[
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: booth.offerings.take(3).map((offering) {
                      return StyledChip(
                        label: offering,
                        color: cs.secondary,
                        variant: ChipVariant.secondary,
                        size: ChipSize.small,
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                ],
                // Location
                if (booth.location != null)
                  Row(
                    children: [
                      Icon(
                        Icons.location_on_outlined,
                        size: 16,
                        color: cs.onSurfaceVariant,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        booth.location!,
                        style: tt.bodySmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                const SizedBox(height: 16),
                // Actions
                Row(
                  children: [
                    Expanded(
                      child: StyledButton(
                        onPressed: booth.hasVisited ? null : () {
                          HapticFeedback.mediumImpact();
                          onVisit?.call();
                        },
                        isLoading: isLoading,
                        label: booth.hasVisited ? 'Visited ✓' : 'Visit Booth',
                        icon: booth.hasVisited 
                            ? Icons.check_circle_rounded 
                            : Icons.storefront_rounded,
                        variant: booth.hasVisited 
                            ? StyledButtonVariant.secondary 
                            : StyledButtonVariant.primary,
                      ),
                    ),
                    if (booth.website != null) ...[
                      const SizedBox(width: 8),
                      IconButton(
                        onPressed: () async {
                          final uri = Uri.parse(booth.website!);
                          if (await canLaunchUrl(uri)) {
                            await launchUrl(uri, mode: LaunchMode.externalApplication);
                          }
                        },
                        icon: const Icon(Icons.open_in_new_rounded),
                        tooltip: 'Visit Website',
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLogoPlaceholder(ColorScheme cs) {
    return Center(
      child: Icon(
        Icons.business_rounded,
        size: 28,
        color: cs.onSurfaceVariant,
      ),
    );
  }
}
