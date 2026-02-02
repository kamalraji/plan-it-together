import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:thittam1hub/models/circle.dart';
import 'package:thittam1hub/pages/impact/circle_detail_controller.dart';
import 'package:thittam1hub/pages/impact/circle_chat_page.dart';
import 'package:thittam1hub/pages/impact/circle_members_page.dart';
import 'package:thittam1hub/pages/impact/widgets/circle_invite_sheet.dart';
import 'package:thittam1hub/widgets/circle/circle_shimmer.dart';
import 'package:thittam1hub/widgets/animated_stat_card.dart';
import 'package:thittam1hub/widgets/avatar_stack.dart';
import 'package:thittam1hub/widgets/styled_avatar.dart';
import 'package:thittam1hub/widgets/settings_components.dart';
import 'package:thittam1hub/theme.dart';

/// Premium Circle detail page with parallax header and animated stats
/// Follows the GroupSettingsPage industrial pattern
class CircleDetailPage extends StatefulWidget {
  final String circleId;
  final Circle? circle;

  const CircleDetailPage({
    super.key,
    required this.circleId,
    this.circle,
  });

  @override
  State<CircleDetailPage> createState() => _CircleDetailPageState();
}

class _CircleDetailPageState extends State<CircleDetailPage>
    with TickerProviderStateMixin {
  late CircleDetailController _controller;
  final ScrollController _scrollController = ScrollController();

  // Animation controllers
  late AnimationController _fadeController;
  late AnimationController _headerController;
  late Animation<double> _fadeAnimation;
  late Animation<double> _headerScale;

  @override
  void initState() {
    super.initState();
    
    // Initialize animations
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );
    _headerController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );
    _headerScale = CurvedAnimation(
      parent: _headerController,
      curve: Curves.elasticOut,
    );

    // Initialize controller
    _controller = CircleDetailController(
      circleId: widget.circleId,
      initialCircle: widget.circle,
    );
    _controller.addListener(_onControllerChange);
  }

  void _onControllerChange() {
    if (mounted) {
      setState(() {});
      // Trigger animations when data loads
      if (!_controller.isLoading && _controller.circle != null) {
        _fadeController.forward();
        _headerController.forward();
      }
    }
  }

  @override
  void dispose() {
    _controller.removeListener(_onControllerChange);
    _controller.dispose();
    _scrollController.dispose();
    _fadeController.dispose();
    _headerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (_controller.isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Circle')),
        body: const CircleDetailShimmer(),
      );
    }

    if (_controller.error != null || _controller.circle == null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: cs.error),
              const SizedBox(height: AppSpacing.md),
              Text(
                _controller.error ?? 'Circle not found',
                style: context.textStyles.titleMedium,
              ),
              const SizedBox(height: AppSpacing.lg),
              FilledButton.icon(
                onPressed: _controller.loadData,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: NestedScrollView(
          controller: _scrollController,
          headerSliverBuilder: (context, innerBoxIsScrolled) => [
            _buildParallaxHeader(cs, innerBoxIsScrolled),
          ],
          body: CustomScrollView(
            slivers: [
              // Animated Stats Row
              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: context.horizontalPadding,
                    vertical: AppSpacing.md,
                  ),
                  child: _buildQuickStats(cs),
                ),
              ),

              // Quick Actions
              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: context.horizontalPadding,
                  ),
                  child: _buildQuickActions(),
                ),
              ),

              // Settings Sections
              SliverPadding(
                padding: EdgeInsets.symmetric(
                  horizontal: context.horizontalPadding,
                ),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    const SizedBox(height: AppSpacing.lg),

                    // About Section
                    _buildAboutSection(),
                    const SizedBox(height: AppSpacing.md),

                    // Members Preview Section
                    _buildMembersSection(cs),
                    const SizedBox(height: AppSpacing.md),

                    // Admin Controls (Admin/Mod only)
                    if (_controller.isAdmin || _controller.isModerator) ...[
                      _buildAdminSection(),
                      const SizedBox(height: AppSpacing.md),
                    ],

                    // Notification Settings (Members only)
                    if (_controller.isMember) ...[
                      _buildNotificationSection(),
                      const SizedBox(height: AppSpacing.md),
                    ],

                    // Danger Zone (Members only)
                    if (_controller.isMember)
                      _buildDangerZone(),
                    
                    const SizedBox(height: AppSpacing.xxl),
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Parallax header with blurred background and hero animation
  Widget _buildParallaxHeader(ColorScheme cs, bool innerBoxIsScrolled) {
    final circle = _controller.circle!;

    return SliverAppBar(
      expandedHeight: 280,
      floating: false,
      pinned: true,
      stretch: true,
      backgroundColor: cs.surface,
      surfaceTintColor: Colors.transparent,
      leading: IconButton(
        icon: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: cs.surface.withOpacity(0.8),
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.arrow_back, color: cs.onSurface, size: 20),
        ),
        onPressed: () => Navigator.pop(context),
      ),
      actions: [
        if (_controller.isMember)
          IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: cs.surface.withOpacity(0.8),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.chat_bubble_outline, color: cs.onSurface, size: 20),
            ),
            onPressed: () => _navigateToChat(circle),
            tooltip: 'Open Chat',
          ),
        IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: cs.surface.withOpacity(0.8),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.more_vert, color: cs.onSurface, size: 20),
          ),
          onPressed: () => _showOptionsMenu(),
        ),
        const SizedBox(width: 8),
      ],
      flexibleSpace: FlexibleSpaceBar(
        stretchModes: const [
          StretchMode.zoomBackground,
          StretchMode.blurBackground,
        ],
        background: Stack(
          fit: StackFit.expand,
          children: [
            // Gradient background
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    cs.primary.withOpacity(0.2),
                    cs.secondary.withOpacity(0.15),
                    cs.surface,
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
            
            // Blur effect
            BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
              child: Container(color: Colors.transparent),
            ),

            // Gradient overlay for text readability
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.transparent,
                    cs.surface.withOpacity(0.5),
                    cs.surface,
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  stops: const [0.0, 0.6, 1.0],
                ),
              ),
            ),

            // Content
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.only(top: 56),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Hero circle icon
                    ScaleTransition(
                      scale: _headerScale,
                      child: Hero(
                        tag: 'circle_icon_${widget.circleId}',
                        child: _buildCircleIconWithBadge(cs, circle),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),

                    // Circle name
                    Text(
                      circle.name,
                      style: context.textStyles.headlineMedium?.bold,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),

                    // Description preview
                    if (circle.description != null && circle.description!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Text(
                          circle.description!,
                          style: context.textStyles.bodyMedium?.withColor(cs.onSurfaceVariant),
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],

                    const SizedBox(height: AppSpacing.sm),

                    // Member count and privacy badge
                    _buildInfoBadge(cs, circle),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCircleIconWithBadge(ColorScheme cs, Circle circle) {
    return Stack(
      children: [
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            color: cs.primary.withOpacity(0.15),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(
              color: cs.surface,
              width: 4,
            ),
            boxShadow: [
              BoxShadow(
                color: cs.shadow.withOpacity(0.2),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Center(
            child: Text(
              circle.icon,
              style: const TextStyle(fontSize: 48),
            ),
          ),
        ),
        // Privacy indicator
        Positioned(
          right: 0,
          bottom: 0,
          child: Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: circle.isPrivate ? cs.tertiary : AppColors.emerald500,
              shape: BoxShape.circle,
              border: Border.all(color: cs.surface, width: 3),
            ),
            child: Icon(
              circle.isPrivate ? Icons.lock : Icons.public,
              size: 14,
              color: Colors.white,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoBadge(ColorScheme cs, Circle circle) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(0.9),
        borderRadius: BorderRadius.circular(AppRadius.xl),
        boxShadow: [
          BoxShadow(
            color: cs.shadow.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.people, size: 16, color: cs.primary),
          const SizedBox(width: 6),
          Text(
            '${circle.memberCount} ${circle.memberCount == 1 ? 'member' : 'members'}',
            style: context.textStyles.labelMedium?.semiBold.withColor(cs.onSurface),
          ),
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 8),
            width: 4,
            height: 4,
            decoration: BoxDecoration(
              color: cs.onSurfaceVariant,
              shape: BoxShape.circle,
            ),
          ),
          Icon(
            circle.isPrivate ? Icons.lock : Icons.public,
            size: 14,
            color: circle.isPrivate ? cs.tertiary : AppColors.emerald500,
          ),
          const SizedBox(width: 4),
          Text(
            circle.isPrivate ? 'Private' : 'Public',
            style: context.textStyles.labelSmall?.withColor(
              circle.isPrivate ? cs.tertiary : AppColors.emerald500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickStats(ColorScheme cs) {
    return AnimatedStatsRow(
      animate: true,
      stats: [
        StatData(
          icon: Icons.people_rounded,
          label: 'Members',
          value: _controller.circle?.memberCount ?? 0,
          color: cs.primary,
          onTap: () {
            HapticFeedback.lightImpact();
            _navigateToMembers(_controller.circle!);
          },
        ),
        StatData(
          icon: Icons.message_rounded,
          label: 'Messages',
          value: _controller.messageCount,
          color: AppColors.violet500,
          onTap: () {
            HapticFeedback.lightImpact();
            if (_controller.isMember) {
              _navigateToChat(_controller.circle!);
            }
          },
        ),
        StatData(
          icon: Icons.calendar_today_rounded,
          label: 'Days Active',
          value: _controller.daysActive,
          color: AppColors.teal500,
          onTap: () => HapticFeedback.lightImpact(),
        ),
      ],
    );
  }

  Widget _buildQuickActions() {
    final cs = Theme.of(context).colorScheme;

    return Row(
      children: [
        Expanded(
          child: FilledButton.icon(
            onPressed: _controller.isMember
                ? () => _navigateToChat(_controller.circle!)
                : () => _handleJoin(),
            icon: Icon(_controller.isMember ? Icons.chat : Icons.add),
            label: Text(_controller.isMember ? 'Open Chat' : 'Join Circle'),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ),
        const SizedBox(width: AppSpacing.md),
        OutlinedButton(
          onPressed: _shareCircle,
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.all(14),
          ),
          child: const Icon(Icons.share),
        ),
        if (_controller.isAdmin || _controller.isModerator) ...[
          const SizedBox(width: AppSpacing.sm),
          OutlinedButton(
            onPressed: _showInviteSheet,
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.all(14),
            ),
            child: const Icon(Icons.person_add),
          ),
        ],
      ],
    );
  }

  Widget _buildAboutSection() {
    final circle = _controller.circle!;
    final cs = Theme.of(context).colorScheme;

    return SettingsSection(
      title: 'About',
      icon: Icons.info_outline,
      iconColor: cs.primary,
      children: [
        if (circle.description != null && circle.description!.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.md),
            child: Text(
              circle.description!,
              style: context.textStyles.bodyMedium,
            ),
          ),
        
        // Category
        _buildInfoRow(
          icon: Icons.category_outlined,
          label: 'Category',
          value: circle.category,
        ),
        
        // Type
        _buildInfoRow(
          icon: Icons.type_specimen_outlined,
          label: 'Type',
          value: circle.type,
        ),
        
        // Created date
        _buildInfoRow(
          icon: Icons.calendar_month_outlined,
          label: 'Created',
          value: _formatDate(circle.createdAt),
        ),

        // Tags
        if (circle.tags.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: circle.tags.map((tag) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: cs.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '#$tag',
                  style: TextStyle(
                    color: cs.primary,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ],
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    final cs = Theme.of(context).colorScheme;
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Row(
        children: [
          Icon(icon, size: 18, color: cs.onSurfaceVariant),
          const SizedBox(width: AppSpacing.sm),
          Text(
            label,
            style: context.textStyles.bodyMedium?.withColor(cs.onSurfaceVariant),
          ),
          const Spacer(),
          Text(
            value,
            style: context.textStyles.bodyMedium?.semiBold,
          ),
        ],
      ),
    );
  }

  Widget _buildMembersSection(ColorScheme cs) {
    final circle = _controller.circle!;
    final members = _controller.members;

    // Convert members to AvatarData
    final avatarData = members.take(5).map((m) => AvatarData(
      name: m.userId.substring(0, 2),
      userId: m.userId,
    )).toList();

    return SettingsSection(
      title: 'Members',
      icon: Icons.people_outline,
      iconColor: AppColors.blue500,
      trailing: TextButton(
        onPressed: () => _navigateToMembers(circle),
        child: Text('See All (${circle.memberCount})'),
      ),
      children: [
        if (members.isEmpty)
          Text(
            'No members yet',
            style: context.textStyles.bodyMedium?.withColor(cs.onSurfaceVariant),
          )
        else
          Row(
            children: [
              AvatarStack(
                avatars: avatarData,
                maxDisplay: 5,
                avatarSize: 40,
                onTap: () => _navigateToMembers(circle),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Text(
                  '${circle.memberCount} members',
                  style: context.textStyles.bodyMedium?.withColor(cs.onSurfaceVariant),
                ),
              ),
              Icon(Icons.chevron_right, color: cs.onSurfaceVariant),
            ],
          ),
      ],
    );
  }

  Widget _buildAdminSection() {
    final cs = Theme.of(context).colorScheme;

    return SettingsSection(
      title: 'Admin',
      icon: Icons.admin_panel_settings_outlined,
      iconColor: AppColors.amber500,
      children: [
        SettingsAction(
          icon: Icons.person_add_outlined,
          label: 'Invite Members',
          subtitle: 'Generate invite link or invite directly',
          showChevron: true,
          onTap: _showInviteSheet,
        ),
        SettingsAction(
          icon: Icons.link,
          label: 'Invite Link',
          subtitle: _controller.inviteLink?.displayCode ?? 'Generate link',
          trailing: _controller.inviteLink != null
              ? IconButton(
                  icon: const Icon(Icons.copy),
                  onPressed: _copyInviteLink,
                )
              : null,
          showChevron: _controller.inviteLink == null,
          onTap: _showInviteSheet,
        ),
        if (_controller.pendingInvitations.isNotEmpty)
          SettingsAction(
            icon: Icons.pending_outlined,
            iconColor: AppColors.orange500,
            label: 'Pending Invitations',
            subtitle: '${_controller.pendingInvitations.length} pending',
            showChevron: true,
            onTap: _showPendingInvitations,
          ),
        if (_controller.isAdmin)
          SettingsAction(
            icon: Icons.edit_outlined,
            label: 'Edit Circle',
            subtitle: 'Update name, description, and settings',
            showChevron: true,
            onTap: _editCircle,
          ),
      ],
    );
  }

  Widget _buildNotificationSection() {
    final isMuted = _controller.currentMembership?.isMuted ?? false;

    return SettingsSection(
      title: 'Notifications',
      icon: Icons.notifications_outlined,
      iconColor: AppColors.pink500,
      children: [
        SettingsToggle(
          icon: isMuted ? Icons.notifications_off : Icons.notifications_active,
          label: isMuted ? 'Unmute Notifications' : 'Mute Notifications',
          subtitle: isMuted ? 'Currently muted' : 'Receive message notifications',
          value: !isMuted,
          onChanged: (_) => _controller.toggleMute(),
        ),
      ],
    );
  }

  Widget _buildDangerZone() {
    return SettingsSection(
      title: 'Danger Zone',
      icon: Icons.warning_amber_rounded,
      iconColor: AppColors.error,
      children: [
        SettingsAction(
          icon: Icons.exit_to_app,
          iconColor: AppColors.orange500,
          label: 'Leave Circle',
          subtitle: 'You can rejoin later if the circle is public',
          showChevron: true,
          onTap: _confirmLeave,
        ),
        if (_controller.isAdmin)
          SettingsAction(
            icon: Icons.delete_forever,
            label: 'Delete Circle',
            subtitle: 'This action cannot be undone',
            isDestructive: true,
            showChevron: true,
            onTap: _confirmDelete,
          ),
      ],
    );
  }

  // ===== ACTIONS =====

  void _showOptionsMenu() {
    final cs = Theme.of(context).colorScheme;
    
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.symmetric(vertical: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: cs.outline,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            if (_controller.isAdmin || _controller.isModerator)
              ListTile(
                leading: const Icon(Icons.person_add_outlined),
                title: const Text('Invite Members'),
                onTap: () {
                  Navigator.pop(context);
                  _showInviteSheet();
                },
              ),
            if (_controller.isAdmin)
              ListTile(
                leading: const Icon(Icons.edit_outlined),
                title: const Text('Edit Circle'),
                onTap: () {
                  Navigator.pop(context);
                  _editCircle();
                },
              ),
            ListTile(
              leading: const Icon(Icons.share_outlined),
              title: const Text('Share'),
              onTap: () {
                Navigator.pop(context);
                _shareCircle();
              },
            ),
            if (_controller.isMember) ...[
              const Divider(),
              ListTile(
                leading: Icon(
                  _controller.currentMembership?.isMuted == true
                      ? Icons.notifications_active
                      : Icons.notifications_off_outlined,
                ),
                title: Text(
                  _controller.currentMembership?.isMuted == true
                      ? 'Unmute'
                      : 'Mute',
                ),
                onTap: () {
                  Navigator.pop(context);
                  _controller.toggleMute();
                },
              ),
            ],
            if (_controller.isAdmin) ...[
              const Divider(),
              ListTile(
                leading: Icon(Icons.delete_outline, color: AppColors.error),
                title: Text('Delete Circle', style: TextStyle(color: AppColors.error)),
                onTap: () {
                  Navigator.pop(context);
                  _confirmDelete();
                },
              ),
            ],
            const SizedBox(height: AppSpacing.md),
          ],
        ),
      ),
    );
  }

  Future<void> _handleJoin() async {
    final result = await _controller.joinCircle();
    if (!mounted) return;

    if (result.isSuccess) {
      HapticFeedback.mediumImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Joined circle!')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result.errorMessage ?? 'Failed to join')),
      );
    }
  }

  void _navigateToChat(Circle circle) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => CircleChatPage(circleId: circle.id, circle: circle),
      ),
    );
  }

  void _navigateToMembers(Circle circle) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => CircleMembersPage(
          circleId: circle.id,
          circle: circle,
        ),
      ),
    );
  }

  void _showInviteSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => CircleInviteSheet(
        circleId: widget.circleId,
        circle: _controller.circle,
        inviteLink: _controller.inviteLink,
        onInviteLinkGenerated: (link) {
          setState(() {});
        },
      ),
    );
  }

  void _copyInviteLink() {
    if (_controller.inviteLink == null) {
      _showInviteSheet();
      return;
    }

    Clipboard.setData(ClipboardData(text: _controller.inviteLink!.fullUrl));
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Invite link copied!')),
    );
  }

  void _shareCircle() {
    final circle = _controller.circle;
    if (circle == null) return;

    final link = _controller.inviteLink?.fullUrl ?? 'https://thittam1hub.app/circles/${circle.id}';
    Share.share(
      'Join "${circle.name}" on Thittam1Hub!\n\n$link',
      subject: 'Join ${circle.name}',
    );
  }

  void _showPendingInvitations() {
    // TODO: Show pending invitations sheet
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Pending invitations coming soon')),
    );
  }

  void _editCircle() {
    // TODO: Navigate to edit circle page
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Edit circle coming soon')),
    );
  }

  Future<void> _confirmLeave() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Leave Circle?'),
        content: const Text('Are you sure you want to leave this circle?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Leave'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final result = await _controller.leaveCircle();
      if (!mounted) return;

      if (result.isSuccess) {
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.errorMessage ?? 'Failed to leave')),
        );
      }
    }
  }

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Circle?'),
        content: const Text(
          'This will permanently delete the circle and all its messages. This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final result = await _controller.deleteCircle();
      if (!mounted) return;

      if (result.isSuccess) {
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.errorMessage ?? 'Failed to delete')),
        );
      }
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    
    if (diff.inDays == 0) {
      return 'Today';
    } else if (diff.inDays == 1) {
      return 'Yesterday';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} days ago';
    } else if (diff.inDays < 30) {
      final weeks = (diff.inDays / 7).floor();
      return '$weeks ${weeks == 1 ? 'week' : 'weeks'} ago';
    } else if (diff.inDays < 365) {
      final months = (diff.inDays / 30).floor();
      return '$months ${months == 1 ? 'month' : 'months'} ago';
    } else {
      final years = (diff.inDays / 365).floor();
      return '$years ${years == 1 ? 'year' : 'years'} ago';
    }
  }
}
