import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/profile_service.dart';
import 'package:thittam1hub/services/organizer_application_service.dart';
import 'package:thittam1hub/models/organizer_application.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/settings_components.dart';
import 'package:thittam1hub/widgets/settings/settings_page_scaffold.dart';
import 'package:thittam1hub/widgets/settings/email_change_sheet.dart';
import 'package:thittam1hub/widgets/settings/username_change_sheet.dart';
import 'package:thittam1hub/widgets/organizer/application_status_tracker.dart';
import 'package:thittam1hub/widgets/organizer/application_draft_banner.dart';
import 'package:thittam1hub/widgets/common/settings_feedback.dart';
import 'package:thittam1hub/nav.dart';

/// Account Settings - Email, Role, Upgrade
class AccountSettingsPage extends StatefulWidget {
  const AccountSettingsPage({super.key});

  @override
  State<AccountSettingsPage> createState() => _AccountSettingsPageState();
}

class _AccountSettingsPageState extends State<AccountSettingsPage> {
  final _profileService = ProfileService.instance;
  final _applicationService = OrganizerApplicationService.instance;
  
  String _userEmail = '';
  String _userName = '';
  String _userRole = 'participant';
  String? _username;
  DateTime? _lastUsernameChange;
  bool _isLoading = true;
  String? _errorMessage;
  
  // Organizer application state
  OrganizerApplication? _application;
  bool _isOrganizer = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    final email = SupabaseConfig.auth.currentUser?.email;
    final metadata = SupabaseConfig.auth.currentUser?.userMetadata;
    if (userId == null) {
      setState(() {
        _errorMessage = 'Not signed in';
        _isLoading = false;
      });
      return;
    }

    try {
      // Fetch profile
      final profile = await _profileService.getUserProfile(userId);
      
      // Fetch user role from user_roles table
      final roleData = await SupabaseConfig.client
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
      
      final role = roleData?['role'] as String? ?? 'participant';
      final isOrganizer = role == 'organizer' || role == 'admin';
      
      // Fetch application status if not already an organizer
      OrganizerApplication? application;
      if (!isOrganizer) {
        final appResult = await _applicationService.getCurrentApplication();
        if (appResult.isSuccess) {
          application = appResult.data;
        }
      }
      
      if (mounted) {
        setState(() {
          _userEmail = email ?? '';
          _userName = profile?.fullName ?? (metadata?['full_name'] as String?) ?? '';
          _userRole = role;
          _username = profile?.username;
          _lastUsernameChange = profile?.usernameChangedAt;
          _isOrganizer = isOrganizer;
          _application = application;
          _isLoading = false;
          _errorMessage = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load account info';
          _isLoading = false;
        });
      }
    }
  }

  void _navigateToApplication() {
    context.push(AppRoutes.organizerApplication);
  }

  void _navigateToApplicationWithStep(int step) {
    context.push(AppRoutes.organizerApplicationWithStep(step));
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return SettingsPageScaffold(
      title: 'Account',
      isLoading: _isLoading,
      errorMessage: _errorMessage,
      onRetry: _loadData,
      onRefresh: _loadData,
      skeletonSections: 1,
      body: Column(
        children: [
          // Account Info Card
          Card(
            child: Semantics(
              label: 'Account information',
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                child: Column(
                  children: [
                    _InfoRow(label: 'Email', value: _userEmail),
                    const Divider(height: 1),
                    _InfoRow(label: 'Name', value: _userName.isNotEmpty ? _userName : 'Not set'),
                    const Divider(height: 1),
                    _InfoRow(
                      label: 'Role', 
                      value: _isOrganizer ? 'Organizer' : 'Participant', 
                      badge: true,
                      badgeColor: _isOrganizer ? AppColors.success : null,
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),

          // Dynamic organizer section based on state
          _buildOrganizerSection(cs),

          const SizedBox(height: AppSpacing.lg),

          // Actions
          SettingsSection(
            title: 'Account Actions',
            icon: Icons.manage_accounts_outlined,
            iconColor: cs.primary,
            children: [
              SettingsAction(
                label: 'Change Email',
                subtitle: _userEmail.isNotEmpty ? _userEmail : 'Update your email address',
                icon: Icons.email_outlined,
                onTap: () async {
                  final changed = await EmailChangeSheet.show(context, _userEmail);
                  if (changed == true) {
                    SettingsFeedback.showSuccess(context, 'Verification email sent');
                  }
                },
              ),
              SettingsAction(
                label: 'Change Username',
                subtitle: _username != null ? '@$_username' : 'Set your @username',
                icon: Icons.alternate_email,
                onTap: () async {
                  final changed = await UsernameChangeSheet.show(
                    context,
                    currentUsername: _username,
                    lastUsernameChange: _lastUsernameChange,
                  );
                  if (changed == true) {
                    _loadData(); // Refresh data
                  }
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOrganizerSection(ColorScheme cs) {
    // Already an organizer - show badge
    if (_isOrganizer) {
      return _buildOrganizerBadge(cs);
    }

    // No application yet - show apply banner
    if (_application == null) {
      return _buildApplyBanner(cs);
    }

    // Handle different application states
    return switch (_application!.status) {
      ApplicationStatus.draft => ApplicationDraftBanner(
        draft: _application!,
        onContinue: _navigateToApplication,
        onDiscard: () async {
          // Could add discard functionality here
          _navigateToApplication();
        },
        lastSaved: _application!.updatedAt,
      ),
      ApplicationStatus.submitted || 
      ApplicationStatus.underReview => ApplicationStatusTracker(
        application: _application!,
        onViewDetails: _navigateToApplication,
      ),
      ApplicationStatus.approved => _buildOrganizerBadge(cs),
      ApplicationStatus.rejected => ApplicationStatusTracker(
        application: _application!,
        onResubmit: () => _navigateToApplicationWithStep(0),
        onViewDetails: _navigateToApplication,
      ),
      ApplicationStatus.requiresMoreInfo => ApplicationStatusTracker(
        application: _application!,
        onResubmit: _navigateToApplication,
        onViewDetails: _navigateToApplication,
      ),
    };
  }

  Widget _buildOrganizerBadge(ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.success.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.success.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.success.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.verified,
              size: 20,
              color: AppColors.success,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Verified Organizer',
                  style: context.textStyles.titleSmall?.semiBold.withColor(AppColors.success),
                ),
                const SizedBox(height: 2),
                Text(
                  'You can create events and manage organizations',
                  style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildApplyBanner(ColorScheme cs) {
    return Semantics(
      label: 'Upgrade to organizer',
      button: true,
      child: Card(
        color: cs.secondary.withOpacity(0.1),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.star_outline, color: cs.secondary),
                  const SizedBox(width: AppSpacing.sm),
                  Text(
                    'Become an organizer',
                    style: context.textStyles.titleMedium?.semiBold,
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Apply to create events and manage organizations on our platform',
                style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
              ),
              const SizedBox(height: AppSpacing.md),
              FilledButton.icon(
                onPressed: _navigateToApplication,
                style: FilledButton.styleFrom(backgroundColor: cs.secondary),
                icon: const Icon(Icons.arrow_forward, size: 18),
                label: const Text('Apply Now'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final bool badge;
  final Color? badgeColor;

  const _InfoRow({
    required this.label,
    required this.value,
    this.badge = false,
    this.badgeColor,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final effectiveColor = badgeColor ?? cs.primary;

    return Semantics(
      label: '$label: $value',
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: context.textStyles.bodyMedium),
            badge
                ? Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: effectiveColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      value,
                      style: context.textStyles.labelSmall?.semiBold.withColor(effectiveColor),
                    ),
                  )
                : Flexible(
                    child: Text(
                      value,
                      style: context.textStyles.bodyMedium?.withColor(cs.onSurfaceVariant),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
          ],
        ),
      ),
    );
  }
}
