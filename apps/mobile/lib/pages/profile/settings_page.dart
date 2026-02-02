import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/settings_section.dart';
import 'package:thittam1hub/models/searchable_setting.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/profile_service.dart';
import 'package:thittam1hub/services/accessibility_service.dart';
import 'package:thittam1hub/services/settings_audit_service.dart';
import 'package:thittam1hub/services/settings_realtime_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:url_launcher/url_launcher.dart';

// Import settings category pages for master-detail on tablets
import 'package:thittam1hub/pages/profile/settings/account_settings_page.dart';
import 'package:thittam1hub/pages/profile/settings/appearance_settings_page.dart';
import 'package:thittam1hub/pages/profile/settings/language_settings_page.dart';
import 'package:thittam1hub/pages/profile/settings/notification_settings_page.dart';
import 'package:thittam1hub/pages/profile/settings/chat_preferences_page.dart';
import 'package:thittam1hub/pages/profile/settings/privacy_settings_page.dart';
import 'package:thittam1hub/pages/profile/settings/connected_accounts_page.dart';
import 'package:thittam1hub/pages/profile/settings/storage_settings_page.dart';
import 'package:thittam1hub/pages/profile/settings/about_settings_page.dart';
import 'package:thittam1hub/pages/profile/settings/backup_restore_settings_page.dart';
import 'package:thittam1hub/pages/profile/security_settings_page.dart';
import 'package:thittam1hub/pages/profile/settings/settings_history_page.dart';

/// Refactored Settings Index Page - Clean navigation hub with deep search
class SettingsPage extends StatefulWidget {
  final String? initialTab;

  const SettingsPage({super.key, this.initialTab});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage>
    with TickerProviderStateMixin {
  final _profileService = ProfileService.instance;
  final _realtimeService = SettingsRealtimeService.instance;
  final _searchController = TextEditingController();
  StreamSubscription<SettingsUpdateEvent>? _realtimeSubscription;
  String _userEmail = '';
  String _userName = '';
  String _userAvatar = '';
  bool _isLoading = true;
  bool _isVerified = false;
  String? _selectedCategory;
  String _searchQuery = '';
  bool _isSearching = false;
  
  // Deep search results
  List<SearchableSetting> _deepSearchResults = [];
  
  // Staggered animation controllers
  late AnimationController _listAnimController;
  late List<Animation<double>> _itemAnimations;

  // Settings categories with searchable keywords
  static const _categories = [
    _SettingsCategory(
      id: 'security',
      icon: Icons.security,
      title: 'Security',
      subtitle: 'Password, 2FA, sessions',
      color: Color(0xFF8B5CF6),
      keywords: ['password', 'two-factor', '2fa', 'authentication', 'login', 'sessions', 'biometric'],
    ),
    _SettingsCategory(
      id: 'account',
      icon: Icons.person_outline,
      title: 'Account',
      subtitle: 'Email, role, upgrade',
      color: Color(0xFF06B6D4),
      keywords: ['email', 'username', 'role', 'upgrade', 'premium', 'subscription'],
    ),
    _SettingsCategory(
      id: 'appearance',
      icon: Icons.palette_outlined,
      title: 'Appearance',
      subtitle: 'Theme, accessibility',
      color: Color(0xFFF59E0B),
      keywords: ['theme', 'dark', 'light', 'accessibility', 'font', 'size', 'color'],
    ),
    _SettingsCategory(
      id: 'language',
      icon: Icons.language,
      title: 'Language & Region',
      subtitle: 'Language, date format',
      color: Color(0xFF6366F1),
      keywords: ['language', 'region', 'date', 'time', 'format', 'locale', 'translation'],
    ),
    _SettingsCategory(
      id: 'notifications',
      icon: Icons.notifications_outlined,
      title: 'Notifications',
      subtitle: 'Alerts, quiet hours',
      color: Color(0xFFEC4899),
      keywords: ['notifications', 'alerts', 'push', 'quiet', 'hours', 'sound', 'vibration'],
    ),
    _SettingsCategory(
      id: 'chat',
      icon: Icons.chat_bubble_outline,
      title: 'Chat',
      subtitle: 'Messages, receipts',
      color: Color(0xFF3B82F6),
      keywords: ['chat', 'messages', 'read', 'receipts', 'typing', 'preview'],
    ),
    _SettingsCategory(
      id: 'privacy',
      icon: Icons.lock_outline,
      title: 'Privacy',
      subtitle: 'Online status, data',
      color: Color(0xFF10B981),
      keywords: ['privacy', 'online', 'status', 'data', 'visibility', 'profile', 'gdpr'],
    ),
    _SettingsCategory(
      id: 'accounts',
      icon: Icons.link,
      title: 'Connected Accounts',
      subtitle: 'Google, Apple, GitHub',
      color: Color(0xFF14B8A6),
      keywords: ['connected', 'accounts', 'google', 'apple', 'github', 'oauth', 'social'],
    ),
    _SettingsCategory(
      id: 'storage',
      icon: Icons.storage,
      title: 'Storage & Data',
      subtitle: 'Cache, downloads',
      color: Color(0xFFF59E0B),
      keywords: ['storage', 'cache', 'data', 'downloads', 'clear', 'media'],
    ),
    _SettingsCategory(
      id: 'backup',
      icon: Icons.backup,
      title: 'Backup & Restore',
      subtitle: 'Auto-backup, encryption',
      color: Color(0xFF22C55E),
      keywords: ['backup', 'restore', 'export', 'import', 'encryption', 'schedule', 'recovery'],
    ),
    _SettingsCategory(
      id: 'about',
      icon: Icons.help_outline,
      title: 'Help & About',
      subtitle: 'Support, licenses, version',
      color: Color(0xFF6B7280),
      keywords: ['help', 'about', 'support', 'licenses', 'version', 'feedback', 'contact'],
    ),
  ];

  List<_SettingsCategory> get _filteredCategories {
    if (_searchQuery.isEmpty) return _categories;
    final query = _searchQuery.toLowerCase();
    return _categories.where((cat) {
      return cat.title.toLowerCase().contains(query) ||
          cat.subtitle.toLowerCase().contains(query) ||
          cat.keywords.any((k) => k.contains(query));
    }).toList();
  }

  @override
  void initState() {
    super.initState();
    _selectedCategory = widget.initialTab;
    _initAnimations();
    _loadUserInfo();
    _subscribeToRealtimeUpdates();
  }
  
  void _subscribeToRealtimeUpdates() {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return;
    
    _realtimeService.subscribe(userId);
    _realtimeSubscription = _realtimeService.onSettingsUpdated.listen((event) {
      // Settings were updated from another device - show subtle indicator
      if (mounted) {
        HapticFeedback.lightImpact();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${_getSettingsTypeName(event.type)} updated from another device'),
            duration: const Duration(seconds: 2),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    });
  }
  
  String _getSettingsTypeName(SettingsUpdateType type) {
    switch (type) {
      case SettingsUpdateType.notification:
        return 'Notification settings';
      case SettingsUpdateType.privacy:
        return 'Privacy settings';
      case SettingsUpdateType.accessibility:
        return 'Accessibility settings';
      case SettingsUpdateType.security:
        return 'Security settings';
      case SettingsUpdateType.aiMatching:
        return 'AI Matching settings';
    }
  }
  
  void _initAnimations() {
    _listAnimController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _itemAnimations = List.generate(
      _categories.length + 4, // categories + header elements
      (index) => Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(
          parent: _listAnimController,
          curve: Interval(
            (index * 0.05).clamp(0.0, 0.7),
            ((index * 0.05) + 0.3).clamp(0.3, 1.0),
            curve: Curves.easeOutCubic,
          ),
        ),
      ),
    );
  }
  
  @override
  void dispose() {
    _realtimeSubscription?.cancel();
    _realtimeService.unsubscribe();
    _listAnimController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadUserInfo() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    final email = SupabaseConfig.auth.currentUser?.email;
    final metadata = SupabaseConfig.auth.currentUser?.userMetadata;
    if (userId == null) return;

    try {
      final profile = await _profileService.getUserProfile(userId);
      if (mounted) {
        setState(() {
          _userEmail = email ?? '';
          _userName = profile?.fullName ?? (metadata?['full_name'] as String?) ?? '';
          _userAvatar = profile?.avatarUrl ?? '';
          _isVerified = false;
          _isLoading = false;
        });
        _listAnimController.forward();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        _listAnimController.forward();
      }
    }
  }
  
  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query;
      // Perform deep search when query is 2+ characters
      if (query.length >= 2) {
        _deepSearchResults = SettingsRegistry.search(query);
      } else {
        _deepSearchResults = [];
      }
    });
  }

  void _onCategoryTap(_SettingsCategory category) {
    HapticFeedback.lightImpact();

    // If it has a direct route (like security), navigate to it
    if (category.route != null) {
      context.push(category.route!);
      return;
    }

    // Use type-safe enum-based navigation
    final section = SettingsSection.fromId(category.id);

    // For tablet/desktop, show in master-detail
    if (context.showMasterDetail) {
      setState(() => _selectedCategory = category.id);
      // Update URL with type-safe helper
      context.replace(AppRoutes.settingsWithSection(section));
    } else {
      // For phone, navigate to category page
      context.push(AppRoutes.settingsWithSection(section));
    }
  }

  Widget _buildCategoryContent(String? categoryId) {
    switch (categoryId) {
      case 'security':
        return const SecuritySettingsPage();
      case 'account':
        return const AccountSettingsPage();
      case 'appearance':
        return const AppearanceSettingsPage();
      case 'language':
        return const LanguageSettingsPage();
      case 'notifications':
        return const NotificationSettingsPage();
      case 'chat':
        return const ChatPreferencesPage();
      case 'privacy':
        return const PrivacySettingsPage();
      case 'accounts':
        return const ConnectedAccountsPage();
      case 'storage':
        return const StorageSettingsPage();
      case 'backup':
        return const BackupRestoreSettingsPage();
      case 'about':
        return const AboutSettingsPage();
      default:
        return _buildWelcomePane();
    }
  }

  Widget _buildWelcomePane() {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.settings_outlined, size: 64, color: cs.onSurfaceVariant.withOpacity(0.5)),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Select a category',
              style: context.textStyles.titleMedium?.withColor(cs.onSurfaceVariant),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Choose from the list on the left',
              style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant.withOpacity(0.7)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    // If on phone and a tab is selected via query param, show that category page
    if (!context.showMasterDetail && widget.initialTab != null) {
      return _buildCategoryContent(widget.initialTab);
    }

    // Master-detail for tablets/desktop
    if (context.showMasterDetail) {
      return Scaffold(
        body: Row(
          children: [
            // Master list
            SizedBox(
              width: context.masterListWidth,
              child: _buildMasterList(cs),
            ),
            // Divider
            VerticalDivider(width: 1, color: cs.outline.withOpacity(0.3)),
            // Detail pane
            Expanded(
              child: _buildCategoryContent(_selectedCategory),
            ),
          ],
        ),
      );
    }

    // Phone layout - category index
    return _buildMasterList(cs);
  }

  Widget _buildMasterList(ColorScheme cs) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Settings')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: _isSearching
            ? _SettingsSearchField(
                controller: _searchController,
                onChanged: _onSearchChanged,
                onClose: () {
                  setState(() {
                    _isSearching = false;
                    _searchQuery = '';
                    _deepSearchResults = [];
                    _searchController.clear();
                  });
                },
              )
            : const Text('Settings'),
        actions: [
          if (!_isSearching)
            IconButton(
              icon: const Icon(Icons.search),
              onPressed: () => setState(() => _isSearching = true),
              tooltip: 'Search settings',
            ),
          IconButton(
            icon: const Icon(Icons.help_outline),
            onPressed: () async {
              final uri = Uri.parse('https://help.thittam1hub.com');
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              }
            },
            tooltip: 'Help',
          ),
        ],
      ),
      body: ListView(
        padding: EdgeInsets.symmetric(
          horizontal: context.horizontalPadding,
          vertical: AppSpacing.md,
        ),
        children: [
          // Profile Header Card (hide when searching)
          if (!_isSearching) ...[
            _buildAnimatedItem(0, _buildProfileHeader(cs)),
            const SizedBox(height: AppSpacing.lg),

            // Quick Shortcuts
            _buildAnimatedItem(1, _buildQuickShortcuts(cs)),
            const SizedBox(height: AppSpacing.lg),
          ],

          // Deep Search Results (individual settings)
          if (_isSearching && _deepSearchResults.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: Row(
                children: [
                  Icon(Icons.auto_awesome, size: 16, color: cs.primary),
                  const SizedBox(width: AppSpacing.xs),
                  Text(
                    'Settings matching "$_searchQuery"',
                    style: context.textStyles.labelMedium?.withColor(cs.primary),
                  ),
                ],
              ),
            ),
            ..._deepSearchResults.take(5).map((setting) => _DeepSearchResultTile(
              setting: setting,
              highlightQuery: _searchQuery,
              onTap: () => _navigateToSetting(setting),
            )),
            const SizedBox(height: AppSpacing.md),
            Divider(color: cs.outline.withOpacity(0.3)),
            const SizedBox(height: AppSpacing.sm),
          ],

          // Search Results Label for categories
          if (_isSearching && _searchQuery.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: Text(
                '${_filteredCategories.length} categor${_filteredCategories.length == 1 ? 'y' : 'ies'} matching',
                style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
              ),
            ),
          ],

          // Categories List (filtered when searching)
          if (_filteredCategories.isEmpty && _deepSearchResults.isEmpty && _isSearching)
            _buildEmptySearchState(cs)
          else
            ...List.generate(_filteredCategories.length, (index) {
              final category = _filteredCategories[index];
              final isSelected = _selectedCategory == category.id;

              return _buildAnimatedItem(
                index + 2, // Offset for header items
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: _SettingsCategoryTile(
                    category: category,
                    isSelected: isSelected && context.showMasterDetail,
                    onTap: () => _onCategoryTap(category),
                    highlightQuery: _searchQuery,
                  ),
                ),
              );
            }),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildProfileHeader(ColorScheme cs) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Row(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundImage: _userAvatar.isNotEmpty ? NetworkImage(_userAvatar) : null,
              child: _userAvatar.isEmpty
                  ? Text(
                      _userName.isNotEmpty ? _userName[0].toUpperCase() : '?',
                      style: context.textStyles.titleLarge,
                    )
                  : null,
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          _userName.isNotEmpty ? _userName : 'User',
                          style: context.textStyles.titleMedium?.semiBold,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (_isVerified) ...[
                        const SizedBox(width: 4),
                        Icon(Icons.verified, size: 18, color: cs.primary),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _userEmail,
                    style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              onPressed: () => context.push(AppRoutes.editProfile),
              tooltip: 'Edit Profile',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickShortcuts(ColorScheme cs) {
    return Row(
      children: [
        _QuickShortcut(
          icon: Icons.security,
          label: 'Security',
          color: cs.primary,
          onTap: () => _onCategoryTap(_categories.firstWhere((c) => c.id == 'security')),
        ),
        const SizedBox(width: AppSpacing.sm),
        _QuickShortcut(
          icon: Icons.shield,
          label: 'Privacy',
          color: Colors.green,
          onTap: () => _onCategoryTap(_categories.firstWhere((c) => c.id == 'privacy')),
        ),
        const SizedBox(width: AppSpacing.sm),
        _QuickShortcut(
          icon: Icons.history,
          label: 'History',
          color: Colors.orange,
          onTap: () => context.push(AppRoutes.settingsHistory),
        ),
        const SizedBox(width: AppSpacing.sm),
        _QuickShortcut(
          icon: Icons.notifications,
          label: 'Notify',
          color: cs.secondary,
          onTap: () => _onCategoryTap(_categories.firstWhere((c) => c.id == 'notifications')),
        ),
      ],
    );
  }

  Widget _buildEmptySearchState(ColorScheme cs) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xl * 2),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search_off,
            size: 48,
            color: cs.onSurfaceVariant.withOpacity(0.5),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'No settings found',
            style: context.textStyles.titleMedium?.withColor(cs.onSurfaceVariant),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Try a different search term',
            style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant.withOpacity(0.7)),
          ),
        ],
      ),
    );
  }
  
  /// Build animated item with staggered entry
  Widget _buildAnimatedItem(int index, Widget child) {
    // Use reduceMotion setting
    final reduceMotion = AccessibilityService.instance.reduceMotionEnabled;
    if (reduceMotion || index >= _itemAnimations.length) {
      return child;
    }
    
    return FadeTransition(
      opacity: _itemAnimations[index],
      child: SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0, 0.05),
          end: Offset.zero,
        ).animate(_itemAnimations[index]),
        child: child,
      ),
    );
  }
  
  /// Navigate to a specific setting from deep search
  void _navigateToSetting(SearchableSetting setting) {
    HapticFeedback.lightImpact();
    
    // Close search and navigate to category
    setState(() {
      _isSearching = false;
      _searchQuery = '';
      _deepSearchResults = [];
      _searchController.clear();
    });
    
    // Navigate to the category page
    final section = SettingsSection.fromId(setting.categoryId);
    
    if (context.showMasterDetail) {
      setState(() => _selectedCategory = setting.categoryId);
      context.replace(AppRoutes.settingsWithSection(section));
    } else {
      context.push(AppRoutes.settingsWithSection(section));
    }
  }
}

// ======================== Helper Models ========================

class _SettingsCategory {
  final String id;
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final String? route;
  final List<String> keywords;

  const _SettingsCategory({
    required this.id,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    this.route,
    this.keywords = const [],
  });
}

// ======================== Helper Widgets ========================

class _SettingsCategoryTile extends StatelessWidget {
  final _SettingsCategory category;
  final bool isSelected;
  final VoidCallback onTap;
  final String highlightQuery;

  const _SettingsCategoryTile({
    required this.category,
    required this.isSelected,
    required this.onTap,
    this.highlightQuery = '',
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Card(
      color: isSelected ? cs.primary.withOpacity(0.1) : null,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: category.color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Icon(category.icon, size: 20, color: category.color),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildHighlightedText(
                      category.title,
                      highlightQuery,
                      context.textStyles.bodyMedium?.semiBold.copyWith(
                        color: isSelected ? cs.primary : null,
                      ),
                      cs.primary,
                    ),
                    const SizedBox(height: 2),
                    _buildHighlightedText(
                      category.subtitle,
                      highlightQuery,
                      context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                      cs.primary,
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                size: 20,
                color: isSelected ? cs.primary : cs.onSurfaceVariant.withOpacity(0.5),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHighlightedText(String text, String query, TextStyle? baseStyle, Color highlightColor) {
    if (query.isEmpty) {
      return Text(text, style: baseStyle);
    }

    final lowerText = text.toLowerCase();
    final lowerQuery = query.toLowerCase();
    final index = lowerText.indexOf(lowerQuery);

    if (index == -1) {
      return Text(text, style: baseStyle);
    }

    return RichText(
      text: TextSpan(
        style: baseStyle,
        children: [
          TextSpan(text: text.substring(0, index)),
          TextSpan(
            text: text.substring(index, index + query.length),
            style: baseStyle?.copyWith(
              backgroundColor: highlightColor.withOpacity(0.2),
              fontWeight: FontWeight.bold,
            ),
          ),
          TextSpan(text: text.substring(index + query.length)),
        ],
      ),
    );
  }
}

/// Search field widget for settings
class _SettingsSearchField extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final VoidCallback onClose;

  const _SettingsSearchField({
    required this.controller,
    required this.onChanged,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      autofocus: true,
      style: context.textStyles.bodyMedium,
      decoration: InputDecoration(
        hintText: 'Search settings...',
        hintStyle: context.textStyles.bodyMedium?.withColor(
          Theme.of(context).colorScheme.onSurfaceVariant,
        ),
        border: InputBorder.none,
        suffixIcon: IconButton(
          icon: const Icon(Icons.close, size: 20),
          onPressed: onClose,
        ),
      ),
    );
  }
}

class _QuickShortcut extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickShortcut({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap();
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 22),
              const SizedBox(height: 4),
              Text(
                label,
                style: context.textStyles.labelSmall?.withColor(color),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Deep search result tile showing individual settings
class _DeepSearchResultTile extends StatefulWidget {
  final SearchableSetting setting;
  final String highlightQuery;
  final VoidCallback onTap;

  const _DeepSearchResultTile({
    required this.setting,
    required this.highlightQuery,
    required this.onTap,
  });

  @override
  State<_DeepSearchResultTile> createState() => _DeepSearchResultTileState();
}

class _DeepSearchResultTileState extends State<_DeepSearchResultTile>
    with SingleTickerProviderStateMixin {
  late AnimationController _tapController;

  @override
  void initState() {
    super.initState();
    _tapController = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _tapController.dispose();
    super.dispose();
  }

  void _onTap() {
    HapticFeedback.lightImpact();
    _tapController.forward().then((_) {
      _tapController.reverse();
      widget.onTap();
    });
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final setting = widget.setting;

    return AnimatedBuilder(
      animation: _tapController,
      builder: (context, child) {
        final scale = 1.0 - (_tapController.value * 0.02);
        return Transform.scale(scale: scale, child: child);
      },
      child: Card(
        margin: const EdgeInsets.only(bottom: AppSpacing.xs),
        color: cs.surfaceContainerLow,
        child: InkWell(
          onTap: _onTap,
          borderRadius: BorderRadius.circular(AppRadius.md),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.sm,
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: cs.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                  child: Icon(
                    setting.icon,
                    size: 18,
                    color: cs.primary,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Breadcrumb path
                      Row(
                        children: [
                          Text(
                            setting.categoryTitle,
                            style: context.textStyles.labelSmall?.withColor(
                              cs.onSurfaceVariant,
                            ),
                          ),
                          Icon(
                            Icons.chevron_right,
                            size: 12,
                            color: cs.onSurfaceVariant.withOpacity(0.5),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      // Setting label with highlight
                      _buildHighlightedText(
                        setting.label,
                        widget.highlightQuery,
                        context.textStyles.bodyMedium?.semiBold,
                        cs.primary,
                      ),
                      if (setting.description != null) ...[
                        const SizedBox(height: 1),
                        _buildHighlightedText(
                          setting.description!,
                          widget.highlightQuery,
                          context.textStyles.bodySmall?.withColor(
                            cs.onSurfaceVariant,
                          ),
                          cs.primary,
                        ),
                      ],
                    ],
                  ),
                ),
                _buildTypeIndicator(setting.type, cs),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTypeIndicator(SettingType type, ColorScheme cs) {
    IconData icon;
    Color color;
    
    switch (type) {
      case SettingType.toggle:
        icon = Icons.toggle_on_outlined;
        color = cs.primary;
        break;
      case SettingType.action:
        icon = Icons.arrow_forward_ios;
        color = cs.onSurfaceVariant;
        break;
      case SettingType.picker:
        icon = Icons.unfold_more;
        color = cs.secondary;
        break;
      case SettingType.info:
        icon = Icons.info_outline;
        color = cs.onSurfaceVariant;
        break;
    }

    return Icon(icon, size: 16, color: color.withOpacity(0.6));
  }

  Widget _buildHighlightedText(
    String text,
    String query,
    TextStyle? baseStyle,
    Color highlightColor,
  ) {
    if (query.isEmpty) {
      return Text(text, style: baseStyle, maxLines: 1, overflow: TextOverflow.ellipsis);
    }

    final lowerText = text.toLowerCase();
    final lowerQuery = query.toLowerCase();
    final index = lowerText.indexOf(lowerQuery);

    if (index == -1) {
      return Text(text, style: baseStyle, maxLines: 1, overflow: TextOverflow.ellipsis);
    }

    return RichText(
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      text: TextSpan(
        style: baseStyle,
        children: [
          TextSpan(text: text.substring(0, index)),
          TextSpan(
            text: text.substring(index, index + query.length),
            style: baseStyle?.copyWith(
              backgroundColor: highlightColor.withOpacity(0.2),
              fontWeight: FontWeight.bold,
            ),
          ),
          TextSpan(text: text.substring(index + query.length)),
        ],
      ),
    );
  }
}
