import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/circle.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/supabase/circle_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';
import 'package:thittam1hub/widgets/zone/sections/zone_section_utils.dart';

/// Circles section for event-specific community groups
class CirclesSection extends StatefulWidget {
  final String eventId;

  const CirclesSection({super.key, required this.eventId});

  @override
  State<CirclesSection> createState() => _CirclesSectionState();
}

class _CirclesSectionState extends State<CirclesSection> {
  final CircleService _circleService = CircleService();
  List<Circle> _circles = [];
  Set<String> _joinedIds = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadCircles();
  }

  Future<void> _loadCircles() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _circleService.getCirclesByEvent(widget.eventId),
        _circleService.getUserCircles(),
      ]);
      if (mounted) {
        setState(() {
          _circles = results[0] as List<Circle>;
          _joinedIds = results[1] as Set<String>;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const ZoneSectionLoading();
    }

    if (_circles.isEmpty) {
      return const ZoneSectionEmpty(
        icon: Icons.group_work_rounded,
        title: 'No Event Circles',
        subtitle: 'Join circles to connect with attendees',
      );
    }

    return BrandedRefreshIndicator(
      onRefresh: _loadCircles,
      child: ListView.builder(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: context.bottomContentPadding,
        ),
        itemCount: _circles.length,
        itemBuilder: (context, index) {
          final circle = _circles[index];
          final isJoined = _joinedIds.contains(circle.id);
          
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _CircleCard(
              circle: circle,
              isJoined: isJoined,
              onTap: () => context.push(AppRoutes.circleDetail(circle.id), extra: circle),
            ),
          );
        },
      ),
    );
  }
}

class _CircleCard extends StatelessWidget {
  final Circle circle;
  final bool isJoined;
  final VoidCallback onTap;

  const _CircleCard({
    required this.circle,
    required this.isJoined,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: cs.outline.withOpacity(0.1)),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: cs.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(
                  circle.icon,
                  style: const TextStyle(fontSize: 24),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    circle.name,
                    style: textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (circle.description != null)
                    Text(
                      circle.description!,
                      style: textTheme.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                ],
              ),
            ),
            if (isJoined)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'Joined',
                  style: textTheme.labelSmall?.copyWith(
                    color: Colors.green,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
