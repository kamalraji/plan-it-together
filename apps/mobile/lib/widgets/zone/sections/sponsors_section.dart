import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:thittam1hub/models/sponsor_booth.dart';
import 'package:thittam1hub/services/zone_state_service.dart';
import 'package:thittam1hub/widgets/zone/sponsor_booth_card.dart';
import 'package:thittam1hub/widgets/zone/sections/zone_section_utils.dart';

/// Sponsors section displaying event sponsor booths
/// Groups sponsors by tier (Platinum, Gold, Silver, Bronze)
class SponsorsSection extends StatefulWidget {
  final String eventId;

  const SponsorsSection({super.key, required this.eventId});

  @override
  State<SponsorsSection> createState() => _SponsorsSectionState();
}

class _SponsorsSectionState extends State<SponsorsSection> {
  String? _visitingBoothId;

  @override
  void initState() {
    super.initState();
    // Trigger load if not already loaded
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final service = context.read<ZoneStateService>();
      if (service.sponsorBooths.isEmpty && !service.isLoadingSponsors) {
        service.loadSponsorBooths(widget.eventId);
      }
    });
  }

  Future<void> _visitBooth(ZoneStateService service, SponsorBooth booth) async {
    if (booth.hasVisited) return;

    setState(() => _visitingBoothId = booth.id);
    HapticFeedback.mediumImpact();

    final success = await service.visitBooth(booth.id, widget.eventId);
    
    if (success && mounted) {
      HapticFeedback.heavyImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Visited ${booth.sponsorName}! Points earned 🎉'),
          backgroundColor: Theme.of(context).colorScheme.primary,
        ),
      );
    }

    if (mounted) {
      setState(() => _visitingBoothId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Selector<ZoneStateService, ({
      bool loading,
      List<SponsorBooth> booths,
    })>(
      selector: (_, s) => (
        loading: s.isLoadingSponsors,
        booths: s.sponsorBooths,
      ),
      builder: (context, data, _) {
        if (data.loading && data.booths.isEmpty) {
          return const ZoneSectionLoading();
        }

        if (data.booths.isEmpty) {
          return const ZoneSectionEmpty(
            icon: Icons.storefront_rounded,
            title: 'No Sponsor Booths',
            subtitle: 'Sponsor booths will appear here during the event',
          );
        }

        // Group booths by tier
        final grouped = _groupByTier(data.booths);
        final service = context.read<ZoneStateService>();

        return RefreshIndicator(
          onRefresh: () => service.loadSponsorBooths(widget.eventId),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: grouped.length,
            itemBuilder: (context, index) {
              final tier = grouped.keys.elementAt(index);
              final booths = grouped[tier]!;
              return _buildTierSection(context, tier, booths, service);
            },
          ),
        );
      },
    );
  }

  Map<String, List<SponsorBooth>> _groupByTier(List<SponsorBooth> booths) {
    final grouped = <String, List<SponsorBooth>>{};
    final tierOrder = ['platinum', 'gold', 'silver', 'bronze'];
    
    for (final tier in tierOrder) {
      final tierBooths = booths.where((b) => b.tier.toLowerCase() == tier).toList();
      if (tierBooths.isNotEmpty) {
        grouped[tier] = tierBooths;
      }
    }
    
    // Add any booths with unknown tiers
    final otherBooths = booths.where((b) => !tierOrder.contains(b.tier.toLowerCase())).toList();
    if (otherBooths.isNotEmpty) {
      grouped['other'] = otherBooths;
    }
    
    return grouped;
  }

  Widget _buildTierSection(
    BuildContext context,
    String tier,
    List<SponsorBooth> booths,
    ZoneStateService service,
  ) {
    final tt = Theme.of(context).textTheme;
    final tierLabel = tier[0].toUpperCase() + tier.substring(1);
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Row(
            children: [
              _getTierIcon(tier),
              const SizedBox(width: 8),
              Text(
                '$tierLabel Sponsors',
                style: tt.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '(${booths.length})',
                style: tt.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        ...booths.map((booth) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: SponsorBoothCard(
            booth: booth,
            isLoading: _visitingBoothId == booth.id,
            onVisit: () => _visitBooth(service, booth),
          ),
        )),
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _getTierIcon(String tier) {
    final color = switch (tier.toLowerCase()) {
      'platinum' => const Color(0xFFE5E4E2),
      'gold' => const Color(0xFFFFD700),
      'silver' => const Color(0xFFC0C0C0),
      'bronze' => const Color(0xFFCD7F32),
      _ => Colors.grey,
    };
    
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        shape: BoxShape.circle,
      ),
      child: Icon(
        Icons.workspace_premium_rounded,
        size: 18,
        color: color.computeLuminance() > 0.5 ? Colors.black54 : color,
      ),
    );
  }
}
