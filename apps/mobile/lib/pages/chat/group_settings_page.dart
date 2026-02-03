import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import '../../nav.dart';
import '../../models/chat_group.dart';
import '../../models/group_stats.dart';
import '../../services/group_chat_service.dart';
import '../../services/group_icon_service.dart';
import '../../services/chat_service.dart';
import '../../widgets/styled_text_field.dart';
import '../../widgets/styled_button.dart';
import '../../widgets/styled_avatar.dart';
import '../../widgets/settings_components.dart';
import '../../widgets/role_badge.dart';
import '../../widgets/animated_stat_card.dart';
import '../../widgets/avatar_stack.dart';
import '../../widgets/chat/group_shimmer.dart';
import '../../theme.dart';
import '../../utils/result.dart';
import 'add_group_members_page.dart';
import 'widgets/group_icon_picker_sheet.dart';

/// Enhanced Group Settings page with analytics, activity log, and visual polish
class GroupSettingsPage extends StatefulWidget {
  final String groupId;

  const GroupSettingsPage({super.key, required this.groupId});

  @override
  State<GroupSettingsPage> createState() => _GroupSettingsPageState();
}

class _GroupSettingsPageState extends State<GroupSettingsPage>
    with TickerProviderStateMixin {
  final _groupService = GroupChatService();
  final _iconService = GroupIconService();

  ChatGroup? _group;
  List<ChatGroupMember> _members = [];
  ChatGroupMember? _currentMembership;
  GroupStats? _stats;
  GroupInviteLink? _inviteLink;
  bool _isLoading = true;
  bool _isEditing = false;
  bool _isUploadingIcon = false;
  bool _isLoadingStats = false;
  bool _isLoadingLink = false;
  String _searchQuery = '';

  // Settings from membership
  bool _isMuted = false;
  bool _pinConversation = false;
  bool _hideFromList = false;

  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();

  late AnimationController _fadeController;
  late AnimationController _headerController;
  late Animation<double> _fadeAnimation;
  late Animation<double> _headerScale;

  @override
  void initState() {
    super.initState();
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
    _loadData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _fadeController.dispose();
    _headerController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    try {
      final results = await Future.wait([
        _groupService.getGroupById(widget.groupId),
        _groupService.getGroupMembers(widget.groupId),
        _groupService.getCurrentMembership(widget.groupId),
      ]);

      final groupResult = results[0] as Result<ChatGroup>;
      final membersResult = results[1] as Result<List<ChatGroupMember>>;
      final membershipResult = results[2] as Result<ChatGroupMember?>;

      if (!groupResult.isSuccess) {
        throw Exception(groupResult.errorMessage ?? 'Failed to load group');
      }

      final group = groupResult.data;
      final members = membersResult.isSuccess ? membersResult.data : <ChatGroupMember>[];
      final membership = membershipResult.isSuccess ? membershipResult.data : null;

      if (mounted) {
        setState(() {
          _group = group;
          _members = members;
          _currentMembership = membership;
          _isMuted = membership?.isMuted ?? false;
          _pinConversation = membership?.isPinned ?? false;
          _hideFromList = membership?.isHidden ?? false;
          _nameController.text = group.name;
          _descriptionController.text = group.description ?? '';
          _isLoading = false;
        });
        _fadeController.forward();
        _headerController.forward();
        
        // Load stats and invite link in background
        _loadStats();
        _loadInviteLink();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load group: $e')),
        );
      }
    }
  }

  Future<void> _loadStats() async {
    if (_isLoadingStats) return;
    setState(() => _isLoadingStats = true);
    
    final result = await _groupService.getGroupStatistics(widget.groupId);
    if (mounted && result.isSuccess) {
      setState(() {
        _stats = result.data;
        _isLoadingStats = false;
      });
    } else {
      setState(() => _isLoadingStats = false);
    }
  }

  Future<void> _loadInviteLink() async {
    if (!_canManageMembers || _isLoadingLink) return;
    setState(() => _isLoadingLink = true);
    
    final result = await _groupService.getOrCreateInviteLink(widget.groupId);
    if (mounted && result.isSuccess) {
      setState(() {
        _inviteLink = result.data;
        _isLoadingLink = false;
      });
    } else {
      setState(() => _isLoadingLink = false);
    }
  }

  bool get _canEdit => _currentMembership?.role.canEditGroup ?? false;
  bool get _canManageMembers => _currentMembership?.role.canManageMembers ?? false;
  bool get _isOwner => _currentMembership?.role == GroupMemberRole.owner;

  List<ChatGroupMember> get _filteredMembers {
    if (_searchQuery.isEmpty) return _members;
    return _members.where((m) => 
      m.displayName.toLowerCase().contains(_searchQuery.toLowerCase())
    ).toList();
  }

  Future<void> _saveChanges() async {
    if (_group == null) return;

    try {
      await _groupService.updateGroup(
        widget.groupId,
        name: _nameController.text.trim(),
        description: _descriptionController.text.trim().isEmpty
            ? null
            : _descriptionController.text.trim(),
      );

      if (mounted) {
        setState(() => _isEditing = false);
        _loadData();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Group updated!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update: $e')),
        );
      }
    }
  }

  Future<void> _changeGroupIcon() async {
    if (!_canEdit) return;

    setState(() => _isUploadingIcon = true);

    try {
      final url = await _iconService.pickAndUploadGroupIcon(widget.groupId);
      if (url != null && mounted) {
        _loadData();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Group icon updated!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to upload icon: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isUploadingIcon = false);
      }
    }
  }

  Future<void> _leaveGroup() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Leave Group'),
        content: Text(
          _isOwner
              ? 'As the owner, leaving will transfer ownership to another member or delete the group if you\'re the only member.'
              : 'Are you sure you want to leave this group?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Leave'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await _groupService.leaveGroup(widget.groupId);
      if (mounted) {
        Navigator.of(context).popUntil((route) => route.isFirst);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Left group')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to leave: $e')),
        );
      }
    }
  }

  Future<void> _deleteGroup() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Group'),
        content: const Text(
          'Are you sure you want to delete this group? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await _groupService.deleteGroup(widget.groupId);
      if (mounted) {
        Navigator.of(context).popUntil((route) => route.isFirst);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Group deleted')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete: $e')),
        );
      }
    }
  }

  void _showMemberOptions(ChatGroupMember member) {
    final isSelf = member.userId == _currentMembership?.userId;
    final canModify = _canManageMembers && !isSelf && 
        member.role != GroupMemberRole.owner;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.4,
        minChildSize: 0.2,
        maxChildSize: 0.6,
        expand: false,
        builder: (context, scrollController) {
          final cs = Theme.of(context).colorScheme;
          return Column(
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
              Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Row(
                  children: [
                    StyledAvatar(
                      name: member.displayName,
                      url: member.userAvatar,
                      isOnline: member.isOnline ?? false,
                      size: 56,
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            member.displayName,
                            style: context.textStyles.titleMedium?.semiBold,
                          ),
                          const SizedBox(height: 4),
                          MessageRoleBadge(role: member.role),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(),
              Expanded(
                child: ListView(
                  controller: scrollController,
                  children: [
                    if (_isOwner && canModify) ...[
                      ListTile(
                        leading: const Icon(Icons.admin_panel_settings),
                        title: const Text('Change Role'),
                        subtitle: Text('Current: ${member.role.displayName}'),
                        onTap: () {
                          Navigator.pop(context);
                          _showRolePicker(member);
                        },
                      ),
                      ListTile(
                        leading: const Icon(Icons.swap_horiz),
                        title: const Text('Transfer Ownership'),
                        subtitle: const Text('Make this member the owner'),
                        onTap: () async {
                          Navigator.pop(context);
                          await _transferOwnership(member);
                        },
                      ),
                    ],
                    ListTile(
                      leading: const Icon(Icons.message),
                      title: const Text('Send Message'),
                      onTap: () async {
                        Navigator.pop(context);
                        await _navigateToDM(member);
                      },
                    ),
                    ListTile(
                      leading: const Icon(Icons.person),
                      title: const Text('View Profile'),
                      onTap: () {
                        Navigator.pop(context);
                        _navigateToProfile(member);
                      },
                    ),
                    if (canModify)
                      ListTile(
                        leading: Icon(Icons.remove_circle, color: AppColors.error),
                        title: Text(
                          'Remove from Group',
                          style: TextStyle(color: AppColors.error),
                        ),
                        onTap: () async {
                          Navigator.pop(context);
                          await _removeMember(member);
                        },
                      ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showRolePicker(ChatGroupMember member) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Change Role'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final role in [
              GroupMemberRole.admin,
              GroupMemberRole.moderator,
              GroupMemberRole.member,
            ])
              RadioListTile<GroupMemberRole>(
                title: Text(role.displayName),
                subtitle: Text(_roleDescription(role)),
                value: role,
                groupValue: member.role,
                onChanged: (value) async {
                  Navigator.pop(context);
                  if (value != null && value != member.role) {
                    await _groupService.updateMemberRole(
                      widget.groupId,
                      member.userId,
                      value,
                    );
                    _loadData();
                  }
                },
              ),
          ],
        ),
      ),
    );
  }

  String _roleDescription(GroupMemberRole role) {
    switch (role) {
      case GroupMemberRole.owner:
        return 'Full control over the group';
      case GroupMemberRole.admin:
        return 'Can manage members and settings';
      case GroupMemberRole.moderator:
        return 'Can manage messages';
      case GroupMemberRole.member:
        return 'Can send messages';
    }
  }

  Future<void> _transferOwnership(ChatGroupMember member) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Transfer Ownership'),
        content: Text(
          'Are you sure you want to transfer ownership to ${member.displayName}? You will become an admin.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Transfer'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await _groupService.transferOwnership(widget.groupId, member.userId);
      _loadData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ownership transferred')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e')),
        );
      }
    }
  }

  Future<void> _removeMember(ChatGroupMember member) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Member'),
        content: Text('Remove ${member.displayName} from the group?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await _groupService.removeMember(widget.groupId, member.userId);
      _loadData();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e')),
        );
      }
    }
  }

  /// Navigate to DM with a group member
  Future<void> _navigateToDM(ChatGroupMember member) async {
    final currentUserId = _groupService.getCurrentUserId();
    if (currentUserId == null) return;
    
    // Don't allow DM to yourself
    if (member.userId == currentUserId) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('You cannot message yourself')),
        );
      }
      return;
    }
    
    // Get or create DM channel
    final channelId = ChatService.dmChannelIdFor(currentUserId, member.userId);
    
    if (mounted) {
      context.push(AppRoutes.chatChannel(channelId), extra: {
        'channelName': member.displayName,
        'channelAvatar': member.userAvatar,
        'isDM': true,
        'partnerId': member.userId,
      });
    }
  }
  
  /// Navigate to member's public profile
  void _navigateToProfile(ChatGroupMember member) {
    if (mounted) {
      context.push(AppRoutes.publicProfile(member.userId));
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Group Settings')),
        body: const GroupSettingsShimmer(),
      );
    }

    if (_group == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Group Settings')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: cs.error),
              const SizedBox(height: AppSpacing.md),
              Text('Group not found', style: context.textStyles.titleMedium),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: NestedScrollView(
          headerSliverBuilder: (context, innerBoxIsScrolled) => [
            _buildParallaxHeader(cs, innerBoxIsScrolled),
          ],
          body: CustomScrollView(
            slivers: [
              // Quick Stats
              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: context.horizontalPadding,
                    vertical: AppSpacing.md,
                  ),
                  child: _buildQuickStats(cs),
                ),
              ),

              // Settings Sections
              SliverPadding(
                padding: EdgeInsets.symmetric(
                  horizontal: context.horizontalPadding,
                ),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // Invite Link Section (Admin only)
                    if (_canManageMembers) ...[
                      _buildInviteLinkSection(),
                      const SizedBox(height: AppSpacing.md),
                    ],

                    // Admin Controls (Owner only)
                    if (_isOwner) ...[
                      _buildAdminControlsSection(),
                      const SizedBox(height: AppSpacing.md),
                    ],

                    // Notification Settings
                    _buildNotificationSection(),
                    const SizedBox(height: AppSpacing.md),

                    // Members Section
                    _buildMembersSection(cs),
                    const SizedBox(height: AppSpacing.md),

                    // Media & Links Section
                    _buildMediaSection(),
                    const SizedBox(height: AppSpacing.md),

                    // Privacy Section
                    _buildPrivacySection(),
                    const SizedBox(height: AppSpacing.md),

                    // Danger Zone
                    _buildDangerZone(),
                    const SizedBox(height: AppSpacing.xl),
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
    final hasIcon = _group!.iconUrl != null;
    
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
        if (_canEdit && !_isEditing)
          IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: cs.surface.withOpacity(0.8),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.edit_outlined, color: cs.onSurface, size: 20),
            ),
            onPressed: () => setState(() => _isEditing = true),
          ),
        if (_isEditing) ...[
          IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: cs.surface.withOpacity(0.8),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.close, color: cs.onSurface, size: 20),
            ),
            onPressed: () => setState(() => _isEditing = false),
          ),
          IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: cs.primary,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.check, color: cs.onPrimary, size: 20),
            ),
            onPressed: _saveChanges,
          ),
        ],
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
            // Blurred background
            if (hasIcon) ...[
              Image.network(
                _group!.iconUrl!,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        cs.primary.withOpacity(0.3),
                        cs.secondary.withOpacity(0.2),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                ),
              ),
              BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
                child: Container(
                  color: cs.surface.withOpacity(0.3),
                ),
              ),
            ] else
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      cs.primary.withOpacity(0.15),
                      cs.secondary.withOpacity(0.1),
                      cs.surface,
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
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
                    // Hero group icon
                    ScaleTransition(
                      scale: _headerScale,
                      child: GestureDetector(
                        onTap: _canEdit ? _changeGroupIcon : _showIconFullscreen,
                        child: Hero(
                          tag: 'group_icon_${widget.groupId}',
                          child: _buildGroupIconWithBadge(cs),
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    
                    // Group name
                    if (_isEditing)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: StyledTextField(
                          controller: _nameController,
                          label: 'Group Name',
                        ),
                      )
                    else
                      Text(
                        _group!.name,
                        style: context.textStyles.headlineMedium?.bold,
                        textAlign: TextAlign.center,
                      ),
                    
                    // Description
                    if (_isEditing)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 8),
                        child: StyledTextField(
                          controller: _descriptionController,
                          label: 'Description',
                          maxLines: 2,
                        ),
                      )
                    else if (_group!.description != null) ...[
                      const SizedBox(height: 4),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Text(
                          _group!.description!,
                          style: context.textStyles.bodyMedium?.withColor(cs.onSurfaceVariant),
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                    
                    const SizedBox(height: AppSpacing.sm),
                    
                    // Member count badge
                    Container(
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
                            '${_group!.memberCount} ${_group!.memberCount == 1 ? 'member' : 'members'}',
                            style: context.textStyles.labelMedium?.semiBold.withColor(cs.onSurface),
                          ),
                          if (_group!.isPublic ?? false) ...[
                            Container(
                              margin: const EdgeInsets.symmetric(horizontal: 8),
                              width: 4,
                              height: 4,
                              decoration: BoxDecoration(
                                color: cs.onSurfaceVariant,
                                shape: BoxShape.circle,
                              ),
                            ),
                            Icon(Icons.public, size: 14, color: AppColors.emerald500),
                            const SizedBox(width: 4),
                            Text(
                              'Public',
                              style: context.textStyles.labelSmall?.withColor(AppColors.emerald500),
                            ),
                          ],
                        ],
                      ),
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

  Widget _buildGroupIconWithBadge(ColorScheme cs) {
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
            image: _group!.iconUrl != null
                ? DecorationImage(
                    image: NetworkImage(_group!.iconUrl!),
                    fit: BoxFit.cover,
                  )
                : null,
          ),
          child: _isUploadingIcon
              ? Container(
                  decoration: BoxDecoration(
                    color: cs.surface.withOpacity(0.7),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: const Center(child: CircularProgressIndicator()),
                )
              : _group!.iconUrl == null
                  ? Center(
                      child: Text(
                        _group!.name[0].toUpperCase(),
                        style: context.textStyles.displaySmall?.bold.withColor(cs.primary),
                      ),
                    )
                  : null,
        ),
        if (_canEdit && !_isUploadingIcon)
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: cs.primary,
                shape: BoxShape.circle,
                border: Border.all(color: cs.surface, width: 3),
                boxShadow: [
                  BoxShadow(
                    color: cs.primary.withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(
                Icons.camera_alt_rounded,
                size: 16,
                color: cs.onPrimary,
              ),
            ),
          ),
      ],
    );
  }

  void _showIconFullscreen() {
    if (_group?.iconUrl == null) return;
    
    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        barrierColor: Colors.black87,
        pageBuilder: (context, animation, secondaryAnimation) {
          return FadeTransition(
            opacity: animation,
            child: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Scaffold(
                backgroundColor: Colors.transparent,
                body: Center(
                  child: Hero(
                    tag: 'group_icon_${widget.groupId}',
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: Image.network(
                        _group!.iconUrl!,
                        width: MediaQuery.of(context).size.width * 0.8,
                        height: MediaQuery.of(context).size.width * 0.8,
                        fit: BoxFit.cover,
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

  Widget _buildQuickStats(ColorScheme cs) {
    final stats = _stats ?? GroupStats.empty();
    
    if (_isLoadingStats) {
      return Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: cs.surfaceContainerLow,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: cs.outline.withOpacity(0.1)),
        ),
        child: const Center(
          child: SizedBox(
            width: 24,
            height: 24,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      );
    }
    
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: AnimatedStatsRow(
        animate: true,
        stats: [
          StatData(
            icon: Icons.message_rounded,
            label: 'Messages',
            value: stats.messageCount,
            color: AppColors.violet500,
            onTap: () => HapticFeedback.lightImpact(),
          ),
          StatData(
            icon: Icons.photo_library_rounded,
            label: 'Media',
            value: stats.mediaCount,
            color: AppColors.pink500,
            onTap: () => HapticFeedback.lightImpact(),
          ),
          StatData(
            icon: Icons.link_rounded,
            label: 'Links',
            value: stats.linkCount,
            color: AppColors.teal500,
            onTap: () => HapticFeedback.lightImpact(),
          ),
        ],
      ),
    );
  }

  Widget _buildInviteLinkSection() {
    return SettingsSection(
      title: 'Invite Link',
      icon: Icons.link,
      iconColor: AppColors.blue500,
      children: [
        SettingsAction(
          label: 'Share Invite Link',
          subtitle: _isLoadingLink
              ? 'Loading...'
              : _inviteLink?.displayCode ?? 'Tap to generate',
          icon: Icons.share,
          onTap: _shareInviteLink,
        ),
        const SettingsDivider(),
        SettingsAction(
          label: 'Copy Link',
          subtitle: 'Copy link to clipboard',
          icon: Icons.copy,
          onTap: _copyInviteLink,
        ),
        const SettingsDivider(),
        SettingsAction(
          label: 'Reset Link',
          subtitle: 'Revoke current and create new',
          icon: Icons.refresh,
          onTap: _resetInviteLink,
        ),
      ],
    );
  }

  Future<void> _shareInviteLink() async {
    if (_inviteLink == null) {
      await _loadInviteLink();
    }
    if (_inviteLink != null) {
      await Share.share(
        'Join ${_group?.name ?? 'my group'} on Thittam1Hub: ${_inviteLink!.fullUrl}',
        subject: 'Join ${_group?.name ?? 'my group'}',
      );
    }
  }

  Future<void> _copyInviteLink() async {
    if (_inviteLink == null) {
      await _loadInviteLink();
    }
    if (_inviteLink != null) {
      await Clipboard.setData(ClipboardData(text: _inviteLink!.fullUrl));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Invite link copied!')),
        );
      }
    }
  }

  Future<void> _resetInviteLink() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset Invite Link?'),
        content: const Text(
          'This will revoke the current link. Anyone who has it won\'t be able to join anymore.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Reset'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isLoadingLink = true);
    final result = await _groupService.revokeAndCreateInviteLink(widget.groupId);
    if (mounted) {
      if (result.isSuccess) {
        setState(() {
          _inviteLink = result.data;
          _isLoadingLink = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('New invite link created!')),
        );
      } else {
        setState(() => _isLoadingLink = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: ${result.errorMessage}')),
        );
      }
    }
  }

  Widget _buildAdminControlsSection() {
    return SettingsSection(
      title: 'Group Permissions',
      icon: Icons.admin_panel_settings,
      iconColor: AppColors.amber500,
      children: [
        SettingsToggle(
          label: 'Only Admins Can Send',
          subtitle: 'Restrict messaging to admins only',
          icon: Icons.message,
          value: _group?.onlyAdminsCanSend ?? false,
          onChanged: (v) async {
            await _groupService.setOnlyAdminsCanSend(widget.groupId, v);
            _loadData();
          },
        ),
        const SettingsDivider(),
        SettingsToggle(
          label: 'Only Admins Can Edit Info',
          subtitle: 'Restrict group info editing to admins',
          icon: Icons.edit,
          value: _group?.onlyAdminsCanEdit ?? false,
          onChanged: (v) async {
            await _groupService.setOnlyAdminsCanEdit(widget.groupId, v);
            _loadData();
          },
        ),
      ],
    );
  }

  Widget _buildNotificationSection() {
    return SettingsSection(
      title: 'Notifications',
      icon: Icons.notifications_outlined,
      iconColor: AppColors.violet500,
      children: [
        SettingsToggle(
          label: 'Mute Notifications',
          subtitle: 'Stop receiving notifications from this group',
          icon: Icons.notifications_off_outlined,
          value: _isMuted,
          onChanged: (v) async {
            // Store previous state for rollback
            final previousMuted = _isMuted;
            
            // Optimistic update
            setState(() => _isMuted = v);
            HapticFeedback.lightImpact();
            
            try {
              await _groupService.toggleMute(widget.groupId);
            } catch (e) {
              // Rollback on failure
              if (mounted) {
                setState(() => _isMuted = previousMuted);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Failed to ${v ? 'mute' : 'unmute'} group')),
                );
              }
            }
          },
        ),
        const SettingsDivider(),
        SettingsToggle(
          label: 'Pin Conversation',
          subtitle: 'Keep this chat at the top',
          icon: Icons.push_pin_outlined,
          value: _pinConversation,
          onChanged: (v) async {
            // Store previous state for rollback
            final previousPinned = _pinConversation;
            
            // Optimistic update
            setState(() => _pinConversation = v);
            HapticFeedback.lightImpact();
            
            try {
              await _groupService.pinGroup(widget.groupId, v);
            } catch (e) {
              // Rollback on failure
              if (mounted) {
                setState(() => _pinConversation = previousPinned);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Failed to ${v ? 'pin' : 'unpin'} group')),
                );
              }
            }
          },
        ),
      ],
    );
  }

  Widget _buildMembersSection(ColorScheme cs) {
    return SettingsSection(
      title: 'Members (${_members.length})',
      icon: Icons.people_outline,
      iconColor: AppColors.emerald500,
      trailing: _canManageMembers
          ? TextButton.icon(
              onPressed: () async {
                final added = await Navigator.push<bool>(
                  context,
                  MaterialPageRoute(
                    builder: (_) => AddGroupMembersPage(groupId: widget.groupId),
                  ),
                );
                if (added == true) _loadData();
              },
              icon: const Icon(Icons.add, size: 16),
              label: const Text('Add'),
            )
          : null,
      children: [
        // Search members
        Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: SettingsSearchBar(
            onChanged: (q) => setState(() => _searchQuery = q),
            hintText: 'Search members...',
          ),
        ),
        
        // Member list
        ..._filteredMembers.map((member) => _MemberTile(
          member: member,
          onTap: () => _showMemberOptions(member),
        )),
      ],
    );
  }

  Widget _buildMediaSection() {
    return SettingsSection(
      title: 'Media & Links',
      icon: Icons.photo_library_outlined,
      iconColor: AppColors.pink500,
      initiallyExpanded: false,
      children: [
        SettingsAction(
          label: 'View Media Gallery',
          subtitle: 'Photos and videos shared in this group',
          icon: Icons.collections,
          onTap: () {},
        ),
        const SettingsDivider(),
        SettingsAction(
          label: 'View Shared Links',
          subtitle: 'Links shared in this group',
          icon: Icons.link,
          onTap: () {},
        ),
        const SettingsDivider(),
        SettingsAction(
          label: 'View Shared Files',
          subtitle: 'Documents and files shared in this group',
          icon: Icons.folder_outlined,
          onTap: () {},
        ),
      ],
    );
  }

  Widget _buildPrivacySection() {
    return SettingsSection(
      title: 'Privacy',
      icon: Icons.lock_outline,
      iconColor: AppColors.teal500,
      initiallyExpanded: false,
      children: [
        SettingsToggle(
          label: 'Hide from Chat List',
          subtitle: 'Access this group only from search',
          icon: Icons.visibility_off_outlined,
          value: _hideFromList,
          onChanged: (v) async {
            // Store previous state for rollback
            final previousHidden = _hideFromList;
            
            // Optimistic update
            setState(() => _hideFromList = v);
            HapticFeedback.lightImpact();
            
            try {
              await _groupService.hideGroup(widget.groupId, v);
            } catch (e) {
              // Rollback on failure
              if (mounted) {
                setState(() => _hideFromList = previousHidden);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Failed to update visibility')),
                );
              }
            }
          },
        ),
        const SettingsDivider(),
        SettingsAction(
          label: 'Export Chat',
          subtitle: 'Download all messages as a file',
          icon: Icons.download,
          onTap: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Exporting chat...')),
            );
          },
        ),
        const SettingsDivider(),
        SettingsAction(
          label: 'Clear Chat History',
          subtitle: 'Delete all messages for yourself',
          icon: Icons.delete_outline,
          isDestructive: true,
          onTap: _confirmClearHistory,
        ),
      ],
    );
  }

  Future<void> _confirmClearHistory() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Chat History'),
        content: const Text('This will delete all messages for you. Other members will still see them.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Clear'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    final result = await _groupService.clearGroupHistory(widget.groupId);
    if (mounted) {
      if (result.isSuccess) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Chat history cleared')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: ${result.errorMessage}')),
        );
      }
    }
  }

  Widget _buildDangerZone() {
    return SettingsSection(
      title: 'Danger Zone',
      icon: Icons.warning_amber,
      iconColor: AppColors.error,
      initiallyExpanded: false,
      children: [
        SettingsAction(
          label: 'Leave Group',
          subtitle: 'You will no longer receive messages',
          icon: Icons.exit_to_app,
          isDestructive: true,
          onTap: _leaveGroup,
        ),
        if (_isOwner) ...[
          const SettingsDivider(),
          SettingsAction(
            label: 'Delete Group',
            subtitle: 'Permanently delete this group and all messages',
            icon: Icons.delete_forever,
            isDestructive: true,
            onTap: _deleteGroup,
          ),
        ],
      ],
    );
  }
}

// ============ Helper Widgets ============

class _StatItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatItem({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, size: 20, color: color),
        const SizedBox(height: 4),
        Text(
          value,
          style: context.textStyles.titleMedium?.bold,
        ),
        Text(
          label,
          style: context.textStyles.labelSmall?.withColor(
            Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

class _MemberTile extends StatelessWidget {
  final ChatGroupMember member;
  final VoidCallback onTap;

  const _MemberTile({required this.member, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        child: Row(
          children: [
            StyledAvatar(
              name: member.displayName,
              url: member.userAvatar,
              isOnline: member.isOnline ?? false,
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    member.displayName,
                    style: context.textStyles.bodyMedium?.semiBold,
                  ),
                  const SizedBox(height: 2),
                  MessageRoleBadge(role: member.role, mini: true),
                ],
              ),
            ),
            if (member.role == GroupMemberRole.owner)
              Icon(Icons.star, color: AppColors.amber500, size: 20),
            Icon(Icons.chevron_right, color: cs.onSurfaceVariant.withOpacity(0.5)),
          ],
        ),
      ),
    );
  }
}
