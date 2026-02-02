import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/profile_post.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/utils/animations.dart' show FadeSlideTransition, staggerDelay;
import '../widgets/profile_helper_widgets.dart';

/// Posts grid tab content with scroll position preservation
/// Enhanced with tablet responsiveness and staggered animations
class ProfilePostsTabContent extends StatefulWidget {
  final List<ProfilePost> posts;

  const ProfilePostsTabContent({super.key, required this.posts});

  @override
  State<ProfilePostsTabContent> createState() => _ProfilePostsTabContentState();
}

class _ProfilePostsTabContentState extends State<ProfilePostsTabContent>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin
    final cs = Theme.of(context).colorScheme;
    final isTablet = MediaQuery.of(context).size.width >= 600;

    if (widget.posts.isEmpty) {
      return const ProfileEmptyTabContent(
        icon: Icons.grid_view_outlined,
        title: 'No posts yet',
        subtitle: 'Share your first spark to get started',
      );
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: isTablet ? 4 : 3, // 4 columns on tablet, 3 on phone
          mainAxisSpacing: 4,
          crossAxisSpacing: 4,
        ),
        itemCount: widget.posts.length,
        itemBuilder: (context, index) {
          final post = widget.posts[index];
          final previewText = post.content.substring(0, post.content.length.clamp(0, 50));
          return FadeSlideTransition(
            delay: staggerDelay(index, baseDelay: 30),
            child: Semantics(
              button: true,
              label: 'Post ${index + 1}: $previewText',
              child: Material(
                color: cs.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(8),
                child: InkWell(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    context.push(AppRoutes.postDetail(post.id));
                  },
                  borderRadius: BorderRadius.circular(8),
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.all(8),
                      child: Text(
                        previewText,
                        textAlign: TextAlign.center,
                        style: context.textStyles.labelSmall,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
