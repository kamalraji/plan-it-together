import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/profile_stats.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/theme.dart';
import '../widgets/profile_helper_widgets.dart';
import '../widgets/profile_stats_row.dart';

/// About tab content with scroll position preservation
class ProfileAboutTabContent extends StatefulWidget {
  final UserProfile? profile;
  final ProfileStats stats;
  final VoidCallback onLogout;

  const ProfileAboutTabContent({
    super.key,
    required this.profile,
    required this.stats,
    required this.onLogout,
  });

  @override
  State<ProfileAboutTabContent> createState() => _ProfileAboutTabContentState();
}

class _ProfileAboutTabContentState extends State<ProfileAboutTabContent>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  Widget _buildQuickLinksSection(BuildContext context) {
    return ProfileAboutSectionContainer(
      title: 'Quick Links',
      child: Column(
        children: [
          ProfileQuickLinkTile(
            icon: Icons.edit_outlined,
            label: 'Edit Profile',
            onTap: () {
              HapticFeedback.lightImpact();
              context.push(AppRoutes.editProfile);
            },
          ),
          ProfileQuickLinkTile(
            icon: Icons.settings_outlined,
            label: 'Settings',
            onTap: () {
              HapticFeedback.lightImpact();
              context.push(AppRoutes.settings);
            },
          ),
          ProfileQuickLinkTile(
            icon: Icons.qr_code,
            label: 'My QR Code',
            onTap: () {
              HapticFeedback.lightImpact();
              context.push(AppRoutes.qrCode);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildStatisticsSection() {
    return ProfileAboutSectionContainer(
      title: 'Statistics',
      child: Column(
        children: [
          ProfileStatDetailRow(label: 'Events Attended', value: widget.stats.eventsAttended.toString()),
          ProfileStatDetailRow(label: 'Upcoming Events', value: widget.stats.upcomingEvents.toString()),
          ProfileStatDetailRow(label: 'Followers', value: widget.stats.followersCount.toString()),
          ProfileStatDetailRow(label: 'Posts', value: widget.stats.postsCount.toString()),
          ProfileStatDetailRow(label: 'Current Streak', value: '${widget.stats.currentStreak} days'),
        ],
      ),
    );
  }

  Widget _buildLogoutButton() {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: widget.onLogout,
        icon: Icon(Icons.logout, color: AppColors.error),
        label: Text('Log Out', style: TextStyle(color: AppColors.error)),
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: AppColors.error.withValues(alpha: 0.5)),
          padding: const EdgeInsets.symmetric(vertical: 12),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin
    final isTablet = context.isTablet;
    
    // Two-column layout for tablets
    if (isTablet) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _buildQuickLinksSection(context)),
                const SizedBox(width: 24),
                Expanded(child: _buildStatisticsSection()),
              ],
            ),
            const SizedBox(height: 24),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: _buildLogoutButton(),
            ),
            const SizedBox(height: 32),
          ],
        ),
      );
    }
    
    // Single-column layout for phones
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildQuickLinksSection(context),
          const SizedBox(height: 16),
          _buildStatisticsSection(),
          const SizedBox(height: 24),
          _buildLogoutButton(),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}
